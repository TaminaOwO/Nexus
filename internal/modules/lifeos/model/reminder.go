package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReminderSetting - 提醒設定
type ReminderSetting struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	Type         string    `gorm:"uniqueIndex" json:"type"` // HABIT_DAILY, TASK_DUE_SOON, TASK_OVERDUE
	Enabled      bool      `gorm:"default:true" json:"enabled"`
	ReminderTime string    `json:"reminder_time"` // HH:MM (24hr, e.g. "21:00")
	LeadDays     int       `json:"lead_days"`     // TASK_DUE_SOON: 提前幾天提醒（預設 1）
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (r *ReminderSetting) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

// LifeOSNotificationLog - LifeOS 通知發送記錄（防重複）
type LifeOSNotificationLog struct {
	ID      string    `gorm:"primaryKey" json:"id"`
	Type    string    `gorm:"index" json:"type"`     // HABIT_DAILY, TASK_DUE_SOON, TASK_OVERDUE
	RefID   string    `gorm:"index" json:"ref_id"`   // Habit ID 或 Task ID（空字串 = 彙總通知）
	RefDate string    `json:"ref_date"`              // YYYY-MM-DD（每日去重 key）
	SentAt  time.Time `json:"sent_at"`
}

func (n *LifeOSNotificationLog) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	if n.SentAt.IsZero() {
		n.SentAt = time.Now()
	}
	return nil
}
