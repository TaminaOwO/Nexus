package service

import (
	"fmt"
	"log"
	"time"

	"nexus/internal/database"
	"nexus/internal/modules/kite/model"
	"nexus/pkg/discord"
)

// Kite 專用顏色（保留語意別名）
const (
	ColorStopLoss     = discord.ColorRed
	ColorForceSell    = discord.ColorRed
	ColorTakeProfit   = discord.ColorGreen
	ColorStrategyRule = discord.ColorOrange
	ColorWatchlist    = discord.ColorBlue
)

// SendPortfolioAlert - 發送 Portfolio 警示到 Discord
func SendPortfolioAlert(alert Alert, holding PortfolioHolding) error {
	if !discord.IsEnabled() {
		log.Printf("[Discord] Skipped: webhook not configured or disabled")
		return nil
	}

	// 檢查是否已發送過（防重複）
	if HasSentNotification(holding.ID, "", alert.Type) {
		log.Printf("[Discord] Skipped: already sent %s for trade %s", alert.Type, holding.ID)
		return nil
	}

	// 建立 Discord Embed
	embed := buildPortfolioEmbed(alert, holding)

	// 發送 Webhook
	err := discord.SendEmbed(embed)
	if err != nil {
		log.Printf("[Discord] ERROR sending %s for %s: %v", alert.Type, alert.Symbol, err)
		return err
	}

	// 記錄發送歷史
	LogNotification(holding.ID, "", alert.Type)
	log.Printf("[Discord] ✅ Sent %s for %s (%s)", alert.Type, alert.Symbol, holding.CompanyName)
	return nil
}

// SendWatchlistAlert - 發送 Watchlist 警示到 Discord
func SendWatchlistAlert(symbol, companyName, alertType, message string, currentPrice, targetPrice float64) error {
	if !discord.IsEnabled() {
		log.Printf("[Discord] Skipped: webhook not configured or disabled")
		return nil
	}

	// 檢查是否已發送過
	if HasSentNotification("", symbol, alertType) {
		log.Printf("[Discord] Skipped: already sent %s for symbol %s", alertType, symbol)
		return nil
	}

	// 建立 Discord Embed
	embed := buildWatchlistEmbed(symbol, companyName, alertType, message, currentPrice, targetPrice)

	// 發送 Webhook
	err := discord.SendEmbed(embed)
	if err != nil {
		log.Printf("[Discord] ERROR sending %s for %s: %v", alertType, symbol, err)
		return err
	}

	// 記錄發送歷史
	LogNotification("", symbol, alertType)
	log.Printf("[Discord] ✅ Sent %s for %s (%s)", alertType, symbol, companyName)
	return nil
}

// buildPortfolioEmbed - 建立 Portfolio 警示 Embed
func buildPortfolioEmbed(alert Alert, holding PortfolioHolding) discord.Embed {
	var color int
	var title string

	switch alert.Type {
	case "STOP_LOSS":
		color = ColorStopLoss
		title = "🚨 停損警示"
	case "TAKE_PROFIT":
		color = ColorTakeProfit
		title = "✅ 停利警示"
	case "FORCE_SELL":
		color = ColorForceSell
		title = "⚠️ 強制賣出警示"
	case "STRATEGY_RULE":
		color = ColorStrategyRule
		title = "📊 策略規則警示"
	default:
		color = ColorStrategyRule
		title = "🔔 交易警示"
	}

	description := fmt.Sprintf("**%s %s**\n%s", alert.Symbol, holding.CompanyName, alert.Message)

	fields := []discord.EmbedField{
		{Name: "當前價格", Value: fmt.Sprintf("$%.2f", holding.CurrentPrice), Inline: true},
		{Name: "進場價格", Value: fmt.Sprintf("$%.2f", holding.EntryPrice), Inline: true},
		{Name: "未實現損益", Value: fmt.Sprintf("%.2f%%", holding.UnrealizedPLPercent), Inline: true},
	}

	// 停損/停利顯示目標價
	if alert.Type == "STOP_LOSS" && holding.StopLossPrice > 0 {
		fields = append(fields, discord.EmbedField{
			Name:   "停損價",
			Value:  fmt.Sprintf("$%.2f", holding.StopLossPrice),
			Inline: true,
		})
	}
	if alert.Type == "TAKE_PROFIT" && holding.TakeProfitPrice > 0 {
		fields = append(fields, discord.EmbedField{
			Name:   "停利價",
			Value:  fmt.Sprintf("$%.2f", holding.TakeProfitPrice),
			Inline: true,
		})
	}

	// 策略資訊
	strategyText := fmt.Sprintf("%s - %s", holding.Strategy, holding.SubStrategy)
	fields = append(fields, discord.EmbedField{
		Name:   "策略",
		Value:  strategyText,
		Inline: false,
	})

	return discord.Embed{
		Title:       title,
		Description: description,
		Color:       color,
		Fields:      fields,
		Timestamp:   time.Now().Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "Kite Trading System"},
	}
}

// buildWatchlistEmbed - 建立 Watchlist 警示 Embed
func buildWatchlistEmbed(symbol, companyName, alertType, message string, currentPrice, targetPrice float64) discord.Embed {
	var title string
	var color int

	if alertType == "WATCHLIST_TARGET" {
		title = "🎯 觀察清單達標通知"
		color = ColorWatchlist
	} else {
		title = "📈 觀察清單策略滿足"
		color = ColorWatchlist
	}

	description := fmt.Sprintf("**%s %s**\n%s", symbol, companyName, message)

	fields := []discord.EmbedField{
		{Name: "當前價格", Value: fmt.Sprintf("$%.2f", currentPrice), Inline: true},
	}

	if targetPrice > 0 {
		fields = append(fields, discord.EmbedField{
			Name:   "目標價",
			Value:  fmt.Sprintf("$%.2f", targetPrice),
			Inline: true,
		})
	}

	return discord.Embed{
		Title:       title,
		Description: description,
		Color:       color,
		Fields:      fields,
		Timestamp:   time.Now().Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "Kite Trading System"},
	}
}

// HasSentNotification - 檢查過去 24 小時內是否已發送過此通知
func HasSentNotification(tradeID, symbol, alertType string) bool {
	var count int64

	// 只檢查過去 24 小時內的記錄
	cutoff := time.Now().Add(-24 * time.Hour)

	query := database.DB.Model(&model.NotificationLog{}).
		Where("alert_type = ?", alertType).
		Where("sent_at > ?", cutoff)

	if tradeID != "" {
		query = query.Where("trade_id = ?", tradeID)
	}
	if symbol != "" {
		query = query.Where("symbol = ?", symbol)
	}

	query.Count(&count)

	if count > 0 {
		log.Printf("[Discord] Duplicate check: found %d recent notification(s) for %s", count, alertType)
	}

	return count > 0
}

// LogNotification - 記錄通知發送歷史
func LogNotification(tradeID, symbol, alertType string) {
	log := model.NotificationLog{
		TradeID:   tradeID,
		Symbol:    symbol,
		AlertType: alertType,
		SentAt:    time.Now(),
	}
	database.DB.Create(&log)
}

// SendTestWebhook - 發送測試訊息
func SendTestWebhook() error {
	embed := discord.Embed{
		Title:       "✅ Webhook 測試成功",
		Description: "Kite Trading System Discord 通知已正確配置",
		Color:       ColorTakeProfit,
		Timestamp:   time.Now().Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "Kite Trading System"},
	}

	return discord.SendEmbed(embed)
}
