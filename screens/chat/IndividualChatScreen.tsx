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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { 
  getMessagesWithFriend, 
  markMessageAsRead, 
  deleteMessage,
  isMessageExpired,
  sendMessage,
  type Message 
} from '../../services/messagesService';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper function to get time since message was sent
const getTimeSinceSent = (createdAt: string): string => {
  const now = new Date();
  const sentTime = new Date(createdAt);
  const diffMs = now.getTime() - sentTime.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  } else {
    return 'Just now';
  }
};

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
  const flatListRef = useRef<FlatList>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingText, setSendingText] = useState(false);

  // Animation for tap-to-view
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Video player for full-screen viewing
  const videoPlayer = useVideoPlayer(
    viewingMessage?.message_type === 'video' ? viewingMessage.media_url : null, 
    player => {
      player.loop = true;
      player.muted = false;
      if (viewingMessage?.message_type === 'video') {
        player.play();
      }
    }
  );

  useEffect(() => {
    loadMessages();
  }, [friendId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({
            animated: true,
          });
        }
      }, 100);
    }
  }, [messages.length, loading]);

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
      
      // Filter out expired messages and sort by creation time (oldest first, no inversion needed)
      const validMessages = messagesList
        .filter(msg => !isMessageExpired(msg))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Mark unread text messages as read (since they don't need "tap to view")
      const unreadTextMessages = validMessages.filter(msg => 
        msg.recipient_id === user?.id && 
        !msg.read_at && 
        msg.message_type === 'text'
      );
      
      // Mark all unread text messages as read
      await Promise.all(
        unreadTextMessages.map(msg => markMessageAsRead(msg.id))
      );
      
      setMessages(validMessages);
      
      // Auto-scroll to bottom (latest messages) after messages load
      setTimeout(() => {
        if (flatListRef.current && validMessages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 200);
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
        await loadMessages();
      } catch (error) {
        console.error('Error deleting viewed message:', error);
      }
    }
  };

  const handleSendTextMessage = async () => {
    if (!messageText.trim() || sendingText) return;

    setSendingText(true);
    try {
      const success = await sendMessage(
        friendId,
        messageText.trim(),
        null, // no media URL for text messages
        'text',
        24 // expires in 24 hours
      );

      if (success) {
        setMessageText(''); // Clear input
        // Reload messages to show the new one
        await loadMessages();
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSendingText(false);
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
        
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {getTimeSinceSent(item.created_at)}
          </Text>
          {/* Read Receipt Indicators - Only show on sent messages */}
          {isFromMe && (
            <View style={styles.readReceiptContainer}>
              {item.read_at ? (
                // Double checkmark for read messages (white)
                <View style={styles.readReceiptRead}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" style={styles.secondCheckmark} />
                </View>
              ) : (
                // Single checkmark for delivered messages (white, slightly transparent)
                <View style={styles.readReceiptDelivered}>
                  <Ionicons name="checkmark" size={12} color="rgba(255, 255, 255, 0.6)" />
                </View>
              )}
            </View>
          )}
        </View>
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
            viewingMessage.message_type === 'video' ? (
              <VideoView
                style={styles.fullScreenImage}
                player={videoPlayer}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
              />
            ) : (
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
            )
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No media available</Text>
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          // Auto-scroll to bottom when content changes
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        onLayout={() => {
          // Auto-scroll to bottom on initial layout
          if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }
        }}
      />

      {/* Empty state */}
      {!loading && messages.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Send a message or photo to start chatting!
          </Text>
        </View>
      )}

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sendingText) && styles.sendButtonDisabled
          ]}
          onPress={handleSendTextMessage}
          disabled={!messageText.trim() || sendingText}
        >
          <Ionicons 
            name={sendingText ? 'hourglass' : 'send'} 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  // Text input styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E1E28',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#15151E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  // Read receipt styles
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  readReceiptContainer: {
    marginLeft: 8,
  },
  readReceiptRead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readReceiptDelivered: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondCheckmark: {
    marginLeft: -6, // Overlap the checkmarks slightly
  },
}); 