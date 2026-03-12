package model

import (
	"reflect"
	"testing"
)

func TestHealthSnapshotHasAllExpectedFields(t *testing.T) {
	rt := reflect.TypeOf(HealthSnapshot{})

	expectedFields := map[string]struct {
		goType  string
		jsonTag string
	}{
		"ID":                 {"string", "id"},
		"Date":               {"string", "date"},
		"SleepHours":         {"*float64", "sleep_hours"},
		"HRV":                {"*float64", "hrv"},
		"RestingHR":          {"*float64", "resting_hr"},
		"ActiveCalories":     {"*float64", "active_calories"},
		"WorkoutSummary":     {"*string", "workout_summary"},
		"Weight":             {"*float64", "weight"},
		"BodyFat":            {"*float64", "body_fat"},
		"Steps":              {"*float64", "steps"},
		"MoodScore":          {"*float64", "mood_score"},
		"MoodLabel":          {"*string", "mood_label"},
		"DeepSleepHours":     {"*float64", "deep_sleep_hours"},
		"RespiratoryRate":    {"*float64", "respiratory_rate"},
		"VO2Max":             {"*float64", "vo2_max"},
		"WristTempDeviation": {"*float64", "wrist_temp_deviation"},
		"CreatedAt":          {"time.Time", "created_at"},
		"UpdatedAt":          {"time.Time", "updated_at"},
	}

	for name, expected := range expectedFields {
		field, ok := rt.FieldByName(name)
		if !ok {
			t.Errorf("missing field %s", name)
			continue
		}
		gotType := field.Type.String()
		if gotType != expected.goType {
			t.Errorf("field %s: expected type %s, got %s", name, expected.goType, gotType)
		}
		gotJSON := field.Tag.Get("json")
		if gotJSON != expected.jsonTag {
			t.Errorf("field %s: expected json tag %q, got %q", name, expected.jsonTag, gotJSON)
		}
	}
}
