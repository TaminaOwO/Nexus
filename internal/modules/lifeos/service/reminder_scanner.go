package service

import (
	"fmt"
	"log"
	"strings"
	"time"

	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"
	"nexus/pkg/discord"
)

// StartReminderScanner 啟動背景提醒掃描（每 interval 執行一次）
func StartReminderScanner(interval time.Duration) {
	go func() {
		log.Printf("[LifeOS Reminder] Scanner started (interval: %v)", interval)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			runReminderScan()
		}
	}()
}

// LifeOS 專用 webhook env key
const lifeosWebhookEnv = "DISCORD_LIFEOS_WEBHOOK_URL"

func sendLifeOSEmbed(embed discord.Embed) error {
	url := discord.GetWebhookURL(lifeosWebhookEnv)
	return discord.SendEmbedTo(url, embed)
}

func runReminderScan() {
	if !discord.IsEnabledFor(lifeosWebhookEnv) {
		return
	}

	loc := loadTimezone()
	now := time.Now().In(loc)

	scanHabitReminder(now)
	scanTaskDueSoon(now)
	scanTaskOverdue(now)
	scanSkincareAM(now)
	scanSkincarePM(now)
}

func loadTimezone() *time.Location {
	loc, err := time.LoadLocation("Asia/Taipei")
	if err != nil {
		log.Printf("[LifeOS Reminder] Failed to load Asia/Taipei timezone, using UTC: %v", err)
		return time.UTC
	}
	return loc
}

// --- 習慣每日打卡提醒 ---

func scanHabitReminder(now time.Time) {
	setting := getSettingOrDefault("HABIT_DAILY", "21:00", 0)
	if !setting.Enabled {
		return
	}

	if !isWithinTimeWindow(now, setting.ReminderTime, 30) {
		return
	}

	today := now.Format("2006-01-02")
	if hasSentNotification("HABIT_DAILY", "", today) {
		return
	}

	// 查全部習慣
	var habits []model.Habit
	database.DB.Find(&habits)
	if len(habits) == 0 {
		return
	}

	// 查今日已完成的習慣 ID
	var doneLogs []model.HabitLog
	database.DB.Where("date = ? AND status = ?", today, "Done").Find(&doneLogs)

	completedIDs := map[string]bool{}
	for _, l := range doneLogs {
		completedIDs[l.HabitID] = true
	}

	// 找出未完成的習慣
	var missing []string
	for _, h := range habits {
		if !completedIDs[h.ID] {
			icon := h.Icon
			if icon == "" {
				icon = "[ ]"
			}
			missing = append(missing, fmt.Sprintf("%s %s", icon, h.Name))
		}
	}

	// 全部完成，不需要提醒
	completedCount := len(doneLogs)
	totalCount := len(habits)
	if len(missing) == 0 {
		return
	}

	// 組合未完成清單
	missingText := ""
	for _, m := range missing {
		missingText += m + "\n"
	}

	embed := discord.Embed{
		Title:       "🧠 LifeOS — 習慣打卡提醒",
		Description: fmt.Sprintf("今日完成 **%d / %d** 個習慣\n還有 %d 個習慣等你打卡！", completedCount, totalCount, len(missing)),
		Color:       discord.ColorCoral,
		Fields: []discord.EmbedField{
			{Name: "未完成習慣", Value: missingText},
		},
		Timestamp: now.Format(time.RFC3339),
		Footer:    &discord.EmbedFooter{Text: "LifeOS Reminder"},
	}

	if err := sendLifeOSEmbed(embed); err != nil {
		log.Printf("[LifeOS Reminder] ERROR sending habit reminder: %v", err)
		return
	}

	logNotification("HABIT_DAILY", "", today)
	log.Printf("[LifeOS Reminder] Sent habit daily reminder (%d/%d completed)", completedCount, totalCount)
}

// --- 任務即將到期提醒 ---

func scanTaskDueSoon(now time.Time) {
	setting := getSettingOrDefault("TASK_DUE_SOON", "09:00", 1)
	if !setting.Enabled {
		return
	}

	if !isWithinTimeWindow(now, setting.ReminderTime, 30) {
		return
	}

	today := now.Format("2006-01-02")
	targetDate := now.AddDate(0, 0, setting.LeadDays).Format("2006-01-02")

	// 查即將到期且非 done 的任務
	var tasks []model.Task
	database.DB.Where("due_date = ? AND column != ?", targetDate, "done").Find(&tasks)

	for _, task := range tasks {
		if hasSentNotification("TASK_DUE_SOON", task.ID, today) {
			continue
		}

		dueStr := ""
		if task.DueDate != nil {
			dueStr = *task.DueDate
		}

		priorityLabel := "一般"
		switch task.Priority {
		case 1:
			priorityLabel = "高 !!!"
		case 3:
			priorityLabel = "低"
		}

		fields := []discord.EmbedField{
			{Name: "欄位", Value: columnLabel(task.Column), Inline: true},
			{Name: "優先度", Value: priorityLabel, Inline: true},
		}

		if task.FlowType != "NONE" && task.FlowType != "" {
			fields = append(fields, discord.EmbedField{
				Name: "F.L.O.W.", Value: flowLabel(task.FlowType), Inline: true,
			})
		}

		embed := discord.Embed{
			Title:       "📋 LifeOS — 任務即將到期",
			Description: fmt.Sprintf("**%s** 將於 %s 到期", task.Title, dueStr),
			Color:       discord.ColorOrange,
			Fields:      fields,
			Timestamp:   now.Format(time.RFC3339),
			Footer:      &discord.EmbedFooter{Text: "LifeOS Reminder"},
		}

		if err := sendLifeOSEmbed(embed); err != nil {
			log.Printf("[LifeOS Reminder] ERROR sending due-soon for task %s: %v", task.ID, err)
			continue
		}

		logNotification("TASK_DUE_SOON", task.ID, today)
		log.Printf("[LifeOS Reminder] Sent due-soon for task: %s", task.Title)
	}
}

// --- 逾期任務提醒 ---

func scanTaskOverdue(now time.Time) {
	setting := getSettingOrDefault("TASK_OVERDUE", "09:00", 0)
	if !setting.Enabled {
		return
	}

	if !isWithinTimeWindow(now, setting.ReminderTime, 30) {
		return
	}

	today := now.Format("2006-01-02")
	if hasSentNotification("TASK_OVERDUE", "", today) {
		return
	}

	// 查逾期且非 done 的任務
	var tasks []model.Task
	database.DB.Where("due_date < ? AND due_date IS NOT NULL AND due_date != '' AND column != ?", today, "done").Find(&tasks)

	if len(tasks) == 0 {
		return
	}

	// 彙整成一則通知
	taskList := ""
	for _, t := range tasks {
		due := ""
		if t.DueDate != nil {
			due = *t.DueDate
		}
		taskList += fmt.Sprintf("- **%s** (到期: %s, %s)\n", t.Title, due, columnLabel(t.Column))
	}

	embed := discord.Embed{
		Title:       "🚨 LifeOS — 逾期任務",
		Description: fmt.Sprintf("目前有 **%d** 個逾期任務：\n\n%s", len(tasks), taskList),
		Color:       discord.ColorRed,
		Timestamp:   now.Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "LifeOS Reminder"},
	}

	if err := sendLifeOSEmbed(embed); err != nil {
		log.Printf("[LifeOS Reminder] ERROR sending overdue reminder: %v", err)
		return
	}

	logNotification("TASK_OVERDUE", "", today)
	log.Printf("[LifeOS Reminder] Sent overdue reminder for %d tasks", len(tasks))
}

// --- 保養 AM 提醒 ---

func scanSkincareAM(now time.Time) {
	setting := getSettingOrDefault("SKINCARE_AM", "07:30", 0)
	if !setting.Enabled {
		return
	}

	if !isWithinTimeWindow(now, setting.ReminderTime, 30) {
		return
	}

	today := now.Format("2006-01-02")
	if hasSentNotification("SKINCARE_AM", "", today) {
		return
	}

	routine := getSkincareRoutineForNow(now)
	if routine == nil {
		return
	}

	if len(routine.AM) == 0 {
		return
	}

	stepList := formatStepList(routine.AM)
	bannedText := ""
	if len(routine.Banned) > 0 {
		bannedText = strings.Join(routine.Banned, "\n")
	}

	fields := []discord.EmbedField{
		{Name: "AM 保養步驟", Value: stepList},
	}
	if bannedText != "" {
		fields = append(fields, discord.EmbedField{Name: "今日禁用", Value: bannedText})
	}

	embed := discord.Embed{
		Title:       fmt.Sprintf("🌅 Skincare AM — Day %d %s", routine.CycleDay, routine.PhaseLabel),
		Description: fmt.Sprintf("**%s** · %s", routine.Mode, routine.DayOfWeek),
		Color:       discord.ColorCoral,
		Fields:      fields,
		Timestamp:   now.Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "LifeOS Skincare"},
	}

	if err := sendLifeOSEmbed(embed); err != nil {
		log.Printf("[LifeOS Reminder] ERROR sending skincare AM: %v", err)
		return
	}

	logNotification("SKINCARE_AM", "", today)
	log.Printf("[LifeOS Reminder] Sent skincare AM reminder (Day %d, %s)", routine.CycleDay, routine.PhaseLabel)
}

// --- 保養 PM 提醒 ---

func scanSkincarePM(now time.Time) {
	setting := getSettingOrDefault("SKINCARE_PM", "20:30", 0)
	if !setting.Enabled {
		return
	}

	if !isWithinTimeWindow(now, setting.ReminderTime, 30) {
		return
	}

	today := now.Format("2006-01-02")
	if hasSentNotification("SKINCARE_PM", "", today) {
		return
	}

	routine := getSkincareRoutineForNow(now)
	if routine == nil {
		return
	}

	if len(routine.PM) == 0 {
		return
	}

	stepList := formatStepList(routine.PM)
	bannedText := ""
	if len(routine.Banned) > 0 {
		bannedText = strings.Join(routine.Banned, "\n")
	}

	fields := []discord.EmbedField{
		{Name: "PM 保養步驟", Value: stepList},
	}
	if bannedText != "" {
		fields = append(fields, discord.EmbedField{Name: "今日禁用", Value: bannedText})
	}

	embed := discord.Embed{
		Title:       fmt.Sprintf("🌙 Skincare PM — Day %d %s", routine.CycleDay, routine.PhaseLabel),
		Description: fmt.Sprintf("**%s** · %s", routine.Mode, routine.DayOfWeek),
		Color:       discord.ColorCoral,
		Fields:      fields,
		Timestamp:   now.Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "LifeOS Skincare"},
	}

	if err := sendLifeOSEmbed(embed); err != nil {
		log.Printf("[LifeOS Reminder] ERROR sending skincare PM: %v", err)
		return
	}

	logNotification("SKINCARE_PM", "", today)
	log.Printf("[LifeOS Reminder] Sent skincare PM reminder (Day %d, %s)", routine.CycleDay, routine.PhaseLabel)
}

// --- Skincare helpers ---

func getSkincareRoutineForNow(now time.Time) *model.SkincareRoutine {
	var cycleSetting model.SkincareCycleSetting
	if err := database.DB.First(&cycleSetting).Error; err != nil {
		return nil
	}

	var rules []model.SkincareScheduleRule
	database.DB.Find(&rules)
	if len(rules) == 0 {
		rules = GetDefaultScheduleRules()
	}

	cycleDay := CalculateCycleDay(cycleSetting.CycleStartDate, cycleSetting.CycleLength, now)
	routine := GenerateDailySkincare(cycleDay, now, rules)
	return &routine
}

func formatStepList(steps []model.SkincareStep) string {
	var lines []string
	for _, s := range steps {
		line := s.Product
		if s.Badge != "" {
			line += "  `" + s.Badge + "`"
		}
		if s.Optional {
			line = "_(optional)_ " + line
		}
		lines = append(lines, "• "+line)
	}
	return strings.Join(lines, "\n")
}

// --- Helper functions ---

// isWithinTimeWindow 檢查當前時間是否在 targetHHMM ± windowMinutes 內
func isWithinTimeWindow(now time.Time, targetHHMM string, windowMinutes int) bool {
	var targetH, targetM int
	fmt.Sscanf(targetHHMM, "%d:%d", &targetH, &targetM)

	targetMinutes := targetH*60 + targetM
	currentMinutes := now.Hour()*60 + now.Minute()

	diff := currentMinutes - targetMinutes
	if diff < 0 {
		diff = -diff
	}

	return diff <= windowMinutes
}

func getSettingOrDefault(settingType, defaultTime string, defaultLeadDays int) model.ReminderSetting {
	var setting model.ReminderSetting
	result := database.DB.Where("type = ?", settingType).First(&setting)
	if result.Error != nil {
		return model.ReminderSetting{
			Type:         settingType,
			Enabled:      true,
			ReminderTime: defaultTime,
			LeadDays:     defaultLeadDays,
		}
	}
	return setting
}

func hasSentNotification(nType, refID, refDate string) bool {
	var count int64
	query := database.DB.Model(&model.LifeOSNotificationLog{}).
		Where("type = ? AND ref_date = ?", nType, refDate)
	if refID != "" {
		query = query.Where("ref_id = ?", refID)
	}
	query.Count(&count)
	return count > 0
}

func logNotification(nType, refID, refDate string) {
	entry := model.LifeOSNotificationLog{
		Type:    nType,
		RefID:   refID,
		RefDate: refDate,
		SentAt:  time.Now(),
	}
	database.DB.Create(&entry)
}

func columnLabel(col string) string {
	switch col {
	case "backlog":
		return "Backlog"
	case "this_week":
		return "This Week"
	case "today":
		return "Today"
	case "done":
		return "Done"
	default:
		return col
	}
}

func flowLabel(ft string) string {
	switch ft {
	case "F":
		return "Funnel 策略規劃"
	case "L":
		return "Leverage 資產建造"
	case "O":
		return "Operate 日常營運"
	case "W":
		return "Wealth 變現結果"
	default:
		return ft
	}
}
