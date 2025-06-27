import requests
from typing import Dict, List, Optional
import json

class StrategyAnalyst:
    """
    Advanced F1 Strategy Analysis Tool
    Provides strategic insights, tire strategy analysis, and race tactics
    """
    
    def __init__(self):
        self.base_url = "http://ergast.com/api/f1"
        
    def analyze_tire_strategy(self, race_year: str = "current", race_round: str = "last") -> str:
        """
        Analyzes tire strategies from recent races
        """
        try:
            # Get race results with pit stop data
            url = f"{self.base_url}/{race_year}/{race_round}/pitstops.json"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            race_info = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
            
            if not race_info:
                return "No recent race data available for tire strategy analysis."
            
            race = race_info[0]
            race_name = race.get("raceName", "Unknown Race")
            pit_stops = race.get("PitStops", [])
            
            if not pit_stops:
                return f"No pit stop data available for {race_name}."
            
            # Analyze pit stop strategies
            driver_strategies = {}
            for stop in pit_stops:
                driver_id = stop.get("driverId")
                lap = int(stop.get("lap", 0))
                duration = stop.get("duration", "N/A")
                
                if driver_id not in driver_strategies:
                    driver_strategies[driver_id] = []
                driver_strategies[driver_id].append({
                    "lap": lap,
                    "duration": duration
                })
            
            # Generate strategy analysis
            analysis = f"**Tire Strategy Analysis for {race_name}:**\n\n"
            
            # Find different strategy patterns
            one_stop_drivers = []
            two_stop_drivers = []
            three_plus_stop_drivers = []
            
            for driver, stops in driver_strategies.items():
                stop_count = len(stops)
                if stop_count == 1:
                    one_stop_drivers.append((driver, stops))
                elif stop_count == 2:
                    two_stop_drivers.append((driver, stops))
                else:
                    three_plus_stop_drivers.append((driver, stops))
            
            if one_stop_drivers:
                analysis += f"**One-Stop Strategy ({len(one_stop_drivers)} drivers):**\n"
                for driver, stops in one_stop_drivers[:3]:  # Show first 3
                    analysis += f"- {driver.replace('_', ' ').title()}: Pit on lap {stops[0]['lap']}\n"
                analysis += "\n"
            
            if two_stop_drivers:
                analysis += f"**Two-Stop Strategy ({len(two_stop_drivers)} drivers):**\n"
                for driver, stops in two_stop_drivers[:3]:  # Show first 3
                    laps = [stop['lap'] for stop in stops]
                    analysis += f"- {driver.replace('_', ' ').title()}: Pits on laps {', '.join(map(str, laps))}\n"
                analysis += "\n"
            
            if three_plus_stop_drivers:
                analysis += f"**Multi-Stop Strategy ({len(three_plus_stop_drivers)} drivers):**\n"
                for driver, stops in three_plus_stop_drivers[:2]:  # Show first 2
                    laps = [stop['lap'] for stop in stops]
                    analysis += f"- {driver.replace('_', ' ').title()}: {len(stops)} stops on laps {', '.join(map(str, laps))}\n"
            
            analysis += "\n**Strategic Insights:**\n"
            analysis += "- Track conditions and tire degradation likely influenced these strategies\n"
            analysis += "- Weather conditions may have forced tactical changes\n"
            analysis += "- Teams with fewer stops likely prioritized track position over tire performance\n"
            
            return analysis
            
        except Exception as e:
            return f"Error analyzing tire strategy: {str(e)}"
    
    def compare_qualifying_vs_race_performance(self, race_year: str = "current", race_round: str = "last") -> str:
        """
        Compares qualifying positions vs race results to identify strategic winners/losers
        """
        try:
            # Get qualifying results
            quali_url = f"{self.base_url}/{race_year}/{race_round}/qualifying.json"
            race_url = f"{self.base_url}/{race_year}/{race_round}/results.json"
            
            quali_response = requests.get(quali_url, timeout=10)
            race_response = requests.get(race_url, timeout=10)
            
            quali_response.raise_for_status()
            race_response.raise_for_status()
            
            quali_data = quali_response.json()
            race_data = race_response.json()
            
            quali_results = quali_data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
            race_results = race_data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
            
            if not quali_results or not race_results:
                return "Insufficient data to compare qualifying vs race performance."
            
            race_name = race_results[0].get("raceName", "Unknown Race")
            quali_positions = {}
            race_positions = {}
            
            # Extract qualifying positions
            for result in quali_results[0].get("QualifyingResults", []):
                driver_id = result.get("Driver", {}).get("driverId")
                position = int(result.get("position", 0))
                quali_positions[driver_id] = position
            
            # Extract race positions
            for result in race_results[0].get("Results", []):
                driver_id = result.get("Driver", {}).get("driverId")
                position = int(result.get("position", 0))
                race_positions[driver_id] = position
            
            # Calculate position changes
            position_changes = []
            for driver_id in quali_positions:
                if driver_id in race_positions:
                    quali_pos = quali_positions[driver_id]
                    race_pos = race_positions[driver_id]
                    change = quali_pos - race_pos  # Positive = gained positions
                    position_changes.append({
                        "driver": driver_id,
                        "quali_pos": quali_pos,
                        "race_pos": race_pos,
                        "change": change
                    })
            
            # Sort by position change
            position_changes.sort(key=lambda x: x["change"], reverse=True)
            
            analysis = f"**Strategic Performance Analysis for {race_name}:**\n\n"
            
            # Biggest gainers
            analysis += "**Biggest Strategic Winners (Gained Positions):**\n"
            for driver_data in position_changes[:5]:
                if driver_data["change"] > 0:
                    driver_name = driver_data["driver"].replace('_', ' ').title()
                    analysis += f"- {driver_name}: P{driver_data['quali_pos']} → P{driver_data['race_pos']} (+{driver_data['change']} positions)\n"
            
            analysis += "\n**Biggest Strategic Losers (Lost Positions):**\n"
            for driver_data in reversed(position_changes[-5:]):
                if driver_data["change"] < 0:
                    driver_name = driver_data["driver"].replace('_', ' ').title()
                    analysis += f"- {driver_name}: P{driver_data['quali_pos']} → P{driver_data['race_pos']} ({driver_data['change']} positions)\n"
            
            analysis += "\n**Strategic Insights:**\n"
            analysis += "- Position gainers likely had superior race strategy or tire management\n"
            analysis += "- Position losers may have suffered from poor strategy calls or technical issues\n"
            analysis += "- Starting position doesn't always determine final result - strategy matters!\n"
            
            return analysis
            
        except Exception as e:
            return f"Error comparing qualifying vs race performance: {str(e)}"
    
    def generate_strategy_debate_points(self, topic: str) -> str:
        """
        Generate debate points for common F1 strategic topics
        """
        debate_topics = {
            "tire_strategy": {
                "title": "Tire Strategy: Aggressive vs Conservative",
                "pro_aggressive": [
                    "Fresher tires provide significant pace advantage in final stint",
                    "Track position less important on circuits with good overtaking opportunities", 
                    "Aggressive strategy can surprise competitors and gain strategic advantage",
                    "Fresh tires allow drivers to push harder without degradation concerns"
                ],
                "pro_conservative": [
                    "Track position is crucial - clean air is worth several tenths per lap",
                    "One-stop strategy reduces risk of pit stop errors and safety car timing",
                    "Conservative approach allows for opportunistic gains from others' mistakes",
                    "Tire degradation can be managed through driver skill and setup"
                ]
            },
            "qualifying_setup": {
                "title": "Qualifying Setup: Peak Performance vs Race Trim",
                "pro_qualifying": [
                    "Grid position is critical - starting further ahead provides strategic options",
                    "Clean air in qualifying maximizes car's true pace potential",
                    "Psychological advantage of strong qualifying performance",
                    "Better starting position reduces risk of first-lap incidents"
                ],
                "pro_race_trim": [
                    "Race pace over 50+ laps more important than single-lap performance",
                    "Balanced setup allows for better tire management throughout race",
                    "Flexibility to adapt strategy based on race conditions",
                    "Consistent pace can overcome poor grid position through superior strategy"
                ]
            },
            "pit_stop_timing": {
                "title": "Pit Stop Timing: Early vs Late Window",
                "pro_early": [
                    "Undercut advantage - gaining track position through fresher tires",
                    "Avoiding traffic allows for faster lap times immediately after pit stop",
                    "Early stop provides more strategic options for remainder of race",
                    "Reduces risk of being caught in DRS trains or traffic"
                ],
                "pro_late": [
                    "Overcut strategy - staying out longer on worn tires to gain positions",
                    "Fresh tires for final stint provide better overtaking opportunities",
                    "Late pit window allows reaction to competitors' strategies",
                    "Better tire advantage in final crucial laps of the race"
                ]
            }
        }
        
        topic_key = topic.lower().replace(" ", "_")
        if topic_key in debate_topics:
            debate = debate_topics[topic_key]
            analysis = f"**{debate['title']}**\n\n"
            
            if "pro_aggressive" in debate:
                analysis += "**Arguments for Aggressive Strategy:**\n"
                for point in debate["pro_aggressive"]:
                    analysis += f"• {point}\n"
                analysis += "\n**Arguments for Conservative Strategy:**\n"
                for point in debate["pro_conservative"]:
                    analysis += f"• {point}\n"
            else:
                analysis += "**Arguments for First Option:**\n"
                for point in debate["pro_qualifying"]:
                    analysis += f"• {point}\n"
                analysis += "\n**Arguments for Second Option:**\n"
                for point in debate["pro_race_trim"]:
                    analysis += f"• {point}\n"
            
            analysis += "\n**Discussion Points:**\n"
            analysis += "- What factors would influence your choice between these strategies?\n"
            analysis += "- How do track characteristics affect this strategic decision?\n"
            analysis += "- What role does weather/conditions play in this choice?\n"
            
            return analysis
        else:
            return f"Strategy debate topic '{topic}' not found. Available topics: tire_strategy, qualifying_setup, pit_stop_timing"

# Create a global instance
strategy_analyst = StrategyAnalyst() 