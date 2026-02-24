package handler

import (
	"net/http"
	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetHabits - GET /api/lifeos/habits
func GetHabits(c *gin.Context) {
	var habits []model.Habit
	database.DB.Order("created_at desc").Find(&habits)
	c.JSON(http.StatusOK, habits)
}

// CreateHabit - POST /api/lifeos/habits
func CreateHabit(c *gin.Context) {
	var req model.CreateHabitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	habit := model.Habit{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Frequency:    req.Frequency,
		TargetStreak: req.TargetStreak,
		FreezeCards:  req.FreezeCards,
		Icon:         req.Icon,
		Color:        req.Color,
		CreatedAt:    time.Now(),
	}

	result := database.DB.Create(&habit)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, habit)
}

// UpdateHabit - PUT /api/lifeos/habits/:id
func UpdateHabit(c *gin.Context) {
	id := c.Param("id")

	var habit model.Habit
	if result := database.DB.First(&habit, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
		return
	}

	var req model.UpdateHabitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新非空欄位
	if req.Name != "" {
		habit.Name = req.Name
	}
	if req.TargetStreak > 0 {
		habit.TargetStreak = req.TargetStreak
	}
	if req.FreezeCards >= 0 {
		habit.FreezeCards = req.FreezeCards
	}
	if req.Icon != "" {
		habit.Icon = req.Icon
	}
	if req.Color != "" {
		habit.Color = req.Color
	}

	database.DB.Save(&habit)
	c.JSON(http.StatusOK, habit)
}

// DeleteHabit - DELETE /api/lifeos/habits/:id
func DeleteHabit(c *gin.Context) {
	id := c.Param("id")

	result := database.DB.Delete(&model.Habit{}, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Habit deleted"})
}

// GetHabitLogs - GET /api/lifeos/habits/:id/logs
func GetHabitLogs(c *gin.Context) {
	habitID := c.Param("id")

	var logs []model.HabitLog
	database.DB.Where("habit_id = ?", habitID).Order("date desc").Find(&logs)
	c.JSON(http.StatusOK, logs)
}

// CheckHabit - POST /api/lifeos/habits/:id/check (打卡)
func CheckHabit(c *gin.Context) {
	habitID := c.Param("id")

	var req model.CheckHabitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 檢查該日期是否已打卡
	var existingLog model.HabitLog
	result := database.DB.Where("habit_id = ? AND date = ?", habitID, req.Date).First(&existingLog)

	if result.Error == nil {
		// 已存在，更新狀態
		existingLog.Status = req.Status
		database.DB.Save(&existingLog)
		c.JSON(http.StatusOK, existingLog)
		return
	}

	// 新增打卡記錄
	log := model.HabitLog{
		ID:        uuid.New().String(),
		HabitID:   habitID,
		Date:      req.Date,
		Status:    req.Status,
		CreatedAt: time.Now(),
	}

	database.DB.Create(&log)
	c.JSON(http.StatusCreated, log)
}

// FreezeHabit - POST /api/lifeos/habits/:id/freeze (使用凍結卡)
func FreezeHabit(c *gin.Context) {
	habitID := c.Param("id")

	var req struct {
		Date string `json:"date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var habit model.Habit
	if err := database.DB.First(&habit, "id = ?", habitID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
		return
	}

	if habit.FreezeCards <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No freeze cards available"})
		return
	}

	// 扣除凍結卡
	habit.FreezeCards--
	database.DB.Save(&habit)

	// 新增凍結打卡記錄
	log := model.HabitLog{
		ID:        uuid.New().String(),
		HabitID:   habitID,
		Date:      req.Date,
		Status:    "Frozen",
		CreatedAt: time.Now(),
	}

	database.DB.Create(&log)
	c.JSON(http.StatusOK, gin.H{
		"message":      "Habit frozen",
		"log":          log,
		"freeze_cards": habit.FreezeCards,
	})
}
