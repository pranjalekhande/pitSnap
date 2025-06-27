// F1 Data Service for PitSnap React Native App
// Connects to the Paddock AI backend to fetch F1 data

const API_URL = "http://10.0.0.210:8000";  // For physical phone on local network
// const API_URL = "http://127.0.0.1:8000";  // For simulator only

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

/**
 * Service for fetching F1 data from the Paddock AI backend
 */
class F1DataService {
  
  /**
   * Get the 2025 F1 race schedule
   */
  async getSchedule(): Promise<F1Schedule> {
    console.log("Fetching F1 schedule...");
    
    try {
      const response = await fetch(`${API_URL}/f1/schedule`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Schedule API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("F1 schedule fetched successfully");
      return data;

    } catch (error) {
      console.error("Error fetching F1 schedule:", error);
      throw new Error("Failed to fetch F1 schedule");
    }
  }

  /**
   * Get information about the next upcoming race
   */
  async getNextRace(): Promise<F1NextRace> {
    console.log("Fetching next F1 race...");
    
    try {
      const response = await fetch(`${API_URL}/f1/next-race`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Next race API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Next F1 race fetched successfully:", data.name);
      return data;

    } catch (error) {
      console.error("Error fetching next F1 race:", error);
      throw new Error("Failed to fetch next F1 race");
    }
  }

  /**
   * Get results from the most recent completed race
   */
  async getLatestResults(): Promise<F1LatestResults> {
    console.log("Fetching latest F1 results...");
    
    try {
      const response = await fetch(`${API_URL}/f1/latest-results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Latest results API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Latest F1 results fetched successfully");
      return data;

    } catch (error) {
      console.error("Error fetching latest F1 results:", error);
      throw new Error("Failed to fetch latest F1 results");
    }
  }

  /**
   * Get current F1 driver standings
   */
  async getStandings(): Promise<F1LatestResults> {
    console.log("Fetching F1 standings...");
    
    try {
      const response = await fetch(`${API_URL}/f1/standings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Standings API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("F1 standings fetched successfully");
      return data;

    } catch (error) {
      console.error("Error fetching F1 standings:", error);
      throw new Error("Failed to fetch F1 standings");
    }
  }

  /**
   * Get all data needed for Pit Wall (fallback to individual calls)
   */
  async getPitWallData(): Promise<PitWallData> {
    console.log("Fetching Pit Wall data...");
    
    try {
      // Make individual calls since combined endpoint has issues
      const [schedule, nextRace, latestResults] = await Promise.all([
        this.getSchedule(),
        this.getNextRace(),
        this.getLatestResults(),
      ]);

      return {
        schedule,
        next_race: nextRace,
        latest_results: latestResults,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error("Error fetching pit wall data:", error);
      throw new Error("Failed to fetch pit wall data");
    }
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
}

// Export singleton instance
export const f1DataService = new F1DataService();

// Export default
export default f1DataService; 