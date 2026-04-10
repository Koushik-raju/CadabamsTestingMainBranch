## Why

Chat-related code is fragmented: `MastraThread` types and `formatDate` helpers are duplicated across pages, thread-fetching logic is copy-pasted between the chat-history page and the chat page's inline history drawer, and data fetching uses raw `useEffect`/`useState` instead of SWR — causing unnecessary re-fetches and no caching. Consolidating now gives a single, well-structured surface to build on as the AI chat feature grows.

## What Changes

- **Route structure** — preserve existing routes (`/chat-history`, `/new-chat`, `/chat/[threadId]`) but clean up each page to be thin orchestrators only
- **Shared types** — extract `MastraThread` interface and `formatDate` utility into `lib/chat.ts` (single source of truth)
- **SWR hook** — replace all manual `useEffect`/`setState` thread-fetching with a `useThreads` SWR hook; inline history drawer in `ChatPage` reuses the same hook, eliminating the duplicate fetch
- **Component extraction** — pull inline `LoadingState`, `EmptyState`, `ThreadCard`, `HistoryDrawer`, `ChatHeader`, `MessageList`, `MessageBubble`, and `ChatInput` out of page files and into `components/chat-history/`, `components/chat/`, and `components/shared/navigation/`
- **Back button** — `components/common/back-button.tsx` already exists; standardise its usage in chat pages (chat page currently rolls its own inline `ChevronLeft` button)
- **`/new-chat`** — convert from a client-side redirect to a server-side redirect (`redirect()`) for instant navigation with no client JS cost
- **AGENTS.md + CLAUDE.md update** — document the `components/shared/navigation/` convention and the `useThreads` SWR hook location

## Capabilities

### New Capabilities

- `chat-route-structure`: Route and file layout for chat pages — thin page files, clear component boundaries, server-side redirect for `/new-chat`
- `chat-swr-hooks`: SWR-based `useThreads` hook at `hooks/use-threads.ts` with cache key, revalidation, and shared `MastraThread` type from `lib/chat.ts`
- `chat-components`: Extracted, co-located components under `components/chat-history/`, `components/chat/`, and `components/shared/navigation/back-button.tsx`

### Modified Capabilities

_(none — no existing OpenSpec specs to delta)_

## Impact

- **Files modified**: `app/(auth)/chat-history/page.tsx`, `app/(auth)/chat/[threadId]/page.tsx`, `app/(auth)/new-chat/page.tsx`, `AGENTS.md`, `CLAUDE.md`
- **Files created**: `lib/chat.ts`, `hooks/use-threads.ts`, `components/chat-history/thread-card.tsx`, `components/chat-history/thread-list.tsx`, `components/chat-history/empty-state.tsx`, `components/chat-history/loading-state.tsx`, `components/chat/chat-header.tsx`, `components/chat/message-bubble.tsx`, `components/chat/message-list.tsx`, `components/chat/chat-input.tsx`, `components/chat/history-drawer.tsx`
- **Dependencies**: `swr` (already a common dep in Next.js projects; confirm or add), `uuid` (already used)
- **No breaking API changes** — all existing routes and external interfaces are preserved
