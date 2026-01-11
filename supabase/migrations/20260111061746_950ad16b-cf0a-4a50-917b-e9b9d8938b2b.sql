
-- Create app_role enum for secure role management
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- TABLE: user_roles (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
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

-- TABLE 6: user_profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 300),
  primary_neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  email_daily_digest BOOLEAN DEFAULT true,
  email_weekly_newsletter BOOLEAN DEFAULT true,
  email_breaking_news BOOLEAN DEFAULT false,
  reputation_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Also assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Profile updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- TABLE 7: comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'event', 'business')),
  content_id UUID NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_comments_content ON public.comments(content_type, content_id);
CREATE INDEX idx_comments_author ON public.comments(author_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- TABLE 8: user_saved_items
CREATE TABLE public.user_saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('article', 'event', 'business')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE public.user_saved_items ENABLE ROW LEVEL SECURITY;

-- TABLE 9: votes
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voteable_type TEXT NOT NULL CHECK (voteable_type IN ('article', 'comment')),
  voteable_id UUID NOT NULL,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (1, -1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, voteable_type, voteable_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- TABLE 10: newsletter_subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  daily_digest BOOLEAN DEFAULT true,
  weekly_newsletter BOOLEAN DEFAULT true,
  breaking_news BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'unsubscribed')),
  verification_token TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- user_roles: Only admins can manage, users can read their own
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- user_profiles: Anyone can read, users update own
CREATE POLICY "Anyone can view profiles"
ON public.user_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- comments: Public read active, auth insert, users manage own
CREATE POLICY "Anyone can view active comments"
ON public.comments FOR SELECT
USING (status = 'active');

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- user_saved_items: Users access own only
CREATE POLICY "Users can view own saved items"
ON public.user_saved_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can save items"
ON public.user_saved_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove saved items"
ON public.user_saved_items FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- votes: Users access own only
CREATE POLICY "Users can view own votes"
ON public.votes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create votes"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own votes"
ON public.votes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own votes"
ON public.votes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- newsletter_subscribers: Users access own by user_id
CREATE POLICY "Users can view own subscription"
ON public.newsletter_subscribers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own subscription"
ON public.newsletter_subscribers FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
