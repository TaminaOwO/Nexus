package handler

import (
	"net/http"
	"time"

	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"
	"nexus/pkg/discord"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetReminderSettings - GET /api/lifeos/reminders
func GetReminderSettings(c *gin.Context) {
	var settings []model.ReminderSetting
	database.DB.Find(&settings)

	// 無資料時回傳預設值
	if len(settings) == 0 {
		settings = defaultSettings()
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateReminderSetting - PUT /api/lifeos/reminders/:type
func UpdateReminderSetting(c *gin.Context) {
	settingType := c.Param("type")

	validTypes := map[string]bool{
		"HABIT_DAILY": true, "TASK_DUE_SOON": true, "TASK_OVERDUE": true,
		"SKINCARE_AM": true, "SKINCARE_PM": true,
	}
	if !validTypes[settingType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reminder type"})
		return
	}

	var req struct {
		Enabled      *bool  `json:"enabled"`
		ReminderTime string `json:"reminder_time"`
		LeadDays     *int   `json:"lead_days"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查詢或建立
	var setting model.ReminderSetting
	result := database.DB.Where("type = ?", settingType).First(&setting)

	if result.Error != nil {
		// 不存在 → 從預設值建立
		defaults := defaultSettingsMap()
		d := defaults[settingType]
		setting = model.ReminderSetting{
			ID:           uuid.New().String(),
			Type:         settingType,
			Enabled:      d.Enabled,
			ReminderTime: d.ReminderTime,
			LeadDays:     d.LeadDays,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
	}

	// 套用更新
	if req.Enabled != nil {
		setting.Enabled = *req.Enabled
	}
	if req.ReminderTime != "" {
		setting.ReminderTime = req.ReminderTime
	}
	if req.LeadDays != nil {
		setting.LeadDays = *req.LeadDays
	}
	setting.UpdatedAt = time.Now()

	database.DB.Save(&setting)
	c.JSON(http.StatusOK, setting)
}

// TestReminderWebhook - POST /api/lifeos/reminders/test
func TestReminderWebhook(c *gin.Context) {
	embed := discord.Embed{
		Title:       "✅ LifeOS 提醒測試成功",
		Description: "LifeOS 通知系統已正確配置，你會在設定的時間收到習慣打卡和任務到期提醒。",
		Color:       discord.ColorCoral,
		Timestamp:   time.Now().Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "LifeOS Reminder"},
	}

	webhookURL := discord.GetWebhookURL("DISCORD_LIFEOS_WEBHOOK_URL")
	if err := discord.SendEmbedTo(webhookURL, embed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Test notification sent"})
}

func defaultSettings() []model.ReminderSetting {
	return []model.ReminderSetting{
		{Type: "HABIT_DAILY", Enabled: true, ReminderTime: "21:00", LeadDays: 0},
		{Type: "TASK_DUE_SOON", Enabled: true, ReminderTime: "09:00", LeadDays: 1},
		{Type: "TASK_OVERDUE", Enabled: true, ReminderTime: "09:00", LeadDays: 0},
		{Type: "SKINCARE_AM", Enabled: true, ReminderTime: "07:30", LeadDays: 0},
		{Type: "SKINCARE_PM", Enabled: true, ReminderTime: "20:30", LeadDays: 0},
	}
}

func defaultSettingsMap() map[string]model.ReminderSetting {
	m := map[string]model.ReminderSetting{}
	for _, s := range defaultSettings() {
		m[s.Type] = s
	}
	return m
}
