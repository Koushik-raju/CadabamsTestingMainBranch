## 1. Haptic Feedback

- [x] 1.1 Create `lib/haptics.ts` exporting `hapticLight()`, `hapticMedium()`, `hapticSuccess()`, `hapticWarning()` wrappers using `@capacitor/haptics` (fire-and-forget, no await, silently swallow errors on web)
- [x] 1.2 Wire `hapticLight()` on node tap in `details/page.tsx` `handleNodeTap`
- [x] 1.3 Wire `hapticSuccess()` after `updateNodeProgress` resolves in `handleNodeTap`
- [x] 1.4 Wire `hapticMedium()` after `subscribeToJourney` succeeds in `handleSubscribe`
- [x] 1.5 Wire `hapticWarning()` when a locked node is tapped in `handleNodeTap`

## 2. Task Preview Sheet Component

- [x] 2.1 Create `components/journey/task-preview-sheet.tsx` — bottom sheet (use existing `Sheet` from `@/components/ui/sheet`) accepting `task`, `variant`, `isMandatory`, `onStart`, `onClose` props
- [x] 2.2 Sheet header: task title (truncated), task type colored pill badge (Assessment=purple/10, Audio=blue/10, Journal=amber/10, etc.), "+10 XP ⚡" reward chip (XP maps to existing `gems` field — no new Firebase fields)
- [x] 2.3 Show "Optional" badge in sheet when `!isMandatory`
- [x] 2.4 Show "Completed ✓" green badge when `variant === 'completed'`; CTA button label = "Review", otherwise "Start"
- [x] 2.5 CTA button calls `onStart()` which closes sheet and navigates to task route

## 3. Wire Task Preview Sheet into Details Page

- [x] 3.1 Add `selectedNode` state (`PathChainNode | null`) and `previewOpen` boolean state to `DetailsContent`
- [x] 3.2 In `handleNodeTap`: for active/completed nodes fire `hapticLight()` then set `selectedNode` + `previewOpen = true` (do NOT navigate directly)
- [x] 3.3 Extract navigation logic into `navigateToTask(task)` helper reusable by both `TaskPreviewSheet.onStart` and `handleContinue`
- [x] 3.4 Render `<TaskPreviewSheet>` at bottom of path view JSX, passing `selectedNode` data

## 4. Node Enhancements — PathNode Component

- [x] 4.1 Add `taskTitle?: string` prop to `PathNode`; render it in the speech bubble instead of "Start" (fallback to "Start" if empty)
- [x] 4.2 Add `isMandatory?: boolean` prop to `PathNode`; for non-completed, non-locked default nodes: mandatory → thick `ring-2 ring-primary/60`, optional → `border-dashed border-2 border-border`
- [x] 4.3 Add `isNew?: boolean` prop (just completed) to `PathNode`; apply `animate-in zoom-in-50 duration-300` class when `isNew` is true

## 5. Wire Node Props Through PathChain

- [x] 5.1 Add `taskTitle?: string` and `isMandatory?: boolean` fields to `PathChainNode` interface in `path-chain.tsx`
- [x] 5.2 Compute `isMandatory` per node in `details/page.tsx` node-building loop: mandatory if `assessments.length > 0 || audios.length > 0 || fillSelfJournal === true`
- [x] 5.3 Compute `taskTitle` per node: use `task.extraTaskTitle` if present, else first assessment title, else first audio title, else empty string
- [x] 5.4 Pass `taskTitle` and `isMandatory` into each `PathChainNode` object and propagate through `PathChain` → `PathNode`

## 6. XP Float-Up Animation

- [x] 6.1 Create `components/journey/xp-float.tsx` — absolutely positioned "+10 XP ⚡" label using `animate-in fade-in-0 slide-in-from-bottom-2` then after 1s applies `opacity-0 translate-y-[-20px] transition-all duration-300`, removed from DOM after 1.3s
- [x] 6.2 Add `showXpFloat` boolean state in `DetailsContent`; set to `true` after `updateNodeProgress` resolves, auto-clear after 1.3s
- [x] 6.3 Render `<XpFloat />` relative to the active node area (wrap path view in `relative`, float positioned near the active node)

## 7. Unit Header Guidebook Button

- [x] 7.1 Add optional `onGuidebook?: () => void` prop to `UnitHeaderBar` (`components/journey/unit-header-bar.tsx`)
- [x] 7.2 When `onGuidebook` is provided, render a small "Guidebook" pill button (BookOpen icon + text, outlined style) on the right side of the header bar
- [x] 7.3 In `details/page.tsx`, pass `onGuidebook` that opens a bottom sheet showing the step description (use existing `Sheet` component; render step `description` via rich text or plain text fallback)

## 8. Stats Bar — Use Existing XP/Stars System (no new fields)

- [x] 8.1 In `details/page.tsx` `StatsBar`: rename Gem icon label from "Gems" to "XP" — the underlying `progress.gems` field is unchanged, only the display label changes to align with the XP/Stars system shown in the app
- [x] 8.2 In `details/page.tsx` `StatsBar`: rename Gem icon (`Gem`) to `Zap` (lightning) for XP, keep Flame for Streak, keep circular progress for % Done — matches the Level/XP/Streak language of the existing gamification system

## 9. Update Design References

- [x] 9.1 Update `proposal.md` to replace `react-haptic` with `@capacitor/haptics` reference
- [x] 9.2 Update `design.md` Decisions section to note `@capacitor/haptics` instead of `react-haptic`
