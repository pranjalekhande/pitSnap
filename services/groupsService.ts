import { supabase } from '../lib/supabase';
import type { User } from './friendsService';

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  // Joined data
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  members?: User[];
  member_count?: number;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  user?: User;
}

// Create a new group
export const createGroup = async (name: string, memberIds: string[]): Promise<Group | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Start transaction: create group first
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name,
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError) {
    console.error('Error creating group:', groupError);
    return null;
  }

  // Add creator as member
  const allMemberIds = [user.id, ...memberIds];
  const memberInserts = allMemberIds.map(memberId => ({
    group_id: group.id,
    user_id: memberId,
  }));

  const { error: membersError } = await supabase
    .from('group_members')
    .insert(memberInserts);

  if (membersError) {
    console.error('Error adding group members:', membersError);
    // Could rollback group creation here, but keeping it simple for now
  }

  return group;
};

// Get all groups for current user (simplified to avoid recursion)
export const getUserGroups = async (): Promise<Group[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // First, get groups where user is a member
  const { data: memberGroups, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  if (memberError) {
    console.error('Error getting user group memberships:', memberError);
    return [];
  }

  if (!memberGroups || memberGroups.length === 0) {
    return [];
  }

  const groupIds = memberGroups.map(gm => gm.group_id);

  // Then get the group details
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      creator:users!groups_created_by_fkey(id, display_name, avatar_url)
    `)
    .in('id', groupIds);

  if (error) {
    console.error('Error getting user groups:', error);
    return [];
  }

  // Get member count for each group separately to avoid recursion
  const groupsWithCounts = await Promise.all(
    (groups || []).map(async (group) => {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      return {
        ...group,
        member_count: count || 0,
      };
    })
  );

  return groupsWithCounts;
};

// Get group members
export const getGroupMembers = async (groupId: string): Promise<User[]> => {
  const { data: members, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      users(id, display_name, avatar_url, email)
    `)
    .eq('group_id', groupId);

  if (error) {
    console.error('Error getting group members:', error);
    return [];
  }

  return (members || []).map((member: any) => member.users);
};

// Add member to group
export const addGroupMember = async (groupId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
    });

  if (error) {
    console.error('Error adding group member:', error);
    return false;
  }

  return true;
};

// Remove member from group
export const removeGroupMember = async (groupId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing group member:', error);
    return false;
  }

  return true;
};

// Leave group (remove self)
export const leaveGroup = async (groupId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  return removeGroupMember(groupId, user.id);
};

// Check if user is member of group
export const isGroupMember = async (groupId: string, userId?: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  const checkUserId = userId || user?.id;
  
  if (!checkUserId) return false;

  const { data, error } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', checkUserId)
    .single();

  return !error && !!data;
}; 