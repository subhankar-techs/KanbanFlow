-- ============================================================
-- KanbanFlow — Google OAuth Migration
-- Run this in your Supabase SQL Editor AFTER the base schema
-- ============================================================

-- ============================================================
-- 1. Add auth_provider column to profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'email';

-- ============================================================
-- 2. Add UNIQUE constraint on email (one email = one account)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- ============================================================
-- 3. Create index on auth_provider for lookup performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON public.profiles(auth_provider);

-- ============================================================
-- 4. Backfill existing users as 'email' provider
-- ============================================================
UPDATE public.profiles
SET auth_provider = 'email'
WHERE auth_provider IS NULL OR auth_provider = '';

-- ============================================================
-- 5. Update handle_new_user() trigger to capture provider
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google'
      ELSE 'email'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. RPC: Check provider for a given email (SECURITY DEFINER
--    so it bypasses RLS — used by auth callback)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_provider_for_email(lookup_email TEXT)
RETURNS TABLE(auth_provider VARCHAR, user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT p.auth_provider, p.id
  FROM public.profiles p
  WHERE p.email = lookup_email
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
