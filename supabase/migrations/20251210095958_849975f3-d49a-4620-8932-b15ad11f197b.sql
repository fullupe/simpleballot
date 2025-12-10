-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create draws table for ballot sessions
CREATE TABLE public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 6,
  shuffle_map JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create selections table for participant choices
CREATE TABLE public.selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  participant_name TEXT NOT NULL,
  participant_session_id TEXT NOT NULL,
  selected_slot INTEGER NOT NULL CHECK (selected_slot >= 1 AND selected_slot <= 6),
  selection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (draw_id, selected_slot),
  UNIQUE (draw_id, participant_session_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selections ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profile policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Draws policies
CREATE POLICY "Anyone can view open draws"
ON public.draws FOR SELECT
USING (status = 'open' OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create draws"
ON public.draws FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their draws"
ON public.draws FOR UPDATE
USING (auth.uid() = created_by);

-- Selections policies (public read for realtime, controlled insert)
CREATE POLICY "Anyone can view selections for accessible draws"
ON public.selections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.draws 
    WHERE draws.id = selections.draw_id
  )
);

CREATE POLICY "Anyone can insert selections for open draws"
ON public.selections FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.draws 
    WHERE draws.id = draw_id AND draws.status = 'open'
  )
);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for selections
ALTER PUBLICATION supabase_realtime ADD TABLE public.selections;