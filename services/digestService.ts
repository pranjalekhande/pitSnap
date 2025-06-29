import { PitWallData } from './f1DataService';
import { OPENAI_API_KEY } from '@env';

// Check if API key is loaded (keep minimal check for debugging)
if (!OPENAI_API_KEY) {
      // OpenAI API Key not found
}

export interface DailyDigest {
  greeting: string;
  headlines: string[];
  championship_insight: string;
  next_race_preview: string;
  generated_at: string;
}

class DigestService {
  /**
   * Generate AI-powered daily digest using latest F1 data
   */
  async generateDailyDigest(pitWallData: PitWallData): Promise<DailyDigest> {
    try {
      // Check if API key is available
      if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, using fallback digest');
        return this.createFallbackDigest(pitWallData);
      }

      const prompt = this.createDigestPrompt(pitWallData);
      
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
              content: 'You are an expert F1 analyst creating a concise daily digest for F1 fans. Keep responses short, engaging, and focused on key insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`OpenAI API error ${response.status}: ${response.statusText} - ${errorText}`);
        
        // For authentication errors, log additional info
        if (response.status === 401) {
          console.warn('OpenAI API key appears to be invalid or expired. Please check your API key configuration.');
        }
        
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content || '';
      
      return this.parseAIResponse(aiContent, pitWallData);
    } catch (error) {
      console.error('Error generating AI digest:', error);
      
      // Provide more specific error messaging
      if (error instanceof Error && error.message.includes('401')) {
        console.warn('Falling back to template digest due to OpenAI authentication error');
      }
      
      // Fallback to template-based digest
      return this.createFallbackDigest(pitWallData);
    }
  }

  /**
   * Create prompt for OpenAI with current F1 data
   */
  private createDigestPrompt(pitWallData: PitWallData): string {
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';
    
    let dataContext = '';
    
    // Add driver lineup context (no points since they're not real)
    if (pitWallData.championship_standings?.drivers) {
      const topDrivers = pitWallData.championship_standings.drivers.slice(0, 4);
      dataContext += `2025 F1 Grid includes: ${topDrivers.map(d => `${d.driver} (${d.team})`).join(', ')}. `;
    }
    
    // Add next race context
    if (pitWallData.next_race) {
      dataContext += `Next race: ${pitWallData.next_race.name} at ${pitWallData.next_race.location} in ${pitWallData.next_race.days_until} days. `;
    }
    
    // Add latest results context
    if (pitWallData.latest_results?.results?.[0]) {
      const winner = pitWallData.latest_results.results[0];
      dataContext += `Latest race winner: ${winner.driver} from ${winner.team}. `;
    }

    const prompt = `Create a ${timeOfDay} F1 digest with this data: ${dataContext}

Please format as JSON with these fields:
- greeting: A personalized ${timeOfDay} greeting for F1 fans
- headlines: Array of 2-3 key F1 headlines about teams, drivers, or race excitement (avoid championship points)
- championship_insight: One sentence about the 2025 F1 grid, teams, or driver lineup
- next_race_preview: One sentence about upcoming race excitement and what to expect

Focus on race excitement, team dynamics, and upcoming races rather than points. Keep each field concise and engaging.`;

    return prompt;
  }

  /**
   * Parse AI response into structured digest
   */
  private parseAIResponse(aiContent: string, pitWallData: PitWallData): DailyDigest {
    try {
      // Clean the AI response by removing markdown code block markers
      let cleanedContent = aiContent.trim();
      
      // Remove ```json and ``` markers if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '');
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.replace(/\s*```$/, '');
      }
      
      // Try to parse JSON response
      const parsed = JSON.parse(cleanedContent);
      const digest = {
        greeting: parsed.greeting || this.getTimeBasedGreeting(),
        headlines: Array.isArray(parsed.headlines) ? parsed.headlines : [parsed.headlines || 'F1 action continues!'],
        championship_insight: parsed.championship_insight || this.getChampionshipInsight(pitWallData),
        next_race_preview: parsed.next_race_preview || this.getNextRacePreview(pitWallData),
        generated_at: new Date().toISOString(),
      };
      
      return digest;
    } catch (error) {
      // If JSON parsing fails, create digest from AI text
      return this.createFallbackDigest(pitWallData, aiContent);
    }
  }

  /**
   * Create fallback digest when AI fails
   */
  private createFallbackDigest(pitWallData: PitWallData, aiContent?: string): DailyDigest {
    const headlines = [];
    
    // Add AI content if available
    if (aiContent) {
      headlines.push(aiContent.slice(0, 100) + '...');
    }
    
    // Add dynamic headlines based on available data
    if (pitWallData.latest_results?.results?.[0]) {
      const winner = pitWallData.latest_results.results[0];
      headlines.push(`🏆 ${winner.driver} (${winner.team}) claimed victory in the latest race!`);
    } else {
      headlines.push('🏁 F1 2025 season brings incredible racing action!');
    }
    
    if (pitWallData.next_race) {
      headlines.push(`🔥 ${pitWallData.next_race.name} approaching - excitement builds!`);
    } else {
      headlines.push('🚀 Teams pushing development to the limit');
    }
    
    // Ensure we have at least 2 headlines
    if (headlines.length < 2) {
      headlines.push('⚡ The championship battle intensifies every race weekend');
    }

    const fallbackDigest = {
      greeting: this.getTimeBasedGreeting(),
      headlines: headlines.slice(0, 3), // Maximum 3 headlines
      championship_insight: this.getChampionshipInsight(pitWallData),
      next_race_preview: this.getNextRacePreview(pitWallData),
      generated_at: new Date().toISOString(),
    };
    
    return fallbackDigest;
  }

  /**
   * Helper methods for fallback content
   */
  private getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good morning, F1 fan!';
    if (hour < 18) return '☀️ Good afternoon, F1 enthusiast!';
    return '🌆 Good evening, racing fan!';
  }

  private getChampionshipInsight(pitWallData: PitWallData): string {
    const standings = pitWallData.championship_standings;
    if (standings?.drivers && standings.drivers.length >= 2) {
      const leader = standings.drivers[0];
      const second = standings.drivers[1];
      
      // Focus on teams and drivers rather than points
      return `🏆 ${leader.driver} (${leader.team}) leads the grid, with ${second.driver} (${second.team}) in pursuit`;
    }
    return '🏆 The 2025 F1 season features an incredible driver lineup!';
  }

  private getNextRacePreview(pitWallData: PitWallData): string {
    if (pitWallData.next_race) {
      return `🏁 ${pitWallData.next_race.name} coming up in ${pitWallData.next_race.days_until} days`;
    }
    return '🏁 Next F1 race weekend approaching!';
  }
}

export const digestService = new DigestService();
export default digestService; 