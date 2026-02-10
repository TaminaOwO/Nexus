package discord

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

// Embed - Discord Rich Embed 結構
type Embed struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Color       int          `json:"color"`
	Fields      []EmbedField `json:"fields"`
	Timestamp   string       `json:"timestamp"`
	Footer      *EmbedFooter `json:"footer,omitempty"`
}

type EmbedField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type EmbedFooter struct {
	Text string `json:"text"`
}

type WebhookPayload struct {
	Embeds []Embed `json:"embeds"`
}

// 顏色常數
const (
	ColorRed    = 15548997 // #ED4245
	ColorGreen  = 5763719  // #57F287
	ColorOrange = 16098851 // #F59E0B
	ColorBlue   = 3447003  // #3498DB
	ColorPurple = 10181046 // #9B59B6
	ColorCoral  = 13399392 // #CC7A60 (LifeOS accent)
)

// IsEnabled 檢查 Discord 通知是否已配置且啟用（通用）
func IsEnabled() bool {
	url := strings.TrimSpace(os.Getenv("DISCORD_WEBHOOK_URL"))
	enabled := os.Getenv("DISCORD_NOTIFICATION_ENABLED")
	return url != "" && enabled == "true"
}

// IsEnabledFor 檢查指定 env key 的 webhook 是否已配置且啟用
// 若該 key 無值，fallback 到通用 DISCORD_WEBHOOK_URL
func IsEnabledFor(envKey string) bool {
	url := GetWebhookURL(envKey)
	enabled := os.Getenv("DISCORD_NOTIFICATION_ENABLED")
	return url != "" && enabled == "true"
}

// GetWebhookURL 取得指定 env key 的 webhook URL，無值則 fallback 到通用 URL
func GetWebhookURL(envKey string) string {
	url := strings.TrimSpace(os.Getenv(envKey))
	if url == "" {
		url = strings.TrimSpace(os.Getenv("DISCORD_WEBHOOK_URL"))
	}
	return url
}

// SendEmbed 發送到預設 DISCORD_WEBHOOK_URL
func SendEmbed(embed Embed) error {
	return SendEmbedTo(strings.TrimSpace(os.Getenv("DISCORD_WEBHOOK_URL")), embed)
}

// SendEmbedTo 發送到指定的 webhook URL
func SendEmbedTo(webhookURL string, embed Embed) error {
	if webhookURL == "" {
		return fmt.Errorf("webhook URL not configured")
	}

	enabled := os.Getenv("DISCORD_NOTIFICATION_ENABLED")
	if enabled != "true" {
		log.Printf("[Discord] Skipped: notifications disabled")
		return nil
	}

	payload := WebhookPayload{Embeds: []Embed{embed}}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[Discord] Marshal error: %v", err)
		return fmt.Errorf("failed to marshal webhook payload: %w", err)
	}

	log.Printf("[Discord] Sending webhook to Discord...")
	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("[Discord] HTTP POST error: %v", err)
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		log.Printf("[Discord] Unexpected status: %d", resp.StatusCode)
		return fmt.Errorf("discord webhook returned status %d", resp.StatusCode)
	}

	log.Printf("[Discord] Webhook sent successfully (status %d)", resp.StatusCode)
	return nil
}
