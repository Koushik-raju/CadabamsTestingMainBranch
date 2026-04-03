# Phase 9 Complete — Journey System

## Pages Created

### Auth Routes
- `app/(auth)/journey/page.tsx` — User's active journeys + Explore section (Firebase-backed)
- `app/(auth)/journey/loading.tsx` — Skeleton loading state
- `app/(auth)/journey/mood-check/page.tsx` — Daily mood check-in form (saves to Firebase)

### Public Routes
- `app/(public)/journey/page.tsx` — Public journey browse/discovery (Strapi API)
- `app/(public)/journey/[id]/page.tsx` — Journey detail with day-by-day list and CTA to sign up

## Components Created

| Component | Description |
|-----------|-------------|
| `components/journey/journey-card.tsx` | Active journey card with progress bar, streak, level |
| `components/journey/journey-day-list.tsx` | Day-by-day list (locked/unlocked/completed states) |
| `components/journey/journey-discovery-card.tsx` | Browse/discovery card (featured + grid variants) |
| `components/journey/mood-check-form.tsx` | Mood check-in form with native range sliders |
| `components/journey/premium-badge.tsx` | Premium indicator badge using Lucide Sparkles |
| `components/ui/progress.tsx` | shadcn progress bar (synced from main app) |

## Key Patterns

### Firebase Data Paths
- User journeys list: `userJourneysMobile/{mobile}/journeys/{journeyId}`
- Journey task completion: `userJourneysMobile/{mobile}/journeyData/{journeyId}/tasks/{taskId}`
- Mood check-in: saved as task type `mood` with `moodDetails` payload

### API
- Journey catalog: `https://mindtalkbuddy.com/api/mindful-journeys?populate=icon`
- Journey detail: `https://mindtalkbuddy.com/api/mindful-journeys?filters[documentId][$eq]={id}&populate=journey&populate=icon`

### Firebase Dynamic Import Pattern
```typescript
const { database } = await import('@/lib/firebase');
const { ref, get } = await import('firebase/database');
```

## Checks
- `pnpm tsc --noEmit` — 0 errors
- `pnpm build` — 47 static pages, 0 errors
