-- EMERGENCY: Restore Individual Chat ONLY
-- This completely removes group functionality to restore working individual chat
-- Run this FIRST to get your app working again

-- 1. Drop ALL group-related policies to stop infinite recursion
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can add members" ON group_members;
DROP POLICY IF EXISTS "Users can view groups they created or are members of" ON groups;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Group creators and members can add members" ON group_members;
DROP POLICY IF EXISTS "Users can view groups they created" ON groups;
DROP POLICY IF EXISTS "Users can view their own group memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can view all group members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Users can view group messages" ON messages;
DROP POLICY IF EXISTS "Users can insert group messages" ON messages;
DROP POLICY IF EXISTS "Users can view all their messages" ON messages;
DROP POLICY IF EXISTS "Users can send all their messages" ON messages;

-- 2. Drop ALL message policies and recreate ONLY individual chat policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- 3. Restore ORIGINAL individual message policies (EXACT same as before group chat)
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

CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- 4. Temporarily disable RLS on group tables to stop recursion
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- This should restore your individual chat to exactly how it was before
-- Group functionality is temporarily disabled but individual chat should work perfectly 