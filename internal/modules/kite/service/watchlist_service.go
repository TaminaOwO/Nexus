package service

import (
	"fmt"

	"nexus/internal/database"
	"nexus/internal/modules/kite/model"
)

// WatchlistAlert represents a watchlist monitoring alert
type WatchlistAlert struct {
	Symbol      string  `json:"symbol"`
	CompanyName string  `json:"company_name"`
	AlertType   string  `json:"alert_type"` // WATCHLIST_TARGET, WATCHLIST_STRATEGY
	Message     string  `json:"message"`
	TargetPrice float64 `json:"target_price"`
	CurrentPrice float64 `json:"current_price"`
}

// CheckWatchlistAlerts monitors all WATCHING entries and generates alerts
func CheckWatchlistAlerts() ([]WatchlistAlert, error) {
	var entries []model.WatchlistEntry
	var alerts []WatchlistAlert

	// Get all WATCHING entries
	database.DB.Where("status = ?", "WATCHING").Find(&entries)

	for _, entry := range entries {
		// Fetch real-time quote
		quote, err := GetQuote(entry.Symbol)
		if err != nil {
			continue // Skip if quote fails
		}

		currentPrice := quote.Price

		// Alert 1: Target Price Reached
		if entry.TargetPrice > 0 && currentPrice <= entry.TargetPrice {
			alert := WatchlistAlert{
				Symbol:       entry.Symbol,
				CompanyName:  entry.CompanyName,
				AlertType:    "WATCHLIST_TARGET",
				Message:      fmt.Sprintf("🎯 %s 已達目標價 $%.2f！當前價 $%.2f", entry.CompanyName, entry.TargetPrice, currentPrice),
				TargetPrice:  entry.TargetPrice,
				CurrentPrice: currentPrice,
			}
			alerts = append(alerts, alert)

			// Send Discord notification
			go SendWatchlistAlert(entry.Symbol, entry.CompanyName, "WATCHLIST_TARGET", alert.Message, currentPrice, entry.TargetPrice)
		}

		// Alert 2: Strategy Conditions Met
		strategyMet, strategyMessage := checkWatchlistStrategy(entry, quote)
		if strategyMet {
			alert := WatchlistAlert{
				Symbol:       entry.Symbol,
				CompanyName:  entry.CompanyName,
				AlertType:    "WATCHLIST_STRATEGY",
				Message:      strategyMessage,
				TargetPrice:  entry.TargetPrice,
				CurrentPrice: currentPrice,
			}
			alerts = append(alerts, alert)

			// Send Discord notification
			go SendWatchlistAlert(entry.Symbol, entry.CompanyName, "WATCHLIST_STRATEGY", alert.Message, currentPrice, entry.TargetPrice)
		}
	}

	return alerts, nil
}

// checkWatchlistStrategy checks if strategy conditions are met
func checkWatchlistStrategy(entry model.WatchlistEntry, quote *QuoteResponse) (bool, string) {
	strategy := entry.Strategy
	subStrategy := entry.SubStrategy

	// OFFICE Strategy
	if strategy == "OFFICE" {
		if subStrategy == "STRONG_WEEKLY" {
			// Weekly MACD Golden Cross + Price above MA20
			if quote.MACDWeeklyTrend == "UP" && quote.Price > quote.MA20 {
				return true, fmt.Sprintf("📈 %s OFFICE策略滿足：週MACD金叉 + 站上月線 ($%.2f > $%.2f)",
					entry.CompanyName, quote.Price, quote.MA20)
			}
		}

		if subStrategy == "WEEKLY_TREND" {
			// Strong weekly trend + pullback to MA10
			if quote.MACDWeeklyTrend == "UP" && quote.Price > quote.MA10 && quote.Price < quote.MA10*1.03 {
				return true, fmt.Sprintf("📈 %s OFFICE策略滿足：週線多頭 + 回測10日線 ($%.2f)",
					entry.CompanyName, quote.Price)
			}
		}
	}

	// BOSS Strategy
	if strategy == "BOSS" {
		if subStrategy == "WEEKLY_PULLBACK" {
			// Price pullback to MA20 + Weekly MACD still UP or FLAT
			if quote.Price > quote.MA20 && quote.Price < quote.MA20*1.05 && quote.MACDWeeklyTrend != "DOWN" {
				return true, fmt.Sprintf("🛡️ %s BOSS策略滿足：回測月線支撐 ($%.2f 接近 $%.2f)",
					entry.CompanyName, quote.Price, quote.MA20)
			}
		}

		if subStrategy == "CHEAP_ACQUISITION" {
			// Price significantly below MA60 (oversold)
			if quote.MA60 > 0 && quote.Price < quote.MA60*0.9 {
				return true, fmt.Sprintf("🛡️ %s BOSS策略滿足：低於季線10%% 廉價收購機會 ($%.2f < $%.2f)",
					entry.CompanyName, quote.Price, quote.MA60)
			}
		}
	}

	return false, ""
}
