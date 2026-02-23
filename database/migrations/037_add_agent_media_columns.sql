-- Add media fields for agents. Safe to run multiple times due to IF NOT EXISTS guards.
alter table public.agents
  add column if not exists avatar_url text;

alter table public.agents
  add column if not exists brand_logo_url text;
