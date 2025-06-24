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
  markMessageAsFirstViewed,
  type Message 
} from '../../services/messagesService';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const viewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingText, setSendingText] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [messages.length, loading]);

  useEffect(() => {
    return () => {
      if (viewTimeoutRef.current) {
        clearTimeout(viewTimeoutRef.current);
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const messagesList = await getMessagesWithFriend(friendId);
      
      const validMessages = messagesList
        .filter(msg => !isMessageExpired(msg))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const unreadTextMessages = validMessages.filter(msg => 
        msg.recipient_id === user?.id && 
        !msg.read_at && 
        msg.message_type === 'text'
      );
      
      await Promise.all(
        unreadTextMessages.map(msg => markMessageAsRead(msg.id))
      );
      
      setMessages(validMessages);
      
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

    // Check if message has already been viewed
    if (message.first_viewed_at) {
      Alert.alert('Opened', 'This message has already been viewed');
      return;
    }

    // Mark as viewed on first view
    await markMessageAsFirstViewed(message.id);

    if (message.recipient_id === user?.id && !message.read_at) {
      await markMessageAsRead(message.id);
    }

    setViewingMessage(message);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();

    viewTimeoutRef.current = setTimeout(() => {
      handleCloseView(message);
    }, 10000) as any;
  };

  const handleCloseView = async (message: Message) => {
    if (!viewingMessage) return;

    if (viewTimeoutRef.current) {
      clearTimeout(viewTimeoutRef.current);
    }

    Animated.spring(scaleAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start(() => {
      setViewingMessage(null);
    });

    // Refresh messages to show updated "opened" status
    await loadMessages();
  };

  const handleSendTextMessage = async () => {
    if (!messageText.trim() || sendingText) return;

    setSendingText(true);
    try {
      const success = await sendMessage(
        friendId,
        messageText.trim(),
        null,
        'text',
        24
      );

      if (success) {
        setMessageText('');
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

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: () => {},
    onPanResponderRelease: () => {
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
            disabled={isExpired || !!item.first_viewed_at}
          >
            <Ionicons 
              name={item.message_type === 'image' ? 'camera' : 'videocam'} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.mediaText}>
              {item.first_viewed_at 
                ? isFromMe 
                  ? `Sent ${item.message_type === 'image' ? 'Photo' : 'Video'}`
                  : 'Opened'
                : item.message_type === 'image' ? 'Photo' : 'Video'
              }
            </Text>
            {!item.read_at && !isFromMe && !item.first_viewed_at && (
              <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>
        )}
        
        <Text style={styles.messageTime}>
          {getTimeSinceSent(item.created_at)}
        </Text>
      </View>
    );
  };

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
              />
            )
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No media available</Text>
            </View>
          )}
          
          <View style={styles.viewInstructions}>
            <Text style={styles.instructionText}>
              👆 Tap and hold to view
            </Text>
            <Text style={styles.instructionSubtext}>
              Release to close
            </Text>
          </View>

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
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friendName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {!loading && messages.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Send a message or photo to start chatting!
          </Text>
        </View>
      )}

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
    marginRight: 32,
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
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
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
    fontWeight: '600',
    marginLeft: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF88',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageTime: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.7,
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
}); 