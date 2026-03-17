ALTER TABLE public.company_formatting
ADD COLUMN IF NOT EXISTS attendance_intro_text text NOT NULL DEFAULT 'A assembleia foi regularmente convocada por carta registada. Estiveram presentes e representados os seguintes condóminos:',
ADD COLUMN IF NOT EXISTS absentees_intro_text text NOT NULL DEFAULT 'Estiveram ausentes os seguintes condóminos:',
ADD COLUMN IF NOT EXISTS legal_opening_text text NOT NULL DEFAULT 'Os condóminos presentes representam [SOMA das permilagens dos presentes]‰ da permilagem total do imóvel, correspondentes a [percentagem] % do Capital Total do Edifício, nos termos do art.º 1432.º, do CC, o que permite deliberar sobre os assuntos constantes da ordem de trabalhos. Exerceu as funções de presidente o Sr. [nome presidente].',
ADD COLUMN IF NOT EXISTS closing_text text NOT NULL DEFAULT 'Nada mais havendo a acrescentar, deu-se por encerrada a Assembleia cerca das [hora] horas e [minutos] minutos, sendo lavrada a presente ata que depois de lida e aprovada vai ser assinada por todos os condóminos presentes.',
ADD COLUMN IF NOT EXISTS signatures_title text NOT NULL DEFAULT 'Presidente:',
ADD COLUMN IF NOT EXISTS title_alignment text NOT NULL DEFAULT 'center',
ADD COLUMN IF NOT EXISTS body_alignment text NOT NULL DEFAULT 'justify',
ADD COLUMN IF NOT EXISTS paragraph_spacing_after integer NOT NULL DEFAULT 120,
ADD COLUMN IF NOT EXISTS first_line_indent integer NOT NULL DEFAULT 0;

ALTER TABLE public.company_formatting
DROP CONSTRAINT IF EXISTS company_formatting_title_alignment_check;

ALTER TABLE public.company_formatting
ADD CONSTRAINT company_formatting_title_alignment_check
CHECK (title_alignment IN ('left', 'center', 'right', 'justify'));

ALTER TABLE public.company_formatting
DROP CONSTRAINT IF EXISTS company_formatting_body_alignment_check;

ALTER TABLE public.company_formatting
ADD CONSTRAINT company_formatting_body_alignment_check
CHECK (body_alignment IN ('left', 'center', 'right', 'justify'));