-- EMERGENCY FIX: Restore Individual Chat + Fix Group Chat
-- This will restore your working individual messaging and fix group policies

-- 1. FIRST: Restore original messages policies (individual chat)
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;

-- Restore ORIGINAL individual message policies (these worked before)
CREATE POLICY "Users can view own messages" ON messages FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

CREATE POLICY "Users can insert own messages" ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 2. Add separate GROUP message policies (don't interfere with individual)
CREATE POLICY "Users can view group messages" ON messages FOR SELECT
USING (
  group_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert group messages" ON messages FOR INSERT
WITH CHECK (
  group_id IS NOT NULL AND 
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid()
  )
);

-- 3. Fix group policies (remove infinite recursion)
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can add members" ON group_members;
DROP POLICY IF EXISTS "Users can view groups they created or are members of" ON groups;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Group creators and members can add members" ON group_members;

-- Simple, working group policies
CREATE POLICY "Users can view groups they created" ON groups FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can create groups" ON groups FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their own group memberships" ON group_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Group creators can view all group members" ON group_members FOR SELECT
USING (
  EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND created_by = auth.uid())
);

CREATE POLICY "Group creators can add members" ON group_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND created_by = auth.uid())
);

CREATE POLICY "Users can leave groups" ON group_members FOR DELETE
USING (user_id = auth.uid());

-- 4. Ensure messages policies work for both individual AND group
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can view group messages" ON messages;

-- COMBINED policy that handles BOTH individual and group messages
CREATE POLICY "Users can view all their messages" ON messages FOR SELECT
USING (
  -- Individual messages (original functionality)
  (group_id IS NULL AND (auth.uid() = sender_id OR auth.uid() = recipient_id))
  OR
  -- Group messages (new functionality)
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert group messages" ON messages;

-- COMBINED policy for inserting messages
CREATE POLICY "Users can send all their messages" ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    -- Individual messages (original functionality)
    (group_id IS NULL AND recipient_id IS NOT NULL)
    OR
    -- Group messages (new functionality)  
    (group_id IS NOT NULL AND recipient_id IS NULL AND EXISTS (
      SELECT 1 FROM group_members gm 
      WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid()
    ))
  )
);

-- This should restore individual chat AND enable group chat without conflicts 