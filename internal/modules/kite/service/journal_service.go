package service

import (
	"time"

	"nexus/internal/database"
	"nexus/internal/modules/kite/model"

	"github.com/google/uuid"
)

// CreateTrade creates a new trade entry in the database
func CreateTrade(req model.CreateTradeRequest) (*model.TradeEntry, error) {
	entry := model.TradeEntry{
		ID:                    uuid.New().String(),
		Symbol:                req.Symbol,
		CompanyName:           req.CompanyName,
		EntryPrice:            req.EntryPrice,
		Quantity:              req.Quantity,
		PlannedBatches:        req.PlannedBatches,
		CurrentBatch:          req.CurrentBatch,
		Strategy:              req.Strategy,
		SubStrategy:           req.SubStrategy,
		Cycle:                 req.Cycle,
		StopLossPrice:         req.StopLossPrice,
		TakeProfitPrice:       req.TakeProfitPrice,
		Status:                "OPEN",
		CreatedAt:             time.Now(),
		SnapshotMA20Deviation: req.Snapshot.MA20Deviation,
		SnapshotMA60Deviation: req.Snapshot.MA60Deviation,
		SnapshotMacdDays:      req.Snapshot.MacdDays,
		SnapshotWeeklyTrend:   req.Snapshot.WeeklyTrend,
		SnapshotCurrentPrice:  req.Snapshot.CurrentPrice,
	}

	// Default current batch to 1 if not specified
	if entry.CurrentBatch == 0 {
		entry.CurrentBatch = 1
	}

	result := database.DB.Create(&entry)
	if result.Error != nil {
		return nil, result.Error
	}

	return &entry, nil
}

// GetAllTrades returns all trade entries ordered by created_at descending
func GetAllTrades() []model.TradeEntry {
	var entries []model.TradeEntry
	database.DB.Order("created_at desc").Find(&entries)
	return entries
}

// GetTradesBySymbol returns trades for a specific symbol
func GetTradesBySymbol(symbol string) []model.TradeEntry {
	var entries []model.TradeEntry
	database.DB.Where("symbol = ?", symbol).Order("created_at desc").Find(&entries)
	return entries
}

// GetOpenTrades returns all trades with status "OPEN"
func GetOpenTrades() []model.TradeEntry {
	var entries []model.TradeEntry
	database.DB.Where("status = ?", "OPEN").Order("created_at desc").Find(&entries)
	return entries
}

// SettleTrade closes a trade with exit price and calculates final P&L
func SettleTrade(id string, req model.SettleTradeRequest) (*model.TradeEntry, error) {
	var entry model.TradeEntry
	result := database.DB.First(&entry, "id = ?", id)
	if result.Error != nil {
		return nil, result.Error
	}

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

	database.DB.Save(&entry)

	return &entry, nil
}

// GetClosedTrades returns all trades with status "CLOSED", sorted by ClosedAt descending
func GetClosedTrades() []model.TradeEntry {
	var entries []model.TradeEntry
	database.DB.Where("status = ?", "CLOSED").Order("closed_at desc").Find(&entries)
	return entries
}

// ImportTrade creates a pre-closed trade record for historical data
func ImportTrade(req model.ImportTradeRequest) (*model.TradeEntry, error) {
	// Parse dates
	entryDate, err := time.Parse("2006-01-02", req.EntryDate)
	if err != nil {
		entryDate = time.Now()
	}

	var exitDate *time.Time
	if req.ExitDate != "" {
		parsed, err := time.Parse("2006-01-02", req.ExitDate)
		if err == nil {
			exitDate = &parsed
		}
	}

	// Calculate P&L (only if it's a closed trade)
	status := "OPEN"
	finalPL := 0.0
	finalPLPct := 0.0

	if exitDate != nil && req.ExitPrice > 0 {
		status = "CLOSED"
		costBasis := req.EntryPrice * float64(req.Quantity)
		exitValue := req.ExitPrice * float64(req.Quantity)
		finalPL = exitValue - costBasis
		if costBasis > 0 {
			finalPLPct = (finalPL / costBasis) * 100
		}
	}

	entry := model.TradeEntry{
		ID:             uuid.New().String(),
		Symbol:         req.Symbol,
		CompanyName:    req.CompanyName,
		EntryPrice:     req.EntryPrice,
		Quantity:       req.Quantity,
		Strategy:       req.Strategy,
		SubStrategy:    req.SubStrategy,
		Status:         status,
		ExitPrice:      req.ExitPrice,
		ExitNotes:      req.Notes,
		FinalPL:        finalPL,
		FinalPLPercent: finalPLPct,
		CreatedAt:      entryDate,
		ClosedAt:       exitDate,
	}

	result := database.DB.Create(&entry)
	if result.Error != nil {
		return nil, result.Error
	}

	return &entry, nil
}
