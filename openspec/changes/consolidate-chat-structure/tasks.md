## 1. Shared Foundation

- [x] 1.1 Create `lib/chat.ts` with `MastraThread` interface, `normalizeThread` function, and `formatDate` utility
- [x] 1.2 Create `hooks/use-threads.ts` with `useThreads(resourceId)` SWR hook using `['threads', resourceId]` cache key and global `swrConfig`
- [x] 1.3 Create `components/shared/navigation/back-button.tsx` that re-exports `BackButton` from `@/components/common/back-button`

## 2. Chat-History Components

- [x] 2.1 Create `components/chat-history/loading-state.tsx` — skeleton rows matching thread card layout (3–4 rows)
- [x] 2.2 Create `components/chat-history/empty-state.tsx` — icon, heading, description, and "Start New Chat" button prop
- [x] 2.3 Create `components/chat-history/thread-card.tsx` — single thread row with icon, title, formatted date, chevron; keyboard accessible (Enter/Space)
- [x] 2.4 Create `components/chat-history/thread-list.tsx` — maps thread array to `ThreadCard` list in a scrollable section

## 3. Chat Page Components

- [x] 3.1 Create `components/chat/chat-header.tsx` — `<BackButton>` from shared/navigation, agent name, subtitle, and history icon button
- [x] 3.2 Create `components/chat/message-bubble.tsx` — user/assistant bubble with `<Streamdown>`, `<ThinkingComponent>` for streaming, and timestamp
- [x] 3.3 Create `components/chat/message-list.tsx` — scrollable container with bottom-anchor ref and auto-scroll on new messages
- [x] 3.4 Create `components/chat/chat-input.tsx` — controlled text input + send button, disabled while streaming
- [x] 3.5 Create `components/chat/history-drawer.tsx` — `<Sheet>` using `useThreads` hook with loading/empty/list states and "New Chat" button that calls `mutate` then navigates

## 4. Update Pages

- [x] 4.1 Rewrite `app/(auth)/chat-history/page.tsx` to use `useThreads`, `ThreadList`, `LoadingState`, `EmptyState` — remove all inline component definitions and duplicate types
- [x] 4.2 Rewrite `app/(auth)/chat/[threadId]/page.tsx` to use `ChatHeader`, `MessageList`, `MessageBubble`, `ChatInput`, `HistoryDrawer` — remove all inline component definitions and duplicate types
- [x] 4.3 Convert `app/(auth)/new-chat/page.tsx` to a server component using `redirect('/chat/' + crypto.randomUUID())`
- [x] 4.4 Delete `app/(auth)/new-chat/loading.tsx` (no longer needed after server redirect)

## 5. Documentation

- [x] 5.1 Update `AGENTS.md` to document component co-location convention (`components/<page-name>/`), `components/shared/navigation/` for shared nav components, and `hooks/use-threads.ts` for thread data
- [x] 5.2 Update `CLAUDE.md` to reference the same conventions (can mirror AGENTS.md additions)
