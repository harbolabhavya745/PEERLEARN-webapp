-- ═══════════════════════════════════════════════════
--  PeerLearn – Supabase Schema
--  Run this entire file in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────
--  PROFILES
--  One row per auth.users user
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  full_name     TEXT,
  email         TEXT UNIQUE NOT NULL,
  college       TEXT,
  course        TEXT,
  bio           TEXT,
  skills        TEXT[],              -- e.g. ARRAY['Python','DSA','Calculus']
  avatar_skin   TEXT DEFAULT '🧑‍💻',  -- emoji or skin key
  avatar_frame  TEXT DEFAULT 'default',
  avatar_url    TEXT,                -- uploaded photo URL from Supabase Storage
  xp            INTEGER DEFAULT 0,
  level         INTEGER DEFAULT 1,
  streak        INTEGER DEFAULT 0,
  last_active   DATE DEFAULT CURRENT_DATE,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','elite')),
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────
--  FOLLOWS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- ─────────────────────────────────────
--  NOTES  (Instagram-style, 24 hr expiry)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 280),
  type        TEXT DEFAULT 'general' CHECK (type IN ('general','doubt','skill_request')),
  subject     TEXT,                  -- e.g. 'DBMS', 'Calculus'
  is_anonymous BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-delete expired notes via pg_cron (optional, or handle in query)
-- Alternatively filter WHERE expires_at > NOW() in queries

-- ─────────────────────────────────────
--  NOTE RESPONSES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.note_responses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id    UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────
--  CONVERSATIONS  (DMs + Groups)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT,                  -- NULL for DMs, set for groups
  is_group    BOOLEAN DEFAULT FALSE,
  avatar      TEXT,                  -- emoji for groups
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────
--  CONVERSATION MEMBERS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'member' CHECK (role IN ('member','admin')),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- ─────────────────────────────────────
--  MESSAGES  (Real-time via Supabase Realtime)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT,
  attachment_url  TEXT,              -- file/image URL
  attachment_type TEXT,              -- 'image' | 'file'
  read_by         UUID[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast message loading
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- ─────────────────────────────────────
--  QUIZ ATTEMPTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic      TEXT NOT NULL,
  questions  JSONB NOT NULL,         -- array of {q, opts, ans, exp}
  answers    INTEGER[],              -- user's answer indices
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  xp_earned  INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────
--  SKINS CATALOG
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  color       TEXT NOT NULL,         -- hex or gradient string
  rarity      TEXT DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  required_plan TEXT DEFAULT 'free' CHECK (required_plan IN ('free','pro','elite')),
  xp_required INTEGER DEFAULT 0
);

-- Seed default skins
INSERT INTO public.skins (key, name, emoji, color, rarity, required_plan, xp_required) VALUES
  ('default',     'Scholar',      '🧑‍💻', '#6366f1', 'common',    'free',  0),
  ('neon',        'Neon Ninja',   '🥷',  '#22d3ee', 'common',    'free',  200),
  ('fire',        'Fire Starter', '🔥',  '#f97316', 'rare',      'free',  500),
  ('astro',       'Astronaut',    '🧑‍🚀', '#8b5cf6', 'rare',      'free',  800),
  ('wizard',      'Wizard',       '🧙',  '#7c3aed', 'epic',      'pro',   0),
  ('robot',       'Cyber Bot',    '🤖',  '#06b6d4', 'epic',      'pro',   0),
  ('dragon',      'Dragon Lord',  '🐉',  '#dc2626', 'legendary', 'elite', 0),
  ('unicorn',     'Unicorn',      '🦄',  '#ec4899', 'legendary', 'elite', 0)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────
--  USER SKINS (unlocked skins per user)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_skins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skin_key   TEXT NOT NULL REFERENCES public.skins(key) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skin_key)
);

-- ─────────────────────────────────────
--  PREMIUM ORDERS  (Razorpay)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.premium_orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  plan             TEXT NOT NULL CHECK (plan IN ('pro','elite')),
  amount           INTEGER NOT NULL,  -- in paise
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────
--  ACTIVITY FEED
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,         -- 'quiz_complete','note_response','follow','new_note'
  meta        JSONB DEFAULT '{}',    -- extra data (score, topic, note snippet etc.)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id, created_at DESC);

-- ══════════════════════════════════════
--  ROW LEVEL SECURITY (RLS) POLICIES
-- ══════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skins                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skins           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities           ENABLE ROW LEVEL SECURITY;

-- PROFILES: anyone can read, only owner can write
CREATE POLICY "Profiles are viewable by all"    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- FOLLOWS: viewable by all, managed by self
CREATE POLICY "Follows viewable by all"         ON public.follows  FOR SELECT USING (true);
CREATE POLICY "Users manage own follows"        ON public.follows  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users delete own follows"        ON public.follows  FOR DELETE USING (auth.uid() = follower_id);

-- NOTES: viewable by all (unexpired), owner can write/delete
CREATE POLICY "Notes viewable by all"           ON public.notes    FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users create own notes"          ON public.notes    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users delete own notes"          ON public.notes    FOR DELETE USING (auth.uid() = author_id);

-- NOTE RESPONSES: viewable by all, owner can write
CREATE POLICY "Note responses viewable by all"  ON public.note_responses FOR SELECT USING (true);
CREATE POLICY "Users create note responses"     ON public.note_responses FOR INSERT WITH CHECK (auth.uid() = author_id);

-- CONVERSATIONS: members only
CREATE POLICY "Conversation members can view"   ON public.conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid()));

-- CONVERSATION MEMBERS
CREATE POLICY "Members can view membership"     ON public.conversation_members FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()));

-- MESSAGES: only members of the conversation
CREATE POLICY "Members can view messages"       ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Members can send messages"       ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));

-- QUIZ ATTEMPTS: owner only
CREATE POLICY "Users view own attempts"         ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own attempts"       ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SKINS: public catalog
CREATE POLICY "Skins viewable by all"           ON public.skins FOR SELECT USING (true);

-- USER SKINS
CREATE POLICY "Users view own skins"            ON public.user_skins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System grants skins"             ON public.user_skins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PREMIUM ORDERS
CREATE POLICY "Users view own orders"           ON public.premium_orders FOR SELECT USING (auth.uid() = user_id);

-- ACTIVITIES
CREATE POLICY "Users view own activities"       ON public.activities FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────
--  REALTIME  (enable for chat)
-- ─────────────────────────────────────
-- In Supabase Dashboard → Database → Replication → enable for:
--   public.messages
--   public.activities
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
