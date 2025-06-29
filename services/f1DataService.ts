// F1 Data Service for PitSnap React Native App
// Connects to the Paddock AI backend to fetch F1 data
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.0.210:8000';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface F1Event {
  round: number;
  name: string;
  status: 'completed' | 'current' | 'upcoming';
  is_live?: boolean;
  live_session?: string;
  cache_ttl?: number;
  next_session?: string;
  next_session_time?: string;
}

class F1DataService {
  private cache: Map<string, CacheEntry> = new Map();
  private requestCache: Map<string, Promise<any>> = new Map();

  // Multi-tier caching with context-aware TTL
  private getCacheTTL(cacheKey: string, contextData?: any): number {
    // If we have context data with cache_ttl recommendation, use it
    if (contextData?.cache_ttl) {
      return contextData.cache_ttl * 1000; // Convert seconds to milliseconds
    }

    // Fallback TTL based on data type
    const cacheConfig = {
      'standings': 30000,           // 30 seconds - frequently updated
      'next-race': 300000,          // 5 minutes - schedule changes
      'schedule': 1800000,          // 30 minutes - relatively stable
      'results': 300000,            // 5 minutes - post-race updates
      'basic-data': 30000,          // 30 seconds - instant responses
      'pit-wall-data': 60000,       // 1 minute - dashboard data
      'schedule-with-timing': 60000, // 1 minute - enhanced schedule
      'current-race-info': 30000,   // 30 seconds - live race data
      'next-race-info': 300000,     // 5 minutes - upcoming race details
    };

    // Extract base key from cache key
    const baseKey = cacheKey.split('?')[0];
    return cacheConfig[baseKey as keyof typeof cacheConfig] || 300000; // Default 5 minutes
  }

  private async getCachedData(key: string): Promise<any | null> {
    // Check memory cache first
    const memoryEntry = this.cache.get(key);
    if (memoryEntry && Date.now() - memoryEntry.timestamp < memoryEntry.ttl) {
      console.log(`📱 Memory cache hit: ${key}`);
      return memoryEntry.data;
    }

    // Check AsyncStorage cache
    try {
      const cached = await AsyncStorage.getItem(`f1_cache_${key}`);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        if (Date.now() - entry.timestamp < entry.ttl) {
          console.log(`💾 Storage cache hit: ${key}`);
          // Also store in memory cache for faster access
          this.cache.set(key, entry);
          return entry.data;
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    return null;
  }

  private async setCachedData(key: string, data: any, customTtl?: number): Promise<void> {
    const ttl = customTtl || this.getCacheTTL(key, data);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory cache
    this.cache.set(key, entry);

    // Store in AsyncStorage
    try {
      await AsyncStorage.setItem(`f1_cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    // Request deduplication - prevent multiple identical requests
    const requestKey = endpoint;
    if (this.requestCache.has(requestKey)) {
      console.log(`🔄 Request deduplication: ${endpoint}`);
      return this.requestCache.get(requestKey);
    }

    const requestPromise = fetch(`${API_BASE_URL}${endpoint}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .finally(() => {
        // Remove from request cache when complete
        this.requestCache.delete(requestKey);
      });

    this.requestCache.set(requestKey, requestPromise);
    return requestPromise;
  }

  // Enhanced methods with timing support

  async getScheduleWithTiming(): Promise<any> {
    const cacheKey = 'schedule-with-timing';
    
    // Try cache first
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('🏁 Fetching enhanced F1 schedule with timing...');
      const data = await this.makeRequest('/f1/schedule-with-timing');
      
      // Cache with dynamic TTL based on race context
      await this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching schedule with timing:', error);
      throw error;
    }
  }

  async getCurrentRaceInfo(): Promise<any> {
    const cacheKey = 'current-race-info';
    
    // Try cache first
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('🏆 Fetching current race info...');
      const data = await this.makeRequest('/f1/current-race-info');
      
      // Use short cache for current race (could be live)
      const cacheTtl = data.is_live ? 15000 : 60000; // 15s if live, 1min otherwise
      await this.setCachedData(cacheKey, data, cacheTtl);
      return data;
    } catch (error) {
      console.error('Error fetching current race info:', error);
      throw error;
    }
  }

  async getNextRaceInfo(): Promise<any> {
    const cacheKey = 'next-race-info';
    
    // Try cache first
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('⏭️ Fetching next race info with timing...');
      const data = await this.makeRequest('/f1/next-race-info');
      
      // Dynamic cache based on proximity to race
      const daysUntilRace = data.countdown_days || 30;
      const cacheTtl = daysUntilRace < 7 ? 300000 : 1800000; // 5min if <7 days, 30min otherwise
      await this.setCachedData(cacheKey, data, cacheTtl);
      return data;
    } catch (error) {
      console.error('Error fetching next race info:', error);
      throw error;
    }
  }

  async getBasicF1Data(): Promise<any> {
    const cacheKey = 'basic-data';
    
    // Try cache first
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('⚡ Fetching basic F1 data for instant UI...');
      const data = await this.makeRequest('/f1/basic-data');
      
      // Short cache for basic data (30 seconds)
      await this.setCachedData(cacheKey, data, 30000);
      return data;
    } catch (error) {
      console.error('Error fetching basic F1 data:', error);
      throw error;
    }
  }

  // Enhanced Pit Wall data with timing
  async getPitWallData(): Promise<any> {
    const cacheKey = 'pit-wall-data';
    
    // Try cache first
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('🏁 Fetching enhanced Pit Wall data...');
      const data = await this.makeRequest('/f1/pit-wall-data');
      
      // Dynamic cache based on race context
      let cacheTtl = 60000; // Default 1 minute
      
      if (data.current_race?.is_live) {
        cacheTtl = 15000; // 15 seconds during live sessions
      } else if (data.current_race?.status === 'current') {
        cacheTtl = 30000; // 30 seconds during race weekends
      }
      
      await this.setCachedData(cacheKey, data, cacheTtl);
      return data;
    } catch (error) {
      console.error('Error fetching pit wall data:', error);
      throw error;
    }
  }

  // Existing methods with enhanced caching

  async getDriverStandings(): Promise<any> {
    const cacheKey = 'standings';
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('🏆 Fetching F1 driver standings...');
      const data = await this.makeRequest('/f1/standings');
      await this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching driver standings:', error);
      throw error;
    }
  }

  async getNextRace(): Promise<any> {
    const cacheKey = 'next-race';
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('⏭️ Fetching next F1 race...');
      const data = await this.makeRequest('/f1/next-race');
      await this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching next race:', error);
      throw error;
    }
  }

  async getSchedule(): Promise<any> {
    const cacheKey = 'schedule';
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📅 Fetching F1 schedule...');
      const data = await this.makeRequest('/f1/schedule');
      await this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching F1 schedule:', error);
      throw error;
    }
  }

  async getLatestResults(): Promise<any> {
    const cacheKey = 'results';
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('🏁 Fetching latest F1 results...');
      const data = await this.makeRequest('/f1/latest-results');
      await this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching latest results:', error);
      throw error;
    }
  }

  // Cache management utilities

  async clearCache(): Promise<void> {
    try {
      // Clear memory cache
      this.cache.clear();
      
      // Clear AsyncStorage cache
      const keys = await AsyncStorage.getAllKeys();
      const f1CacheKeys = keys.filter(key => key.startsWith('f1_cache_'));
      await AsyncStorage.multiRemove(f1CacheKeys);
      
      console.log('🧹 F1 cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const f1CacheKeys = keys.filter(key => key.startsWith('f1_cache_'));
      
      const stats = {
        memoryCache: this.cache.size,
        storageCache: f1CacheKeys.length,
        activeRequests: this.requestCache.size,
        cacheKeys: Array.from(this.cache.keys())
      };
      
      console.log('📊 Cache stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  // Preload critical data for instant UI
  async preloadCriticalData(): Promise<void> {
    try {
      console.log('🚀 Preloading critical F1 data...');
      
      // Load basic data first for instant UI responses
      await this.getBasicF1Data();
      
      // Load enhanced data in parallel
      await Promise.all([
        this.getCurrentRaceInfo(),
        this.getNextRaceInfo(),
        this.getDriverStandings()
      ]);
      
      console.log('✅ Critical F1 data preloaded');
    } catch (error) {
      console.error('Error preloading critical data:', error);
    }
  }
}

export const f1DataService = new F1DataService();
export default f1DataService; 