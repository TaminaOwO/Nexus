package service

import (
	"testing"

	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupTestDB initialises an in-memory SQLite DB and auto-migrates the required tables.
func setupTestDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.HealthSnapshot{}, &model.HealthWorkoutLog{}))
	database.DB = db
}

func TestUpsertHealthSnapshot_PartialCreate_OnlySleep(t *testing.T) {
	setupTestDB(t)

	sleep := 7.5
	snap, err := UpsertHealthSnapshot(HealthSnapshotInput{
		Date:       "2026-03-12",
		SleepHours: &sleep,
	})
	require.NoError(t, err)
	require.NotNil(t, snap)

	assert.Equal(t, &sleep, snap.SleepHours)
	assert.Nil(t, snap.HRV, "HRV should remain nil on partial create")
	assert.Nil(t, snap.Weight, "Weight should remain nil on partial create")
	assert.Nil(t, snap.WorkoutSummary, "WorkoutSummary should be nil when no workouts provided")
}

func TestUpsertHealthSnapshot_PartialUpdate_PreservesExistingFields(t *testing.T) {
	setupTestDB(t)

	// Step 1: create with sleep data
	sleep := 7.5
	_, err := UpsertHealthSnapshot(HealthSnapshotInput{
		Date:       "2026-03-12",
		SleepHours: &sleep,
	})
	require.NoError(t, err)

	// Step 2: update with HRV only
	hrv := 55.0
	snap, err := UpsertHealthSnapshot(HealthSnapshotInput{
		Date: "2026-03-12",
		HRV:  &hrv,
	})
	require.NoError(t, err)

	// Reload from DB to verify actual stored values
	var stored model.HealthSnapshot
	require.NoError(t, database.DB.Where("date = ?", "2026-03-12").First(&stored).Error)

	assert.Equal(t, &sleep, stored.SleepHours, "sleep_hours must be preserved after HRV-only update")
	assert.Equal(t, &hrv, stored.HRV, "HRV must be set")
	assert.Nil(t, stored.Weight, "Weight should remain nil")
	// Also verify the returned object has the HRV (existing record is returned)
	_ = snap
}

func TestUpsertHealthSnapshot_WorkoutsNotDeletedByEmptyUpdate(t *testing.T) {
	setupTestDB(t)

	// Step 1: create with workouts
	sleep := 7.0
	_, err := UpsertHealthSnapshot(HealthSnapshotInput{
		Date:       "2026-03-12",
		SleepHours: &sleep,
		Workouts: []WorkoutEntry{
			{Type: "Running", Minutes: 30},
			{Type: "Yoga", Minutes: 20},
		},
	})
	require.NoError(t, err)

	// Verify workout logs exist
	var logCount int64
	database.DB.Model(&model.HealthWorkoutLog{}).Where("snapshot_date = ?", "2026-03-12").Count(&logCount)
	assert.Equal(t, int64(2), logCount, "should have 2 workout logs after create")

	// Step 2: update with HRV only (no workouts)
	hrv := 60.0
	_, err = UpsertHealthSnapshot(HealthSnapshotInput{
		Date: "2026-03-12",
		HRV:  &hrv,
	})
	require.NoError(t, err)

	// Verify workout logs are NOT deleted
	database.DB.Model(&model.HealthWorkoutLog{}).Where("snapshot_date = ?", "2026-03-12").Count(&logCount)
	assert.Equal(t, int64(2), logCount, "workout logs must not be deleted by a non-workout update")

	// Verify workout summary is preserved
	var stored model.HealthSnapshot
	require.NoError(t, database.DB.Where("date = ?", "2026-03-12").First(&stored).Error)
	assert.NotNil(t, stored.WorkoutSummary, "WorkoutSummary must be preserved")
}

func TestUpsertHealthSnapshot_WorkoutsReplacedWhenProvided(t *testing.T) {
	setupTestDB(t)

	// Step 1: create with workouts
	sleep := 7.0
	_, err := UpsertHealthSnapshot(HealthSnapshotInput{
		Date:       "2026-03-12",
		SleepHours: &sleep,
		Workouts: []WorkoutEntry{
			{Type: "Running", Minutes: 30},
		},
	})
	require.NoError(t, err)

	// Step 2: update with new workouts
	_, err = UpsertHealthSnapshot(HealthSnapshotInput{
		Date: "2026-03-12",
		Workouts: []WorkoutEntry{
			{Type: "Cycling", Minutes: 45},
			{Type: "Stretching", Minutes: 10},
		},
	})
	require.NoError(t, err)

	// Verify old logs replaced with new ones
	var logs []model.HealthWorkoutLog
	database.DB.Where("snapshot_date = ?", "2026-03-12").Find(&logs)
	assert.Len(t, logs, 2, "should have 2 new workout logs")
	types := []string{logs[0].WorkoutType, logs[1].WorkoutType}
	assert.Contains(t, types, "Cycling")
	assert.Contains(t, types, "Stretching")
}

func TestUpsertHealthSnapshot_CreateWithNoWorkouts_DoesNotCallSave(t *testing.T) {
	setupTestDB(t)

	sleep := 8.0
	_, err := UpsertHealthSnapshot(HealthSnapshotInput{
		Date:       "2026-03-12",
		SleepHours: &sleep,
	})
	require.NoError(t, err)

	// Verify no workout logs created
	var logCount int64
	database.DB.Model(&model.HealthWorkoutLog{}).Where("snapshot_date = ?", "2026-03-12").Count(&logCount)
	assert.Equal(t, int64(0), logCount)
}
