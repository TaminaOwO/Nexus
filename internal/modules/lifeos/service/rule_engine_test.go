package service

import (
	"testing"

	"nexus/internal/modules/lifeos/model"

	"github.com/stretchr/testify/assert"
)

func floatPtr(v float64) *float64 { return &v }

// Test 1: nil today → empty flags
func TestRuleEngine_NilToday(t *testing.T) {
	flags := EvaluateRules(nil, HealthStatsSummary{}, nil)
	assert.Empty(t, flags)
}

// Test 2: deep sleep = 0.5 → triggered
func TestRuleEngine_DeepSleepInsufficient(t *testing.T) {
	snap := &model.HealthSnapshot{DeepSleepHours: floatPtr(0.5)}
	flags := EvaluateRules(snap, HealthStatsSummary{}, nil)
	assertHasRule(t, flags, "deep_sleep_insufficient", "high")
}

// Test 3: deep sleep = 1.5 → NOT triggered
func TestRuleEngine_DeepSleepSufficient(t *testing.T) {
	snap := &model.HealthSnapshot{DeepSleepHours: floatPtr(1.5)}
	flags := EvaluateRules(snap, HealthStatsSummary{}, nil)
	assertNoRule(t, flags, "deep_sleep_insufficient")
}

// Test 4: respiratory rate spike (today=18, 7d mean=14) → triggered
func TestRuleEngine_RespiratoryRateSpike(t *testing.T) {
	snap := &model.HealthSnapshot{RespiratoryRate: floatPtr(18)}
	stats := HealthStatsSummary{
		RespiratoryRate: MetricStats{Mean7d: floatPtr(14)},
	}
	flags := EvaluateRules(snap, stats, nil)
	assertHasRule(t, flags, "respiratory_rate_spike", "high")
}

// Test 5: respiratory rate normal (today=15, 7d mean=14) → NOT triggered
func TestRuleEngine_RespiratoryRateNormal(t *testing.T) {
	snap := &model.HealthSnapshot{RespiratoryRate: floatPtr(15)}
	stats := HealthStatsSummary{
		RespiratoryRate: MetricStats{Mean7d: floatPtr(14)},
	}
	flags := EvaluateRules(snap, stats, nil)
	assertNoRule(t, flags, "respiratory_rate_spike")
}

// Test 6: chronic sleep deficit — 3 consecutive days < 6hr → triggered
func TestRuleEngine_ChronicSleepDeficit(t *testing.T) {
	snap := &model.HealthSnapshot{SleepHours: floatPtr(5.0)}
	recent := []model.HealthSnapshot{
		{SleepHours: floatPtr(5.5)},
		{SleepHours: floatPtr(4.0)},
		{SleepHours: floatPtr(5.0)},
	}
	flags := EvaluateRules(snap, HealthStatsSummary{}, recent)
	assertHasRule(t, flags, "chronic_sleep_deficit", "high")
}

// Test 7: chronic sleep — only 2 days < 6hr → NOT triggered
func TestRuleEngine_ChronicSleepNotEnough(t *testing.T) {
	snap := &model.HealthSnapshot{SleepHours: floatPtr(7.0)}
	recent := []model.HealthSnapshot{
		{SleepHours: floatPtr(5.5)},
		{SleepHours: floatPtr(4.0)},
		{SleepHours: floatPtr(7.0)},
	}
	flags := EvaluateRules(snap, HealthStatsSummary{}, recent)
	assertNoRule(t, flags, "chronic_sleep_deficit")
}

// Test 8: HRV declining (7d=35, 30d=50 → 30% drop) → triggered
func TestRuleEngine_HRVDeclining(t *testing.T) {
	snap := &model.HealthSnapshot{}
	stats := HealthStatsSummary{
		HRV: MetricStats{Mean7d: floatPtr(35), Mean30d: floatPtr(50)},
	}
	flags := EvaluateRules(snap, stats, nil)
	assertHasRule(t, flags, "hrv_declining", "medium")
}

// Test 9: HRV stable (7d=48, 30d=50) → NOT triggered
func TestRuleEngine_HRVStable(t *testing.T) {
	snap := &model.HealthSnapshot{}
	stats := HealthStatsSummary{
		HRV: MetricStats{Mean7d: floatPtr(48), Mean30d: floatPtr(50)},
	}
	flags := EvaluateRules(snap, stats, nil)
	assertNoRule(t, flags, "hrv_declining")
}

// Test 10: low mood (score=2) → triggered
func TestRuleEngine_LowMood(t *testing.T) {
	snap := &model.HealthSnapshot{MoodScore: floatPtr(2)}
	flags := EvaluateRules(snap, HealthStatsSummary{}, nil)
	assertHasRule(t, flags, "low_mood", "medium")
}

// Test 11: elevated temp (deviation=0.8) → triggered
func TestRuleEngine_ElevatedTemp(t *testing.T) {
	snap := &model.HealthSnapshot{WristTempDeviation: floatPtr(0.8)}
	flags := EvaluateRules(snap, HealthStatsSummary{}, nil)
	assertHasRule(t, flags, "elevated_temperature", "medium")
}

// Test 12: VO2 max declining trend → triggered
func TestRuleEngine_VO2MaxDeclining(t *testing.T) {
	snap := &model.HealthSnapshot{}
	stats := HealthStatsSummary{
		VO2Max: MetricStats{Trend7d: "declining"},
	}
	flags := EvaluateRules(snap, stats, nil)
	assertHasRule(t, flags, "vo2_max_declining", "low")
}

// Test 13: weight + body fat both rising → triggered
func TestRuleEngine_WeightAndBodyFatRising(t *testing.T) {
	snap := &model.HealthSnapshot{}
	stats := HealthStatsSummary{
		Weight:  MetricStats{Trend7d: "rising"},
		BodyFat: MetricStats{Trend7d: "rising"},
	}
	flags := EvaluateRules(snap, stats, nil)
	assertHasRule(t, flags, "weight_trending_up", "low")
}

// Test 14: weight rising but body fat stable → NOT triggered
func TestRuleEngine_WeightRisingBodyFatStable(t *testing.T) {
	snap := &model.HealthSnapshot{}
	stats := HealthStatsSummary{
		Weight:  MetricStats{Trend7d: "rising"},
		BodyFat: MetricStats{Trend7d: "stable"},
	}
	flags := EvaluateRules(snap, stats, nil)
	assertNoRule(t, flags, "weight_trending_up")
}

// Test 15: multiple rules triggered simultaneously
func TestRuleEngine_MultipleRules(t *testing.T) {
	snap := &model.HealthSnapshot{
		DeepSleepHours:     floatPtr(0.5),
		MoodScore:          floatPtr(1),
		WristTempDeviation: floatPtr(0.9),
	}
	stats := HealthStatsSummary{
		VO2Max: MetricStats{Trend7d: "declining"},
	}
	flags := EvaluateRules(snap, stats, nil)
	assert.Len(t, flags, 4)
	assertHasRule(t, flags, "deep_sleep_insufficient", "high")
	assertHasRule(t, flags, "low_mood", "medium")
	assertHasRule(t, flags, "elevated_temperature", "medium")
	assertHasRule(t, flags, "vo2_max_declining", "low")
}

// --- helpers ---

func assertHasRule(t *testing.T, flags []RuleFlag, ruleID, severity string) {
	t.Helper()
	for _, f := range flags {
		if f.RuleID == ruleID {
			assert.Equal(t, severity, f.Severity, "rule %s severity mismatch", ruleID)
			assert.NotEmpty(t, f.Message, "rule %s should have a message", ruleID)
			return
		}
	}
	t.Errorf("expected rule %s to be triggered, but it was not. flags: %+v", ruleID, flags)
}

func assertNoRule(t *testing.T, flags []RuleFlag, ruleID string) {
	t.Helper()
	for _, f := range flags {
		if f.RuleID == ruleID {
			t.Errorf("expected rule %s NOT to be triggered, but it was", ruleID)
			return
		}
	}
}
