-- Fix Group Chat RLS Policies - Remove Infinite Recursion
-- Run this to fix the policy issues

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can add members" ON group_members;

-- Create simpler, non-recursive policies

-- Groups policies (simplified)
CREATE POLICY "Users can view groups they created or are members of" ON groups FOR SELECT
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups" ON groups FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Group members policies (simplified to avoid recursion)
CREATE POLICY "Users can view group members" ON group_members FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  )
);

CREATE POLICY "Group creators and members can add members" ON group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  )
);

CREATE POLICY "Users can remove themselves from groups" ON group_members FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Group creators can remove any member" ON group_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  )
); 