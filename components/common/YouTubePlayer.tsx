import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  channelTitle: string;
  duration: string;
  onError?: () => void;
}

// Reliable F1 fallback videos that are known to work - 4 DISTINCT VIDEOS
const FALLBACK_VIDEOS = [
  {
    id: 'Eq_CshnFUto',
    title: 'Austrian GP Highlights - Race Content',
    channelTitle: 'F1 Preview',
    duration: '6:00'
  },
  {
    id: 'Y2J11XHAQiU',
    title: 'F1 Video Content',
    channelTitle: 'YouTube',
    duration: '5:00'
  },
  {
    id: 'Pls_q2aQzHg',
    title: 'F1 Explained - How Racing Works',
    channelTitle: 'Chain Bear F1',
    duration: '4:32'
  },
  {
    id: 'dNF6sVurAuI',
    title: 'F1 Racing Analysis - Strategy Breakdown',
    channelTitle: 'WTF1',
    duration: '6:15'
  }
];

export default function YouTubePlayerComponent({
  videoId: initialVideoId,
  title: initialTitle,
  channelTitle: initialChannelTitle,
  duration: initialDuration,
  onError
}: YouTubePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(initialVideoId);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [currentChannelTitle, setCurrentChannelTitle] = useState(initialChannelTitle);
  const [currentDuration, setCurrentDuration] = useState(initialDuration);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  const [hasError, setHasError] = useState(false);

  // Reset when videoId changes
  useEffect(() => {
    setCurrentVideoId(initialVideoId);
    setCurrentTitle(initialTitle);
    setCurrentChannelTitle(initialChannelTitle);
    setCurrentDuration(initialDuration);
    setFallbackIndex(-1);
    setHasError(false);
  }, [initialVideoId, initialTitle, initialChannelTitle, initialDuration]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
    if (state === 'playing') {
      setHasError(false);
    }
  }, []);

  const onReady = useCallback(() => {
    console.log('YouTube player ready for video:', currentVideoId);
    setHasError(false);
  }, [currentVideoId]);

  const onPlaybackQualityChange = useCallback((quality: string) => {
    console.log('YouTube playback quality changed to:', quality);
  }, []);

  const tryFallbackVideo = useCallback(() => {
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < FALLBACK_VIDEOS.length) {
      const fallbackVideo = FALLBACK_VIDEOS[nextIndex];
      console.log(`Trying fallback video ${nextIndex + 1}:`, fallbackVideo.title);
      
      setCurrentVideoId(fallbackVideo.id);
      setCurrentTitle(fallbackVideo.title);
      setCurrentChannelTitle(fallbackVideo.channelTitle);
      setCurrentDuration(fallbackVideo.duration);
      setFallbackIndex(nextIndex);
      setHasError(false);
    } else {
      // All fallbacks failed
      console.error('All fallback videos failed');
      setHasError(true);
    }
  }, [fallbackIndex]);

  const handleError = useCallback((error: string) => {
    console.error('YouTube player error:', error, 'for video:', currentVideoId);
    
    // Don't show alert for fallback attempts
    if (fallbackIndex === -1) {
      console.log('Original video failed, trying fallback videos...');
    }
    
    // Try fallback video
    tryFallbackVideo();
    
    onError?.();
  }, [currentVideoId, fallbackIndex, tryFallbackVideo, onError]);

  const retryOriginalVideo = useCallback(() => {
    setCurrentVideoId(initialVideoId);
    setCurrentTitle(initialTitle);
    setCurrentChannelTitle(initialChannelTitle);
    setCurrentDuration(initialDuration);
    setFallbackIndex(-1);
    setHasError(false);
  }, [initialVideoId, initialTitle, initialChannelTitle, initialDuration]);

  // Show error state if all videos failed
  if (hasError && fallbackIndex >= FALLBACK_VIDEOS.length - 1) {
    return (
      <View style={styles.container}>
        <View style={[styles.playerContainer, styles.errorContainer]}>
          <Text style={styles.errorTitle}>Video Unavailable</Text>
          <Text style={styles.errorMessage}>
            Unable to load video content at this time
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryOriginalVideo}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {initialTitle}
          </Text>
          <View style={styles.videoMeta}>
            <Text style={styles.channelTitle}>{initialChannelTitle}</Text>
            <Text style={styles.duration}>{initialDuration}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* YouTube Player */}
      <View style={styles.playerContainer}>
        <YoutubePlayer
          key={currentVideoId} // Force re-render when video changes
          height={200}
          play={playing}
          videoId={currentVideoId}
          onChangeState={onStateChange}
          onReady={onReady}
          onError={handleError}
          onPlaybackQualityChange={onPlaybackQualityChange}
          webViewStyle={styles.webView}
          webViewProps={{
            androidLayerType: 'hardware',
          }}
          initialPlayerParams={{
            cc_lang_pref: 'en',
            showClosedCaptions: false,
            loop: false,
            controls: true,
            modestbranding: true,
            rel: false,
            iv_load_policy: 3,
          }}
        />
      </View>

      {/* Video Info */}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {currentTitle}
        </Text>
        <View style={styles.videoMeta}>
          <Text style={styles.channelTitle}>{currentChannelTitle}</Text>
          <Text style={styles.duration}>{currentDuration}</Text>
        </View>
        
        {/* Show fallback indicator if using fallback video */}
        {fallbackIndex >= 0 && (
          <View style={styles.fallbackIndicator}>
            <Text style={styles.fallbackText}>
              📺 Showing alternative F1 content
            </Text>
            <TouchableOpacity onPress={retryOriginalVideo}>
              <Text style={styles.retryText}>Try original video</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A36',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  playerContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    position: 'relative',
  },
  webView: {
    backgroundColor: '#000',
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  errorTitle: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#E10600',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 18,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
  fallbackIndicator: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(225, 6, 0, 0.1)',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#E10600',
  },
  fallbackText: {
    fontSize: 12,
    color: '#E10600',
    fontWeight: '500',
    marginBottom: 4,
  },
  retryText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
}); 