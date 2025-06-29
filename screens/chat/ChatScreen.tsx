import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getConversations, subscribeToMessages, type Conversation, sendGroupMessage, getGroupMessages } from '../../services/messagesService';
import { createGroup, getUserGroups, getGroupMembers } from '../../services/groupsService';
import { useAuth } from '../../contexts/AuthContext';
import IndividualChatScreen from './IndividualChatScreen';

interface ChatScreenProps {
  onChatPress?: (friendId: string, friendName: string) => void;
}

export default function ChatScreen({ onChatPress }: ChatScreenProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{ friendId: string; friendName: string } | null>(null);

  useEffect(() => {
    loadConversations();
    
    // Subscribe to new messages for real-time updates
    let subscription: any;
    if (user?.id) {
      subscription = subscribeToMessages(user.id, () => {
        // Reload conversations when new message arrives
        loadConversations();
      });
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user]);

  const loadConversations = async () => {
    try {
      const convos = await getConversations();
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleChatPress = (friendId: string, friendName: string) => {
    setSelectedChat({ friendId, friendName });
    // Also call the prop function if provided
    onChatPress?.(friendId, friendName);
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
    // Reload conversations to update read status
    loadConversations();
  };



  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getMessagePreview = (conversation: Conversation): string => {
    const message = conversation.last_message;
    if (!message) return 'No messages yet';
    
    if (message.message_type === 'image') return '📸 Photo';
    if (message.message_type === 'video') return '🎥 Video';
    
    return message.content || 'Media message';
  };

  const renderConversation = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.friend_id}
      style={[
        styles.chatItem,
        conversation.unread_count > 0 && styles.unreadChatItem
      ]}
      onPress={() => handleChatPress(conversation.friend_id, conversation.friend_name)}
    >
      <View style={styles.chatAvatar}>
        <Text style={styles.avatarText}>
          {conversation.friend_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[
            styles.chatName,
            conversation.unread_count > 0 && styles.unreadChatName
          ]}>
            {conversation.friend_name}
          </Text>
          {conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.chatPreview,
          conversation.unread_count > 0 && styles.unreadChatPreview
        ]}>
          {getMessagePreview(conversation)}
        </Text>
      </View>

      <View style={styles.chatMeta}>
        <Text style={styles.chatTime}>
          {formatTime(conversation.updated_at)}
        </Text>
        {conversation.last_message?.message_type !== 'text' && (
          <Ionicons 
            name={conversation.last_message?.message_type === 'image' ? 'camera' : 'videocam'} 
            size={12} 
            color="#E10600" 
            style={styles.mediaIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  // Show individual chat if selected
  if (selectedChat) {
    return (
      <IndividualChatScreen
        friendId={selectedChat.friendId}
        friendName={selectedChat.friendName}
        onBack={handleBackFromChat}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Chats</Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#E10600']}
            tintColor="#E10600"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : conversations.length > 0 ? (
          <View style={styles.chatList}>
            <Text style={styles.sectionTitle}>
              Recent Conversations ({conversations.length})
            </Text>
            {conversations.map(renderConversation)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Add friends and start sending photos{'\n'}
              to see conversations here!
            </Text>
            <Text style={styles.emptyHint}>
              📸 Go to Camera → Capture → Send to friends
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151E', // Racing Black
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E10600',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E10600', // F1 Red
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  chatList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E10600',
    marginBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(225, 6, 0, 0.3)',
  },
  unreadChatItem: {
    borderLeftColor: '#E10600',
    backgroundColor: '#252532',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  unreadChatName: {
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#E10600',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  chatPreview: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  unreadChatPreview: {
    fontWeight: '500',
    opacity: 0.9,
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: 12,
    color: '#E10600',
    fontWeight: '500',
  },
  mediaIcon: {
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  emptyHint: {
    fontSize: 14,
    color: '#E10600',
    fontWeight: '500',
    textAlign: 'center',
  },
}); 