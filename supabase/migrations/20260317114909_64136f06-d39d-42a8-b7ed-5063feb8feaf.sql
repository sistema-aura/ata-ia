ALTER TABLE public.company_formatting
  ADD COLUMN IF NOT EXISTS opening_paragraph_template text NOT NULL DEFAULT 'Aos [data por extenso], pelas [hora] horas, reuniu no [local] em [convocatória] convocatória, a Assembleia [Ordinária/Extraordinária] de Condóminos do condomínio sito na [morada], concelho de [concelho] com o NIPC [NIF], para deliberar sobre os assuntos seguintes:';

ALTER TABLE public.company_formatting
  ADD COLUMN IF NOT EXISTS agenda_item_template text NOT NULL DEFAULT '[numero]. [titulo];';

ALTER TABLE public.company_formatting
  ADD COLUMN IF NOT EXISTS attendance_item_template text NOT NULL DEFAULT '• [Nome completo], proprietário da fração [X], correspondente ao [descrição], representando [permilagem] % do capital total do edifício;';

ALTER TABLE public.company_formatting
  ADD COLUMN IF NOT EXISTS absentee_item_template text NOT NULL DEFAULT '• [Nome completo], proprietário da fração [X], correspondente ao [descrição], representando [permilagem] % do capital total do edifício;';

ALTER TABLE public.company_formatting
  ADD COLUMN IF NOT EXISTS point_paragraph_template text NOT NULL DEFAULT 'Ponto [número por extenso]: [Título]- [Texto da deliberação]';

ALTER TABLE public.company_formatting
  ADD COLUMN IF NOT EXISTS signature_item_template text NOT NULL DEFAULT '[Descrição fração]: ____________________________________________________________';

ALTER TABLE public.company_formatting
  ADD COLUMN IF NOT EXISTS debt_header_template text NOT NULL DEFAULT '✓ Fração [X] – [Descrição] – [Valor por extenso] (€ [valor numérico]) correspondentes:';

ALTER TABLE public.company_formatting
  ADD COLUMN IF NOT EXISTS debt_detail_template text NOT NULL DEFAULT 'o  a quotização (€ ____) e fundo de reserva (€ ____) do mês de [mês] até ao mês de [mês] do ano [ano] (€ ____);';