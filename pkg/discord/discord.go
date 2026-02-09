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

// IsEnabled 檢查 Discord 通知是否已配置且啟用
func IsEnabled() bool {
	url := strings.TrimSpace(os.Getenv("DISCORD_WEBHOOK_URL"))
	enabled := os.Getenv("DISCORD_NOTIFICATION_ENABLED")
	return url != "" && enabled == "true"
}

// SendEmbed 發送單一 Embed 到 Discord Webhook
func SendEmbed(embed Embed) error {
	webhookURL := strings.TrimSpace(os.Getenv("DISCORD_WEBHOOK_URL"))
	if webhookURL == "" {
		return fmt.Errorf("DISCORD_WEBHOOK_URL not configured")
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
