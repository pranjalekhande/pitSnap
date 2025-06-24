import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Image,
  PanResponder,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { 
  getMessagesWithFriend, 
  markMessageAsRead, 
  deleteMessage,
  isMessageExpired,
  getTimeUntilExpiry,
  type Message 
} from '../../services/messagesService';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface IndividualChatScreenProps {
  friendId: string;
  friendName: string;
  onBack: () => void;
}

export default function IndividualChatScreen({ 
  friendId, 
  friendName, 
  onBack 
}: IndividualChatScreenProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null);
  const [viewStartTime, setViewStartTime] = useState<number>(0);
  const viewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation for tap-to-view
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMessages();
  }, [friendId]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (viewTimeoutRef.current) {
        clearTimeout(viewTimeoutRef.current);
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const messagesList = await getMessagesWithFriend(friendId);
      
      // Filter out expired messages
      const validMessages = messagesList.filter(msg => !isMessageExpired(msg));
      setMessages(validMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message: Message) => {
    if (message.message_type === 'text') return;
    if (isMessageExpired(message)) return;
    if (!message.media_url) {
      Alert.alert('Error', 'Media not available');
      return;
    }

    // Mark as read if it's received message
    if (message.recipient_id === user?.id && !message.read_at) {
      await markMessageAsRead(message.id);
    }

    setViewingMessage(message);
    setViewStartTime(Date.now());

    // Animate in
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();

    // Auto-close after 10 seconds (Snapchat style)
    viewTimeoutRef.current = setTimeout(() => {
      handleCloseView(message);
    }, 10000) as any;
  };

  const handleCloseView = async (message: Message) => {
    if (!viewingMessage) return;

    // Clear timeout
    if (viewTimeoutRef.current) {
      clearTimeout(viewTimeoutRef.current);
    }

    // Animate out
    Animated.spring(scaleAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start(() => {
      setViewingMessage(null);
    });

    // Delete message after viewing (Snapchat style)
    const viewDuration = Date.now() - viewStartTime;
    if (viewDuration > 1000) { // Only delete if viewed for more than 1 second
      try {
        await deleteMessage(message.id);
        // Reload messages to update UI
        loadMessages();
      } catch (error) {
        console.error('Error deleting viewed message:', error);
      }
    }
  };

  // Pan responder for press and hold
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: () => {
      // Press started - handled by onPress
    },
    onPanResponderRelease: () => {
      // Press ended
      if (viewingMessage) {
        handleCloseView(viewingMessage);
      }
    },
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const isFromMe = item.sender_id === user?.id;
    const isExpired = isMessageExpired(item);
    
    if (isExpired) return null;

    return (
      <View style={[
        styles.messageContainer,
        isFromMe ? styles.sentMessage : styles.receivedMessage
      ]}>
        {item.message_type === 'text' ? (
          <Text style={styles.messageText}>{item.content}</Text>
        ) : (
          <TouchableOpacity
            style={styles.mediaMessage}
            onPress={() => handleViewMessage(item)}
            disabled={isExpired}
          >
            <Ionicons 
              name={item.message_type === 'image' ? 'camera' : 'videocam'} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.mediaText}>
              {item.message_type === 'image' ? 'Photo' : 'Video'}
            </Text>
            {!item.read_at && !isFromMe && (
              <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>
        )}
        
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
          {item.expires_at && ` • ${getTimeUntilExpiry(item)}`}
        </Text>
      </View>
    );
  };

  // Snapchat-style full-screen media viewer
  if (viewingMessage) {
    return (
      <View style={styles.fullScreenViewer}>
        <StatusBar style="light" />
        <Animated.View 
          style={[
            styles.fullScreenContent,
            { transform: [{ scale: scaleAnim }] }
          ]}
          {...panResponder.panHandlers}
        >
          {viewingMessage.media_url ? (
            <Image 
              source={{ uri: viewingMessage.media_url }}
              style={styles.fullScreenImage}
              resizeMode="contain"
              onError={() => {
                console.error('❌ Image failed to load');
                Alert.alert('Error', 'Failed to load image');
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully');
              }}
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
          
          {/* Tap instructions */}
          <View style={styles.viewInstructions}>
            <Text style={styles.instructionText}>
              👆 Tap and hold to view
            </Text>
            <Text style={styles.instructionSubtext}>
              Release to close
            </Text>
          </View>

          {/* Sender info */}
          <View style={styles.senderInfo}>
            <Text style={styles.senderName}>
              {viewingMessage.sender_id === user?.id ? 'You' : friendName}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friendName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Empty state */}
      {!loading && messages.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Send a photo or video from the camera to start chatting!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E10600',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 32, // Offset for back button
  },
  headerSpacer: {
    width: 32,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E10600',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E28',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  mediaMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  mediaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E10600',
  },
  messageTime: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Full-screen viewer styles
  fullScreenViewer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
  viewInstructions: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
  },
  senderInfo: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  senderName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#FFFFFF',
    fontSize: 18,
    opacity: 0.7,
  },
}); 