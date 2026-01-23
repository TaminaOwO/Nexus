package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NotificationLog - Discord 通知發送記錄（防重複）
type NotificationLog struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	TradeID   string    `gorm:"index" json:"trade_id"`           // 交易 ID（若為 Watchlist 則為空）
	Symbol    string    `gorm:"index" json:"symbol"`             // 股票代碼（用於 Watchlist 通知）
	AlertType string    `json:"alert_type"`                      // STOP_LOSS, TAKE_PROFIT, STRATEGY_RULE, FORCE_SELL, WATCHLIST_TARGET, WATCHLIST_STRATEGY
	SentAt    time.Time `json:"sent_at"`
}

// BeforeCreate - GORM Hook：自動生成 UUID
func (n *NotificationLog) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	if n.SentAt.IsZero() {
		n.SentAt = time.Now()
	}
	return nil
}
