package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"nexus/internal/modules/lifeos/service"

	"github.com/gin-gonic/gin"
)

// --- Health Auto Export payload structs ---

// HealthAutoExportEnvelope is the top-level payload from Health Auto Export.
type HealthAutoExportEnvelope struct {
	Data struct {
		Metrics []MetricEntry `json:"metrics" binding:"required"`
	} `json:"data" binding:"required"`
}

// MetricEntry represents a single metric in the Health Auto Export payload.
type MetricEntry struct {
	Name  string            `json:"name"`
	Units string            `json:"units"`
	Data  []MetricDataPoint `json:"data"`
}

// MetricDataPoint represents a single data point within a metric.
type MetricDataPoint struct {
	Date   string  `json:"date"`
	Qty    float64 `json:"qty"`
	Source string  `json:"source"`
}

// metricMapping maps Health Auto Export metric names to HealthSnapshotInput field names.
var metricMapping = map[string]string{
	"sleep_analysis":              "sleep_hours",
	"heart_rate_variability_sdnn": "hrv",
	"resting_heart_rate":          "resting_hr",
	"active_energy":               "active_calories",
	"body_mass":                   "weight",
	"body_fat_percentage":         "body_fat",
	"step_count":                  "steps",
	"state_of_mind":               "mood_score",
	"deep_sleep":                  "deep_sleep_hours",
	"respiratory_rate":            "respiratory_rate",
	"vo2_max":                     "vo2_max",
	"wrist_temperature":           "wrist_temp_deviation",
}

// extractDate parses "2026-03-11 23:30:00 -0800" → "2026-03-11"
func extractDate(dateStr string) string {
	if len(dateStr) >= 10 {
		return dateStr[:10]
	}
	return dateStr
}

// parseHealthAutoExportPayload parses raw JSON into the envelope struct.
// Returns error if JSON is invalid or data.metrics is missing.
func parseHealthAutoExportPayload(body []byte) (*HealthAutoExportEnvelope, error) {
	var envelope HealthAutoExportEnvelope
	if err := json.Unmarshal(body, &envelope); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w", err)
	}
	if envelope.Data.Metrics == nil {
		return nil, fmt.Errorf("data.metrics is required")
	}
	return &envelope, nil
}

// mapMetricsToInput converts the parsed envelope into a HealthSnapshotInput.
func mapMetricsToInput(envelope *HealthAutoExportEnvelope) service.HealthSnapshotInput {
	input := service.HealthSnapshotInput{}

	// Collect values by DB field name
	values := make(map[string]float64)
	var firstDate string

	for _, metric := range envelope.Data.Metrics {
		if len(metric.Data) == 0 {
			continue
		}

		// Extract date from first metric that has data
		if firstDate == "" {
			firstDate = extractDate(metric.Data[0].Date)
		}

		dbField, ok := metricMapping[metric.Name]
		if !ok {
			// Unknown metric → skip
			continue
		}

		values[dbField] = metric.Data[0].Qty
	}

	input.Date = firstDate

	// Map values to struct fields
	if v, ok := values["sleep_hours"]; ok {
		input.SleepHours = &v
	}
	if v, ok := values["hrv"]; ok {
		input.HRV = &v
	}
	if v, ok := values["resting_hr"]; ok {
		input.RestingHR = &v
	}
	if v, ok := values["active_calories"]; ok {
		input.ActiveCalories = &v
	}
	if v, ok := values["weight"]; ok {
		input.Weight = &v
	}
	if v, ok := values["body_fat"]; ok {
		input.BodyFat = &v
	}
	if v, ok := values["steps"]; ok {
		input.Steps = &v
	}
	if v, ok := values["mood_score"]; ok {
		input.MoodScore = &v
	}
	if v, ok := values["deep_sleep_hours"]; ok {
		input.DeepSleepHours = &v
	}
	if v, ok := values["respiratory_rate"]; ok {
		input.RespiratoryRate = &v
	}
	if v, ok := values["vo2_max"]; ok {
		input.VO2Max = &v
	}
	if v, ok := values["wrist_temp_deviation"]; ok {
		input.WristTempDeviation = &v
	}

	return input
}

// SyncHealthSnapshot POST /api/lifeos/health/sync
// Accepts Health Auto Export webhook payload, parses metrics, validates, and upserts.
func SyncHealthSnapshot(c *gin.Context) {
	// Layer 2: Struct binding — read body and parse envelope
	body, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request body"})
		return
	}

	envelope, err := parseHealthAutoExportPayload(body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map metrics to input struct
	input := mapMetricsToInput(envelope)

	if strings.TrimSpace(input.Date) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no date found in metrics data"})
		return
	}

	// Layer 4: Temporal validation
	if err := ValidateTemporalDate(input.Date); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Layer 3: Sanity check — discard out-of-range values (does not reject)
	ValidateHealthValues(&input)

	// Persist
	snap, err := service.UpsertHealthSnapshot(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, snap)
}

// GetLatestHealthSnapshot GET /api/lifeos/health/latest
func GetLatestHealthSnapshot(c *gin.Context) {
	snap, err := service.GetLatestSnapshot()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if snap == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no health snapshot found"})
		return
	}
	c.JSON(http.StatusOK, snap)
}
