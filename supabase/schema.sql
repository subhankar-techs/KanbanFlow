-- ============================================================
-- KanbanFlow — Supabase Database Schema (Supabase Auth)
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ============================================================
-- Drop existing objects
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS boards_updated_at ON public.boards;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at();
DROP FUNCTION IF EXISTS public.is_board_member(UUID);

DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.task_labels CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.labels CASCADE;
DROP TABLE IF EXISTS public.columns CASCADE;
DROP TABLE IF EXISTS public.board_members CASCADE;
DROP TABLE IF EXISTS public.boards CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.board_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(board_id, user_id)
);

CREATE TABLE public.columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6366F1'
);

CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(6) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.task_labels (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

CREATE TABLE public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_boards_owner ON public.boards(owner_id);
CREATE INDEX idx_board_members_board ON public.board_members(board_id);
CREATE INDEX idx_board_members_user ON public.board_members(user_id);
CREATE INDEX idx_columns_board ON public.columns(board_id);
CREATE INDEX idx_columns_position ON public.columns(board_id, position);
CREATE INDEX idx_tasks_column ON public.tasks(column_id);
CREATE INDEX idx_tasks_position ON public.tasks(column_id, position);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_activity_log_board ON public.activity_log(board_id);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================================
-- Auto-create profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER boards_updated_at BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Profiles policies
-- ============================================================
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- Boards policies
-- ============================================================
-- Use IN subquery (not EXISTS with board_members) to avoid recursion
CREATE POLICY "boards_select" ON public.boards FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
  );
CREATE POLICY "boards_insert" ON public.boards FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "boards_update" ON public.boards FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "boards_delete" ON public.boards FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- Board members policies
-- CRITICAL: never self-reference board_members in its own policy
-- ============================================================
CREATE POLICY "board_members_select" ON public.board_members FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "board_members_insert" ON public.board_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid())
  );
CREATE POLICY "board_members_delete" ON public.board_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND owner_id = auth.uid()));

-- ============================================================
-- Columns policies
-- Use IN subquery on board_members (not EXISTS to avoid chain recursion)
-- ============================================================
CREATE POLICY "columns_select" ON public.columns FOR SELECT
  USING (board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid()));
CREATE POLICY "columns_insert" ON public.columns FOR INSERT
  WITH CHECK (
    board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid())
    OR board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
  );
CREATE POLICY "columns_update" ON public.columns FOR UPDATE
  USING (board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid()));
CREATE POLICY "columns_delete" ON public.columns FOR DELETE
  USING (board_id IN (SELECT board_id FROM public.boards WHERE owner_id = auth.uid()));

-- ============================================================
-- Labels policies
-- ============================================================
CREATE POLICY "labels_select" ON public.labels FOR SELECT
  USING (board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid()));
CREATE POLICY "labels_insert" ON public.labels FOR INSERT
  WITH CHECK (board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid()));
CREATE POLICY "labels_delete" ON public.labels FOR DELETE
  USING (board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid()));

-- ============================================================
-- Tasks policies
-- ============================================================
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT
  USING (
    column_id IN (
      SELECT c.id FROM public.columns c
      WHERE c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT
  WITH CHECK (
    column_id IN (
      SELECT c.id FROM public.columns c
      WHERE c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE
  USING (
    column_id IN (
      SELECT c.id FROM public.columns c
      WHERE c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE
  USING (
    column_id IN (
      SELECT c.id FROM public.columns c
      WHERE c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- Task labels policies
-- ============================================================
CREATE POLICY "task_labels_select" ON public.task_labels FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.columns c ON c.id = t.column_id
      WHERE c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "task_labels_insert" ON public.task_labels FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.columns c ON c.id = t.column_id
      WHERE c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "task_labels_delete" ON public.task_labels FOR DELETE
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.columns c ON c.id = t.column_id
      WHERE c.board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- Activity log policies
-- ============================================================
CREATE POLICY "activity_log_select" ON public.activity_log FOR SELECT
  USING (board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid()));
CREATE POLICY "activity_log_insert" ON public.activity_log FOR INSERT
  WITH CHECK (board_id IN (SELECT board_id FROM public.board_members WHERE user_id = auth.uid()));

-- ============================================================
-- Backfill profiles for existing auth users
-- ============================================================
INSERT INTO public.profiles (id, email, name, avatar_url, auth_provider)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  raw_user_meta_data->>'avatar_url',
  CASE
    WHEN raw_app_meta_data->>'provider' = 'google' THEN 'google'
    ELSE 'email'
  END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RPC: Check provider for a given email (SECURITY DEFINER
-- so it bypasses RLS — used by auth callback & signup)
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
