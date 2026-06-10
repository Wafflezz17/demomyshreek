
-- 1. Enum
DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3. Grandfather existing users + ensure admins approved
UPDATE public.profiles SET approval_status = 'approved', approved_at = COALESCE(approved_at, now())
  WHERE approval_status = 'pending';

UPDATE public.profiles p SET approval_status = 'approved', approved_at = COALESCE(approved_at, now())
  WHERE public.is_admin(p.id) AND approval_status <> 'approved';

-- 4. handle_new_user — keep default pending (new users start pending); admins explicit
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
  _approval public.approval_status;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'professional');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  _email_verified := NEW.email_confirmed_at IS NOT NULL;
  _approval := CASE WHEN _role = 'admin' THEN 'approved'::public.approval_status ELSE 'pending'::public.approval_status END;
  INSERT INTO public.profiles (id, full_name, role, email_verified, approval_status, approved_at)
    VALUES (NEW.id, _full_name, _role, _email_verified, _approval,
            CASE WHEN _approval='approved' THEN now() ELSE NULL END)
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

-- 5. is_approved helper (SECURITY DEFINER, lock down)
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND (approval_status = 'approved' OR public.is_admin(_user_id))
  )
$function$;

REVOKE EXECUTE ON FUNCTION public.is_approved(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated, service_role;

-- 6. Admin can update profiles (for approve/reject)
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7. Update RLS policies to require approved (or admin)

-- Opportunities: replace publish policy
DROP POLICY IF EXISTS "Owner can publish (active/verified)" ON public.opportunities;
CREATE POLICY "Owner can publish (approved + active/verified)" ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (
    (owner_id = auth.uid())
    AND (
      public.is_admin(auth.uid())
      OR (
        public.is_approved(auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.trust_tier IN ('active','verified')
        )
      )
    )
  );

-- Connections: replace requester create policy
DROP POLICY IF EXISTS "Requester creates connection (active/verified)" ON public.connections;
CREATE POLICY "Requester creates connection (approved + active/verified)" ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (
    (requester_id = auth.uid())
    AND (
      public.is_admin(auth.uid())
      OR (
        public.is_approved(auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.trust_tier IN ('active','verified')
        )
      )
    )
  );

-- Messages: replace sender insert policy
DROP POLICY IF EXISTS "Sender inserts message" ON public.messages;
CREATE POLICY "Sender inserts message (approved)" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = sender_id)
    AND (public.is_admin(auth.uid()) OR public.is_approved(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
    )
  );
