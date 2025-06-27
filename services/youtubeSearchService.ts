import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPENAI_API_KEY, YOUTUBE_API_KEY } from '@env';
import { PitWallData } from './f1DataService';

// Cache configuration
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for video cache
const VIDEO_CACHE_PREFIX = 'youtube_video_cache_';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  channelTitle: string;
  viewCount?: string;
  category: 'highlights' | 'onboard' | 'technical' | 'circuit-guide' | 'classic';
}

export interface SearchContext {
  type: 'latest_race' | 'next_race' | 'driver_spotlight' | 'technical';
  data: any;
  priority: 'high' | 'medium' | 'low';
}

class YouTubeSearchService {
  
  /**
   * Search YouTube for F1 videos using GPT and API integration
   */
  async searchVideos(query: string, category: YouTubeVideo['category'] = 'highlights'): Promise<YouTubeVideo[]> {
    
    try {
      console.log(`🔍 Searching for F1 ${category} videos with query: ${query}`);
      
      // Use GPT to generate optimized search queries
      const context: SearchContext = {
        type: 'latest_race', // Default context, can be customized
        data: { query },
        priority: 'high'
      };
      
      const searchQueries = await this.generateSearchQueries(context);
      console.log('🤖 GPT generated queries:', searchQueries);
      
      // Search YouTube with generated queries
      const allVideos: YouTubeVideo[] = [];
      
      for (const searchQuery of searchQueries) {
        const videos = await this.searchSingleQuery(searchQuery, category);
        allVideos.push(...videos);
      }
      
      // Check embeddability for found videos
      const embeddableVideos = await this.filterEmbeddableVideos(allVideos);
      console.log(`✅ Found ${embeddableVideos.length} embeddable videos out of ${allVideos.length} total`);
      
      // If no embeddable videos found, fall back to known working videos
      if (embeddableVideos.length === 0) {
        console.log('⚠️ No embeddable videos found, using fallback videos');
        return this.getKnownEmbeddableVideos(category);
      }
      
      // Remove duplicates and sort by relevance
      const uniqueVideos = this.deduplicateVideos(embeddableVideos);
      const sortedVideos = this.sortVideosByRelevance(uniqueVideos);
      
      return sortedVideos.slice(0, 2); // Return top 2 videos
      
    } catch (error) {
      console.error('YouTube search error:', error);
      // Fall back to known working embeddable videos
      return this.getKnownEmbeddableVideos(category);
    }
  }

  /**
   * Filter videos to only include embeddable ones
   */
  private async filterEmbeddableVideos(videos: YouTubeVideo[]): Promise<YouTubeVideo[]> {
    const embeddableVideos: YouTubeVideo[] = [];
    
    // Check embeddability in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      const videoIds = batch.map(v => v.id).join(',');
      
      try {
        const videoDetailsUrl = 'https://www.googleapis.com/youtube/v3/videos';
        const params = new URLSearchParams({
          key: YOUTUBE_API_KEY,
          id: videoIds,
          part: 'status,contentDetails,statistics',
        });

        const response = await fetch(`${videoDetailsUrl}?${params.toString()}`);
        
        if (!response.ok) {
          console.warn(`YouTube API error for embeddability check: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        // Check each video's embeddability
        for (const item of data.items || []) {
          const originalVideo = batch.find(v => v.id === item.id);
          if (originalVideo && this.isVideoEmbeddable(item)) {
            // Add duration and other details
            embeddableVideos.push({
              ...originalVideo,
              duration: this.formatDuration(item.contentDetails?.duration || 'PT0S'),
              viewCount: item.statistics?.viewCount || '0',
            });
          }
        }
        
      } catch (error) {
        console.warn('Error checking video embeddability:', error);
        // If API fails, assume videos are embeddable (optimistic approach)
        embeddableVideos.push(...batch);
      }
    }
    
    return embeddableVideos;
  }

  /**
   * Check if a video is embeddable
   */
  private isVideoEmbeddable(videoData: any): boolean {
    const status = videoData.status || {};
    
    // Check if embedding is allowed
    if (status.embeddable === false) {
      return false;
    }
    
    // Check if video is not private/unlisted inappropriately
    if (status.privacyStatus === 'private') {
      return false;
    }
    
    // Check if video is not blocked in major regions
    if (status.uploadStatus !== 'processed') {
      return false;
    }
    
    return true;
  }

  /**
   * Format YouTube duration (PT4M20S -> 4:20)
   */
  private formatDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const minutes = parseInt(match[1] || '0');
    const seconds = parseInt(match[2] || '0');
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get known embeddable F1 videos as fallback
   */
  private getKnownEmbeddableVideos(category: YouTubeVideo['category']): YouTubeVideo[] {
    // These are videos from channels that typically allow embedding
    const knownVideos: { [key: string]: YouTubeVideo[] } = {
      highlights: [
        {
          id: 'Pls_q2aQzHg',
          title: 'F1 Explained - How Racing Works',
          description: 'Educational F1 content explaining racing fundamentals',
          thumbnail: 'https://img.youtube.com/vi/Pls_q2aQzHg/mqdefault.jpg',
          duration: '4:32',
          publishedAt: new Date().toISOString(),
          channelTitle: 'Chain Bear F1',
          category: 'highlights'
        },
        {
          id: 'dNF6sVurAuI',
          title: 'F1 Racing Analysis - Strategy Breakdown',
          description: 'Independent F1 strategy analysis and commentary',
          thumbnail: 'https://img.youtube.com/vi/dNF6sVurAuI/mqdefault.jpg',
          duration: '6:15',
          publishedAt: new Date().toISOString(),
          channelTitle: 'WTF1',
          category: 'highlights'
        }
      ],
      technical: [
        {
          id: 'K2mTbNXM8lY',
          title: 'F1 Car Aerodynamics Explained',
          description: 'Technical breakdown of F1 car aerodynamics',
          thumbnail: 'https://img.youtube.com/vi/K2mTbNXM8lY/mqdefault.jpg',
          duration: '8:42',
          publishedAt: new Date().toISOString(),
          channelTitle: 'Driver61',
          category: 'technical'
        }
      ],
      'circuit-guide': [
        {
          id: 'AjUuEIjWwL8',
          title: 'F1 Track Guide - Circuit Analysis',
          description: 'Complete circuit analysis and racing line guide',
          thumbnail: 'https://img.youtube.com/vi/AjUuEIjWwL8/mqdefault.jpg',
          duration: '5:28',
          publishedAt: new Date().toISOString(),
          channelTitle: 'Autosport',
          category: 'circuit-guide'
        }
      ],
      onboard: [
        {
          id: 'ZQ6p2ooCvd4',
          title: 'F1 Onboard Experience - Driver POV',
          description: 'Onboard perspective and driving analysis',
          thumbnail: 'https://img.youtube.com/vi/ZQ6p2ooCvd4/mqdefault.jpg',
          duration: '3:45',
          publishedAt: new Date().toISOString(),
          channelTitle: 'The Race',
          category: 'onboard'
        }
      ],
      classic: [
        {
          id: 'TtMuZBaAhxw',
          title: 'Classic F1 Moments - Racing History',
          description: 'Historical F1 moments and classic racing content',
          thumbnail: 'https://img.youtube.com/vi/TtMuZBaAhxw/mqdefault.jpg',
          duration: '7:20',
          publishedAt: new Date().toISOString(),
          channelTitle: 'F1 Word',
          category: 'classic'
        }
      ]
    };
    
    return knownVideos[category] || knownVideos.highlights;
  }

  /**
   * Generate AI search queries for F1 content
   */
  async generateSearchQuery(raceName: string, type: 'highlights' | 'preview' | 'technical'): Promise<string> {
    try {
      const prompt = `Generate a YouTube search query for ${raceName} ${type}. Keep it simple and focused on official F1 content.`;
      
      // For now, return basic query
      // TODO: Implement OpenAI integration
      return `${raceName} ${type} F1 official`;
      
    } catch (error) {
      console.error('AI query generation error:', error);
      return `${raceName} ${type} F1`;
    }
  }

  /**
   * Generate AI-powered search queries for F1 content
   */
  async generateSearchQueries(context: SearchContext): Promise<string[]> {
    try {
      const prompt = this.createSearchPrompt(context);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an F1 expert. Generate 2-3 specific YouTube search queries that will find F1 content that is likely to be embeddable.

IMPORTANT: Avoid official "Formula 1" channel content as it's typically blocked from embedding. Focus on:
- Independent F1 analysis channels
- Fan-made F1 content
- F1 news and commentary channels
- Educational F1 content
- F1 simulation and gaming content

Return only the search terms, one per line. Make queries specific to find engaging F1 content.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      const queries = aiResponse
        .split('\n')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0)
        .slice(0, 3);

      return queries;
      
    } catch (error) {
      console.error('Error generating search queries:', error);
      return this.getEmbeddableFallbackQueries(context);
    }
  }

  /**
   * Search YouTube for F1 videos
   */
  async searchYouTubeVideos(queries: string[], category: YouTubeVideo['category']): Promise<YouTubeVideo[]> {
    try {
      // Try cache first
      const cacheKey = `youtube_search_${queries.join('_').replace(/\s+/g, '_').toLowerCase()}`;
      const cached = await this.getFromCache<YouTubeVideo[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const allVideos: YouTubeVideo[] = [];
      
      for (const query of queries) {
        const videos = await this.searchSingleQuery(query, category);
        allVideos.push(...videos);
      }

      // Remove duplicates and sort by relevance
      const uniqueVideos = this.deduplicateVideos(allVideos);
      const sortedVideos = this.sortVideosByRelevance(uniqueVideos);
      const topVideos = sortedVideos.slice(0, 2); // Keep top 2 per context

      // Cache results
      await this.saveToCache(cacheKey, topVideos);
      
      return topVideos;
      
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return this.getMockVideos(category);
    }
  }

  /**
   * Search single YouTube query
   */
  private async searchSingleQuery(query: string, category: YouTubeVideo['category']): Promise<YouTubeVideo[]> {
    const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
    const params = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: '5',
      order: 'relevance',
      publishedAfter: '2024-01-01T00:00:00Z', // Only 2024+ videos
      videoDuration: 'any',
      videoDefinition: 'high'
    });

    const response = await fetch(`${searchUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || '',
      duration: 'N/A', // Would need additional API call for duration
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      category
    })) || [];
  }

  /**
   * Create AI search prompt based on context
   */
  private createSearchPrompt(context: SearchContext): string {
    switch (context.type) {
      case 'latest_race':
        const raceName = context.data?.race || 'latest F1 race';
        return `Generate YouTube search queries for ${raceName} highlights, race recap, and key moments. Focus on official F1 content from 2024.`;

      case 'next_race':
        const nextRace = context.data?.name || 'upcoming F1 race';
        const location = context.data?.location || '';
        return `Generate YouTube search queries for ${nextRace} preview, ${location} circuit guide, and race weekend preparation. Focus on official F1 content.`;

      case 'driver_spotlight':
        const driver = context.data?.driver || 'F1 driver';
        return `Generate YouTube search queries for ${driver} highlights, interviews, and onboard footage from 2024 F1 season.`;

      case 'technical':
        return `Generate YouTube search queries for F1 2024 technical analysis, car development, strategy breakdown, and rule changes.`;

      default:
        return 'Generate YouTube search queries for F1 2024 highlights and best moments.';
    }
  }

  /**
   * Fallback search queries when AI fails - focus on embeddable content
   */
  private getEmbeddableFallbackQueries(context: SearchContext): string[] {
    switch (context.type) {
      case 'latest_race':
        return [
          'F1 2024 race analysis highlights',
          'Formula 1 race breakdown commentary',
          'F1 race review independent analysis'
        ];
      case 'next_race':
        return [
          'F1 2024 race preview analysis',
          'Formula 1 circuit guide walkthrough',
          'F1 race weekend preview commentary'
        ];
      case 'driver_spotlight':
        return [
          'F1 2024 driver analysis comparison',
          'Formula 1 driver performance review',
          'F1 driver skills breakdown'
        ];
      case 'technical':
        return [
          'F1 2024 technical analysis explained',
          'Formula 1 car development breakdown',
          'F1 engineering analysis tutorial'
        ];
      default:
        return [
          'F1 2024 analysis highlights',
          'Formula 1 educational content',
          'F1 racing explained'
        ];
    }
  }

  /**
   * Remove duplicate videos
   */
  private deduplicateVideos(videos: YouTubeVideo[]): YouTubeVideo[] {
    const seen = new Set<string>();
    return videos.filter(video => {
      if (seen.has(video.id)) {
        return false;
      }
      seen.add(video.id);
      return true;
    });
  }

  /**
   * Sort videos by relevance (prioritize embeddable channels)
   */
  private sortVideosByRelevance(videos: YouTubeVideo[]): YouTubeVideo[] {
    // Channels that are more likely to allow embedding
    const embeddableChannels = [
      'WTF1', 'Chain Bear F1', 'Driver61', 'Tommo F1', 'The Race',
      'Autosport', 'Peter Windsor', 'F1 Word', 'Aldas', 'FormulaNerd'
    ];
    
    // Channels that typically block embedding (avoid these)
    const blockingChannels = ['Formula 1', 'F1', 'FIA', 'Formula One Management'];
    
    return videos.sort((a, b) => {
      // Deprioritize known blocking channels
      const aBlocking = blockingChannels.some(channel => 
        a.channelTitle.toLowerCase().includes(channel.toLowerCase())
      );
      const bBlocking = blockingChannels.some(channel => 
        b.channelTitle.toLowerCase().includes(channel.toLowerCase())
      );
      
      if (aBlocking && !bBlocking) return 1;
      if (!aBlocking && bBlocking) return -1;
      
      // Prioritize known embeddable channels
      const aEmbeddable = embeddableChannels.some(channel => 
        a.channelTitle.toLowerCase().includes(channel.toLowerCase())
      );
      const bEmbeddable = embeddableChannels.some(channel => 
        b.channelTitle.toLowerCase().includes(channel.toLowerCase())
      );
      
      if (aEmbeddable && !bEmbeddable) return -1;
      if (!aEmbeddable && bEmbeddable) return 1;
      
      // Then by publish date (newer first)
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  /**
   * Cache management
   */
  private async saveToCache<T>(key: string, data: T): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      };
      await AsyncStorage.setItem(VIDEO_CACHE_PREFIX + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache YouTube data:', error);
    }
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(VIDEO_CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const now = Date.now();
      
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        await AsyncStorage.removeItem(VIDEO_CACHE_PREFIX + key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read YouTube cache:', error);
      return null;
    }
  }

  /**
   * Mock videos for fallback
   */
  private getMockVideos(category: YouTubeVideo['category']): YouTubeVideo[] {
    return [
      {
        id: 'YQHsXMglC9A', // Safe F1 fallback video
        title: `F1 ${category} - Content Loading`,
        description: 'F1 video content will load here',
        thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/mqdefault.jpg',
        duration: '3:30',
        publishedAt: new Date().toISOString(),
        channelTitle: 'Formula 1',
        category
      }
    ];
  }

  /**
   * Main method to get videos for pit wall context
   */
  async getVideosForContext(pitWallData: PitWallData): Promise<{ [key: string]: YouTubeVideo[] }> {
    const contexts: SearchContext[] = [];
    
    // Latest race context
    if (pitWallData.latest_results?.race) {
      contexts.push({
        type: 'latest_race',
        data: pitWallData.latest_results,
        priority: 'high'
      });
    }
    
    // Next race context
    if (pitWallData.next_race) {
      contexts.push({
        type: 'next_race',
        data: pitWallData.next_race,
        priority: 'high'
      });
    }
    
    // Driver spotlight context
    if (pitWallData.championship_standings?.drivers?.[0]) {
      contexts.push({
        type: 'driver_spotlight',
        data: pitWallData.championship_standings.drivers[0],
        priority: 'medium'
      });
    }
    
    // Technical context
    contexts.push({
      type: 'technical',
      data: {},
      priority: 'low'
    });

    const results: { [key: string]: YouTubeVideo[] } = {};
    
    // Process each context
    for (const context of contexts) {
      try {
        const queries = await this.generateSearchQueries(context);
        const categoryMap: { [key: string]: YouTubeVideo['category'] } = {
          'latest_race': 'highlights',
          'next_race': 'circuit-guide',
          'driver_spotlight': 'onboard',
          'technical': 'technical'
        };
        
        const videos = await this.searchYouTubeVideos(queries, categoryMap[context.type]);
        results[context.type] = videos;
        
      } catch (error) {
        console.error(`Error processing context ${context.type}:`, error);
        results[context.type] = this.getMockVideos('highlights');
      }
    }
    
    return results;
  }
}

export const youtubeSearchService = new YouTubeSearchService();
export default youtubeSearchService; 