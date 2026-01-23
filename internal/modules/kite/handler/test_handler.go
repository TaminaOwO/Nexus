package handler

import (
	"net/http"
	"nexus/internal/modules/kite/service"

	"github.com/gin-gonic/gin"
)

// TestWebhook sends a test notification to Discord
func TestWebhook(c *gin.Context) {
	err := service.SendTestWebhook()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Test webhook sent successfully! Check your Discord channel.",
	})
}
