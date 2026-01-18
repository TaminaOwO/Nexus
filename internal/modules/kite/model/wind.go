package model

import (
	"time"
)

// WindRecord represents a daily wind check entry
type WindRecord struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Date      string    `gorm:"uniqueIndex;type:date" json:"date"` // YYYY-MM-DD
	Wind      string    `json:"wind"`                              // STRONG, TURBULENT, GUSTY, CALM
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
