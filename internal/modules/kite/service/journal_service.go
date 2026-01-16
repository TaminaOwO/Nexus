package service

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

// TradeEntry represents a single trade log entry
type TradeEntry struct {
	ID              string           `json:"id"`
	Symbol          string           `json:"symbol"`
	CompanyName     string           `json:"company_name"`
	EntryPrice      float64          `json:"entry_price"`       // Manual input - actual execution price
	Quantity        int64            `json:"quantity"`          // Manual input - shares (股數)
	PlannedBatches  int              `json:"planned_batches"`   // Manual input - total planned batches
	CurrentBatch    int              `json:"current_batch"`     // Which batch is this (1, 2, 3...)
	Strategy        string           `json:"strategy"`          // BOSS or OFFICE
	SubStrategy     string           `json:"sub_strategy"`      // e.g., "Weekly Pullback", "Strong Weekly"
	Cycle           string           `json:"cycle"`             // EASY_RISE, BOUNDARY, EASY_FALL
	StopLossPrice   float64          `json:"stop_loss_price"`   // Exit plan - stop loss
	TakeProfitPrice float64          `json:"take_profit_price"` // Exit plan - take profit (0 = not set)
	Status          string           `json:"status"`            // OPEN or CLOSED
	Snapshot        StrategySnapshot `json:"strategy_snapshot"`
	CreatedAt       time.Time        `json:"created_at"`
	// Settlement fields
	ExitPrice      float64    `json:"exit_price,omitempty"`
	ExitNotes      string     `json:"exit_notes,omitempty"`
	FinalPL        float64    `json:"final_pl,omitempty"`
	FinalPLPercent float64    `json:"final_pl_percent,omitempty"`
	ClosedAt       *time.Time `json:"closed_at,omitempty"`
}

// StrategySnapshot captures technical indicators at trade time
type StrategySnapshot struct {
	MA20Deviation float64 `json:"ma20_deviation"`
	MA60Deviation float64 `json:"ma60_deviation"`
	MacdDays      int     `json:"macd_days"`
	WeeklyTrend   string  `json:"weekly_trend"`
	CurrentPrice  float64 `json:"current_price"` // System price at time of logging
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

// JournalStore is an in-memory store for trade entries
type JournalStore struct {
	mu      sync.RWMutex
	entries []TradeEntry
}

var journalStore = &JournalStore{
	entries: make([]TradeEntry, 0),
}

// CreateTrade creates a new trade entry
func CreateTrade(req CreateTradeRequest) (*TradeEntry, error) {
	entry := TradeEntry{
		ID:              uuid.New().String(),
		Symbol:          req.Symbol,
		CompanyName:     req.CompanyName,
		EntryPrice:      req.EntryPrice,
		Quantity:        req.Quantity,
		PlannedBatches:  req.PlannedBatches,
		CurrentBatch:    req.CurrentBatch,
		Strategy:        req.Strategy,
		SubStrategy:     req.SubStrategy,
		Cycle:           req.Cycle,
		StopLossPrice:   req.StopLossPrice,
		TakeProfitPrice: req.TakeProfitPrice,
		Status:          "OPEN",
		Snapshot:        req.Snapshot,
		CreatedAt:       time.Now(),
	}

	// Default current batch to 1 if not specified
	if entry.CurrentBatch == 0 {
		entry.CurrentBatch = 1
	}

	journalStore.mu.Lock()
	journalStore.entries = append(journalStore.entries, entry)
	journalStore.mu.Unlock()

	return &entry, nil
}

// GetAllTrades returns all trade entries
func GetAllTrades() []TradeEntry {
	journalStore.mu.RLock()
	defer journalStore.mu.RUnlock()

	// Return a copy to avoid race conditions
	result := make([]TradeEntry, len(journalStore.entries))
	copy(result, journalStore.entries)

	// Reverse order (newest first)
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	return result
}

// GetTradesBySymbol returns trades for a specific symbol
func GetTradesBySymbol(symbol string) []TradeEntry {
	journalStore.mu.RLock()
	defer journalStore.mu.RUnlock()

	var result []TradeEntry
	for _, entry := range journalStore.entries {
		if entry.Symbol == symbol {
			result = append(result, entry)
		}
	}

	return result
}

// GetOpenTrades returns all trades with status "OPEN"
func GetOpenTrades() []TradeEntry {
	journalStore.mu.RLock()
	defer journalStore.mu.RUnlock()

	var result []TradeEntry
	for _, entry := range journalStore.entries {
		if entry.Status == "OPEN" {
			result = append(result, entry)
		}
	}

	return result
}

// SettleTradeRequest represents the API request to settle/close a trade
type SettleTradeRequest struct {
	ExitPrice float64 `json:"exit_price"`
	ExitNotes string  `json:"exit_notes"`
}

// SettleTrade closes a trade with exit price and calculates final P&L
func SettleTrade(id string, req SettleTradeRequest) (*TradeEntry, error) {
	journalStore.mu.Lock()
	defer journalStore.mu.Unlock()

	for i := range journalStore.entries {
		if journalStore.entries[i].ID == id {
			entry := &journalStore.entries[i]

			// Calculate final P&L
			costBasis := entry.EntryPrice * float64(entry.Quantity)
			exitValue := req.ExitPrice * float64(entry.Quantity)
			finalPL := exitValue - costBasis
			finalPLPct := 0.0
			if costBasis > 0 {
				finalPLPct = (finalPL / costBasis) * 100
			}

			now := time.Now()
			entry.Status = "CLOSED"
			entry.ExitPrice = req.ExitPrice
			entry.ExitNotes = req.ExitNotes
			entry.FinalPL = finalPL
			entry.FinalPLPercent = finalPLPct
			entry.ClosedAt = &now

			return entry, nil
		}
	}

	return nil, nil
}

// GetClosedTrades returns all trades with status "CLOSED", sorted by ClosedAt descending
func GetClosedTrades() []TradeEntry {
	journalStore.mu.RLock()
	defer journalStore.mu.RUnlock()

	var result []TradeEntry
	for _, entry := range journalStore.entries {
		if entry.Status == "CLOSED" {
			result = append(result, entry)
		}
	}

	// Sort by ClosedAt descending (newest first)
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].ClosedAt != nil && result[i].ClosedAt != nil {
				if result[j].ClosedAt.After(*result[i].ClosedAt) {
					result[i], result[j] = result[j], result[i]
				}
			}
		}
	}

	return result
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

// ImportTrade creates a pre-closed trade record for historical data
func ImportTrade(req ImportTradeRequest) (*TradeEntry, error) {
	// Parse dates
	entryDate, err := time.Parse("2006-01-02", req.EntryDate)
	if err != nil {
		entryDate = time.Now()
	}
	exitDate, err := time.Parse("2006-01-02", req.ExitDate)
	if err != nil {
		exitDate = time.Now()
	}

	// Calculate P&L
	costBasis := req.EntryPrice * float64(req.Quantity)
	exitValue := req.ExitPrice * float64(req.Quantity)
	finalPL := exitValue - costBasis
	finalPLPct := 0.0
	if costBasis > 0 {
		finalPLPct = (finalPL / costBasis) * 100
	}

	entry := TradeEntry{
		ID:             uuid.New().String(),
		Symbol:         req.Symbol,
		CompanyName:    req.CompanyName,
		EntryPrice:     req.EntryPrice,
		Quantity:       req.Quantity,
		Strategy:       req.Strategy,
		SubStrategy:    req.SubStrategy,
		Status:         "CLOSED",
		ExitPrice:      req.ExitPrice,
		ExitNotes:      req.Notes,
		FinalPL:        finalPL,
		FinalPLPercent: finalPLPct,
		CreatedAt:      entryDate,
		ClosedAt:       &exitDate,
	}

	journalStore.mu.Lock()
	journalStore.entries = append(journalStore.entries, entry)
	journalStore.mu.Unlock()

	return &entry, nil
}
