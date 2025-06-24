-- PitSnap Enhanced F1 Database Schema for Supabase
-- Building on your existing schema with F1-specific features
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES (Your existing schema - enhanced)
-- ============================================================================

-- Users table (enhanced with F1 preferences)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  -- F1 Specific Fields
  favorite_team TEXT CHECK (favorite_team IN ('red_bull', 'mercedes', 'ferrari', 'mclaren', 'alpine', 'aston_martin', 'williams', 'alphatauri', 'alfa_romeo', 'haas')),
  favorite_driver TEXT,
  timezone TEXT DEFAULT 'UTC',
  country_code TEXT,
  race_weekend_notifications BOOLEAN DEFAULT true,
  -- Existing fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (your existing - perfect as is)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice')),
  expires_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  -- F1 Context
  f1_context JSONB, -- race data, driver mentions, lap times
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends table (your existing - enhanced)
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  -- F1 matching context
  matched_via TEXT CHECK (matched_via IN ('team', 'driver', 'location', 'manual', 'qr_code')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ============================================================================
-- F1-SPECIFIC TABLES (New additions)
-- ============================================================================

-- Stories table for ephemeral content
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  -- F1 Context
  f1_data JSONB, -- race context, timing data, location
  ar_filter_used TEXT, -- which AR filter was applied
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story views tracking
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Group chats for F1 teams/topics
CREATE TABLE chat_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT DEFAULT 'general' CHECK (group_type IN ('team', 'race', 'general', 'track')),
  team_focus TEXT, -- specific F1 team
  race_focus TEXT, -- specific race weekend
  is_public BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 50,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group chat members
CREATE TABLE chat_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group messages
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice')),
  f1_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AR filter usage tracking
CREATE TABLE ar_filter_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  filter_name TEXT NOT NULL,
  filter_category TEXT CHECK (filter_category IN ('helmet', 'celebration', 'track', 'team', 'flag')),
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, filter_name)
);

-- User preferences and interests
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  -- Theme preferences
  theme_team TEXT,
  dark_mode BOOLEAN DEFAULT false,
  -- Privacy settings
  profile_visibility TEXT DEFAULT 'friends' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  story_visibility TEXT DEFAULT 'friends' CHECK (story_visibility IN ('public', 'friends', 'private')),
  -- Notification preferences
  race_notifications BOOLEAN DEFAULT true,
  friend_activity BOOLEAN DEFAULT true,
  group_messages BOOLEAN DEFAULT true,
  -- F1 interests
  interested_teams TEXT[], -- array of team names
  interested_drivers TEXT[], -- array of driver names
  favorite_tracks TEXT[], -- array of track names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- F1 teams reference table
CREATE TABLE f1_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  logo_url TEXT
);

-- Insert F1 teams data
INSERT INTO f1_teams (id, name, full_name, primary_color, secondary_color) VALUES
('red_bull', 'Red Bull', 'Oracle Red Bull Racing', '#0600EF', '#DC143C'),
('mercedes', 'Mercedes', 'Mercedes-AMG Petronas F1 Team', '#00D2BE', '#000000'),
('ferrari', 'Ferrari', 'Scuderia Ferrari', '#DC143C', '#FFD700'),
('mclaren', 'McLaren', 'McLaren Formula 1 Team', '#FF8700', '#47C7FC'),
('alpine', 'Alpine', 'BWT Alpine F1 Team', '#0090FF', '#FF1493'),
('aston_martin', 'Aston Martin', 'Aston Martin Aramco Cognizant F1 Team', '#006F62', '#CEDC00'),
('williams', 'Williams', 'Williams Racing', '#005AFF', '#FFFFFF'),
('alphatauri', 'AlphaTauri', 'Scuderia AlphaTauri', '#2B4562', '#FFFFFF'),
('alfa_romeo', 'Alfa Romeo', 'Alfa Romeo F1 Team Stake', '#900000', '#FFFFFF'),
('haas', 'Haas', 'MoneyGram Haas F1 Team', '#FFFFFF', '#787878');

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Enhanced function to create user profile with F1 preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment AR filter usage
CREATE OR REPLACE FUNCTION increment_ar_filter_usage(
  p_user_id UUID,
  p_filter_name TEXT,
  p_filter_category TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ar_filter_usage (user_id, filter_name, filter_category, usage_count, last_used)
  VALUES (p_user_id, p_filter_name, p_filter_category, 1, NOW())
  ON CONFLICT (user_id, filter_name)
  DO UPDATE SET 
    usage_count = ar_filter_usage.usage_count + 1,
    last_used = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired stories and messages
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS INTEGER AS $$
DECLARE
  deleted_messages INTEGER;
  deleted_stories INTEGER;
BEGIN
  -- Clean expired messages
  DELETE FROM messages 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  GET DIAGNOSTICS deleted_messages = ROW_COUNT;
  
  -- Clean expired stories
  DELETE FROM stories 
  WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_stories = ROW_COUNT;
  
  RETURN deleted_messages + deleted_stories;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update story view count
CREATE OR REPLACE FUNCTION update_story_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories 
  SET view_count = view_count + 1 
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update story view count
CREATE TRIGGER on_story_view_added
  AFTER INSERT ON story_views
  FOR EACH ROW EXECUTE FUNCTION update_story_view_count();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core table indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);

-- F1-specific indexes
CREATE INDEX idx_users_favorite_team ON users(favorite_team);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX idx_chat_groups_team_focus ON chat_groups(team_focus);
CREATE INDEX idx_chat_groups_group_type ON chat_groups(group_type);
CREATE INDEX idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX idx_group_messages_created_at ON group_messages(created_at DESC);
CREATE INDEX idx_ar_filter_usage_user_id ON ar_filter_usage(user_id);
CREATE INDEX idx_ar_filter_usage_filter_name ON ar_filter_usage(filter_name);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_filter_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE f1_teams ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Friends policies
CREATE POLICY "Users can view own friends" ON friends
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

CREATE POLICY "Users can manage own friend requests" ON friends
  FOR ALL USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Stories policies
CREATE POLICY "Users can view friends stories" ON stories
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (user_id = stories.user_id AND friend_id = auth.uid() AND status = 'accepted')
         OR (friend_id = stories.user_id AND user_id = auth.uid() AND status = 'accepted')
    )
  );

CREATE POLICY "Users can insert own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can view story views" ON story_views
  FOR SELECT USING (
    auth.uid() = viewer_id OR
    EXISTS (SELECT 1 FROM stories WHERE id = story_views.story_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert story views" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- AR filter usage policies
CREATE POLICY "Users can view own AR usage" ON ar_filter_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own AR usage" ON ar_filter_usage
  FOR ALL USING (auth.uid() = user_id);

-- F1 teams policies (public read-only)
CREATE POLICY "Everyone can view F1 teams" ON f1_teams 
  FOR SELECT USING (true);

-- ============================================================================
-- STORAGE SETUP
-- ============================================================================

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('media', 'media', true),
  ('stories', 'stories', true),
  ('ar-filters', 'ar-filters', true),
  ('team-assets', 'team-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('media', 'stories') AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view all media" ON storage.objects
  FOR SELECT USING (bucket_id IN ('media', 'stories', 'ar-filters', 'team-assets'));

CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('media', 'stories') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Optional: Set up cron job for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-content', '0 * * * *', 'SELECT cleanup_expired_content();'); 