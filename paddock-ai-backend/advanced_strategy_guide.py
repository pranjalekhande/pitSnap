from typing import Dict, List, Optional, Tuple
import math

class AdvancedStrategyGuide:
    """
    Advanced F1 Strategic Analysis and Calculation Engine
    Provides sophisticated strategic insights and mathematical models
    """
    
    def __init__(self):
        # Track-specific data for strategic calculations
        self.track_data = {
            "monaco": {
                "pit_loss": 16.5,
                "overtaking_difficulty": 10,
                "drs_zones": 1,
                "tire_degradation": "low",
                "track_position_value": 0.4  # seconds per lap advantage
            },
            "spa": {
                "pit_loss": 23.2,
                "overtaking_difficulty": 2,
                "drs_zones": 3,
                "tire_degradation": "medium",
                "track_position_value": 0.15
            },
            "silverstone": {
                "pit_loss": 20.8,
                "overtaking_difficulty": 4,
                "drs_zones": 2,
                "tire_degradation": "high",
                "track_position_value": 0.2
            },
            "hungary": {
                "pit_loss": 19.5,
                "overtaking_difficulty": 9,
                "drs_zones": 1,
                "tire_degradation": "medium",
                "track_position_value": 0.35
            }
        }
        
        # Tire compound performance characteristics
        self.tire_compounds = {
            "soft": {
                "peak_performance_laps": 8,
                "degradation_rate": 0.15,  # seconds per lap falloff
                "initial_advantage": 1.2,   # seconds faster than medium
                "optimal_window": (5, 15)   # optimal stint length
            },
            "medium": {
                "peak_performance_laps": 12,
                "degradation_rate": 0.08,
                "initial_advantage": 0.0,   # baseline
                "optimal_window": (15, 30)
            },
            "hard": {
                "peak_performance_laps": 20,
                "degradation_rate": 0.05,
                "initial_advantage": -0.8,  # seconds slower than medium
                "optimal_window": (25, 50)
            }
        }
        
    def calculate_undercut_advantage(self, 
                                   track_name: str, 
                                   gap_to_car_ahead: float, 
                                   tire_age_difference: int,
                                   tire_compound: str = "medium") -> Dict:
        """
        Calculates the potential advantage of an undercut strategy
        """
        if track_name.lower() not in self.track_data:
            return {"error": f"Track data not available for {track_name}"}
        
        track = self.track_data[track_name.lower()]
        tire_data = self.tire_compounds.get(tire_compound, self.tire_compounds["medium"])
        
        # Calculate tire advantage per lap
        tire_advantage = tire_age_difference * tire_data["degradation_rate"]
        
        # Calculate laps needed to overcome gap + pit loss
        total_deficit = gap_to_car_ahead + track["pit_loss"]
        laps_to_overcome = math.ceil(total_deficit / tire_advantage) if tire_advantage > 0 else float('inf')
        
        # Factor in track position value
        track_position_factor = track["track_position_value"] * 5  # 5 laps of track position effect
        adjusted_laps = laps_to_overcome + track_position_factor / tire_advantage if tire_advantage > 0 else float('inf')
        
        result = {
            "track": track_name,
            "undercut_feasible": laps_to_overcome <= 10,  # Reasonable undercut window
            "laps_to_overcome_gap": round(laps_to_overcome, 1),
            "adjusted_for_track_position": round(adjusted_laps, 1),
            "tire_advantage_per_lap": round(tire_advantage, 2),
            "recommendation": self._generate_undercut_recommendation(laps_to_overcome, track, tire_advantage)
        }
        
        return result
    
    def _generate_undercut_recommendation(self, laps_to_overcome: float, track: Dict, tire_advantage: float) -> str:
        """Generate strategic recommendation based on undercut calculation"""
        if laps_to_overcome <= 3:
            return "STRONG UNDERCUT: High probability of success"
        elif laps_to_overcome <= 6:
            return "MODERATE UNDERCUT: Reasonable chance of success"
        elif laps_to_overcome <= 10:
            return "RISKY UNDERCUT: Success depends on execution and traffic"
        elif track["overtaking_difficulty"] < 5:
            return "UNDERCUT NOT RECOMMENDED: Better to overtake on track"
        else:
            return "UNDERCUT NOT VIABLE: Consider alternative strategies"
    
    def analyze_safety_car_strategy(self, 
                                  laps_remaining: int,
                                  current_position: int,
                                  tire_age: int,
                                  tire_compound: str,
                                  track_name: str) -> Dict:
        """
        Analyzes optimal strategy during safety car periods
        """
        if track_name.lower() not in self.track_data:
            return {"error": f"Track data not available for {track_name}"}
        
        track = self.track_data[track_name.lower()]
        tire_data = self.tire_compounds.get(tire_compound, self.tire_compounds["medium"])
        
        # Calculate current tire performance
        current_tire_performance = max(0, 1 - (tire_age * tire_data["degradation_rate"] / 2))
        
        # Analyze pit vs stay out scenarios
        pit_analysis = {
            "positions_lost_initially": min(current_position - 1, 8),  # Typical field spread
            "fresh_tire_advantage": tire_data["initial_advantage"],
            "laps_of_advantage": min(laps_remaining, tire_data["peak_performance_laps"]),
            "positions_recoverable": 0
        }
        
        # Calculate potential position recovery
        total_advantage = pit_analysis["fresh_tire_advantage"] * pit_analysis["laps_of_advantage"]
        if track["overtaking_difficulty"] < 5:  # Easy overtaking tracks
            pit_analysis["positions_recoverable"] = min(pit_analysis["positions_lost_initially"], 
                                                      int(total_advantage / 2))  # Rough conversion
        
        stay_out_analysis = {
            "track_position_maintained": True,
            "tire_performance_remaining": current_tire_performance,
            "defensive_capability": current_tire_performance > 0.5,
            "risk_of_position_loss": (1 - current_tire_performance) * track["overtaking_difficulty"] / 10
        }
        
        # Generate recommendation
        net_position_change = pit_analysis["positions_recoverable"] - pit_analysis["positions_lost_initially"]
        
        if net_position_change > 0:
            recommendation = "PIT: Fresh tires likely to gain net positions"
        elif net_position_change == 0 and laps_remaining > 10:
            recommendation = "PIT: Neutral position change but better tire strategy"
        elif stay_out_analysis["tire_performance_remaining"] > 0.6:
            recommendation = "STAY OUT: Tires still competitive, maintain track position"
        else:
            recommendation = "DIFFICULT CHOICE: Analyze field spread and specific competitors"
        
        return {
            "recommendation": recommendation,
            "pit_analysis": pit_analysis,
            "stay_out_analysis": stay_out_analysis,
            "key_factors": [
                f"Track overtaking difficulty: {track['overtaking_difficulty']}/10",
                f"Current tire performance: {round(current_tire_performance * 100)}%",
                f"Laps remaining: {laps_remaining}",
                f"Fresh tire advantage: {tire_data['initial_advantage']}s per lap"
            ]
        }
    
    def calculate_championship_strategy(self, 
                                      current_points: int,
                                      competitor_points: int,
                                      races_remaining: int,
                                      current_race_position: int) -> Dict:
        """
        Analyzes championship implications for strategic decisions
        """
        points_deficit = competitor_points - current_points
        max_points_available = races_remaining * 25  # Max points per race
        
        # Points system
        points_system = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
        current_race_points = points_system[current_race_position - 1] if current_race_position <= 10 else 0
        
        # Risk assessment
        championship_status = "leading" if points_deficit < 0 else "trailing" if points_deficit > 0 else "tied"
        
        if championship_status == "leading":
            strategy_approach = "conservative"
            risk_tolerance = "low"
            advice = "Focus on consistent points scoring rather than maximum risk strategies"
        elif championship_status == "trailing":
            if abs(points_deficit) > max_points_available:
                strategy_approach = "championship over"
                risk_tolerance = "irrelevant"
                advice = "Championship mathematically decided"
            elif abs(points_deficit) > max_points_available * 0.8:
                strategy_approach = "very aggressive"
                risk_tolerance = "very high"
                advice = "Must maximize every opportunity - high risk strategies justified"
            else:
                strategy_approach = "aggressive"
                risk_tolerance = "high"
                advice = "Need to outscore competitor - favor high reward strategies"
        else:  # tied
            strategy_approach = "balanced aggressive"
            risk_tolerance = "medium-high"
            advice = "Slight bias toward aggressive strategies to gain advantage"
        
        return {
            "championship_status": championship_status,
            "points_deficit": points_deficit,
            "strategy_approach": strategy_approach,
            "risk_tolerance": risk_tolerance,
            "strategic_advice": advice,
            "mathematical_situation": {
                "maximum_points_available": max_points_available,
                "championship_viable": abs(points_deficit) <= max_points_available,
                "current_race_importance": f"{round((current_race_points / max_points_available) * 100, 1)}% of remaining points"
            }
        }
    
    def generate_weather_strategy_matrix(self) -> str:
        """
        Generates a comprehensive weather strategy decision matrix
        """
        matrix = """
**F1 Weather Strategy Decision Matrix**

**DRY → WET CONDITIONS:**

*Light Rain (0-2mm/hr):*
- Track Position Strategy: Stay out if P1-P3, pit if P4+
- Tire Choice: Intermediates only if rain increasing
- Risk Level: Monitor closely, prepare for quick decision

*Moderate Rain (2-5mm/hr):*
- Immediate Action: Pit for intermediates within 2 laps  
- Strategy: First to pit often gains advantage
- Risk Level: Staying out = very high risk

*Heavy Rain (5mm/hr+):*
- Immediate Action: Pit immediately for full wets
- Strategy: Safety first, positions will shuffle
- Risk Level: Staying out = dangerous

**WET → DRY CONDITIONS:**

*Track Drying:*
- Pit Window: Wait for racing line to appear dry
- First to Slicks: Massive advantage (5-10 seconds/lap)
- Risk: Pitting too early = slide off track

*Crossover Point:*
- Intermediate → Dry: When dry line appears
- Full Wet → Intermediate: When rain reduces to light
- Timing is crucial: 1 lap can make/break race

**STRATEGIC PRINCIPLES:**

1. **Track Position vs Tire Strategy**
   - Monaco/Hungary: Favor track position
   - Spa/Silverstone: Favor optimal tire choice

2. **Championship Implications**
   - Leading: Conservative approach in mixed conditions
   - Trailing: Aggressive tire gambles more acceptable

3. **Safety Car Factor**
   - Wet conditions increase safety car probability
   - Plan strategy around potential neutralization
        """
        return matrix
    
    def analyze_qualifying_strategy_tradeoffs(self, 
                                            quali_pace_gain: float,
                                            race_pace_loss: float,
                                            track_overtaking_difficulty: int) -> Dict:
        """
        Analyzes the tradeoff between qualifying and race pace setup
        """
        # Calculate grid position advantage
        grid_positions_gained = max(1, int(quali_pace_gain / 0.3))  # ~0.3s per grid position
        
        # Calculate race impact
        race_pace_deficit_per_lap = race_pace_loss / 60  # Convert to per-lap impact
        total_race_time_loss = race_pace_deficit_per_lap * 60  # Typical race length
        
        # Factor in overtaking difficulty
        position_recovery_difficulty = track_overtaking_difficulty / 10.0
        effective_grid_advantage = grid_positions_gained * (1 + position_recovery_difficulty)
        
        # Decision analysis
        if effective_grid_advantage > total_race_time_loss / 0.3:  # 0.3s per position
            recommendation = "FAVOR QUALIFYING: Grid position advantage outweighs race pace loss"
            confidence = "high" if effective_grid_advantage > total_race_time_loss / 0.2 else "medium"
        else:
            recommendation = "FAVOR RACE PACE: Race performance more important than grid position"
            confidence = "high" if total_race_time_loss > effective_grid_advantage * 0.4 else "medium"
        
        return {
            "recommendation": recommendation,
            "confidence": confidence,
            "analysis": {
                "grid_positions_gained": grid_positions_gained,
                "total_race_time_loss": round(total_race_time_loss, 1),
                "effective_grid_advantage": round(effective_grid_advantage, 1),
                "overtaking_difficulty_factor": round(position_recovery_difficulty, 2)
            },
            "key_insights": [
                f"Qualifying setup gains ~{grid_positions_gained} grid positions",
                f"Race setup costs ~{round(total_race_time_loss, 1)} seconds over race distance",
                f"Track overtaking difficulty: {track_overtaking_difficulty}/10",
                f"Effective grid advantage value: {round(effective_grid_advantage, 1)} positions"
            ]
        }

# Create global instance
advanced_strategy_guide = AdvancedStrategyGuide() 