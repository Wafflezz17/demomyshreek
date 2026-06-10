
ALTER TABLE public.profiles DISABLE TRIGGER USER;
UPDATE public.profiles
SET role = 'admin', approval_status = 'approved', approved_at = COALESCE(approved_at, now())
WHERE id = 'e9e5f957-3024-47fd-8746-f66f9ee339b7';
ALTER TABLE public.profiles ENABLE TRIGGER USER;

INSERT INTO public.user_roles (user_id, role)
VALUES ('e9e5f957-3024-47fd-8746-f66f9ee339b7', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
