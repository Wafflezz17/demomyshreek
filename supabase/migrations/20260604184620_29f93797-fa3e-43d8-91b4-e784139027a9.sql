
DROP VIEW IF EXISTS public.profiles_public;

DROP POLICY IF EXISTS "Owner reads own profile" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE public.profiles DROP COLUMN IF EXISTS contact_email;

-- Update trigger to no longer set contact_email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _full_name TEXT;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'professional');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, full_name, role) VALUES (NEW.id, _full_name, _role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;
  IF _role = 'founder' THEN INSERT INTO public.founder_details (user_id) VALUES (NEW.id);
  ELSIF _role = 'investor' THEN INSERT INTO public.investor_details (user_id) VALUES (NEW.id);
  ELSE INSERT INTO public.professional_details (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END; $function$;
