from typing import Dict, List, Optional
import random

class DebateScenarios:
    """
    F1 Strategy Debate Scenarios Generator
    Creates realistic strategic scenarios for debate and analysis
    """
    
    def __init__(self):
        self.scenarios = {
            "monaco_rain": {
                "title": "Monaco GP - Rain Strategy Dilemma",
                "context": "It's lap 25 of 78 at Monaco. Light rain has started falling. You're running P3 on medium tires that have 15 laps left. The cars ahead are on hard tires.",
                "options": {
                    "A": "Stay out and hope rain stops - maintain track position",
                    "B": "Pit immediately for intermediates - risk losing positions",
                    "C": "Wait 2-3 laps to see rain intensity before deciding"
                },
                "factors": [
                    "Track position is crucial at Monaco - overtaking is nearly impossible",
                    "Intermediate tires perform poorly on drying track",
                    "Weather forecast shows 40% chance of heavier rain",
                    "Safety car deployment could shuffle the field"
                ],
                "debate_points": {
                    "A": ["Monaco overtaking difficulty", "Track position value", "Weather uncertainty"],
                    "B": ["Safety first approach", "Tire performance advantage", "Potential safety car timing"],
                    "C": ["Information gathering", "Reactive strategy", "Minimizing risk"]
                }
            },
            
            "spa_undercut": {
                "title": "Spa-Francorchamps - Undercut Opportunity",
                "context": "Lap 35 of 60 at Spa. You're P4, 8 seconds behind P3, but your tires are degrading faster. P3 hasn't pitted yet and is on older mediums.",
                "options": {
                    "A": "Pit now for fresh hards - attempt undercut",
                    "B": "Stay out 5 more laps - try to overcut",
                    "C": "Match P3's strategy exactly"
                },
                "factors": [
                    "Spa has long straights favoring fresh tires",
                    "Pit lane time loss is 23 seconds",
                    "DRS zones provide good overtaking opportunities",
                    "Weather conditions are stable"
                ],
                "debate_points": {
                    "A": ["Undercut effectiveness", "Fresh tire advantage", "Track characteristics"],
                    "B": ["Overcut potential", "Tire management", "Strategic patience"],
                    "C": ["Risk minimization", "Reactive strategy", "Driver skill importance"]
                }
            },
            
            "silverstone_safety_car": {
                "title": "Silverstone - Safety Car Strategic Call",
                "context": "Lap 42 of 52 at Silverstone. Safety car deployed. You're P2 on 25-lap old mediums. P1 has newer tires. Most of the field will pit.",
                "options": {
                    "A": "Pit for fresh softs - join the pack but with tire advantage",
                    "B": "Stay out - inherit lead but on older tires",
                    "C": "Pit for hards - compromise between pace and longevity"
                },
                "factors": [
                    "10 laps remaining after safety car",
                    "Silverstone allows good overtaking opportunities",
                    "Soft tires have 8-10 laps of peak performance",
                    "Your car has strong race pace but struggles in traffic"
                ],
                "debate_points": {
                    "A": ["Tire advantage importance", "Overtaking capability", "Risk vs reward"],
                    "B": ["Track position value", "Defensive driving", "Tire management skills"],
                    "C": ["Balanced approach", "Strategic flexibility", "Long-term thinking"]
                }
            },
            
            "hungary_qualifying": {
                "title": "Hungarian GP - Qualifying Setup Dilemma",
                "context": "Saturday morning practice at Hungary. Your car is 0.3s faster in race trim but struggles for one-lap pace. Championship battle is tight.",
                "options": {
                    "A": "Optimize for qualifying - risk poor race pace",
                    "B": "Keep race setup - accept lower grid position",
                    "C": "Find compromise setup - potentially sub-optimal for both"
                },
                "factors": [
                    "Hungary is extremely difficult for overtaking",
                    "Championship points are crucial",
                    "Weather forecast shows possible rain for qualifying",
                    "Your main rival has similar pace dilemma"
                ],
                "debate_points": {
                    "A": ["Grid position importance", "Hungary track characteristics", "Championship pressure"],
                    "B": ["Race pace priority", "Strategic patience", "Overtaking confidence"],
                    "C": ["Risk management", "Balanced approach", "Adaptability"]
                }
            }
        }
        
        self.strategic_principles = {
            "track_position": "Clean air and track position are often worth 2-3 tenths per lap",
            "tire_delta": "Fresh tire advantage typically provides 1-2 seconds per lap initially",
            "undercut_window": "Undercut is most effective within 3-5 laps of optimal pit window",
            "safety_car_timing": "Safety car can gain/lose 20+ seconds depending on timing",
            "weather_factor": "Rain can completely neutralize car performance differences",
            "drs_effect": "DRS zones reduce track position advantage significantly",
            "championship_math": "Points vs risk calculation changes based on championship standing"
        }
    
    def get_random_scenario(self) -> Dict:
        """Returns a random debate scenario"""
        scenario_key = random.choice(list(self.scenarios.keys()))
        return {
            "id": scenario_key,
            **self.scenarios[scenario_key]
        }
    
    def get_scenario_by_id(self, scenario_id: str) -> Optional[Dict]:
        """Returns a specific scenario by ID"""
        if scenario_id in self.scenarios:
            return {
                "id": scenario_id,
                **self.scenarios[scenario_id]
            }
        return None
    
    def generate_debate_format(self, scenario_id: str) -> str:
        """Generates a formatted debate scenario"""
        scenario = self.get_scenario_by_id(scenario_id)
        if not scenario:
            return f"Scenario '{scenario_id}' not found."
        
        debate_text = f"**{scenario['title']}**\n\n"
        debate_text += f"**Scenario:** {scenario['context']}\n\n"
        
        debate_text += "**Strategic Options:**\n"
        for option, description in scenario['options'].items():
            debate_text += f"**Option {option}:** {description}\n"
        debate_text += "\n"
        
        debate_text += "**Key Strategic Factors:**\n"
        for factor in scenario['factors']:
            debate_text += f"• {factor}\n"
        debate_text += "\n"
        
        debate_text += "**Debate Arguments:**\n"
        for option, points in scenario['debate_points'].items():
            option_desc = scenario['options'][option].split(' - ')[0]
            debate_text += f"**For Option {option} ({option_desc}):**\n"
            for point in points:
                debate_text += f"  - {point}\n"
        debate_text += "\n"
        
        debate_text += "**Discussion Questions:**\n"
        debate_text += "- Which factors are most important in this scenario?\n"
        debate_text += "- How would your decision change if you were leading/trailing in the championship?\n"
        debate_text += "- What would you do and why?\n"
        
        return debate_text
    
    def get_all_scenarios(self) -> List[str]:
        """Returns list of all available scenario IDs"""
        return list(self.scenarios.keys())
    
    def get_strategic_principle(self, principle: str) -> str:
        """Returns explanation of a strategic principle"""
        return self.strategic_principles.get(principle, f"Principle '{principle}' not found.")
    
    def create_custom_scenario(self, title: str, context: str, options: Dict, factors: List[str]) -> str:
        """Creates a custom debate scenario format"""
        debate_text = f"**{title}**\n\n"
        debate_text += f"**Scenario:** {context}\n\n"
        
        debate_text += "**Strategic Options:**\n"
        for option, description in options.items():
            debate_text += f"**Option {option}:** {description}\n"
        debate_text += "\n"
        
        debate_text += "**Key Strategic Factors:**\n"
        for factor in factors:
            debate_text += f"• {factor}\n"
        debate_text += "\n"
        
        debate_text += "**Questions for Debate:**\n"
        debate_text += "- What are the pros and cons of each option?\n"
        debate_text += "- Which strategic factors are most critical?\n"
        debate_text += "- How do external factors influence your decision?\n"
        
        return debate_text

# Create global instance
debate_scenarios = DebateScenarios() 