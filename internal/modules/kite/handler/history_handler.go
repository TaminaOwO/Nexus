package handler

import (
	"net/http"

	"nexus/internal/modules/kite/service"

	"github.com/gin-gonic/gin"
)

// GetHistory handles GET /api/kite/history
func GetHistory(c *gin.Context) {
	trades := service.GetClosedTrades()

	// Calculate stats
	totalPL := 0.0
	wins := 0
	strategyPL := make(map[string]float64)

	for _, trade := range trades {
		totalPL += trade.FinalPL
		if trade.FinalPL > 0 {
			wins++
		}
		strategyPL[trade.Strategy] += trade.FinalPL
	}

	winRate := 0.0
	if len(trades) > 0 {
		winRate = float64(wins) / float64(len(trades)) * 100
	}

	// Find best strategy
	bestStrategy := ""
	bestPL := 0.0
	for strategy, pl := range strategyPL {
		if bestStrategy == "" || pl > bestPL {
			bestStrategy = strategy
			bestPL = pl
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"trades":        trades,
		"total_pl":      totalPL,
		"win_rate":      winRate,
		"total_trades":  len(trades),
		"wins":          wins,
		"best_strategy": bestStrategy,
		"best_pl":       bestPL,
	})
}

// ImportTrade handles POST /api/kite/import
func ImportTrade(c *gin.Context) {
	var req service.ImportTradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate required fields
	if req.Symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Symbol is required"})
		return
	}
	if req.EntryPrice <= 0 || req.ExitPrice <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Entry and exit prices must be positive"})
		return
	}
	if req.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Quantity must be positive"})
		return
	}

	trade, err := service.ImportTrade(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Trade imported successfully",
		"trade":   trade,
	})
}
