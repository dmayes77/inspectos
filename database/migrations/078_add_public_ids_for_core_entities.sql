-- Add human-safe public IDs for core entities used in dashboard URLs.

CREATE OR REPLACE FUNCTION public.generate_entity_public_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars CONSTANT text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
BEGIN
  candidate := '';
  FOR i IN 1..10 LOOP
    candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_agents_public_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := public.generate_entity_public_id();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.agents a WHERE a.public_id = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_clients_public_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := public.generate_entity_public_id();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.public_id = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_properties_public_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := public.generate_entity_public_id();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.properties p WHERE p.public_id = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS public_id TEXT;

UPDATE public.agents
SET public_id = public.generate_agents_public_id()
WHERE public_id IS NULL
   OR public_id !~ '^[A-HJ-NP-Z2-9]{10}$';

ALTER TABLE public.agents
  ALTER COLUMN public_id SET DEFAULT public.generate_agents_public_id();
ALTER TABLE public.agents
  ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.agents
  DROP CONSTRAINT IF EXISTS agents_public_id_format;
ALTER TABLE public.agents
  ADD CONSTRAINT agents_public_id_format CHECK (public_id ~ '^[A-HJ-NP-Z2-9]{10}$');
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_public_id ON public.agents(public_id);

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS public_id TEXT;

UPDATE public.clients
SET public_id = public.generate_clients_public_id()
WHERE public_id IS NULL
   OR public_id !~ '^[A-HJ-NP-Z2-9]{10}$';

ALTER TABLE public.clients
  ALTER COLUMN public_id SET DEFAULT public.generate_clients_public_id();
ALTER TABLE public.clients
  ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_public_id_format;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_public_id_format CHECK (public_id ~ '^[A-HJ-NP-Z2-9]{10}$');
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_public_id ON public.clients(public_id);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS public_id TEXT;

UPDATE public.properties
SET public_id = public.generate_properties_public_id()
WHERE public_id IS NULL
   OR public_id !~ '^[A-HJ-NP-Z2-9]{10}$';

ALTER TABLE public.properties
  ALTER COLUMN public_id SET DEFAULT public.generate_properties_public_id();
ALTER TABLE public.properties
  ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_public_id_format;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_public_id_format CHECK (public_id ~ '^[A-HJ-NP-Z2-9]{10}$');
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_public_id ON public.properties(public_id);
