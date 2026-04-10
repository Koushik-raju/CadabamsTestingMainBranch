## Context

The chat thread page (`app/(auth)/chat/thread/[thread_id]/page.tsx`) uses `useChat` from `@ai-sdk/react` to manage live message streaming. However, when a user navigates to an existing thread, no historical messages are loaded — `useChat` starts with an empty message list. Mastra stores all thread messages and exposes them via `thread.listMessages()` on the client SDK. The `MessageList` component currently auto-scrolls to the bottom on new messages but has no scroll-to-top detection.

## Goals / Non-Goals

**Goals:**
- Load the 10 most recent messages on thread mount, displayed in oldest-first order
- Enable "load more" for older messages when the user scrolls to the top
- Preserve scroll position when prepending older messages
- Keep page component lean by encapsulating fetch logic in a dedicated hook

**Non-Goals:**
- Real-time sync of messages sent from other devices (existing SSE stream handles new messages)
- Infinite scroll downward (new messages come via `useChat` stream)
- Caching across navigation (in-memory only, refreshed on each thread visit)

## Decisions

### 1. New hook `hooks/use-thread-messages.ts` for history fetch

**Decision**: Encapsulate Mastra pagination in a dedicated hook rather than inline in the page.

**Rationale**: The page already manages `useChat`, auth header, and routing state. Mixing pagination logic inline would make it hard to test and reason about. The hook exposes `{ historicalMessages, loadMore, hasMore, isLoading }` and can be reused if other surfaces need thread history.

**Alternative considered**: SWR with a key per page — rejected because pages are loaded imperatively (on scroll), not declaratively, making SWR's key-based revalidation awkward. Plain `useState`/`useCallback` gives full control over prepend ordering and scroll lock.

### 2. Seed `useChat` with `initialMessages` from history

**Decision**: Pass historical messages as `initialMessages` to `useChat` so the hook owns a single unified message list.

**Rationale**: `useChat` already handles deduplication, streaming appends, and optimistic updates. Maintaining a separate list and merging on render adds complexity and risks ordering bugs.

**Alternative considered**: Render two lists (history + live) — rejected because it complicates scroll management and the "today" divider logic in `MessageList`.

### 3. Scroll-to-top detection in `MessageList` via `onScroll`

**Decision**: Add an `onLoadMore` callback prop to `MessageList`. Fire it when `scrollTop === 0` and `hasMore` is true.

**Rationale**: `MessageList` owns the scrollable container (`overflow-y-auto`). Lifting the scroll listener to the page would require a forwarded ref and more wiring. A callback prop keeps the contract simple.

**Scroll position preservation**: Before prepending, capture `scrollHeight`. After state update + DOM paint (`useLayoutEffect`), set `scrollTop = newScrollHeight - capturedScrollHeight` to keep the viewport anchored.

### 4. Pagination direction: newest-first fetch, oldest-first display

**Decision**: Fetch with `orderBy: { field: 'createdAt', direction: 'DESC' }` and reverse before display.

**Rationale**: We want the last N messages (most recent) on mount. Fetching DESC and reversing for display is simpler than computing an offset for the last page with ASC ordering, especially when `total` may not be known upfront.

**Page tracking**: `page` starts at 0. Each "load more" increments the page and prepends the result.

## Risks / Trade-offs

- **Race condition on rapid scrolls**: If the user scrolls to top multiple times before a fetch resolves, duplicate requests could fire. → Mitigation: Gate `loadMore` with an `isLoading` flag; ignore calls while a fetch is in-flight.
- **`initialMessages` re-seeding on hot reload**: During development, `useChat` may re-initialize and lose history. → Acceptable in dev only; no production impact.
- **`toAISdkV5Messages` compatibility**: The conversion utility must match the version of `ai` used by `useChat`. → Mitigation: Both come from the `@mastra/ai-sdk` package which pins to the correct version. Verify import at implementation time.
- **Large threads on first load**: 10 messages is a conservative page size. If messages contain long content, initial render is still fast. → Acceptable trade-off; page size is a constant that can be tuned.

## Migration Plan

1. Add `hooks/use-thread-messages.ts` — no impact on existing routes.
2. Update `components/chat/message-list.tsx` with `onLoadMore` prop (optional, backward-compatible default: no-op).
3. Update `app/(auth)/chat/thread/[thread_id]/page.tsx` to wire history into `useChat` and pass `onLoadMore` to `MessageList`.
4. No database migrations, no API changes, no environment variable changes required.
5. Rollback: revert the three files above; no persistent state is affected.

## Open Questions

- Should a loading spinner appear at the top of the list while older messages are fetching? (Assume yes — a small centered spinner above the first message.)
- What agent ID should be passed to `getMemoryThread`? (Check `mastraDataContext` or `MASTRA_BACKEND_URL` config for the agent identifier used in `sendMessage`.)
