ALTER TABLE public.assembleias
  ADD COLUMN IF NOT EXISTS ordem_path text,
  ADD COLUMN IF NOT EXISTS ordem_nome text,
  ADD COLUMN IF NOT EXISTS presencas_path text,
  ADD COLUMN IF NOT EXISTS presencas_nome text,
  ADD COLUMN IF NOT EXISTS dividas_path text,
  ADD COLUMN IF NOT EXISTS dividas_nome text;