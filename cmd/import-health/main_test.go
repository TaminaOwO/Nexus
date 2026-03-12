package main

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestExtractDate(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"full timestamp with timezone", "2024-03-11 23:30:00 -0800", "2024-03-11"},
		{"ISO date only", "2024-03-11", "2024-03-11"},
		{"ISO datetime", "2024-03-11T23:30:00Z", "2024-03-11"},
		{"date with time no tz", "2024-03-11 08:00:00", "2024-03-11"},
		{"short date", "2024-3-5", "2024-3-5"}, // just takes first 10 or splits on space/T
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractDate(tt.input)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestMergeDayMetrics(t *testing.T) {
	days := make(map[string]*dayData)

	setMetric(days, "2024-03-11", "resting_hr", 62.5)
	setMetric(days, "2024-03-11", "hrv", 45.0)
	setMetric(days, "2024-03-11", "steps", 8500)
	setMetric(days, "2024-03-12", "steps", 10000)

	assert.Len(t, days, 2)

	d1 := days["2024-03-11"]
	assert.NotNil(t, d1.RestingHR)
	assert.InDelta(t, 62.5, *d1.RestingHR, 0.01)
	assert.NotNil(t, d1.HRV)
	assert.InDelta(t, 45.0, *d1.HRV, 0.01)
	assert.NotNil(t, d1.Steps)
	assert.InDelta(t, 8500.0, *d1.Steps, 0.01)

	d2 := days["2024-03-12"]
	assert.NotNil(t, d2.Steps)
	assert.InDelta(t, 10000.0, *d2.Steps, 0.01)
	assert.Nil(t, d2.RestingHR)
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		d    time.Duration
		want string
	}{
		{65 * time.Second, "1m5s"},
		{3661 * time.Second, "1h1m1s"},
		{0, "0s"},
	}
	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := formatDuration(tt.d)
			assert.Equal(t, tt.want, got)
		})
	}
}
