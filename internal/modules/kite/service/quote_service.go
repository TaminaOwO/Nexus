package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"
)

// QuoteResponse represents the API response for stock quote data
type QuoteResponse struct {
	Symbol        string  `json:"symbol"`
	Price         float64 `json:"price"`
	ChangePercent float64 `json:"change_percent"`
	Volume        int64   `json:"volume"`
	TradeValue    float64 `json:"trade_value"`
	MA5           float64 `json:"ma5"`
	MA10          float64 `json:"ma10"` // For Strategy Guardian
	MA20          float64 `json:"ma20"`
	MA60          float64 `json:"ma60"`
	DeviationMA20 float64 `json:"deviation_ma20"`
	DeviationMA60 float64 `json:"deviation_ma60"`
	CompanyName   string  `json:"company_name"`
	// MACD Data
	MacdHistogram     float64 `json:"macd_histogram"`
	MacdHistogramDays int     `json:"macd_histogram_days"` // Positive = red days, Negative = green days
	MACDWeeklyTrend   string  `json:"macd_weekly_trend"`   // "UP", "DOWN", "FLAT"
}

// YahooChartResponse represents the v8/finance/chart API response
type YahooChartResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Symbol                     string  `json:"symbol"`
				ShortName                  string  `json:"shortName"`
				LongName                   string  `json:"longName"`
				RegularMarketPrice         float64 `json:"regularMarketPrice"`
				ChartPreviousClose         float64 `json:"chartPreviousClose"`
				PreviousClose              float64 `json:"previousClose"`
				RegularMarketVolume        int64   `json:"regularMarketVolume"`
				RegularMarketChangePercent float64 `json:"regularMarketChangePercent"`
			} `json:"meta"`
			Timestamp  []int64 `json:"timestamp"`
			Indicators struct {
				Quote []struct {
					Close  []float64 `json:"close"`
					Volume []int64   `json:"volume"`
				} `json:"quote"`
			} `json:"indicators"`
		} `json:"result"`
		Error *struct {
			Code        string `json:"code"`
			Description string `json:"description"`
		} `json:"error"`
	} `json:"chart"`
}

// YahooAutocompleteResponse represents the TW Autocomplete API response
type YahooAutocompleteResponse struct {
	ResultSet struct {
		Query  string `json:"Query"`
		Result []struct {
			Symbol   string `json:"symbol"`
			Name     string `json:"name"`
			Exch     string `json:"exch"`
			Type     string `json:"type"`
			ExchDisp string `json:"exchDisp"`
			TypeDisp string `json:"typeDisp"`
		} `json:"Result"`
	} `json:"ResultSet"`
}

// httpClient is a shared HTTP client with timeout
var httpClient = &http.Client{Timeout: 15 * time.Second}

// fetchWithUserAgent makes an HTTP GET request with browser User-Agent
func fetchWithUserAgent(url string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Language", "zh-TW,zh;q=0.9,en;q=0.8")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	return body, nil
}

// ============ MACD CALCULATIONS ============

// calculateEMA calculates Exponential Moving Average series
func calculateEMA(prices []float64, period int) []float64 {
	if len(prices) < period {
		return nil
	}

	ema := make([]float64, len(prices))
	multiplier := 2.0 / float64(period+1)

	// First EMA is SMA
	sum := 0.0
	for i := 0; i < period; i++ {
		sum += prices[i]
	}
	ema[period-1] = sum / float64(period)

	// Calculate EMA for remaining values
	for i := period; i < len(prices); i++ {
		ema[i] = (prices[i]-ema[i-1])*multiplier + ema[i-1]
	}

	return ema
}

// calculateMACD calculates MACD (12,26,9) and returns histogram + consecutive days
// Returns: histogram value, days count (positive = red/bullish days, negative = green/bearish days)
func calculateMACD(prices []float64) (histogram float64, days int) {
	if len(prices) < 35 { // Need at least 26 + 9 days
		return 0, 0
	}

	// Calculate EMAs
	ema12 := calculateEMA(prices, 12)
	ema26 := calculateEMA(prices, 26)

	if len(ema12) == 0 || len(ema26) == 0 {
		return 0, 0
	}

	// Calculate MACD Line (EMA12 - EMA26)
	macdLine := make([]float64, len(prices))
	for i := 25; i < len(prices); i++ {
		macdLine[i] = ema12[i] - ema26[i]
	}

	// Calculate Signal Line (EMA9 of MACD Line, starting from index 25)
	macdValues := macdLine[25:]
	signalEMA := calculateEMA(macdValues, 9)

	if len(signalEMA) < 9 {
		return 0, 0
	}

	// Calculate Histogram series
	histogramSeries := make([]float64, len(macdValues))
	for i := 8; i < len(macdValues); i++ {
		histogramSeries[i] = macdValues[i] - signalEMA[i]
	}

	// Need at least 2 entries to skip today's incomplete candle
	if len(histogramSeries) < 10 {
		return 0, 0
	}

	// Get the SECOND TO LAST histogram value (skip today's incomplete candle)
	// The last entry in the array is today's partial/intraday data
	// We want to use yesterday's completed data for the signal
	histogram = histogramSeries[len(histogramSeries)-2]

	// Count consecutive days with same sign
	// For positive histogram: count only strictly > 0, break on <= 0
	// For negative histogram: count only strictly < 0, break on >= 0
	isPositive := histogram > 0
	days = 0

	// Start from the SECOND TO LAST (skip today's incomplete candle)
	for i := len(histogramSeries) - 2; i >= 8; i-- {
		histVal := histogramSeries[i]

		if isPositive {
			// Counting positive (red/bullish) days
			if histVal > 0 {
				days++
			} else {
				break // Hit zero or negative, stop counting
			}
		} else {
			// Counting negative (green/bearish) days
			if histVal < 0 {
				days++
			} else {
				break // Hit zero or positive, stop counting
			}
		}
	}

	// If histogram is negative (green), return negative days count
	if !isPositive {
		days = -days
	}

	return histogram, days
}

// calculateWeeklyTrend compares current week MACD Line (DIF) vs previous week
// Uses DIF slope instead of histogram to avoid false signals from incomplete weeks
// Returns "UP" (Bullish), "DOWN" (Bearish), or "FLAT"
func calculateWeeklyTrend(prices []float64) string {
	if len(prices) < 35 {
		return "FLAT"
	}

	// Calculate MACD Line (DIF) = EMA12 - EMA26
	ema12 := calculateEMA(prices, 12)
	ema26 := calculateEMA(prices, 26)

	if len(ema12) == 0 || len(ema26) == 0 {
		return "FLAT"
	}

	// Build MACD Line (DIF) series
	macdLine := make([]float64, len(prices))
	for i := 25; i < len(prices); i++ {
		macdLine[i] = ema12[i] - ema26[i]
	}

	// Need at least 3 weeks of data (skip incomplete current week)
	if len(macdLine) < 28 {
		return "FLAT"
	}

	// Compare MACD Line (DIF) values: current week vs previous week
	// Skip the last (incomplete) week and compare the two complete weeks before it
	// Index -2 = last complete week, Index -3 = previous complete week
	currentDIF := macdLine[len(macdLine)-2]
	previousDIF := macdLine[len(macdLine)-3]

	// Trend is based on DIF slope (is the line going up or down?)
	if currentDIF > previousDIF {
		return "UP" // Bullish - DIF is rising
	} else if currentDIF < previousDIF {
		return "DOWN" // Bearish - DIF is falling
	}
	return "FLAT"
}

// ============ DATA FETCHING ============

// fetchChineseNameDynamic fetches the Chinese stock name from Yahoo TW Autocomplete API
func fetchChineseNameDynamic(symbol string) string {
	rawNumber := strings.Split(symbol, ".")[0]
	url := fmt.Sprintf("https://tw.stock.yahoo.com/_td-stock/api/resource/AutocompleteService;query=%s", rawNumber)

	body, err := fetchWithUserAgent(url)
	if err != nil {
		return ""
	}

	var resp YahooAutocompleteResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return ""
	}

	for _, result := range resp.ResultSet.Result {
		if result.Symbol == symbol {
			return result.Name
		}
	}

	if len(resp.ResultSet.Result) > 0 {
		return resp.ResultSet.Result[0].Name
	}

	return ""
}

// fetchChartData fetches chart data from Yahoo Finance
func fetchChartData(symbol string, timeRange string, interval string) (*YahooChartResponse, error) {
	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=%s&range=%s",
		symbol, interval, timeRange,
	)

	body, err := fetchWithUserAgent(url)
	if err != nil {
		return nil, err
	}

	var resp YahooChartResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if resp.Chart.Error != nil {
		return nil, fmt.Errorf("yahoo API error: %s", resp.Chart.Error.Description)
	}

	if len(resp.Chart.Result) == 0 {
		return nil, fmt.Errorf("no data found for symbol")
	}

	return &resp, nil
}

// getClosePrices extracts valid close prices from chart response
func getClosePrices(resp *YahooChartResponse) []float64 {
	var prices []float64
	if len(resp.Chart.Result) > 0 && len(resp.Chart.Result[0].Indicators.Quote) > 0 {
		for _, price := range resp.Chart.Result[0].Indicators.Quote[0].Close {
			if price > 0 {
				prices = append(prices, price)
			}
		}
	}
	return prices
}

// ============ MAIN QUOTE FUNCTION ============

// GetQuote fetches stock quote data from Yahoo Finance with MACD analysis
func GetQuote(symbol string) (*QuoteResponse, error) {
	// 1. Clean the symbol
	symbol = strings.TrimSpace(symbol)

	// 2. Smart suffix handling for Taiwan stocks
	// If no suffix, try .TW first, then .TWO (for OTC/TPEx stocks)
	originalSymbol := symbol
	needsSuffixRetry := false

	if !strings.Contains(symbol, ".") {
		symbol = fmt.Sprintf("%s.TW", symbol)
		needsSuffixRetry = true // Mark for potential retry with .TWO
	}

	// 3. Fetch daily chart (1d) for current price and daily change
	dailyResp, err := fetchChartData(symbol, "1d", "1d")

	// Smart Suffix Retry: If .TW fails, try .TWO for OTC stocks
	if err != nil && needsSuffixRetry {
		otcSymbol := fmt.Sprintf("%s.TWO", originalSymbol)
		dailyResp, err = fetchChartData(otcSymbol, "1d", "1d")
		if err == nil {
			symbol = otcSymbol // Use the OTC symbol for all subsequent calls
		}
	}

	if err != nil {
		return nil, fmt.Errorf("no data found for symbol %s (may be delisted or invalid)", originalSymbol)
	}
	dailyMeta := dailyResp.Chart.Result[0].Meta

	// 4. Fetch 6-month daily history for MACD and MA calculations
	histResp, err := fetchChartData(symbol, "6mo", "1d")
	var dailyPrices []float64
	if err == nil {
		dailyPrices = getClosePrices(histResp)
	}

	// 5. Fetch weekly chart for weekly MACD trend
	weeklyResp, err := fetchChartData(symbol, "1y", "1wk")
	var weeklyPrices []float64
	if err == nil {
		weeklyPrices = getClosePrices(weeklyResp)
	}

	// 6. Fetch Chinese name (for Taiwan stocks)
	companyName := ""
	if strings.HasSuffix(symbol, ".TW") || strings.HasSuffix(symbol, ".TWO") {
		companyName = fetchChineseNameDynamic(symbol)
	}
	if companyName == "" {
		if dailyMeta.ShortName != "" {
			companyName = dailyMeta.ShortName
		} else {
			companyName = symbol
		}
	}

	// 7. Calculate MAs
	ma5 := calculateMA(dailyPrices, 5)
	ma20 := calculateMA(dailyPrices, 20)
	ma60 := calculateMA(dailyPrices, 60)

	// 8. Get price and calculate deviations
	price := dailyMeta.RegularMarketPrice
	deviationMA20 := 0.0
	deviationMA60 := 0.0
	if ma20 > 0 {
		deviationMA20 = ((price - ma20) / ma20) * 100
	}
	if ma60 > 0 {
		deviationMA60 = ((price - ma60) / ma60) * 100
	}

	// 9. Calculate change percent
	changePercent := 0.0
	if dailyMeta.RegularMarketChangePercent != 0 {
		changePercent = dailyMeta.RegularMarketChangePercent
	} else {
		prevClose := dailyMeta.ChartPreviousClose
		if prevClose == 0 {
			prevClose = dailyMeta.PreviousClose
		}
		if prevClose > 0 && price > 0 {
			changePercent = ((price - prevClose) / prevClose) * 100
		}
	}

	// 10. Calculate MACD (Daily)
	macdHistogram, macdDays := calculateMACD(dailyPrices)

	// 11. Calculate Weekly Trend
	weeklyTrend := calculateWeeklyTrend(weeklyPrices)

	// 12. Calculate trade value
	volume := dailyMeta.RegularMarketVolume
	tradeValue := price * float64(volume)

	return &QuoteResponse{
		Symbol:            symbol,
		Price:             price,
		ChangePercent:     changePercent,
		Volume:            volume,
		TradeValue:        tradeValue,
		MA5:               ma5,
		MA10:              calculateMA(dailyPrices, 10),
		MA20:              ma20,
		MA60:              ma60,
		DeviationMA20:     deviationMA20,
		DeviationMA60:     deviationMA60,
		CompanyName:       companyName,
		MacdHistogram:     macdHistogram,
		MacdHistogramDays: macdDays,
		MACDWeeklyTrend:   weeklyTrend,
	}, nil
}

// calculateMA calculates the simple moving average for the given period
func calculateMA(prices []float64, period int) float64 {
	if len(prices) < period {
		return 0
	}

	recentPrices := prices[len(prices)-period:]
	sum := 0.0
	for _, p := range recentPrices {
		sum += p
	}

	return sum / float64(period)
}

// GetMultipleQuotes fetches quotes for multiple symbols
func GetMultipleQuotes(symbols []string) ([]*QuoteResponse, error) {
	var quotes []*QuoteResponse

	for _, symbol := range symbols {
		quote, err := GetQuote(symbol)
		if err != nil {
			continue
		}
		quotes = append(quotes, quote)
	}

	sort.Slice(quotes, func(i, j int) bool {
		return quotes[i].TradeValue > quotes[j].TradeValue
	})

	return quotes, nil
}
