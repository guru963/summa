-- ============================================================
-- PAR FOR GOOD — DEFINITIVE SCHEMA v4
-- Fixes profile creation completely
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── STEP 1: DROP EVERYTHING CLEANLY ──────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS enforce_max_scores_trigger ON golf_scores;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_user_confirmed() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS enforce_max_scores() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP TABLE IF EXISTS charity_donations CASCADE;
DROP TABLE IF EXISTS winner_verifications CASCADE;
DROP TABLE IF EXISTS draw_entries CASCADE;
DROP TABLE IF EXISTS draws CASCADE;
DROP TABLE IF EXISTS golf_scores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS charities CASCADE;

-- ── STEP 2: TABLES ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  website TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  upcoming_events TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT 'Member',
  avatar_url TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (subscription_status IN ('active','inactive','cancelled','lapsed')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly','yearly')),
  subscription_renewal_date TIMESTAMPTZ,
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  charity_percentage INTEGER NOT NULL DEFAULT 10
    CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  stripe_customer_id TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_golf_scores_user ON golf_scores(user_id, played_at DESC);

CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_month TEXT NOT NULL UNIQUE,
  draw_logic TEXT NOT NULL DEFAULT 'random' CHECK (draw_logic IN ('random','algorithmic')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','simulated','published')),
  jackpot_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tier_4_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tier_3_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_subscribers INTEGER NOT NULL DEFAULT 0,
  rolled_over BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scores_snapshot INTEGER[] NOT NULL DEFAULT '{}',
  match_type INTEGER CHECK (match_type IN (3,4,5)),
  prize_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

CREATE TABLE winner_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  proof_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, draw_id)
);

CREATE TABLE charity_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('subscription','independent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── STEP 3: HELPER — avoids RLS recursion in admin policies ──
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ── STEP 4: TRIGGERS ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION enforce_max_scores()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_count INT; v_oldest UUID;
BEGIN
  SELECT COUNT(*) INTO v_count FROM golf_scores WHERE user_id = NEW.user_id;
  IF v_count >= 5 THEN
    SELECT id INTO v_oldest FROM golf_scores
    WHERE user_id = NEW.user_id ORDER BY played_at ASC LIMIT 1;
    DELETE FROM golf_scores WHERE id = v_oldest;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_max_scores_trigger
  BEFORE INSERT ON golf_scores
  FOR EACH ROW EXECUTE FUNCTION enforce_max_scores();

-- THE KEY TRIGGER — fires on INSERT into auth.users
-- SECURITY DEFINER = runs as postgres superuser, bypasses ALL RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, subscription_status, charity_percentage, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
    'inactive',
    10,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN profiles.full_name = 'Member' THEN EXCLUDED.full_name 
      ELSE profiles.full_name 
    END;
  RETURN NEW;
END;
$$;

-- Fires when a new user row is inserted (signup)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ALSO fires on UPDATE — catches email confirmation
-- When user confirms email, auth.users row is UPDATED
-- This ensures profile exists even if INSERT trigger was missed
CREATE OR REPLACE FUNCTION handle_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act if email was just confirmed (confirmed_at changed from null)
  IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, subscription_status, charity_percentage, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
      'inactive',
      10,
      'user'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_updated();

-- ── STEP 5: ROW LEVEL SECURITY ───────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Users: full access to own row
CREATE POLICY "profiles_own" ON profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Admins: read/update all
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE USING (is_admin());

ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_own" ON golf_scores FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scores_admin" ON golf_scores FOR SELECT USING (is_admin());

ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charities_public_read" ON charities FOR SELECT USING (TRUE);
CREATE POLICY "charities_admin_write" ON charities FOR ALL USING (is_admin());

ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "draws_published_read" ON draws FOR SELECT USING (status = 'published');
CREATE POLICY "draws_admin_all" ON draws FOR ALL USING (is_admin());

ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entries_own" ON draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "entries_admin" ON draw_entries FOR ALL USING (is_admin());

ALTER TABLE winner_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif_own" ON winner_verifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verif_admin" ON winner_verifications FOR ALL USING (is_admin());

ALTER TABLE charity_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_own_read" ON charity_donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "donations_own_insert" ON charity_donations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "donations_admin" ON charity_donations FOR ALL USING (is_admin());

-- ── STEP 6: BACKFILL — fix any existing auth users without profiles ──
-- This runs immediately and patches ALL users who are missing a profile row
INSERT INTO public.profiles (id, email, full_name, subscription_status, charity_percentage, role)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'full_name', 'Member'),
  'inactive',
  10,
  'user'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ── STEP 7: SEED CHARITIES ───────────────────────────────────
INSERT INTO charities (name, description, category, image_url, website, is_featured, is_active, upcoming_events) VALUES
('Golf Foundation','Providing young people from all backgrounds with the opportunity to try golf and develop life skills.','Youth Sports','https://images.unsplash.com/photo-1592919505780-303950717480?w=400&h=300&fit=crop','https://www.golf-foundation.org',TRUE,TRUE,'Junior Golf Day — April 12, 2026 at Wentworth Club'),
('Cancer Research UK','The world''s leading cancer research charity, funding science and driving progress that saves lives.','Medical Research','https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop','https://www.cancerresearchuk.org',TRUE,TRUE,'Charity Golf Tournament — May 3, 2026 at St Andrews'),
('Macmillan Cancer Support','Providing physical, financial and emotional support to people living with cancer.','Health Support','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop','https://www.macmillan.org.uk',FALSE,TRUE,'Macmillan Golf Challenge — June 15, 2026'),
('Alzheimer''s Society','United against dementia — funding research and providing support for those affected.','Medical Research','https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop','https://www.alzheimers.org.uk',FALSE,TRUE,NULL),
('Mental Health Foundation','The UK''s leading charity for everyone''s mental health.','Mental Health','https://images.unsplash.com/photo-1559757175-7cb057fba93a?w=400&h=300&fit=crop','https://www.mentalhealth.org.uk',FALSE,TRUE,'Mental Health Golf Day — July 20, 2026'),
('Comic Relief','Fighting poverty and injustice in the UK and internationally.','International Aid','https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop','https://www.comicrelief.com',FALSE,TRUE,NULL);

-- ── VERIFY ───────────────────────────────────────────────────
SELECT 
  'auth.users' as tbl, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'charities', COUNT(*) FROM charities;
