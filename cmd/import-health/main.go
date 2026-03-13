package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/glebarez/go-sqlite" // registers "sqlite" driver for database/sql
	"github.com/joho/godotenv"

	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"
	"nexus/internal/modules/lifeos/service"
)

// dayData collects all metrics for a single date before upserting.
type dayData struct {
	RestingHR          *float64
	HRV                *float64
	Steps              *float64
	ActiveCalories     *float64
	Weight             *float64
	RespiratoryRate    *float64
	VO2Max             *float64
	WristTempDeviation *float64
	SleepHours         *float64
	DeepSleepHours     *float64
}

// extractDate pulls YYYY-MM-DD from timestamps like "2024-03-11 23:30:00 -0800".
func extractDate(raw string) string {
	// Try splitting on space first: "2024-03-11 ..."
	if idx := strings.IndexByte(raw, ' '); idx >= 8 {
		return raw[:idx]
	}
	// Try splitting on T: "2024-03-11T..."
	if idx := strings.IndexByte(raw, 'T'); idx >= 8 {
		return raw[:idx]
	}
	return raw
}

// setMetric sets a single metric on the day entry, creating it if needed.
func setMetric(days map[string]*dayData, date, metric string, value float64) {
	d, ok := days[date]
	if !ok {
		d = &dayData{}
		days[date] = d
	}
	v := value
	switch metric {
	case "resting_hr":
		d.RestingHR = &v
	case "hrv":
		d.HRV = &v
	case "steps":
		d.Steps = &v
	case "active_calories":
		d.ActiveCalories = &v
	case "weight":
		d.Weight = &v
	case "respiratory_rate":
		d.RespiratoryRate = &v
	case "vo2_max":
		d.VO2Max = &v
	case "wrist_temp_deviation":
		d.WristTempDeviation = &v
	case "sleep_hours":
		d.SleepHours = &v
	case "deep_sleep_hours":
		d.DeepSleepHours = &v
	}
}

// formatDuration formats a time.Duration as a human-readable string.
func formatDuration(d time.Duration) string {
	if d == 0 {
		return "0s"
	}
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	s := int(d.Seconds()) % 60
	var parts []string
	if h > 0 {
		parts = append(parts, fmt.Sprintf("%dh", h))
	}
	if m > 0 {
		parts = append(parts, fmt.Sprintf("%dm", m))
	}
	if s > 0 {
		parts = append(parts, fmt.Sprintf("%ds", s))
	}
	return strings.Join(parts, "")
}

// tableExists checks if a table exists in the SQLite database.
func tableExists(db *sql.DB, table string) bool {
	var name string
	err := db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name=?", table).Scan(&name)
	return err == nil
}

// queryAggregated runs a SELECT with GROUP BY date and returns date->value pairs.
func queryAggregated(db *sql.DB, query string) (map[string]float64, error) {
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]float64)
	for rows.Next() {
		var day string
		var val float64
		if err := rows.Scan(&day, &val); err != nil {
			log.Printf("  warning: scan error: %v", err)
			continue
		}
		result[day] = val
	}
	return result, rows.Err()
}

// metricDef defines how to import one metric from healthsync SQLite.
type metricDef struct {
	table      string // SQLite table name
	query      string // SQL query (must return day, value)
	metricName string // key for setMetric
}

func main() {
	dbPath := flag.String("db", "", "Path to healthsync SQLite database")
	flag.Parse()

	if *dbPath == "" {
		fmt.Println("Usage: go run ./cmd/import-health --db <path-to-healthsync.db>")
		os.Exit(1)
	}

	// Check file exists
	if _, err := os.Stat(*dbPath); os.IsNotExist(err) {
		log.Fatalf("healthsync database not found: %s", *dbPath)
	}

	start := time.Now()

	// --- 1. Initialize Nexus DB ---
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}
	database.Init()
	database.DB.AutoMigrate(&model.HealthSnapshot{}, &model.HealthWorkoutLog{})

	// --- 2. Open healthsync SQLite (read-only) ---
	connStr := fmt.Sprintf("file:%s?mode=ro", *dbPath)
	hsDB, err := sql.Open("sqlite", connStr)
	if err != nil {
		log.Fatalf("failed to open healthsync DB: %v", err)
	}
	defer hsDB.Close()

	if err := hsDB.Ping(); err != nil {
		log.Fatalf("failed to ping healthsync DB: %v", err)
	}
	log.Println("healthsync DB opened successfully")

	// --- 3. Import metrics ---
	metrics := []metricDef{
		{"resting_heart_rate", "SELECT date(date) as day, AVG(value) FROM resting_heart_rate GROUP BY day", "resting_hr"},
		{"hrv", "SELECT date(date) as day, AVG(value) FROM hrv GROUP BY day", "hrv"},
		{"steps", "SELECT date(date) as day, SUM(value) FROM steps GROUP BY day", "steps"},
		{"active_energy", "SELECT date(date) as day, SUM(value) FROM active_energy GROUP BY day", "active_calories"},
		{"body_mass", "SELECT date(date) as day, AVG(value) FROM body_mass GROUP BY day", "weight"},
		{"respiratory_rate", "SELECT date(date) as day, AVG(value) FROM respiratory_rate GROUP BY day", "respiratory_rate"},
		{"vo2_max", "SELECT date(date) as day, AVG(value) FROM vo2_max GROUP BY day", "vo2_max"},
		{"wrist_temperature", "SELECT date(date) as day, AVG(value) FROM wrist_temperature GROUP BY day", "wrist_temp_deviation"},
	}

	days := make(map[string]*dayData)

	for _, m := range metrics {
		if !tableExists(hsDB, m.table) {
			log.Printf("  skipping %s (table not found)", m.table)
			continue
		}

		data, err := queryAggregated(hsDB, m.query)
		if err != nil {
			log.Printf("  warning: failed to query %s: %v", m.table, err)
			continue
		}

		for date, val := range data {
			setMetric(days, date, m.metricName, val)
		}
		log.Printf("  %s: %d days", m.table, len(data))
	}

	// --- 4. Sleep import ---
	// TODO: healthsync sleep data uses category/stages and is complex to parse.
	// For now, skip sleep import. When the healthsync schema is better understood,
	// implement: sum sleep duration per day, extract deep sleep stage if available.
	if tableExists(hsDB, "sleep") {
		log.Println("  sleep: table exists but import not yet implemented (TODO)")
	} else {
		log.Println("  sleep: table not found, skipping")
	}

	// --- 5. Batch upsert into health_snapshots ---
	log.Printf("upserting %d days into Nexus DB...", len(days))
	upsertCount := 0
	upsertErrors := 0
	for date, d := range days {
		input := service.HealthSnapshotInput{
			Date:               date,
			RestingHR:          d.RestingHR,
			HRV:                d.HRV,
			Steps:              d.Steps,
			ActiveCalories:     d.ActiveCalories,
			Weight:             d.Weight,
			RespiratoryRate:    d.RespiratoryRate,
			VO2Max:             d.VO2Max,
			WristTempDeviation: d.WristTempDeviation,
			SleepHours:         d.SleepHours,
			DeepSleepHours:     d.DeepSleepHours,
		}
		if _, err := service.UpsertHealthSnapshot(input); err != nil {
			log.Printf("  error upserting %s: %v", date, err)
			upsertErrors++
		} else {
			upsertCount++
		}
	}

	// --- 6. Import workouts ---
	workoutCount := 0
	if tableExists(hsDB, "workouts") {
		rows, err := hsDB.Query("SELECT date(date) as day, workout_type, duration FROM workouts")
		if err != nil {
			log.Printf("  warning: failed to query workouts: %v", err)
		} else {
			defer rows.Close()
			// Collect workouts by date so we can upsert them via the service
			workoutsByDate := make(map[string][]service.WorkoutEntry)
			for rows.Next() {
				var day, wtype string
				var duration float64
				if err := rows.Scan(&day, &wtype, &duration); err != nil {
					log.Printf("  warning: workout scan error: %v", err)
					continue
				}
				// duration is likely in seconds or minutes depending on healthsync;
				// assume minutes for now
				workoutsByDate[day] = append(workoutsByDate[day], service.WorkoutEntry{
					Type:    wtype,
					Minutes: duration,
				})
				workoutCount++
			}
			// Upsert workouts by re-calling UpsertHealthSnapshot with workout data
			for date, workouts := range workoutsByDate {
				input := service.HealthSnapshotInput{
					Date:     date,
					Workouts: workouts,
				}
				if _, err := service.UpsertHealthSnapshot(input); err != nil {
					log.Printf("  error upserting workouts for %s: %v", date, err)
				}
			}
		}
	} else {
		log.Println("  workouts: table not found, skipping")
	}

	// --- 7. Summary ---
	elapsed := time.Since(start)
	fmt.Println()
	fmt.Println("=== Import Summary ===")
	fmt.Printf("  Days imported:    %d\n", upsertCount)
	fmt.Printf("  Upsert errors:    %d\n", upsertErrors)
	fmt.Printf("  Workouts:         %d\n", workoutCount)
	fmt.Printf("  Duration:         %s\n", formatDuration(elapsed))
	fmt.Println("======================")
}
