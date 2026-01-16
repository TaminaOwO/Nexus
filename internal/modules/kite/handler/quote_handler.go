package handler

import (
	"net/http"
	"strings"

	"nexus/internal/modules/kite/service"

	"github.com/gin-gonic/gin"
)

// GetQuote handles the quote API endpoint
func GetQuote(c *gin.Context) {
	symbol := c.Query("symbol")
	if symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "symbol parameter is required",
		})
		return
	}

	// Normalize symbol (uppercase)
	symbol = strings.ToUpper(symbol)

	quote, err := service.GetQuote(symbol)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, quote)
}

// GetMultipleQuotes handles fetching multiple quotes
func GetMultipleQuotes(c *gin.Context) {
	symbolsParam := c.Query("symbols")
	if symbolsParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "symbols parameter is required (comma-separated)",
		})
		return
	}

	symbols := strings.Split(strings.ToUpper(symbolsParam), ",")

	quotes, err := service.GetMultipleQuotes(symbols)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, quotes)
}
