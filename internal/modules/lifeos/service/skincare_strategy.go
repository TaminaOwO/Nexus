package service

import (
	"strings"
	"time"

	"nexus/internal/modules/lifeos/model"
)

// GetDefaultScheduleRules 預設排程規則
func GetDefaultScheduleRules() []model.SkincareScheduleRule {
	return []model.SkincareScheduleRule{
		{ProductKey: "retinol", Phase: "follicular", Weekdays: "Tuesday,Friday", MaxPerWeek: 2, Label: "INNISFREE A醇"},
		{ProductKey: "retinol", Phase: "luteal", Weekdays: "Wednesday", MaxPerWeek: 1, Label: "INNISFREE A醇"},
		{ProductKey: "boj_eye", Phase: "follicular", Weekdays: "Monday,Thursday", MaxPerWeek: 2, Label: "BOJ A醛眼霜"},
		{ProductKey: "boj_eye", Phase: "luteal", Weekdays: "Monday,Friday", MaxPerWeek: 2, Label: "BOJ A醛眼霜"},
		{ProductKey: "stridex", Phase: "follicular", Weekdays: "Wednesday,Saturday", MaxPerWeek: 2, Label: "Stridex"},
		{ProductKey: "stridex", Phase: "ovulation", Weekdays: "Wednesday", MaxPerWeek: 1, Label: "Stridex"},
		{ProductKey: "arencia", Phase: "follicular", Weekdays: "Sunday", MaxPerWeek: 1, Label: "Arencia 麻糬潔顏面膜"},
		{ProductKey: "arencia", Phase: "luteal", Weekdays: "Sunday", MaxPerWeek: 1, Label: "Arencia 麻糬潔顏面膜"},
		{ProductKey: "boj_rice_mask", Phase: "luteal", Weekdays: "Thursday", MaxPerWeek: 1, Label: "BOJ 蜂蜜米飯面膜"},
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
	case cycleDay >= 1 && cycleDay <= 5:
		return "menstrual", "經期", "Rest & Repair"
	case cycleDay >= 6 && cycleDay <= 13:
		return "follicular", "濾泡期", "Glow but Controlled"
	case cycleDay == 14:
		return "ovulation", "排卵期", "Balance"
	case cycleDay >= 15 && cycleDay <= 21:
		return "luteal", "黃體前期", "Calm > Treat"
	default: // 22-28 (or up to cycleLength)
		return "luteal", "黃體後期", "Repair & Restore"
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
		buildOvulation(&routine, weekday, rules)
	case "luteal", "waiting":
		buildLuteal(&routine, cycleDay, weekday, rules)
	}

	return routine
}

// === Base AM / PM Prep Providers ===

func buildBaseAM(r *model.SkincareRoutine) {
	r.AM = append(r.AM, model.SkincareStep{Product: "m̄enom̄eno Sr 集水精華"})
	r.AM = append(r.AM, model.SkincareStep{Product: "TO 多胜肽眼部精華"})
	// Q10 & Sunscreen Optional for going out
	r.AM = append(r.AM, model.SkincareStep{Product: "IRITA Q10 水凝膜", Badges: []string{"出門日", "薄擦"}, Optional: true})
	r.AM = append(r.AM, model.SkincareStep{Product: "BOJ 防曬棒", Badges: []string{"出門日"}, Optional: true})
}

// applyPMCleansing 處理每日的潔膚前置步驟
func applyPMCleansing(r *model.SkincareRoutine, isArencia, isStridex bool) {
	if isArencia {
		r.PM = append(r.PM, model.SkincareStep{Product: "潔膚：Arencia 麻糬潔顏面膜"})
		return // 若有 Arencia 就不加 Medicube Pad
	}

	cleanser := "潔膚：Fc 洗面乳"
	if isStridex {
		r.PM = append(r.PM, model.SkincareStep{Product: cleanser})
	} else {
		r.PM = append(r.PM, model.SkincareStep{Product: cleanser})
		r.PM = append(r.PM, model.SkincareStep{Product: "Medicube Pad", Badges: []string{"若出油"}, Optional: true})
	}
}

// === Menstrual Phase (Day 1-5) — Rest & Repair ===

func buildMenstrual(r *model.SkincareRoutine, cycleDay int, weekday time.Weekday) {
	// AM
	buildBaseAM(r)

	// PM
	applyPMCleansing(r, false, false)

	if cycleDay%3 == 1 { // 每 3 天敷一次面膜 (Day 1, 4)
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Mask", Badges: []string{"每 3 天一次"}})
	}
	r.PM = append(r.PM, model.SkincareStep{Product: "IRITA 保濕修護精萃"})
	r.PM = append(r.PM, model.SkincareStep{Product: "TO 多胜肽眼部精華"})
	r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5 精華乳", Badges: []string{"泛紅乾癢加"}, Optional: true})

	// BANNED
	r.Banned = []string{
		"所有 INNISFREE A醇及A醛",
		"所有酸類（Stridex）",
		"Arencia 麻糬潔顏面膜、BOJ 蜂蜜米飯面膜",
		"所有美容儀",
	}
}

// === Follicular Phase (Day 6-13) — Glow but Controlled ===

func buildFollicular(r *model.SkincareRoutine, weekday time.Weekday, rules []model.SkincareScheduleRule) {
	buildBaseAM(r)

	isRetinol := isScheduledDay(rules, "retinol", "follicular", weekday)
	isBojEye := !isRetinol && isScheduledDay(rules, "boj_eye", "follicular", weekday)
	isStridex := isScheduledDay(rules, "stridex", "follicular", weekday)
	isArencia := !isStridex && !isRetinol && isScheduledDay(rules, "arencia", "follicular", weekday)

	applyPMCleansing(r, isArencia, isStridex)

	// Determine Active PM Step
	if isStridex {
		r.PM = append(r.PM, model.SkincareStep{Product: "Stridex", Badges: []string{"T-Zone, 1 分鐘沖洗"}})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA 保濕修護精萃"})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5 精華乳"})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Q10 水凝膜"})
		r.Banned = append(r.Banned, "今晚水楊酸：禁 Arencia 麻糬潔顏面膜、BOJ 蜂蜜米飯面膜、Torriden 面膜")
	} else if isRetinol {
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA 保濕修護精萃"})
		r.PM = append(r.PM, model.SkincareStep{Product: "INNISFREE A醇", Badges: []string{"Pea Size"}})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5 精華乳"})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Q10 水凝膜"})
		r.Banned = append(r.Banned, "今晚 INNISFREE A醇：禁 BOJ A醛眼霜、美容儀")
	} else if isArencia {
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA 保濕修護精萃"})
		r.PM = append(r.PM, model.SkincareStep{Product: "TO 多胜肽眼部精華"})
		r.PM = append(r.PM, model.SkincareStep{Product: "Torriden 面膜", Optional: true})
		// B5 optional on active days after
		r.Banned = append(r.Banned, "今晚 Arencia 麻糬潔顏面膜：禁 Stridex、INNISFREE A醇")
	} else {
		// Foundation routine with optional device/BOJ
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA 保濕修護精萃"})
		if isBojEye {
			r.PM = append(r.PM, model.SkincareStep{Product: "BOJ A醛眼霜"})
			r.PM = append(r.PM, model.SkincareStep{Product: "BOJ 蜂蜜米飯面膜", Optional: true})
		} else {
			r.PM = append(r.PM, model.SkincareStep{Product: "TO 多胜肽眼部精華 或 BOJ A醛眼霜 (輪替)"})
		}

		r.PM = append(r.PM, model.SkincareStep{Product: "Booster Pro / Medicube Device", Badges: []string{"導入/提拉模式"}, Optional: true})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5 精華乳", Optional: true})
	}
}

// === Ovulation Phase (Day 14) — Balance ===

func buildOvulation(r *model.SkincareRoutine, weekday time.Weekday, rules []model.SkincareScheduleRule) {
	// Structure follows Follicular
	buildFollicular(r, weekday, rules)

	// Add extra note
	r.Banned = append(r.Banned, "★ 排卵期美容儀效果最佳，優先安排提拉模式")
}

// === Luteal Phase (Day 15-28) — Calm > Treat (Split Half 1 and 2) ===

func buildLuteal(r *model.SkincareRoutine, cycleDay int, weekday time.Weekday, rules []model.SkincareScheduleRule) {
	buildBaseAM(r)

	if cycleDay <= 21 {
		// First Half (15-21): Transition, limited actives
		isRetinol := isScheduledDay(rules, "retinol", "luteal", weekday)
		isArencia := !isRetinol && isScheduledDay(rules, "arencia", "luteal", weekday)
		isBojEye := !isRetinol && isScheduledDay(rules, "boj_eye", "luteal", weekday)
		isRiceMask := !isArencia && isScheduledDay(rules, "boj_rice_mask", "luteal", weekday)

		applyPMCleansing(r, isArencia, false) // No stridex in Luteal

		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA 保濕修護精萃"})

		if isArencia {
			r.PM = append(r.PM, model.SkincareStep{Product: "TO 多胜肽眼部精華"}) // skip active eye
			r.PM = append(r.PM, model.SkincareStep{Product: "Torriden 面膜", Optional: true})
			r.Banned = append(r.Banned, "今晚 Arencia 麻糬潔顏面膜：禁 BOJ 蜂蜜米飯面膜")
		} else if isRetinol {
			r.PM = append(r.PM, model.SkincareStep{Product: "INNISFREE A醇", Badges: []string{"1x/週 限定"}})
			r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5 精華乳"})
			r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Q10 水凝膜"})
			r.Banned = append(r.Banned, "今晚 INNISFREE A醇：禁 BOJ A醛、美容儀")
		} else {
			if isBojEye {
				r.PM = append(r.PM, model.SkincareStep{Product: "BOJ A醛眼霜"})
			} else {
				r.PM = append(r.PM, model.SkincareStep{Product: "TO 多胜肽眼部精華 或 BOJ A醛眼霜"})
			}

			if isRiceMask {
				r.PM = append(r.PM, model.SkincareStep{Product: "BOJ 蜂蜜米飯面膜"})
			}
			r.PM = append(r.PM, model.SkincareStep{Product: "Medicube Device", Badges: []string{"非活性日可使用"}, Optional: true})
			r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5 精華乳", Badges: []string{"常備"}})
		}

		r.Banned = append(r.Banned, "黃體期全面禁用 Stridex")

	} else {
		// Second Half (22-28): Full Repair
		applyPMCleansing(r, false, false)

		if cycleDay%3 == 1 { // 每 3 天一次面膜
			r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Mask", Badges: []string{"每 3 天一次"}})
		}

		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA 保濕修護精萃"})
		r.PM = append(r.PM, model.SkincareStep{Product: "TO 多胜肽眼部精華"})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5 精華乳"})

		banned := []string{
			"Stridex、INNISFREE A醇、Arencia 麻糬潔顏面膜",
			"BOJ 蜂蜜米飯面膜",
			"所有美容儀",
		}
		if cycleDay >= 26 {
			banned = append(banned, "BOJ A醛眼霜 (Day 26+ 停用)")
		}
		r.Banned = append(r.Banned, banned...)
	}

	// Always Banned
	r.Banned = append(r.Banned, "Orange Oil", "Overnight Masks")
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
