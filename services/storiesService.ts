import { supabase } from '../lib/supabase';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  expires_at: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  viewers?: StoryView[];
  has_viewed?: boolean; // For current user
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface FriendWithStories {
  id: string;
  display_name: string;
  avatar_url?: string;
  stories: Story[];
  has_new_stories: boolean;
  total_stories: number;
}

// Create a new story
export const createStory = async (
  mediaUrl: string,
  mediaType: 'image' | 'video',
  caption?: string
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('stories')
    .insert({
      user_id: user.id,
      media_url: mediaUrl,
      media_type: mediaType,
      caption: caption?.trim() || null,
    });

  if (error) {
    console.error('Error creating story:', error);
    return false;
  }

  return true;
};

// Get stories from friends (for main stories feed)
export const getFriendsStories = async (): Promise<FriendWithStories[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all friends' stories that haven't expired
  const { data: storiesData, error } = await supabase
    .from('stories')
    .select(`
      *,
      user:users!stories_user_id_fkey(id, display_name, avatar_url),
      story_views(viewer_id)
    `)
    .gt('expires_at', new Date().toISOString())
    .neq('user_id', user.id) // Don't include own stories
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting friends stories:', error);
    return [];
  }

  // Get user's friends to filter stories
  const { data: friendsData } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted');

  const friendIds = new Set(
    friendsData?.map(friendship => 
      friendship.user_id === user.id ? friendship.friend_id : friendship.user_id
    ) || []
  );

  // Filter stories to only include friends' stories
  const friendStories = storiesData?.filter(story => 
    friendIds.has(story.user_id)
  ) || [];

  // Group stories by user
  const friendsMap = new Map<string, FriendWithStories>();

  friendStories.forEach(story => {
    const userId = story.user_id;
    const storyUser = story.user;
    
    if (!storyUser) return;

    // Check if current user has viewed this story
    const hasViewed = story.story_views?.some((view: any) => view.viewer_id === user.id) || false;

    if (!friendsMap.has(userId)) {
      friendsMap.set(userId, {
        id: userId,
        display_name: storyUser.display_name || 'Unknown',
        avatar_url: storyUser.avatar_url,
        stories: [],
        has_new_stories: false,
        total_stories: 0,
      });
    }

    const friend = friendsMap.get(userId)!;
    friend.stories.push({
      ...story,
      has_viewed: hasViewed,
    });
    friend.total_stories += 1;
    
    // If any story is unviewed, mark as having new stories
    if (!hasViewed) {
      friend.has_new_stories = true;
    }
  });

  return Array.from(friendsMap.values())
    .sort((a, b) => {
      // Sort by: new stories first, then by latest story time
      if (a.has_new_stories && !b.has_new_stories) return -1;
      if (!a.has_new_stories && b.has_new_stories) return 1;
      
      const aLatest = Math.max(...a.stories.map(s => new Date(s.created_at).getTime()));
      const bLatest = Math.max(...b.stories.map(s => new Date(s.created_at).getTime()));
      return bLatest - aLatest;
    });
};

// Get current user's own stories
export const getMyStories = async (): Promise<Story[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: stories, error } = await supabase
    .from('stories')
    .select(`
      *,
      user:users!stories_user_id_fkey(id, display_name, avatar_url)
    `)
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting my stories:', error);
    return [];
  }

  return stories || [];
};

// Mark a story as viewed by current user
export const viewStory = async (storyId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if already viewed (use maybeSingle to avoid error if not found)
  const { data: existing, error: checkError } = await supabase
    .from('story_views')
    .select('id')
    .eq('story_id', storyId)
    .eq('viewer_id', user.id)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking story view:', checkError);
    return false;
  }

  if (existing) {
    return true; // Already viewed, no need to record again
  }

  // Insert new view record
  const { error: viewError } = await supabase
    .from('story_views')
    .insert({
      story_id: storyId,
      viewer_id: user.id,
    });

  if (viewError) {
    console.error('Error recording story view:', viewError);
    return false;
  }

  // Update view count (only for new views)
  const { error: countError } = await supabase
    .rpc('increment_story_view_count', { story_id: storyId });

  if (countError) {
    console.error('Error updating story view count:', countError);
  }

  return true;
};

// Get viewers of a specific story (for story analytics)
export const getStoryViewers = async (storyId: string): Promise<StoryView[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // First check if this is user's own story
  const { data: story } = await supabase
    .from('stories')
    .select('user_id')
    .eq('id', storyId)
    .single();

  if (!story || story.user_id !== user.id) {
    return []; // Can only view analytics for own stories
  }

  const { data: viewers, error } = await supabase
    .from('story_views')
    .select(`
      *,
      viewer:users!story_views_viewer_id_fkey(id, display_name, avatar_url)
    `)
    .eq('story_id', storyId)
    .order('viewed_at', { ascending: false });

  if (error) {
    console.error('Error getting story viewers:', error);
    return [];
  }

  return viewers || [];
};

// Delete a story
export const deleteStory = async (storyId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId)
    .eq('user_id', user.id); // Can only delete own stories

  if (error) {
    console.error('Error deleting story:', error);
    return false;
  }

  return true;
};

// Clean up expired stories (should be run as a cron job)
export const cleanupExpiredStories = async (): Promise<number> => {
  const { error, count } = await supabase
    .from('stories')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error cleaning up expired stories:', error);
    return 0;
  }

  return count || 0;
};

// Subscribe to new stories for real-time updates
export const subscribeToStories = (
  onNewStory: (story: Story) => void
) => {
  // Create unique channel name to prevent subscription conflicts
  const channelName = `stories_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'stories',
      },
      (payload) => {
        onNewStory(payload.new as Story);
      }
    )
    .subscribe();
};

// Check if story has expired
export const isStoryExpired = (story: Story): boolean => {
  return new Date(story.expires_at) < new Date();
};

// Get time until story expires
export const getTimeUntilExpiry = (story: Story): string => {
  const expiryTime = new Date(story.expires_at);
  const now = new Date();
  const diffMs = expiryTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m left`;
  } else {
    return `${diffMinutes}m left`;
  }
}; 