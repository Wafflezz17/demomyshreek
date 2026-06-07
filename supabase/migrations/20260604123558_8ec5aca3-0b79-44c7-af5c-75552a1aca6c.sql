
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('founder', 'professional', 'investor', 'admin');
CREATE TYPE public.startup_stage AS ENUM ('idea', 'mvp', 'early', 'growth');
CREATE TYPE public.experience_level AS ENUM ('junior', 'mid', 'senior', 'expert');
CREATE TYPE public.availability_type AS ENUM ('full_time', 'part_time', 'contract', 'advisor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles are viewable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Updated-at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles (shared)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  bio TEXT,
  contact_email TEXT,
  role public.app_role NOT NULL DEFAULT 'professional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Founder details
CREATE TABLE public.founder_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_name TEXT,
  startup_description TEXT,
  industry TEXT,
  stage public.startup_stage,
  funding_required NUMERIC,
  funding_status TEXT,
  team_size INTEGER,
  equity_offered TEXT,
  skills_needed TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.founder_details TO authenticated;
GRANT ALL ON public.founder_details TO service_role;
ALTER TABLE public.founder_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founder details viewable" ON public.founder_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner upserts founder" ON public.founder_details FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER founder_updated BEFORE UPDATE ON public.founder_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Professional details
CREATE TABLE public.professional_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  experience_level public.experience_level,
  portfolio_links TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  availability public.availability_type,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.professional_details TO authenticated;
GRANT ALL ON public.professional_details TO service_role;
ALTER TABLE public.professional_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro details viewable" ON public.professional_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner upserts pro" ON public.professional_details FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pro_updated BEFORE UPDATE ON public.professional_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Investor details
CREATE TABLE public.investor_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_interests TEXT,
  preferred_industries TEXT[] DEFAULT '{}',
  investment_range_min NUMERIC,
  investment_range_max NUMERIC,
  preferred_stages public.startup_stage[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investor_details TO authenticated;
GRANT ALL ON public.investor_details TO service_role;
ALTER TABLE public.investor_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investor details viewable" ON public.investor_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner upserts investor" ON public.investor_details FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER investor_updated BEFORE UPDATE ON public.investor_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversations + Messages
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (participant_a < participant_b),
  UNIQUE (participant_a, participant_b)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conv participants view" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "Conv participants insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "Conv participants update" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages viewable by conv participants" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)));
CREATE POLICY "Sender inserts message" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)));
CREATE POLICY "Recipient marks read" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications view" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- New user trigger: profile + role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _full_name TEXT;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'professional');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, full_name, contact_email, role)
  VALUES (NEW.id, _full_name, NEW.email, _role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;
  IF _role = 'founder' THEN INSERT INTO public.founder_details (user_id) VALUES (NEW.id);
  ELSIF _role = 'investor' THEN INSERT INTO public.investor_details (user_id) VALUES (NEW.id);
  ELSE INSERT INTO public.professional_details (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: get or create a conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_other_user UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me UUID := auth.uid();
  _a UUID; _b UUID; _id UUID;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _me = _other_user THEN RAISE EXCEPTION 'Cannot message yourself'; END IF;
  IF _me < _other_user THEN _a := _me; _b := _other_user;
  ELSE _a := _other_user; _b := _me; END IF;
  SELECT id INTO _id FROM public.conversations WHERE participant_a = _a AND participant_b = _b;
  IF _id IS NULL THEN
    INSERT INTO public.conversations (participant_a, participant_b) VALUES (_a, _b) RETURNING id INTO _id;
  END IF;
  RETURN _id;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
