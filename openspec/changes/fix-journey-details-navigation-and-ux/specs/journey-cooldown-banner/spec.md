## ADDED Requirements

### Requirement: Cooldown banner shows correct day label
The cooldown banner SHALL display `Day {progress.currentDay} done · Day {progress.currentDay + 1} unlocks next`. It MUST use `progress.currentDay` (the server's 1-based field), not the derived `currentDayIdx`.

#### Scenario: Cooldown banner day label
- **WHEN** `showCooldownBanner` is `true` and `progress.currentDay` is `3`
- **THEN** the banner footer reads "Day 3 done · Day 4 unlocks next"

### Requirement: Cooldown countdown timer displays time remaining
When `progress.nextDayUnlocksAt` is a future timestamp, the banner SHALL display a live countdown in `MM:SS` format that decrements every second. When the countdown reaches zero, `tickJourney` SHALL be called to re-fetch state.

#### Scenario: Timer active
- **WHEN** `nextDayUnlocksAt` is 5 minutes in the future
- **THEN** the banner shows `05:00` decrementing every second

#### Scenario: Timer reaches zero
- **WHEN** the countdown hits `00:00`
- **THEN** `tickJourney(progress.id, journeyId)` is called and the banner hides once `nextDayUnlocksAt` is no longer in the future

### Requirement: Tasks-done fraction shows today's progress
The banner footer SHALL show `{todayDone}/{todayTotal} tasks` computed from enrollment tasks where `dayNumber === progress.currentDay`.

#### Scenario: Partial completion
- **WHEN** 2 of 3 tasks on `currentDay` are `completed`
- **THEN** banner shows "2/3 tasks"
