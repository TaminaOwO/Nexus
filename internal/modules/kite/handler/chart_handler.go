package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

const FUGLE_BASE_URL = "https://api.fugle.tw/marketdata/v1.0/stock"

// CandleData represents a single candlestick
type CandleData struct {
	Date   string  `json:"date"`
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Close  float64 `json:"close"`
	Volume int64   `json:"volume"`
}

// ChartResponse for frontend
type ChartResponse struct {
	Symbol  string       `json:"symbol"`
	Candles []CandleData `json:"candles"`
	MA5     []float64    `json:"ma5"`
	MA20    []float64    `json:"ma20"`
	MA60    []float64    `json:"ma60"`
}

// FugleCandle from API response
type FugleCandle struct {
	Date   string  `json:"date"`
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Close  float64 `json:"close"`
	Volume int64   `json:"volume"`
}

type FugleHistoricalResponse struct {
	Symbol  string        `json:"symbol"`
	Type    string        `json:"type"`
	Candles []FugleCandle `json:"data"`
}

// GetChartData fetches historical candlestick data from Fugle API
func GetChartData(c *gin.Context) {
	symbol := c.Query("symbol")
	if symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "symbol is required"})
		return
	}

	// Get API key from environment
	apiKey := os.Getenv("FUGLE_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Fugle API key not configured"})
		return
	}

	// Calculate date range (last 3 months = ~90 days)
	to := time.Now()
	from := to.AddDate(0, -3, 0)

	// Build Fugle API URL
	url := fmt.Sprintf("%s/historical/candles/%s?from=%s&to=%s&timeframe=D",
		FUGLE_BASE_URL,
		symbol,
		from.Format("2006-01-02"),
		to.Format("2006-01-02"),
	)

	// Create HTTP request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	// Add API key header
	req.Header.Set("X-API-KEY", apiKey)

	// Make request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch from Fugle API"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		c.JSON(resp.StatusCode, gin.H{"error": fmt.Sprintf("Fugle API error: %s", string(body))})
		return
	}

	// Parse response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response"})
		return
	}

	var fugleResp FugleHistoricalResponse
	if err := json.Unmarshal(body, &fugleResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse Fugle response"})
		return
	}

	// Convert to our format and calculate MAs
	candles := make([]CandleData, len(fugleResp.Candles))
	closes := make([]float64, len(fugleResp.Candles))

	for i, fc := range fugleResp.Candles {
		candles[i] = CandleData{
			Date:   fc.Date,
			Open:   fc.Open,
			High:   fc.High,
			Low:    fc.Low,
			Close:  fc.Close,
			Volume: fc.Volume,
		}
		closes[i] = fc.Close
	}

	// Calculate Moving Averages
	ma5 := calculateMA(closes, 5)
	ma20 := calculateMA(closes, 20)
	ma60 := calculateMA(closes, 60)

	response := ChartResponse{
		Symbol:  symbol,
		Candles: candles,
		MA5:     ma5,
		MA20:    ma20,
		MA60:    ma60,
	}

	c.JSON(http.StatusOK, response)
}

// calculateMA calculates simple moving average
func calculateMA(prices []float64, period int) []float64 {
	result := make([]float64, len(prices))

	for i := range prices {
		if i < period-1 {
			result[i] = 0 // Not enough data
			continue
		}

		sum := 0.0
		for j := 0; j < period; j++ {
			sum += prices[i-j]
		}
		result[i] = sum / float64(period)
	}

	return result
}
