package handler

import (
	"encoding/json"
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
		Weight:         flexFloat(raw["weight"]),
		BodyFat:        flexFloat(raw["body_fat"]),
		Steps:          flexFloat(raw["steps"]),
		Workouts:       parseWorkouts(raw["workouts"]),
	}

	snap, err := service.UpsertHealthSnapshot(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, snap)
}

// parseWorkouts 解析 workouts 欄位，接受 JSON 字串或已解析的 []interface{}
func parseWorkouts(v interface{}) []service.WorkoutEntry {
	if v == nil {
		return nil
	}
	// iOS 捷徑送來的可能是 JSON 字串
	if s, ok := v.(string); ok && s != "" {
		var entries []service.WorkoutEntry
		if err := json.Unmarshal([]byte(s), &entries); err == nil {
			return entries
		}
		return nil
	}
	// 已由 JSON decoder 解析為 []interface{}
	if arr, ok := v.([]interface{}); ok {
		var entries []service.WorkoutEntry
		for _, item := range arr {
			if m, ok := item.(map[string]interface{}); ok {
				e := service.WorkoutEntry{}
				if t, ok := m["type"].(string); ok {
					e.Type = t
				}
				if mins := flexFloat(m["minutes"]); mins != nil {
					e.Minutes = *mins
				}
				if e.Type != "" {
					entries = append(entries, e)
				}
			}
		}
		return entries
	}
	return nil
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
