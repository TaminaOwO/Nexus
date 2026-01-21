package handler

import (
	"net/http"
	"nexus/internal/database"
	"nexus/internal/modules/kite/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetWatchlist returns all watchlist entries
func GetWatchlist(c *gin.Context) {
	var entries []model.WatchlistEntry

	status := c.Query("status")
	query := database.DB.Order("created_at desc")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Find(&entries)
	c.JSON(http.StatusOK, entries)
}

// GetWatchlistEntry returns a single watchlist entry
func GetWatchlistEntry(c *gin.Context) {
	id := c.Param("id")

	var entry model.WatchlistEntry
	result := database.DB.First(&entry, "id = ?", id)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Watchlist entry not found"})
		return
	}

	c.JSON(http.StatusOK, entry)
}

// CreateWatchlistEntry creates a new watchlist entry
func CreateWatchlistEntry(c *gin.Context) {
	var req model.CreateWatchlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry := model.WatchlistEntry{
		ID:          uuid.New().String(),
		Symbol:      req.Symbol,
		CompanyName: req.CompanyName,
		TargetPrice: req.TargetPrice,
		Strategy:    req.Strategy,
		SubStrategy: req.SubStrategy,
		Notes:       req.Notes,
		Status:      "WATCHING",
	}

	result := database.DB.Create(&entry)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

// UpdateWatchlistEntry updates an existing watchlist entry
func UpdateWatchlistEntry(c *gin.Context) {
	id := c.Param("id")

	var entry model.WatchlistEntry
	if result := database.DB.First(&entry, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Watchlist entry not found"})
		return
	}

	var req model.UpdateWatchlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if req.TargetPrice > 0 {
		entry.TargetPrice = req.TargetPrice
	}
	if req.Notes != "" {
		entry.Notes = req.Notes
	}
	if req.Status != "" {
		entry.Status = req.Status
	}

	database.DB.Save(&entry)
	c.JSON(http.StatusOK, entry)
}

// DeleteWatchlistEntry deletes a watchlist entry
func DeleteWatchlistEntry(c *gin.Context) {
	id := c.Param("id")

	result := database.DB.Delete(&model.WatchlistEntry{}, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Watchlist entry not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Watchlist entry deleted"})
}

// ConvertToTrade converts a watchlist entry to an active trade
func ConvertToTrade(c *gin.Context) {
	id := c.Param("id")

	var entry model.WatchlistEntry
	if result := database.DB.First(&entry, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Watchlist entry not found"})
		return
	}

	// Update status to ENTERED
	entry.Status = "ENTERED"
	database.DB.Save(&entry)

	c.JSON(http.StatusOK, gin.H{
		"message": "Marked as entered. Create trade entry separately.",
		"entry":   entry,
	})
}
