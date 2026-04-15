@AGENTS.md

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

### Component Co-location Conventions

**Feature-based components**: Components are grouped by feature under `components/<feature>/`. For example:
- `components/chat/` - chat feature with subdirectories:
  - `components/chat/history/` - chat history components (thread-card, thread-list, loading-state, empty-state)
  - `components/chat/chat-header.tsx` - chat page header
  - `components/chat/message-bubble.tsx` - message bubble component
  - `components/chat/message-list.tsx` - message list container
  - `components/chat/chat-input.tsx` - chat input form
  - `components/chat/history-drawer.tsx` - history drawer sheet

**Shared components**: Components shared across multiple features are in `components/shared/`. For example:
- `components/shared/navigation/back-button.tsx` - shared navigation components

**Custom hooks**: Data fetching and stateful logic hooks go in `hooks/`. For example:
- `hooks/use-threads.ts` - SWR hook for fetching thread data with cache key `['threads', resourceId]`

### Component Co-location Conventions

**Feature-based components**: Components are grouped by feature under `components/<feature>/`. For example:

```
components/
  find-therapist/
    context.tsx            # Feature context
    wizard-view.tsx        # Wizard component
    list-view.tsx          # List view component
    doctor-card.tsx        # Doctor card for this feature
    filter-sheets.tsx      # Filter sheet components
  booking/
    date-strip.tsx         # Date strip and tile components
    slot-section.tsx       # Time slot section component
    campus-sheet.tsx       # Campus selection sheet
  checkout/
    booking-summary-card.tsx    # Booking details card
    payment-summary-card.tsx     # Payment summary card
  appointments/
    appointment-card.tsx   # Appointment card for this feature
  shared/
    navigation/
      back-button.tsx     # Shared back button component
```

### Data Fetching

This project uses **SWR** for data fetching. Follow these conventions:

#### SWR Hooks
All data fetching hooks are in the `hooks/` directory and wrap SDK calls with SWR:

| Hook | SDK Call | Returns |
|------|----------|---------|
| `useDoctor(id)` | `getDoctorsById` | `{ doctor, isLoading, error }` |
| `useAppointments()` | `getAppointments` + `getAppointmentsPrevious` | `{ upcoming, past, isLoading, error }` |
| `useSlots(doctorId, consultTypeId)` | `getAppointmentsSlots` | `{ slots, isLoading, error }` |
| `useSlotPrice(slotId)` | `getAppointmentsSlotsBySlotIdPrice` | `{ price, isLoading, error }` |
| `useCampuses()` | `getMastersCampuses` | `{ campuses, isLoading, error }` |
| `useDoctorAvailability(id)` | `getDoctorsByIdAvailability` | `{ availability, isLoading, error }` |

#### SWR Key Factory
All SWR cache keys are defined in `lib/swr-keys.ts`:

```typescript
export function doctorKey(id: number | string): string {
  return `/doctors/${id}`;
}

export function appointmentsKey(): string {
  return '/appointments';
}

export function slotsKey(doctorId: number | string, consultTypeId: number): string {
  return `/slots/${doctorId}/${consultTypeId}`;
}

export function slotPriceKey(slotId: number | string): string {
  return `/slot-price/${slotId}`;
}

export function campusesKey(): string {
  return '/campuses';
}

export function doctorAvailabilityKey(id: number | string): string {
  return `/doctor-availability/${id}`;
}
```

#### SWR Configuration
Global SWR configuration is set in `app/(auth)/layout.tsx` with `revalidateOnFocus: false` to prevent spurious refetches in the Capacitor shell.

#### Error Handling
Each hook returns `{ data, isLoading, error }`. Pages should handle all three states:
- Show loading skeleton while `isLoading` is true
- Show error message with retry button if `error` exists
- Render data normally once loaded

# Notes
use ast-grep for search.
follow @docs/DESIGN_GUIDELINES.md when creating / editing UI.
