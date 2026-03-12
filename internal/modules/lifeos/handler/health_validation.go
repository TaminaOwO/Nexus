package handler

import (
	"fmt"
	"log"
	"time"

	"nexus/internal/modules/lifeos/service"
)

// sanityRange defines the acceptable range for a health metric.
type sanityRange struct {
	Min       float64
	Max       float64
	Exclusive bool // if true, Min < x (not <=)
}

// sanityRanges maps HealthSnapshotInput field logical names to their acceptable ranges.
var sanityRanges = map[string]sanityRange{
	"sleep_hours":          {Min: 0, Max: 24, Exclusive: true},
	"resting_hr":           {Min: 30, Max: 150},
	"hrv":                  {Min: 10, Max: 250},
	"active_calories":      {Min: 0, Max: 10000},
	"deep_sleep_hours":     {Min: 0, Max: 12},
	"respiratory_rate":     {Min: 5, Max: 40},
	"vo2_max":              {Min: 15, Max: 80},
	"wrist_temp_deviation": {Min: -3.0, Max: 3.0},
	"mood_score":           {Min: 0, Max: 10},
	"body_fat":             {Min: 3, Max: 60},
	"weight":               {Min: 20, Max: 300},
	"steps":                {Min: 0, Max: 100000},
}

// checkAndNilify checks a value against its sanity range. Returns nil if out of range.
func checkAndNilify(name string, val *float64) *float64 {
	if val == nil {
		return nil
	}
	r, ok := sanityRanges[name]
	if !ok {
		return val
	}
	v := *val
	if r.Exclusive {
		if v <= r.Min || v > r.Max {
			log.Printf("[WARN] health sanity: %s=%.2f out of range (%.2f, %.2f]", name, v, r.Min, r.Max)
			return nil
		}
	} else {
		if v < r.Min || v > r.Max {
			log.Printf("[WARN] health sanity: %s=%.2f out of range [%.2f, %.2f]", name, v, r.Min, r.Max)
			return nil
		}
	}
	return val
}

// ValidateHealthValues applies sanity checks to all numeric fields in the input.
// Out-of-range values are set to nil (discarded) with a warning log.
// The input is modified in place.
func ValidateHealthValues(input *service.HealthSnapshotInput) {
	input.SleepHours = checkAndNilify("sleep_hours", input.SleepHours)
	input.RestingHR = checkAndNilify("resting_hr", input.RestingHR)
	input.HRV = checkAndNilify("hrv", input.HRV)
	input.ActiveCalories = checkAndNilify("active_calories", input.ActiveCalories)
	input.DeepSleepHours = checkAndNilify("deep_sleep_hours", input.DeepSleepHours)
	input.RespiratoryRate = checkAndNilify("respiratory_rate", input.RespiratoryRate)
	input.VO2Max = checkAndNilify("vo2_max", input.VO2Max)
	input.WristTempDeviation = checkAndNilify("wrist_temp_deviation", input.WristTempDeviation)
	input.MoodScore = checkAndNilify("mood_score", input.MoodScore)
	input.BodyFat = checkAndNilify("body_fat", input.BodyFat)
	input.Weight = checkAndNilify("weight", input.Weight)
	input.Steps = checkAndNilify("steps", input.Steps)
}

// ValidateTemporalDate checks that the date is not in the future and not older than 48 hours.
// Uses Asia/Taipei timezone.
func ValidateTemporalDate(dateStr string) error {
	loc, err := time.LoadLocation("Asia/Taipei")
	if err != nil {
		return fmt.Errorf("failed to load timezone: %w", err)
	}

	parsed, err := time.ParseInLocation("2006-01-02", dateStr, loc)
	if err != nil {
		return fmt.Errorf("invalid date format: %w", err)
	}

	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	if parsed.After(today) {
		return fmt.Errorf("date %s is in the future", dateStr)
	}

	cutoff := today.Add(-48 * time.Hour)
	if parsed.Before(cutoff) {
		return fmt.Errorf("date %s is older than 48 hours", dateStr)
	}

	return nil
}
