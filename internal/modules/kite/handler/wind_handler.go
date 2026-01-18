package handler

import (
	"net/http"
	"nexus/internal/database"
	"nexus/internal/modules/kite/model"
	"time"

	"github.com/gin-gonic/gin"
)

// GetWindHistory returns all wind records
func GetWindHistory(c *gin.Context) {
	var records []model.WindRecord
	// limit to last 30 days
	database.DB.Order("date desc").Limit(30).Find(&records)
	c.JSON(http.StatusOK, records)
}

// GetLatestWind returns today's wind record
func GetLatestWind(c *gin.Context) {
	date := c.Query("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	var record model.WindRecord
	result := database.DB.Where("date = ?", date).First(&record)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No wind record found for date"})
		return
	}

	c.JSON(http.StatusOK, record)
}

// SaveWind creates or updates a wind record for a specific date
type SaveWindRequest struct {
	Date string `json:"date"` // Optional, defaults to today
	Wind string `json:"wind" binding:"required"`
}

func SaveWind(c *gin.Context) {
	var req SaveWindRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Date == "" {
		req.Date = time.Now().Format("2006-01-02")
	}

	var record model.WindRecord
	// Check if exists
	result := database.DB.Where("date = ?", req.Date).First(&record)

	if result.Error == nil {
		// Update
		record.Wind = req.Wind
		database.DB.Save(&record)
	} else {
		// Create
		record = model.WindRecord{
			Date: req.Date,
			Wind: req.Wind,
		}
		database.DB.Create(&record)
	}

	c.JSON(http.StatusOK, record)
}
