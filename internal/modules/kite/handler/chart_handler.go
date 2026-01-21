package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
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

// MACDData contains MACD indicator values
type MACDData struct {
	MACD      []float64 `json:"macd"`
	Signal    []float64 `json:"signal"`
	Histogram []float64 `json:"histogram"`
}

// ChartResponse for frontend
type ChartResponse struct {
	Symbol  string       `json:"symbol"`
	Candles []CandleData `json:"candles"`
	MA5     []float64    `json:"ma5"`
	MA20    []float64    `json:"ma20"`
	MA60    []float64    `json:"ma60"`
	MACD    MACDData     `json:"macd"`
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

	// Strip .TW suffix if present (Fugle API uses plain symbol like "2330")
	symbol = strings.TrimSuffix(symbol, ".TW")

	// Get API key from environment
	apiKey := os.Getenv("FUGLE_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Fugle API key not configured"})
		return
	}

	// Get timeframe parameter (default to D)
	timeframe := c.DefaultQuery("timeframe", "D")
	if timeframe != "W" && timeframe != "M" {
		timeframe = "D"
	}

	// Calculate date ranges based on timeframe
	// For W/M, we need multiple batches to get enough data for MACD (at least 35 data points)
	// Fugle API requires date range < 1 year, so we fetch in yearly batches
	to := time.Now()
	var dateRanges [][2]time.Time

	switch timeframe {
	case "W", "M":
		// Fetch 3 years of data in yearly batches for Weekly/Monthly
		for i := 0; i < 3; i++ {
			batchTo := to.AddDate(-i, 0, 0)
			batchFrom := to.AddDate(-i-1, 0, 1) // +1 day to avoid overlap
			if i == 0 {
				batchTo = to
			}
			dateRanges = append(dateRanges, [2]time.Time{batchFrom, batchTo})
		}
	default:
		// Daily: 6 months is enough
		dateRanges = append(dateRanges, [2]time.Time{to.AddDate(0, -6, 0), to})
	}

	// Fetch all batches
	var allCandles []FugleCandle
	client := &http.Client{Timeout: 15 * time.Second}

	for _, dateRange := range dateRanges {
		url := fmt.Sprintf("%s/historical/candles/%s?from=%s&to=%s&timeframe=%s",
			FUGLE_BASE_URL,
			symbol,
			dateRange[0].Format("2006-01-02"),
			dateRange[1].Format("2006-01-02"),
			timeframe,
		)

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			continue // Skip failed requests
		}
		req.Header.Set("X-API-KEY", apiKey)

		resp, err := client.Do(req)
		if err != nil {
			continue
		}

		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			continue
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			continue
		}

		var fugleResp FugleHistoricalResponse
		if err := json.Unmarshal(body, &fugleResp); err != nil {
			continue
		}

		allCandles = append(allCandles, fugleResp.Candles...)
	}

	if len(allCandles) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No data available from Fugle API"})
		return
	}

	// Remove duplicates by date and sort (newest to oldest from API)
	dateMap := make(map[string]FugleCandle)
	for _, candle := range allCandles {
		dateMap[candle.Date] = candle
	}

	// Convert map to slice and sort by date (oldest first for chart)
	uniqueCandles := make([]FugleCandle, 0, len(dateMap))
	for _, candle := range dateMap {
		uniqueCandles = append(uniqueCandles, candle)
	}

	// Sort by date ascending
	for i := 0; i < len(uniqueCandles)-1; i++ {
		for j := i + 1; j < len(uniqueCandles); j++ {
			if uniqueCandles[i].Date > uniqueCandles[j].Date {
				uniqueCandles[i], uniqueCandles[j] = uniqueCandles[j], uniqueCandles[i]
			}
		}
	}

	// Use sorted unique candles (already in ascending order)
	fugleResp := FugleHistoricalResponse{Candles: uniqueCandles}

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

	// Calculate MACD (12, 26, 9)
	macdData := calculateMACD(closes, 12, 26, 9)

	response := ChartResponse{
		Symbol:  symbol,
		Candles: candles,
		MA5:     ma5,
		MA20:    ma20,
		MA60:    ma60,
		MACD:    macdData,
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

// calculateEMA calculates exponential moving average
func calculateEMA(prices []float64, period int) []float64 {
	result := make([]float64, len(prices))
	if len(prices) < period {
		return result
	}

	multiplier := 2.0 / float64(period+1)

	// First EMA value is SMA
	sum := 0.0
	for i := 0; i < period; i++ {
		sum += prices[i]
	}
	result[period-1] = sum / float64(period)

	// Calculate EMA for remaining values
	for i := period; i < len(prices); i++ {
		result[i] = (prices[i]-result[i-1])*multiplier + result[i-1]
	}

	return result
}

// calculateMACD calculates MACD indicator (fast, slow, signal periods)
func calculateMACD(prices []float64, fast, slow, signal int) MACDData {
	n := len(prices)
	macdLine := make([]float64, n)
	signalLine := make([]float64, n)
	histogram := make([]float64, n)

	if n < slow {
		return MACDData{MACD: macdLine, Signal: signalLine, Histogram: histogram}
	}

	// Calculate EMAs
	ema12 := calculateEMA(prices, fast)
	ema26 := calculateEMA(prices, slow)

	// MACD Line = EMA12 - EMA26
	for i := slow - 1; i < n; i++ {
		macdLine[i] = ema12[i] - ema26[i]
	}

	// Signal Line = 9-day EMA of MACD Line
	// Only calculate from index slow-1 where MACD starts
	macdValues := macdLine[slow-1:]
	signalEMA := calculateEMA(macdValues, signal)

	for i := 0; i < len(signalEMA); i++ {
		idx := slow - 1 + i
		if idx < n {
			signalLine[idx] = signalEMA[i]
		}
	}

	// Histogram = MACD Line - Signal Line
	for i := slow - 1 + signal - 1; i < n; i++ {
		histogram[i] = macdLine[i] - signalLine[i]
	}

	return MACDData{
		MACD:      macdLine,
		Signal:    signalLine,
		Histogram: histogram,
	}
}
