ALTER TABLE public.company_formatting
ADD COLUMN IF NOT EXISTS debt_section_intro_text text NOT NULL DEFAULT 'DÍVIDAS AO CONDOMÍNIO (COPIAR TAL QUAL PARA A ATA):',
ADD COLUMN IF NOT EXISTS debt_total_label text NOT NULL DEFAULT 'Total geral em dívida ao condomínio:',
ADD COLUMN IF NOT EXISTS debt_quota_extra_label text NOT NULL DEFAULT 'Quota extra';