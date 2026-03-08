package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HealthWorkoutLog - 每日運動記錄（結構化，供歷史分析）
type HealthWorkoutLog struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	SnapshotDate string    `json:"snapshot_date"` // YYYY-MM-DD，對應 HealthSnapshot.Date
	WorkoutType  string    `json:"workout_type"`  // e.g. 跑步、重訓、游泳
	Minutes      float64   `json:"minutes"`
	CreatedAt    time.Time `json:"created_at"`
}

func (h *HealthWorkoutLog) BeforeCreate(tx *gorm.DB) error {
	if h.ID == "" {
		h.ID = uuid.New().String()
	}
	return nil
}
