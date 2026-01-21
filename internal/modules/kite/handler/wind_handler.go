package handler

import (
	"net/http"
	"nexus/internal/database"
	"nexus/internal/modules/kite/model"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
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

	record := model.WindRecord{
		Date: req.Date,
		Wind: req.Wind,
	}

	// Use Upsert (OnConflict) to handle both Create and Update cases gracefully
	// avoiding UNIQUE constraint errors
	result := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "date"}},
		DoUpdates: clause.AssignmentColumns([]string{"wind", "updated_at"}),
	}).Create(&record)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

// getWeekKey returns the ISO week key for a given time (e.g., "2024-W03")
func getWeekKey(t time.Time) string {
	year, week := t.ISOWeek()
	return time.Date(year, 1, 1, 0, 0, 0, 0, t.Location()).AddDate(0, 0, (week-1)*7).Format("2006") + "-W" + padWeek(week)
}

func padWeek(week int) string {
	if week < 10 {
		return "0" + string(rune('0'+week))
	}
	return string(rune('0'+week/10)) + string(rune('0'+week%10))
}

// GetCycleSetting returns the cycle setting for the current week
func GetCycleSetting(c *gin.Context) {
	weekKey := getWeekKey(time.Now())

	var setting model.CycleSetting
	result := database.DB.Where("week_key = ?", weekKey).First(&setting)

	if result.Error != nil {
		// Return empty response if no setting found
		c.JSON(http.StatusOK, model.CycleSettingResponse{
			WeekKey: weekKey,
			Cycle:   "",
		})
		return
	}

	c.JSON(http.StatusOK, model.CycleSettingResponse{
		WeekKey: setting.WeekKey,
		Cycle:   setting.Cycle,
	})
}

// SaveCycleSetting saves or updates the cycle setting for the current week
func SaveCycleSetting(c *gin.Context) {
	var req model.CycleSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	weekKey := getWeekKey(time.Now())

	setting := model.CycleSetting{
		WeekKey: weekKey,
		Cycle:   req.Cycle,
	}

	// Upsert
	result := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "week_key"}},
		DoUpdates: clause.AssignmentColumns([]string{"cycle", "updated_at"}),
	}).Create(&setting)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, model.CycleSettingResponse{
		WeekKey: setting.WeekKey,
		Cycle:   setting.Cycle,
	})
}

// DeleteCycleSetting removes the cycle setting for the current week
func DeleteCycleSetting(c *gin.Context) {
	weekKey := getWeekKey(time.Now())

	result := database.DB.Where("week_key = ?", weekKey).Delete(&model.CycleSetting{})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cycle setting cleared"})
}
