// Enhanced Paddock AI Service with Performance Optimizations
// Multi-tier caching, request deduplication, and context-aware TTL
import AsyncStorage from '@react-native-async-storage/async-storage';
import { f1DataService } from './f1DataService';

// NOTE: In a real production app, you would use environment variables
// to switch between a local dev URL and a live production URL.

// Choose based on your testing method:
const API_URL = "http://10.0.0.210:8000";  // For physical phone on local network
// const API_URL = "http://127.0.0.1:8000";  // For simulator only

interface Message {
  text: string;
  isUser: boolean;
}

interface CacheEntry {
  data: string;
  timestamp: number;
  ttl: number;
  questionHash: string;
}

interface QuestionContext {
  type: 'next-race' | 'standings' | 'results' | 'general' | 'historical' | 'strategy';
  cacheable: boolean;
  ttl: number;
}

class PaddockAiService {
  private cache: Map<string, CacheEntry> = new Map();
  private requestCache: Map<string, Promise<string>> = new Map();
  private f1DataCache: any = null;
  private f1DataTimestamp: number = 0;

  // Analyze question to determine caching strategy
  private analyzeQuestion(question: string): QuestionContext {
    const lowerQuestion = question.toLowerCase();
    
    // Next race related
    if (lowerQuestion.includes('next race') || 
        lowerQuestion.includes('upcoming') || 
        lowerQuestion.includes('canadian gp') ||
        lowerQuestion.includes('next grand prix')) {
      return { type: 'next-race', cacheable: true, ttl: 300000 }; // 5 minutes
    }
    
    // Current standings
    if (lowerQuestion.includes('standings') || 
        lowerQuestion.includes('championship') || 
        lowerQuestion.includes('points') ||
        lowerQuestion.includes('rankings')) {
      return { type: 'standings', cacheable: true, ttl: 180000 }; // 3 minutes
    }
    
    // Latest results
    if (lowerQuestion.includes('winner') || 
        lowerQuestion.includes('results') || 
        lowerQuestion.includes('latest gp') ||
        lowerQuestion.includes('last race')) {
      return { type: 'results', cacheable: true, ttl: 600000 }; // 10 minutes
    }
    
    // Historical/strategy questions - longer cache
    if (lowerQuestion.includes('history') || 
        lowerQuestion.includes('strategy') || 
        lowerQuestion.includes('what-if') ||
        lowerQuestion.includes('rain strategy') ||
        lowerQuestion.includes('tire strategy')) {
      return { type: 'historical', cacheable: true, ttl: 1800000 }; // 30 minutes
    }

    // Strategy analysis - medium cache
    if (lowerQuestion.includes('analysis') || 
        lowerQuestion.includes('spanish gp') || 
        lowerQuestion.includes('verstappen')) {
      return { type: 'strategy', cacheable: true, ttl: 900000 }; // 15 minutes
    }
    
    // General questions - shorter cache
    return { type: 'general', cacheable: true, ttl: 120000 }; // 2 minutes
  }

  // Create cache key from question and context
  private createCacheKey(question: string, chatHistory: Message[]): string {
    // Create a simple hash from the question (normalize whitespace and case)
    const normalizedQuestion = question.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // For very specific questions, include some chat context
    const contextString = chatHistory.length > 0 ? 
      chatHistory.slice(-2).map(m => m.text.substring(0, 50)).join('|') : '';
    
    // Simple hash function
    const hashInput = `${normalizedQuestion}${contextString}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `paddock_${Math.abs(hash)}`;
  }

  private async getCachedResponse(key: string): Promise<string | null> {
    // Check memory cache first
    const memoryEntry = this.cache.get(key);
    if (memoryEntry && Date.now() - memoryEntry.timestamp < memoryEntry.ttl) {
      console.log(`🧠 Paddock memory cache hit: ${key}`);
      return memoryEntry.data;
    }

    // Check AsyncStorage cache
    try {
      const cached = await AsyncStorage.getItem(`paddock_cache_${key}`);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        if (Date.now() - entry.timestamp < entry.ttl) {
          console.log(`💾 Paddock storage cache hit: ${key}`);
          // Also store in memory cache for faster access
          this.cache.set(key, entry);
          return entry.data;
        }
      }
    } catch (error) {
      console.warn('Paddock cache read error:', error);
    }

    return null;
  }

  private async setCachedResponse(key: string, response: string, ttl: number, questionHash: string): Promise<void> {
    const entry: CacheEntry = {
      data: response,
      timestamp: Date.now(),
      ttl,
      questionHash
    };

    // Store in memory cache
    this.cache.set(key, entry);

    // Store in AsyncStorage
    try {
      await AsyncStorage.setItem(`paddock_cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Paddock cache write error:', error);
    }
  }

  // Preload F1 data for enhanced responses
  private async preloadF1Context(): Promise<void> {
    // Only refresh F1 data if it's older than 5 minutes
    if (Date.now() - this.f1DataTimestamp < 300000 && this.f1DataCache) {
      return;
    }

    try {
      console.log('🏁 Preloading F1 context for faster Paddock responses...');
      
      // Load critical F1 data in parallel
      const [nextRace, standings, currentRace] = await Promise.all([
        f1DataService.getNextRaceInfo().catch(() => null),
        f1DataService.getDriverStandings().catch(() => null),
        f1DataService.getCurrentRaceInfo().catch(() => null)
      ]);

      this.f1DataCache = {
        nextRace,
        standings,
        currentRace,
        timestamp: Date.now()
      };
      this.f1DataTimestamp = Date.now();
      
      console.log('✅ F1 context preloaded for Paddock AI');
    } catch (error) {
      console.warn('Failed to preload F1 context:', error);
    }
  }

  // Enhanced context preparation
  private prepareEnhancedContext(question: string, chatHistory: Message[]): any {
    const context: any = {
      question,
      chat_history: chatHistory
    };

    // Add F1 data context if available and relevant
    if (this.f1DataCache) {
      const questionType = this.analyzeQuestion(question);
      
      if (questionType.type === 'next-race' && this.f1DataCache.nextRace) {
        context.next_race_context = this.f1DataCache.nextRace;
      }
      
      if (questionType.type === 'standings' && this.f1DataCache.standings) {
        context.standings_context = this.f1DataCache.standings;
      }
      
      if (questionType.type === 'results' && this.f1DataCache.currentRace) {
        context.current_race_context = this.f1DataCache.currentRace;
      }
    }

    return context;
  }

  async askPaddock(question: string, chatHistory: Message[]): Promise<string> {
    const questionContext = this.analyzeQuestion(question);
    const cacheKey = this.createCacheKey(question, chatHistory);
    
    // Try cache first if question is cacheable
    if (questionContext.cacheable) {
      const cachedResponse = await this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log(`⚡ Fast Paddock response from cache`);
        return cachedResponse;
      }
    }

    // Request deduplication - prevent multiple identical requests
    const requestKey = `${question}_${chatHistory.length}`;
    if (this.requestCache.has(requestKey)) {
      console.log(`🔄 Paddock request deduplication: ${question.substring(0, 50)}...`);
      return this.requestCache.get(requestKey)!;
    }

    // Preload F1 context for better responses
    await this.preloadF1Context();

    const requestPromise = this.makeEnhancedRequest(question, chatHistory, questionContext, cacheKey);
    this.requestCache.set(requestKey, requestPromise);
    
    try {
      const response = await requestPromise;
      return response;
    } finally {
      this.requestCache.delete(requestKey);
    }
  }

  private async makeEnhancedRequest(
    question: string, 
    chatHistory: Message[], 
    questionContext: QuestionContext,
    cacheKey: string
  ): Promise<string> {
    try {
      console.log(`🤖 Enhanced Paddock AI request: ${questionContext.type}`);
      
      const enhancedContext = this.prepareEnhancedContext(question, chatHistory);
      
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedContext),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Paddock API Error ${response.status}:`, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.answer;

      // Cache the response if it's cacheable
      if (questionContext.cacheable) {
        await this.setCachedResponse(
          cacheKey, 
          aiResponse, 
          questionContext.ttl,
          question
        );
        console.log(`💾 Cached Paddock response (TTL: ${questionContext.ttl / 1000}s)`);
      }

      return aiResponse;

    } catch (error) {
      console.error("Error asking Enhanced Paddock AI:", error);
      
      // More specific error messages
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return "🔌 Connection failed. Make sure the Paddock AI backend is running on your local network.";
      } else if (error instanceof Error && error.message.includes('timeout')) {
        return "⏱️ Request timed out. The AI is analyzing complex F1 data - please try again.";
      } else {
        return "🤖 I'm having trouble with the strategic analysis right now. Please try again in a moment.";
      }
    }
  }

  // Cache management utilities

  async clearCache(): Promise<void> {
    try {
      // Clear memory cache
      this.cache.clear();
      this.f1DataCache = null;
      this.f1DataTimestamp = 0;
      
      // Clear AsyncStorage cache
      const keys = await AsyncStorage.getAllKeys();
      const paddockCacheKeys = keys.filter(key => key.startsWith('paddock_cache_'));
      await AsyncStorage.multiRemove(paddockCacheKeys);
      
      console.log('🧹 Paddock AI cache cleared');
    } catch (error) {
      console.error('Error clearing Paddock cache:', error);
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const paddockCacheKeys = keys.filter(key => key.startsWith('paddock_cache_'));
      
      const stats = {
        memoryCache: this.cache.size,
        storageCache: paddockCacheKeys.length,
        activeRequests: this.requestCache.size,
        f1DataCached: !!this.f1DataCache,
        cacheKeys: Array.from(this.cache.keys())
      };
      
      console.log('📊 Paddock AI cache stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting Paddock cache stats:', error);
      return null;
    }
  }

  // Preload common responses for instant UI
  async preloadCommonResponses(): Promise<void> {
    const commonQuestions = [
      "Quick check: current championship standings?",
      "Brief: Canadian GP info and preview",
      "Quick: latest GP winner and results?"
    ];

    try {
      console.log('🚀 Preloading common Paddock responses...');
      
      // Load common questions in parallel (with empty chat history)
      await Promise.all(
        commonQuestions.map(q => 
          this.askPaddock(q, []).catch(err => 
            console.warn(`Failed to preload: ${q}`, err)
          )
        )
      );
      
      console.log('✅ Common Paddock responses preloaded');
    } catch (error) {
      console.error('Error preloading common responses:', error);
    }
  }
}

// Create singleton instance
const paddockAiService = new PaddockAiService();

// Legacy function for backward compatibility
export async function askPaddock(question: string, chatHistory: Message[]): Promise<string> {
  return paddockAiService.askPaddock(question, chatHistory);
}

// Export service instance for advanced features
export { paddockAiService };
export default paddockAiService; 