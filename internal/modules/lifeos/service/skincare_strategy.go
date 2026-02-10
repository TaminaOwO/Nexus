package service

import (
	"time"

	"nexus/internal/modules/lifeos/model"
)

// DeterminePhase 根據 cycleDay 判斷週期階段
func DeterminePhase(cycleDay int) (phase, phaseLabel, mode string) {
	switch {
	case cycleDay >= 1 && cycleDay <= 7:
		return "menstrual", "經期", "Rest & Repair"
	case cycleDay >= 8 && cycleDay <= 14:
		return "follicular", "濾泡期", "Glow but Controlled"
	case cycleDay >= 15 && cycleDay <= 16:
		return "ovulation", "排卵期", "Balance"
	default: // 17-28
		return "luteal", "黃體期", "Calm > Treat"
	}
}

// CalculateCycleDay 計算今天是週期第幾天
func CalculateCycleDay(cycleStartDate string, cycleLength int, targetDate time.Time) int {
	start, err := time.Parse("2006-01-02", cycleStartDate)
	if err != nil {
		return 1
	}

	days := int(targetDate.Sub(start).Hours()/24) + 1 // Day 1 = start date
	if days <= 0 {
		// 目標日期在起始日之前，往回推算
		days = cycleLength - ((-days) % cycleLength)
		if days == 0 {
			days = cycleLength
		}
		return days
	}

	day := ((days - 1) % cycleLength) + 1
	return day
}

// GenerateDailySkincare 產生單日保養建議
func GenerateDailySkincare(cycleDay int, targetDate time.Time) model.SkincareRoutine {
	phase, phaseLabel, mode := DeterminePhase(cycleDay)
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
		buildFollicular(&routine, weekday)
	case "ovulation":
		buildOvulation(&routine, weekday)
	case "luteal":
		buildLuteal(&routine, weekday)
	}

	return routine
}

// === Menstrual Phase (Day 1-7) — Rest & Repair ===

func buildMenstrual(r *model.SkincareRoutine, cycleDay int, weekday time.Weekday) {
	// AM
	r.AM = append(r.AM, model.SkincareStep{Product: "Medicube Pad", Optional: true})
	r.AM = append(r.AM, model.SkincareStep{Product: "TO Multi-Peptide Eye Serum"})
	r.AM = append(r.AM, model.SkincareStep{Product: "IRITA Essence"})
	r.AM = append(r.AM, model.SkincareStep{Product: "IRITA B5 / Lotion"})

	// PM
	if cycleDay%3 == 1 { // 每 3 天敷一次面膜 (Day 1, 4, 7)
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Mask", Badge: "每 3 天一次"})
	}
	r.PM = append(r.PM, model.SkincareStep{Product: "TO Multi-Peptide Eye Serum"})
	r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Essence"})
	r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5"})

	// BANNED
	r.Banned = []string{
		"所有 Retinol（Innisfree Retinol、BoJ Retinal Eye）",
		"所有酸類（Stridex）",
		"所有儀器（Booster Pro、Medicube Device）",
	}
}

// === Follicular Phase (Day 8-14) — Glow but Controlled ===

func buildFollicular(r *model.SkincareRoutine, weekday time.Weekday) {
	isRetinolNight := weekday == time.Tuesday || weekday == time.Friday

	// AM
	r.AM = append(r.AM, model.SkincareStep{Product: "Menomeno B3"})
	r.AM = append(r.AM, model.SkincareStep{Product: "TO Multi-Peptide Eye Serum"})
	r.AM = append(r.AM, model.SkincareStep{Product: "IRITA Lotion", Badge: "薄擦"})

	// PM
	if isRetinolNight {
		// Retinol nights (Tue/Fri) — max 2x/week
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Essence"})
		r.PM = append(r.PM, model.SkincareStep{Product: "Innisfree Retinol", Badge: "Pea Size"})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5"})
		// BoJ Retinal Eye 不可與 Face Retinol 同晚
		r.Banned = append(r.Banned, "🚫 今晚使用 Retinol — 禁用儀器、禁用 BoJ Retinal Eye")
	} else {
		// Non-retinol nights
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Essence"})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5"})
		r.PM = append(r.PM, model.SkincareStep{Product: "Booster Pro + Essence", Badge: "導入模式", Optional: true})
		// BoJ Retinal Eye 可在非 Retinol 晚使用（上限 2 晚/週，建議 Mon/Thu）
		if weekday == time.Monday || weekday == time.Thursday {
			r.PM = append(r.PM, model.SkincareStep{Product: "BoJ Retinal Eye", Badge: "限 2 晚/週", Optional: true})
		}
	}
}

// === Ovulation Phase (Day 15-16) — Balance ===

func buildOvulation(r *model.SkincareRoutine, weekday time.Weekday) {
	// AM
	r.AM = append(r.AM, model.SkincareStep{Product: "Medicube Pad", Badge: "T-Zone Only"})
	r.AM = append(r.AM, model.SkincareStep{Product: "Menomeno B3"})
	r.AM = append(r.AM, model.SkincareStep{Product: "IRITA Lotion"})

	// PM — Stridex 僅使用一次（排卵期第一天）
	isStridexDay := weekday != time.Sunday // 排卵期內任一天，避開週日
	if isStridexDay {
		r.PM = append(r.PM, model.SkincareStep{
			Product: "Stridex",
			Badge:   "⚠️ T-Zone Only, 1 分鐘後沖洗",
		})
	}
	r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Essence"})
	r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5"})

	// BANNED
	r.Banned = []string{
		"Torriden Mask（不可與 Stridex 混用）",
		"所有 Retinol",
		"所有儀器",
	}
}

// === Luteal Phase (Day 17-28) — Calm > Treat ===

func buildLuteal(r *model.SkincareRoutine, weekday time.Weekday) {
	isRetinolNight := weekday == time.Wednesday

	// AM
	r.AM = append(r.AM, model.SkincareStep{Product: "Menomeno B3"})
	r.AM = append(r.AM, model.SkincareStep{Product: "TO Multi-Peptide Eye Serum"})
	r.AM = append(r.AM, model.SkincareStep{Product: "IRITA B5"})

	// PM
	if isRetinolNight {
		// Retinol night (Wed only) — max 1x/week
		r.PM = append(r.PM, model.SkincareStep{Product: "Innisfree Retinol", Badge: "1x/週 限定"})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5"})
		r.Banned = append(r.Banned, "🚫 今晚使用 Retinol — 禁用儀器、禁用 BoJ Retinal Eye")
	} else {
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA Essence"})
		r.PM = append(r.PM, model.SkincareStep{Product: "IRITA B5"})

		// Medicube Device 可在非 Retinol 晚使用
		r.PM = append(r.PM, model.SkincareStep{
			Product:  "Medicube Device",
			Badge:    "Derma Shot / MC Mode Only — No Induction",
			Optional: true,
		})

		// BoJ Retinal Eye 可在非 Retinol 晚使用（限 2 晚/週，建議 Mon/Fri）
		if weekday == time.Monday || weekday == time.Friday {
			r.PM = append(r.PM, model.SkincareStep{Product: "BoJ Retinal Eye", Badge: "限 2 晚/週", Optional: true})
		}
	}

	// 全期 BANNED
	r.Banned = append(r.Banned, "❌ No Stridex（黃體期禁用酸類）")
	r.Banned = append(r.Banned, "❌ Orange Oil")
	r.Banned = append(r.Banned, "❌ Overnight Masks")
}

// GenerateWeeklySkincare 產生本週 7 天保養排程
func GenerateWeeklySkincare(cycleStartDate string, cycleLength int, today time.Time) []model.SkincareRoutine {
	routines := make([]model.SkincareRoutine, 7)
	for i := 0; i < 7; i++ {
		targetDate := today.AddDate(0, 0, i)
		cycleDay := CalculateCycleDay(cycleStartDate, cycleLength, targetDate)
		routines[i] = GenerateDailySkincare(cycleDay, targetDate)
	}
	return routines
}
