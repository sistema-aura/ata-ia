
CREATE TABLE public.company_formatting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  -- Document style
  font_family text NOT NULL DEFAULT 'Times New Roman',
  font_size integer NOT NULL DEFAULT 22,
  margin_top integer NOT NULL DEFAULT 1440,
  margin_bottom integer NOT NULL DEFAULT 1440,
  margin_left integer NOT NULL DEFAULT 1440,
  margin_right integer NOT NULL DEFAULT 1440,
  line_spacing integer NOT NULL DEFAULT 120,
  -- Header/footer
  header_text text DEFAULT '',
  footer_text text DEFAULT '',
  -- AI instructions
  ai_custom_instructions text DEFAULT '',
  -- Company branding for ata
  nome_empresa_ata text DEFAULT '',
  nif_empresa text DEFAULT '',
  morada_empresa text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_formatting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage formatting" ON public.company_formatting
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company members can view own formatting" ON public.company_formatting
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE TRIGGER update_company_formatting_updated_at
  BEFORE UPDATE ON public.company_formatting
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
