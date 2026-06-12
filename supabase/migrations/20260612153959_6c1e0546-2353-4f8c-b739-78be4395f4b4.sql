
-- 1) Replace the brittle shared trigger function with two table-specific ones
DROP FUNCTION IF EXISTS public.trg_recompute_completeness() CASCADE;

CREATE OR REPLACE FUNCTION public.trg_recompute_completeness_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recompute_profile_completeness(COALESCE(NEW.id, OLD.id));
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_completeness_details()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recompute_profile_completeness(COALESCE(NEW.user_id, OLD.user_id));
  RETURN NULL;
END;
$$;

-- 2) Attach triggers (AFTER, so the row exists)
DROP TRIGGER IF EXISTS recompute_completeness_on_profile ON public.profiles;
CREATE TRIGGER recompute_completeness_on_profile
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_completeness_profiles();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'entrepreneur_profiles','investor_profiles','expert_profiles',
    'founder_details','investor_details','professional_details'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS recompute_completeness_on_%I ON public.%I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER recompute_completeness_on_%I AFTER INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_completeness_details();',
      t, t
    );
  END LOOP;
END $$;

-- 3) Privilege-escalation trigger must exist for the policy to be safe
DROP TRIGGER IF EXISTS prevent_privilege_escalation_on_profiles ON public.profiles;
CREATE TRIGGER prevent_privilege_escalation_on_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation();
