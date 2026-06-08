
DROP POLICY IF EXISTS "Owner can publish (active/verified tier)" ON public.opportunities;
CREATE POLICY "Owner can publish"
  ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.recompute_profile_completeness(_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _score INT := 0;
  _p RECORD;
  _role app_role;
  _tier trust_tier;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id = _user_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  _role := _p.role;
  IF _p.full_name IS NOT NULL AND length(_p.full_name) > 1 THEN _score := _score + 25; END IF;
  IF _p.headline IS NOT NULL AND length(_p.headline) > 2 THEN _score := _score + 15; END IF;
  IF _p.bio IS NOT NULL AND length(_p.bio) > 10 THEN _score := _score + 20; END IF;
  IF _p.avatar_url IS NOT NULL THEN _score := _score + 5; END IF;
  IF _p.location_country IS NOT NULL OR _p.location IS NOT NULL THEN _score := _score + 10; END IF;
  IF _p.linkedin_url IS NOT NULL THEN _score := _score + 5; END IF;
  IF _role = 'founder' THEN
    IF EXISTS (SELECT 1 FROM public.entrepreneur_profiles ep WHERE ep.user_id=_user_id AND (ep.company_name IS NOT NULL OR ep.background_summary IS NOT NULL)) THEN _score := _score + 20; END IF;
  ELSIF _role = 'investor' THEN
    IF EXISTS (SELECT 1 FROM public.investor_profiles ip WHERE ip.user_id=_user_id AND (ip.investor_type IS NOT NULL OR ip.focus_summary IS NOT NULL)) THEN _score := _score + 20; END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM public.expert_profiles xp WHERE xp.user_id=_user_id AND (array_length(xp.expertise_areas,1) > 0 OR xp.past_roles_summary IS NOT NULL)) THEN _score := _score + 20; END IF;
  END IF;
  IF _score > 100 THEN _score := 100; END IF;
  IF _p.verification_status = 'verified' THEN _tier := 'verified';
  ELSIF _score >= 30 THEN _tier := 'active';
  ELSE _tier := 'registered';
  END IF;
  UPDATE public.profiles SET profile_completeness = _score, trust_tier = _tier WHERE id = _user_id;
  RETURN _score;
END;
$function$;
