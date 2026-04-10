## ADDED Requirements

### Requirement: Chat-history page components are extracted
The system SHALL provide the following components under `components/chat-history/`:
- `thread-card.tsx` — renders a single thread row (icon, title, formatted date, chevron)
- `thread-list.tsx` — renders the scrollable list of `ThreadCard` items
- `loading-state.tsx` — skeleton placeholder rows during thread fetch
- `empty-state.tsx` — empty illustration with a "Start New Chat" CTA button

#### Scenario: ThreadCard is keyboard accessible
- **WHEN** a `ThreadCard` receives focus and the user presses Enter or Space
- **THEN** the thread navigation callback is triggered

#### Scenario: EmptyState shows a new-chat prompt
- **WHEN** `useThreads` returns an empty array and loading is false
- **THEN** `EmptyState` is rendered with a button that navigates to a new chat

#### Scenario: LoadingState renders skeleton rows
- **WHEN** `useThreads` `isLoading` is true
- **THEN** `LoadingState` renders 3–4 skeleton rows matching the `ThreadCard` layout

### Requirement: Chat page components are extracted
The system SHALL provide the following components under `components/chat/`:
- `chat-header.tsx` — contains `<BackButton>`, agent name/subtitle, and a history-open icon button
- `message-bubble.tsx` — renders a single message (user or assistant) with `<Streamdown>`, timestamp, and `<ThinkingComponent>` for streaming state
- `message-list.tsx` — scrollable message container with bottom-anchor auto-scroll
- `chat-input.tsx` — form with text input and send button, disabled while streaming
- `history-drawer.tsx` — `<Sheet>` wrapping thread list powered by `useThreads`, with a "New Chat" button at the bottom

#### Scenario: ChatHeader uses shared BackButton
- **WHEN** `ChatHeader` is rendered
- **THEN** it uses `<BackButton>` from `@/components/common/back-button` (not an inline `router.back()` button)

#### Scenario: HistoryDrawer reuses useThreads cache
- **WHEN** the history drawer is opened in the chat page
- **THEN** it calls `useThreads(resource_id)` and reuses the already-cached response if available (no duplicate network request)

#### Scenario: MessageList auto-scrolls to bottom on new message
- **WHEN** a new message is appended to the list
- **THEN** `message-list.tsx` scrolls the bottom anchor into view smoothly

#### Scenario: ChatInput is disabled while streaming
- **WHEN** chat `status` is `"streaming"` or `"submitted"`
- **THEN** the send button is disabled and the input shows no send action

### Requirement: Shared navigation back-button is re-exported
The system SHALL provide `components/shared/navigation/back-button.tsx` that re-exports `BackButton` from `@/components/common/back-button`. All new chat components SHALL import from `@/components/shared/navigation/back-button`.

#### Scenario: Shared back-button import resolves correctly
- **WHEN** a component imports `BackButton` from `@/components/shared/navigation/back-button`
- **THEN** it receives the same component as importing from `@/components/common/back-button`

### Requirement: AGENTS.md and CLAUDE.md document component conventions
The system SHALL update `AGENTS.md` and `CLAUDE.md` to document:
- Component co-location rule: page-specific components go under `components/<page-name>/`
- Shared navigation components go under `components/shared/navigation/`
- The `useThreads` SWR hook location at `hooks/use-threads.ts`

#### Scenario: Agent reads conventions before creating new chat components
- **WHEN** an agent or developer needs to add a new chat UI component
- **THEN** AGENTS.md provides the directory convention to follow without guessing
