import React, { useState, useRef, useEffect, useCallback } from 'react';
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


// Import filter components (Snapchat system only - others disabled for now)
import { 
  SnapchatFilterOverlay, 
  SnapchatFilterSelector, 
  SNAPCHAT_FILTERS, 
  type SnapchatFilter 
} from '../../components/camera';

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
  
  // Snapchat-style filters state (consolidated filter system)
  const [selectedSnapchatFilter, setSelectedSnapchatFilter] = useState<SnapchatFilter>(SNAPCHAT_FILTERS[0]); // Default to 'No Filter'
  const [showSnapchatFilters, setShowSnapchatFilters] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false); // Simple face detection simulation
  
  const cameraRef = useRef<CameraView>(null);
  const cameraContainerRef = useRef<View>(null);

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
      // When screen gains focus, activate camera
      setIsCameraActive(true);
      
      return () => {
        // When screen loses focus, deactivate camera and show tab bar
        setIsCameraActive(false);
        
        // Stop any ongoing recording when leaving the screen
        if (isRecording) {
          setIsRecording(false);
          setIsProcessing(false);
        }
        
        if (setTabBarVisible) {
          setTabBarVisible(true);
        }
      };
    }, [setTabBarVisible, isRecording])
  );



  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleFocus = useCallback(() => {
    setIsCameraActive(true);
  }, []);

  const handleBlur = useCallback(async () => {
    setIsCameraActive(false);
    
    if (isRecording) {
      await stopRecording();
    }
  }, [isRecording]);

  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraActive) {
      return;
    }

    try {
      setIsProcessing(true);
      
      console.log('📸 Taking photo...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: false,
        skipProcessing: true,
      });
      
      setCapturedMedia({
        uri: photo.uri,
        type: 'photo'
      });
      
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) {
      return;
    }

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || !isCameraActive) {
      return;
    }

    try {
      setIsRecording(true);
      setIsProcessing(true);
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30,
      });
      
      if (video && video.uri) {
        await processVideo(video.uri);
      } else {
        Alert.alert('Error', 'Video recording failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Recording error:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const processVideo = async (videoUri: string) => {
    try {
      const previewUri = videoUri;
      
      // Save to gallery
      try {
        await MediaLibrary.saveToLibraryAsync(videoUri);
      } catch (saveError) {
        console.error('⚠️ Could not save to media library:', saveError);
        // Continue anyway - preview should still work
      }
      
      // Get the latest video asset to ensure we have the right URI
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // Latest first
        first: 1,
      });
      
      if (assets.length > 0) {
        const latestAsset = assets[0];
        
        // Get asset info to get the local URI
        const assetInfo = await MediaLibrary.getAssetInfoAsync(latestAsset.id);
        
        const galleryUri = assetInfo.localUri || assetInfo.uri;
        
        if (galleryUri) {
          setCapturedMedia({ uri: previewUri, type: 'video' });
          return;
        }
      }
      
      // Fallback: use the direct video URI
      if (videoUri) {
        setCapturedMedia({ uri: videoUri, type: 'video' });
      }
    } catch (error) {
      console.error('❌ Error processing video:', error);
      Alert.alert('Error', 'Failed to process video. Please try again.');
    }
  };

  const resetCamera = () => {
    setCapturedMedia(null);
    setIsRecording(false);
    setIsProcessing(false);
  };

  const handleCapturePress = async () => {
    if (isProcessing) {
      return;
    }

    if (cameraMode === 'photo') {
      await takePhoto();
    } else {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
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

  // Snapchat filter handlers (consolidated filter system)
  const handleSnapchatFilterSelect = (filter: SnapchatFilter) => {
    setSelectedSnapchatFilter(filter);
    // Enable simple face detection when a filter is selected
    if (filter.id !== 'none') {
      setFaceDetected(true);
    } else {
      setFaceDetected(false);
    }
  };

  const toggleSnapchatFilters = () => {
    setShowSnapchatFilters(current => !current);
  };



  // Effect to simulate face detection for Snapchat filters
  React.useEffect(() => {
    let faceDetectionInterval: NodeJS.Timeout;
    
    if (isCameraActive && selectedSnapchatFilter.id !== 'none') {
      // Simulate realistic face detection timing
      faceDetectionInterval = setInterval(() => {
        setFaceDetected(true);
      }, 100); // Check every 100ms like real face detection
    } else {
      setFaceDetected(false);
    }

    return () => {
      if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
      }
    };
  }, [isCameraActive, selectedSnapchatFilter.id]);



  const discardMedia = async () => {
    if (capturedMedia?.type === 'video' && capturedMedia.uri) {
      try {
        const { assets } = await MediaLibrary.getAssetsAsync({
          mediaType: 'video',
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          first: 5,
        });
        
        for (const asset of assets) {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
          if (assetInfo.localUri === capturedMedia.uri || assetInfo.uri === capturedMedia.uri) {
            await MediaLibrary.deleteAssetsAsync([asset.id]);
            break;
          }
        }
      } catch (error) {
        console.error('⚠️ Could not delete video from media library:', error);
      }
    }
    
    // Reset all states to ensure clean state
    setCapturedMedia(null);
    setShowFriendSelection(false);
    setSelectedFriends(new Set());
    setIsRecording(false);
    setIsProcessing(false);
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
              setCapturedMedia(null);
              setShowFriendSelection(false);
              setSelectedFriends(new Set());
            }
          },
          { 
            text: 'Delete from Gallery', 
            onPress: () => {
              discardMedia();
            },
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
          <TouchableOpacity onPress={() => {
            setShowFriendSelection(false);
            // Explicitly show tab bar when going back from friend selection
            if (setTabBarVisible) {
              setTabBarVisible(true);
            }
          }}>
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
                setCapturedMedia(null);
                // Explicitly show tab bar when going back
                if (setTabBarVisible) {
                  setTabBarVisible(true);
                }
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
                      setCapturedMedia(null);
                      // Explicitly show tab bar after saving
                      if (setTabBarVisible) {
                        setTabBarVisible(true);
                      }
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
                (navigation as any).navigate('Pit Wall', {
                  screen: 'StoryComposer',
                  params: {
                    mediaUri: capturedMedia.uri,
                    mediaType: capturedMedia.type,
                  }
                });
                // Clear captured media and show tab bar when navigating to stories
                setCapturedMedia(null);
                if (setTabBarVisible) {
                  setTabBarVisible(true);
                }
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
        <View style={styles.cameraContainer} ref={cameraContainerRef}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flash}
            mode={cameraMode === 'video' ? 'video' : 'picture'}
            mute={muted}
          />
          

          
          {/* Snapchat-style Filter Overlay */}
          <SnapchatFilterOverlay
            filter={selectedSnapchatFilter}
            faceDetected={faceDetected}
          />
        </View>
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

          {/* Legacy Filter Systems - Disabled for now
          {showFilters && (
            <View style={styles.filtersContainer}>
              <FilterSelector
                selectedFilter={selectedFilter}
                onFilterSelect={handleFilterSelect}
              />
            </View>
          )}

          {showHelmets && (
            <View style={styles.helmetsContainer}>
              <HelmetSelector
                selectedHelmet={selectedHelmet}
                onHelmetSelect={handleHelmetSelect}
              />
            </View>
          )}
          */}

          {/* Snapchat Filter Selector - Above Bottom Controls */}
          {showSnapchatFilters && (
            <View style={styles.snapchatFiltersContainer}>
              <SnapchatFilterSelector
                selectedFilter={selectedSnapchatFilter}
                onFilterSelect={handleSnapchatFilterSelect}
              />
            </View>
          )}

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Left Side Controls */}
            <View style={styles.leftControls}>
              {/* Legacy Filter Buttons - Disabled for now
              <TouchableOpacity 
                style={[styles.sideButton, showFilters && styles.sideButtonActive]} 
                onPress={toggleFilters}
              >
                <Ionicons name="color-palette" size={24} color={showFilters ? '#E10600' : '#FFFFFF'} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sideButton, showHelmets && styles.sideButtonActive, styles.helmetButton]} 
                onPress={toggleHelmets}
              >
                <Text style={[styles.helmetIcon, showHelmets && styles.helmetIconActive]}>🪖</Text>
              </TouchableOpacity>
              */}
              
              {/* Snapchat Filters Toggle Button */}
              <TouchableOpacity 
                style={[styles.sideButton, showSnapchatFilters && styles.sideButtonActive, styles.snapchatButton]} 
                onPress={toggleSnapchatFilters}
              >
                <Text style={[styles.snapchatIcon, showSnapchatFilters && styles.snapchatIconActive]}>😎</Text>
              </TouchableOpacity>
            </View>

            {/* Capture Button */}
            <TouchableOpacity
              style={[
                styles.captureButton, 
                isRecording && styles.captureButtonRecording,
                isProcessing && styles.captureButtonProcessing,
                cameraMode === 'video' && styles.captureButtonVideo
              ]}
              onPress={handleCapturePress}
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

      {/* Photo Composer - Disabled for now (legacy filter system)
      {needsEmojiCompositing && photoForCompositing && (
        <View style={styles.hiddenPhotoComposer}>
          <PhotoComposer
            ref={photoComposerRef}
            imageUri={photoForCompositing}
            helmet={selectedHelmet}
            imageWidth={screenWidth * 2}
            imageHeight={screenHeight * 2}
          />
        </View>
      )}
      */}
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
  cameraContainer: {
    flex: 1,
    position: 'relative',
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

  filtersContainer: {
    position: 'absolute',
    bottom: 170,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  helmetsContainer: {
    position: 'absolute',
    bottom: 170,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  snapchatFiltersContainer: {
    position: 'absolute',
    bottom: 170,
    left: 0,
    right: 0,
    zIndex: 2,
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
  sideButtonActive: {
    backgroundColor: 'rgba(225, 6, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#E10600',
  },
  leftControls: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  helmetButton: {
    marginTop: 8,
  },
  helmetIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  helmetIconActive: {
    color: '#E10600',
  },
  snapchatButton: {
    marginTop: 8,
  },
  snapchatIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  snapchatIconActive: {
    color: '#E10600',
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
  hiddenPhotoComposer: {
    position: 'absolute',
    top: -99999, // Hide far off-screen
    left: -99999,
    width: 1, // Use minimal size when hidden
    height: 1,
    opacity: 0,
    pointerEvents: 'none', // Prevent any touch interference
  },

}); 