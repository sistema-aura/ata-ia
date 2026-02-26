
-- Create table for saved atas
CREATE TABLE public.atas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_condominio TEXT NOT NULL,
  data_assembleia TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public access since no auth)
ALTER TABLE public.atas ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth in this project)
CREATE POLICY "Allow all select" ON public.atas FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.atas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.atas FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.atas FOR DELETE USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_atas_updated_at
BEFORE UPDATE ON public.atas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
