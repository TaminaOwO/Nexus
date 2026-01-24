package model

import (
	"time"
)

// Habit - 習慣定義
type Habit struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	Name         string    `json:"name"`
	Frequency    string    `json:"frequency"`      // Daily / Weekly
	TargetStreak int       `json:"target_streak"`
	Icon         string    `json:"icon"`
	Color        string    `json:"color"`
	CreatedAt    time.Time `json:"created_at"`
}

// HabitLog - 習慣記錄
type HabitLog struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	HabitID   string    `json:"habit_id"`
	Date      string    `json:"date"`     // YYYY-MM-DD
	Status    string    `json:"status"`   // Done / Skipped / Missed
	CreatedAt time.Time `json:"created_at"`
}

// CreateHabitRequest - 新增習慣 API 請求
type CreateHabitRequest struct {
	Name         string `json:"name" binding:"required"`
	Frequency    string `json:"frequency" binding:"required"`
	TargetStreak int    `json:"target_streak"`
	Icon         string `json:"icon"`
	Color        string `json:"color"`
}

// UpdateHabitRequest - 更新習慣 API 請求
type UpdateHabitRequest struct {
	Name         string `json:"name"`
	TargetStreak int    `json:"target_streak"`
	Icon         string `json:"icon"`
	Color        string `json:"color"`
}

// CheckHabitRequest - 打卡 API 請求
type CheckHabitRequest struct {
	Date   string `json:"date" binding:"required"`   // YYYY-MM-DD
	Status string `json:"status" binding:"required"` // Done / Skipped
}
