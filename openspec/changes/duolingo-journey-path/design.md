## Context

The journey path view at `app/(auth)/journeys/[id]/details/page.tsx` already implements a Duolingo-style vertical zigzag path. However tapping a node immediately navigates to the task — skipping the Duolingo "preview sheet → choose action" flow. There is no haptic feedback, no XP celebration animation, no mandatory/optional distinction, and the active node bubble shows a generic "Start" label rather than the task title.

The `react-haptic` library is already installed. The existing `PathNode` and `PathChain` components are clean and extensible. The Firebase progress model already tracks `completedNodeIds`, `gems`, and `streak`.

## Goals / Non-Goals

**Goals:**
- Tap on a path node → bottom sheet preview → user presses CTA → navigation happens
- Haptic feedback on: node tap, task completion, subscribe, streak milestone
- XP float-up animation (+10 Gems) after a task completes
- Active node speech bubble shows the task name, not just "Start"
- Mandatory tasks visually distinct from optional ones (bold border / badge)
- Completed node ring-glow trail for visual history
- Unit header gets a Guidebook button

**Non-Goals:**
- Changing the Firebase data model or progress logic
- Leaderboards or social features
- Real XP system (gems already exist; no server-side XP endpoint)
- Offline mode / caching beyond current SWR setup

## Decisions

### 1. Task preview sheet lives in `details/page.tsx`, not PathNode

**Decision**: The sheet is managed at the page level using a `selectedNode` state. PathNode receives a simple `onClick` callback and stays dumb.

**Why**: PathNode should remain a pure presentational component. Sheets need routing context (`useRouter`) and progress context (`mobile`, `id`), which are available only in the page. Lifting state to the page avoids prop-drilling or a context.

**Alternative considered**: A `TaskPreviewSheet` component receiving a `task` prop and router directly — rejected because it still requires mobile/journeyId context, making it tightly coupled.

### 2. Haptic triggers are fire-and-forget at call sites

**Decision**: Thin wrapper functions in `lib/haptics.ts` expose `hapticLight/Medium/Success/Warning` using `@capacitor/haptics`. Called inline at each interaction point, no await, errors swallowed silently.

**Why**: `@capacitor/haptics` provides granular `ImpactStyle` and `NotificationType` — more expressive than a single `vibrate()`. A thin wrapper keeps call sites clean and degrades gracefully on web (Capacitor stubs return silently).

### 3. XP float animation is a local React state in the page

**Decision**: A floating "+10 Gems" label is rendered absolutely over the active node position. It's triggered by a boolean flag set after `updateNodeProgress` resolves, and cleared after 1.2s via `setTimeout`.

**Why**: Simple and self-contained. No animation library needed — `tailwind-animate` provides `animate-in fade-in-0 slide-in-from-bottom-4` and `animate-out fade-out-0 slide-out-to-top-4`.

### 4. Mandatory/optional flag from `task.taskType`

**Decision**: Derive `isMandatory` client-side: tasks with assessments, audios, or fillSelfJournal are mandatory; worksheets and mood check-in are optional.

**Why**: The Strapi API does not return an explicit mandatory flag on tasks. A client-side heuristic is sufficient since optional tasks already have lower engagement stakes. This avoids a breaking API change.

## Risks / Trade-offs

- [Haptic on iOS] Hidden switch trick may not fire in all iOS browsers → Mitigation: react-haptic handles this internally; no action needed
- [Sheet flicker] Opening the preview sheet on tap may feel slow if `task` data has not been hydrated → Mitigation: `task` is always available since it comes from the already-loaded journey detail
- [Animation jank] `animate-ping` + float animation simultaneously may drop frames on low-end devices → Mitigation: float animation only runs for 1.2s; pulse rings use `will-change: transform` implicitly via Tailwind
