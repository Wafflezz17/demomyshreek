
CREATE OR REPLACE FUNCTION public.enforce_connection_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier trust_tier;
  _limit INT;
  _count INT;
BEGIN
  IF public.is_admin(NEW.requester_id) THEN RETURN NEW; END IF;

  SELECT trust_tier INTO _tier FROM public.profiles WHERE id = NEW.requester_id;
  IF _tier = 'verified' THEN _limit := 25;
  ELSIF _tier = 'active' THEN _limit := 10;
  ELSE
    RAISE EXCEPTION 'CONNECTION_RATE_LIMIT: Complete your profile (Active tier) to send connection requests.';
  END IF;

  SELECT COUNT(*) INTO _count
  FROM public.connections
  WHERE requester_id = NEW.requester_id
    AND created_at > (now() - interval '24 hours');

  IF _count >= _limit THEN
    RAISE EXCEPTION 'CONNECTION_RATE_LIMIT: You''ve reached your daily limit of % connection requests. Try again tomorrow%.',
      _limit,
      CASE WHEN _tier = 'active' THEN ', or get verified to send up to 25/day' ELSE '' END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_connection_rate_limit_trg ON public.connections;
CREATE TRIGGER enforce_connection_rate_limit_trg
BEFORE INSERT ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.enforce_connection_rate_limit();


CREATE OR REPLACE FUNCTION public.enforce_live_opportunity_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier trust_tier;
  _limit INT;
  _count INT;
  _is_live BOOLEAN;
  _was_live BOOLEAN;
BEGIN
  IF public.is_admin(NEW.owner_id) THEN RETURN NEW; END IF;

  _is_live := NEW.status = 'live';
  _was_live := TG_OP = 'UPDATE' AND OLD.status = 'live';

  IF NOT _is_live OR _was_live THEN RETURN NEW; END IF;

  SELECT trust_tier INTO _tier FROM public.profiles WHERE id = NEW.owner_id;
  IF _tier = 'verified' THEN _limit := 20;
  ELSIF _tier = 'active' THEN _limit := 5;
  ELSE
    RAISE EXCEPTION 'OPPORTUNITY_LIMIT: Complete your profile (Active tier) to publish opportunities.';
  END IF;

  SELECT COUNT(*) INTO _count
  FROM public.opportunities
  WHERE owner_id = NEW.owner_id
    AND status = 'live'
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF _count >= _limit THEN
    RAISE EXCEPTION 'OPPORTUNITY_LIMIT: You''ve reached your limit of % live opportunities. Close or archive one before publishing another%.',
      _limit,
      CASE WHEN _tier = 'active' THEN ', or get verified for up to 20' ELSE '' END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_live_opportunity_limit_trg ON public.opportunities;
CREATE TRIGGER enforce_live_opportunity_limit_trg
BEFORE INSERT OR UPDATE OF status ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.enforce_live_opportunity_limit();
