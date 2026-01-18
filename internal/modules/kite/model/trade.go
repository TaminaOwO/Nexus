package model

import (
	"time"
)

// TradeEntry represents a single trade log entry (GORM Model)
type TradeEntry struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	Symbol          string    `json:"symbol"`
	CompanyName     string    `json:"company_name"`
	EntryPrice      float64   `json:"entry_price"`
	Quantity        int64     `json:"quantity"`
	PlannedBatches  int       `json:"planned_batches"`
	CurrentBatch    int       `json:"current_batch"`
	Strategy        string    `json:"strategy"`
	SubStrategy     string    `json:"sub_strategy"`
	Cycle           string    `json:"cycle"`
	StopLossPrice   float64   `json:"stop_loss_price"`
	TakeProfitPrice float64   `json:"take_profit_price"`
	Status          string    `json:"status"` // OPEN or CLOSED
	CreatedAt       time.Time `json:"created_at"`
	// Snapshot fields (flattened for SQLite)
	SnapshotMA20Deviation float64 `json:"snapshot_ma20_deviation"`
	SnapshotMA60Deviation float64 `json:"snapshot_ma60_deviation"`
	SnapshotMacdDays      int     `json:"snapshot_macd_days"`
	SnapshotWeeklyTrend   string  `json:"snapshot_weekly_trend"`
	SnapshotCurrentPrice  float64 `json:"snapshot_current_price"`
	// Settlement fields
	ExitPrice      float64    `json:"exit_price"`
	ExitNotes      string     `json:"exit_notes"`
	FinalPL        float64    `json:"final_pl"`
	FinalPLPercent float64    `json:"final_pl_percent"`
	ClosedAt       *time.Time `json:"closed_at"`
}

// StrategySnapshot captures technical indicators at trade time (used in API requests/responses)
type StrategySnapshot struct {
	MA20Deviation float64 `json:"ma20_deviation"`
	MA60Deviation float64 `json:"ma60_deviation"`
	MacdDays      int     `json:"macd_days"`
	WeeklyTrend   string  `json:"weekly_trend"`
	CurrentPrice  float64 `json:"current_price"`
}

// CreateTradeRequest represents the API request to create a trade
type CreateTradeRequest struct {
	Symbol          string           `json:"symbol"`
	CompanyName     string           `json:"company_name"`
	EntryPrice      float64          `json:"entry_price"`
	Quantity        int64            `json:"quantity"`
	PlannedBatches  int              `json:"planned_batches"`
	CurrentBatch    int              `json:"current_batch"`
	Strategy        string           `json:"strategy"`
	SubStrategy     string           `json:"sub_strategy"`
	Cycle           string           `json:"cycle"`
	StopLossPrice   float64          `json:"stop_loss_price"`
	TakeProfitPrice float64          `json:"take_profit_price"`
	Snapshot        StrategySnapshot `json:"strategy_snapshot"`
}

// SettleTradeRequest represents the API request to settle/close a trade
type SettleTradeRequest struct {
	ExitPrice float64 `json:"exit_price"`
	ExitNotes string  `json:"exit_notes"`
}

// ImportTradeRequest represents a historical trade import
type ImportTradeRequest struct {
	Symbol      string  `json:"symbol"`
	CompanyName string  `json:"company_name"`
	Strategy    string  `json:"strategy"`
	SubStrategy string  `json:"sub_strategy"`
	EntryPrice  float64 `json:"entry_price"`
	ExitPrice   float64 `json:"exit_price"`
	Quantity    int64   `json:"quantity"`
	EntryDate   string  `json:"entry_date"` // ISO format: 2024-01-15
	ExitDate    string  `json:"exit_date"`  // ISO format: 2024-01-20
	Notes       string  `json:"notes"`
}

// ToAPIResponse converts TradeEntry to include the Snapshot struct for API responses
func (t *TradeEntry) ToAPIResponse() map[string]interface{} {
	return map[string]interface{}{
		"id":                t.ID,
		"symbol":            t.Symbol,
		"company_name":      t.CompanyName,
		"entry_price":       t.EntryPrice,
		"quantity":          t.Quantity,
		"planned_batches":   t.PlannedBatches,
		"current_batch":     t.CurrentBatch,
		"strategy":          t.Strategy,
		"sub_strategy":      t.SubStrategy,
		"cycle":             t.Cycle,
		"stop_loss_price":   t.StopLossPrice,
		"take_profit_price": t.TakeProfitPrice,
		"status":            t.Status,
		"created_at":        t.CreatedAt,
		"exit_price":        t.ExitPrice,
		"exit_notes":        t.ExitNotes,
		"final_pl":          t.FinalPL,
		"final_pl_percent":  t.FinalPLPercent,
		"closed_at":         t.ClosedAt,
		"strategy_snapshot": StrategySnapshot{
			MA20Deviation: t.SnapshotMA20Deviation,
			MA60Deviation: t.SnapshotMA60Deviation,
			MacdDays:      t.SnapshotMacdDays,
			WeeklyTrend:   t.SnapshotWeeklyTrend,
			CurrentPrice:  t.SnapshotCurrentPrice,
		},
	}
}
