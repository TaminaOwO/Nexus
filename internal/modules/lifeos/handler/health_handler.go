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
// Standard metrics use Qty; sleep_analysis uses TotalSleep/Deep/REM/Core.
type MetricDataPoint struct {
	Date   string  `json:"date"`
	Qty    float64 `json:"qty"`
	Source string  `json:"source"`
	// Sleep-specific fields (sleep_analysis)
	TotalSleep *float64 `json:"totalSleep,omitempty"`
	Deep       *float64 `json:"deep,omitempty"`
	REM        *float64 `json:"rem,omitempty"`
	Core       *float64 `json:"core,omitempty"`
	Awake      *float64 `json:"awake,omitempty"`
}

// metricMapping maps Health Auto Export metric names to HealthSnapshotInput field names.
// sleep_analysis is handled separately (special struct, not qty-based).
var metricMapping = map[string]string{
	"heart_rate_variability":           "hrv",
	"resting_heart_rate":               "resting_hr",
	"active_energy":                    "active_calories",
	"body_mass":                        "weight",
	"body_fat_percentage":              "body_fat",
	"step_count":                       "steps",
	"state_of_mind":                    "mood_score",
	"respiratory_rate":                 "respiratory_rate",
	"vo2_max":                          "vo2_max",
	"apple_sleeping_wrist_temperature": "wrist_temp_deviation",
}

// kjToKcal converts kilojoules to kilocalories.
const kjToKcal = 4.184

// unitConversions maps metric names to conversion factors applied after aggregation.
var unitConversions = map[string]float64{
	"active_energy": 1.0 / kjToKcal, // kJ → kcal
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

// sumMetrics are metrics where multiple data points should be summed (daily totals).
var sumMetrics = map[string]bool{
	"step_count":    true,
	"active_energy": true,
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

		// sleep_analysis uses structured fields, not qty
		if metric.Name == "sleep_analysis" {
			dp := metric.Data[0]
			if dp.TotalSleep != nil {
				values["sleep_hours"] = *dp.TotalSleep
			}
			if dp.Deep != nil {
				values["deep_sleep_hours"] = *dp.Deep
			}
			continue
		}

		dbField, ok := metricMapping[metric.Name]
		if !ok {
			// Unknown metric → skip
			continue
		}

		var val float64
		if sumMetrics[metric.Name] {
			// Cumulative metrics: sum all data points
			for _, dp := range metric.Data {
				val += dp.Qty
			}
		} else {
			// Point-in-time metrics: take the last (most recent) data point
			val = metric.Data[len(metric.Data)-1].Qty
		}

		// Apply unit conversion if needed (e.g. kJ → kcal)
		if factor, ok := unitConversions[metric.Name]; ok {
			val *= factor
		}
		values[dbField] = val
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

// DeleteHealthSnapshot DELETE /api/lifeos/health/:date
func DeleteHealthSnapshot(c *gin.Context) {
	date := c.Param("date")
	if len(date) != 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date must be YYYY-MM-DD"})
		return
	}
	err := service.DeleteSnapshotByDate(date)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "no snapshot found for " + date})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": date})
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
