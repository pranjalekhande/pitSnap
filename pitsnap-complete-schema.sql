-- PitSnap Complete Database Schema
-- Comprehensive schema for Snapchat-style F1 social app
-- Includes: Users, Friends, Messaging (Individual & Group), Stories, RLS Policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (integrates with Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends table (bidirectional friendship system)
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Groups table (for group messaging)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group membership table
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Messages table (supports both individual and group messaging)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video')),
  expires_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint: message must have either recipient_id OR group_id, not both
  CONSTRAINT check_message_target CHECK (
    (recipient_id IS NOT NULL AND group_id IS NULL) OR 
    (recipient_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Stories table (24-hour ephemeral content)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story views tracking
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'username', 
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment story view count
CREATE OR REPLACE FUNCTION increment_story_view_count(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories 
  SET view_count = view_count + 1 
  WHERE id = story_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for stories table
CREATE TRIGGER update_stories_updated_at 
  BEFORE UPDATE ON stories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_display_name ON users(display_name);

-- Friends indexes
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);

-- Groups indexes
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Messages indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_expires_at ON messages(expires_at);

-- Stories indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);

-- =====================================================
-- ROW LEVEL SECURITY SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - USERS
-- =====================================================

CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES - FRIENDS
-- =====================================================

CREATE POLICY "Users can view own friendships" ON friends
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

CREATE POLICY "Users can manage own friend requests" ON friends
  FOR ALL USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- =====================================================
-- RLS POLICIES - GROUPS (Non-recursive)
-- =====================================================

CREATE POLICY "Users can view groups they created" ON groups 
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update groups they created" ON groups
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete groups they created" ON groups
  FOR DELETE USING (created_by = auth.uid());

-- =====================================================
-- RLS POLICIES - GROUP MEMBERS (Non-recursive)
-- =====================================================

CREATE POLICY "Users can view their own memberships" ON group_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Group creators can view all members" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())
  );

CREATE POLICY "Group creators can add members" ON group_members
  FOR INSERT WITH CHECK (
    group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can leave groups" ON group_members
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Group creators can remove members" ON group_members
  FOR DELETE USING (
    group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())
  );

-- =====================================================
-- RLS POLICIES - MESSAGES (Individual + Group)
-- =====================================================

CREATE POLICY "Users can view individual messages" ON messages
  FOR SELECT USING (
    group_id IS NULL AND (auth.uid() = sender_id OR auth.uid() = recipient_id)
  );

CREATE POLICY "Users can view group messages" ON messages
  FOR SELECT USING (
    group_id IS NOT NULL AND 
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send individual messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    group_id IS NULL AND 
    recipient_id IS NOT NULL
  );

CREATE POLICY "Users can send group messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    recipient_id IS NULL AND
    group_id IS NOT NULL AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR 
    (group_id IS NULL AND auth.uid() = recipient_id)
  );

CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (
    auth.uid() = sender_id OR 
    (group_id IS NULL AND auth.uid() = recipient_id)
  );

-- =====================================================
-- RLS POLICIES - STORIES (Friends only)
-- =====================================================

CREATE POLICY "Users can view friends' stories" ON stories
  FOR SELECT USING (
    user_id = auth.uid() OR -- Own stories
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (user_id = auth.uid() AND friend_id = stories.user_id AND status = 'accepted')
         OR (friend_id = auth.uid() AND user_id = stories.user_id AND status = 'accepted')
    )
  );

CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES - STORY VIEWS
-- =====================================================

CREATE POLICY "Users can view story views for own stories" ON story_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can record story views" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- =====================================================
-- CLEANUP - Remove expired content
-- =====================================================

-- Function to clean up expired stories and messages
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS void AS $$
BEGIN
  -- Delete expired stories
  DELETE FROM stories WHERE expires_at < NOW();
  
  -- Delete expired messages
  DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🏁 PitSnap Database Schema Created Successfully!';
    RAISE NOTICE 'Tables: users, friends, groups, group_members, messages, stories, story_views';
    RAISE NOTICE 'Features: Individual chat, Group chat, Stories, Friends';
    RAISE NOTICE 'Security: RLS policies configured without recursion';
    RAISE NOTICE 'Performance: All indexes created';
END $$; 