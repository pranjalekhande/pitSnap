-- PitSnap Database Schema
-- Simple schema for Snapchat-style ephemeral social app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends table
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video')),
  expires_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories table
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

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
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

-- Trigger for auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Friends policies
CREATE POLICY "Users can view own friends" ON friends
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

CREATE POLICY "Users can manage own friend requests" ON friends
  FOR ALL USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

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

-- Add DELETE policy for one-view messages
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Stories policies - friends can view stories
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

-- Story views policies
CREATE POLICY "Users can view story views for own stories" ON story_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can record story views" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id); 