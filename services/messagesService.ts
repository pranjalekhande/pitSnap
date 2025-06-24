import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  media_url: string | null;
  message_type: 'text' | 'image' | 'video';
  expires_at: string | null;
  read_at: string | null;
  created_at: string;
  // Joined data
  sender?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  recipient?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  friend_id: string;
  friend_name: string;
  friend_avatar?: string;
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

// Send a message to a friend
export const sendMessage = async (
  recipientId: string,
  content: string | null,
  mediaUrl: string | null,
  messageType: 'text' | 'image' | 'video' = 'text',
  expiresInHours: number = 24
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Calculate expiration time
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      media_url: mediaUrl,
      message_type: messageType,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('Error sending message:', error);
    return false;
  }

  return true;
};

// Get conversations for current user
export const getConversations = async (): Promise<Conversation[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all messages where user is sender or recipient
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(id, display_name, avatar_url),
      recipient:users!messages_recipient_id_fkey(id, display_name, avatar_url)
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting conversations:', error);
    return [];
  }

  // Group messages by conversation (friend)
  const conversationsMap = new Map<string, Conversation>();

  messages?.forEach((message) => {
    // Determine who the friend is (not current user)
    const isSender = message.sender_id === user.id;
    const friend = isSender ? message.recipient : message.sender;
    const friendId = friend?.id;

    if (!friendId || !friend) return;

    const existing = conversationsMap.get(friendId);
    
    if (!existing || new Date(message.created_at) > new Date(existing.updated_at)) {
      // Count unread messages (messages sent to current user that haven't been read)
      const unreadCount = messages.filter(m => 
        m.recipient_id === user.id && 
        m.sender_id === friendId && 
        !m.read_at
      ).length;

      conversationsMap.set(friendId, {
        friend_id: friendId,
        friend_name: friend.display_name || 'Unknown',
        friend_avatar: friend.avatar_url,
        last_message: message,
        unread_count: unreadCount,
        updated_at: message.created_at,
      });
    }
  });

  return Array.from(conversationsMap.values())
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
};

// Get messages between current user and a specific friend
export const getMessagesWithFriend = async (friendId: string): Promise<Message[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(id, display_name, avatar_url),
      recipient:users!messages_recipient_id_fkey(id, display_name, avatar_url)
    `)
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting messages:', error);
    return [];
  }

  return messages || [];
};

// Mark a message as read
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) {
    console.error('Error marking message as read:', error);
    return false;
  }

  return true;
};

// Delete a message (for expiration or user deletion)
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }

  return true;
};

// Clean up expired messages
export const cleanupExpiredMessages = async (): Promise<number> => {
  const { error, count } = await supabase
    .from('messages')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error cleaning up expired messages:', error);
    return 0;
  }

  return count || 0;
};

// Subscribe to new messages for real-time updates
export const subscribeToMessages = (
  userId: string,
  onNewMessage: (message: Message) => void
) => {
  return supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();
};

// Check if message has expired
export const isMessageExpired = (message: Message): boolean => {
  if (!message.expires_at) return false;
  return new Date(message.expires_at) < new Date();
};

// Get time until message expires
export const getTimeUntilExpiry = (message: Message): string => {
  if (!message.expires_at) return 'Never';
  
  const expiryTime = new Date(message.expires_at);
  const now = new Date();
  const diffMs = expiryTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
}; 