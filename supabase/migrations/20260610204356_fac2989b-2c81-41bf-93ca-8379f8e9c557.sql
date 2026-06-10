-- Prevent non-admins from escalating privileges via profile self-update
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin (or service_role direct DB access) may change anything
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Block changes to privileged columns by anyone else (including the row owner)
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.trust_tier IS DISTINCT FROM OLD.trust_tier
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
  THEN
    RAISE EXCEPTION 'Not allowed to change privileged profile columns';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_privilege_escalation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_privilege_escalation();

-- Add WITH CHECK on the self-update policy (defense-in-depth; trigger is the real gate)
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Prevent users from inserting their own role rows (only handle_new_user / admins via service_role)
-- user_roles currently has no INSERT/UPDATE/DELETE policies, so non-admin writes already blocked.
-- Tighten SELECT: users may read only their own role; admins read all.
DROP POLICY IF EXISTS "Roles are viewable by authenticated" ON public.user_roles;
CREATE POLICY "Users read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));