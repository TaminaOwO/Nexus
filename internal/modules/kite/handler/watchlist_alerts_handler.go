package handler

import (
	"net/http"
	"nexus/internal/modules/kite/service"

	"github.com/gin-gonic/gin"
)

// GetWatchlistAlerts checks all watchlist entries and returns alerts
func GetWatchlistAlerts(c *gin.Context) {
	alerts, err := service.CheckWatchlistAlerts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
	})
}
