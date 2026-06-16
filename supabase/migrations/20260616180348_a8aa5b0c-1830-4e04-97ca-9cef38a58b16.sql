
-- 1. Attach prevent_privilege_escalation trigger to profiles (currently unattached)
DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation();

-- 2. Conversations INSERT requires approved (consistency with messages/connections)
DROP POLICY IF EXISTS "Conv participants insert" ON public.conversations;
CREATE POLICY "Conv participants insert" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    ((auth.uid() = participant_a) OR (auth.uid() = participant_b))
    AND (public.is_admin(auth.uid()) OR public.is_approved(auth.uid()))
  );

-- 3. Prevent connection status escalation by requester
CREATE OR REPLACE FUNCTION public.prevent_connection_status_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.uid() = OLD.recipient_id THEN
      IF OLD.status <> 'pending' OR NEW.status NOT IN ('accepted'::connection_status, 'declined'::connection_status) THEN
        RAISE EXCEPTION 'Invalid status change';
      END IF;
    ELSIF auth.uid() = OLD.requester_id THEN
      IF OLD.status <> 'pending' OR NEW.status <> 'withdrawn'::connection_status THEN
        RAISE EXCEPTION 'Requester may only withdraw a pending request';
      END IF;
    ELSE
      RAISE EXCEPTION 'Not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connections_status_guard ON public.connections;
CREATE TRIGGER connections_status_guard
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.prevent_connection_status_escalation();

-- 4. Hide sensitive moderation columns on profiles from peers (column-level privileges)
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, full_name, headline, bio, avatar_url, role, location, location_city,
  location_country, linkedin_url, verification_status, trust_tier,
  profile_completeness, is_founding_member, last_active_at, status,
  created_at, updated_at
) ON public.profiles TO authenticated;

-- RPCs to expose sensitive fields only to the owner / admins
CREATE OR REPLACE FUNCTION public.get_my_approval()
RETURNS TABLE(approval_status approval_status, rejection_reason text, role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT approval_status, rejection_reason, role
  FROM public.profiles
  WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_approval() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_approval() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_pending_profiles()
RETURNS TABLE(
  id uuid, full_name text, role app_role, headline text, location text,
  location_country text, location_city text, linkedin_url text,
  profile_completeness int, created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.role, p.headline, p.location, p.location_country,
         p.location_city, p.linkedin_url, p.profile_completeness, p.created_at
  FROM public.profiles p
  WHERE p.approval_status = 'pending'
    AND public.is_admin(auth.uid())
  ORDER BY p.created_at ASC;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_pending_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_profiles() TO authenticated;

-- 5. Revoke anon EXECUTE on SECURITY DEFINER helpers (they're for signed-in users only)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_approved(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.recompute_profile_completeness(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_connection(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_connection(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;
