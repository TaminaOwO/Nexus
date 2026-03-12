package service

import "nexus/internal/modules/lifeos/model"

// RuleFlag represents a triggered health rule with its metadata.
type RuleFlag struct {
	RuleID   string `json:"rule_id"`
	Message  string `json:"message"`
	Severity string `json:"severity"` // "high" | "medium" | "low"
}

// EvaluateRules evaluates today's health snapshot, computed stats summary,
// and recent snapshots against 8 hard-coded health rules.
// Returns a slice of triggered RuleFlags (empty if none triggered).
func EvaluateRules(today *model.HealthSnapshot, stats HealthStatsSummary, recentSnapshots []model.HealthSnapshot) []RuleFlag {
	if today == nil {
		return nil
	}

	var flags []RuleFlag

	// Rule 1: deep_sleep_insufficient
	if today.DeepSleepHours != nil && *today.DeepSleepHours < 1.0 {
		flags = append(flags, RuleFlag{
			RuleID:   "deep_sleep_insufficient",
			Message:  "深睡不足（< 1 小時），不建議高強度訓練",
			Severity: "high",
		})
	}

	// Rule 2: respiratory_rate_spike
	if today.RespiratoryRate != nil && stats.RespiratoryRate.Mean7d != nil &&
		*today.RespiratoryRate > *stats.RespiratoryRate.Mean7d+2.0 {
		flags = append(flags, RuleFlag{
			RuleID:   "respiratory_rate_spike",
			Message:  "呼吸率異常偏高，可能發炎或過度訓練",
			Severity: "high",
		})
	}

	// Rule 3: chronic_sleep_deficit — all of the most recent 3 snapshots have sleep < 6hr
	if len(recentSnapshots) >= 3 {
		window := recentSnapshots[:3]
		allDeficit := true
		for _, s := range window {
			if s.SleepHours == nil || *s.SleepHours >= 6.0 {
				allDeficit = false
				break
			}
		}
		if allDeficit {
			flags = append(flags, RuleFlag{
				RuleID:   "chronic_sleep_deficit",
				Message:  "連續 3 天睡眠不足 6 小時，累積疲勞風險",
				Severity: "high",
			})
		}
	}

	// Rule 4: hrv_declining — 7d mean < 30d mean * 0.85
	if stats.HRV.Mean7d != nil && stats.HRV.Mean30d != nil &&
		*stats.HRV.Mean7d < *stats.HRV.Mean30d*0.85 {
		flags = append(flags, RuleFlag{
			RuleID:   "hrv_declining",
			Message:  "HRV 7 日均值較 30 日下降超過 15%，自律神經壓力",
			Severity: "medium",
		})
	}

	// Rule 5: low_mood
	if today.MoodScore != nil && *today.MoodScore < 3.0 {
		flags = append(flags, RuleFlag{
			RuleID:   "low_mood",
			Message:  "心理狀態低落，建議輕量活動與自我關注",
			Severity: "medium",
		})
	}

	// Rule 6: elevated_temperature
	if today.WristTempDeviation != nil && *today.WristTempDeviation > 0.5 {
		flags = append(flags, RuleFlag{
			RuleID:   "elevated_temperature",
			Message:  "體溫偏高，可能免疫系統運作中",
			Severity: "medium",
		})
	}

	// Rule 7: vo2_max_declining
	if stats.VO2Max.Trend7d == "declining" {
		flags = append(flags, RuleFlag{
			RuleID:   "vo2_max_declining",
			Message:  "有氧適能下降趨勢，檢視 Zone 2 訓練量",
			Severity: "low",
		})
	}

	// Rule 8: weight_trending_up — both weight and body fat rising
	if stats.Weight.Trend7d == "rising" && stats.BodyFat.Trend7d == "rising" {
		flags = append(flags, RuleFlag{
			RuleID:   "weight_trending_up",
			Message:  "體重與體脂同步上升趨勢",
			Severity: "low",
		})
	}

	return flags
}
