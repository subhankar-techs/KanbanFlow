-- Personal API tokens for the MCP endpoint (/api/mcp).
-- Only the SHA-256 hash is stored; the raw token is shown to the user once.
create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'AI assistant',
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

alter table public.api_tokens enable row level security;

create policy "Users can view own tokens" on public.api_tokens
  for select using (auth.uid() = user_id);

create policy "Users can create own tokens" on public.api_tokens
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own tokens" on public.api_tokens
  for delete using (auth.uid() = user_id);
