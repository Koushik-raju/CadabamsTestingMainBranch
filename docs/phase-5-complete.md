# Phase 5 Complete — Assessments & Worksheets

## Summary

Phase 5 implements the full assessments and worksheets feature set for the MindTalk Capacitor + Next.js app.

## Pages Created

| Route | File | Description |
|---|---|---|
| `/assessments` | `app/(auth)/assessments/page.tsx` | Authenticated page listing assigned assessments and worksheets from Firestore |
| `/assessments` | `app/(auth)/assessments/loading.tsx` | Skeleton loading state |
| `/assessment` | `app/(public)/assessment/page.tsx` | Entry redirect — goes to `/assessment/form?id=X` or `/assessments` |
| `/assessment/form` | `app/(public)/assessment/form/page.tsx` | Step-by-step assessment form with progress bar |
| `/assessment/details` | `app/(public)/assessment/details/page.tsx` | Assessment detail view with completion status |
| `/assessment/analysis` | `app/(public)/assessment/analysis/page.tsx` | History view showing past submissions from Firebase |
| `/worksheet` | `app/(public)/worksheet/page.tsx` | Entry redirect |
| `/worksheet/form` | `app/(public)/worksheet/form/page.tsx` | Step-by-step worksheet form |

## Components Created

| Component | Description |
|---|---|
| `components/assessment/assessment-card.tsx` | Card for an assigned assessment with status badge |
| `components/assessment/question-renderer.tsx` | Renders MCQ, yes/no, smiley, rating, or text questions |
| `components/assessment/answer-selectors/mcq.tsx` | Single-select multiple choice |
| `components/assessment/answer-selectors/smiley.tsx` | 5-emoji smiley rating selector |
| `components/assessment/answer-selectors/yes-no.tsx` | Yes/No toggle buttons |
| `components/worksheet/worksheet-card.tsx` | Card for an assigned worksheet |

## Service Created

`services/assessment.service.ts` — Fetches assigned assessments and worksheets from Firestore `patient_assignments/{leadId}`, checks completion status in Firebase Realtime Database.

## Data Flow

1. **Assignments list**: Reads from Firestore `patient_assignments/{leadId}.assessments` and `patient_assignments/{leadId}.worksheets`, checks completion in RTDB `assessments/{leadId}/{assessmentId}`.
2. **Assessment form**: Fetches question data from `https://mindtalkbuddy.com/api/assessments/{id}?pLevel=4`, renders questions step-by-step, submits to both Firebase RTDB and backend via `chatService.saveAssessment()`.
3. **Worksheet form**: Same pattern but reads from `https://mindtalkbuddy.com/api/worksheets/{id}?pLevel=4`, saves to RTDB `worksheets/{leadId}/{worksheetId}`.
4. **Analysis**: Reads submission history from RTDB `assessments/{leadId}/{assessmentId}`.

## Question Types Supported

- `mcq` / `assessment.multiple-choice-question` — radio pill buttons
- `yes_no` — large Yes/No buttons with color feedback
- `smiley` / `assessment.smiley-selector` — emoji rating scale 1–5
- `rating` — numeric 1–10 scale
- `text` / `assessment.qa` — textarea input

## Build Status

- `pnpm tsc --noEmit`: PASS (no errors)
- `pnpm build`: Blocked by stale `.next/lock` file owned by root. Run `sudo rm .next/lock` then `pnpm build`.

## Dependencies

- shadcn `progress` component installed via `pnpm dlx shadcn@latest add progress`
- Firebase RTDB (`@/lib/firebase` — `database` export)
- Firebase Firestore (`@/lib/firebase` — `firestore` export)
- `axios` for assessment API calls
- Existing: `useAuth`, `BackButton`, `chatService`
