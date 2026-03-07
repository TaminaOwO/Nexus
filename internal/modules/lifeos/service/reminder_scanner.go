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
	setting := getSettingOrDefault("SKINCARE_AM", "08:00", 0)
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

	msg := fmt.Sprintf("Hi~ 主人早安！☀️\n\n"+
		"今天是週期第 **%d** 天（%s），模式：**%s**\n\n"+
		"起床後先喝杯溫水，接著開始早晨保養：\n\n%s",
		routine.CycleDay, routine.PhaseLabel, routine.Mode,
		formatStepsChinese(routine.AM))

	if len(routine.Banned) > 0 {
		msg += "\n\n⚠️ 今天記得避開：\n" + formatBannedChinese(routine.Banned)
	}

	// 取得健康快照並呼叫 Claude AI 生成建議
	wellnessBlock := buildWellnessBlock(now, routine)
	if wellnessBlock != "" {
		msg += "\n\n" + wellnessBlock
	}

	msg += "\n\n祝你有個美好的一天！💪"

	embed := discord.Embed{
		Title:       fmt.Sprintf("☀️ 早安保養 — Day %d %s", routine.CycleDay, routine.PhaseLabel),
		Description: msg,
		Color:       discord.ColorCoral,
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

// buildWellnessBlock 取得健康快照、呼叫 Claude、存入 DB、回傳 Discord 區塊文字
func buildWellnessBlock(now time.Time, routine *model.SkincareRoutine) string {
	today := now.Format("2006-01-02")

	// 取得最新健康快照（允許 nil）
	snapshot, err := GetLatestSnapshot()
	if err != nil {
		log.Printf("[Claude] Failed to get health snapshot: %v", err)
	}

	ctx := WellnessContext{
		CycleDay:   routine.CycleDay,
		CyclePhase: routine.Phase,
		PhaseLabel: routine.PhaseLabel,
		Snapshot:   snapshot,
	}

	advice, err := GenerateWellnessAdvice(ctx)
	if err != nil {
		log.Printf("[Claude] Failed to generate wellness advice: %v", err)
		return ""
	}
	if advice == nil {
		return ""
	}

	// 儲存建議至 DB
	rec := &model.WellnessRecommendation{
		Date:           today,
		CyclePhase:     routine.Phase,
		DietAdvice:     advice.DietAdvice,
		ExerciseAdvice: advice.ExerciseAdvice,
		RawResponse:    advice.RawResponse,
	}
	if err := SaveWellnessRecommendation(rec); err != nil {
		log.Printf("[Claude] Failed to save wellness recommendation: %v", err)
	}

	// 組裝 Discord 區塊
	var sb strings.Builder
	sb.WriteString("---\n🥗 **飲食建議**\n")
	sb.WriteString(advice.DietAdvice)
	if advice.ExerciseAdvice != "" {
		sb.WriteString("\n\n🏃 **運動建議**\n")
		sb.WriteString(advice.ExerciseAdvice)
	}
	return sb.String()
}

// --- 保養 PM 提醒 ---

func scanSkincarePM(now time.Time) {
	setting := getSettingOrDefault("SKINCARE_PM", "18:00", 0)
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

	msg := fmt.Sprintf("主人辛苦了～🌙\n\n"+
		"今天是週期第 **%d** 天（%s），晚間保養時間到囉！\n\n"+
		"今晚的保養步驟：\n\n%s",
		routine.CycleDay, routine.PhaseLabel,
		formatStepsChinese(routine.PM))

	if len(routine.Banned) > 0 {
		msg += "\n\n⚠️ 今晚請避開：\n" + formatBannedChinese(routine.Banned)
	}

	msg += "\n\n好好休息，晚安 💤"

	embed := discord.Embed{
		Title:       fmt.Sprintf("🌙 晚安保養 — Day %d %s", routine.CycleDay, routine.PhaseLabel),
		Description: msg,
		Color:       discord.ColorCoral,
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

// GetSkincareRoutineForTest 給測試端點使用（exported）
func GetSkincareRoutineForTest(now time.Time) *model.SkincareRoutine {
	return getSkincareRoutineForNow(now)
}

// SendWellnessAMTestNotification 測試含 AI 建議的早安通知（跳過時間窗口與 dedup）
func SendWellnessAMTestNotification(now time.Time) error {
	routine := getSkincareRoutineForNow(now)
	if routine == nil {
		return fmt.Errorf("cycle not configured")
	}

	msg := fmt.Sprintf("Hi~ 主人早安！☀️\n\n"+
		"今天是週期第 **%d** 天（%s），模式：**%s**\n\n"+
		"起床後先喝杯溫水，接著開始早晨保養：\n\n%s",
		routine.CycleDay, routine.PhaseLabel, routine.Mode,
		formatStepsChinese(routine.AM))

	if len(routine.Banned) > 0 {
		msg += "\n\n⚠️ 今天記得避開：\n" + formatBannedChinese(routine.Banned)
	}

	wellnessBlock := buildWellnessBlock(now, routine)
	if wellnessBlock != "" {
		msg += "\n\n" + wellnessBlock
	}

	msg += "\n\n祝你有個美好的一天！💪"

	embed := discord.Embed{
		Title:       fmt.Sprintf("☀️ 早安保養 — Day %d %s（測試）", routine.CycleDay, routine.PhaseLabel),
		Description: msg,
		Color:       discord.ColorCoral,
		Timestamp:   now.Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "LifeOS Skincare · Test"},
	}

	return sendLifeOSEmbed(embed)
}

// SendSkincareTestNotification 發送測試用 AM+PM 通知（跳過 dedup 和時間窗口）
func SendSkincareTestNotification(now time.Time, routine *model.SkincareRoutine) error {
	// AM
	amMsg := fmt.Sprintf("Hi~ 主人早安！☀️\n\n"+
		"今天是週期第 **%d** 天（%s），模式：**%s**\n\n"+
		"起床後先喝杯溫水，接著開始早晨保養：\n\n%s",
		routine.CycleDay, routine.PhaseLabel, routine.Mode,
		formatStepsChinese(routine.AM))

	if len(routine.Banned) > 0 {
		amMsg += "\n\n⚠️ 今天記得避開：\n" + formatBannedChinese(routine.Banned)
	}
	amMsg += "\n\n祝你有個美好的一天！💪"

	amEmbed := discord.Embed{
		Title:       fmt.Sprintf("☀️ 早安保養 — Day %d %s（測試）", routine.CycleDay, routine.PhaseLabel),
		Description: amMsg,
		Color:       discord.ColorCoral,
		Timestamp:   now.Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "LifeOS Skincare · Test"},
	}

	if err := sendLifeOSEmbed(amEmbed); err != nil {
		return err
	}

	// PM
	pmMsg := fmt.Sprintf("主人辛苦了～🌙\n\n"+
		"今天是週期第 **%d** 天（%s），晚間保養時間到囉！\n\n"+
		"今晚的保養步驟：\n\n%s",
		routine.CycleDay, routine.PhaseLabel,
		formatStepsChinese(routine.PM))

	if len(routine.Banned) > 0 {
		pmMsg += "\n\n⚠️ 今晚請避開：\n" + formatBannedChinese(routine.Banned)
	}
	pmMsg += "\n\n好好休息，晚安 💤"

	pmEmbed := discord.Embed{
		Title:       fmt.Sprintf("🌙 晚安保養 — Day %d %s（測試）", routine.CycleDay, routine.PhaseLabel),
		Description: pmMsg,
		Color:       discord.ColorCoral,
		Timestamp:   now.Format(time.RFC3339),
		Footer:      &discord.EmbedFooter{Text: "LifeOS Skincare · Test"},
	}

	return sendLifeOSEmbed(pmEmbed)
}

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
	routine := GenerateDailySkincare(cycleDay, cycleSetting.CycleLength, now, rules)
	return &routine
}

func formatStepsChinese(steps []model.SkincareStep) string {
	var lines []string
	for i, s := range steps {
		line := fmt.Sprintf("**%d.** %s", i+1, s.Product)
		if len(s.Badges) > 0 {
			line += "（" + strings.Join(s.Badges, "、") + "）"
		}
		if s.Optional {
			line += " _← 可省略_"
		}
		lines = append(lines, line)
	}
	return strings.Join(lines, "\n")
}

func formatBannedChinese(banned []string) string {
	var lines []string
	for _, b := range banned {
		lines = append(lines, "🚫 "+b)
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
