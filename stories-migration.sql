-- Stories-Only Migration Script
-- Run this if you already have users, friends, and messages tables

-- Add missing column to messages table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'first_viewed_at') THEN
        ALTER TABLE messages ADD COLUMN first_viewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
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
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Trigger for stories table (only create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stories_updated_at') THEN
        CREATE TRIGGER update_stories_updated_at 
          BEFORE UPDATE ON stories 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to increment story view count
CREATE OR REPLACE FUNCTION increment_story_view_count(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories 
  SET view_count = view_count + 1 
  WHERE id = story_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Indexes for performance (only create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stories_user_id') THEN
        CREATE INDEX idx_stories_user_id ON stories(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stories_expires_at') THEN
        CREATE INDEX idx_stories_expires_at ON stories(expires_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stories_created_at') THEN
        CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_story_views_story_id') THEN
        CREATE INDEX idx_story_views_story_id ON story_views(story_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_story_views_viewer_id') THEN
        CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies - friends can view stories
DROP POLICY IF EXISTS "Users can view friends' stories" ON stories;
CREATE POLICY "Users can view friends' stories" ON stories
  FOR SELECT USING (
    user_id = auth.uid() OR -- Own stories
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (user_id = auth.uid() AND friend_id = stories.user_id AND status = 'accepted')
         OR (friend_id = auth.uid() AND user_id = stories.user_id AND status = 'accepted')
    )
  );

DROP POLICY IF EXISTS "Users can create own stories" ON stories;
CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stories" ON stories;
CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
DROP POLICY IF EXISTS "Users can view story views for own stories" ON story_views;
CREATE POLICY "Users can view story views for own stories" ON story_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can record story views" ON story_views;
CREATE POLICY "Users can record story views" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Stories migration completed successfully! ✅';
    RAISE NOTICE 'Added tables: stories, story_views';
    RAISE NOTICE 'Added function: increment_story_view_count()';
    RAISE NOTICE 'RLS policies configured for friend-only access';
END $$; 