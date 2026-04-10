## 1. Hook: useThreadMessages

- [x] 1.1 Create `hooks/use-thread-messages.ts` with state: `historicalMessages`, `page`, `hasMore`, `isLoading`
- [x] 1.2 On mount, call `createMastraClient()` then `thread.listMessages({ page: 0, perPage: 10, orderBy: { field: 'createdAt', direction: 'DESC' } })`
- [x] 1.3 Reverse the fetched messages array so they are in ascending (oldest-first) order before storing
- [x] 1.4 Set `hasMore` from the `result.hasMore` field returned by `listMessages`
- [x] 1.5 Implement `loadMore()` function: increment page, fetch next batch, reverse, prepend to `historicalMessages`, update `hasMore`
- [x] 1.6 Guard `loadMore()` with `isLoading` flag to prevent duplicate in-flight requests
- [x] 1.7 Convert fetched messages with `toAISdkV5Messages` from `@mastra/ai-sdk/ui` before returning

## 2. MessageList: scroll-to-top detection and load-more UI

- [x] 2.1 Add optional `onLoadMore?: () => void` and `hasMore?: boolean` and `isLoadingMore?: boolean` props to `MessageList`
- [x] 2.2 Attach `onScroll` handler to the scrollable container; call `onLoadMore` when `scrollTop === 0` and `hasMore` is true
- [x] 2.3 Add scroll-position preservation: capture `scrollHeight` before prepend, restore after DOM update using `useLayoutEffect`
- [x] 2.4 Render a centered loading spinner at the top of the list when `isLoadingMore` is true
- [x] 2.5 Ensure auto-scroll-to-bottom only fires for new messages (current session), not when historical messages are prepended

## 3. Page: wire history into useChat

- [x] 3.1 In `app/(auth)/chat/thread/[thread_id]/page.tsx`, call `useThreadMessages({ threadId, agentId })` — determine the correct `agentId` from `mastraDataContext` or the existing `sendMessage` body
- [x] 3.2 Pass `historicalMessages` as `initialMessages` to `useChat` so the hook owns the unified message list
- [x] 3.3 Pass `loadMore`, `hasMore`, and `isLoading` from the hook as props to `MessageList`
- [x] 3.4 Verify that new streamed messages append correctly after historical messages in chronological order

## 4. Verification

- [ ] 4.1 Open a thread with existing messages — confirm last 10 appear on mount in correct order
- [ ] 4.2 Open a thread with no history — confirm empty state renders without errors
- [ ] 4.3 Scroll to top on a thread with >10 messages — confirm next 10 load and scroll position is preserved
- [ ] 4.4 Scroll to top on a thread with ≤10 messages — confirm no extra fetch is triggered
- [ ] 4.5 Send a new message after loading history — confirm it appends at the bottom correctly
