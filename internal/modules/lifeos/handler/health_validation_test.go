package handler

import (
	"testing"
	"time"

	"nexus/internal/modules/lifeos/service"
)

func ptr(f float64) *float64 { return &f }

func TestCheckAndNilify_InRange(t *testing.T) {
	tests := []struct {
		name  string
		field string
		val   float64
	}{
		{"athlete resting HR", "resting_hr", 55},
		{"normal sleep", "sleep_hours", 7.5},
		{"high HRV", "hrv", 120},
		{"moderate calories", "active_calories", 500},
		{"deep sleep", "deep_sleep_hours", 2.5},
		{"normal resp rate", "respiratory_rate", 16},
		{"good vo2max", "vo2_max", 45},
		{"normal wrist temp", "wrist_temp_deviation", 0.3},
		{"mood ok", "mood_score", 7},
		{"body fat athlete", "body_fat", 15},
		{"weight normal", "weight", 65},
		{"steps normal", "steps", 8000},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			v := tc.val
			result := checkAndNilify(tc.field, &v)
			if result == nil {
				t.Errorf("expected value to be accepted, got nil")
			} else if *result != tc.val {
				t.Errorf("expected %.2f, got %.2f", tc.val, *result)
			}
		})
	}
}

func TestCheckAndNilify_OutOfRange(t *testing.T) {
	tests := []struct {
		name  string
		field string
		val   float64
	}{
		{"sleep 30h", "sleep_hours", 30},
		{"sleep 0h (exclusive)", "sleep_hours", 0},
		{"resting HR too low", "resting_hr", 20},
		{"resting HR too high", "resting_hr", 200},
		{"HRV too low", "hrv", 5},
		{"HRV too high", "hrv", 300},
		{"calories negative", "active_calories", -100},
		{"calories too high", "active_calories", 20000},
		{"deep sleep too much", "deep_sleep_hours", 15},
		{"resp rate too low", "respiratory_rate", 3},
		{"vo2max too low", "vo2_max", 10},
		{"wrist temp too hot", "wrist_temp_deviation", 5.0},
		{"wrist temp too cold", "wrist_temp_deviation", -4.0},
		{"mood too high", "mood_score", 15},
		{"body fat too low", "body_fat", 1},
		{"weight too low", "weight", 10},
		{"steps too high", "steps", 200000},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			v := tc.val
			result := checkAndNilify(tc.field, &v)
			if result != nil {
				t.Errorf("expected nil for %s=%.2f, got %.2f", tc.field, tc.val, *result)
			}
		})
	}
}

func TestCheckAndNilify_Nil(t *testing.T) {
	result := checkAndNilify("sleep_hours", nil)
	if result != nil {
		t.Error("expected nil for nil input")
	}
}

func TestCheckAndNilify_UnknownField(t *testing.T) {
	v := 999.0
	result := checkAndNilify("unknown_metric", &v)
	if result == nil || *result != 999.0 {
		t.Error("unknown field should be passed through")
	}
}

func TestValidateHealthValues_DiscardsBadKeepsGood(t *testing.T) {
	input := service.HealthSnapshotInput{
		Date:       "2026-03-11",
		SleepHours: ptr(30),  // out of range → nil
		RestingHR:  ptr(55),  // athlete range → keep
		HRV:        ptr(120), // good → keep
		Steps:      ptr(200000), // too high → nil
	}
	ValidateHealthValues(&input)

	if input.SleepHours != nil {
		t.Error("sleep_hours=30 should be nil")
	}
	if input.RestingHR == nil || *input.RestingHR != 55 {
		t.Error("resting_hr=55 should be kept")
	}
	if input.HRV == nil || *input.HRV != 120 {
		t.Error("hrv=120 should be kept")
	}
	if input.Steps != nil {
		t.Error("steps=200000 should be nil")
	}
}

func TestValidateTemporalDate_FutureDate(t *testing.T) {
	loc, _ := time.LoadLocation("Asia/Taipei")
	future := time.Now().In(loc).Add(48 * time.Hour).Format("2006-01-02")
	err := ValidateTemporalDate(future)
	if err == nil {
		t.Error("expected error for future date")
	}
}

func TestValidateTemporalDate_TooOld(t *testing.T) {
	loc, _ := time.LoadLocation("Asia/Taipei")
	old := time.Now().In(loc).Add(-72 * time.Hour).Format("2006-01-02")
	err := ValidateTemporalDate(old)
	if err == nil {
		t.Error("expected error for date older than 48h")
	}
}

func TestValidateTemporalDate_Yesterday(t *testing.T) {
	loc, _ := time.LoadLocation("Asia/Taipei")
	yesterday := time.Now().In(loc).Add(-24 * time.Hour).Format("2006-01-02")
	err := ValidateTemporalDate(yesterday)
	if err != nil {
		t.Errorf("yesterday should be accepted, got: %v", err)
	}
}

func TestValidateTemporalDate_Today(t *testing.T) {
	loc, _ := time.LoadLocation("Asia/Taipei")
	today := time.Now().In(loc).Format("2006-01-02")
	err := ValidateTemporalDate(today)
	if err != nil {
		t.Errorf("today should be accepted, got: %v", err)
	}
}

func TestValidateTemporalDate_InvalidFormat(t *testing.T) {
	err := ValidateTemporalDate("not-a-date")
	if err == nil {
		t.Error("expected error for invalid date format")
	}
}
