package handler

import (
	"net/http"

	"nexus/internal/modules/kite/service"

	"github.com/gin-gonic/gin"
)

// GetPortfolio handles GET /api/kite/portfolio
func GetPortfolio(c *gin.Context) {
	portfolio, err := service.GetPortfolio()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, portfolio)
}

// SettleTrade handles POST /api/kite/trade/:id/settle
func SettleTrade(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Trade ID is required"})
		return
	}

	var req service.SettleTradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.ExitPrice <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exit price must be positive"})
		return
	}

	trade, err := service.SettleTrade(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if trade == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Trade not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Trade settled successfully",
		"trade":   trade,
	})
}
