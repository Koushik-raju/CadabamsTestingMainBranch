## Why

The current journey path view shows nodes with basic status indicators but lacks the game-like engagement of Duolingo that makes users return daily. The app needs richer visual feedback, haptic responses, task-preview sheets before navigating, mandatory/optional task distinction, and node completion celebrations to create a genuinely game-like mental wellness journey.

## What Changes

- Node tap now opens a bottom sheet preview (title, type, XP reward, CTA) instead of immediately navigating — mirrors exact Duolingo UX
- Haptic feedback on every node interaction: light tap, medium unlock, heavy on task completion
- Mandatory vs optional task distinction shown with a badge or visual difference on node
- Active node speech bubble shows the task title (not just "Start")
- XP/gems popup animation floats up on task completion (+10 Gems)
- Node scale-bounce animation plays on completion
- Unit header bar gets a Guidebook button (navigates to step info sheet)
- Completed nodes render a ring-glow for visual history trail
- Stats bar gems/streak numbers animate when they change (count-up)
- Optional: treasure chest node style for gift/bonus tasks

## Capabilities

### New Capabilities
- `task-preview-sheet`: Bottom sheet shown when tapping any non-locked node — shows task label, type badge, XP reward, and Start/Review CTA button
- `journey-haptic-feedback`: `@capacitor/haptics` wired to all interactive path events (tap, complete, unlock, subscribe)
- `node-completion-celebration`: XP float-up popup + node scale-bounce when a task is marked done
- `mandatory-optional-distinction`: Visual badge or dimming to distinguish mandatory vs optional tasks on the path

### Modified Capabilities

## Impact

- `app/(auth)/journeys/[id]/details/page.tsx` — handleNodeTap now triggers sheet, not immediate nav; subscribe also fires haptic
- `components/journey/path-node.tsx` — add mandatory/optional prop, speech bubble shows task title, ring-glow completed style
- `components/journey/path-chain.tsx` — pass isMandatory + taskTitle into PathNode
- `components/journey/unit-header-bar.tsx` — add Guidebook button
- New component: `components/journey/task-preview-sheet.tsx`
- New component: `components/journey/xp-float.tsx` (gem float-up animation)
- `hooks/use-journey.ts` — `updateNodeProgress` triggers haptic on success
- Dependencies: `@capacitor/haptics` (already installed)
