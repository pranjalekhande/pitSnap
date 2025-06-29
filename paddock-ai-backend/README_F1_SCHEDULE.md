# 🏁 F1 Schedule Configuration System

## Overview
This system provides **precise F1 schedule management** with exact session timings, live race detection, and intelligent caching based on race schedules.

## Features

### ✅ **Exact Session Timings**
- **Practice Sessions**: P1, P2, P3 with exact start times
- **Qualifying**: Precise qualifying session timing  
- **Race**: Exact race start time with timezone support
- **Timezone Handling**: Full timezone conversion to UTC

### ✅ **Live Session Detection** 
- **Real-time Status**: Automatically detects if any session is currently live
- **Session Duration**: Knows typical duration for each session type
- **Live Updates**: API responses include live session information

### ✅ **Smart Cache Management**
- **Dynamic TTL**: Cache duration based on race timing context
- **Live Sessions**: 15-30 second cache during live events
- **Race Weekends**: 1-2 minute cache during active weekends  
- **Between Races**: 15-30 minute cache for upcoming events
- **Completed Races**: 24-hour cache for historical data

### ✅ **Precise Race Status**
- **Timing-based Calculation**: Uses exact session times vs. just dates
- **Race Weekend Detection**: Considers Practice 1 start through race end
- **Live Event Context**: Enhanced status during active race weekends

---

## Configuration File Structure

```json
{
  "season": 2025,
  "current_round": 11,
  "last_updated": "2025-06-29",
  "events": [
    {
      "round": 1,
      "name": "Australian Grand Prix",
      "location": "Melbourne", 
      "country": "Australia",
      "date": "2025-03-16",
      "circuit": "Albert Park Circuit",
      "status": "completed",
      "timezone": "Australia/Melbourne",
      "sessions": {
        "practice1": "2025-03-14T02:30:00",
        "practice2": "2025-03-14T06:00:00",
        "practice3": "2025-03-15T02:30:00", 
        "qualifying": "2025-03-15T06:00:00",
        "race": "2025-03-16T05:00:00"
      }
    }
  ]
}
```

### Key Fields

| Field | Description | Example |
|-------|-------------|---------|
| `timezone` | Event timezone (pytz format) | `"Europe/London"` |
| `sessions.practice1` | Practice 1 start time (local) | `"2025-07-04T11:30:00"` |
| `sessions.practice2` | Practice 2 start time (local) | `"2025-07-04T15:00:00"` |
| `sessions.practice3` | Practice 3 start time (local) | `"2025-07-05T10:30:00"` |
| `sessions.qualifying` | Qualifying start time (local) | `"2025-07-05T14:00:00"` |
| `sessions.race` | Race start time (local) | `"2025-07-06T14:00:00"` |

---

## API Enhancements

### New Timing Endpoints

#### **GET /api/schedule-with-timing**
Returns enhanced schedule with live session data:

```json
{
  "round": 12,
  "name": "British Grand Prix",
  "status": "current",
  "is_live": true,
  "live_session": "qualifying",
  "next_session": "race", 
  "next_session_time": "2025-07-06T13:00:00Z",
  "cache_ttl": 30
}
```

#### **GET /api/current-race-info**
Current race with live session detection:

```json
{
  "name": "British Grand Prix",
  "is_live": true,
  "live_session": "race",
  "status": "current"
}
```

#### **GET /api/next-race-info**  
Next race with precise countdown:

```json
{
  "name": "Belgian Grand Prix",
  "countdown_seconds": 604800,
  "countdown_days": 7,
  "next_session": "practice1",
  "next_session_time": "2025-07-25T10:30:00Z",
  "next_session_countdown": 518400
}
```

---

## Session Duration Reference

| Session | Duration | Cache During Live |
|---------|----------|-------------------|
| Practice 1 | 90 minutes | 30 seconds |
| Practice 2 | 90 minutes | 30 seconds |
| Practice 3 | 60 minutes | 30 seconds | 
| Qualifying | 90 minutes | 30 seconds |
| Race | 3 hours max | 15 seconds |

---

## Cache Strategy

### **Timing-Based Cache TTL**

```python
def _calculate_cache_ttl_with_timing(event):
    # Live session: 15-30 seconds
    if is_live:
        return 15 if live_session == 'race' else 30
    
    # Race weekend: 1 minute  
    if status == "current":
        return 60
        
    # Next race (within 7 days): 5 minutes
    if upcoming and time_to_race < 7_days:
        return 300
        
    # Future races: 30 minutes
    if status == "upcoming":
        return 1800
        
    # Completed races: 24 hours
    return 86400
```

### **Context-Aware Caching**

| Context | TTL | Reason |
|---------|-----|--------|  
| 🔴 **Live Race** | 15s | Real-time positions |
| 🟡 **Live Qualifying** | 30s | Lap time updates |
| 🟢 **Race Weekend** | 1min | Active sessions |
| 🔵 **Next Week** | 5min | Schedule changes |
| ⚪ **Future Races** | 30min | Stable data |
| ⚫ **Completed** | 24hrs | Historical data |

---

## Timezone Management

### **Supported Timezones**

| Region | Timezone | Example Races |
|--------|----------|---------------|
| Europe | `Europe/London` | British GP |
| Europe | `Europe/Monaco` | Monaco GP |
| Asia | `Asia/Singapore` | Singapore GP |
| Asia | `Australia/Melbourne` | Australian GP |
| Americas | `America/New_York` | Miami GP |
| Americas | `America/Mexico_City` | Mexican GP |

### **Time Conversion**

All session times are:
1. **Stored** in local event timezone
2. **Converted** to UTC for calculations  
3. **Returned** in ISO format with timezone info

```python
# Example conversion
local_time = "2025-07-06T14:00:00"  # British GP race time
timezone = "Europe/London"          # Local timezone
utc_time = "2025-07-06T13:00:00Z"   # Converted to UTC
```

---

## Updating for New Season

### **Quick Update Process**

1. **Update season year**:
   ```json
   {
     "season": 2026,
     "last_updated": "2025-12-01"
   }
   ```

2. **Add all 24 races** with exact timings from F1.com

3. **Update timezone mappings** for any new venues

4. **Test timing calculations**:
   ```bash
   python -c "from f1_service import f1_service; print(f1_service.get_schedule_with_timing())"
   ```

### **Timing Sources**

- **Official F1**: [formula1.com/calendar](https://formula1.com/calendar)
- **FIA Regulations**: Session time requirements
- **Broadcast Schedules**: TV guide timings
- **Local Timezone Data**: pytz timezone database

---

## Development Notes

### **Key Methods**

| Method | Purpose | Returns |
|--------|---------|---------|
| `_parse_session_time()` | Convert local time to UTC | `datetime` |
| `_is_live_session()` | Check if session is active | `(bool, str)` |
| `_get_next_session()` | Find next upcoming session | `(str, datetime)` |
| `_calculate_cache_ttl_with_timing()` | Dynamic cache duration | `int` (seconds) |

### **Error Handling**

- **Invalid timezone**: Falls back to UTC
- **Missing session data**: Uses date-based calculation  
- **Parse errors**: Graceful degradation to static data
- **Live detection failure**: Assumes not live

### **Performance Considerations**

- **Timezone conversion**: Cached per event
- **Live session checking**: Only during race weekends
- **Status calculation**: Efficient date arithmetic
- **Cache TTL**: Pre-calculated and included in responses

---

## Testing

### **Manual Testing Commands**

```bash
# Test next race calculation
curl http://localhost:8001/api/next-race

# Test enhanced schedule  
curl http://localhost:8001/api/schedule-with-timing

# Test live session detection
curl http://localhost:8001/api/current-race-info

# Check cache TTL recommendations
python -c "
from f1_service import f1_service
events = f1_service.get_schedule_with_timing()
for e in events[:3]:
    print(f'{e[\"name\"]}: {e[\"cache_ttl\"]}s cache')
"
```

### **Validation Checklist**

- [ ] All 24 races have complete session times
- [ ] Timezone conversions are accurate
- [ ] Live session detection works during race weekends  
- [ ] Cache TTL values are reasonable
- [ ] Next race calculations are correct
- [ ] API responses include timing metadata

---

## 🚀 Ready for 2025 Season!

This enhanced timing system provides **precision F1 data management** with:

✅ **Exact session times** for all 24 races  
✅ **Live race weekend detection**  
✅ **Smart caching** based on race context  
✅ **Timezone-aware** calculations  
✅ **Performance optimized** for mobile apps  

The system automatically adapts cache strategies and provides real-time context about the F1 season, ensuring optimal performance and accuracy for the PitSnap app. 