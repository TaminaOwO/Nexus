package handler

import (
	"net/http"

	"nexus/internal/modules/lifeos/service"

	"github.com/gin-gonic/gin"
)

// SyncHealthSnapshot POST /api/lifeos/health/sync
// 接收來自 iOS 捷徑的每日健康快照
func SyncHealthSnapshot(c *gin.Context) {
	var input service.HealthSnapshotInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date is required: " + err.Error()})
		return
	}

	if input.Date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date is required"})
		return
	}

	snap, err := service.UpsertHealthSnapshot(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, snap)
}

// GetLatestHealthSnapshot GET /api/lifeos/health/latest
func GetLatestHealthSnapshot(c *gin.Context) {
	snap, err := service.GetLatestSnapshot()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if snap == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no health snapshot found"})
		return
	}
	c.JSON(http.StatusOK, snap)
}
