import { PitWallData } from './f1DataService';

export interface F1VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  category: 'highlights' | 'onboard' | 'technical' | 'circuit-guide' | 'classic';
  videoUrl?: string; // YouTube URL or F1 TV link
  isYouTube: boolean;
  uploadDate: string;
  views?: string;
  tags: string[];
  relatedTo?: string; // Race name, driver, or track
}

export interface VideoSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  videos: F1VideoContent[];
  askAiQuery: string;
}

class VideoContentService {
  /**
   * Generate video content based on current F1 data context
   */
  async generateVideoContent(pitWallData: PitWallData): Promise<VideoSection[]> {
    const sections: VideoSection[] = [];

    // Section 1: Latest Race Highlights
    if (pitWallData.latest_results?.race) {
      const videos = await this.getRecentRaceHighlights(pitWallData.latest_results.race);
      sections.push({
        id: 'recent_highlights',
        title: '🏁 Latest Race Action',
        subtitle: `${pitWallData.latest_results.race} highlights and key moments`,
        icon: '🎬',
        videos,
        askAiQuery: `Tell me about the strategy and key moments from ${pitWallData.latest_results.race}`
      });
    }

    // Section 2: Upcoming Race Preview
    if (pitWallData.next_race) {
      const previewVideos = await this.getUpcomingRaceContent(pitWallData.next_race.name, pitWallData.next_race.location);
      sections.push({
        id: 'race_preview',
        title: '🏎️ Next Race Preview',
        subtitle: `Get ready for ${pitWallData.next_race.name}`,
        icon: '🔮',
        videos: previewVideos,
        askAiQuery: `What should I expect from ${pitWallData.next_race.name} at ${pitWallData.next_race.location}?`
      });
    }

    // Section 3: Driver Spotlights
    if (pitWallData.championship_standings?.drivers) {
      const topDriver = pitWallData.championship_standings.drivers[0];
      const driverVideos = await this.getDriverContent(topDriver.driver);
      sections.push({
        id: 'driver_focus',
        title: '👨‍🏁 Driver Spotlight',
        subtitle: `Following ${topDriver.driver} and other F1 stars`,
        icon: '⭐',
        videos: driverVideos,
        askAiQuery: `Tell me about ${topDriver.driver}'s driving style and recent performance`
      });
    }

    // Section 4: Technical Deep Dives
    const technicalVideos = await this.getTechnicalContent();
    sections.push({
      id: 'technical',
      title: '🔧 Technical Analysis',
      subtitle: 'Understanding F1 car development and strategies',
      icon: '🛠️',
      videos: technicalVideos,
      askAiQuery: 'Explain the latest F1 technical developments and regulations'
    });

    return sections;
  }

  private async getRecentRaceHighlights(raceName: string): Promise<F1VideoContent[]> {
    try {
      // Use YouTube search for real content
      const youtubeService = await import('./youtubeSearchService');
      const videos = await youtubeService.default.searchVideos(`${raceName} highlights`, 'highlights');
      
      return videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail || '🏁',
        duration: video.duration,
        category: 'highlights' as const,
        videoUrl: `https://youtube.com/watch?v=${video.id}`,
        isYouTube: true,
        uploadDate: 'Recently',
        views: video.channelTitle || 'F1 Content',
        tags: ['race', 'highlights', 'official'],
        relatedTo: raceName
      }));
    } catch (error) {
      console.error('Error fetching race highlights:', error);
      
      // Use enhanced fallback system
      try {
        const youtubeService = await import('./youtubeSearchService');
        const fallbackVideos = await youtubeService.default.getTestedVideos('highlights');
        
        return fallbackVideos.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail || '🏁',
          duration: video.duration,
          category: 'highlights' as const,
          videoUrl: `https://youtube.com/watch?v=${video.id}`,
          isYouTube: true,
          uploadDate: 'Recently',
          views: video.channelTitle,
          tags: ['race', 'highlights'],
          relatedTo: raceName
        }));
      } catch (fallbackError) {
        console.error('Fallback videos also failed:', fallbackError);
        
        // Last resort: return minimal safe content
        return [
          {
            id: 'Y2J11XHAQiU',
            title: `${raceName} Race Highlights`,
            description: 'F1 race content and analysis',
            thumbnail: '🏁',
            duration: '5:00',
            category: 'highlights',
            videoUrl: 'https://youtube.com/watch?v=Y2J11XHAQiU',
            isYouTube: true,
            uploadDate: 'Recently',
            views: 'F1 Channel',
            tags: ['race', 'highlights'],
            relatedTo: raceName
          }
        ];
      }
    }
  }

  private async getUpcomingRaceContent(raceName: string, location: string): Promise<F1VideoContent[]> {
    try {
      // Use YouTube search for real content
      const youtubeService = await import('./youtubeSearchService');
      const videos = await youtubeService.default.searchVideos(`${raceName} preview`, 'technical');
      
      return videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail || '🔮',
        duration: video.duration,
        category: 'technical' as const,
        videoUrl: `https://youtube.com/watch?v=${video.id}`,
        isYouTube: true,
        uploadDate: 'Recently',
        views: 'F1 Official',
        tags: ['preview', 'analysis', 'weekend'],
        relatedTo: raceName
      }));
    } catch (error) {
      console.error('Error fetching race preview content:', error);
      // Return single fallback with real video ID
      return [
        {
          id: 'ScMzIvxBSi4', // Real F1 video ID
          title: `${raceName} Race Preview`,
          description: 'What to expect this weekend',
          thumbnail: '🔮',
          duration: '4:15',
          category: 'technical',
          videoUrl: 'https://youtube.com/watch?v=ScMzIvxBSi4',
          isYouTube: true,
          uploadDate: 'Recently',
          views: 'F1 Official',
          tags: ['preview', 'analysis'],
          relatedTo: raceName
        }
      ];
    }
  }

  private async getDriverContent(driverName: string): Promise<F1VideoContent[]> {
    try {
      // Use YouTube search for real content
      const youtubeService = await import('./youtubeSearchService');
      const videos = await youtubeService.default.searchVideos(`${driverName} highlights`, 'highlights');
      
      return videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail || '👤',
        duration: video.duration,
        category: 'highlights' as const,
        videoUrl: `https://youtube.com/watch?v=${video.id}`,
        isYouTube: true,
        uploadDate: 'Recently',
        views: 'F1 Official',
        tags: ['driver', 'highlights', driverName.toLowerCase().replace(' ', '-')],
        relatedTo: driverName
      }));
    } catch (error) {
      console.error('Error fetching driver content:', error);
      // Return single fallback with real video ID
      return [
        {
          id: 'aqz-KE-bpKQ', // Real F1 video ID
          title: `${driverName} Highlights`,
          description: `Best moments from ${driverName}`,
          thumbnail: '👤',
          duration: '5:42',
          category: 'highlights',
          videoUrl: 'https://youtube.com/watch?v=aqz-KE-bpKQ',
          isYouTube: true,
          uploadDate: 'Recently',
          views: 'F1 Official',
          tags: ['driver', 'highlights'],
          relatedTo: driverName
        }
      ];
    }
  }

  private async getTechnicalContent(): Promise<F1VideoContent[]> {
    try {
      // Use YouTube search for real content
      const youtubeService = await import('./youtubeSearchService');
      const videos = await youtubeService.default.searchVideos('F1 technical analysis', 'technical');
      
      return videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail || '🔧',
        duration: video.duration,
        category: 'technical' as const,
        videoUrl: `https://youtube.com/watch?v=${video.id}`,
        isYouTube: true,
        uploadDate: 'Recently',
        views: 'F1 Official',
        tags: ['technical', 'analysis', 'engineering'],
        relatedTo: 'F1 Technical'
      }));
    } catch (error) {
      console.error('Error fetching technical content:', error);
      // Return single fallback with real video ID
      return [
        {
          id: 'YQHsXMglC9A', // Real F1 video ID
          title: 'F1 Technical Analysis',
          description: 'Understanding F1 car development',
          thumbnail: '🔧',
          duration: '8:15',
          category: 'technical',
          videoUrl: 'https://youtube.com/watch?v=YQHsXMglC9A',
          isYouTube: true,
          uploadDate: 'Recently',
          views: 'F1 Official',
          tags: ['technical', 'analysis'],
          relatedTo: 'F1 Technical'
        }
      ];
    }
  }

  /**
   * Get category icon and color
   */
  getCategoryInfo(category: F1VideoContent['category']): { icon: string; color: string; label: string } {
    const categoryMap = {
      highlights: { icon: '🏁', color: '#E10600', label: 'Highlights' },
      onboard: { icon: '📹', color: '#00FF88', label: 'Onboard' },
      technical: { icon: '🔧', color: '#FFD700', label: 'Technical' },
      'circuit-guide': { icon: '🗺️', color: '#00BFFF', label: 'Circuit Guide' },
      classic: { icon: '⭐', color: '#FF6B35', label: 'Classic' }
    };
    return categoryMap[category];
  }
}

export const videoContentService = new VideoContentService();
export default videoContentService; 