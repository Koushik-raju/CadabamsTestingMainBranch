## ADDED Requirements

### Requirement: /new-chat performs a server-side redirect
The system SHALL redirect `/new-chat` to `/chat/<uuid>` via a Next.js server component using `redirect()` and `crypto.randomUUID()`, with no client-side JavaScript required for the redirect.

#### Scenario: Visiting /new-chat
- **WHEN** a user navigates to `/new-chat`
- **THEN** the server immediately redirects to `/chat/<new-uuid>` without rendering any client component

#### Scenario: new-chat loading skeleton is removed
- **WHEN** `/new-chat/loading.tsx` previously showed a skeleton
- **THEN** it is removed because the server redirect is instant and requires no loading state

### Requirement: Chat pages use thin page files
Each chat route page file (`chat-history/page.tsx`, `chat/[threadId]/page.tsx`) SHALL import components from their respective `components/` directories and contain no inline UI component definitions.

#### Scenario: chat-history page delegates rendering
- **WHEN** `app/(auth)/chat-history/page.tsx` is opened
- **THEN** it contains only imports, hook usage, and component composition — no inline JSX component definitions

#### Scenario: chat thread page delegates rendering
- **WHEN** `app/(auth)/chat/[threadId]/page.tsx` is opened
- **THEN** all UI sections (header, message list, input, history drawer) are imported from `components/chat/`

### Requirement: Shared chat types live in lib/chat.ts
The system SHALL define `MastraThread` interface, `normalizeThread` function, and `formatDate` utility in `lib/chat.ts`. No page or component file SHALL redefine these locally.

#### Scenario: MastraThread type is imported, not re-declared
- **WHEN** any file references the chat thread data shape
- **THEN** it imports `MastraThread` from `@/lib/chat` rather than declaring its own interface

#### Scenario: formatDate is imported, not duplicated
- **WHEN** a component needs to display a thread date
- **THEN** it imports `formatDate` from `@/lib/chat`
