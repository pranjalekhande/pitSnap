import AsyncStorage from '@react-native-async-storage/async-storage';
import { F1NextRace, F1Event } from './f1DataService';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isLive: boolean;
  isPast: boolean;
}

export interface CountdownConfig {
  targetDate: string;
  title: string;
  type: 'race' | 'qualifying' | 'practice' | 'sprint';
  timezone?: string;
}

class CountdownService {
  private activeCountdowns = new Map<string, NodeJS.Timeout>();
  private listeners = new Map<string, Set<(time: CountdownTime) => void>>();

  /**
   * Calculate countdown time from target date
   */
  calculateCountdown(targetDate: string): CountdownTime {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    const totalSeconds = Math.max(0, Math.floor(difference / 1000));
    const isLive = difference <= 0 && difference > -3600000; // Live for 1 hour after start
    const isPast = difference <= -3600000; // Past after 1 hour

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isLive,
        isPast
      };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      isLive,
      isPast
    };
  }

  /**
   * Subscribe to real-time countdown updates
   */
  subscribe(id: string, targetDate: string, callback: (time: CountdownTime) => void): () => void {
    // Initialize listeners set for this id
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    
    const listenersSet = this.listeners.get(id)!;
    listenersSet.add(callback);

    // Start countdown timer if not already running
    if (!this.activeCountdowns.has(id)) {
      this.startCountdown(id, targetDate);
    }

    // Send initial value
    callback(this.calculateCountdown(targetDate));

    // Return unsubscribe function
    return () => {
      listenersSet.delete(callback);
      if (listenersSet.size === 0) {
        this.stopCountdown(id);
      }
    };
  }

  /**
   * Start countdown timer for specific id
   */
  private startCountdown(id: string, targetDate: string): void {
    const interval = setInterval(() => {
      const countdownTime = this.calculateCountdown(targetDate);
      const listeners = this.listeners.get(id);
      
      if (listeners) {
        listeners.forEach(callback => callback(countdownTime));
      }

      // Stop countdown if race is past
      if (countdownTime.isPast) {
        this.stopCountdown(id);
      }
    }, 1000);

    this.activeCountdowns.set(id, interval);
  }

  /**
   * Stop countdown timer for specific id
   */
  private stopCountdown(id: string): void {
    const interval = this.activeCountdowns.get(id);
    if (interval) {
      clearInterval(interval);
      this.activeCountdowns.delete(id);
      this.listeners.delete(id);
    }
  }

  /**
   * Get human readable time remaining
   */
  getTimeRemaining(targetDate: string): string {
    const countdown = this.calculateCountdown(targetDate);
    
    if (countdown.isLive) {
      return '🔴 LIVE NOW';
    }
    
    if (countdown.isPast) {
      return '✅ COMPLETED';
    }

    if (countdown.days > 0) {
      return `${countdown.days}d ${countdown.hours}h`;
    } else if (countdown.hours > 0) {
      return `${countdown.hours}h ${countdown.minutes}m`;
    } else if (countdown.minutes > 0) {
      return `${countdown.minutes}m ${countdown.seconds}s`;
    } else {
      return `${countdown.seconds}s`;
    }
  }

  /**
   * Get race weekend schedule with countdowns
   */
  getRaceWeekendCountdowns(nextRace: F1NextRace): CountdownConfig[] {
    const raceDate = new Date(nextRace.date);
    
    // Calculate typical F1 weekend schedule (these are estimates)
    const friday = new Date(raceDate);
    friday.setDate(raceDate.getDate() - 2);
    friday.setHours(13, 30, 0, 0); // FP1 typically starts 13:30

    const saturday = new Date(raceDate);
    saturday.setDate(raceDate.getDate() - 1);
    saturday.setHours(12, 0, 0, 0); // FP3/Qualifying

    const sunday = new Date(raceDate);
    sunday.setHours(15, 0, 0, 0); // Race typically 15:00 local

    const configs: CountdownConfig[] = [
      {
        targetDate: friday.toISOString(),
        title: 'Practice 1',
        type: 'practice' as const,
      },
      {
        targetDate: saturday.toISOString(),
        title: 'Qualifying',
        type: 'qualifying' as const,
      },
      {
        targetDate: sunday.toISOString(),
        title: `${nextRace.name}`,
        type: 'race' as const,
      },
    ];
    
    return configs.filter(config => new Date(config.targetDate) > new Date()); // Only future events
  }

  /**
   * Get notification scheduling info
   */
  getNotificationSchedule(targetDate: string): { [key: string]: Date } {
    const raceDate = new Date(targetDate);
    const schedules: { [key: string]: Date } = {};

    // 1 week before
    const oneWeekBefore = new Date(raceDate);
    oneWeekBefore.setDate(raceDate.getDate() - 7);
    if (oneWeekBefore > new Date()) {
      schedules['1_week'] = oneWeekBefore;
    }

    // 1 day before
    const oneDayBefore = new Date(raceDate);
    oneDayBefore.setDate(raceDate.getDate() - 1);
    if (oneDayBefore > new Date()) {
      schedules['1_day'] = oneDayBefore;
    }

    // 1 hour before
    const oneHourBefore = new Date(raceDate);
    oneHourBefore.setHours(raceDate.getHours() - 1);
    if (oneHourBefore > new Date()) {
      schedules['1_hour'] = oneHourBefore;
    }

    // 10 minutes before
    const tenMinutesBefore = new Date(raceDate);
    tenMinutesBefore.setMinutes(raceDate.getMinutes() - 10);
    if (tenMinutesBefore > new Date()) {
      schedules['10_minutes'] = tenMinutesBefore;
    }

    return schedules;
  }

  /**
   * Format countdown for display
   */
  formatCountdown(countdown: CountdownTime, compact: boolean = false): string {
    if (countdown.isLive) {
      return '🔴 LIVE';
    }
    
    if (countdown.isPast) {
      return '✅ DONE';
    }

    if (compact) {
      if (countdown.days > 0) {
        return `${countdown.days}d ${countdown.hours}h`;
      } else if (countdown.hours > 0) {
        return `${countdown.hours}h ${countdown.minutes}m`;
      } else {
        return `${countdown.minutes}m ${countdown.seconds}s`;
      }
    }

    return `${countdown.days}:${countdown.hours.toString().padStart(2, '0')}:${countdown.minutes.toString().padStart(2, '0')}:${countdown.seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Clean up all active countdowns (call on app unmount)
   */
  cleanup(): void {
    this.activeCountdowns.forEach((interval) => {
      clearInterval(interval);
    });
    this.activeCountdowns.clear();
    this.listeners.clear();
  }

  /**
   * Get urgency level for UI styling
   */
  getUrgencyLevel(countdown: CountdownTime): 'critical' | 'warning' | 'normal' | 'past' {
    if (countdown.isPast) return 'past';
    if (countdown.isLive) return 'critical';
    if (countdown.totalSeconds < 3600) return 'critical'; // Less than 1 hour
    if (countdown.totalSeconds < 86400) return 'warning'; // Less than 1 day
    return 'normal';
  }

  /**
   * Cache countdown data for offline use
   */
  async cacheCountdownData(raceSchedule: F1Event[]): Promise<void> {
    try {
      const countdownData = {
        races: raceSchedule,
        cached_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem('countdown_cache', JSON.stringify(countdownData));
    } catch (error) {
      console.warn('Failed to cache countdown data:', error);
    }
  }

  /**
   * Get cached countdown data for offline use
   */
  async getCachedCountdownData(): Promise<F1Event[] | null> {
    try {
      const cached = await AsyncStorage.getItem('countdown_cache');
      if (!cached) return null;

      const data = JSON.parse(cached);
      const cachedAt = new Date(data.cached_at);
      const now = new Date();
      
      // Cache valid for 24 hours
      if (now.getTime() - cachedAt.getTime() > 24 * 60 * 60 * 1000) {
        return null;
      }

      return data.races;
    } catch (error) {
      console.warn('Failed to get cached countdown data:', error);
      return null;
    }
  }
}

export const countdownService = new CountdownService();
export default countdownService; 