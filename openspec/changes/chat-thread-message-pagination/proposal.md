## Why

When a user opens a previous chat thread, they only see messages sent in the current session — history stored in Mastra memory is never loaded, making the conversation context invisible. Pagination is needed to avoid loading large threads all at once.

## What Changes

- On thread page mount, fetch the last 10 messages from Mastra memory using `createMastraClient()` and `thread.listMessages()` with `orderBy: { field: 'createdAt', direction: 'ASC' }`.
- Convert fetched messages to AI SDK UI format using `toAISdkV5Messages` and seed `useChat` initial messages.
- Track pagination state (`page`, `hasMore`) to support loading older messages on demand.
- When the user scrolls to the top of `MessageList` and no more local messages are available, trigger a load of the next page (10 older messages).
- Append newly loaded pages to the top of the message list, preserving scroll position.
- A new `useThreadMessages` SWR/hook handles fetching and pagination logic, keeping the page component lean.

## Capabilities

### New Capabilities
- `chat-history-pagination`: Paginated loading of historical thread messages from Mastra memory, triggered on mount and on scroll-to-top, with oldest-first ordering and scroll-position preservation.

### Modified Capabilities

## Impact

- `app/(auth)/chat/thread/[thread_id]/page.tsx` — seeded with historical messages, wired to load-more trigger
- `components/chat/message-list.tsx` — gains scroll-to-top detection and load-more callback
- New hook `hooks/use-thread-messages.ts` — encapsulates Mastra pagination logic
- `lib/mastra-client.ts` — used as-is; no changes needed
- Depends on `@mastra/client-js` and `@mastra/ai-sdk` packages (already in use)
