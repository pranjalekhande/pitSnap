import fastf1
import pandas as pd
from datetime import datetime, timezone
import logging

# Configure caching for FastF1
fastf1.Cache.enable_cache('/tmp/fastf1_cache')

logger = logging.getLogger(__name__)

class F1DataService:
    """Service for fetching F1 data using FastF1"""
    
    def __init__(self):
        # Suppress some FastF1 warnings
        fastf1.set_log_level('WARNING')
    
    def get_2025_schedule(self):
        """Get the 2025 F1 race schedule"""
        try:
            schedule = fastf1.get_event_schedule(2025)
            
            # Convert to a more API-friendly format
            events = []
            for idx, event in schedule.iterrows():
                # Get next/current race info
                now = datetime.now(timezone.utc)
                event_date = pd.to_datetime(event['EventDate']).tz_localize('UTC')
                
                events.append({
                    'round': event['RoundNumber'],
                    'name': event['EventName'],
                    'location': event['Location'],
                    'country': event['Country'],
                    'date': event_date.isoformat(),
                    'is_upcoming': event_date > now,
                    'circuit': event['EventName']  # Simplified
                })
            
            return {
                'season': 2025,
                'events': events,
                'total_rounds': len(events)
            }
            
        except Exception as e:
            logger.error(f"Error fetching 2025 schedule: {e}")
            return {'error': str(e)}
    
    def get_latest_race_results(self):
        """Get results from the most recent completed race"""
        try:
            schedule = fastf1.get_event_schedule(2025)
            now = datetime.now(timezone.utc)
            
            # Find the most recent completed race
            completed_races = []
            for idx, event in schedule.iterrows():
                event_date = pd.to_datetime(event['EventDate']).tz_localize('UTC')
                if event_date < now:
                    completed_races.append((idx, event, event_date))
            
            if not completed_races:
                return {'message': 'No completed races yet in 2025'}
            
            # Get the latest completed race
            latest_race = max(completed_races, key=lambda x: x[2])
            event = latest_race[1]
            
            # Try to load the race session
            try:
                session = fastf1.get_session(2025, event['RoundNumber'], 'R')
                session.load()
                
                # Get race results
                results = session.results
                
                race_results = []
                for idx, driver in results.iterrows():
                    # Handle NaN and infinite values for JSON serialization
                    position = int(driver['Position']) if pd.notna(driver['Position']) and not pd.isinf(driver['Position']) else 0
                    points = float(driver['Points']) if pd.notna(driver['Points']) and not pd.isinf(driver['Points']) else 0.0
                    
                    race_results.append({
                        'position': position,
                        'driver': str(driver['FullName']) if pd.notna(driver['FullName']) else 'Unknown',
                        'team': str(driver['TeamName']) if pd.notna(driver['TeamName']) else 'Unknown',
                        'time': str(driver['Time']) if pd.notna(driver['Time']) else 'DNF',
                        'points': points
                    })
                
                return {
                    'race': event['EventName'],
                    'date': pd.to_datetime(event['EventDate']).isoformat(),
                    'results': race_results
                }
                
            except Exception as session_error:
                return {
                    'race': event['EventName'],
                    'date': pd.to_datetime(event['EventDate']).isoformat(),
                    'error': f'Race data not yet available: {session_error}'
                }
            
        except Exception as e:
            logger.error(f"Error fetching latest race results: {e}")
            return {'error': str(e)}
    
    def get_next_race(self):
        """Get information about the next upcoming race"""
        try:
            schedule = fastf1.get_event_schedule(2025)
            now = datetime.now(timezone.utc)
            
            # Find the next upcoming race
            upcoming_races = []
            for idx, event in schedule.iterrows():
                event_date = pd.to_datetime(event['EventDate']).tz_localize('UTC')
                if event_date > now:
                    upcoming_races.append((idx, event, event_date))
            
            if not upcoming_races:
                return {'message': 'No more races in 2025 season'}
            
            # Get the next race
            next_race = min(upcoming_races, key=lambda x: x[2])
            event = next_race[1]
            event_date = next_race[2]
            
            # Calculate days until race
            days_until = (event_date - now).days
            
            return {
                'round': event['RoundNumber'],
                'name': event['EventName'],
                'location': event['Location'],
                'country': event['Country'],
                'date': event_date.isoformat(),
                'days_until': days_until
            }
            
        except Exception as e:
            logger.error(f"Error fetching next race: {e}")
            return {'error': str(e)}
    
    def get_current_standings(self):
        """Get current driver standings (from latest completed race)"""
        try:
            # This is a simplified version - in a real implementation,
            # you'd aggregate results from all completed races
            schedule = fastf1.get_event_schedule(2025)
            now = datetime.now(timezone.utc)
            
            # Find completed races
            completed_races = []
            for idx, event in schedule.iterrows():
                event_date = pd.to_datetime(event['EventDate']).tz_localize('UTC')
                if event_date < now:
                    completed_races.append(event['RoundNumber'])
            
            if not completed_races:
                return {'message': 'No completed races yet in 2025'}
            
            # For now, just return latest race results as "standings"
            # In production, you'd calculate cumulative points
            return self.get_latest_race_results()
            
        except Exception as e:
            logger.error(f"Error fetching standings: {e}")
            return {'error': str(e)}

# Test function
def test_f1_service():
    """Test function to verify FastF1 works with 2025 data"""
    service = F1DataService()
    
    print("🏁 Testing FastF1 with 2025 data...")
    
    # Test 1: Get 2025 schedule
    print("\n📅 Testing 2025 schedule...")
    schedule = service.get_2025_schedule()
    if 'error' not in schedule:
        print(f"✅ Found {schedule['total_rounds']} races in 2025")
        print(f"   First race: {schedule['events'][0]['name']} in {schedule['events'][0]['location']}")
    else:
        print(f"❌ Schedule error: {schedule['error']}")
    
    # Test 2: Get next race
    print("\n🏆 Testing next race...")
    next_race = service.get_next_race()
    if 'error' not in next_race:
        print(f"✅ Next race: {next_race['name']} in {next_race['days_until']} days")
    else:
        print(f"❌ Next race error: {next_race['error']}")
    
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
        print(f"❌ Results error: {results['error']}")
    
    return service

if __name__ == "__main__":
    test_f1_service() 