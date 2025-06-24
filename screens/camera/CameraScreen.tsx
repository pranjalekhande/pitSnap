import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { getFriends, type User } from '../../services/friendsService';
import { sendMessage as sendMessageService } from '../../services/messagesService';
import { uploadMedia } from '../../services/mediaService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CapturedMedia {
  uri: string;
  type: 'photo' | 'video';
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);
  const [showFriendSelection, setShowFriendSelection] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Check permissions on component mount
  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Load friends when friend selection is shown
  useEffect(() => {
    if (showFriendSelection) {
      loadFriends();
    }
  }, [showFriendSelection]);

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo) {
        setCapturedMedia({ uri: photo.uri, type: 'photo' });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 10, // 10 seconds max like Snapchat
      });
      
      if (video) {
        setCapturedMedia({ uri: video.uri, type: 'video' });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.log('Error stopping recording:', error);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const handleDiscardMedia = () => {
    setCapturedMedia(null);
    setShowFriendSelection(false);
    setSelectedFriends(new Set());
  };

  const handleSendToFriends = () => {
    if (!capturedMedia) return;
    setShowFriendSelection(true);
  };

  const toggleFriendSelection = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSendMessages = async () => {
    if (!capturedMedia || selectedFriends.size === 0) return;

    setSending(true);
    
    try {
      // Upload media to Supabase Storage
      const uploadResult = await uploadMedia(
        capturedMedia.uri,
        'snap',
        capturedMedia.type === 'photo' ? 'image' : 'video'
      );

      if (!uploadResult.success || !uploadResult.publicUrl) {
        Alert.alert('Error', `Failed to upload ${capturedMedia.type}. Please try again.`);
        return;
      }

      // Send messages with the uploaded media URL
      const sendPromises = Array.from(selectedFriends).map(friendId =>
        sendMessageService(
          friendId,
          null, // no text content
          uploadResult.publicUrl!,
          capturedMedia.type === 'photo' ? 'image' : 'video',
          24 // expires in 24 hours
        )
      );

      await Promise.all(sendPromises);
      
      Alert.alert(
        'Sent!', 
        `${capturedMedia.type === 'photo' ? 'Photo' : 'Video'} sent to ${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''}!`,
        [{ text: 'OK', onPress: handleDiscardMedia }]
      );
    } catch (error) {
      console.error('Error sending messages:', error);
      Alert.alert('Error', 'Failed to send messages. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderFriend = ({ item }: { item: User }) => {
    const isSelected = selectedFriends.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.snapchatFriendItem, isSelected && styles.snapchatFriendSelected]}
        onPress={() => toggleFriendSelection(item.id)}
      >
        <View style={[styles.snapchatFriendAvatar, isSelected && styles.snapchatFriendAvatarSelected]}>
          <Text style={styles.snapchatFriendAvatarText}>
            {item.display_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.snapchatFriendName}>
          {item.display_name}
        </Text>
        {isSelected && (
          <View style={styles.snapchatSelectedCheck}>
            <Ionicons name="checkmark-circle" size={24} color="#E10600" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Handle permissions
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>📸 Camera Access Needed</Text>
        <Text style={styles.permissionSubtext}>
          PitSnap needs camera access to capture photos and videos
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show friend selection screen (NEW DESIGN)
  if (showFriendSelection && capturedMedia) {
    return (
      <View style={styles.friendSelectionContainer}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.friendSelectionHeader}>
          <TouchableOpacity onPress={() => setShowFriendSelection(false)}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.friendSelectionTitle}>Send To</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Small Media Preview */}
        <View style={styles.smallMediaPreview}>
          <Image source={{ uri: capturedMedia.uri }} style={styles.smallMediaImage} />
          {capturedMedia.type === 'video' && (
            <View style={styles.smallVideoIndicator}>
              <Ionicons name="videocam" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Friends List */}
        <View style={styles.friendsListContainer}>
          <Text style={styles.friendsListTitle}>
            Select friends ({friends.length} available)
          </Text>
          {friends.length > 0 ? (
            <FlatList
              data={friends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.friendsList}
            />
          ) : (
            <View style={styles.noFriendsContainer}>
              <Text style={styles.noFriendsText}>No friends yet</Text>
              <Text style={styles.noFriendsSubtext}>Add friends to send photos!</Text>
            </View>
          )}
        </View>

        {/* Send Button - Bottom Right (Snapchat Style) */}
        {selectedFriends.size > 0 && (
          <TouchableOpacity
            style={styles.snapchatSendButton}
            onPress={handleSendMessages}
            disabled={sending}
          >
            <Ionicons name="send" size={24} color="#FFFFFF" />
            <Text style={styles.snapchatSendText}>
              {sending ? 'Sending...' : `${selectedFriends.size}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show media preview screen
  if (capturedMedia) {
    return (
      <View style={styles.previewContainer}>
        <StatusBar style="light" />
        
        {/* Media Preview */}
        <Image source={{ uri: capturedMedia.uri }} style={styles.fullPreview} />
        
        {/* Preview Overlay */}
        <View style={styles.previewOverlay}>
          {/* Top Actions */}
          <View style={styles.previewTopActions}>
            <TouchableOpacity style={styles.previewButton} onPress={handleDiscardMedia}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <View style={styles.previewBottomActions}>
            <TouchableOpacity style={styles.previewActionButton} onPress={handleDiscardMedia}>
              <Ionicons name="trash" size={24} color="#FFFFFF" />
              <Text style={styles.previewActionText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendToFriendsButton} onPress={handleSendToFriends}>
              <Ionicons name="send" size={24} color="#FFFFFF" />
              <Text style={styles.sendToFriendsText}>Send to Friends</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Main camera view
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      />

      {/* UI Overlay */}
      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons 
              name={flash === 'on' ? 'flash' : 'flash-off'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Gallery Button (placeholder) */}
          <TouchableOpacity style={styles.sideButton}>
            <Ionicons name="images" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            onPress={takePicture}
          >
            <View style={[styles.captureButtonInner, isRecording && styles.captureButtonInnerRecording]} />
          </TouchableOpacity>

          {/* Camera Flip Button */}
          <TouchableOpacity style={styles.sideButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Tap for photo • Hold to record
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#15151E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#E10600',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonRecording: {
    borderColor: '#E10600',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  captureButtonInnerRecording: {
    borderRadius: 8,
    backgroundColor: '#E10600',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E10600',
    marginRight: 8,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  friendSelectionContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  friendSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  friendSelectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 16,
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#E10600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(225, 6, 0, 0.5)',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sendButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  mediaPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreview: {
    width: screenWidth,
    height: screenHeight,
    resizeMode: 'contain',
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsContainer: {
    flex: 1,
    padding: 16,
  },
  friendsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  friendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  selectedFriendItem: {
    backgroundColor: 'rgba(225, 6, 0, 0.5)',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFriendAvatar: {
    backgroundColor: 'rgba(225, 6, 0, 0.5)',
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedFriendAvatarText: {
    color: '#FFFFFF',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  selectedFriendName: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(225, 6, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFriendsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFriendsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  noFriendsSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullPreview: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  previewTopActions: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  previewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBottomActions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  previewActionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  previewActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendToFriendsButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  sendToFriendsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendsList: {
    paddingVertical: 16,
  },
  // New Snapchat-style friend selection styles
  headerSpacer: {
    width: 44, // Same width as back button for balance
  },
  smallMediaPreview: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  smallMediaImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  smallVideoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  friendsListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  friendsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    opacity: 0.8,
  },
  // Snapchat-style floating send button
  snapchatSendButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  snapchatSendText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  // Snapchat-style friend items
  snapchatFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  snapchatFriendSelected: {
    backgroundColor: 'rgba(225, 6, 0, 0.1)',
  },
  snapchatFriendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  snapchatFriendAvatarSelected: {
    backgroundColor: 'rgba(225, 6, 0, 0.3)',
  },
  snapchatFriendAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  snapchatFriendName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  snapchatSelectedCheck: {
    marginLeft: 'auto',
  },
}); 