package handler

import (
	"net/http"

	"nexus/internal/modules/kite/model"
	"nexus/internal/modules/kite/service"

	"github.com/gin-gonic/gin"
)

// CreateTrade handles POST /api/kite/journal
func CreateTrade(c *gin.Context) {
	var req model.CreateTradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate required fields
	if req.Symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Symbol is required"})
		return
	}
	if req.EntryPrice <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Entry price must be positive"})
		return
	}
	if req.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Quantity must be positive"})
		return
	}
	if req.PlannedBatches <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Planned batches must be positive"})
		return
	}

	entry, err := service.CreateTrade(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

// GetTrades handles GET /api/kite/journal
func GetTrades(c *gin.Context) {
	symbol := c.Query("symbol")

	var entries []model.TradeEntry
	if symbol != "" {
		entries = service.GetTradesBySymbol(symbol)
	} else {
		entries = service.GetAllTrades()
	}

	c.JSON(http.StatusOK, entries)
}

// DeleteTrade handles DELETE /api/kite/trade/:id
func DeleteTrade(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Trade ID is required"})
		return
	}

	err := service.DeleteTrade(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Trade not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Trade deleted successfully"})
}
