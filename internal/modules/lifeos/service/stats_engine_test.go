package service

import (
	"math"
	"testing"

	"nexus/internal/modules/lifeos/model"
)

func f64(v float64) *float64 { return &v }

func assertNilFloat(t *testing.T, name string, v *float64) {
	t.Helper()
	if v != nil {
		t.Errorf("%s: expected nil, got %f", name, *v)
	}
}

func assertFloat(t *testing.T, name string, v *float64, expected float64, epsilon float64) {
	t.Helper()
	if v == nil {
		t.Errorf("%s: expected %f, got nil", name, expected)
		return
	}
	if math.Abs(*v-expected) > epsilon {
		t.Errorf("%s: expected %f, got %f (epsilon %f)", name, expected, *v, epsilon)
	}
}

func assertTrend(t *testing.T, name string, got string, expected string) {
	t.Helper()
	if got != expected {
		t.Errorf("%s trend: expected %q, got %q", name, expected, got)
	}
}

// Test 1: Empty snapshots → all nil means, "insufficient_data" trends
func TestStatsEngine_EmptySnapshots(t *testing.T) {
	stats := ComputeStatsSummary(nil)

	assertNilFloat(t, "SleepHours.Mean7d", stats.SleepHours.Mean7d)
	assertNilFloat(t, "SleepHours.Mean30d", stats.SleepHours.Mean30d)
	assertNilFloat(t, "SleepHours.StdDev7d", stats.SleepHours.StdDev7d)
	assertTrend(t, "SleepHours", stats.SleepHours.Trend7d, "insufficient_data")

	assertNilFloat(t, "HRV.Mean7d", stats.HRV.Mean7d)
	assertTrend(t, "HRV", stats.HRV.Trend7d, "insufficient_data")
	assertTrend(t, "Weight", stats.Weight.Trend7d, "insufficient_data")
	assertTrend(t, "VO2Max", stats.VO2Max.Trend7d, "insufficient_data")
}

// Test 2: Single snapshot → means computed, stddev=0 (1 value), "insufficient_data" trend
func TestStatsEngine_SingleSnapshot(t *testing.T) {
	snapshots := []model.HealthSnapshot{
		{SleepHours: f64(7.5), HRV: f64(45.0)},
	}
	stats := ComputeStatsSummary(snapshots)

	assertFloat(t, "SleepHours.Mean7d", stats.SleepHours.Mean7d, 7.5, 0.001)
	assertFloat(t, "SleepHours.Mean30d", stats.SleepHours.Mean30d, 7.5, 0.001)
	assertTrend(t, "SleepHours", stats.SleepHours.Trend7d, "insufficient_data")
	assertFloat(t, "HRV.Mean7d", stats.HRV.Mean7d, 45.0, 0.001)
}

// Test 3: 7 snapshots with known sleep_hours → verify mean, stddev
func TestStatsEngine_SevenSnapshots_MeanStdDev(t *testing.T) {
	// Values: 7, 8, 6, 7, 8, 9, 7 → mean=52/7≈7.4286, stddev=sqrt(var)
	// var = ((7-7.4286)^2 + (8-7.4286)^2 + (6-7.4286)^2 + (7-7.4286)^2 + (8-7.4286)^2 + (9-7.4286)^2 + (7-7.4286)^2) / 7
	// = (0.1837 + 0.3265 + 2.0408 + 0.1837 + 0.3265 + 2.4694 + 0.1837) / 7
	// = 5.7143 / 7 = 0.8163
	// stddev = sqrt(0.8163) ≈ 0.9035
	vals := []float64{7, 8, 6, 7, 8, 9, 7}
	snapshots := make([]model.HealthSnapshot, 7)
	// DESC order: index 0 = most recent
	for i := 0; i < 7; i++ {
		snapshots[i] = model.HealthSnapshot{SleepHours: f64(vals[i])}
	}

	stats := ComputeStatsSummary(snapshots)
	assertFloat(t, "SleepHours.Mean7d", stats.SleepHours.Mean7d, 52.0/7.0, 0.001)
	assertFloat(t, "SleepHours.Mean30d", stats.SleepHours.Mean30d, 52.0/7.0, 0.001)
	assertFloat(t, "SleepHours.StdDev7d", stats.SleepHours.StdDev7d, 0.9035, 0.01)
}

// Test 4: Rising trend — recent values higher than older values
func TestStatsEngine_RisingTrend(t *testing.T) {
	// DESC order: index 0 = most recent
	// Recent half (index 0-2): 10, 10, 10 → mean=10
	// Older half (index 3-6):  5, 5, 5, 5 → mean=5
	// 10 > 5*1.05=5.25 → rising
	snapshots := []model.HealthSnapshot{
		{SleepHours: f64(10)},
		{SleepHours: f64(10)},
		{SleepHours: f64(10)},
		{SleepHours: f64(5)},
		{SleepHours: f64(5)},
		{SleepHours: f64(5)},
		{SleepHours: f64(5)},
	}
	stats := ComputeStatsSummary(snapshots)
	assertTrend(t, "SleepHours", stats.SleepHours.Trend7d, "rising")
}

// Test 5: Declining trend — recent values lower than older values
func TestStatsEngine_DecliningTrend(t *testing.T) {
	// Recent (0-2): 3,3,3 → mean=3
	// Older (3-6): 8,8,8,8 → mean=8
	// 3 < 8*0.95=7.6 → declining
	snapshots := []model.HealthSnapshot{
		{SleepHours: f64(3)},
		{SleepHours: f64(3)},
		{SleepHours: f64(3)},
		{SleepHours: f64(8)},
		{SleepHours: f64(8)},
		{SleepHours: f64(8)},
		{SleepHours: f64(8)},
	}
	stats := ComputeStatsSummary(snapshots)
	assertTrend(t, "SleepHours", stats.SleepHours.Trend7d, "declining")
}

// Test 6: Stable trend — similar values
func TestStatsEngine_StableTrend(t *testing.T) {
	// All ~7 → stable
	snapshots := []model.HealthSnapshot{
		{SleepHours: f64(7.0)},
		{SleepHours: f64(7.1)},
		{SleepHours: f64(6.9)},
		{SleepHours: f64(7.0)},
		{SleepHours: f64(7.0)},
		{SleepHours: f64(7.1)},
		{SleepHours: f64(6.9)},
	}
	stats := ComputeStatsSummary(snapshots)
	assertTrend(t, "SleepHours", stats.SleepHours.Trend7d, "stable")
}

// Test 7: Mixed nil values — some snapshots have nil for a metric → correctly skipped
func TestStatsEngine_MixedNilValues(t *testing.T) {
	snapshots := []model.HealthSnapshot{
		{SleepHours: f64(8), HRV: nil},
		{SleepHours: nil, HRV: f64(50)},
		{SleepHours: f64(6), HRV: nil},
		{SleepHours: f64(7), HRV: f64(55)},
		{SleepHours: nil, HRV: f64(60)},
		{SleepHours: f64(8), HRV: nil},
		{SleepHours: f64(7), HRV: f64(45)},
	}
	stats := ComputeStatsSummary(snapshots)

	// SleepHours: 8, 6, 7, 8, 7 → 5 values, mean=7.2
	assertFloat(t, "SleepHours.Mean7d", stats.SleepHours.Mean7d, 7.2, 0.001)

	// HRV: 50, 55, 60, 45 → 4 values, mean=52.5
	assertFloat(t, "HRV.Mean7d", stats.HRV.Mean7d, 52.5, 0.001)
}

// Test 8: Verify all 12 metrics are computed
func TestStatsEngine_All12Metrics(t *testing.T) {
	snapshots := make([]model.HealthSnapshot, 7)
	for i := 0; i < 7; i++ {
		v := float64(i + 1)
		snapshots[i] = model.HealthSnapshot{
			SleepHours:         f64(v),
			HRV:                f64(v * 10),
			RestingHR:          f64(60 + v),
			ActiveCalories:     f64(v * 100),
			Weight:             f64(60 + v*0.1),
			BodyFat:            f64(20 + v*0.1),
			Steps:              f64(v * 1000),
			MoodScore:          f64(v),
			DeepSleepHours:     f64(v * 0.5),
			RespiratoryRate:    f64(15 + v*0.1),
			VO2Max:             f64(40 + v),
			WristTempDeviation: f64(v * 0.01),
		}
	}

	stats := ComputeStatsSummary(snapshots)

	// Check none are nil
	metrics := []struct {
		name string
		ms   MetricStats
	}{
		{"SleepHours", stats.SleepHours},
		{"HRV", stats.HRV},
		{"RestingHR", stats.RestingHR},
		{"ActiveCalories", stats.ActiveCalories},
		{"Weight", stats.Weight},
		{"BodyFat", stats.BodyFat},
		{"Steps", stats.Steps},
		{"MoodScore", stats.MoodScore},
		{"DeepSleepHours", stats.DeepSleepHours},
		{"RespiratoryRate", stats.RespiratoryRate},
		{"VO2Max", stats.VO2Max},
		{"WristTempDev", stats.WristTempDev},
	}

	for _, m := range metrics {
		if m.ms.Mean7d == nil {
			t.Errorf("%s.Mean7d should not be nil", m.name)
		}
		if m.ms.Mean30d == nil {
			t.Errorf("%s.Mean30d should not be nil", m.name)
		}
		if m.ms.StdDev7d == nil {
			t.Errorf("%s.StdDev7d should not be nil", m.name)
		}
		if m.ms.Trend7d == "" {
			t.Errorf("%s.Trend7d should not be empty", m.name)
		}
	}
}

// Test: fewer than 3 data points → nil means okay but trend is insufficient_data
func TestStatsEngine_TwoDataPoints(t *testing.T) {
	snapshots := []model.HealthSnapshot{
		{SleepHours: f64(7)},
		{SleepHours: f64(8)},
	}
	stats := ComputeStatsSummary(snapshots)
	assertFloat(t, "SleepHours.Mean7d", stats.SleepHours.Mean7d, 7.5, 0.001)
	assertTrend(t, "SleepHours", stats.SleepHours.Trend7d, "insufficient_data")
}
