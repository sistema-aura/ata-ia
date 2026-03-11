
-- Remove old permissive atas policies
DROP POLICY IF EXISTS "Allow all delete" ON public.atas;
DROP POLICY IF EXISTS "Allow all insert" ON public.atas;
DROP POLICY IF EXISTS "Allow all select" ON public.atas;
DROP POLICY IF EXISTS "Allow all update" ON public.atas;

-- Remove overly permissive profile insert policy
DROP POLICY IF EXISTS "Allow profile insert on signup" ON public.profiles;
