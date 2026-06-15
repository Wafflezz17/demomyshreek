SET session_replication_role = 'replica';
UPDATE public.profiles SET role='admin', approval_status='approved', approved_at=COALESCE(approved_at, now()) WHERE id='8bba5810-4214-435c-a57e-61ea7a6816ae';
SET session_replication_role = 'origin';
INSERT INTO public.user_roles (user_id, role) VALUES ('8bba5810-4214-435c-a57e-61ea7a6816ae','admin') ON CONFLICT (user_id, role) DO NOTHING;