package service

import (
	"log"
	"time"

	"nexus/internal/database"
	"nexus/internal/modules/kite/model"
)

// StartAlertScanner launches a background goroutine that periodically scans
// portfolio and watchlist alerts, triggering Discord notifications as needed.
// Discord dedup is handled by HasSentNotification inside GetPortfolio / CheckWatchlistAlerts.
func StartAlertScanner(interval time.Duration) {
	go func() {
		log.Printf("[AlertScanner] Started with interval %v", interval)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			runAlertScan()
		}
	}()
}

func runAlertScan() {
	scanPortfolioAlerts()
	scanWatchlistAlerts()
}

// scanPortfolioAlerts runs GetPortfolio which internally checks stop-loss,
// take-profit, strategy rules, and sends Discord alerts via goroutines.
// We only call it when there are open trades to avoid unnecessary API calls.
func scanPortfolioAlerts() {
	var count int64
	database.DB.Model(&model.TradeEntry{}).Where("status = ?", "OPEN").Count(&count)
	if count == 0 {
		return
	}

	_, err := GetPortfolio()
	if err != nil {
		log.Printf("[AlertScanner] Portfolio scan error: %v", err)
	}
}

// scanWatchlistAlerts runs CheckWatchlistAlerts which internally checks
// target price and strategy conditions, and sends Discord alerts.
// We only call it when there are WATCHING entries.
func scanWatchlistAlerts() {
	var count int64
	database.DB.Model(&model.WatchlistEntry{}).Where("status = ?", "WATCHING").Count(&count)
	if count == 0 {
		return
	}

	_, err := CheckWatchlistAlerts()
	if err != nil {
		log.Printf("[AlertScanner] Watchlist scan error: %v", err)
	}
}
