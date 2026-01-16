package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	kiteHandler "nexus/internal/modules/kite/handler"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// CORS middleware for frontend (only needed in dev mode)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// LifeOS Module Routes
	lifeos := r.Group("/api/lifeos")
	{
		lifeos.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "LifeOS Module Online"})
		})
	}

	// Kite Stock Module Routes
	kite := r.Group("/api/kite")
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
		kite.GET("/history", kiteHandler.GetHistory)
		kite.POST("/import", kiteHandler.ImportTrade)
	}

	// Choice-Fit Module Routes
	choicefit := r.Group("/api/choicefit")
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
