import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  channelTitle: string;
  duration: string;
  onError?: () => void;
}

export default function YouTubePlayerComponent({
  videoId,
  title,
  channelTitle,
  duration,
  onError
}: YouTubePlayerProps) {
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const onReady = useCallback(() => {
    console.log('YouTube player ready for video:', videoId);
  }, [videoId]);

  const onPlaybackQualityChange = useCallback((quality: string) => {
    console.log('YouTube playback quality changed to:', quality);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('YouTube player error:', error);
    Alert.alert(
      'Video Error',
      'There was an issue playing this video. Please try again later.',
      [{ text: 'OK' }]
    );
    onError?.();
  }, [onError]);

  return (
    <View style={styles.container}>
      {/* YouTube Player */}
      <View style={styles.playerContainer}>
        <YoutubePlayer
          height={200}
          play={playing}
          videoId={videoId}
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
          {title}
        </Text>
        <View style={styles.videoMeta}>
          <Text style={styles.channelTitle}>{channelTitle}</Text>
          <Text style={styles.duration}>{duration}</Text>
        </View>
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
  },
  webView: {
    backgroundColor: '#000',
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
}); 