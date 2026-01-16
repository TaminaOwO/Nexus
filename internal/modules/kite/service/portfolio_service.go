package service

import (
	"fmt"
	"time"
)

// PortfolioHolding contains trade info with real-time P&L
type PortfolioHolding struct {
	TradeEntry
	CurrentPrice        float64  `json:"current_price"`
	UnrealizedPL        float64  `json:"unrealized_pl"`
	UnrealizedPLPercent float64  `json:"unrealized_pl_percent"`
	CostBasis           float64  `json:"cost_basis"`
	MarketValue         float64  `json:"market_value"`
	DaysHeld            int      `json:"days_held"`
	StrategyAlerts      []string `json:"strategy_alerts"` // Strategy-specific warnings
}

// Alert represents a trading alert
type Alert struct {
	Type    string `json:"type"` // STOP_LOSS, TAKE_PROFIT, STRATEGY_RULE, FORCE_SELL
	Symbol  string `json:"symbol"`
	TradeID string `json:"trade_id"`
	Message string `json:"message"`
}

// PortfolioResponse contains holdings and alerts
type PortfolioResponse struct {
	Holdings    []PortfolioHolding `json:"holdings"`
	Alerts      []Alert            `json:"alerts"`
	TotalCost   float64            `json:"total_cost"`
	MarketValue float64            `json:"market_value"`
	TotalPL     float64            `json:"total_pl"`
	TotalPLPct  float64            `json:"total_pl_percent"`
}

// checkStrategyExitRules implements the Strategy Guardian logic
func checkStrategyExitRules(trade TradeEntry, quote *QuoteResponse, daysHeld int, unrealizedPLPct float64) []Alert {
	var alerts []Alert
	strategy := trade.Strategy
	subStrategy := trade.SubStrategy

	// === OFFICE Strategy Rules ===
	if strategy == "OFFICE" {
		// A. Strong Weekly (追漲)
		if subStrategy == "STRONG_WEEKLY" {
			// Rule 1: 4-Day Stagnation Rule
			if daysHeld >= 4 && unrealizedPLPct < 3 {
				alerts = append(alerts, Alert{
					Type:    "STRATEGY_RULE",
					Symbol:  trade.Symbol,
					TradeID: trade.ID,
					Message: fmt.Sprintf("⚠️ 4日法則: %s 動能停滯 (4-Day Rule: Momentum Stalled) - 持有%d天, 漲幅%.1f%%",
						trade.CompanyName, daysHeld, unrealizedPLPct),
				})
			}
			// Rule 2: Broken 5MA (Daily)
			if quote.MA5 > 0 && quote.Price < quote.MA5 {
				alerts = append(alerts, Alert{
					Type:    "STRATEGY_RULE",
					Symbol:  trade.Symbol,
					TradeID: trade.ID,
					Message: fmt.Sprintf("🛑 收盤跌破5日線 Broken 5MA! %s ($%.2f < $%.2f)",
						trade.CompanyName, quote.Price, quote.MA5),
				})
			}
			// Rule 3: Take Profit on 10MA break (if already profitable)
			if unrealizedPLPct > 10 && quote.MA10 > 0 && quote.Price < quote.MA10 {
				alerts = append(alerts, Alert{
					Type:    "TAKE_PROFIT",
					Symbol:  trade.Symbol,
					TradeID: trade.ID,
					Message: fmt.Sprintf("💰 獲利了結訊號: %s 跌破10日線 (Take Profit: Broken 10MA)",
						trade.CompanyName),
				})
			}
		}

		// B. Weekly Trend (週趨勢)
		if subStrategy == "WEEKLY_TREND" {
			// Rule 1: Broken 10MA
			if quote.MA10 > 0 && quote.Price < quote.MA10 {
				alerts = append(alerts, Alert{
					Type:    "STRATEGY_RULE",
					Symbol:  trade.Symbol,
					TradeID: trade.ID,
					Message: fmt.Sprintf("🛑 收盤跌破10日線 Broken 10MA! %s ($%.2f < $%.2f)",
						trade.CompanyName, quote.Price, quote.MA10),
				})
			}
			// Rule 2: Weekly MACD Momentum Fading (when profitable)
			if unrealizedPLPct > 10 && quote.MACDWeeklyTrend == "DOWN" {
				alerts = append(alerts, Alert{
					Type:    "TAKE_PROFIT",
					Symbol:  trade.Symbol,
					TradeID: trade.ID,
					Message: fmt.Sprintf("💰 週線動能轉弱: %s (Weekly MACD Fading)",
						trade.CompanyName),
				})
			}
		}
	}

	// === BOSS Strategy Rules ===
	if strategy == "BOSS" {
		// Rule 1: Monthly MACD Check (End of Month warning)
		now := time.Now()
		isEndOfMonth := now.Day() >= 25
		if isEndOfMonth && quote.MACDWeeklyTrend == "DOWN" {
			alerts = append(alerts, Alert{
				Type:    "STRATEGY_RULE",
				Symbol:  trade.Symbol,
				TradeID: trade.ID,
				Message: fmt.Sprintf("🛡️ 月底檢視: %s 週MACD向下 (Monthly Check: MACD Declining)",
					trade.CompanyName),
			})
		}

		// Rule 2: Broken 20MA (Month Line) - Strict exit signal
		if quote.DeviationMA20 < -5 {
			alerts = append(alerts, Alert{
				Type:    "STRATEGY_RULE",
				Symbol:  trade.Symbol,
				TradeID: trade.ID,
				Message: fmt.Sprintf("⚠️ 遠離月線: %s 偏離20MA %.1f%% (Far from 20MA)",
					trade.CompanyName, quote.DeviationMA20),
			})
		}

		// Rule 3: Significant loss warning (-15% for BOSS)
		if unrealizedPLPct <= -15 {
			alerts = append(alerts, Alert{
				Type:    "FORCE_SELL",
				Symbol:  trade.Symbol,
				TradeID: trade.ID,
				Message: fmt.Sprintf("🚨 虧損警報: %s 已虧損 %.1f%% (Loss Alert: Down %.1f%%)",
					trade.CompanyName, unrealizedPLPct, unrealizedPLPct),
			})
		}
	}

	return alerts
}

// GetPortfolio fetches all open trades and calculates real-time P&L
func GetPortfolio() (*PortfolioResponse, error) {
	openTrades := GetOpenTrades()

	var holdings []PortfolioHolding
	var alerts []Alert
	var totalCost, marketValue float64

	for _, trade := range openTrades {
		// Fetch real-time price
		quote, err := GetQuote(trade.Symbol)
		if err != nil {
			// If quote fails, create minimal quote
			quote = &QuoteResponse{
				Price: trade.EntryPrice,
				MA5:   0,
				MA10:  0,
				MA20:  0,
			}
		}

		currentPrice := quote.Price
		costBasis := trade.EntryPrice * float64(trade.Quantity)
		marketVal := currentPrice * float64(trade.Quantity)
		unrealizedPL := marketVal - costBasis
		unrealizedPLPct := 0.0
		if costBasis > 0 {
			unrealizedPLPct = (unrealizedPL / costBasis) * 100
		}

		// Calculate days held
		daysHeld := int(time.Since(trade.CreatedAt).Hours() / 24)

		// Run Strategy Guardian checks
		strategyAlerts := checkStrategyExitRules(trade, quote, daysHeld, unrealizedPLPct)
		alerts = append(alerts, strategyAlerts...)

		// Extract alert messages for the holding
		var alertMessages []string
		for _, a := range strategyAlerts {
			alertMessages = append(alertMessages, a.Message)
		}

		holding := PortfolioHolding{
			TradeEntry:          trade,
			CurrentPrice:        currentPrice,
			UnrealizedPL:        unrealizedPL,
			UnrealizedPLPercent: unrealizedPLPct,
			CostBasis:           costBasis,
			MarketValue:         marketVal,
			DaysHeld:            daysHeld,
			StrategyAlerts:      alertMessages,
		}

		holdings = append(holdings, holding)
		totalCost += costBasis
		marketValue += marketVal

		// Basic alerts (Stop Loss / Take Profit)
		if trade.StopLossPrice > 0 && currentPrice <= trade.StopLossPrice {
			alerts = append(alerts, Alert{
				Type:    "STOP_LOSS",
				Symbol:  trade.Symbol,
				TradeID: trade.ID,
				Message: fmt.Sprintf("📉 %s 觸及停損 $%.2f! (Hit Stop Loss at $%.2f)",
					trade.CompanyName, currentPrice, trade.StopLossPrice),
			})
		}

		if trade.TakeProfitPrice > 0 && currentPrice >= trade.TakeProfitPrice {
			alerts = append(alerts, Alert{
				Type:    "TAKE_PROFIT",
				Symbol:  trade.Symbol,
				TradeID: trade.ID,
				Message: fmt.Sprintf("🚀 %s 達到停利 $%.2f! (Hit Take Profit at $%.2f)",
					trade.CompanyName, currentPrice, trade.TakeProfitPrice),
			})
		}

		// Force sell safety net
		if unrealizedPLPct <= -10 && trade.StopLossPrice == 0 && trade.Strategy != "BOSS" {
			alerts = append(alerts, Alert{
				Type:    "FORCE_SELL",
				Symbol:  trade.Symbol,
				TradeID: trade.ID,
				Message: fmt.Sprintf("⚠️ %s 已虧損 %.1f%% - 建議止損! (Down %.1f%% - Cut Loss!)",
					trade.CompanyName, unrealizedPLPct, unrealizedPLPct),
			})
		}
	}

	totalPL := marketValue - totalCost
	totalPLPct := 0.0
	if totalCost > 0 {
		totalPLPct = (totalPL / totalCost) * 100
	}

	return &PortfolioResponse{
		Holdings:    holdings,
		Alerts:      alerts,
		TotalCost:   totalCost,
		MarketValue: marketValue,
		TotalPL:     totalPL,
		TotalPLPct:  totalPLPct,
	}, nil
}
