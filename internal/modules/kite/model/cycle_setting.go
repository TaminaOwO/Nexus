package model

import (
	"time"
)

// CycleSetting represents the last week cycle override setting
type CycleSetting struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	WeekKey   string    `gorm:"uniqueIndex" json:"week_key"` // Format: "2024-W03" (year-week)
	Cycle     string    `json:"cycle"`                       // EASY_RISE, EASY_FALL, BOUNDARY
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CycleSettingRequest for API requests
type CycleSettingRequest struct {
	Cycle string `json:"cycle"` // EASY_RISE, EASY_FALL, BOUNDARY
}

// CycleSettingResponse for API responses
type CycleSettingResponse struct {
	WeekKey string `json:"week_key"`
	Cycle   string `json:"cycle"`
}
