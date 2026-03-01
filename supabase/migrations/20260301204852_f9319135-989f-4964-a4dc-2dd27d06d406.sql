
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'event_admin');

-- 2. Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  description TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Event styles table
CREATE TABLE public.event_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  primary_color TEXT,
  secondary_color TEXT,
  logo_url TEXT,
  background_image_url TEXT,
  watermark_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  original_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  caption TEXT,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 6. Event managers junction table
CREATE TABLE public.event_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

-- 7. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. Helper functions

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is event manager or admin
CREATE OR REPLACE FUNCTION public.is_event_manager_or_admin(_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.event_managers
    WHERE user_id = auth.uid() AND event_id = _event_id
  )
$$;

-- 9. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_styles_updated_at BEFORE UPDATE ON public.event_styles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Random slug generator
CREATE OR REPLACE FUNCTION public.generate_random_slug()
RETURNS TRIGGER AS $$
DECLARE
  new_slug TEXT;
  slug_exists BOOLEAN;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    LOOP
      new_slug := lower(substr(md5(random()::text), 1, 8));
      SELECT EXISTS (SELECT 1 FROM public.events WHERE slug = new_slug) INTO slug_exists;
      EXIT WHEN NOT slug_exists;
    END LOOP;
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_event_slug BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.generate_random_slug();

-- 12. Indexes
CREATE INDEX idx_photos_event_id ON public.photos(event_id);
CREATE INDEX idx_event_managers_user_id ON public.event_managers(user_id);
CREATE INDEX idx_event_managers_event_id ON public.event_managers(event_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_events_slug ON public.events(slug);

-- 13. RLS Policies

-- EVENTS
-- Public can read events (without seeing password_hash - handled by view)
CREATE POLICY "Anyone can read events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admins and managers can update events" ON public.events
  FOR UPDATE TO authenticated USING (public.is_event_manager_or_admin(id));

CREATE POLICY "Admins can delete events" ON public.events
  FOR DELETE TO authenticated USING (public.is_admin());

-- EVENT_STYLES
CREATE POLICY "Anyone can read event styles" ON public.event_styles
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert event styles" ON public.event_styles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admins and managers can update event styles" ON public.event_styles
  FOR UPDATE TO authenticated USING (public.is_event_manager_or_admin(event_id));

CREATE POLICY "Admins can delete event styles" ON public.event_styles
  FOR DELETE TO authenticated USING (public.is_admin());

-- PHOTOS
CREATE POLICY "Anyone can read visible photos" ON public.photos
  FOR SELECT USING (hidden = false OR public.is_event_manager_or_admin(event_id));

CREATE POLICY "Admins and managers can insert photos" ON public.photos
  FOR INSERT TO authenticated WITH CHECK (public.is_event_manager_or_admin(event_id));

CREATE POLICY "Admins and managers can update photos" ON public.photos
  FOR UPDATE TO authenticated USING (public.is_event_manager_or_admin(event_id));

CREATE POLICY "Admins and managers can delete photos" ON public.photos
  FOR DELETE TO authenticated USING (public.is_event_manager_or_admin(event_id));

-- USER_ROLES
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_admin());

-- EVENT_MANAGERS
CREATE POLICY "Users can read own assignments" ON public.event_managers
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage event managers" ON public.event_managers
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admins update event managers" ON public.event_managers
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins delete event managers" ON public.event_managers
  FOR DELETE TO authenticated USING (public.is_admin());

-- PROFILES
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 14. View to hide password_hash from public
CREATE VIEW public.events_public
WITH (security_invoker = on) AS
  SELECT id, name, slug, date, description,
    (password_hash IS NOT NULL) AS is_password_protected,
    created_at, updated_at
  FROM public.events;
