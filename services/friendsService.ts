import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  // Derived username from display_name
  username?: string;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  user?: User;
  friend?: User;
}

// Helper function to create username from display name
const createUsername = (displayName: string): string => {
  if (!displayName) return 'user';
  return displayName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15) || 'user';
};

// Search users by display name
export const searchUsers = async (query: string): Promise<User[]> => {
  if (query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('display_name', `%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  // Add derived usernames
  const usersWithUsernames = data?.map(user => ({
    ...user,
    username: createUsername(user.display_name)
  })) || [];

  return usersWithUsernames;
};

// Send a friend request
export const sendFriendRequest = async (friendId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if request already exists
  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .single();

  if (existing) {
    console.log('Friend request already exists');
    return false;
  }

  const { error } = await supabase
    .from('friends')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    });

  if (error) {
    console.error('Error sending friend request:', error);
    return false;
  }

  return true;
};

// Accept a friend request
export const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }

  return true;
};

// Decline a friend request
export const declineFriendRequest = async (requestId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', requestId);

  if (error) {
    console.error('Error declining friend request:', error);
    return false;
  }

  return true;
};

// Get pending friend requests (received)
export const getPendingRequests = async (): Promise<FriendRequest[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      user:users!friends_user_id_fkey(*)
    `)
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  if (error) {
    console.error('Error getting pending requests:', error);
    return [];
  }

  // Add derived usernames
  const requestsWithUsernames = data?.map(request => ({
    ...request,
    user: request.user ? {
      ...request.user,
      username: createUsername(request.user.display_name)
    } : undefined
  })) || [];

  return requestsWithUsernames;
};

// Get friends list
export const getFriends = async (): Promise<User[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      user:users!friends_user_id_fkey(*),
      friend:users!friends_friend_id_fkey(*)
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error getting friends:', error);
    return [];
  }

  // Extract friend data (not current user)
  const friends = data?.map(friendship => {
    if (friendship.user_id === user.id) {
      return friendship.friend;
    } else {
      return friendship.user;
    }
  }).filter(Boolean) || [];

  // Add derived usernames
  const friendsWithUsernames = friends.map(friend => ({
    ...friend,
    username: createUsername(friend.display_name)
  }));

  return friendsWithUsernames;
};

// Check friendship status with another user
export const getFriendshipStatus = async (userId: string): Promise<'none' | 'pending' | 'accepted' | 'blocked'> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'none';

  const { data } = await supabase
    .from('friends')
    .select('status')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
    .single();

  return data?.status || 'none';
};

// Remove friend
export const removeFriend = async (friendId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

  if (error) {
    console.error('Error removing friend:', error);
    return false;
  }

  return true;
}; 