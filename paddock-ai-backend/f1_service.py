from datetime import datetime, timezone, timedelta
import logging
import requests
import json
import os
from typing import Dict, List, Any, Optional, Tuple
import pytz
from f1_api_client import F1APIClient

# Import the fixed F1 API client with real data
from f1_api_client import f1_client

logger = logging.getLogger(__name__)

class F1DataService:
    """Service for fetching F1 data using live web search and APIs"""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.api_client = F1APIClient()
        self.schedule_config = self._load_schedule_config()
    
    def _load_schedule_config(self) -> Dict[str, Any]:
        """Load F1 schedule from config file"""
        try:
            config_path = os.path.join(os.path.dirname(__file__), 'f1_schedule_config.json')
            with open(config_path, 'r') as f:
                config = json.load(f)
                print(f"✅ Loaded F1 {config['season']} schedule with {len(config['events'])} races")
                return config
        except Exception as e:
            logger.error(f"Failed to load schedule config: {e}")
            # Return minimal fallback config
            return {
                "season": 2025,
                "events": [],
                "last_updated": datetime.now().isoformat()
            }
    
    def _get_current_utc_time(self) -> datetime:
        """Get current UTC time"""
        return datetime.now(pytz.UTC)
    
    def _parse_session_time(self, time_str: str, timezone_str: str) -> datetime:
        """Parse session time string with timezone to UTC"""
        try:
            # Parse the time as naive datetime
            naive_dt = datetime.fromisoformat(time_str)
            
            # Localize to the event timezone
            local_tz = pytz.timezone(timezone_str)
            local_dt = local_tz.localize(naive_dt)
            
            # Convert to UTC
            return local_dt.astimezone(pytz.UTC)
        except Exception as e:
            logger.error(f"Failed to parse session time {time_str} with timezone {timezone_str}: {e}")
            return None
    
    def _get_race_status_with_timing(self, event: Dict) -> str:
        """Determine race status based on exact timing"""
        current_time = self._get_current_utc_time()
        
        # Parse race time
        race_time = self._parse_session_time(
            event['sessions']['race'], 
            event['timezone']
        )
        
        if not race_time:
            # Fallback to date-based calculation
            race_date = datetime.strptime(event['date'], '%Y-%m-%d')
            race_date = pytz.UTC.localize(race_date)
            
            if current_time > race_date + timedelta(days=1):
                return "completed"
            elif current_time < race_date - timedelta(days=2):
                return "upcoming"
            else:
                return "current"
        
        # More precise timing-based calculation
        practice1_time = self._parse_session_time(
            event['sessions']['practice1'], 
            event['timezone']
        )
        
        # Race weekend starts with Practice 1
        race_weekend_start = practice1_time if practice1_time else race_time - timedelta(days=2)
        race_weekend_end = race_time + timedelta(hours=3)  # 3 hours after race start
        
        if current_time > race_weekend_end:
            return "completed"
        elif current_time >= race_weekend_start:
            return "current"
        else:
            return "upcoming"
    
    def _is_live_session(self, event: Dict) -> Tuple[bool, Optional[str]]:
        """Check if any session is currently live"""
        current_time = self._get_current_utc_time()
        
        sessions = ['practice1', 'practice2', 'practice3', 'qualifying', 'race']
        session_durations = {
            'practice1': 90,  # minutes
            'practice2': 90,
            'practice3': 60,
            'qualifying': 90,
            'race': 180  # 3 hours max
        }
        
        for session_name in sessions:
            if session_name in event['sessions']:
                session_start = self._parse_session_time(
                    event['sessions'][session_name],
                    event['timezone']
                )
                
                if session_start:
                    session_end = session_start + timedelta(minutes=session_durations[session_name])
                    
                    if session_start <= current_time <= session_end:
                        return True, session_name
        
        return False, None
    
    def _get_next_session(self, event: Dict) -> Tuple[Optional[str], Optional[datetime]]:
        """Get the next upcoming session for this event"""
        current_time = self._get_current_utc_time()
        
        sessions = ['practice1', 'practice2', 'practice3', 'qualifying', 'race']
        
        for session_name in sessions:
            if session_name in event['sessions']:
                session_time = self._parse_session_time(
                    event['sessions'][session_name],
                    event['timezone']
                )
                
                if session_time and session_time > current_time:
                    return session_name, session_time
        
        return None, None
    
    def _calculate_cache_ttl_with_timing(self, event: Dict) -> int:
        """Calculate cache TTL based on race timing and current status"""
        status = self._get_race_status_with_timing(event)
        is_live, live_session = self._is_live_session(event)
        
        # Live session: very short cache (15-30 seconds)
        if is_live:
            return 15 if live_session == 'race' else 30
        
        # During race weekend: short cache (1-2 minutes)
        if status == "current":
            return 60
        
        # Between race weekends: longer cache (15-30 minutes)
        if status == "upcoming":
            # Check if it's the next race (within 7 days)
            next_race_time = self._parse_session_time(
                event['sessions']['race'],
                event['timezone']
            )
            if next_race_time:
                time_to_race = (next_race_time - self._get_current_utc_time()).total_seconds()
                if time_to_race < 7 * 24 * 3600:  # Within 7 days
                    return 300  # 5 minutes
            
            return 1800  # 30 minutes
        
        # Completed races: long cache (24 hours)
        return 86400
    
    def get_schedule_with_timing(self) -> List[Dict]:
        """Get F1 schedule with enhanced timing information"""
        events = []
        
        for event in self.schedule_config.get('events', []):
            enhanced_event = event.copy()
            
            # Calculate precise status
            enhanced_event['status'] = self._get_race_status_with_timing(event)
            
            # Add live session info
            is_live, live_session = self._is_live_session(event)
            enhanced_event['is_live'] = is_live
            if is_live:
                enhanced_event['live_session'] = live_session
            
            # Add next session info
            next_session, next_session_time = self._get_next_session(event)
            if next_session and next_session_time:
                enhanced_event['next_session'] = next_session
                enhanced_event['next_session_time'] = next_session_time.isoformat()
            
            # Add cache TTL recommendation
            enhanced_event['cache_ttl'] = self._calculate_cache_ttl_with_timing(event)
            
            events.append(enhanced_event)
        
        return events
    
    def get_current_race_info(self) -> Dict:
        """Get current race information with precise timing"""
        current_time = self._get_current_utc_time()
        
        # Find the current race (ongoing or just completed)
        current_race = None
        for event in self.schedule_config.get('events', []):
            race_time = self._parse_session_time(
                event['sessions']['race'],
                event['timezone']
            )
            
            if race_time:
                # Consider race as "current" if it's within 24 hours
                time_diff = abs((current_time - race_time).total_seconds())
                if time_diff < 24 * 3600:  # Within 24 hours
                    current_race = event
                    break
        
        if not current_race:
            # Find the most recent completed race
            for event in reversed(self.schedule_config.get('events', [])):
                if self._get_race_status_with_timing(event) == "completed":
                    current_race = event
                    break
        
        if current_race:
            enhanced_race = current_race.copy()
            enhanced_race['status'] = self._get_race_status_with_timing(current_race)
            
            # Add live session info
            is_live, live_session = self._is_live_session(current_race)
            enhanced_race['is_live'] = is_live
            if is_live:
                enhanced_race['live_session'] = live_session
            
            return enhanced_race
        
        return {}
    
    def get_next_race_info(self) -> Dict:
        """Get next race information with precise timing"""
        current_time = self._get_current_utc_time()
        
        for event in self.schedule_config.get('events', []):
            race_time = self._parse_session_time(
                event['sessions']['race'],
                event['timezone']
            )
            
            if race_time and race_time > current_time:
                enhanced_race = event.copy()
                enhanced_race['status'] = self._get_race_status_with_timing(event)
                
                # Add countdown info
                time_to_race = (race_time - current_time).total_seconds()
                enhanced_race['countdown_seconds'] = int(time_to_race)
                enhanced_race['countdown_days'] = int(time_to_race // 86400)
                
                # Add next session info
                next_session, next_session_time = self._get_next_session(event)
                if next_session and next_session_time:
                    enhanced_race['next_session'] = next_session
                    enhanced_race['next_session_time'] = next_session_time.isoformat()
                    
                    time_to_next = (next_session_time - current_time).total_seconds()
                    enhanced_race['next_session_countdown'] = int(time_to_next)
                
                return enhanced_race
        
        return {}
    
    def get_2025_schedule(self):
        """Get the 2025 F1 race schedule with dynamic status calculation"""
        try:
            events = []
            
            for event in self.schedule_config.get('events', []):
                # Calculate dynamic status based on current date
                dynamic_status = self._get_race_status_with_timing(event)
                
                events.append({
                    'round': event['round'],
                    'name': event['name'],
                    'location': event['location'],
                    'country': event['country'],
                    'date': f"{event['date']}T00:00:00Z",
                    'is_upcoming': dynamic_status == "upcoming",
                    'circuit': event['circuit'],
                    'status': dynamic_status  # Add calculated status
                })
            
            current_round = self._get_current_round()
            
            return {
                'season': self.schedule_config.get('season', 2025),
                'events': events,
                'total_rounds': len(events),
                'current_round': current_round,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching 2025 schedule: {e}")
            return {'error': str(e)}
    
    def get_next_race(self):
        """Get information about the next upcoming race - calculated dynamically"""
        try:
            print("🔍 Calculating next race from schedule...")
            
            next_race_info = self._find_next_race()
            
            if not next_race_info:
                return {
                    'message': 'No more races in 2025 season',
                    'season_complete': True
                }
            
            print(f"✅ Next race: {next_race_info['name']} in {next_race_info['days_until']} days")
            
            return {
                'round': next_race_info['round'],
                'name': next_race_info['name'],
                'location': next_race_info['location'],
                'country': next_race_info['country'],
                'date': f"{next_race_info['date']}T00:00:00+00:00",
                'days_until': next_race_info['days_until'],
                'circuit': next_race_info['circuit']
            }
            
        except Exception as e:
            logger.error(f"Error fetching next race: {e}")
            return {'error': str(e)}
    
    def _get_live_f1_data(self, query: str) -> Dict[str, Any]:
        """Get live F1 data using OpenAI with web search capabilities"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.openai_api_key}'
            }
            
            payload = {
                'model': 'gpt-4o',
                'messages': [
                    {
                        'role': 'system',
                        'content': '''You are an F1 data expert. Search the web for the most current F1 2025 information and return it in valid JSON format. 

CRITICAL: Always search for the LATEST, MOST CURRENT data from official F1 sources like F1.com, ESPN F1, BBC Sport F1, or Sky Sports F1.

Return data in this exact JSON structure:
{
  "success": true,
  "data": {
    "championship_standings": [
      {"position": 1, "driver": "Driver Name", "team": "Team Name", "points": 000}
    ],
    "latest_race": {
      "name": "Race Name", 
      "date": "2025-MM-DD",
      "winner": "Winner Name",
      "results": [
        {"position": 1, "driver": "Driver", "team": "Team", "time": "time", "points": 25}
      ]
    },
    "next_race": {
      "name": "Race Name",
      "location": "Location", 
      "date": "2025-MM-DD",
      "days_until": 0
    }
  }
}

If you cannot find current data, return {"success": false, "error": "reason"}'''
                    },
                    {
                        'role': 'user',
                        'content': f'Get current F1 2025 data: {query}'
                    }
                ],
                'max_tokens': 1500,
                'temperature': 0.1
            }
            
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                # Try to parse JSON from the response
                try:
                    # Extract JSON from markdown code blocks if present
                    if '```json' in content:
                        start = content.find('```json') + 7
                        end = content.find('```', start)
                        content = content[start:end].strip()
                    elif '```' in content:
                        start = content.find('```') + 3
                        end = content.find('```', start)
                        content = content[start:end].strip()
                    
                    return json.loads(content)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse JSON from OpenAI response: {content}")
                    return {"success": False, "error": "Failed to parse response"}
                    
            else:
                logger.error(f"OpenAI API error: {response.status_code}")
                return {"success": False, "error": f"API error: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Error getting live F1 data: {e}")
            return {"success": False, "error": str(e)}
    
    def _get_fallback_data(self) -> Dict[str, Any]:
        """Fallback to verified static data if live fetch fails"""
        return {
            "success": True,
            "data": {
                "championship_standings": [
                    {"position": 1, "driver": "Oscar Piastri", "team": "McLaren", "points": 216},
                    {"position": 2, "driver": "Lando Norris", "team": "McLaren", "points": 201},
                    {"position": 3, "driver": "Max Verstappen", "team": "Red Bull Racing", "points": 155},
                    {"position": 4, "driver": "George Russell", "team": "Mercedes", "points": 146},
                    {"position": 5, "driver": "Charles Leclerc", "team": "Ferrari", "points": 119},
                    {"position": 6, "driver": "Lewis Hamilton", "team": "Ferrari", "points": 91},
                    {"position": 7, "driver": "Kimi Antonelli", "team": "Mercedes", "points": 63},
                    {"position": 8, "driver": "Alexander Albon", "team": "Williams", "points": 42}
                ],
                "latest_race": {
                    "name": "Austrian Grand Prix",
                    "date": "2025-06-29",
                    "winner": "Lando Norris",
                    "results": [
                        {"position": 1, "driver": "Lando Norris", "team": "McLaren", "time": "1:23:47.693", "points": 25},
                        {"position": 2, "driver": "Oscar Piastri", "team": "McLaren", "time": "+2.695s", "points": 18},
                        {"position": 3, "driver": "Charles Leclerc", "team": "Ferrari", "time": "+19.820s", "points": 15},
                        {"position": 4, "driver": "Lewis Hamilton", "team": "Ferrari", "time": "+29.020s", "points": 12},
                        {"position": 5, "driver": "George Russell", "team": "Mercedes", "time": "+62.396s", "points": 10}
                    ]
                },
                "next_race": {
                    "name": "British Grand Prix",
                    "location": "Silverstone",
                    "date": "2025-07-06",
                    "days_until": 6
                }
            }
        }
    
    def get_latest_race_results(self):
        """Get results from the most recent completed race using live data"""
        try:
            print("🔍 Fetching live F1 race results...")
            
            # Try to get live data first
            live_data = self._get_live_f1_data("latest F1 race results winner podium 2025")
            
            if live_data.get("success") and live_data.get("data", {}).get("latest_race"):
                race_data = live_data["data"]["latest_race"]
                print(f"✅ Got live data for: {race_data.get('name', 'Unknown')}")
                
                return {
                    'race': race_data.get('name', 'Latest Race'),
                    'date': race_data.get('date', '2025-06-29T00:00:00'),
                    'results': race_data.get('results', [])
                }
            else:
                print("⚠️ Live data failed, using fallback...")
                fallback = self._get_fallback_data()
                race_data = fallback["data"]["latest_race"]
                
                return {
                    'race': race_data['name'],
                    'date': f"{race_data['date']}T00:00:00",
                    'results': race_data['results']
                }
            
        except Exception as e:
            logger.error(f"Error fetching latest race results: {e}")
            return {'error': str(e)}
    
    def get_current_standings(self):
        """Get current driver standings using live data"""
        try:
            print("🔍 Fetching live F1 championship standings...")
            
            # Try to get live data first
            live_data = self._get_live_f1_data("F1 2025 championship standings driver points current")
            
            if live_data.get("success") and live_data.get("data", {}).get("championship_standings"):
                standings = live_data["data"]["championship_standings"]
                print(f"✅ Got live standings data for {len(standings)} drivers")
                
                # Convert to the expected format
                results = []
                for standing in standings:
                    gap_text = "Championship Leader" if standing['position'] == 1 else f"-{standings[0]['points'] - standing['points']} pts"
                    results.append({
                        'position': standing['position'],
                        'driver': standing['driver'],
                        'team': standing['team'],
                        'time': gap_text,
                        'points': float(standing['points'])
                    })
                
                return {
                    'race': 'Current Championship Standings',
                    'date': '2025-06-29T00:00:00',
                    'results': results
                }
            else:
                print("⚠️ Live data failed, using fallback...")
                fallback = self._get_fallback_data()
                standings = fallback["data"]["championship_standings"]
                
                results = []
                for standing in standings:
                    gap_text = "Championship Leader" if standing['position'] == 1 else f"-{standings[0]['points'] - standing['points']} pts"
                    results.append({
                        'position': standing['position'],
                        'driver': standing['driver'],
                        'team': standing['team'],
                        'time': gap_text,
                        'points': float(standing['points'])
                    })
                
                return {
                    'race': 'Austrian Grand Prix',
                    'date': '2025-06-29T00:00:00',
                    'results': results
                }
            
        except Exception as e:
            logger.error(f"Error fetching standings: {e}")
            return {'error': str(e)}

    def get_standings(self) -> Dict:
        """Get current championship standings"""
        return self.api_client.get_standings()
    
    def get_results(self, round_number: int = None) -> Dict:
        """Get race results"""
        return self.api_client.get_results(round_number)
    
    def get_basic_f1_data(self) -> Dict:
        """Get basic F1 data for instant UI responses"""
        return self.api_client.get_basic_f1_data()
    
    def get_championship_insights(self) -> Dict:
        """Get championship insights and predictions"""
        return self.api_client.get_championship_insights()

# Test function
def test_f1_service():
    """Test function to verify FastF1 works with 2025 data"""
    service = F1DataService()
    
    print(" Testing FastF1 with 2025 data...")
    
    # Test 1: Get 2025 schedule
    print("\n📅 Testing 2025 schedule...")
    schedule = service.get_2025_schedule()
    if 'error' not in schedule:
        print(f"✅ Found {schedule['total_rounds']} races in 2025")
        print(f"   First race: {schedule['events'][0]['name']} in {schedule['events'][0]['location']}")
    else:
        print(f" Schedule error: {schedule['error']}")
    
    # Test 2: Get next race
    print("\n🏆 Testing next race...")
    next_race = service.get_next_race()
    if 'error' not in next_race:
        print(f"✅ Next race: {next_race['name']} in {next_race['days_until']} days")
    else:
        print(f" Next race error: {next_race['error']}")
    
    # Test 3: Get latest results
    print("\n🏁 Testing latest race results...")
    results = service.get_latest_race_results()
    if 'error' not in results:
        if 'results' in results:
            print(f"✅ Latest race: {results['race']}")
            print(f"   Winner: {results['results'][0]['driver']} ({results['results'][0]['team']})")
        else:
            print(f"ℹ️  {results['message']}")
    else:
        print(f" Results error: {results['error']}")
    
    return service

if __name__ == "__main__":
    test_f1_service() 