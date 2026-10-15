CREATE TABLE public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT DEFAULT '',
  nome TEXT NOT NULL,
  nif TEXT DEFAULT '',
  morada TEXT DEFAULT '',
  fraccoes INTEGER,
  zonas TEXT DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condominios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condominios TO anon;
GRANT ALL ON public.condominios TO service_role;
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.condominios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.assembleias ADD COLUMN IF NOT EXISTS resumo_reuniao TEXT DEFAULT '';