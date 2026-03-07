## ADDED Requirements

### Requirement: Morning wellness AI analysis
The system SHALL, during the morning skincare notification job, call the Claude API with a wellness context prompt that includes the current menstrual cycle phase, today's health snapshot (if available), and the last 7 days of health snapshots. The system SHALL generate diet and exercise recommendations in Traditional Chinese.

#### Scenario: Full data available
- **WHEN** the morning notification job runs and both a cycle phase and a today's health snapshot exist
- **THEN** the system SHALL send a context-rich prompt to Claude API and receive diet and exercise recommendations

#### Scenario: Health snapshot unavailable
- **WHEN** the morning notification job runs but no health snapshot exists for today or yesterday
- **THEN** the system SHALL still call Claude API using only the cycle phase and request generic phase-appropriate recommendations

#### Scenario: Claude API call fails
- **WHEN** the Claude API returns an error or times out
- **THEN** the system SHALL log the error, skip the AI recommendations section, and proceed to send the skincare notification without wellness advice

#### Scenario: ANTHROPIC_API_KEY not configured
- **WHEN** the `ANTHROPIC_API_KEY` environment variable is empty or absent
- **THEN** the system SHALL skip the Claude API call entirely and proceed without wellness recommendations

### Requirement: Wellness recommendation persistence
The system SHALL store each Claude API response in a `wellness_recommendations` table with fields: `id` (UUID), `date` (YYYY-MM-DD), `cycle_phase` (string), `diet_advice` (text), `exercise_advice` (text), `raw_response` (text), `created_at`.

#### Scenario: Successful recommendation stored
- **WHEN** the Claude API returns a response
- **THEN** the system SHALL persist the response to the `wellness_recommendations` table before sending the Discord notification

#### Scenario: Table created on server start
- **WHEN** the server starts
- **THEN** GORM AutoMigrate SHALL create the `wellness_recommendations` table if it does not exist

### Requirement: Morning Discord notification includes wellness section
The system SHALL append a wellness recommendations section to the morning Discord notification message, after the skincare routine section.

#### Scenario: AI recommendations available
- **WHEN** a wellness recommendation was successfully generated for today
- **THEN** the Discord message SHALL include a "飲食建議" block and an "運動建議" block with the Claude-generated content

#### Scenario: AI recommendations unavailable
- **WHEN** no wellness recommendation was generated (API failure or key missing)
- **THEN** the Discord message SHALL be sent with only the skincare routine section, without any wellness block

### Requirement: Claude wellness prompt structure
The system SHALL construct the Claude prompt with: (1) system role as personal health advisor, (2) current cycle phase label and day, (3) today's health metrics (sleep hours, HRV, resting HR, active calories, workout), (4) weight if available, (5) instruction to respond in Traditional Chinese with two sections: 飲食建議 and 運動建議, each 2-3 sentences, practical and actionable.

#### Scenario: Prompt includes cycle phase
- **WHEN** the cycle is in "luteal" phase on day 22
- **THEN** the prompt SHALL include the phase name and day number in Chinese (e.g., "黃體期，第22天")

#### Scenario: Prompt handles missing metrics gracefully
- **WHEN** HRV data is absent from today's snapshot
- **THEN** the prompt SHALL omit the HRV field rather than sending "null" or "0"
