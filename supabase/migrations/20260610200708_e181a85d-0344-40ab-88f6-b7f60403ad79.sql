
-- Trigger function to recompute completeness for the affected user
CREATE OR REPLACE FUNCTION public.trg_recompute_completeness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  _uid := COALESCE(
    (CASE WHEN TG_TABLE_NAME = 'profiles' THEN COALESCE(NEW.id, OLD.id) END),
    (CASE WHEN TG_TABLE_NAME <> 'profiles' THEN COALESCE(NEW.user_id, OLD.user_id) END)
  );
  IF _uid IS NOT NULL THEN
    PERFORM public.recompute_profile_completeness(_uid);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trg_recompute_completeness() FROM PUBLIC, anon, authenticated;

-- Profiles: recompute after insert/update (skip when only completeness/trust_tier columns change to avoid recursion)
DROP TRIGGER IF EXISTS profiles_recompute_trust ON public.profiles;
CREATE TRIGGER profiles_recompute_trust
AFTER INSERT OR UPDATE OF full_name, headline, bio, avatar_url, location, location_country, linkedin_url, verification_status
ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_completeness();

-- Role-specific tables
DROP TRIGGER IF EXISTS entrepreneur_recompute_trust ON public.entrepreneur_profiles;
CREATE TRIGGER entrepreneur_recompute_trust
AFTER INSERT OR UPDATE OR DELETE ON public.entrepreneur_profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_completeness();

DROP TRIGGER IF EXISTS investor_recompute_trust ON public.investor_profiles;
CREATE TRIGGER investor_recompute_trust
AFTER INSERT OR UPDATE OR DELETE ON public.investor_profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_completeness();

DROP TRIGGER IF EXISTS expert_recompute_trust ON public.expert_profiles;
CREATE TRIGGER expert_recompute_trust
AFTER INSERT OR UPDATE OR DELETE ON public.expert_profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_completeness();

DROP TRIGGER IF EXISTS verifications_recompute_trust ON public.verifications;
CREATE TRIGGER verifications_recompute_trust
AFTER INSERT OR UPDATE OR DELETE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_completeness();

-- Tighten opportunity publish policy: require active or verified trust tier
DROP POLICY IF EXISTS "Owner can publish" ON public.opportunities;
CREATE POLICY "Owner can publish (active/verified)" ON public.opportunities
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.trust_tier IN ('active','verified')
  )
);

-- Backfill: recompute for everyone so trust_tier reflects current data
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_profile_completeness(r.id);
  END LOOP;
END $$;
