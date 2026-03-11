
CREATE TABLE public.company_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pontos_padrao jsonb NOT NULL DEFAULT '[]'::jsonb,
  local_reuniao_padrao text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);

ALTER TABLE public.company_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
  ON public.company_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company members can view own templates"
  ON public.company_templates FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
