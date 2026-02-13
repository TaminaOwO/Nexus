package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"nexus/internal/auth"
	"nexus/internal/database"
	kiteHandler "nexus/internal/modules/kite/handler"
	"nexus/internal/modules/kite/model"
	kiteService "nexus/internal/modules/kite/service"
	lifeosHandler "nexus/internal/modules/lifeos/handler"
	lifeosModel "nexus/internal/modules/lifeos/model"
	lifeosService "nexus/internal/modules/lifeos/service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	// Initialize Database
	database.Init()

	// Auto Migrate
	database.DB.AutoMigrate(
		&model.WindRecord{},
		&model.TradeEntry{},
		&model.CycleSetting{},
		&model.WatchlistEntry{},
		&model.NotificationLog{},
		&lifeosModel.Habit{},
		&lifeosModel.HabitLog{},
		&lifeosModel.Task{},
		&lifeosModel.ReminderSetting{},
		&lifeosModel.LifeOSNotificationLog{},
		&lifeosModel.SkincareCycleSetting{},
		&lifeosModel.SkincareScheduleRule{},
	)

	// Backfill: 確保舊資料有 flow_type 預設值
	database.DB.Exec("UPDATE tasks SET flow_type = 'NONE' WHERE flow_type = '' OR flow_type IS NULL")

	// Initialize Auth
	auth.Init()

	// Start background alert scanner (Portfolio + Watchlist → Discord)
	kiteService.StartAlertScanner(3 * time.Minute)

	// Start LifeOS reminder scanner (Habits + Tasks → Discord)
	lifeosService.StartReminderScanner(30 * time.Minute)

	r := gin.Default()

	// CORS middleware for frontend (only needed in dev mode)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Public routes (no auth required)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/api/auth/login", auth.LoginHandler)
	r.GET("/api/auth/callback", auth.CallbackHandler)
	r.GET("/api/auth/me", auth.MeHandler)
	r.POST("/api/auth/logout", auth.LogoutHandler)

	// Protected API routes
	api := r.Group("/api")
	api.Use(auth.AuthMiddleware())

	// LifeOS Module Routes
	lifeos := api.Group("/lifeos")
	{
		lifeos.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "LifeOS Module Online"})
		})

		// Habit Routes
		lifeos.GET("/habits", lifeosHandler.GetHabits)
		lifeos.POST("/habits", lifeosHandler.CreateHabit)
		lifeos.PUT("/habits/:id", lifeosHandler.UpdateHabit)
		lifeos.DELETE("/habits/:id", lifeosHandler.DeleteHabit)
		lifeos.GET("/habits/:id/logs", lifeosHandler.GetHabitLogs)
		lifeos.POST("/habits/:id/check", lifeosHandler.CheckHabit)

		// Task Routes
		lifeos.GET("/tasks", lifeosHandler.GetTasks)
		lifeos.POST("/tasks", lifeosHandler.CreateTask)
		lifeos.PUT("/tasks/:id", lifeosHandler.UpdateTask)
		lifeos.DELETE("/tasks/:id", lifeosHandler.DeleteTask)
		lifeos.PATCH("/tasks/:id/move", lifeosHandler.MoveTask)

		// Reminder Routes
		lifeos.GET("/reminders", lifeosHandler.GetReminderSettings)
		lifeos.PUT("/reminders/:type", lifeosHandler.UpdateReminderSetting)
		lifeos.POST("/reminders/test", lifeosHandler.TestReminderWebhook)

		// Skincare Routes
		lifeos.GET("/skincare/cycle", lifeosHandler.GetSkincareCycle)
		lifeos.PUT("/skincare/cycle", lifeosHandler.UpdateSkincareCycle)
		lifeos.GET("/skincare/today", lifeosHandler.GetSkincareToday)
		lifeos.GET("/skincare/week", lifeosHandler.GetSkincareWeek)
		lifeos.GET("/skincare/schedule", lifeosHandler.GetSkincareSchedule)
		lifeos.PUT("/skincare/schedule", lifeosHandler.UpdateSkincareSchedule)
		lifeos.POST("/skincare/test-notify", lifeosHandler.TestSkincareNotify)
	}

	// Kite Stock Module Routes
	kite := api.Group("/kite")
	{
		kite.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Kite Stock Module Online"})
		})
		kite.GET("/quote", kiteHandler.GetQuote)
		kite.GET("/quotes", kiteHandler.GetMultipleQuotes)
		kite.POST("/journal", kiteHandler.CreateTrade)
		kite.GET("/journal", kiteHandler.GetTrades)
		kite.GET("/portfolio", kiteHandler.GetPortfolio)
		kite.POST("/trade/:id/settle", kiteHandler.SettleTrade)
		kite.DELETE("/trade/:id", kiteHandler.DeleteTrade)
		kite.GET("/history", kiteHandler.GetHistory)
		kite.POST("/import", kiteHandler.ImportTrade)

		// Wind Routes
		kite.GET("/wind/latest", kiteHandler.GetLatestWind)
		kite.GET("/wind/history", kiteHandler.GetWindHistory)
		kite.POST("/wind", kiteHandler.SaveWind)

		// Cycle Setting Routes
		kite.GET("/cycle", kiteHandler.GetCycleSetting)
		kite.POST("/cycle", kiteHandler.SaveCycleSetting)
		kite.DELETE("/cycle", kiteHandler.DeleteCycleSetting)

		// Watchlist Routes
		kite.GET("/watchlist", kiteHandler.GetWatchlist)
		kite.GET("/watchlist/:id", kiteHandler.GetWatchlistEntry)
		kite.POST("/watchlist", kiteHandler.CreateWatchlistEntry)
		kite.PUT("/watchlist/:id", kiteHandler.UpdateWatchlistEntry)
		kite.DELETE("/watchlist/:id", kiteHandler.DeleteWatchlistEntry)
		kite.POST("/watchlist/:id/convert", kiteHandler.ConvertToTrade)
		kite.GET("/watchlist/alerts", kiteHandler.GetWatchlistAlerts)

		// Webhook Test Route
		kite.POST("/test-webhook", kiteHandler.TestWebhook)

		// Chart Routes
		kite.GET("/chart", kiteHandler.GetChartData)
	}

	// Choice-Fit Module Routes
	choicefit := api.Group("/choicefit")
	{
		choicefit.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Choice-Fit Module Online"})
		})
	}

	// Production: Serve static files from ./dist (React build)
	// Check if dist directory exists (production mode)
	if _, err := os.Stat("./dist"); err == nil {
		r.Static("/assets", "./dist/assets")
		r.StaticFile("/favicon.ico", "./dist/favicon.ico")
		r.StaticFile("/", "./dist/index.html")

		// SPA Fallback: Serve index.html for all non-API routes
		r.NoRoute(func(c *gin.Context) {
			// If not an API route, serve the SPA
			if !strings.HasPrefix(c.Request.URL.Path, "/api") {
				c.File("./dist/index.html")
				return
			}
			// Otherwise, return 404 for unknown API routes
			c.JSON(http.StatusNotFound, gin.H{"error": "API route not found"})
		})
	}

	// Get PORT from environment (Railway assigns dynamically)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Fallback for local development
	}

	log.Println("🚀 Nexus Server starting on port:", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server start error:", err)
	}
}
