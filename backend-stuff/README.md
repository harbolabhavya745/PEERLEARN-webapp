# PeerLearn – Backend Setup Guide

Complete backend for the PeerLearn student platform.
Stack: **Vercel Serverless Functions** + **Supabase** + **Anthropic AI** + **Razorpay**

---

## 📁 Project Structure

```
peerlearn/
├── api/
│   ├── auth/
│   │   ├── signup.js          POST   – email/password registration
│   │   ├── login.js           POST   – email/password login → JWT
│   │   ├── google.js          GET/POST – Google OAuth
│   │   └── me.js              GET/POST – get profile / refresh token
│   ├── users/
│   │   ├── profile.js         GET/PUT – view/edit profile
│   │   ├── search.js          GET    – search users by name/course/skill
│   │   └── suggestions.js     GET    – smart peer suggestions
│   ├── follows/
│   │   └── index.js           GET/POST/DELETE – follow system
│   ├── notes/
│   │   ├── index.js           GET/POST/DELETE – Instagram-style notes
│   │   └── respond.js         GET/POST – respond to notes
│   ├── chat/
│   │   ├── conversations.js   GET/POST – list/create DMs & groups
│   │   └── messages.js        GET/POST/PUT – messages (real-time ready)
│   ├── quiz/
│   │   └── index.js           GET/POST?action=generate|submit – AI quizzes
│   ├── upload/
│   │   └── index.js           POST – avatar & chat attachment uploads
│   ├── premium/
│   │   └── index.js           POST?action=order|verify – Razorpay payments
│   ├── dashboard.js           GET  – dashboard stats + activity feed
│   └── skins.js               GET/POST – skins catalog + unlock
├── lib/
│   ├── supabase.js            Supabase client helpers
│   └── middleware.js          Auth, CORS, XP helpers
├── supabase/
│   └── schema.sql             Full DB schema – run once in Supabase
├── public/
│   └── index.html             ← DROP YOUR FRONTEND FILE HERE
├── package.json
├── vercel.json
└── README.md
```

---

## 🚀 Step-by-Step Setup

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and both keys (anon + service_role)
3. Go to **SQL Editor** → paste the entire contents of `supabase/schema.sql` → Run
4. Go to **Storage** → Create two buckets:
   - `avatars` (Public)
   - `chat-attachments` (Public)
5. Go to **Authentication → Providers** → Enable **Google** (paste your Google OAuth credentials)
6. In **Auth → URL Configuration** set:
   - Site URL: `https://your-vercel-url.vercel.app`
   - Redirect URL: `https://your-vercel-url.vercel.app/api/auth/google`

### 2. Google OAuth Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable "Google+ API" and "Google Identity"
3. OAuth 2.0 Credentials → Web application
4. Authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `https://your-vercel-url.vercel.app/api/auth/google`

### 3. Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create new key

### 4. Razorpay (for payments)

1. Go to [razorpay.com](https://razorpay.com) → Sign up (use Test mode)
2. Settings → API Keys → Generate Test Key

### 5. Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Install dependencies
cd peerlearn
npm install

# 3. Login & deploy
vercel login
vercel

# 4. Set environment variables (one by one)
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add SUPABASE_ANON_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add SITE_URL          # your vercel URL, e.g. https://peerlearn.vercel.app

# 5. Redeploy with env vars
vercel --prod
```

### 6. Place your frontend

Copy your HTML file to `public/index.html`. It will be served at the root URL.

---

## 🔌 API Quick Reference

All protected routes require: `Authorization: Bearer <access_token>`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register with email |
| POST | `/api/auth/login` | ❌ | Login → get JWT |
| GET | `/api/auth/google` | ❌ | Get Google OAuth URL |
| POST | `/api/auth/google` | ❌ | Exchange code for session |
| GET | `/api/auth/me` | ✅ | Get own profile |
| POST | `/api/auth/me` | ❌ | Refresh token |
| GET | `/api/users/profile?id=` | ✅ | Get any user's profile |
| PUT | `/api/users/profile` | ✅ | Update own profile |
| GET | `/api/users/search?q=` | ✅ | Search users |
| GET | `/api/users/suggestions` | ✅ | Smart peer suggestions |
| GET | `/api/follows?type=followers` | ✅ | List followers |
| POST | `/api/follows` | ✅ | Follow a user |
| DELETE | `/api/follows` | ✅ | Unfollow |
| GET | `/api/notes?feed=true` | ✅ | Notes feed from following |
| POST | `/api/notes` | ✅ | Create a note |
| DELETE | `/api/notes?id=` | ✅ | Delete own note |
| GET | `/api/notes/respond?note_id=` | ✅ | Get note responses |
| POST | `/api/notes/respond` | ✅ | Respond to a note |
| GET | `/api/chat/conversations` | ✅ | List conversations |
| POST | `/api/chat/conversations` | ✅ | Create DM or group |
| GET | `/api/chat/messages?conversation_id=` | ✅ | Get messages |
| POST | `/api/chat/messages` | ✅ | Send a message |
| GET | `/api/quiz?action=history` | ✅ | Quiz history |
| POST | `/api/quiz?action=generate` | ✅ | AI-generate quiz |
| POST | `/api/quiz?action=submit` | ✅ | Submit quiz results |
| POST | `/api/upload/avatar` | ✅ | Upload profile photo |
| POST | `/api/upload/attachment` | ✅ | Upload chat file |
| POST | `/api/premium?action=order` | ✅ | Create payment order |
| POST | `/api/premium?action=verify` | ✅ | Verify payment |
| GET | `/api/dashboard` | ✅ | Dashboard data |
| GET | `/api/skins` | ✅ | All skins + owned |
| POST | `/api/skins` | ✅ | Unlock a skin |

---

## 💬 Real-Time Chat (Client Side)

Messages are real-time via Supabase Realtime. In your frontend:

```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${accessToken}` } }
});

// Subscribe to new messages in a conversation
const channel = supabase
  .channel('messages-' + conversationId)
  .on('postgres_changes', {
    event:  'INSERT',
    schema: 'public',
    table:  'messages',
    filter: `conversation_id=eq.${conversationId}`,
  }, (payload) => {
    appendMessage(payload.new); // your render function
  })
  .subscribe();

// Cleanup
channel.unsubscribe();
```

---

## 🎨 Frontend Integration Checklist

In your `index.html`, update these areas:

1. **Login/Signup forms** → call `/api/auth/signup` or `/api/auth/login`
2. **Google button** → call `/api/auth/google` (GET), redirect to URL returned
3. **Store JWT** → `localStorage.setItem('peerlearn_token', access_token)`
4. **All API calls** → include `Authorization: Bearer <token>` header
5. **Dashboard** → call `/api/dashboard` on load
6. **Chat** → subscribe to Supabase Realtime (see above)
7. **Quiz** → replace static `quizData` with `/api/quiz?action=generate`
8. **Upgrade button** → call `/api/premium?action=order`, then use Razorpay checkout JS
9. **Profile avatar** → use multipart POST to `/api/upload/avatar`

---

## 🗄️ XP & Levels

| Action | XP Earned |
|--------|-----------|
| Complete a quiz | 50 × (score/total) |
| Perfect quiz score | 100 |
| Help a peer (note response) | 30 |
| Daily streak bonus | 20 |
| Get a new follower | 10 |

Level formula: `level = floor(xp / 200) + 1` (max level 50)

---

## 🔒 Security Notes

- Service role key (`SUPABASE_SERVICE_KEY`) is **only used server-side** in API routes
- All tables have RLS enabled – users can only access their own data
- Chat messages: only conversation members can read/write
- Notes: anonymous notes hide author identity from non-owners
- Razorpay signature verified via HMAC-SHA256 before any plan upgrade
