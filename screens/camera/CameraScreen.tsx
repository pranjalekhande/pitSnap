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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { getFriends, type User } from '../../services/friendsService';
import { sendMessage as sendMessageService } from '../../services/messagesService';
import { uploadMedia } from '../../services/mediaService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CapturedMedia {
  uri: string;
  type: 'photo' | 'video';
}

interface CameraScreenProps {
  setTabBarVisible?: (visible: boolean) => void;
}

export default function CameraScreen({ setTabBarVisible }: CameraScreenProps) {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);
  const [showFriendSelection, setShowFriendSelection] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [currentVideoAsset, setCurrentVideoAsset] = useState<MediaLibrary.Asset | null>(null);
  const [muted, setMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const cameraRef = useRef<CameraView>(null);

  // Create video players with proper declarative approach
  const smallVideoPlayer = useVideoPlayer(
    capturedMedia?.type === 'video' ? capturedMedia.uri : null,
    player => {
      if (capturedMedia?.type === 'video') {
        player.loop = false;
        player.muted = true; // Small preview is always muted
      }
    }
  );

  const fullVideoPlayer = useVideoPlayer(
    capturedMedia?.type === 'video' ? capturedMedia.uri : null,
    player => {
      if (capturedMedia?.type === 'video') {
        player.loop = true;
        player.muted = muted; // Use the muted state
        // Auto-play after a brief moment for smoother UX
        setTimeout(() => {
          try {
            player.play();
          } catch (err) {
            console.error('❌ Failed to start video playback:', err);
          }
        }, 100);
      }
    }
  );

  // Check permissions on component mount
  useEffect(() => {
    (async () => {
      if (!permission?.granted && permission?.canAskAgain) {
        await requestPermission();
      }
      if (!mediaPermission?.granted && mediaPermission?.canAskAgain) {
        await requestMediaPermission();
      }
    })();
  }, [permission, mediaPermission]);

  // Load friends when friend selection is shown
  useEffect(() => {
    if (showFriendSelection) {
      loadFriends();
    }
  }, [showFriendSelection]);

  // Control tab bar visibility based on preview/friend selection state
  useEffect(() => {
    if (setTabBarVisible) {
      // Hide tab bar when in preview mode or friend selection
      const shouldHideTabBar = capturedMedia !== null || showFriendSelection;
      setTabBarVisible(!shouldHideTabBar);
    }
  }, [capturedMedia, showFriendSelection, setTabBarVisible]);

  // Update video player mute state when muted state changes
  useEffect(() => {
    if (fullVideoPlayer && capturedMedia?.type === 'video') {
      fullVideoPlayer.muted = muted;
    }
  }, [muted, fullVideoPlayer, capturedMedia]);

  // Cleanup: Show tab bar when component unmounts
  useEffect(() => {
    return () => {
      if (setTabBarVisible) {
        setTabBarVisible(true);
      }
    };
  }, [setTabBarVisible]);

  // Handle focus/blur events to manage tab bar visibility AND camera lifecycle
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Camera screen gained focus - activating camera');
      // When screen gains focus, activate camera and update tab bar
      setIsCameraActive(true);
      
      if (setTabBarVisible) {
        const shouldHideTabBar = capturedMedia !== null || showFriendSelection;
        setTabBarVisible(!shouldHideTabBar);
      }
      
      return () => {
        console.log('📱 Camera screen lost focus - deactivating camera');
        // When screen loses focus, deactivate camera and show tab bar
        setIsCameraActive(false);
        
        // Stop any ongoing recording when leaving the screen
        if (isRecording) {
          console.log('🛑 Stopping recording due to screen navigation');
          setIsRecording(false);
          setIsProcessing(false);
        }
        
        if (setTabBarVisible) {
          setTabBarVisible(true);
        }
      };
    }, [capturedMedia, showFriendSelection, setTabBarVisible, isRecording])
  );

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isRecording || isProcessing) return;

    try {
      setIsProcessing(true);
      console.log('📸 Taking photo...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo) {
        console.log('✅ Photo taken successfully:', photo.uri);
        setCapturedMedia({ uri: photo.uri, type: 'photo' });
        console.log('📱 Should now show photo preview screen');
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take picture');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecording) {
      console.log('⚠️ Cannot stop recording: camera not ready or not recording');
      return;
    }
    
    try {
      console.log('🛑 Stopping video recording...');
      cameraRef.current.stopRecording();
      console.log('✅ Stop recording command sent');
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      // Reset state on error
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording || isProcessing) {
      console.log('⚠️ Cannot start recording:', { 
        hasCamera: !!cameraRef.current, 
        isRecording, 
        isProcessing 
      });
      return;
    }
    
    // Check media library permission first
    if (!mediaPermission?.granted) {
      Alert.alert(
        'Media Library Access Needed',
        'PitSnap needs access to save videos for preview.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Access', 
            onPress: async () => {
              await requestMediaPermission();
              if (mediaPermission?.granted) {
                startRecording();
              }
            }
          }
        ]
      );
      return;
    }

    try {
      console.log('🔴 Starting video recording...');
      setIsRecording(true);
      
      // Simplified approach - just call recordAsync without timeout
      console.log('📹 Calling recordAsync...');
      const video = await cameraRef.current.recordAsync({
        maxDuration: 300 // 5 minutes max
      });
      
      console.log('✅ Video recording completed:', video);
      
      if (video && video.uri) {
        console.log('📹 Video file created:', video.uri);
        await processRecordedVideo(video.uri);
      } else {
        console.log('❌ No video returned from recording');
        Alert.alert('Error', 'No video was recorded');
      }
      
    } catch (error) {
      console.error('❌ Recording error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', 'Failed to record video: ' + errorMessage);
    } finally {
      setIsRecording(false);
      setIsProcessing(false);
      console.log('🎬 Recording process complete');
    }
  };

  // Separate function to process recorded video
  const processRecordedVideo = async (videoUri: string) => {
    try {
      setIsProcessing(true);
      console.log('💾 Processing recorded video...');
      
      // TEMPORARY: Try direct URI first for testing
      console.log('🧪 Testing direct video URI:', videoUri);
      setCapturedMedia({ uri: videoUri, type: 'video' });
      console.log('📱 Direct video preview set - check if this works');
      
      // Uncomment below for media library processing if direct URI works
      /*
      // Save to media library for reliable preview
      await MediaLibrary.saveToLibraryAsync(videoUri);
      console.log('✅ Video saved to media library');
      
      // Get the most recent video asset (the one we just saved)
      const recentVideos = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        sortBy: 'creationTime',
        first: 1,
      });
      
      if (recentVideos.assets.length > 0) {
        const latestAsset = recentVideos.assets[0];
        console.log('📁 Latest video asset found:', latestAsset.id);
        
        // Get the asset info for preview
        const assetInfo = await MediaLibrary.getAssetInfoAsync(latestAsset.id);
        console.log('📁 Asset info retrieved:', assetInfo.localUri || assetInfo.uri);
        
        // Store the asset for potential deletion later
        setCurrentVideoAsset(latestAsset);
        
        // Use the media library URI for preview (more reliable)
        const previewUri = assetInfo.localUri || assetInfo.uri;
        console.log('📱 Setting captured media with URI:', previewUri);
        console.log('📱 URI type:', typeof previewUri);
        console.log('📱 URI starts with file://', previewUri?.startsWith('file://'));
        setCapturedMedia({ uri: previewUri, type: 'video' });
        console.log('📱 Video preview should now appear with URI:', previewUri);
      } else {
        throw new Error('Could not find saved video in media library');
      }
      */
      
    } catch (saveError) {
      console.error('❌ Failed to save to media library:', saveError);
      // Fallback to direct file URI
      console.log('📱 Using direct video URI as fallback:', videoUri);
      setCapturedMedia({ uri: videoUri, type: 'video' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Emergency reset function (simplified)
  const resetCameraState = () => {
    console.log('🚨 Resetting camera state');
    setIsRecording(false);
    setIsProcessing(false);
  };

  // Simplified capture button handler - mode-based
  const handleCapture = () => {
    // Prevent interaction during processing
    if (isProcessing) {
      console.log('⚠️ Capture ignored - processing in progress');
      return;
    }
    
    console.log(`🎯 Capture button pressed - Mode: ${cameraMode}, Recording: ${isRecording}`);
    
    if (cameraMode === 'photo') {
      takePicture();
    } else {
      // Video mode: toggle start/stop
      if (isRecording) {
        console.log('🛑 User wants to STOP recording');
        stopRecording();
      } else {
        console.log('▶️ User wants to START recording');
        startRecording();
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const toggleMute = () => {
    setMuted(current => !current);
  };

  const handleDiscardMedia = async () => {
    console.log('🗑️ Discarding media');
    
    // Optionally delete video from media library
    if (currentVideoAsset && capturedMedia?.type === 'video') {
      try {
        console.log('🗑️ Deleting video from media library...');
        const canDelete = await MediaLibrary.requestPermissionsAsync();
        if (canDelete.granted) {
          await MediaLibrary.deleteAssetsAsync([currentVideoAsset.id]);
          console.log('✅ Video deleted from media library');
        }
      } catch (error) {
        console.log('⚠️ Could not delete video from media library:', error);
        // Not a critical error, continue with discard
      }
    }
    
    // Simple state update - let the declarative system handle video player cleanup
    setCapturedMedia(null);
    setCurrentVideoAsset(null);
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
        [
          { 
            text: 'Keep in Gallery', 
            onPress: () => {
              // Simple state update - let the declarative system handle cleanup
              setCapturedMedia(null);
              setCurrentVideoAsset(null);
              setShowFriendSelection(false);
              setSelectedFriends(new Set());
            }
          },
          { 
            text: 'Delete from Gallery', 
            onPress: handleDiscardMedia,
            style: 'destructive'
          }
        ]
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

  if (!permission.granted || !mediaPermission?.granted) {
    const needsCamera = !permission.granted;
    const needsMedia = !mediaPermission?.granted;
    
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          {needsCamera && needsMedia ? '📸📁 Permissions Needed' : 
           needsCamera ? '📸 Camera Access Needed' : 
           '📁 Media Library Access Needed'}
        </Text>
        <Text style={styles.permissionSubtext}>
          {needsCamera && needsMedia ? 
            'PitSnap needs camera and media library access to capture and save videos for preview' :
            needsCamera ? 
              'PitSnap needs camera access to capture photos and videos' :
              'PitSnap needs media library access to save videos for preview'
          }
        </Text>
        {needsCamera && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        )}
        {needsMedia && (
          <TouchableOpacity style={[styles.permissionButton, {marginTop: 10}]} onPress={requestMediaPermission}>
            <Text style={styles.permissionButtonText}>Enable Media Library</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show friend selection screen
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
          {capturedMedia.type === 'video' && capturedMedia.uri ? (
            <VideoView
              style={styles.smallMediaImage}
              player={smallVideoPlayer}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={false}
              contentFit="cover"
            />
          ) : (
            <Image source={{ uri: capturedMedia.uri }} style={styles.smallMediaImage} />
          )}
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
              <Text style={styles.noFriendsSubtext}>Add friends to send videos!</Text>
            </View>
          )}
        </View>

        {/* Send Button - Bottom Right (Snapchat Style) */}
        {selectedFriends.size > 0 && (
          <TouchableOpacity
            style={styles.snapchatFloatingSendButton}
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
    console.log('🎨 Rendering preview screen for:', capturedMedia.type);
    console.log('🎨 Preview URI:', capturedMedia.uri);
    console.log('🎨 URI exists:', !!capturedMedia.uri);
    console.log('🎨 File exists check:', capturedMedia.uri ? 'URI provided' : 'No URI');
    return (
      <View style={styles.previewContainer}>
        <StatusBar style="light" />
        
        {/* Media Preview */}
        {capturedMedia.type === 'video' && capturedMedia.uri ? (
          <VideoView
            style={styles.fullPreview}
            player={fullVideoPlayer}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            nativeControls={false}
            contentFit="contain"
            onFirstFrameRender={() => {
              console.log('🎬 Video first frame rendered');
            }}
          />
        ) : (
          <Image source={{ uri: capturedMedia.uri }} style={styles.fullPreview} />
        )}
        
        {/* Preview Overlay */}
        <View style={styles.previewOverlay}>
          {/* Top Actions */}
          <View style={styles.previewTopActions}>
            <TouchableOpacity 
              style={styles.previewBackButton} 
              onPress={() => {
                console.log('🔙 Back button pressed - clearing media');
                // Simple state update - let the declarative video player management handle cleanup
                setCapturedMedia(null);
                setCurrentVideoAsset(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Mute button for video preview or spacer for photos */}
            {capturedMedia?.type === 'video' ? (
              <TouchableOpacity 
                style={styles.previewMuteButton} 
                onPress={toggleMute}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={muted ? 'volume-off' : 'volume-high'} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.previewSpacer} />
            )}
          </View>

          {/* Snapchat-style Bottom Actions */}
          <View style={styles.snapchatBottomActions}>
            {/* Download Button */}
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => {
                Alert.alert('Saved!', 'Media saved to your camera roll', [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Simple state update - let the declarative system handle cleanup
                      setCapturedMedia(null);
                      setCurrentVideoAsset(null);
                    }
                  }
                ]);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Stories Button */}
            <TouchableOpacity 
              style={styles.snapchatStoriesButton} 
              onPress={() => {
                // Navigate to StoryComposer with the captured media
                (navigation as any).navigate('Stories', {
                  screen: 'StoryComposer',
                  params: {
                    mediaUri: capturedMedia.uri,
                    mediaType: capturedMedia.type,
                  }
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.snapchatStoriesAvatar}>
                <Text style={styles.snapchatStoriesInitial}>P</Text>
              </View>
              <Text style={styles.snapchatStoriesText}>Stories</Text>
            </TouchableOpacity>

            {/* Send To Button */}
            <TouchableOpacity 
              style={styles.sendToButton} 
              onPress={handleSendToFriends}
              activeOpacity={0.8}
            >
              <Text style={styles.sendToButtonText}>Send To</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
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
      
      {/* Camera View - Only render when camera should be active */}
      {isCameraActive ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
          mode={cameraMode === 'video' ? 'video' : 'picture'}
          mute={muted}
        />
      ) : (
        // Show a placeholder when camera is inactive
        <View style={[styles.camera, styles.cameraInactive]}>
          <View style={styles.cameraInactiveContent}>
            <Ionicons name="camera" size={48} color="#666" />
            <Text style={styles.cameraInactiveText}>Camera Paused</Text>
            <Text style={styles.cameraInactiveSubtext}>Camera will resume when you return to this tab</Text>
          </View>
        </View>
      )}

      {/* UI Overlay - Only show when camera is active */}
      {isCameraActive && (
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            {/* Camera Flip Button */}
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Ionicons 
                name={flash === 'on' ? 'flash' : 'flash-off'} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
              <Ionicons 
                name={muted ? 'volume-off' : 'volume-high'} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>

          {/* Recording Indicator */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
            </View>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <View style={styles.processingIndicator}>
              <View style={styles.processingDot} />
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
              style={[
                styles.captureButton, 
                isRecording && styles.captureButtonRecording,
                isProcessing && styles.captureButtonProcessing,
                cameraMode === 'video' && styles.captureButtonVideo
              ]}
              onPress={handleCapture}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              {cameraMode === 'video' ? (
                // Video mode: START/STOP indicator
                <View style={styles.videoButtonContainer}>
                  <Ionicons 
                    name={isRecording ? "stop" : "play"} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
              ) : (
                // Photo mode: simple circle
                <View style={[
                  styles.captureButtonInner, 
                  isProcessing && styles.captureButtonInnerProcessing
                ]} />
              )}
            </TouchableOpacity>

            {/* Mode Switcher */}
            <View style={styles.modeSwitcher}>
              <TouchableOpacity
                style={[styles.modeButton, cameraMode === 'photo' && styles.modeButtonActive]}
                onPress={() => setCameraMode('photo')}
              >
                <Ionicons name="camera" size={20} color={cameraMode === 'photo' ? '#E10600' : '#FFFFFF'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, cameraMode === 'video' && styles.modeButtonActive]}
                onPress={() => setCameraMode('video')}
              >
                <Ionicons name="videocam" size={20} color={cameraMode === 'video' ? '#E10600' : '#FFFFFF'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomControls: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modeSwitcher: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  modeButton: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(225, 6, 0, 0.2)',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonVideo: {
    borderColor: '#E10600',
  },
  videoButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonRecording: {
    borderColor: '#E10600',
    backgroundColor: 'rgba(225, 6, 0, 0.3)',
    transform: [{ scale: 1.1 }],
  },
  captureButtonProcessing: {
    borderColor: '#FFA500',
    backgroundColor: 'rgba(255, 165, 0, 0.3)',
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  captureButtonInnerVideo: {
    backgroundColor: '#E10600',
  },
  captureButtonInnerRecording: {
    borderRadius: 8,
    backgroundColor: '#E10600',
    width: 40,
    height: 40,
  },
  captureButtonInnerProcessing: {
    backgroundColor: '#FFA500',
    opacity: 0.8,
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
  processingIndicator: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  processingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFA500',
    marginRight: 8,
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
    width: '100%',
    height: '100%',
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
    justifyContent: 'space-between',
    zIndex: 10,
  },
  previewBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  previewMuteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  previewSpacer: {
    width: 44,
  },
  // Bottom actions with bigger buttons fitting screen
  snapchatBottomActions: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  // Download button - bigger size
  saveButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3A3A3A', // Dark grey background
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  // Stories button - bigger and wider to fit screen
  snapchatStoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A4A4A', // Consistent grey color
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  snapchatStoriesAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6B6B6B', // Lighter grey for avatar
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  snapchatStoriesInitial: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  snapchatStoriesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sendToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E10600',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#E10600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  sendToButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.3,
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
  // Snapchat-style floating send button for friend selection
  snapchatFloatingSendButton: {
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
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraInactive: {
    backgroundColor: '#000000',
  },
  cameraInactiveContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraInactiveText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  cameraInactiveSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}); 