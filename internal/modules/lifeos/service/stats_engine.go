package service

import (
	"math"
	"reflect"

	"nexus/internal/modules/lifeos/model"
)

// MetricStats holds sliding window statistics for a single health metric.
type MetricStats struct {
	Mean7d   *float64 `json:"mean_7d"`
	Mean30d  *float64 `json:"mean_30d"`
	StdDev7d *float64 `json:"std_dev_7d"`
	Trend7d  string   `json:"trend_7d"` // "rising" | "stable" | "declining" | "insufficient_data"
}

// HealthStatsSummary holds computed statistics for all tracked health metrics.
type HealthStatsSummary struct {
	SleepHours      MetricStats `json:"sleep_hours"`
	HRV             MetricStats `json:"hrv"`
	RestingHR       MetricStats `json:"resting_hr"`
	DeepSleepHours  MetricStats `json:"deep_sleep_hours"`
	RespiratoryRate MetricStats `json:"respiratory_rate"`
	VO2Max          MetricStats `json:"vo2_max"`
	WristTempDev    MetricStats `json:"wrist_temp_deviation"`
	MoodScore       MetricStats `json:"mood_score"`
	Weight          MetricStats `json:"weight"`
	BodyFat         MetricStats `json:"body_fat"`
	Steps           MetricStats `json:"steps"`
	ActiveCalories  MetricStats `json:"active_calories"`
}

// metricMapping maps HealthStatsSummary field names to HealthSnapshot field names.
var metricMapping = []struct {
	SummaryField  string
	SnapshotField string
}{
	{"SleepHours", "SleepHours"},
	{"HRV", "HRV"},
	{"RestingHR", "RestingHR"},
	{"DeepSleepHours", "DeepSleepHours"},
	{"RespiratoryRate", "RespiratoryRate"},
	{"VO2Max", "VO2Max"},
	{"WristTempDev", "WristTempDeviation"},
	{"MoodScore", "MoodScore"},
	{"Weight", "Weight"},
	{"BodyFat", "BodyFat"},
	{"Steps", "Steps"},
	{"ActiveCalories", "ActiveCalories"},
}

// ComputeStatsSummary computes 7-day and 30-day sliding window statistics
// for all health metrics. Input snapshots should be ordered by date DESC
// (index 0 = most recent).
func ComputeStatsSummary(snapshots []model.HealthSnapshot) HealthStatsSummary {
	var summary HealthStatsSummary
	summaryVal := reflect.ValueOf(&summary).Elem()

	for _, m := range metricMapping {
		values := extractMetricValues(snapshots, m.SnapshotField)
		stats := computeMetricStats(values)
		summaryVal.FieldByName(m.SummaryField).Set(reflect.ValueOf(stats))
	}

	return summary
}

// extractMetricValues extracts non-nil float64 values from snapshots for a given field.
// Uses reflect to access the *float64 field by name.
func extractMetricValues(snapshots []model.HealthSnapshot, fieldName string) []float64 {
	var values []float64
	for i := range snapshots {
		field := reflect.ValueOf(snapshots[i]).FieldByName(fieldName)
		if !field.IsValid() || field.IsNil() {
			continue
		}
		values = append(values, field.Elem().Float())
	}
	return values
}

// computeMetricStats computes MetricStats for a single metric given all available values.
// Values are assumed to be in DESC date order (index 0 = most recent).
func computeMetricStats(values []float64) MetricStats {
	if len(values) == 0 {
		return MetricStats{Trend7d: "insufficient_data"}
	}

	// Mean30d: all values
	m30 := mean(values)
	stats := MetricStats{
		Mean30d: &m30,
		Trend7d: "insufficient_data",
	}

	// 7-day window: first 7 values (most recent)
	window7 := values
	if len(window7) > 7 {
		window7 = window7[:7]
	}

	m7 := mean(window7)
	stats.Mean7d = &m7

	if len(window7) >= 2 {
		sd := stddev(window7)
		stats.StdDev7d = &sd
	}

	// Trend: need at least 3 data points in the 7-day window
	if len(window7) >= 3 {
		// Split into recent half and older half
		// For 7 values: recent = [0,1,2] (3), older = [3,4,5,6] (4)
		// For 6 values: recent = [0,1,2] (3), older = [3,4,5] (3)
		// For 5 values: recent = [0,1] (2), older = [2,3,4] (3)
		// For 4 values: recent = [0,1] (2), older = [2,3] (2)
		// For 3 values: recent = [0] (1), older = [1,2] (2)
		// General: split at midpoint
		mid := len(window7) / 2
		recentHalf := window7[:mid]
		olderHalf := window7[mid:]

		// Edge case: if mid is 0 (shouldn't happen with len>=3), fallback
		if len(recentHalf) == 0 || len(olderHalf) == 0 {
			stats.Trend7d = "stable"
		} else {
			recentMean := mean(recentHalf)
			olderMean := mean(olderHalf)

			if olderMean == 0 {
				// Avoid division issues; if older is zero and recent is not, it's rising
				if recentMean > 0 {
					stats.Trend7d = "rising"
				} else if recentMean < 0 {
					stats.Trend7d = "declining"
				} else {
					stats.Trend7d = "stable"
				}
			} else if recentMean > olderMean*1.05 {
				stats.Trend7d = "rising"
			} else if recentMean < olderMean*0.95 {
				stats.Trend7d = "declining"
			} else {
				stats.Trend7d = "stable"
			}
		}
	}

	return stats
}

// mean computes the arithmetic mean of a non-empty slice.
func mean(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

// stddev computes the population standard deviation of a non-empty slice.
func stddev(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	m := mean(values)
	sumSq := 0.0
	for _, v := range values {
		d := v - m
		sumSq += d * d
	}
	return math.Sqrt(sumSq / float64(len(values)))
}
