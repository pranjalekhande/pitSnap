import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StoryCarousel from '../StoryCarousel';
import digestService, { type DailyDigest } from '../../../services/digestService';
import videoContentService, { type VideoSection } from '../../../services/videoContentService';
import YouTubePlayerComponent from '../../common/YouTubePlayer';
import { type PitWallData } from '../../../services/f1DataService';

interface FeedTabProps {
  friendsWithStories: any[];
  myStories: any[];
  pitWallData: PitWallData | null;
  storiesLoading: boolean;
  navigation: any;
  user: any;
  onRefresh: () => void;
  refreshing: boolean;
}

// Skeleton loading for story carousel
const SkeletonStoryCarousel = () => (
  <View style={styles.storyCarouselContainer}>
    <View style={styles.skeletonStoryCircle} />
    <View style={styles.skeletonStoryCircle} />
    <View style={styles.skeletonStoryCircle} />
    <View style={styles.skeletonStoryCircle} />
  </View>
);

// Skeleton loading for daily digest
const SkeletonDigest = () => (
  <View style={styles.digestCard}>
    <View style={[styles.skeletonLine, { width: '60%', height: 20, marginBottom: 12 }]} />
    <View style={[styles.skeletonLine, { width: '90%', height: 16, marginBottom: 8 }]} />
    <View style={[styles.skeletonLine, { width: '80%', height: 16, marginBottom: 8 }]} />
    <View style={[styles.skeletonLine, { width: '70%', height: 16 }]} />
  </View>
);

export default function FeedTab({
  friendsWithStories,
  myStories,
  pitWallData,
  storiesLoading,
  navigation,
  user,
  onRefresh,
  refreshing
}: FeedTabProps) {
  const [dailyDigest, setDailyDigest] = useState<DailyDigest | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [videoSections, setVideoSections] = useState<VideoSection[]>([]);

  // Generate daily digest and video content when pitWallData is available
  useEffect(() => {
    if (pitWallData) {
      if (!dailyDigest && !digestLoading) {
        generateDigest();
      }
      // Generate video content based on current F1 data
      const generateVideos = async () => {
        try {
          const videos = await videoContentService.generateVideoContent(pitWallData);
          setVideoSections(videos);
        } catch (error) {
          console.error('Error generating video content:', error);
        }
      };
      generateVideos();
    }
  }, [pitWallData]);

  const generateDigest = async () => {
    if (!pitWallData) return;
    
    try {
      setDigestLoading(true);
      const digest = await digestService.generateDailyDigest(pitWallData);
      setDailyDigest(digest);
    } catch (error) {
      console.error('Failed to generate digest:', error);
    } finally {
      setDigestLoading(false);
    }
  };

  const handleAskAI = (query: string) => {
    navigation.navigate('AskPaddock', { initialQuery: query });
  };

  const feedItems = [
    {
      id: 'story_carousel',
      type: 'story_carousel',
      data: { friendsWithStories, myStories }
    },
    {
      id: 'daily_digest',
      type: 'daily_digest',
      data: dailyDigest
    },
    // Add video sections dynamically
    ...videoSections.map(section => ({
      id: `video_section_${section.id}`,
      type: 'video_section',
      data: section
    }))
  ];

  const renderFeedItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'story_carousel':
        if (storiesLoading) {
          return <SkeletonStoryCarousel />;
        }
        return (
          <StoryCarousel
            friendsWithStories={item.data.friendsWithStories}
            myStories={item.data.myStories}
            navigation={navigation}
            user={user}
          />
        );
      
      case 'daily_digest':
        if (digestLoading || !item.data) {
          return <SkeletonDigest />;
        }
        
        const digest = item.data as DailyDigest;
        return (
          <View style={styles.digestCard}>
            <Text style={styles.digestTitle}>📰 Daily F1 Digest</Text>
            <Text style={styles.digestGreeting}>{digest.greeting}</Text>
            
            <View style={styles.digestContent}>
              {digest.headlines.map((headline, index) => (
                <Text key={index} style={styles.digestHeadline}>
                  • {headline}
                </Text>
              ))}
            </View>
            
            <Text style={styles.digestInsight}>
              {digest.championship_insight}
            </Text>
            
            <Text style={styles.digestPreview}>
              {digest.next_race_preview}
            </Text>
            
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={() => handleAskAI('Tell me more about the current F1 championship battle and upcoming races')}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color="#E10600" />
              <Text style={styles.aiButtonText}>Ask AI about F1 news</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'video_section':
        const videoSection = item.data as VideoSection;
        return (
          <View style={styles.videoSectionCard}>
            <View style={styles.videoSectionHeader}>
              <Text style={styles.videoSectionIcon}>{videoSection.icon}</Text>
              <View style={styles.videoSectionTitleContainer}>
                <Text style={styles.videoSectionTitle}>{videoSection.title}</Text>
                <Text style={styles.videoSectionSubtitle}>{videoSection.subtitle}</Text>
              </View>
            </View>
            
            {/* Video Grid */}
            <View style={styles.videoGrid}>
              {videoSection.videos.slice(0, 1).map((video, index) => (
                <View key={video.id}>
                  {/* YouTube Player */}
                  <YouTubePlayerComponent
                    videoId={video.id}
                    title={video.title}
                    channelTitle={video.views || 'F1 Official'}
                    duration={video.duration}
                                      onError={() => {
                    console.error('YouTube player error:', { title: video.title, id: video.id });
                  }}
                  />
                  
                  {/* Debug Info - Minimal */}
                  <View style={styles.debugInfoMinimal}>
                    <Text style={styles.debugTextSmall}>Video ID: {video.id}</Text>
                    <TouchableOpacity 
                      style={styles.debugButtonSmall}
                      onPress={async () => {
                        const url = `https://youtube.com/watch?v=${video.id}`;
                        const { Linking } = require('react-native');
                        try {
                          await Linking.openURL(url);
                        } catch (error) {
                          console.error('Failed to open YouTube URL:', error);
                        }
                      }}
                    >
                      <Text style={styles.debugButtonTextSmall}>Open in YouTube</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={() => handleAskAI(videoSection.askAiQuery)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color="#E10600" />
              <Text style={styles.aiButtonText}>Ask AI about this content</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={feedItems}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              onRefresh();
              // Regenerate digest and video content on refresh
              if (pitWallData) {
                setDailyDigest(null);
                generateDigest();
                // Regenerate video content
                const generateVideos = async () => {
                  try {
                    const videos = await videoContentService.generateVideoContent(pitWallData);
                    setVideoSections(videos);
                  } catch (error) {
                    console.error('Error generating video content:', error);
                  }
                };
                generateVideos();
              }
            }}
            tintColor="#FFFFFF"
          />
        }
        ListEmptyComponent={
          !storiesLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📺</Text>
              <Text style={styles.emptyTitle}>Your Feed</Text>
              <Text style={styles.emptyText}>
                Stories and F1 content will appear here
              </Text>
            </View>
          ) : (
            <SkeletonStoryCarousel />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151E',
  },
  // Daily Digest Card Styles
  digestCard: {
    backgroundColor: '#1E1E28',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E10600',
  },
  digestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E10600',
    marginBottom: 8,
  },
  digestGreeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  digestContent: {
    marginBottom: 12,
  },
  digestHeadline: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
    lineHeight: 20,
  },
  digestInsight: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00FF88',
    marginBottom: 8,
  },
  digestPreview: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 16,
  },
  // AI Button Styles
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 6, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E10600',
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E10600',
    marginLeft: 6,
  },
  // Existing Styles
  placeholderCard: {
    backgroundColor: '#1E1E28',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  placeholderContent: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
  // Skeleton styles
  storyCarouselContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E28',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
  },
  skeletonStoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A2A36',
    marginRight: 15,
  },
  skeletonLine: {
    backgroundColor: '#2A2A36',
    borderRadius: 4,
  },
  // Video Section Styles
  videoSectionCard: {
    backgroundColor: '#1E1E28',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  videoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoSectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  videoSectionTitleContainer: {
    flex: 1,
  },
  videoSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  videoSectionSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  videoGrid: {
    marginBottom: 16,
  },
  videoCard: {
    marginBottom: 12,
    backgroundColor: '#2A2A36',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    height: 120,
    backgroundColor: '#15151E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoThumbnailEmoji: {
    fontSize: 32,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 18,
  },
  videoMeta: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  debugVideoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugInfo: {
    flex: 1,
    marginRight: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  debugButton: {
    backgroundColor: 'rgba(225, 6, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E10600',
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E10600',
  },
  debugInfoMinimal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  debugTextSmall: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  debugButtonSmall: {
    backgroundColor: 'rgba(225, 6, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E10600',
  },
  debugButtonTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E10600',
  },
}); 