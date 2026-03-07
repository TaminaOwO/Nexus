## ADDED Requirements

### Requirement: Daily health snapshot sync via API
The system SHALL provide a `POST /api/lifeos/health/sync` endpoint that accepts a daily health snapshot from iOS Shortcuts. The endpoint SHALL upsert the record by date (one snapshot per calendar day). All health fields are optional to accommodate partial data availability.

#### Scenario: iOS Shortcut posts full health data
- **WHEN** a POST request is sent to `/api/lifeos/health/sync` with `date`, `sleep_hours`, `hrv`, `resting_hr`, `active_calories`, `workout_type`, `workout_minutes`, and `weight`
- **THEN** the system SHALL store a `HealthSnapshot` record and return HTTP 200 with the saved record

#### Scenario: iOS Shortcut posts partial health data
- **WHEN** a POST request is sent with only `date` and `sleep_hours` (other fields absent)
- **THEN** the system SHALL store a `HealthSnapshot` with only `sleep_hours` populated and return HTTP 200

#### Scenario: Duplicate date upsert
- **WHEN** a POST request is sent for a date that already has a snapshot
- **THEN** the system SHALL update the existing record with the new values and return HTTP 200

#### Scenario: Missing date field
- **WHEN** a POST request is sent without a `date` field
- **THEN** the system SHALL return HTTP 400 with an error message

### Requirement: Health snapshot data model persistence
The system SHALL persist health snapshots in a `health_snapshots` table with the following fields: `id` (UUID), `date` (YYYY-MM-DD, unique), `sleep_hours` (nullable float), `hrv` (nullable float), `resting_hr` (nullable float), `active_calories` (nullable float), `workout_type` (nullable string), `workout_minutes` (nullable float), `weight` (nullable float), `created_at`, `updated_at`.

#### Scenario: Table created on server start
- **WHEN** the server starts
- **THEN** GORM AutoMigrate SHALL create the `health_snapshots` table if it does not exist

### Requirement: Retrieve latest health snapshot
The system SHALL provide a `GET /api/lifeos/health/latest` endpoint that returns the most recent health snapshot by date.

#### Scenario: Snapshot exists
- **WHEN** GET `/api/lifeos/health/latest` is called and at least one snapshot exists
- **THEN** the system SHALL return the snapshot with the most recent `date` and HTTP 200

#### Scenario: No snapshots exist
- **WHEN** GET `/api/lifeos/health/latest` is called and no snapshots exist
- **THEN** the system SHALL return HTTP 404
