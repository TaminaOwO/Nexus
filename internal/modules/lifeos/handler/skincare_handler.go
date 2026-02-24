package handler

import (
	"net/http"
	"time"

	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"
	"nexus/internal/modules/lifeos/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// loadScheduleRules 從 DB 載入排程規則，無資料則回傳預設
func loadScheduleRules() []model.SkincareScheduleRule {
	var rules []model.SkincareScheduleRule
	database.DB.Find(&rules)
	if len(rules) == 0 {
		return service.GetDefaultScheduleRules()
	}
	return rules
}

// GetSkincareCycle - GET /api/lifeos/skincare/cycle
func GetSkincareCycle(c *gin.Context) {
	var setting model.SkincareCycleSetting
	result := database.DB.First(&setting)
	if result.Error != nil {
		c.JSON(http.StatusOK, gin.H{"configured": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{"configured": true, "cycle": setting})
}

// UpdateSkincareCycle - PUT /api/lifeos/skincare/cycle
func UpdateSkincareCycle(c *gin.Context) {
	var req model.UpdateCycleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if _, err := time.Parse("2006-01-02", req.CycleStartDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, expected YYYY-MM-DD"})
		return
	}

	cycleLength := req.CycleLength
	if cycleLength <= 0 {
		cycleLength = 28
	}

	var setting model.SkincareCycleSetting
	result := database.DB.First(&setting)

	if result.Error != nil {
		setting = model.SkincareCycleSetting{
			ID:             uuid.New().String(),
			CycleStartDate: req.CycleStartDate,
			CycleLength:    cycleLength,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		database.DB.Create(&setting)
	} else {
		setting.CycleStartDate = req.CycleStartDate
		setting.CycleLength = cycleLength
		setting.UpdatedAt = time.Now()
		database.DB.Save(&setting)
	}

	c.JSON(http.StatusOK, setting)
}

// GetSkincareToday - GET /api/lifeos/skincare/today
func GetSkincareToday(c *gin.Context) {
	var setting model.SkincareCycleSetting
	result := database.DB.First(&setting)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle not configured. Please set cycle start date first."})
		return
	}

	loc, _ := time.LoadLocation("Asia/Taipei")
	today := time.Now().In(loc)
	rules := loadScheduleRules()
	cycleDay := service.CalculateCycleDay(setting.CycleStartDate, setting.CycleLength, today)
	routine := service.GenerateDailySkincare(cycleDay, setting.CycleLength, today, rules)

	c.JSON(http.StatusOK, routine)
}

// GetSkincareWeek - GET /api/lifeos/skincare/week
func GetSkincareWeek(c *gin.Context) {
	var setting model.SkincareCycleSetting
	result := database.DB.First(&setting)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle not configured. Please set cycle start date first."})
		return
	}

	loc, _ := time.LoadLocation("Asia/Taipei")
	today := time.Now().In(loc)
	rules := loadScheduleRules()
	routines := service.GenerateWeeklySkincare(setting.CycleStartDate, setting.CycleLength, today, rules)

	c.JSON(http.StatusOK, routines)
}

// TestSkincareNotify - POST /api/lifeos/skincare/test-notify
func TestSkincareNotify(c *gin.Context) {
	loc, _ := time.LoadLocation("Asia/Taipei")
	now := time.Now().In(loc)

	routine := service.GetSkincareRoutineForTest(now)
	if routine == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle not configured"})
		return
	}

	err := service.SendSkincareTestNotification(now, routine)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Test notifications sent"})
}

// GetSkincareSchedule - GET /api/lifeos/skincare/schedule
func GetSkincareSchedule(c *gin.Context) {
	rules := loadScheduleRules()
	c.JSON(http.StatusOK, rules)
}

// UpdateSkincareSchedule - PUT /api/lifeos/skincare/schedule
func UpdateSkincareSchedule(c *gin.Context) {
	var req model.BatchUpdateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	defaults := service.GetDefaultScheduleRules()

	for _, rule := range req.Rules {
		var existing model.SkincareScheduleRule
		result := database.DB.Where("product_key = ? AND phase = ?", rule.ProductKey, rule.Phase).First(&existing)

		if result.Error != nil {
			// 新建 — 從預設取 max_per_week 和 label
			var maxPerWeek int
			var label string
			for _, d := range defaults {
				if d.ProductKey == rule.ProductKey && d.Phase == rule.Phase {
					maxPerWeek = d.MaxPerWeek
					label = d.Label
					break
				}
			}
			newRule := model.SkincareScheduleRule{
				ProductKey: rule.ProductKey,
				Phase:      rule.Phase,
				Weekdays:   rule.Weekdays,
				MaxPerWeek: maxPerWeek,
				Label:      label,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			}
			database.DB.Create(&newRule)
		} else {
			existing.Weekdays = rule.Weekdays
			existing.UpdatedAt = time.Now()
			database.DB.Save(&existing)
		}
	}

	rules := loadScheduleRules()
	c.JSON(http.StatusOK, rules)
}
