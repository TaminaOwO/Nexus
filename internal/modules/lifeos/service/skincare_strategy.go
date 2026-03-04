package service

import (
	"strings"
	"time"

	"nexus/internal/modules/lifeos/model"
)

// GetDefaultScheduleRules 預設排程規則
func GetDefaultScheduleRules() []model.SkincareScheduleRule {
	return []model.SkincareScheduleRule{
		{ProductKey: "retinol", Phase: "follicular", Weekdays: "Tuesday,Friday", MaxPerWeek: 2, Label: "A醇"},
		{ProductKey: "retinol", Phase: "luteal", Weekdays: "Wednesday", MaxPerWeek: 1, Label: "A醇"},
		{ProductKey: "boj_eye", Phase: "follicular", Weekdays: "Monday,Thursday", MaxPerWeek: 2, Label: "BOJ A醛"},
		{ProductKey: "boj_eye", Phase: "luteal", Weekdays: "Monday,Friday", MaxPerWeek: 2, Label: "BOJ A醛"},
	}
}

// isScheduledDay 檢查當天是否為某產品的排程日
func isScheduledDay(rules []model.SkincareScheduleRule, productKey, phase string, weekday time.Weekday) bool {
	for _, rule := range rules {
		if rule.ProductKey == productKey && rule.Phase == phase {
			return containsWeekday(rule.Weekdays, weekday)
		}
	}
	// 無自訂規則 → fallback 預設
	for _, rule := range GetDefaultScheduleRules() {
		if rule.ProductKey == productKey && rule.Phase == phase {
			return containsWeekday(rule.Weekdays, weekday)
		}
	}
	return false
}

func containsWeekday(weekdays string, weekday time.Weekday) bool {
	for _, d := range strings.Split(weekdays, ",") {
		if strings.TrimSpace(d) == weekday.String() {
			return true
		}
	}
	return false
}

// DeterminePhase 根據 cycleDay 判斷週期階段
func DeterminePhase(cycleDay int, cycleLength int) (phase, phaseLabel, mode string) {
	if cycleDay > cycleLength {
		return "waiting", "等候期 (延遲中)", "Calm & Balance"
	}
	switch {
	case cycleDay >= 1 && cycleDay <= 7:
		return "menstrual", "經期", "Rest & Repair"
	case cycleDay >= 8 && cycleDay <= 14:
		return "follicular", "濾泡期", "Glow but Controlled"
	case cycleDay >= 15 && cycleDay <= 16:
		return "ovulation", "排卵期", "Balance"
	default: // 17-28 (or up to cycleLength)
		return "luteal", "黃體期", "Calm > Treat"
	}
}

// CalculateCycleDay 計算今天是週期第幾天 (不自動循環，由確定階段處裡延遲)
func CalculateCycleDay(cycleStartDate string, cycleLength int, targetDate time.Time) int {
	// Parse the start date as local time to match the targetDate's location consistently,
	// because Date strings "YYYY-MM-DD" from frontend means local date.
	loc := targetDate.Location()
	start, err := time.ParseInLocation("2006-01-02", cycleStartDate, loc)
	if err != nil {
		return 1
	}

	// Calculate days difference strictly based on calendar days in the target location
	targetYear, targetMonth, targetDay := targetDate.Date()
	targetMidnight := time.Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0, loc)

	startYear, startMonth, startDay := start.Date()
	startMidnight := time.Date(startYear, startMonth, startDay, 0, 0, 0, 0, loc)

	days := int(targetMidnight.Sub(startMidnight).Hours()/24) + 1 // Day 1 = start date
	if days <= 0 {
		return 1
	}

	return days
}

// GenerateDailySkincare 產生單日保養建議
func GenerateDailySkincare(cycleDay int, cycleLength int, targetDate time.Time, rules []model.SkincareScheduleRule) model.SkincareRoutine {
	phase, phaseLabel, mode := DeterminePhase(cycleDay, cycleLength)
	weekday := targetDate.Weekday()

	routine := model.SkincareRoutine{
		CycleDay:   cycleDay,
		Phase:      phase,
		PhaseLabel: phaseLabel,
		Mode:       mode,
		DayOfWeek:  weekday.String(),
		Date:       targetDate.Format("2006-01-02"),
		AM:         []model.SkincareStep{},
		PM:         []model.SkincareStep{},
		Banned:     []string{},
	}

	switch phase {
	case "menstrual":
		buildMenstrual(&routine, cycleDay, weekday)
	case "follicular":
		buildFollicular(&routine, weekday, rules)
	case "ovulation":
		buildOvulation(&routine, weekday)
	case "luteal", "waiting":
		buildLuteal(&routine, weekday, rules)
	}

	return routine
}

// === Menstrual Phase (Day 1-7) — Rest & Repair ===

func buildMenstrual(r *model.SkincareRoutine, cycleDay int, weekday time.Weekday) {
	// AM
	r.AM = append(r.AM, model.SkincareStep{Product: "Medicube Pad", Optional: true})
	r.AM = append(r.AM, model.SkincareStep{Product: "TO Multi-Peptide Eye Serum"})
	r.AM = append(r.AM, model.SkincareStep{Product: "保濕修護精萃"})
	r.AM = append(r.AM, model.SkincareStep{Product: "B5水潤修護精華乳 / Q10全效保濕水凝膜"})

	// PM
	if cycleDay%3 == 1 { // 每 3 天敷一次面膜 (Day 1, 4, 7)
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Mask", Badge: "每 3 天一次"})
	}
	r.PM = append(r.PM, model.SkincareStep{Product: "TO Multi-Peptide Eye Serum"})
	r.PM = append(r.PM, model.SkincareStep{Product: "保濕修護精萃"})
	r.PM = append(r.PM, model.SkincareStep{Product: "B5水潤修護精華乳"})

	// BANNED
	r.Banned = []string{
		"所有 A醇（A醇、BOJ A醛）",
		"所有酸類（Stridex）",
		"所有儀器（Booster Pro、Medicube Device）",
	}
}

// === Follicular Phase (Day 8-14) — Glow but Controlled ===

func buildFollicular(r *model.SkincareRoutine, weekday time.Weekday, rules []model.SkincareScheduleRule) {
	isRetinolNight := isScheduledDay(rules, "retinol", "follicular", weekday)
	isBojNight := !isRetinolNight && isScheduledDay(rules, "boj_eye", "follicular", weekday)

	// AM
	r.AM = append(r.AM, model.SkincareStep{Product: "Sr 專業集水精華"})
	r.AM = append(r.AM, model.SkincareStep{Product: "TO Multi-Peptide Eye Serum"})
	r.AM = append(r.AM, model.SkincareStep{Product: "Q10全效保濕水凝膜", Badge: "薄擦"})

	// PM
	if isRetinolNight {
		r.PM = append(r.PM, model.SkincareStep{Product: "保濕修護精萃"})
		r.PM = append(r.PM, model.SkincareStep{Product: "A醇", Badge: "Pea Size"})
		r.PM = append(r.PM, model.SkincareStep{Product: "B5水潤修護精華乳"})
		r.Banned = append(r.Banned, "今晚使用 A醇 — 禁用儀器、禁用 BOJ A醛")
	} else {
		r.PM = append(r.PM, model.SkincareStep{Product: "保濕修護精萃"})
		r.PM = append(r.PM, model.SkincareStep{Product: "B5水潤修護精華乳"})
		r.PM = append(r.PM, model.SkincareStep{Product: "Booster Pro + Essence", Badge: "導入模式", Optional: true})
		if isBojNight {
			r.PM = append(r.PM, model.SkincareStep{Product: "BOJ A醛", Badge: "限 2 晚/週", Optional: true})
		}
	}
}

// === Ovulation Phase (Day 15-16) — Balance ===

func buildOvulation(r *model.SkincareRoutine, weekday time.Weekday) {
	// AM
	r.AM = append(r.AM, model.SkincareStep{Product: "Medicube Pad", Badge: "T-Zone Only"})
	r.AM = append(r.AM, model.SkincareStep{Product: "Sr 專業集水精華"})
	r.AM = append(r.AM, model.SkincareStep{Product: "Q10全效保濕水凝膜"})

	// PM
	isStridexDay := weekday != time.Sunday
	if isStridexDay {
		r.PM = append(r.PM, model.SkincareStep{
			Product: "Stridex",
			Badge:   "T-Zone, 1 分鐘沖洗",
		})
	}
	r.PM = append(r.PM, model.SkincareStep{Product: "保濕修護精萃"})
	r.PM = append(r.PM, model.SkincareStep{Product: "B5水潤修護精華乳"})

	// BANNED
	r.Banned = []string{
		"Torriden Mask（不可與 Stridex 混用）",
		"所有 A醇",
		"所有儀器",
	}
}

// === Luteal Phase (Day 17-28) — Calm > Treat ===

func buildLuteal(r *model.SkincareRoutine, weekday time.Weekday, rules []model.SkincareScheduleRule) {
	isRetinolNight := isScheduledDay(rules, "retinol", "luteal", weekday)
	isBojNight := !isRetinolNight && isScheduledDay(rules, "boj_eye", "luteal", weekday)

	// AM
	r.AM = append(r.AM, model.SkincareStep{Product: "Sr 專業集水精華"})
	r.AM = append(r.AM, model.SkincareStep{Product: "TO Multi-Peptide Eye Serum"})
	r.AM = append(r.AM, model.SkincareStep{Product: "B5水潤修護精華乳"})

	// PM
	if isRetinolNight {
		r.PM = append(r.PM, model.SkincareStep{Product: "A醇", Badge: "1x/週 限定"})
		r.PM = append(r.PM, model.SkincareStep{Product: "B5水潤修護精華乳"})
		r.Banned = append(r.Banned, "今晚使用 A醇 — 禁用儀器、禁用 BOJ A醛")
	} else {
		r.PM = append(r.PM, model.SkincareStep{Product: "保濕修護精萃"})
		r.PM = append(r.PM, model.SkincareStep{Product: "B5水潤修護精華乳"})
		r.PM = append(r.PM, model.SkincareStep{
			Product:  "Medicube Device",
			Badge:    "Derma Shot / MC Mode",
			Optional: true,
		})
		if isBojNight {
			r.PM = append(r.PM, model.SkincareStep{Product: "BOJ A醛", Badge: "限 2 晚/週", Optional: true})
		}
	}

	// 全期 BANNED
	r.Banned = append(r.Banned, "No Stridex（黃體期禁用酸類）")
	r.Banned = append(r.Banned, "Orange Oil")
	r.Banned = append(r.Banned, "Overnight Masks")
}

// GenerateWeeklySkincare 產生本週 7 天保養排程
func GenerateWeeklySkincare(cycleStartDate string, cycleLength int, today time.Time, rules []model.SkincareScheduleRule) []model.SkincareRoutine {
	routines := make([]model.SkincareRoutine, 7)
	for i := 0; i < 7; i++ {
		targetDate := today.AddDate(0, 0, i)
		cycleDay := CalculateCycleDay(cycleStartDate, cycleLength, targetDate)
		routines[i] = GenerateDailySkincare(cycleDay, cycleLength, targetDate, rules)
	}
	return routines
}
