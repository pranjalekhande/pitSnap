import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { viewStory, type Story } from '../../services/storiesService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type StoryViewerRouteParams = {
  StoryViewer: {
    stories: Story[];
    friendName: string;
    initialIndex: number;
  };
};

type StoryViewerRouteProp = RouteProp<StoryViewerRouteParams, 'StoryViewer'>;

const STORY_DURATION = 8000; // 8 seconds per story
const PROGRESS_BAR_HEIGHT = 2;

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<StoryViewerRouteProp>();
  const { stories, friendName, initialIndex = 0 } = route.params;
  
  // Debug logging
  console.log('🎬 StoryViewer opened');
  console.log('📋 Stories received:', stories?.length || 0);
  console.log('👤 Friend name:', friendName);
  console.log('🎯 Initial index:', initialIndex);
  console.log('📖 Stories data:', stories);
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];
  
  console.log('🎯 Current story index:', currentIndex);
  console.log('📄 Current story:', currentStory);

  const videoPlayer = useVideoPlayer(
    currentStory?.media_type === 'video' ? currentStory.media_url : null,
    player => {
      player.loop = false;
      player.muted = false;
      if (currentStory?.media_type === 'video' && !isPaused) {
        player.play();
      }
    }
  );

  // Mark current story as viewed
  useEffect(() => {
    if (currentStory) {
      viewStory(currentStory.id);
    }
  }, [currentStory]);

  // Auto-advance progress
  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    const duration = currentStory?.media_type === 'video' ? STORY_DURATION : STORY_DURATION;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      
      setProgress(newProgress);
      
      if (newProgress >= 1) {
        handleNextStory();
      } else {
        timerRef.current = setTimeout(updateProgress, 50);
      }
    };

    // Start progress animation
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();

    updateProgress();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, isPaused]);

  const handleNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      progressAnim.setValue(0);
    } else {
      // End of stories, go back
      navigation.goBack();
    }
  };

  const handlePreviousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
      progressAnim.setValue(0);
    } else {
      // At first story, go back
      navigation.goBack();
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Pan responder for gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    
    onPanResponderGrant: (evt) => {
      const { locationX } = evt.nativeEvent;
      const isRightSide = locationX > screenWidth / 2;
      
      // Long press to pause
      longPressTimeoutRef.current = setTimeout(() => {
        setIsPaused(true);
        if (currentStory?.media_type === 'video') {
          videoPlayer.pause();
        }
      }, 200);
    },
    
    onPanResponderRelease: (evt) => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
      
      if (isPaused) {
        setIsPaused(false);
        if (currentStory?.media_type === 'video') {
          videoPlayer.play();
        }
        return;
      }
      
      const { locationX } = evt.nativeEvent;
      const isRightSide = locationX > screenWidth / 2;
      
      if (isRightSide) {
        handleNextStory();
      } else {
        handlePreviousStory();
      }
    },
  });

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const storyTime = new Date(dateString);
    const diffMs = now.getTime() - storyTime.getTime();
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (!currentStory) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#E10600" />
          <Text style={styles.errorTitle}>Story Not Found</Text>
          <Text style={styles.errorText}>
            Stories: {stories?.length || 0} • Index: {currentIndex}
          </Text>
          <Text style={styles.errorDebug}>
            {JSON.stringify({ stories: stories?.map(s => s.id), currentIndex }, null, 2)}
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: index === currentIndex 
                    ? progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : index < currentIndex ? '100%' : '0%'
                }
              ]}
            />
          </View>
        ))}
      </View>

      {/* Story header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {friendName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{friendName}</Text>
            <Text style={styles.storyTime}>
              {formatTimeAgo(currentStory.created_at)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Story content */}
      <View style={styles.storyContent} {...panResponder.panHandlers}>
        {currentStory.media_type === 'video' ? (
          <VideoView
            style={styles.media}
            player={videoPlayer}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
        ) : (
          <Image
            source={{ uri: currentStory.media_url }}
            style={styles.media}
            resizeMode="contain"
          />
        )}
        
        {/* Pause indicator */}
        {isPaused && (
          <View style={styles.pauseIndicator}>
            <Ionicons name="pause" size={40} color="#FFFFFF" />
          </View>
        )}
        
        {/* Touch areas for navigation */}
        <View style={styles.touchAreas}>
          <TouchableOpacity 
            style={styles.leftTouchArea}
            onPress={handlePreviousStory}
          />
          <TouchableOpacity 
            style={styles.rightTouchArea}
            onPress={handleNextStory}
          />
        </View>
      </View>

      {/* Story caption */}
      {currentStory.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>{currentStory.caption}</Text>
        </View>
      )}

      {/* Navigation hints */}
      <View style={styles.hintsContainer}>
        <Text style={styles.hintText}>
          👈 Tap left for previous • Tap right for next 👉
        </Text>
        <Text style={styles.hintSubtext}>
          Hold to pause
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingTop: 50,
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storyTime: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  media: {
    width: screenWidth,
    height: screenHeight * 0.7,
    backgroundColor: '#1E1E28',
  },
  pauseIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    padding: 10,
  },
  touchAreas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  leftTouchArea: {
    flex: 1,
  },
  rightTouchArea: {
    flex: 1,
  },
  captionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  hintsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  hintSubtext: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: 4,
  },
}); 