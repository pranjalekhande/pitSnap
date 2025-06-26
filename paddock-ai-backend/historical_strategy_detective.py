from typing import Dict, List, Optional

class HistoricalStrategyDetective:
    def __init__(self):
        self.strategic_cases = {
            "rain_scenarios": [
                {
                    "race": "Brazil 2008 - Hamilton's Championship",
                    "situation": "Rain late in race, Hamilton P6, needed P5 for title",
                    "decision": "Perfect tire timing - switched to inters at optimal moment",
                    "outcome": "SUCCESS - Won championship by 1 point",
                    "lesson": "Championship pressure requires calculated risks"
                },
                {
                    "race": "Turkey 2020 - Perez's Breakthrough", 
                    "situation": "Chaotic wet conditions, multiple tire changes needed",
                    "decision": "Racing Point kept Perez out on inters longer than rivals",
                    "outcome": "SUCCESS - Perez won his first race",
                    "lesson": "Commitment to strategy pays off in changing conditions"
                }
            ],
            "safety_car_calls": [
                {
                    "race": "Abu Dhabi 2021 - Championship Decider",
                    "situation": "Late safety car, Hamilton leading on old tires",
                    "decision": "Mercedes kept Hamilton out for track position",
                    "outcome": "FAILURE - Lost championship on final lap",
                    "lesson": "Sometimes tire advantage trumps track position"
                },
                {
                    "race": "Monza 2020 - Gasly's Breakthrough",
                    "situation": "Safety car bunched field, good track position",
                    "decision": "AlphaTauri stayed out while others pitted",
                    "outcome": "SUCCESS - Gasly won his first race", 
                    "lesson": "Contrarian strategies can work when executed perfectly"
                }
            ]
        }
    
    def find_similar_scenarios(self, user_scenario: str) -> str:
        """Find historical scenarios similar to user query"""
        scenario_lower = user_scenario.lower()
        
        if any(word in scenario_lower for word in ["rain", "wet", "weather"]):
            category = "rain_scenarios"
            title = "Weather Strategy"
        elif any(word in scenario_lower for word in ["safety", "car", "sc"]):
            category = "safety_car_calls" 
            title = "Safety Car Strategy"
        else:
            return self._general_strategic_wisdom(user_scenario)
        
        cases = self.strategic_cases[category]
        
        analysis = f"🔍 **Historical Strategy Detective: {title}**\n\n"
        analysis += f"**Your Query:** {user_scenario}\n\n"
        analysis += f"**Similar Historical Cases:**\n\n"
        
        for i, case in enumerate(cases, 1):
            analysis += f"**Case {i}: {case['race']}**\n"
            analysis += f"• **Situation:** {case['situation']}\n"
            analysis += f"• **Decision:** {case['decision']}\n"
            analysis += f"• **Outcome:** {case['outcome']}\n"
            analysis += f"• **Lesson:** {case['lesson']}\n\n"
        
        analysis += f"**Historical Patterns:**\n"
        successes = [c for c in cases if "SUCCESS" in c['outcome']]
        failures = [c for c in cases if "FAILURE" in c['outcome']]
        
        if successes:
            analysis += f"**What Usually Works:**\n"
            for case in successes:
                analysis += f"• {case['lesson']}\n"
        
        if failures:
            analysis += f"\n**Common Pitfalls:**\n"
            for case in failures:
                analysis += f"• {case['lesson']}\n"
        
        return analysis
    
    def _general_strategic_wisdom(self, scenario: str) -> str:
        """Return general strategic insights"""
        return f"""🔍 **Historical Strategy Detective**

**Your Scenario:** {scenario}

**Strategic Principles from F1 History:**

**🏆 Championship-Winning Strategies:**
• **Risk Management:** Leading drivers often choose conservative strategies
• **Opportunism:** Trailing drivers must take calculated risks
• **Consistency:** Points finish often better than DNF risk

**⚡ Race-Winning Tactics:**
• **Timing is Everything:** Right strategy at wrong time = failure
• **Adaptability:** Best teams adjust when conditions change  
• **Information Advantage:** Better data = better decisions

**📚 Classic Strategic Lessons:**
• Monaco 2022: Ferrari's strategy error cost Leclerc victory
• Spain 2013: Alonso's tire management overcame pace deficit
• Hungary 2020: Hamilton's recovery drive from last to podium

**💡 For specific insights, try:**
• "Rain strategy decisions"
• "Safety car pit calls"  
• "Tire strategy battles"
• "Championship pressure decisions"
"""

# Global instance
historical_detective = HistoricalStrategyDetective()
