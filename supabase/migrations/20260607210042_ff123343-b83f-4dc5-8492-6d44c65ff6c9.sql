
-- ============ ENUMS ============
CREATE TYPE trust_tier AS ENUM ('registered','active','verified');
CREATE TYPE verification_status AS ENUM ('none','pending','verified','rejected');
CREATE TYPE user_status AS ENUM ('active','suspended','banned');
CREATE TYPE opportunity_stage AS ENUM ('idea','early','growth','established');
CREATE TYPE opportunity_type AS ENUM ('growth','strategic_partnership','funding_partner','expansion');
CREATE TYPE opportunity_status AS ENUM ('draft','live','paused','expired','removed');
CREATE TYPE opportunity_screening AS ENUM ('clear','flagged','under_review');
CREATE TYPE connection_status AS ENUM ('pending','accepted','declined','withdrawn');
CREATE TYPE saved_item_type AS ENUM ('opportunity','search');
CREATE TYPE verification_method AS ENUM ('linkedin','document','manual');
CREATE TYPE report_target AS ENUM ('opportunity','user','message');
CREATE TYPE report_status AS ENUM ('open','actioned','dismissed');
CREATE TYPE investor_type AS ENUM ('angel','strategic','company','operator_partner');
CREATE TYPE investor_visibility AS ENUM ('public','on_connection');
CREATE TYPE company_stage AS ENUM ('idea','early','growth','established');
CREATE TYPE seeking_type AS ENUM ('funding_partner','strategic_partner','both');

-- ============ PROFILES extensions ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS location_country TEXT,
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS trust_tier trust_tier NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS profile_completeness INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============ Helper: is_admin (needed by later policies) ============
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- ============ SECTORS reference ============
CREATE TABLE public.sectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.sectors TO anon, authenticated;
GRANT ALL ON public.sectors TO service_role;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sectors are public" ON public.sectors FOR SELECT USING (true);

INSERT INTO public.sectors (id, name, sort_order) VALUES
  ('fintech','Fintech',10),
  ('healthtech','HealthTech',20),
  ('edtech','EdTech',30),
  ('ecommerce','E-Commerce',40),
  ('saas','SaaS',50),
  ('logistics','Logistics & Mobility',60),
  ('proptech','PropTech',70),
  ('cleantech','CleanTech & Sustainability',80),
  ('foodbev','Food & Beverage',90),
  ('media','Media & Entertainment',100),
  ('manufacturing','Manufacturing',110),
  ('tourism','Tourism & Hospitality',120),
  ('agritech','AgriTech',130),
  ('retail','Retail',140),
  ('services','Professional Services',150),
  ('other','Other',999);

-- ============ OPPORTUNITIES (created before connections so connections can FK it) ============
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  sector_id TEXT REFERENCES public.sectors(id),
  stage opportunity_stage NOT NULL,
  opportunity_type opportunity_type NOT NULL,
  location_country TEXT,
  location_city TEXT,
  capital_band_min NUMERIC,
  capital_band_max NUMERIC,
  seeking seeking_type[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  status opportunity_status NOT NULL DEFAULT 'live',
  screening_status opportunity_screening NOT NULL DEFAULT 'clear',
  view_count INT NOT NULL DEFAULT 0,
  connection_request_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX opp_owner_idx ON public.opportunities(owner_id);
CREATE INDEX opp_status_idx ON public.opportunities(status);
CREATE INDEX opp_sector_idx ON public.opportunities(sector_id);
CREATE INDEX opp_created_idx ON public.opportunities(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT ON public.opportunities TO anon;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Live opportunities are public" ON public.opportunities FOR SELECT
  USING (status = 'live' AND screening_status <> 'under_review');
CREATE POLICY "Owner reads own opportunities" ON public.opportunities FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Admin reads all opportunities" ON public.opportunities FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Owner can publish (active/verified tier)" ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.trust_tier IN ('active','verified') AND p.role IN ('founder','admin'))
  );
CREATE POLICY "Owner updates opportunity" ON public.opportunities FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admin updates opportunity" ON public.opportunities FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Owner deletes opportunity" ON public.opportunities FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE TRIGGER opportunity_updated BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.opportunity_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image','document')),
  storage_path TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX opp_media_opp_idx ON public.opportunity_media(opportunity_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_media TO authenticated;
GRANT SELECT ON public.opportunity_media TO anon;
GRANT ALL ON public.opportunity_media TO service_role;
ALTER TABLE public.opportunity_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media follows opportunity visibility" ON public.opportunity_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND (o.status='live' AND o.screening_status<>'under_review' OR o.owner_id = auth.uid() OR public.is_admin(auth.uid()))));
CREATE POLICY "Owner manages opp media" ON public.opportunity_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.owner_id = auth.uid()));

-- ============ CONNECTIONS (now connections can FK opportunities) ============
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  status connection_status NOT NULL DEFAULT 'pending',
  intro_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CHECK (requester_id <> recipient_id)
);
CREATE INDEX conn_recipient_idx ON public.connections(recipient_id);
CREATE INDEX conn_requester_idx ON public.connections(requester_id);
CREATE INDEX conn_opp_idx ON public.connections(opportunity_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants and admin view connections" ON public.connections FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Requester creates connection (active/verified)" ON public.connections FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.trust_tier IN ('active','verified'))
  );
CREATE POLICY "Recipient or requester updates" ON public.connections FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR recipient_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR recipient_id = auth.uid());

-- Conversations -> link to connection
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL;

-- ============ ENTREPRENEUR / INVESTOR / EXPERT profiles ============
CREATE TABLE public.entrepreneur_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_stage company_stage,
  sector_id TEXT REFERENCES public.sectors(id),
  website TEXT,
  traction_summary TEXT,
  team_size INT,
  background_summary TEXT,
  industry_expertise TEXT[] NOT NULL DEFAULT '{}',
  seeking seeking_type[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrepreneur_profiles TO authenticated;
GRANT ALL ON public.entrepreneur_profiles TO service_role;
ALTER TABLE public.entrepreneur_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entrepreneur profiles viewable by auth" ON public.entrepreneur_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner upserts entrepreneur" ON public.entrepreneur_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER entrepreneur_updated BEFORE UPDATE ON public.entrepreneur_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.investor_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_type investor_type,
  focus_summary TEXT,
  preferred_sectors TEXT[] NOT NULL DEFAULT '{}',
  preferred_stages opportunity_stage[] NOT NULL DEFAULT '{}',
  ticket_min NUMERIC,
  ticket_max NUMERIC,
  geographies TEXT[] NOT NULL DEFAULT '{}',
  brings TEXT[] NOT NULL DEFAULT '{}',
  track_record_summary TEXT,
  profile_visibility investor_visibility NOT NULL DEFAULT 'public',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_profiles TO authenticated;
GRANT ALL ON public.investor_profiles TO service_role;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public investor profiles viewable by auth" ON public.investor_profiles FOR SELECT TO authenticated USING (
  profile_visibility = 'public' OR user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.connections c WHERE c.status='accepted' AND ((c.requester_id=auth.uid() AND c.recipient_id=user_id) OR (c.recipient_id=auth.uid() AND c.requester_id=user_id))
  )
);
CREATE POLICY "Owner upserts investor profile" ON public.investor_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER investor_profile_updated BEFORE UPDATE ON public.investor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.expert_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expertise_areas TEXT[] NOT NULL DEFAULT '{}',
  years_experience INT,
  engagement_types_sought TEXT[] NOT NULL DEFAULT '{}',
  past_roles_summary TEXT,
  availability TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expert_profiles TO authenticated;
GRANT ALL ON public.expert_profiles TO service_role;
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expert profiles viewable by auth" ON public.expert_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner upserts expert" ON public.expert_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER expert_updated BEFORE UPDATE ON public.expert_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SAVED ITEMS ============
CREATE TABLE public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type saved_item_type NOT NULL,
  reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, reference)
);
CREATE INDEX saved_user_idx ON public.saved_items(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_items TO authenticated;
GRANT ALL ON public.saved_items TO service_role;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved" ON public.saved_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ VERIFICATIONS ============
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method verification_method NOT NULL,
  evidence_path TEXT,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision verification_status NOT NULL DEFAULT 'pending',
  decision_notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX verif_user_idx ON public.verifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own verifications" ON public.verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Users submit own verification" ON public.verifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin updates verification" ON public.verifications FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type report_target NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  status report_status NOT NULL DEFAULT 'open',
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporter or admin reads reports" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Users create reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admin updates reports" ON public.reports FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ EVENTS (analytics) ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_user_idx ON public.events(user_id);
CREATE INDEX events_type_idx ON public.events(event_type);
GRANT SELECT, INSERT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users log own events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Admin reads events" ON public.events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============ Profile completeness helper ============
CREATE OR REPLACE FUNCTION public.recompute_profile_completeness(_user_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _score INT := 0;
  _p RECORD;
  _role app_role;
  _tier trust_tier;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id = _user_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  _role := _p.role;
  IF _p.full_name IS NOT NULL AND length(_p.full_name) > 1 THEN _score := _score + 15; END IF;
  IF _p.headline IS NOT NULL AND length(_p.headline) > 2 THEN _score := _score + 10; END IF;
  IF _p.bio IS NOT NULL AND length(_p.bio) > 30 THEN _score := _score + 15; END IF;
  IF _p.avatar_url IS NOT NULL THEN _score := _score + 10; END IF;
  IF _p.location_country IS NOT NULL THEN _score := _score + 5; END IF;
  IF _p.linkedin_url IS NOT NULL THEN _score := _score + 10; END IF;
  IF _role = 'founder' THEN
    IF EXISTS (SELECT 1 FROM public.entrepreneur_profiles ep WHERE ep.user_id=_user_id AND ep.company_name IS NOT NULL AND ep.sector_id IS NOT NULL AND ep.background_summary IS NOT NULL) THEN _score := _score + 25; END IF;
    IF EXISTS (SELECT 1 FROM public.entrepreneur_profiles ep WHERE ep.user_id=_user_id AND array_length(ep.industry_expertise,1) > 0) THEN _score := _score + 10; END IF;
  ELSIF _role = 'investor' THEN
    IF EXISTS (SELECT 1 FROM public.investor_profiles ip WHERE ip.user_id=_user_id AND ip.investor_type IS NOT NULL AND ip.focus_summary IS NOT NULL) THEN _score := _score + 20; END IF;
    IF EXISTS (SELECT 1 FROM public.investor_profiles ip WHERE ip.user_id=_user_id AND array_length(ip.preferred_sectors,1) > 0) THEN _score := _score + 15; END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM public.expert_profiles xp WHERE xp.user_id=_user_id AND array_length(xp.expertise_areas,1) > 0) THEN _score := _score + 25; END IF;
    IF EXISTS (SELECT 1 FROM public.expert_profiles xp WHERE xp.user_id=_user_id AND xp.past_roles_summary IS NOT NULL) THEN _score := _score + 10; END IF;
  END IF;
  IF _score > 100 THEN _score := 100; END IF;
  IF _p.verification_status = 'verified' THEN _tier := 'verified';
  ELSIF _score >= 60 THEN _tier := 'active';
  ELSE _tier := 'registered';
  END IF;
  UPDATE public.profiles SET profile_completeness = _score, trust_tier = _tier WHERE id = _user_id;
  RETURN _score;
END;
$$;

-- ============ Accept connection helper ============
CREATE OR REPLACE FUNCTION public.accept_connection(_connection_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _conn RECORD; _a UUID; _b UUID; _conv UUID;
BEGIN
  SELECT * INTO _conn FROM public.connections WHERE id = _connection_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _conn.recipient_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _conn.status <> 'pending' THEN RAISE EXCEPTION 'Not pending'; END IF;
  UPDATE public.connections SET status='accepted', responded_at=now() WHERE id=_connection_id;
  IF _conn.requester_id < _conn.recipient_id THEN _a := _conn.requester_id; _b := _conn.recipient_id;
  ELSE _a := _conn.recipient_id; _b := _conn.requester_id; END IF;
  SELECT id INTO _conv FROM public.conversations WHERE participant_a = _a AND participant_b = _b;
  IF _conv IS NULL THEN
    INSERT INTO public.conversations (participant_a, participant_b, connection_id) VALUES (_a, _b, _connection_id) RETURNING id INTO _conv;
  ELSE
    UPDATE public.conversations SET connection_id = _connection_id WHERE id = _conv;
  END IF;
  RETURN _conv;
END;
$$;

-- ============ Updated handle_new_user to seed extended profiles ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _full_name TEXT;
  _email_verified BOOL;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'professional');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  _email_verified := NEW.email_confirmed_at IS NOT NULL;
  INSERT INTO public.profiles (id, full_name, role, email_verified)
    VALUES (NEW.id, _full_name, _role, _email_verified)
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
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Backfill new-tier rows for existing users
INSERT INTO public.entrepreneur_profiles (user_id)
  SELECT p.id FROM public.profiles p WHERE p.role='founder' AND NOT EXISTS (SELECT 1 FROM public.entrepreneur_profiles e WHERE e.user_id=p.id);
INSERT INTO public.investor_profiles (user_id)
  SELECT p.id FROM public.profiles p WHERE p.role='investor' AND NOT EXISTS (SELECT 1 FROM public.investor_profiles e WHERE e.user_id=p.id);
INSERT INTO public.expert_profiles (user_id)
  SELECT p.id FROM public.profiles p WHERE p.role='professional' AND NOT EXISTS (SELECT 1 FROM public.expert_profiles e WHERE e.user_id=p.id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
