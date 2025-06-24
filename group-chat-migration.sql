-- Group Chat Migration - Minimal Changes
-- This extends your existing messages table and adds 2 simple tables

-- 1. Create simple groups table FIRST
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create group members table (simple many-to-many)
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 3. Add group_id column to existing messages table (AFTER groups table exists)
ALTER TABLE messages ADD COLUMN group_id UUID REFERENCES groups(id);

-- Add indexes for performance
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Enable RLS for new tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups policies (users can view groups they're members of)
CREATE POLICY "Users can view their groups" ON groups FOR SELECT
USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create groups" ON groups FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Group members policies
CREATE POLICY "Users can view group members of their groups" ON group_members FOR SELECT
USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Group creators can add members" ON group_members FOR INSERT
WITH CHECK (
  group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())
);

-- Update messages policies to include group messages
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id OR
  (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    recipient_id IS NOT NULL OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  )
);

-- How this works:
-- Individual messages: recipient_id is set, group_id is NULL (existing behavior)
-- Group messages: group_id is set, recipient_id is NULL (new behavior)
-- Same messages table handles both! 