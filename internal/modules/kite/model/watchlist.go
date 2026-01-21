package model

import (
	"time"
)

// WatchlistEntry represents a stock to watch before buying
type WatchlistEntry struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Symbol      string    `json:"symbol"`
	CompanyName string    `json:"company_name"`
	TargetPrice float64   `json:"target_price"`
	Strategy    string    `json:"strategy"`     // OFFICE | BOSS
	SubStrategy string    `json:"sub_strategy"` // STRONG_WEEKLY, WEEKLY_TREND, WEEKLY_PULLBACK, CHEAP_ACQUISITION
	Notes       string    `json:"notes"`
	Status      string    `json:"status"` // WATCHING | READY | ENTERED
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateWatchlistRequest for API
type CreateWatchlistRequest struct {
	Symbol      string  `json:"symbol" binding:"required"`
	CompanyName string  `json:"company_name"`
	TargetPrice float64 `json:"target_price"`
	Strategy    string  `json:"strategy" binding:"required"`
	SubStrategy string  `json:"sub_strategy" binding:"required"`
	Notes       string  `json:"notes"`
}

// UpdateWatchlistRequest for API
type UpdateWatchlistRequest struct {
	TargetPrice float64 `json:"target_price"`
	Notes       string  `json:"notes"`
	Status      string  `json:"status"`
}
