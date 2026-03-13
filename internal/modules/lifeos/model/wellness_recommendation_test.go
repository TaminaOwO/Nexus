package model

import (
	"reflect"
	"testing"
)

func TestWellnessRecommendationHasSectionsField(t *testing.T) {
	rt := reflect.TypeOf(WellnessRecommendation{})

	field, ok := rt.FieldByName("Sections")
	if !ok {
		t.Fatal("WellnessRecommendation missing Sections field")
	}
	if field.Type.String() != "string" {
		t.Errorf("Sections: expected type string, got %s", field.Type.String())
	}
	if tag := field.Tag.Get("json"); tag != "sections" {
		t.Errorf("Sections: expected json tag \"sections\", got %q", tag)
	}
}

func TestWellnessRecommendationNoLegacyFields(t *testing.T) {
	rt := reflect.TypeOf(WellnessRecommendation{})

	for _, removed := range []string{"DietAdvice", "ExerciseAdvice"} {
		if _, ok := rt.FieldByName(removed); ok {
			t.Errorf("WellnessRecommendation should not have field %s (removed)", removed)
		}
	}
}

func TestWellnessRecommendationKeepsRawResponse(t *testing.T) {
	rt := reflect.TypeOf(WellnessRecommendation{})

	field, ok := rt.FieldByName("RawResponse")
	if !ok {
		t.Fatal("WellnessRecommendation missing RawResponse field")
	}
	if field.Type.String() != "string" {
		t.Errorf("RawResponse: expected type string, got %s", field.Type.String())
	}
}
