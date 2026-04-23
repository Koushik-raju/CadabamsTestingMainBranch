## ADDED Requirements

### Requirement: Unsubscribed node tap opens preview-only sheet
When the user is not subscribed (`progress` is `null`) and taps any node on the path, the app SHALL open a read-only bottom sheet (`JourneyPreviewSheet`) that shows the task type badge, task title, and a subscribe CTA. The sheet SHALL NOT navigate to task pages and SHALL NOT call `updateNodeProgress`.

#### Scenario: Unsubscribed user taps any node
- **WHEN** `!isSubscribed` and the user taps a node
- **THEN** `JourneyPreviewSheet` opens showing: task type emoji + label, task title, a brief description if available
- **AND** the primary CTA is "Start Free Journey →" (free journey) or "View Plans →" (premium journey)
- **AND** no navigation to task pages occurs
- **AND** `updateNodeProgress` is NOT called

#### Scenario: Preview sheet subscribe CTA tapped (free journey)
- **WHEN** user taps "Start Free Journey →" inside the preview sheet
- **THEN** sheet closes and `subscribeToJourney` is called (same flow as footer CTA)

#### Scenario: Preview sheet plans CTA tapped (premium journey)
- **WHEN** user taps "View Plans →" inside the preview sheet
- **THEN** sheet closes and router navigates to `/packages`

### Requirement: Zero mutating backend calls while unenrolled
When the user is not enrolled (`progress === null`), the page SHALL make NO backend calls other than (a) the initial `GET ?preview=true` to fetch journey structure+progress state, and (b) the explicit `subscribeToJourney` (POST) when the user taps the subscribe CTA. No `tickJourney`, no `updateNodeProgress`, no SWR revalidation on focus, no background refetch.

#### Scenario: Unenrolled user lingers on the page
- **WHEN** `progress === null` and the user scrolls, taps nodes, opens and closes the preview sheet repeatedly
- **THEN** the network tab shows only the single initial GET; no additional requests fire

#### Scenario: Unenrolled user taps subscribe
- **WHEN** user taps "Start Free Journey →"
- **THEN** exactly one POST to the enroll endpoint fires, followed by SWR revalidation once the enrollment is cached

### Requirement: UI remains interactive but read-only while unenrolled
All nodes SHALL be visually rendered (same layout as enrolled) but tapping them SHALL only open the preview sheet. No node performs any action that would require a backend mutation.

#### Scenario: Unenrolled user taps a "locked" node
- **WHEN** user taps a node displayed as `locked`
- **THEN** preview sheet opens with the same content as for active nodes; no backend call fires

### Requirement: Subscribed user node tap opens full action sheet
When `isSubscribed` is `true`, tapping a node SHALL open `JourneyTaskActionSheet` as before — no change to subscribed flow.

#### Scenario: Subscribed user taps an active node
- **WHEN** `isSubscribed` is `true` and the user taps an active node
- **THEN** `JourneyTaskActionSheet` opens with navigation and mark-done CTAs
