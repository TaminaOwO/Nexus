package handler

import (
	"net/http"
	"strconv"

	"nexus/internal/modules/lifeos/service"

	"github.com/gin-gonic/gin"
)

// SyncHealthSnapshot POST /api/lifeos/health/sync
// 接收來自 iOS 捷徑的每日健康快照
// iOS Shortcuts 可能將數字以字串形式傳入，使用寬鬆解析
func SyncHealthSnapshot(c *gin.Context) {
	var raw map[string]interface{}
	if err := c.ShouldBindJSON(&raw); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, _ := raw["date"].(string)
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date is required"})
		return
	}

	input := service.HealthSnapshotInput{
		Date:           date,
		SleepHours:     flexFloat(raw["sleep_hours"]),
		HRV:            flexFloat(raw["hrv"]),
		RestingHR:      flexFloat(raw["resting_hr"]),
		ActiveCalories: flexFloat(raw["active_calories"]),
		WorkoutMinutes: flexFloat(raw["workout_minutes"]),
		Weight:         flexFloat(raw["weight"]),
		MoodScore:      flexFloat(raw["mood_score"]),
	}

	if wt, ok := raw["workout_type"].(string); ok && wt != "" {
		input.WorkoutType = &wt
	}
	if ml, ok := raw["mood_label"].(string); ok && ml != "" {
		input.MoodLabel = &ml
	}

	snap, err := service.UpsertHealthSnapshot(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, snap)
}

// flexFloat 接受 float64 或 string，轉為 *float64；無法轉換時回傳 nil
func flexFloat(v interface{}) *float64 {
	switch val := v.(type) {
	case float64:
		return &val
	case string:
		if val == "" {
			return nil
		}
		f, err := strconv.ParseFloat(val, 64)
		if err != nil {
			return nil
		}
		return &f
	}
	return nil
}

// GetLatestHealthSnapshot GET /api/lifeos/health/latest
func GetLatestHealthSnapshot(c *gin.Context) {
	snap, err := service.GetLatestSnapshot()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if snap == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no health snapshot found"})
		return
	}
	c.JSON(http.StatusOK, snap)
}
