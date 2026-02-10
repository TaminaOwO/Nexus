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

	// 驗證日期格式
	if _, err := time.Parse("2006-01-02", req.CycleStartDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, expected YYYY-MM-DD"})
		return
	}

	cycleLength := req.CycleLength
	if cycleLength <= 0 {
		cycleLength = 28
	}

	// Upsert：查詢現有或建立新的
	var setting model.SkincareCycleSetting
	result := database.DB.First(&setting)

	if result.Error != nil {
		// 新建
		setting = model.SkincareCycleSetting{
			ID:             uuid.New().String(),
			CycleStartDate: req.CycleStartDate,
			CycleLength:    cycleLength,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		database.DB.Create(&setting)
	} else {
		// 更新
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
	cycleDay := service.CalculateCycleDay(setting.CycleStartDate, setting.CycleLength, today)
	routine := service.GenerateDailySkincare(cycleDay, today)

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
	routines := service.GenerateWeeklySkincare(setting.CycleStartDate, setting.CycleLength, today)

	c.JSON(http.StatusOK, routines)
}
