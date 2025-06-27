// F1 Data Service for PitSnap React Native App
// Connects to the Paddock AI backend to fetch F1 data
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "http://10.0.0.210:8000";  // For physical phone on local network
// const API_URL = "http://127.0.0.1:8000";  // For simulator only

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_PREFIX = 'f1_data_cache_';

// Request deduplication map
const ongoingRequests = new Map<string, Promise<any>>();

export interface F1Event {
  round: number;
  name: string;
  location: string;
  country: string;
  date: string;
  is_upcoming: boolean;
  circuit: string;
}

export interface F1Schedule {
  season: number;
  events: F1Event[];
  total_rounds: number;
}

export interface F1NextRace {
  round: number;
  name: string;
  location: string;
  country: string;
  date: string;
  days_until: number;
}

export interface F1RaceResult {
  position: number;
  driver: string;
  team: string;
  time: string;
  points: number;
}

export interface F1LatestResults {
  race: string;
  date: string;
  results?: F1RaceResult[];
  message?: string;
  error?: string;
}

export interface PitWallData {
  schedule: F1Schedule;
  next_race: F1NextRace;
  latest_results: F1LatestResults;
  timestamp: string;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Service for fetching F1 data from the Paddock AI backend with caching
 */
class F1DataService {
  
  /**
   * Cache management utilities
   */
  private async setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        // Cache expired, remove it
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      return null;
    }
  }

  private async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Generic API request with caching and deduplication
   */
  private async fetchWithCache<T>(
    endpoint: string, 
    cacheKey: string, 
    ttl: number = CACHE_TTL
  ): Promise<T> {
    // Check cache first
    const cached = await this.getCache<T>(cacheKey);
    if (cached) {
      console.log(`🟢 Cache hit for ${endpoint}`);
      return cached;
    }

    // Check if request is already in progress (deduplication)
    if (ongoingRequests.has(cacheKey)) {
      console.log(`🟡 Deduplicating request for ${endpoint}`);
      return ongoingRequests.get(cacheKey);
    }

    // Make the request
    const requestPromise = this.makeRequest<T>(endpoint);
    ongoingRequests.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      
      // Cache the result
      await this.setCache(cacheKey, data, ttl);
      console.log(`🔵 Cached result for ${endpoint}`);
      
      return data;
    } finally {
      // Clean up ongoing request
      ongoingRequests.delete(cacheKey);
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    console.log(`🔴 API request to ${endpoint}`);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get the 2025 F1 race schedule
   */
  async getSchedule(): Promise<F1Schedule> {
    return this.fetchWithCache<F1Schedule>('/f1/schedule', 'schedule', 30 * 60 * 1000); // 30 min cache
  }

  /**
   * Get information about the next upcoming race
   */
  async getNextRace(): Promise<F1NextRace> {
    return this.fetchWithCache<F1NextRace>('/f1/next-race', 'next_race', 60 * 60 * 1000); // 1 hour cache
  }

  /**
   * Get results from the most recent completed race
   */
  async getLatestResults(): Promise<F1LatestResults> {
    return this.fetchWithCache<F1LatestResults>('/f1/latest-results', 'latest_results', 15 * 60 * 1000); // 15 min cache
  }

  /**
   * Get current F1 driver standings
   */
  async getStandings(): Promise<F1LatestResults> {
    return this.fetchWithCache<F1LatestResults>('/f1/standings', 'standings', 30 * 60 * 1000); // 30 min cache
  }

  /**
   * Get all data needed for Pit Wall (OPTIMIZED BATCH REQUEST)
   */
  async getPitWallData(): Promise<PitWallData> {
    console.log("🏎️ Fetching Pit Wall data (batch optimized)...");
    
    try {
      // Use Promise.all for parallel requests with caching
      const [schedule, nextRace, latestResults] = await Promise.all([
        this.getSchedule(),
        this.getNextRace(),
        this.getLatestResults(),
      ]);

      const pitWallData: PitWallData = {
        schedule,
        next_race: nextRace,
        latest_results: latestResults,
        timestamp: new Date().toISOString(),
      };

      // Cache the complete pit wall data for quick subsequent loads
      await this.setCache('pit_wall_complete', pitWallData, 10 * 60 * 1000); // 10 min cache

      console.log("✅ Pit Wall data fetched and cached successfully");
      return pitWallData;

    } catch (error) {
      console.error("❌ Error fetching pit wall data:", error);
      
      // Try to return cached complete data as fallback
      const cachedComplete = await this.getCache<PitWallData>('pit_wall_complete');
      if (cachedComplete) {
        console.log("🟡 Returning cached complete pit wall data as fallback");
        return cachedComplete;
      }
      
      throw new Error("Failed to fetch pit wall data");
    }
  }

  /**
   * Force refresh data (bypasses cache)
   */
  async forceRefresh(): Promise<void> {
    console.log("🔄 Force refreshing F1 data...");
    await this.clearCache();
    ongoingRequests.clear();
  }

  /**
   * Test connection to F1 data service
   */
  async testConnection(): Promise<boolean> {
    try {
      const nextRace = await this.getNextRace();
      console.log("✅ F1 Data Service connection test successful");
      console.log(`   Next race: ${nextRace.name} in ${nextRace.days_until} days`);
      return true;
    } catch (error) {
      console.error("❌ F1 Data Service connection test failed:", error);
      return false;
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  async getCacheStats(): Promise<{ totalCacheItems: number; cacheKeys: string[] }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      return {
        totalCacheItems: cacheKeys.length,
        cacheKeys: cacheKeys.map(key => key.replace(CACHE_PREFIX, ''))
      };
    } catch (error) {
      return { totalCacheItems: 0, cacheKeys: [] };
    }
  }
}

// Export singleton instance
export const f1DataService = new F1DataService();

// Export default
export default f1DataService; 