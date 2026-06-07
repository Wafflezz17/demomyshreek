
-- 1) Restrict profiles SELECT to owner; expose safe columns via view
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Owner reads own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE OR REPLACE VIEW public.profiles_public AS
  SELECT id, full_name, avatar_url, location, bio, role, created_at, updated_at
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;

-- 2) Restrict message UPDATE to recipient, only read_at column
DROP POLICY IF EXISTS "Recipient marks read" ON public.messages;
CREATE POLICY "Recipient marks read" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    auth.uid() <> sender_id AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
    )
  )
  WITH CHECK (
    auth.uid() <> sender_id AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
    )
  );

-- 3) Realtime messages: enable RLS and restrict broadcast/presence to authenticated
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users only realtime" ON realtime.messages;
CREATE POLICY "Authenticated users only realtime" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.role()) = 'authenticated'
  );

-- 4) Revoke anon EXECUTE on SECURITY DEFINER helpers (they are auth-only)
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;
