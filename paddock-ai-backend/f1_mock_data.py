from typing import Dict, List, Optional
import random
from datetime import datetime, timedelta

class F1MockDataProvider:
    """
    Comprehensive F1 Mock Data Provider
    Provides realistic F1 data for development and demo purposes
    """
    
    def __init__(self):
        # Current season mock data
        self.current_season = 2024
        
        # Driver data
        self.drivers = {
            "verstappen": {"name": "Max Verstappen", "team": "Red Bull Racing", "number": 1},
            "perez": {"name": "Sergio Perez", "team": "Red Bull Racing", "number": 11},
            "hamilton": {"name": "Lewis Hamilton", "team": "Mercedes", "number": 44},
            "russell": {"name": "George Russell", "team": "Mercedes", "number": 63},
            "leclerc": {"name": "Charles Leclerc", "team": "Ferrari", "number": 16},
            "sainz": {"name": "Carlos Sainz", "team": "Ferrari", "number": 55},
            "norris": {"name": "Lando Norris", "team": "McLaren", "number": 4},
            "piastri": {"name": "Oscar Piastri", "team": "McLaren", "number": 81},
            "alonso": {"name": "Fernando Alonso", "team": "Aston Martin", "number": 14},
            "stroll": {"name": "Lance Stroll", "team": "Aston Martin", "number": 18}
        }
        
        # Recent race results (mock)
        self.recent_races = [
            {
                "race_name": "Abu Dhabi Grand Prix",
                "date": "2024-12-08",
                "results": [
                    {"position": 1, "driver": "verstappen", "team": "Red Bull Racing", "time": "1:26:33.894"},
                    {"position": 2, "driver": "leclerc", "team": "Ferrari", "time": "+7.456"},
                    {"position": 3, "driver": "russell", "team": "Mercedes", "time": "+12.344"},
                    {"position": 4, "driver": "norris", "team": "McLaren", "time": "+15.123"},
                    {"position": 5, "driver": "hamilton", "team": "Mercedes", "time": "+18.776"}
                ],
                "pit_stops": [
                    {"driver": "verstappen", "lap": 18, "duration": "2.3", "tire_change": "medium"},
                    {"driver": "verstappen", "lap": 38, "duration": "2.1", "tire_change": "hard"},
                    {"driver": "leclerc", "lap": 16, "duration": "2.5", "tire_change": "medium"},
                    {"driver": "leclerc", "lap": 35, "duration": "2.2", "tire_change": "hard"},
                    {"driver": "russell", "lap": 20, "duration": "2.4", "tire_change": "hard"},
                    {"driver": "norris", "lap": 19, "duration": "2.6", "tire_change": "medium"},
                    {"driver": "norris", "lap": 42, "duration": "2.3", "tire_change": "soft"},
                    {"driver": "hamilton", "lap": 22, "duration": "2.8", "tire_change": "hard"}
                ]
            },
            {
                "race_name": "Qatar Grand Prix",
                "date": "2024-12-01",
                "results": [
                    {"position": 1, "driver": "norris", "team": "McLaren", "time": "1:31:05.323"},
                    {"position": 2, "driver": "verstappen", "team": "Red Bull Racing", "time": "+6.031"},
                    {"position": 3, "driver": "piastri", "team": "McLaren", "time": "+15.506"},
                    {"position": 4, "driver": "russell", "team": "Mercedes", "time": "+20.114"},
                    {"position": 5, "driver": "sainz", "team": "Ferrari", "time": "+23.289"}
                ],
                "pit_stops": [
                    {"driver": "norris", "lap": 15, "duration": "2.2", "tire_change": "medium"},
                    {"driver": "norris", "lap": 35, "duration": "2.1", "tire_change": "hard"},
                    {"driver": "verstappen", "lap": 17, "duration": "2.4", "tire_change": "medium"},
                    {"driver": "verstappen", "lap": 37, "duration": "2.3", "tire_change": "hard"},
                    {"driver": "piastri", "lap": 16, "duration": "2.5", "tire_change": "medium"},
                    {"driver": "piastri", "lap": 39, "duration": "2.2", "tire_change": "hard"}
                ]
            }
        ]
        
        # Championship standings
        self.driver_standings = [
            {"position": 1, "driver": "verstappen", "points": 429},
            {"position": 2, "driver": "norris", "points": 349},
            {"position": 3, "driver": "leclerc", "points": 323},
            {"position": 4, "driver": "piastri", "points": 268},
            {"position": 5, "driver": "sainz", "points": 259},
            {"position": 6, "driver": "hamilton", "points": 234},
            {"position": 7, "driver": "russell", "points": 211},
            {"position": 8, "driver": "perez", "points": 152},
            {"position": 9, "driver": "alonso", "points": 68},
            {"position": 10, "driver": "stroll", "points": 24}
        ]
        
        # Strategic scenarios for What-If analysis
        self.strategic_scenarios = {
            "abu_dhabi_2024_verstappen_early_pit": {
                "scenario": "What if Verstappen had pitted 5 laps earlier in Abu Dhabi 2024?",
                "actual_strategy": "Two-stop: Medium (start) → Medium (lap 18) → Hard (lap 38)",
                "alternative_strategy": "Two-stop: Medium (start) → Medium (lap 13) → Hard (lap 33)",
                "actual_result": "Won by 7.456 seconds",
                "predicted_alternative": "Would have won by 12-15 seconds with better tire advantage",
                "analysis": "Earlier pit would have gained undercut advantage over Leclerc and allowed better tire management in final stint"
            },
            "qatar_2024_norris_one_stop": {
                "scenario": "What if Norris had attempted a one-stop strategy in Qatar 2024?",
                "actual_strategy": "Two-stop: Medium (start) → Medium (lap 15) → Hard (lap 35)",
                "alternative_strategy": "One-stop: Medium (start) → Hard (lap 25)",
                "actual_result": "Won the race",
                "predicted_alternative": "Would have finished P3-P4 due to tire degradation in final stint",
                "analysis": "Two-stop was optimal for Qatar's high tire degradation characteristics"
            }
        }
    
    def get_latest_race_winner(self) -> str:
        """Returns the winner of the most recent race"""
        latest_race = self.recent_races[0]
        winner = latest_race["results"][0]
        driver_info = self.drivers[winner["driver"]]
        
        return f"The winner of the most recent race, the {latest_race['race_name']}, was {driver_info['name']} driving for {driver_info['team']}."
    
    def get_recent_race_results(self, race_index: int = 0) -> Dict:
        """Get results from a recent race"""
        if race_index >= len(self.recent_races):
            return {"error": "Race index out of range"}
        
        return self.recent_races[race_index]
    
    def analyze_tire_strategies(self, race_index: int = 0) -> str:
        """Analyze tire strategies from a recent race"""
        race = self.get_recent_race_results(race_index)
        if "error" in race:
            return race["error"]
        
        race_name = race["race_name"]
        pit_stops = race["pit_stops"]
        
        # Group pit stops by driver
        driver_strategies = {}
        for stop in pit_stops:
            driver = stop["driver"]
            if driver not in driver_strategies:
                driver_strategies[driver] = []
            driver_strategies[driver].append(stop)
        
        analysis = f"**Tire Strategy Analysis: {race_name}**\n\n"
        
        # Categorize strategies
        one_stoppers = []
        two_stoppers = []
        three_stoppers = []
        
        for driver, stops in driver_strategies.items():
            driver_name = self.drivers[driver]["name"]
            stop_count = len(stops)
            
            if stop_count == 1:
                one_stoppers.append((driver_name, stops))
            elif stop_count == 2:
                two_stoppers.append((driver_name, stops))
            else:
                three_stoppers.append((driver_name, stops))
        
        if one_stoppers:
            analysis += f"**One-Stop Strategies ({len(one_stoppers)} drivers):**\n"
            for name, stops in one_stoppers:
                analysis += f"• {name}: Pit lap {stops[0]['lap']} ({stops[0]['tire_change']} tires)\n"
            analysis += "\n"
        
        if two_stoppers:
            analysis += f"**Two-Stop Strategies ({len(two_stoppers)} drivers):**\n"
            for name, stops in two_stoppers:
                laps = [f"lap {stop['lap']}" for stop in stops]
                tires = [stop['tire_change'] for stop in stops]
                analysis += f"• {name}: Pits on {', '.join(laps)} ({' → '.join(tires)})\n"
            analysis += "\n"
        
        if three_stoppers:
            analysis += f"**Three+ Stop Strategies ({len(three_stoppers)} drivers):**\n"
            for name, stops in three_stoppers:
                laps = [f"lap {stop['lap']}" for stop in stops]
                analysis += f"• {name}: {len(stops)} stops on {', '.join(laps)}\n"
        
        analysis += f"\n**Strategic Insights:**\n"
        analysis += f"• Two-stop strategies dominated this race\n"
        analysis += f"• Medium-to-hard tire progression was most popular\n"
        analysis += f"• Pit window opened around lap 15-20\n"
        analysis += f"• Average pit stop time: 2.3-2.4 seconds\n"
        
        return analysis
    
    def get_driver_standings(self) -> List[Dict]:
        """Get current driver championship standings"""
        return self.driver_standings
    
    def get_driver_ranking(self, driver_name: str) -> str:
        """Get specific driver's championship position"""
        driver_name_lower = driver_name.lower()
        
        # Try to find driver by name or partial name
        for standing in self.driver_standings:
            driver_info = self.drivers[standing["driver"]]
            if (driver_name_lower in driver_info["name"].lower() or 
                driver_name_lower in standing["driver"]):
                return f"{driver_info['name']} is currently P{standing['position']} in the championship with {standing['points']} points."
        
        return f"Could not find ranking information for '{driver_name}'. Try 'Max', 'Hamilton', 'Leclerc', etc."
    
    def get_what_if_scenario(self, scenario_key: str) -> Dict:
        """Get a specific what-if scenario"""
        return self.strategic_scenarios.get(scenario_key, {})
    
    def get_all_what_if_scenarios(self) -> List[str]:
        """Get list of available what-if scenarios"""
        return list(self.strategic_scenarios.keys())
    
    def compare_qualifying_vs_race(self, race_index: int = 0) -> str:
        """Compare qualifying vs race performance (mock data)"""
        race = self.get_recent_race_results(race_index)
        race_name = race["race_name"]
        
        # Mock qualifying vs race comparison
        analysis = f"**Strategic Performance Analysis: {race_name}**\n\n"
        
        analysis += f"**Biggest Strategic Winners:**\n"
        analysis += f"• Lando Norris: P4 → P1 (+3 positions) - Perfect tire strategy\n"
        analysis += f"• George Russell: P6 → P3 (+3 positions) - Excellent race management\n"
        analysis += f"• Oscar Piastri: P5 → P3 (+2 positions) - Consistent performance\n\n"
        
        analysis += f"**Strategic Underperformers:**\n"
        analysis += f"• Sergio Perez: P3 → P8 (-5 positions) - Poor tire degradation\n"
        analysis += f"• Carlos Sainz: P2 → P5 (-3 positions) - Strategy miscalculation\n\n"
        
        analysis += f"**Key Strategic Insights:**\n"
        analysis += f"• Early pit stops generally paid off in this race\n"
        analysis += f"• Hard tire compound was the key to strong final stint pace\n"
        analysis += f"• Track position wasn't as valuable as tire advantage\n"
        
        return analysis

# Create global instance
f1_mock_data = F1MockDataProvider() 