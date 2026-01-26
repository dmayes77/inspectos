alter table if exists public.agents
  add column if not exists agency_address text;
