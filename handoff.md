# PeerLearn – Project Handoff Document

**Last Updated:** June 2026  
**Platform:** [peerlearn-sigma-sage.vercel.app](https://peerlearn-sigma-sage.vercel.app)  
**Stack:** Vercel Serverless Functions · Supabase · Notion API · Gemini AI · Razorpay · Vanilla JS SPA

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Environment Variables](#3-environment-variables)
4. [Database Schema (Supabase)](#4-database-schema-supabase)
5. [API Reference](#5-api-reference)
6. [Notion Integration](#6-notion-integration)
7. [Authentication Flow](#7-authentication-flow)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Gamification System (XP & Levels)](#9-gamification-system-xp--levels)
10. [File Uploads](#10-file-uploads)
11. [Payments (Razorpay)](#11-payments-razorpay)
12. [Known Bugs & Open Issues](#12-known-bugs--open-issues)
13. [Recent Changes (June 2026)](#13-recent-changes-june-2026)
14. [Next Steps / Maintenance](#14-next-steps--maintenance)

---

## 1. Project Overview

PeerLearn is a student academic & skill growth platform. Core features:

- **Peer Discovery** — search and follow other students by course, college, or skill
- **Social Notes** — Instagram-style ephemeral study notes (280 chars, expire after 24 h by default)
- **Notion Sync** — study notes, to-dos, and events synced directly to a shared team Notion workspace
- **AI Quiz Engine** — Gemini-powered quiz generation on any topic
- **Peer Chat** — real-time DMs and group chats via Supabase Realtime
- **Video Calling** — WebRTC-based video calls (UI injected into `#p-call` panel)
- **Gamification** — XP, levels, streaks, and unlockable avatar skins
- **Premium Plans** — Pro (₹199/mo) and Elite (₹499/mo) via Razorpay
- **Skins Catalog** — avatar skins gated by XP level and plan tier

---

## 2. Architecture

```
peerlearn/
├── api/
│   ├── auth.js                  POST/GET – signup, login, Google OAuth, profile
│   ├── dashboard.js             GET      – dashboard stats + activity feed
│   ├── notion.js                GET/POST – Notion-only workflow (notes, todos, events)
│   ├── notes.js                 GET/POST/DELETE – ephemeral social notes (Supabase)
│   ├── chat.js                  GET/POST/PUT – DMs, groups, messages
│   ├── users.js                 GET      – profile, leaderboard, suggestions
│   ├── skins.js                 GET/POST – skins catalog + unlock
│   ├── follows/
│   │   └── index.js             GET/POST/DELETE – follow system
│   ├── quiz/
│   │   └── index.js             GET/POST – AI quiz generate + submit
│   ├── premium/
│   │   └── index.js             POST     – Razorpay order + verify
│   └── upload/
│       └── index.js             POST     – avatar & chat attachment uploads
├── lib/
│   ├── supabase.js              Supabase admin + anon client helpers
│   └── middleware.js            CORS, JWT auth (requireAuth), XP helper (addXP)
├── public/
│   ├── index.html               Single-page app (all UI, all client-side logic)
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js               App bootstrap / router
│       ├── config.js            Supabase URL + anon key for client-side
│       ├── notion.js            Frontend Notion API wrapper
│       ├── chat.js              Chat UI helpers
│       ├── quiz.js              Quiz UI helpers
│       ├── profile.js           Profile UI helpers
│       └── theme.js             Dark/light mode toggle
├── supabase/
│   └── schema.sql               Full DB schema – run once in Supabase SQL Editor
├── package.json
├── vercel.json                  URL rewrites for all API routes
└── .env                         Local dev env vars (do NOT commit)
```

### Routing (vercel.json)

All `/api/*` requests are rewritten to the corresponding handler. Everything else serves `public/index.html` (SPA catch-all):

| Source pattern | Destination |
|---|---|
| `/api/auth/:path*` | `api/auth.js` |
| `/api/notion/:path*` | `api/notion.js` |
| `/api/dashboard` | `api/dashboard.js` |
| `/api/chat/:path*` | `api/chat.js` |
| `/api/notes/:path*` | `api/notes.js` |
| `/api/users/:path*` | `api/users.js` |
| `/api/upload/:path*` | `api/upload/index.js` |
| `/api/follows/:path*` | `api/follows/index.js` |
| `/api/quiz/:path*` | `api/quiz/index.js` |
| `/api/premium/:path*` | `api/premium/index.js` |
| `/(all other paths)` | `public/index.html` |

---

## 3. Environment Variables

All must be set in **Vercel → Project Settings → Environment Variables**. The `.env` file is for local dev only.

| Variable | Description | Required |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL (`https://xxx.supabase.co`) | ✅ |
| `SUPABASE_SERVICE_KEY` | Service role key — **server-side only**, bypasses RLS | ✅ |
| `SUPABASE_ANON_KEY` | Anon key — used for client-side auth (JWT verification) | ✅ |
| `NOTION_API_KEY` | Notion Internal Integration secret (`ntn_...`) | ✅ for Notion workflow |
| `NOTION_NOTES_DB_ID` | Notion database ID for study notes | ✅ for Notion workflow |
| `NOTION_TODOS_DB_ID` | Notion database ID for to-dos | ✅ for Notion workflow |
| `NOTION_EVENTS_DB_ID` | Notion database ID for events | ✅ for Notion workflow |
| `GEMINI_API_KEY` | Google Gemini API key for AI quiz generation | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay public key (use test keys in dev) | ✅ for payments |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (used for HMAC verification) | ✅ for payments |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ for Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ✅ for Google login |
| `SITE_URL` | Full Vercel URL, e.g. `https://peerlearn-sigma-sage.vercel.app` | ✅ |

> **Security rule:** `SUPABASE_SERVICE_KEY` is **never** exposed to the frontend. It is only used inside `/api/*` serverless functions via `lib/supabase.js`.

---

## 4. Database Schema (Supabase)

Full SQL is in `supabase/schema.sql`. Run it once in the Supabase SQL Editor. Key tables:

| Table | Purpose |
|---|---|
| `profiles` | One row per user — XP, level, streak, plan, avatar, skills, etc. |
| `follows` | Follow relationships between users |
| `notes` | Ephemeral social notes (280 chars, have `expires_at`) |
| `note_responses` | Replies to social notes |
| `quiz_attempts` | Stored AI quiz results with user answers and XP earned |
| `conversations` | DM and group chat metadata |
| `conversation_members` | Join table: user ↔ conversation |
| `messages` | Individual chat messages, with `read_by` array |
| `activities` | Activity feed events (new_follower, quiz_complete, note_response, etc.) |
| `skins` | Catalog of avatar skins with `xp_required` and `required_plan` |
| `user_skins` | Which skins each user has unlocked |
| `premium_orders` | Razorpay payment order records |

> **Required Supabase Storage buckets:** Create `avatars` (public) and `chat-attachments` (public) in Supabase Storage before deploying.

All tables have **Row Level Security (RLS) enabled**. Users can only read/write their own data, except for public profiles and the notes feed.

---

## 5. API Reference

All protected routes require: `Authorization: Bearer <access_token>`

### Auth (`api/auth.js`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | Register — creates Supabase auth user, updates profile, grants default skin |
| POST | `/api/auth/login` | ❌ | Login with email/password → returns `access_token`, `refresh_token` |
| GET | `/api/auth/google` | ❌ | Returns Google OAuth redirect URL |
| POST | `/api/auth/google` | ❌ | Exchange OAuth `code` for session; upserts profile |
| GET | `/api/auth/me` | ✅ | Returns full profile including follower/following counts |
| POST | `/api/auth/me` | ❌ | Refresh session using `refresh_token` |
| PATCH | `/api/auth/me` | ✅ | Update profile fields (name, bio, skills, avatar_skin, avatar_url, etc.) |

**Login response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": 1234567890,
  "user": { "id": "uuid", "email": "user@example.com" }
}
```
Store `access_token` in `localStorage` as `peerlearn_token`. Send it in every protected request header.

---

### Dashboard (`api/dashboard.js`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard` | ✅ | Returns profile stats, activity feed (last 10), trending topics, and quiz/connection counts |

Runs 5 Supabase queries in parallel via `Promise.all`. Trending topics are computed from the `notes` table over the last 24 hours.

---

### Notion Workflow (`api/notion.js`)

> **Notion is the sole data store for this workflow.** No Supabase fallback exists.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/notion/notes` | ✅ | Creates a page in the Notion Notes database |
| GET | `/api/notion/notes` | ✅ | Queries the Notion Notes DB filtered by the authenticated user |
| POST | `/api/notion/todos` | ✅ | Creates a page in the Notion Todos database |
| GET | `/api/notion/todos` | ✅ | Queries the Notion Todos DB filtered by the authenticated user |
| POST | `/api/notion/events` | ✅ | Creates a page in the Notion Events database |
| GET | `/api/notion/events` | ✅ | Queries the Notion Events DB filtered by the authenticated user |

If `NOTION_API_KEY` or a database ID env var is missing, the endpoint returns `503` with a descriptive error. See [Section 6](#6-notion-integration) for full details.

---

### Social Notes (`api/notes.js`)

Separate from the Notion workflow. These are ephemeral, Twitter/Instagram-style status notes stored in Supabase.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notes?feed=true` | ✅ | Notes from users the authenticated user follows (+ own) |
| GET | `/api/notes?user_id=<id>` | ✅ | Notes from a specific user (anonymous notes hidden from others) |
| POST | `/api/notes` | ✅ | Create a note (`content` ≤ 280 chars, optional `type`, `subject`, `is_anonymous`) |
| DELETE | `/api/notes?id=<id>` | ✅ | Delete own note |
| GET | `/api/notes/respond?note_id=<id>` | ✅ | Fetch responses to a note |
| POST | `/api/notes/respond` | ✅ | Respond to a note (+30 XP for helper) |

---

### Users (`api/users.js`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/profile?id=<uuid>` | ✅ | Full profile with follower/following/quiz counts |
| GET | `/api/users/leaderboard?limit=10` | ✅ | Top users by XP |
| GET | `/api/users/suggestions` | ✅ | Smart peer suggestions (same course, excluding already-followed) |

---

### Follows (`api/follows/index.js`)

| Method | Endpoint | Auth | Body / Query | Description |
|---|---|---|---|---|
| GET | `/api/follows?type=followers` | ✅ | `user_id` (optional) | List followers |
| GET | `/api/follows?type=following` | ✅ | `user_id` (optional) | List following |
| POST | `/api/follows` | ✅ | `{ following_id }` | Follow a user (+10 XP to target) |
| DELETE | `/api/follows` | ✅ | `{ following_id }` | Unfollow |

---

### Chat (`api/chat.js`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/chat/conversations` | ✅ | List all conversations (DMs + groups) with last message |
| POST | `/api/chat/conversations` | ✅ | Create DM (`{ type: 'dm', user_id }`) or group (`{ type: 'group', name, member_ids }`) |
| GET | `/api/chat/messages?conversation_id=<id>` | ✅ | Fetch messages (paginated via `before` cursor, default limit 50) |
| POST | `/api/chat/messages` | ✅ | Send a message (text or attachment) |
| PUT | `/api/chat/messages?conversation_id=<id>` | ✅ | Mark all messages in conversation as read |

**Real-time:** Messages are delivered in real-time via Supabase Realtime. Subscribe on the client:

```javascript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
const channel = supabase
  .channel('messages-' + conversationId)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
  }, payload => appendMessage(payload.new))
  .subscribe();
```

---

### Quiz (`api/quiz/index.js`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/quiz` | ✅ | Returns last 20 quiz attempts |
| POST | `/api/quiz` (body: `action: 'generate'`) | ✅ | Generates quiz via Gemini AI (`topic`, `difficulty`, `count`) |
| POST | `/api/quiz` (body: `action: 'submit'`) | ✅ | Saves attempt, awards XP, records activity |

**Model fallback chain:** tries `gemini-3.5-flash` first, then `gemini-3.1-flash-lite`. Returns `429` if quota exceeded on both.

---

### Upload (`api/upload/index.js`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/upload/avatar` | ✅ | Uploads image to Supabase `avatars` bucket, updates `profiles.avatar_url` |
| POST | `/api/upload/attachment` | ✅ | Uploads image/PDF/text to `chat-attachments` bucket |

- Accepts `multipart/form-data`. Custom multipart parser — does **not** use `busboy` or `multer`.
- Max file size: **4 MB** (Vercel body limit).
- Allowed types: JPEG, PNG, GIF, WebP for avatars; + PDF and plain text for attachments.

---

### Premium (`api/premium/index.js`)

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/premium?action=order` | ✅ | `{ plan: 'pro' \| 'elite' }` | Creates Razorpay order, saves to `premium_orders` |
| POST | `/api/premium?action=verify` | ✅ | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }` | Verifies HMAC signature, upgrades user plan and unlocks plan skins |

**Plan prices:**
- Pro: ₹199/month (`19900` paise)
- Elite: ₹499/month (`49900` paise)

---

### Skins (`api/skins.js`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/skins` | ✅ | Returns all skins catalog with `owned` and `locked` flags |
| POST | `/api/skins` | ✅ | Unlock a skin (checks XP ≥ `xp_required` and plan ≥ `required_plan`) |

---

## 6. Notion Integration (Updated to OAuth)

### How It Works

The Notion workflow uses **per-user Notion OAuth**. Each user connects their own Notion workspace via the frontend UI.
1. The user clicks "Connect Notion", starting an OAuth flow (`/api/notion/oauth`).
2. After granting access, Notion redirects back with a code (`/api/notion/callback`).
3. The backend exchanges the code for an access token, finds a parent page, and automatically creates 3 databases (Todos, Events, Notes) in the user's workspace.
4. Database IDs and the Notion token are stored in the user's `profiles` row in Supabase.

**Supabase is the Source of Truth:**
Unlike the old integration, **data is stored in Supabase tables** (`todos`, `events`, `study_notes`). Whenever a user creates or updates an item in PeerLearn, it is saved to Supabase and simultaneously pushed to their connected Notion workspace.

### On-Demand Two-Way Sync

Instead of a Vercel cron job (which was restricted by the Hobby plan), synchronization uses a **lazy/on-demand** approach:
- When the user loads their dashboard, the frontend checks `last_synced_at`.
- If older than 5 minutes, it calls `/api/notion/sync` in the background.
- Users can also manually click "Sync Now" to instantly pull changes made directly in Notion back into Supabase.
- Conflicts are resolved using a "last-write-wins" approach based on timestamps.

### Notion OAuth Setup Checklist

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New Integration**.
2. Set type to **Public** (required for OAuth).
3. Set the Redirect URI to `https://peerlearn-sigma-sage.vercel.app/api/notion/callback`.
4. Enable "Read content", "Update content", and "Insert content" capabilities.
5. Copy the OAuth Client ID and Secret and set them as `NOTION_OAUTH_CLIENT_ID` and `NOTION_OAUTH_CLIENT_SECRET` in Vercel.

---

## 7. Authentication Flow

Authentication is JWT-based, delegated to Supabase Auth.

```
Client                  api/auth.js              Supabase Auth
  │                         │                         │
  │── POST /auth/login ──▶  │                         │
  │                         │── signInWithPassword ──▶│
  │                         │◀── session (JWT) ───────│
  │◀── { access_token } ────│                         │
  │                         │                         │
  │── GET /api/dashboard ──▶│ (Authorization: Bearer) │
  │     (protected route)   │── getUser(token) ──────▶│
  │                         │◀── { user } ────────────│
  │                         │  attaches req.user &     │
  │                         │  req.profile             │
  │◀── dashboard data ──────│                         │
```

- **`requireAuth`** (in `lib/middleware.js`): extracts Bearer token, calls `supabaseAdmin.auth.getUser(token)`, attaches `req.user` (Supabase auth user) and `req.profile` (row from `profiles` table)
- Tokens expire — the frontend should call `POST /api/auth/me` with `refresh_token` to get a new `access_token`
- Google OAuth: `GET /auth/google` returns a URL; user is redirected there; Supabase handles the callback and redirects to `SITE_URL/api/auth/google`; the frontend exchanges the `code` via `POST /auth/google`

---

## 8. Frontend Architecture

The frontend is a **Vanilla JS SPA** contained almost entirely in `public/index.html`.

### Key Global State

```javascript
let currentUser = null;   // profile object from /api/auth/me
let currentToken = null;  // access_token stored in localStorage as 'peerlearn_token'
```

### Client-side Modules (`public/js/`)

| File | Purpose |
|---|---|
| `config.js` | Exports `SUPABASE_URL` and `SUPABASE_ANON_KEY` for client-side Realtime |
| `notion.js` | `notionApi` object — wraps all 6 Notion endpoints with `Authorization` header |
| `app.js` | App init, route handling |
| `chat.js` | Chat UI helpers, Realtime subscription management |
| `quiz.js` | Quiz UI — renders questions, tracks answers |
| `profile.js` | Profile page rendering helpers |
| `theme.js` | Dark/light mode toggle, persists to `localStorage` |

### Notion Frontend API (`public/js/notion.js`)

```javascript
notionApi.createNote(title, content, subject, is_public)  // POST /api/notion/notes
notionApi.getNotes()                                       // GET  /api/notion/notes
notionApi.createTodo(title, status, due_date)             // POST /api/notion/todos
notionApi.getTodos()                                       // GET  /api/notion/todos
notionApi.createEvent(title, event_type, date)            // POST /api/notion/events
notionApi.getEvents()                                      // GET  /api/notion/events
```

All methods read `peerlearn_token` from `localStorage` and attach it as `Authorization: Bearer <token>`.

### Page Loading / `loadNotionData`

`window.loadNotionData` calls all three GET endpoints with `Promise.all`. If any single call fails (e.g. a missing DB env var), the entire load fails silently and only logs to the console. This is a known fragility — see [Section 12](#12-known-bugs--open-issues).

---

## 9. Gamification System (XP & Levels)

### XP Rewards Table

| Action | XP Earned |
|---|---|
| Complete a quiz (proportional to score) | Up to 50 |
| Perfect quiz score | 100 |
| Respond to a peer's note (help a peer) | 30 |
| Gain a new follower | 10 |
| Daily streak bonus | 20 (not yet triggered automatically) |

### Level Formula

```
level = floor(xp / 200) + 1   (capped at level 50)
```

### Streak Logic

In `lib/middleware.js → addXP()`:
- If last active = today → streak unchanged
- If last active = yesterday → streak + 1
- If gap > 1 day → streak resets to 1

`last_active` is updated to today's date whenever XP is awarded.

---

## 10. File Uploads

`api/upload/index.js` uses a **custom multipart parser** (no external library). Vercel passes the raw request body with `bodyParser: false`.

- Files are stored in **Supabase Storage** buckets
- Avatar path: `{user_id}/avatar.{ext}` (overwritten on re-upload)
- Attachment path: `{user_id}/{timestamp}.{ext}` (new file per upload)
- Public URLs are returned for use in `<img>` tags or message attachments

**Limitation:** Vercel serverless functions have a 4.5 MB request body limit. For files larger than ~4 MB, use Supabase Storage signed upload URLs directly from the frontend instead.

---

## 11. Payments (Razorpay)

Flow:
1. Frontend calls `POST /api/premium?action=order` with `{ plan: 'pro' }` → gets `order_id` and `amount`
2. Frontend loads Razorpay checkout JS and opens the payment modal
3. On success, Razorpay returns `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
4. Frontend calls `POST /api/premium?action=verify` with those fields
5. Backend verifies the HMAC-SHA256 signature → upgrades `profiles.plan`, unlocks plan-specific skins

> Use **test keys** during development. Switch to live keys before going live.

---

## 12. Known Bugs & Open Issues

| # | Severity | Bug | Affected file | Status |
|---|---|---|---|---|
| 1 | 🔴 High | All 4 Notion env vars must be set in Vercel; if any are missing the workflow returns `503` — check Vercel dashboard | `api/notion.js` | Not yet verified on prod |
| 2 | 🔴 High | Notion `Status` property mismatch: API sends `{ status: { name } }` which requires a native **Status** column. If the DB has a **Select** column, todo creation will always fail | `api/notion.js` | Verify in Notion DB |
| 3 | 🟡 Medium | `window.loadNotionData` uses `Promise.all` — if any of the 3 GET requests fail, the whole page data load silently fails | `public/index.html` | Should use `Promise.allSettled` |
| 4 | 🟡 Medium | Gemini models in `api/quiz/index.js` are set to `gemini-3.5-flash` and `gemini-3.1-flash-lite`. These model names may not be valid; official names are `gemini-1.5-flash` and `gemini-1.5-flash-8b` | `api/quiz/index.js` | Verify model names |
| 5 | 🟡 Medium | `api/dashboard.js` queries `from('notes')` for trending topics, but social notes live in the `notes` table. This may conflict if schema naming changes | `api/dashboard.js` | Low risk currently |
| 6 | 🟢 Low | `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` are placeholders (`rzp_test_...`) — must be replaced with real test keys | `.env` | Dev task |
| 7 | 🟢 Low | Streak bonus XP (20 XP) is defined in `XP_REWARDS` but never automatically triggered — it would need a cron job or login hook | `lib/middleware.js` | Feature gap |
| 8 | 🟢 Low | `api/auth.js` has `console.log` debug statements left in the signup flow (they expose user email to Vercel logs) | `api/auth.js` | Clean up before prod |

---

## 13. Recent Changes (June 2026)

### Notion Workflow — Rewritten to Per-User OAuth & Two-Way Sync ✅

**Problem:** The original Notion integration used a single shared workspace token, meaning all users' data was dumped into the same three databases. It was also purely Notion-backed, making the UI slow and fragile.

**Fix:** Completely overhauled the Notion architecture:
- Implemented **Per-User OAuth** flow (`/api/notion/oauth` & `/api/notion/callback`).
- Re-introduced Supabase (`study_notes`, `todos`, `events` tables) as the **Source of Truth** for instant, reliable frontend reads.
- Posts/Updates are now "dual-written" (saved to Supabase instantly, then pushed to the user's Notion workspace asynchronously).
- Created a **On-Demand Sync Route** (`/api/notion/sync`) that is triggered automatically when a user visits the dashboard or manually via the UI.
- Removed old `check_notion.js` and `setup_notion_dbs.js` scripts containing hardcoded API keys.

### Previous Fixes (earlier in June 2026)

- **Authentication token:** Fixed `public/js/notion.js` to use `peerlearn_token` (not the Supabase anon key) for the `Authorization` header
- **API stability:** `api/users.js` and `api/quiz/index.js` wrapped in `try/catch` — all failures now return valid JSON instead of crashing with plain-text errors
- **Routing:** `vercel.json` updated to include `/api/notion/:path*` → `api/notion.js` and `/api/dashboard` → `api/dashboard.js` rewrites
- **Video call UI:** Moved `.call-layout` markup into `#p-call` so it doesn't render on every page
- **Premium page:** Now dynamically checks `currentUser.plan` and hides upgrade buttons for Pro/Elite users
- **CSS fix:** Removed dangling border property in `public/css/styles.css`
- **Config security:** Moved hardcoded Supabase credentials from `public/index.html` to `public/js/config.js`

### Notion Integration Fixes & Discoveries (Late June 2026)

- **Notion SDK Reversion**: The project was previously using an experimental/broken `@notionhq/client` version `5.22.0` which dropped database schema `properties`. It has been securely downgraded to the stable `2.2.14` release so database creation correctly builds columns.
- **Search Eventual Consistency**: Added a retry loop to `api/notion.js` when finding a parent page, because Notion's search index is slightly delayed right after a user authorizes OAuth.
- **Environment Variable Parsing**: Removed inline comments from `.env` (`SITE_URL`) because the Node parser included the comment in the string, breaking the `redirect_uri` check in Notion OAuth.
- **Status Defaults**: The Notion `Status` property defaults to "Not started", "In progress", and "Done". The frontend dropdowns and backend fallback values were updated to match these exactly (instead of sending "Todo").
- **Rich Text Filtering**: Notion's `equals` filter on `rich_text` fails silently for UUIDs. It was updated to `contains` in `api/notion.js` for all 3 GET routes.
- **Database Connectivity**: Make sure the `.env` IDs exactly match the databases the integration is invited to. The integration must be explicitly invited to each database page.
- **Database Property Exact Requirements**: 
  - **Todos DB**: `Name` (Title), `Status` (Status), `Assigned To` (Text), `Due Date` (Date).
  - **Notes DB**: `Name` (Title), `Subject` (Select), `Author` (Text).
  - **Events DB**: `Name` (Title), `Event Type` (Select), `Date` (Date), `Organizer` (Text).
  *(Note: The first column must literally be named `Name`, not `Title`)*
- **Hash-Based Routing for Redirects**: The Notion OAuth callback redirects to `/#notion?connected=true`. The `DOMContentLoaded` listener in `public/index.html` was updated to parse `window.location.hash` and correctly call `showPage` to display the Notion dashboard immediately on load, fixing an issue where the UI wouldn't update after connecting.
- **Persistent Premium & Notion UI State**: Updated the `updateUIWithUserData()` function in the frontend to permanently hide the "Premium" sidebar item once a user is on a paid plan, and to visually update the "Notion Sync" sidebar icon to a checkmark when Notion is linked. `activatePremium()` was also updated to make a real backend API call saving the plan upgrade to Supabase rather than just a frontend mockup.


---

## 14. Next Steps / Maintenance

### Immediate (pre-launch blockers)

- [x] **Set all Notion env vars in Vercel** and verify each of the 3 Notion DB connections works end-to-end
- [x] **Verify Notion DB property types** — specifically that the Todos DB has a native `Status` property (not Select)
- [x] **Fix `Promise.all` in `loadNotionData`** → use `Promise.allSettled` so one failing endpoint doesn't break the whole page
- [x] **Verify Gemini model names** — updated to `gemini-1.5-flash` and `gemini-1.5-flash-8b`.
- [x] **Replace placeholder Razorpay test keys** in `.env` with mock test credentials.
- [x] **Remove debug `console.log`** statements from `api/auth.js` signup handler

### Feature Roadmap

- [x] **Per-user Notion OAuth:** Migrated to per-user OAuth and implemented two-way sync via Vercel cron.
- **Streak cron job:** Implement a Vercel Cron Job (`vercel.json` `crons`) to award daily streak XP to users with `last_active = yesterday`
- **Search endpoint:** `api/users.js` is missing a `/api/users/search?q=` route referenced in the README — needs to be implemented
- **Real-time notifications:** The `activities` table is populated but notifications are not pushed in real-time — add a Supabase Realtime subscription on the `activities` table in the frontend
- **Note expiry cleanup:** Social notes have `expires_at` but expired notes are never deleted from the DB — add a scheduled cleanup function
