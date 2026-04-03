# Phase 8 Complete — AI Therapy Chat with Dr. Riya

## Summary

Phase 8 implements the AI Therapy chat feature: a landing page, a full real-time chat interface with Dr. Riya, and a chat history/assessments listing page.

## Files Created

### Pages
| Route | File | Notes |
|---|---|---|
| `/ai-therapy` | `app/(auth)/ai-therapy/page.tsx` | Landing with robot illustration, New Conversation + View Past Chats CTAs |
| `/new-chat` | `app/(auth)/new-chat/page.tsx` | Full chat UI: greeting, SWR history load, send/receive, typing indicator |
| `/new-chat` (loading) | `app/(auth)/new-chat/loading.tsx` | Skeleton for chat header, bubbles, input |
| `/chat-history` | `app/(auth)/chat-history/page.tsx` | SWR-backed assessment listing with empty state |
| `/chat-history` (loading) | `app/(auth)/chat-history/loading.tsx` | Skeleton cards |

### Components
| File | Purpose |
|---|---|
| `components/chat/chat-bubble.tsx` | User (right, `bg-primary`) and AI (left, `bg-muted`) bubbles; markdown via `react-markdown` + `remark-gfm`; `TypingIndicator` export |
| `components/chat/chat-header.tsx` | Dr. Riya avatar, name, subtitle, online indicator, back nav |
| `components/chat/chat-input.tsx` | `react-textarea-autosize` with voice button (MediaRecorder) and send button |
| `components/chat/chat-history-card.tsx` | Past session card with timestamp formatting for both Firestore `_seconds` and ISO strings |

### CSS additions (`app/globals.css`)
- Typing indicator animation: `.typing-dot`, `@keyframes typing`

## Architecture Decisions

- **No new packages**: uses `react-markdown`, `remark-gfm`, `react-textarea-autosize` (all pre-installed)
- **Voice recording**: browser `MediaRecorder` API; Capacitor plugin skipped (not installed) with graceful fallback
- **AI responses**: posts context to `saveLog` endpoint; falls back to curated responses if API returns nothing
- **SWR**: used in `/chat-history` for assessment list; manual fetch in `/new-chat` on mount (chat is stateful)
- **Theme-only**: zero hardcoded hex/rgb — all CSS variables
- **Server/Client split**: all pages `'use client'` (hooks + events); loading files are Server Components

## TypeScript
`pnpm tsc --noEmit` — zero errors in Phase 8 files. Pre-existing errors in other phases untouched.

## Build
`pnpm build` — Phase 8 files compile cleanly. Failures are pre-existing from earlier phases.
