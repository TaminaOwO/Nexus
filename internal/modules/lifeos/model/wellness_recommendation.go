package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WellnessRecommendation - Claude AI 每日健康建議
type WellnessRecommendation struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	Date          string    `json:"date"`         // YYYY-MM-DD
	CyclePhase    string    `json:"cycle_phase"`  // menstrual/follicular/ovulation/luteal
	Sections    string    `json:"sections"`     // JSON array of {title, content}
	RawResponse string    `json:"raw_response"`
	CreatedAt     time.Time `json:"created_at"`
}

func (w *WellnessRecommendation) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" {
		w.ID = uuid.New().String()
	}
	return nil
}
