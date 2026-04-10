## Context

Three chat routes exist — `/chat-history`, `/new-chat`, `/chat/[threadId]` — but their logic overlaps badly:

- `MastraThread` type and `formatDate` are defined independently in both `chat-history/page.tsx` and `chat/[threadId]/page.tsx`
- Thread-list fetching (`createMastraClient().listMemoryThreads(...)`) is copy-pasted into both pages; the chat page re-runs this every time the history drawer opens with no caching
- All UI (loading states, empty states, thread cards, message bubbles, the history drawer) lives inline in the two page files, making them ~200–360 lines each
- `/new-chat` is a client component that fires a `router.replace` in a `useEffect` — incurring a full client-side render just to redirect
- The chat page uses an ad-hoc `<ChevronLeft>` + `router.back()` instead of the shared `<BackButton>` already in `components/common/back-button.tsx`

SWR `^2.4.1` and the global `swrConfig` at `lib/swr-config.ts` are already in the project. The `createMastraClient()` factory in `lib/mastra-client.ts` is async (needs `getAccessToken`), so a small wrapper fetcher is needed.

## Goals / Non-Goals

**Goals:**
- Single shared `MastraThread` type + `formatDate` in `lib/chat.ts`
- `hooks/use-threads.ts` — SWR hook that caches thread list per `resource_id`; shared by history page and chat-page drawer
- Extract all inline UI into `components/chat-history/` and `components/chat/` and `components/shared/navigation/`
- Convert `/new-chat` to a server-side redirect (zero client JS)
- Standardise `<BackButton>` usage across chat pages
- Document the component conventions in `AGENTS.md` / `CLAUDE.md`

**Non-Goals:**
- Changing chat API contracts, auth flow, or Mastra backend integration
- Adding new chat features (threading, reactions, etc.)
- Moving shared `<BackButton>` out of `components/common/` — it already works there

## Decisions

### 1. SWR key strategy for `useThreads`

**Decision**: cache key = `['threads', resource_id]`; fetcher calls `createMastraClient()` internally.

The fetcher must be async because `createMastraClient` awaits `getAccessToken`. SWR handles promise-returning fetchers natively. The `dedupingInterval: 5000` in the global `swrConfig` already deduplicates repeated calls within 5 s, covering the chat-page drawer opening quickly.

```ts
// hooks/use-threads.ts
export function useThreads(resourceId: string | undefined) {
  return useSWR(
    resourceId ? ['threads', resourceId] : null,
    async () => {
      const client = await createMastraClient();
      const result = await client.listMemoryThreads({ resourceId: resourceId! });
      return (result.threads ?? []).map(normalizeThread);
    },
    swrConfig,
  );
}
```

**Alternative considered**: pass the already-created client as a fetcher argument. Rejected — it requires the caller to manage client lifecycle and breaks SWR's key-based cache identity.

### 2. `/new-chat` → server redirect

**Decision**: replace the client component with a Next.js server-side `redirect()` to `/chat/<uuid>`.

UUIDs are random, so we need to generate one at request time. Using `crypto.randomUUID()` in a server component (available in Node.js 14.17+ / Edge runtime) avoids shipping any client JS for this route. The `loading.tsx` for new-chat can be removed as the redirect is instant.

**Alternative considered**: middleware redirect. Possible, but adds middleware complexity for a single route. A server component redirect is simpler and co-located.

### 3. Component co-location layout

```
components/
  chat-history/
    thread-card.tsx       # single thread row (icon, title, date, chevron)
    thread-list.tsx       # maps useThreads data → ThreadCard list
    loading-state.tsx     # skeleton rows
    empty-state.tsx       # empty illustration + CTA button
  chat/
    chat-header.tsx       # back button, agent name, history icon
    message-bubble.tsx    # user / assistant bubble with timestamp
    message-list.tsx      # scrollable list + bottom anchor ref
    chat-input.tsx        # form with text input + send button
    history-drawer.tsx    # Sheet wrapping thread list (reuses useThreads)
  shared/
    navigation/
      back-button.tsx     # re-export of components/common/back-button (or move here)
```

**Decision**: keep `components/common/back-button.tsx` in place (other pages already import it) and add a re-export at `components/shared/navigation/back-button.tsx`. Document the `shared/navigation/` path as the canonical import going forward.

**Alternative considered**: move the file. Rejected — breaks existing imports across the app.

### 4. Shared types location

**Decision**: `lib/chat.ts` exports `MastraThread` interface, `normalizeThread` (handles `Date | string` coercion), and `formatDate`.

This is a pure utility with no React dependency, so `lib/` is the right home (not `components/` or `hooks/`).

## Risks / Trade-offs

- **SWR cache staleness** → The thread list is cached per `resource_id`. After the user starts a new chat, the list won't update until the next revalidation. Mitigation: call `mutate(['threads', resource_id])` after creating a new thread. Each `handleNewChat` call should trigger this mutation.
- **`crypto.randomUUID` availability** → Available in all modern runtimes (Edge, Node ≥ 18) but may need a polyfill for older Node versions. Mitigation: verify Next.js runtime compatibility; fallback to `uuid` import if needed.
- **Import churn** → Extracting components means updating imports in page files. Low risk (small surface), but reviewers should check for missed inline usages.

## Migration Plan

1. Create `lib/chat.ts` (shared types + helpers) — no consumers yet
2. Create `hooks/use-threads.ts` — no consumers yet
3. Extract `components/chat-history/*` components; update `chat-history/page.tsx` to use them
4. Extract `components/chat/*` components; update `chat/[threadId]/page.tsx` to use them
5. Add `components/shared/navigation/back-button.tsx` re-export
6. Convert `app/(auth)/new-chat/page.tsx` to server redirect
7. Update `AGENTS.md` and `CLAUDE.md` with component conventions
8. Delete now-unused inline types/helpers from page files

Rollback: all pages are self-contained before step 3. Steps are independently reversible.

## Open Questions

- Should `history-drawer.tsx` trigger `mutate` after "New Chat" is clicked, or is the redirect + fresh page mount sufficient? (Fresh mount with SWR will re-fetch anyway — likely fine without explicit mutate.)
- Is the `new-chat/loading.tsx` skeleton still needed after the server redirect? (Likely removable.)
