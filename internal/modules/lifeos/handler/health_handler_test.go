package handler

import (
	"testing"
)

func TestParseHealthAutoExportPayload_ValidPayload(t *testing.T) {
	payload := `{
		"data": {
			"metrics": [
				{
					"name": "sleep_analysis",
					"units": "hr",
					"data": [{"date": "2026-03-11 23:30:00 -0800", "totalSleep": 6.8, "deep": 1.2, "rem": 1.5, "core": 3.6, "awake": 0.5, "source": "Apple Watch"}]
				},
				{
					"name": "heart_rate_variability",
					"units": "ms",
					"data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 85.0, "source": "Apple Watch"}]
				},
				{
					"name": "resting_heart_rate",
					"units": "bpm",
					"data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 55.0, "source": "Apple Watch"}]
				},
				{
					"name": "active_energy",
					"units": "kcal",
					"data": [
						{"date": "2026-03-11 06:00:00 -0800", "qty": 200.0, "source": "Apple Watch"},
						{"date": "2026-03-11 12:00:00 -0800", "qty": 250.0, "source": "Apple Watch"}
					]
				},
				{
					"name": "body_mass",
					"units": "kg",
					"data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 62.5, "source": "Apple Watch"}]
				},
				{
					"name": "step_count",
					"units": "steps",
					"data": [
						{"date": "2026-03-11 06:00:00 -0800", "qty": 3000.0, "source": "Apple Watch"},
						{"date": "2026-03-11 12:00:00 -0800", "qty": 5500.0, "source": "Apple Watch"}
					]
				}
			]
		}
	}`

	envelope, err := parseHealthAutoExportPayload([]byte(payload))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	input := mapMetricsToInput(envelope)

	if input.Date != "2026-03-11" {
		t.Errorf("expected date 2026-03-11, got %s", input.Date)
	}
	if input.SleepHours == nil || *input.SleepHours != 6.8 {
		t.Errorf("expected sleep_hours=6.8, got %v", input.SleepHours)
	}
	if input.DeepSleepHours == nil || *input.DeepSleepHours != 1.2 {
		t.Errorf("expected deep_sleep_hours=1.2, got %v", input.DeepSleepHours)
	}
	if input.HRV == nil || *input.HRV != 85.0 {
		t.Errorf("expected hrv=85.0, got %v", input.HRV)
	}
	if input.RestingHR == nil || *input.RestingHR != 55.0 {
		t.Errorf("expected resting_hr=55.0, got %v", input.RestingHR)
	}
	if input.ActiveCalories == nil || *input.ActiveCalories != 450.0 {
		t.Errorf("expected active_calories=450.0 (sum), got %v", input.ActiveCalories)
	}
	if input.Weight == nil || *input.Weight != 62.5 {
		t.Errorf("expected weight=62.5, got %v", input.Weight)
	}
	if input.Steps == nil || *input.Steps != 8500.0 {
		t.Errorf("expected steps=8500.0 (sum), got %v", input.Steps)
	}
}

func TestParseHealthAutoExportPayload_UnknownMetricSkipped(t *testing.T) {
	payload := `{
		"data": {
			"metrics": [
				{
					"name": "unknown_metric_xyz",
					"units": "??",
					"data": [{"date": "2026-03-11 10:00:00 -0800", "qty": 999.0, "source": "test"}]
				},
				{
					"name": "sleep_analysis",
					"units": "hr",
					"data": [{"date": "2026-03-11 23:30:00 -0800", "totalSleep": 7.0, "deep": 1.5}]
				}
			]
		}
	}`

	envelope, err := parseHealthAutoExportPayload([]byte(payload))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	input := mapMetricsToInput(envelope)

	if input.SleepHours == nil || *input.SleepHours != 7.0 {
		t.Error("sleep_hours should be mapped from totalSleep")
	}
	if input.DeepSleepHours == nil || *input.DeepSleepHours != 1.5 {
		t.Error("deep_sleep_hours should be mapped from deep")
	}
	if input.VO2Max != nil {
		t.Error("vo2_max should be nil (not in payload)")
	}
}

func TestParseHealthAutoExportPayload_MissingMetrics(t *testing.T) {
	payload := `{
		"data": {
			"metrics": [
				{
					"name": "sleep_analysis",
					"units": "hr",
					"data": [{"date": "2026-03-11 23:30:00 -0800", "totalSleep": 7.5, "deep": 2.0}]
				}
			]
		}
	}`

	envelope, err := parseHealthAutoExportPayload([]byte(payload))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	input := mapMetricsToInput(envelope)

	if input.SleepHours == nil || *input.SleepHours != 7.5 {
		t.Error("sleep_hours should be 7.5")
	}
	if input.HRV != nil {
		t.Error("hrv should be nil")
	}
	if input.RestingHR != nil {
		t.Error("resting_hr should be nil")
	}
	if input.Weight != nil {
		t.Error("weight should be nil")
	}
}

func TestParseHealthAutoExportPayload_EmptyMetricData(t *testing.T) {
	payload := `{
		"data": {
			"metrics": [
				{
					"name": "sleep_analysis",
					"units": "hr",
					"data": []
				}
			]
		}
	}`

	envelope, err := parseHealthAutoExportPayload([]byte(payload))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	input := mapMetricsToInput(envelope)

	if input.SleepHours != nil {
		t.Error("sleep_hours should be nil when metric data array is empty")
	}
}

func TestParseHealthAutoExportPayload_InvalidJSON(t *testing.T) {
	_, err := parseHealthAutoExportPayload([]byte(`not json`))
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestParseHealthAutoExportPayload_MissingDataField(t *testing.T) {
	_, err := parseHealthAutoExportPayload([]byte(`{}`))
	if err == nil {
		t.Error("expected error for missing data.metrics")
	}
}

func TestParseHealthAutoExportPayload_AllMetrics(t *testing.T) {
	payload := `{
		"data": {
			"metrics": [
				{"name": "sleep_analysis", "units": "hr", "data": [{"date": "2026-03-11 23:30:00 -0800", "totalSleep": 6.8, "deep": 1.8}]},
				{"name": "heart_rate_variability", "units": "ms", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 85.0}]},
				{"name": "resting_heart_rate", "units": "bpm", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 55.0}]},
				{"name": "active_energy", "units": "kcal", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 450.0}]},
				{"name": "body_mass", "units": "kg", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 62.5}]},
				{"name": "body_fat_percentage", "units": "%", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 22.5}]},
				{"name": "step_count", "units": "steps", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 8500.0}]},
				{"name": "state_of_mind", "units": "score", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 7.0}]},
				{"name": "respiratory_rate", "units": "bpm", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 15.0}]},
				{"name": "vo2_max", "units": "ml/kg/min", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 42.0}]},
				{"name": "wrist_temperature", "units": "degC", "data": [{"date": "2026-03-11 06:00:00 -0800", "qty": 0.3}]}
			]
		}
	}`

	envelope, err := parseHealthAutoExportPayload([]byte(payload))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	input := mapMetricsToInput(envelope)

	checks := map[string]*float64{
		"sleep_hours":          input.SleepHours,
		"hrv":                  input.HRV,
		"resting_hr":           input.RestingHR,
		"active_calories":      input.ActiveCalories,
		"weight":               input.Weight,
		"body_fat":             input.BodyFat,
		"steps":                input.Steps,
		"mood_score":           input.MoodScore,
		"deep_sleep_hours":     input.DeepSleepHours,
		"respiratory_rate":     input.RespiratoryRate,
		"vo2_max":              input.VO2Max,
		"wrist_temp_deviation": input.WristTempDeviation,
	}

	for name, val := range checks {
		if val == nil {
			t.Errorf("%s should not be nil", name)
		}
	}
}

func TestExtractDateFromPayloadTimestamp(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"2026-03-11 23:30:00 -0800", "2026-03-11"},
		{"2026-01-05 06:00:00 +0800", "2026-01-05"},
	}
	for _, tc := range tests {
		got := extractDate(tc.input)
		if got != tc.expected {
			t.Errorf("extractDate(%q) = %q, want %q", tc.input, got, tc.expected)
		}
	}
}

func TestMetricMapping_AllKeysPresent(t *testing.T) {
	// sleep_analysis is handled specially, not in metricMapping
	expectedKeys := []string{
		"heart_rate_variability", "heart_rate_variability_sdnn", "resting_heart_rate",
		"active_energy", "body_mass", "body_fat_percentage", "step_count",
		"state_of_mind", "respiratory_rate", "vo2_max", "wrist_temperature",
	}
	for _, key := range expectedKeys {
		if _, ok := metricMapping[key]; !ok {
			t.Errorf("metricMapping missing key: %s", key)
		}
	}
}

func TestSleepAnalysis_StructuredFields(t *testing.T) {
	payload := `{
		"data": {
			"metrics": [
				{
					"name": "sleep_analysis",
					"units": "hr",
					"data": [{
						"date": "2026-03-12 00:00:00 +0800",
						"totalSleep": 6.1248326126734405,
						"deep": 0.97367430514759479,
						"rem": 1.5395130076342158,
						"core": 3.6116452998916304,
						"awake": 0.0083215862512588494,
						"source": "Apple Watch"
					}]
				}
			]
		}
	}`

	envelope, err := parseHealthAutoExportPayload([]byte(payload))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	input := mapMetricsToInput(envelope)

	if input.Date != "2026-03-12" {
		t.Errorf("expected date 2026-03-12, got %s", input.Date)
	}
	if input.SleepHours == nil {
		t.Fatal("sleep_hours should not be nil")
	}
	if *input.SleepHours < 6.12 || *input.SleepHours > 6.13 {
		t.Errorf("expected sleep_hours≈6.12, got %f", *input.SleepHours)
	}
	if input.DeepSleepHours == nil {
		t.Fatal("deep_sleep_hours should not be nil")
	}
	if *input.DeepSleepHours < 0.97 || *input.DeepSleepHours > 0.98 {
		t.Errorf("expected deep_sleep_hours≈0.97, got %f", *input.DeepSleepHours)
	}
}

func TestHRV_MultipleDataPoints_TakesLast(t *testing.T) {
	payload := `{
		"data": {
			"metrics": [
				{
					"name": "heart_rate_variability",
					"units": "ms",
					"data": [
						{"date": "2026-03-12 01:00:00 +0800", "qty": 25.14},
						{"date": "2026-03-12 03:00:00 +0800", "qty": 50.47},
						{"date": "2026-03-12 23:00:00 +0800", "qty": 23.34}
					]
				}
			]
		}
	}`

	envelope, err := parseHealthAutoExportPayload([]byte(payload))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	input := mapMetricsToInput(envelope)

	if input.HRV == nil {
		t.Fatal("hrv should not be nil")
	}
	if *input.HRV < 23.33 || *input.HRV > 23.35 {
		t.Errorf("expected hrv≈23.34 (last data point), got %f", *input.HRV)
	}
}
