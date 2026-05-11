
-- Reescrever todas as RLS para acesso público (anon + authenticated)

-- atas
DROP POLICY IF EXISTS "Company atas access" ON public.atas;
CREATE POLICY "Public access" ON public.atas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- companies
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Company members can view own company" ON public.companies;
CREATE POLICY "Public access" ON public.companies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- company_formatting
DROP POLICY IF EXISTS "Admins can manage formatting" ON public.company_formatting;
DROP POLICY IF EXISTS "Company members can view own formatting" ON public.company_formatting;
CREATE POLICY "Public access" ON public.company_formatting FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- company_templates
DROP POLICY IF EXISTS "Admins can manage templates" ON public.company_templates;
DROP POLICY IF EXISTS "Company members can view own templates" ON public.company_templates;
CREATE POLICY "Public access" ON public.company_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- payments
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Company members can view own payments" ON public.payments;
CREATE POLICY "Public access" ON public.payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- support_tickets
DROP POLICY IF EXISTS "Admins can manage tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Company members can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Company members can view own tickets" ON public.support_tickets;
CREATE POLICY "Public access" ON public.support_tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ticket_messages
DROP POLICY IF EXISTS "Participants can send messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.ticket_messages;
CREATE POLICY "Public access" ON public.ticket_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Garantir que existe pelo menos uma "empresa padrão"
INSERT INTO public.companies (name, slug, is_active, subscription_status, monthly_price)
SELECT 'Empresa Padrão', 'empresa-padrao', true, 'active', 0
WHERE NOT EXISTS (SELECT 1 FROM public.companies);
