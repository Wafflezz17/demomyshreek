-- ============================================================================
-- myShareek — Critical security & functional fixes (C1, C2, H1)
-- Run in: Supabase SQL Editor (project vdostaecqycdgumkmnch), as a single batch.
-- Safe to run once. Does NOT change any UI or break existing reads.
-- After running, do the per-fix verification at the bottom.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 0 (DO THIS FIRST): audit for rogue admins created via the C1 hole.
-- The signup->admin escalation has been live, so confirm only YOUR admins exist.
-- Run this SELECT, eyeball the list, and remove any user_id you don't recognise.
-- ----------------------------------------------------------------------------
-- SELECT ur.user_id, p.full_name, ur.created_at
-- FROM public.user_roles ur
-- LEFT JOIN public.profiles p ON p.id = ur.user_id
-- WHERE ur.role = 'admin'
-- ORDER BY ur.created_at;
--
-- To remove a rogue admin (replace the uuid):
-- DELETE FROM public.user_roles WHERE user_id = '<rogue-uuid>' AND role = 'admin';
-- UPDATE public.profiles SET role = 'professional' WHERE id = '<rogue-uuid>';


-- ----------------------------------------------------------------------------
-- C1 (CRITICAL): stop trusting signup metadata for role.
-- Clamp role to the three self-selectable roles; 'admin' can NEVER come from
-- signup. All new users start 'pending' (admin approves everyone — your call).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _full_name TEXT;
  _email_verified BOOL;
BEGIN
  -- Take requested role, but HARD-CLAMP to the allowed self-service set.
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'professional');
  IF _role NOT IN ('founder','investor','professional') THEN
    _role := 'professional';            -- anything else (incl. 'admin') is ignored
  END IF;

  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  _email_verified := NEW.email_confirmed_at IS NOT NULL;

  -- Everyone starts pending; admins are seeded out-of-band only.
  INSERT INTO public.profiles (id, full_name, role, email_verified, approval_status, approved_at)
    VALUES (NEW.id, _full_name, _role, _email_verified, 'pending', NULL)
    ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;

  IF _role = 'founder' THEN
    INSERT INTO public.entrepreneur_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public.founder_details (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSIF _role = 'investor' THEN
    INSERT INTO public.investor_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public.investor_details (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.expert_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public.professional_details (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Defense-in-depth: block 'admin' from ever being inserted into user_roles by a
-- normal (RLS-bound) request. Seeding admins via SQL editor / service role still
-- works because those run with session_replication_role='replica' or as a
-- superuser/owner, which bypasses this trigger.
CREATE OR REPLACE FUNCTION public.block_admin_role_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    RAISE EXCEPTION 'admin role cannot be assigned through the application';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_admin_role_insert_trg ON public.user_roles;
CREATE TRIGGER block_admin_role_insert_trg
BEFORE INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.block_admin_role_insert();


-- ----------------------------------------------------------------------------
-- C2 (CRITICAL-functional): let the trust_tier recompute write through the
-- privilege-escalation guard. The guard must still block DIRECT user edits to
-- privileged columns, but allow the nested write made by our own recompute
-- trigger (which only sets computed trust_tier / completeness).
-- A direct user UPDATE hits this guard at trigger depth 1; the recompute's
-- nested UPDATE hits it at depth >= 2. So allow depth > 1.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins may change anything.
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Allow writes originating from our own nested triggers (e.g. trust_tier
  -- recompute). Those run nested (depth > 1) and only set computed values.
  -- Direct user edits reach this guard at depth = 1 and remain fully gated.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.role               IS DISTINCT FROM OLD.role
     OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.approved_by     IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at     IS DISTINCT FROM OLD.approved_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.trust_tier       IS DISTINCT FROM OLD.trust_tier
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
  THEN
    RAISE EXCEPTION 'Not allowed to change privileged profile columns';
  END IF;

  RETURN NEW;
END;
$$;


-- ----------------------------------------------------------------------------
-- H1 (HIGH): enforce double opt-in. No message may exist between two users
-- unless they have an ACCEPTED connection. We gate at TWO layers:
--   (a) the RPC, for a clear early error in the UI, and
--   (b) the messages INSERT policy, which is the real backstop (a user can
--       insert a conversations row directly via the table API, bypassing the
--       RPC — so the policy is what actually closes the hole).
-- ----------------------------------------------------------------------------

-- (a) RPC gate
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_other_user UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _a UUID; _b UUID; _id UUID;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _me = _other_user THEN RAISE EXCEPTION 'Cannot message yourself'; END IF;

  IF NOT public.is_admin(_me) AND NOT EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.status = 'accepted'
      AND ((c.requester_id = _me AND c.recipient_id = _other_user)
        OR (c.recipient_id = _me AND c.requester_id = _other_user))
  ) THEN
    RAISE EXCEPTION 'You can only message users you are connected with.';
  END IF;

  IF _me < _other_user THEN _a := _me; _b := _other_user;
  ELSE _a := _other_user; _b := _me; END IF;

  SELECT id INTO _id FROM public.conversations WHERE participant_a = _a AND participant_b = _b;
  IF _id IS NULL THEN
    INSERT INTO public.conversations (participant_a, participant_b) VALUES (_a, _b) RETURNING id INTO _id;
  END IF;
  RETURN _id;
END;
$$;

-- (b) the real backstop: messages INSERT now requires an accepted connection
DROP POLICY IF EXISTS "Sender inserts message (approved)" ON public.messages;
DROP POLICY IF EXISTS "Sender inserts message" ON public.messages;
CREATE POLICY "Sender inserts message (approved + connected)" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (public.is_admin(auth.uid()) OR public.is_approved(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
      AND (
        public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.connections cn
          WHERE cn.status = 'accepted'
            AND ((cn.requester_id = c.participant_a AND cn.recipient_id = c.participant_b)
              OR (cn.requester_id = c.participant_b AND cn.recipient_id = c.participant_a))
        )
      )
  )
);


-- ============================================================================
-- VERIFICATION (run these AFTER the batch above)
-- ============================================================================
-- C1: confirm a metadata role of 'admin' is clamped. In the app, try signing up
--     a throwaway account with role:"admin" in options.data, then run:
--       SELECT role FROM public.user_roles WHERE user_id = '<that-user>';
--     Expect 'professional', NOT 'admin'. And:
--       SELECT approval_status FROM public.profiles WHERE id = '<that-user>';
--     Expect 'pending'.
--
-- C2: as a NEW non-admin user, fill the profile (name + bio + role fields) and
--     save. It must succeed with NO "Not allowed to change privileged profile
--     columns" error, and:
--       SELECT trust_tier, profile_completeness FROM public.profiles WHERE id = auth.uid();
--     should advance to 'active' once completeness crosses the threshold.
--
-- H1: as a non-admin with NO accepted connection to user X, open X's profile and
--     hit Message. Expect the error "You can only message users you are connected
--     with." After X accepts a connection, messaging should work.
-- ============================================================================