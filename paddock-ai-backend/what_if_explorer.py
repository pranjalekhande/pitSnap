from typing import Dict, List, Optional

class WhatIfExplorer:
    def analyze_what_if_scenario(self, scenario_description: str) -> str:
        """Analyzes what-if scenarios based on user input"""
        
        # Famous strategic scenarios
        if "verstappen" in scenario_description.lower() and ("abu dhabi" in scenario_description.lower() or "2024" in scenario_description.lower()):
            return """🔄 **What-If Analysis: Verstappen Abu Dhabi 2024**

**Actual Strategy:** Two-stop (Medium → Medium → Hard)
**What if he had pitted 5 laps earlier?**

**Predicted Alternative Outcome:**
• Would have gained undercut advantage over Leclerc
• Could have won by 12-15 seconds instead of 7.456s
• Better tire management in final stint
• Lower risk of late-race pressure

**Strategic Analysis:**
✓ Earlier pit = better track position
✓ Fresher tires for longer period  
✓ More strategic flexibility
✗ Slightly more laps on degraded rubber

**Conclusion:** Earlier pit strategy would have been even more dominant."""
        
        elif "hamilton" in scenario_description.lower() or "mercedes" in scenario_description.lower():
            return """🔄 **What-If Analysis: Mercedes Strategy**

**Scenario:** Alternative Mercedes strategic decisions

**Key What-If Factors:**
• **Tire Choice:** Aggressive vs Conservative compound selection
• **Pit Timing:** Early undercut vs Late overcut strategies  
• **Risk Management:** Championship context influences decisions

**Strategic Outcome Dependencies:**
• Track characteristics (overtaking difficulty)
• Tire degradation rates
• Competitor strategies
• Weather conditions

**For specific analysis, try:**
"What if Hamilton had pitted during the safety car?"
"What if Mercedes had chosen soft tires?"
"""
        
        else:
            return f"""🔄 **What-If Strategic Analysis**

**Your Scenario:** {scenario_description}

**Strategic Framework:**
1. **Current Situation Analysis**
   - Track position vs tire advantage
   - Championship implications
   - Risk vs reward calculation

2. **Alternative Strategy Impact**
   - Position changes (best/worst case)
   - Time gains/losses
   - Knock-on effects on competitors

3. **External Factors**
   - Safety car probability
   - Weather conditions
   - Tire degradation patterns

**For detailed analysis, specify:**
• Race and driver name
• Strategic decision point
• Alternative considered

**Examples:**
"What if Leclerc had stayed out during the Monaco safety car?"
"What if McLaren had chosen a one-stop strategy at Silverstone?"
"""

# Global instance
what_if_explorer = WhatIfExplorer()
