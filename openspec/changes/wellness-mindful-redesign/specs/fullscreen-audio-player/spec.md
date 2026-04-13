## ADDED Requirements

### Requirement: Fullscreen audio player overlay
The system SHALL provide a `FullscreenAudioPlayer` component that renders as a fixed full-screen overlay when audio is actively playing in the mindful minutes detail page. It SHALL look and feel like a native music player app (Spotify/Apple Music style).

#### Scenario: Opens on audio tap
- **WHEN** user taps an audio item in the mindful minutes detail page
- **THEN** the fullscreen player overlay animates in (slide up from bottom), covering the full viewport

#### Scenario: Displays track metadata
- **WHEN** the fullscreen player is open
- **THEN** it shows the audio title, category label, and cover/background art (using `backgroundVisualUrl` if available, blurred as the background, or a gradient fallback)

#### Scenario: Shows real-time progress
- **WHEN** audio is playing
- **THEN** the progress bar updates in real time showing current position and total duration formatted as `m:ss`

#### Scenario: Play/pause control works
- **WHEN** user taps the play/pause button in the fullscreen player
- **THEN** audio toggles between playing and paused states, and the button icon updates accordingly

#### Scenario: Skip controls work
- **WHEN** user taps the rewind (−10s) or forward (+10s) buttons
- **THEN** audio seeks by the specified amount and the progress bar updates immediately

#### Scenario: Seek via progress bar
- **WHEN** user drags the progress slider
- **THEN** audio seeks to the dragged position

#### Scenario: Previous / Next track navigation
- **WHEN** the detail page has multiple audio items and user taps next/previous in the fullscreen player
- **THEN** audio switches to the next or previous item in the list without closing the player

#### Scenario: Close button dismisses overlay
- **WHEN** user taps the close/chevron-down button
- **THEN** the fullscreen player animates out (slide down), audio continues playing in the background, and the list card shows "Now playing" indicator

#### Scenario: Body scroll locked while open
- **WHEN** the fullscreen player is open
- **THEN** the underlying page does not scroll

### Requirement: "Now playing" state indicator on list cards
While a track is playing, its list card in the mindful minutes detail page SHALL display a visual "Now playing" indicator (animated bars or highlighted state).

#### Scenario: Playing indicator shown
- **WHEN** a track is the active audio
- **THEN** its card shows animated equalizer bars or a "Now playing" label in the primary color

#### Scenario: Indicator cleared on stop
- **WHEN** audio ends or user pauses
- **THEN** the card reverts to normal play button state

### Requirement: Smooth open/close animation
The fullscreen player SHALL animate open and closed using CSS transitions or Framer Motion variants, not appearing/disappearing abruptly.

#### Scenario: Open animation
- **WHEN** player opens
- **THEN** it slides up from the bottom of the screen over ~300ms with an ease-out curve

#### Scenario: Close animation
- **WHEN** player closes
- **THEN** it slides down off screen over ~250ms

### Requirement: Audio continues when player is minimized
Closing the fullscreen overlay SHALL NOT stop audio playback. The audio element's state SHALL persist.

#### Scenario: Audio persists after close
- **WHEN** user closes the fullscreen player
- **THEN** audio continues playing and the list card shows the "Now playing" state

#### Scenario: Reopening resumes state
- **WHEN** user taps the same card again while audio is playing
- **THEN** the fullscreen player reopens showing the current position (not restarting from 0)
