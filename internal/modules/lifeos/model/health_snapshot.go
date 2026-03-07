package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HealthSnapshot - 每日 iOS Health 快照
type HealthSnapshot struct {
	ID             string    `gorm:"primaryKey" json:"id"`
	Date           string    `gorm:"uniqueIndex" json:"date"` // YYYY-MM-DD
	SleepHours     *float64  `json:"sleep_hours"`
	HRV            *float64  `json:"hrv"`
	RestingHR      *float64  `json:"resting_hr"`
	ActiveCalories *float64  `json:"active_calories"`
	WorkoutType    *string   `json:"workout_type"`
	WorkoutMinutes *float64  `json:"workout_minutes"`
	Weight         *float64  `json:"weight"`
	MoodScore      *float64  `json:"mood_score"`  // iOS State of Mind 1-5
	MoodLabel      *string   `json:"mood_label"`  // 情緒標籤（如 happy, anxious）
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (h *HealthSnapshot) BeforeCreate(tx *gorm.DB) error {
	if h.ID == "" {
		h.ID = uuid.New().String()
	}
	return nil
}
