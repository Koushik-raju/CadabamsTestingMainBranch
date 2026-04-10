## ADDED Requirements

### Requirement: Load historical messages on thread mount
When a thread page is opened, the system SHALL fetch the 10 most recent messages for that thread from Mastra memory and display them in chronological order (oldest first) before any new messages are sent.

#### Scenario: Thread with existing messages
- **WHEN** a user navigates to a thread that has prior messages
- **THEN** the last 10 messages are loaded and displayed in the message list, oldest at top

#### Scenario: Thread with no prior messages
- **WHEN** a user navigates to a thread with no message history
- **THEN** the message list is empty and no load-more trigger is shown

#### Scenario: Thread with fewer than 10 messages
- **WHEN** a user navigates to a thread with fewer than 10 total messages
- **THEN** all messages are displayed and no further pagination is possible

### Requirement: Paginate older messages on scroll-to-top
The system SHALL load the next page of 10 older messages when the user scrolls to the top of the message list and more messages exist on the server.

#### Scenario: User scrolls to top with more messages available
- **WHEN** the user scrolls to the very top of the message list
- **AND** `hasMore` is true
- **THEN** the next 10 older messages are fetched and prepended above the current list

#### Scenario: User scrolls to top with no more messages
- **WHEN** the user scrolls to the very top of the message list
- **AND** `hasMore` is false
- **THEN** no fetch is triggered and no load-more indicator is shown

#### Scenario: Fetch already in progress on scroll-to-top
- **WHEN** the user scrolls to the top while a page fetch is already in-flight
- **THEN** a duplicate fetch SHALL NOT be triggered

### Requirement: Preserve scroll position when prepending messages
When older messages are prepended to the list, the system SHALL maintain the user's current viewport position so that the previously visible messages remain visible after the prepend.

#### Scenario: Older messages loaded while user is at top
- **WHEN** a page of older messages is prepended to the list
- **THEN** the scroll position is adjusted so the first previously-visible message stays in view

### Requirement: Show loading indicator while fetching history
The system SHALL display a loading indicator at the top of the message list while a history page fetch is in progress.

#### Scenario: Initial load in progress
- **WHEN** the thread page mounts and the first history fetch is in progress
- **THEN** a loading spinner or skeleton is shown at the top of the message list

#### Scenario: Pagination load in progress
- **WHEN** the user has scrolled to the top and a subsequent page is being fetched
- **THEN** a loading spinner is shown above the current top message

### Requirement: Messages ordered by creation date ascending
All messages displayed in the thread SHALL be ordered with the oldest message at the top and the newest at the bottom.

#### Scenario: Historical messages appended with new session messages
- **WHEN** historical messages are loaded and the user sends a new message
- **THEN** historical messages appear above, new messages appear below, all in chronological order
