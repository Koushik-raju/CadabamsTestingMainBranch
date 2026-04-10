## ADDED Requirements

### Requirement: useThreads SWR hook fetches and caches thread list
The system SHALL provide a `useThreads(resourceId)` hook at `hooks/use-threads.ts` that uses SWR to fetch, cache, and revalidate the user's chat thread list. It SHALL use the global `swrConfig` from `lib/swr-config.ts`.

#### Scenario: Hook returns threads for a valid resource ID
- **WHEN** `useThreads(resourceId)` is called with a non-empty `resourceId`
- **THEN** it returns `{ data, isLoading, error, mutate }` where `data` is a `MastraThread[]` once resolved

#### Scenario: Hook is disabled when resource ID is absent
- **WHEN** `useThreads(undefined)` or `useThreads('')` is called
- **THEN** SWR key is `null` and no fetch is triggered

#### Scenario: Repeated calls within deduping interval share one request
- **WHEN** two components call `useThreads(resourceId)` with the same ID within 5 seconds
- **THEN** only one network request is made (SWR deduplication via `dedupingInterval: 5000`)

### Requirement: Thread list is mutated after a new chat is created
The system SHALL call `mutate(['threads', resource_id])` whenever the user navigates to a new chat thread, so the cached list reflects the new thread on next open.

#### Scenario: New chat triggers cache invalidation
- **WHEN** the user clicks "New Chat" from the history drawer or chat-history page
- **THEN** `mutate(['threads', resource_id])` is called before or after navigation so the next render shows updated threads

### Requirement: useThreads normalises thread dates
The `useThreads` hook SHALL map each raw thread through `normalizeThread` from `lib/chat.ts`, converting `Date` objects to ISO strings so all consumers receive consistent `string | undefined` date fields.

#### Scenario: Date objects are converted to strings
- **WHEN** the Mastra client returns a thread with `createdAt` as a `Date` instance
- **THEN** the hook's returned data has `createdAt` as an ISO string
