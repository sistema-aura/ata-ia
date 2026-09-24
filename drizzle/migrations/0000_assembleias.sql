CREATE TABLE public.assembleias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_condominio text NOT NULL,
  morada text DEFAULT '',
  data_assembleia date,
  hora text DEFAULT '',
  tipo text DEFAULT 'ordinaria',
  convocatoria text DEFAULT 'primeira',
  local_reuniao text DEFAULT '',
  notas text DEFAULT '',
  ficheiro_path text,
  ficheiro_nome text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.assembleias TO anon, authenticated, service_role;
ALTER TABLE public.assembleias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.assembleias FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public assembleias files" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id='assembleias') WITH CHECK (bucket_id='assembleias');