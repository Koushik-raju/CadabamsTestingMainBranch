## ADDED Requirements

### Requirement: Haptic feedback using @capacitor/haptics
All interactive path events SHALL trigger haptic feedback via `@capacitor/haptics` (`Haptics` from `@capacitor/haptics`). Haptic calls are fire-and-forget (no await blocking UI). They degrade gracefully on web — Capacitor stubs return silently.

#### Scenario: Node tap haptic
- **WHEN** the user taps any non-locked path node
- **THEN** `Haptics.impact({ style: ImpactStyle.Light })` fires immediately on tap

#### Scenario: Task completion haptic
- **WHEN** `updateNodeProgress` resolves successfully after marking a task done
- **THEN** `Haptics.notification({ type: NotificationType.Success })` fires

#### Scenario: Subscribe haptic
- **WHEN** the user taps "Subscribe to Journey" and the subscription succeeds
- **THEN** `Haptics.impact({ style: ImpactStyle.Medium })` fires after success

#### Scenario: Locked node tap haptic
- **WHEN** the user taps a locked path node
- **THEN** `Haptics.notification({ type: NotificationType.Warning })` fires

#### Scenario: Haptic does not block navigation
- **WHEN** any haptic event fires alongside a navigation or state update
- **THEN** the haptic call does NOT await before proceeding with navigation/update
