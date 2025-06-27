import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { F1Event, F1NextRace } from '../../../services/f1DataService';
import { countdownService, CountdownTime } from '../../../services/countdownService';

interface CalendarTabProps {
  pitWallData: any;
  f1DataLoading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

// Countdown display component
const CountdownDisplay: React.FC<{ targetDate: string; title: string }> = ({ targetDate, title }) => {
  const [countdown, setCountdown] = useState<CountdownTime>(countdownService.calculateCountdown(targetDate));

  useEffect(() => {
    const unsubscribe = countdownService.subscribe(
      `countdown_${targetDate}`,
      targetDate,
      setCountdown
    );

    return unsubscribe;
  }, [targetDate]);

  const urgencyLevel = countdownService.getUrgencyLevel(countdown);
  
  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.raceTitle}>{title}</Text>
      {countdown.isLive ? (
        <View style={styles.liveContainer}>
          <Text style={styles.liveText}>🔴 LIVE NOW</Text>
        </View>
      ) : countdown.isPast ? (
        <View style={styles.pastContainer}>
          <Text style={styles.pastText}>✅ COMPLETED</Text>
        </View>
      ) : (
        <View style={[styles.timeContainer, urgencyLevel === 'critical' && styles.criticalContainer]}>
          <View style={styles.timeUnit}>
            <Text style={[styles.timeValue, urgencyLevel === 'critical' && styles.criticalText]}>{countdown.days}</Text>
            <Text style={styles.timeLabel}>DAYS</Text>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeUnit}>
            <Text style={[styles.timeValue, urgencyLevel === 'critical' && styles.criticalText]}>{countdown.hours.toString().padStart(2, '0')}</Text>
            <Text style={styles.timeLabel}>HRS</Text>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeUnit}>
            <Text style={[styles.timeValue, urgencyLevel === 'critical' && styles.criticalText]}>{countdown.minutes.toString().padStart(2, '0')}</Text>
            <Text style={styles.timeLabel}>MIN</Text>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeUnit}>
            <Text style={[styles.timeValue, urgencyLevel === 'critical' && styles.criticalText]}>{countdown.seconds.toString().padStart(2, '0')}</Text>
            <Text style={styles.timeLabel}>SEC</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Race card component
const RaceCard: React.FC<{ event: F1Event; isNext: boolean }> = ({ event, isNext }) => {
  const raceDate = new Date(event.date);
  const isPast = raceDate < new Date();
  
  return (
    <TouchableOpacity style={[styles.raceCard, isNext && styles.nextRaceCard]}>
      <View style={styles.raceHeader}>
        <Text style={styles.raceRound}>ROUND {event.round}</Text>
        <Text style={[styles.raceStatus, isPast && styles.pastRace]}>
          {isPast ? '✅ COMPLETED' : isNext ? '🔥 NEXT' : '📅 UPCOMING'}
        </Text>
      </View>
      
      <Text style={styles.raceName}>{event.name}</Text>
      <Text style={styles.raceLocation}>{event.location}, {event.country}</Text>
      <Text style={styles.raceDate}>
        {raceDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </Text>
      
      {isNext && !isPast && (
        <CountdownDisplay targetDate={event.date} title="Next Race" />
      )}
    </TouchableOpacity>
  );
};

export default function CalendarTab({
  pitWallData,
  f1DataLoading,
  onRefresh,
  refreshing
}: CalendarTabProps) {
  const [selectedView, setSelectedView] = useState<'upcoming' | 'all'>('upcoming');
  
  const schedule = pitWallData?.schedule;
  const nextRace = pitWallData?.next_race;
  
  if (!schedule || !schedule.events) {
    return (
      <View style={styles.container}>
        <FlatList
          data={[]}
          renderItem={() => null}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Loading Race Calendar</Text>
              <Text style={styles.emptyText}>
                Fetching 2025 F1 race schedule...
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // Filter events based on selected view
  const filteredEvents = selectedView === 'upcoming' 
    ? schedule.events.filter((event: F1Event) => new Date(event.date) >= new Date())
    : schedule.events;

  const renderRaceCard = ({ item }: { item: F1Event }) => {
    const isNext = nextRace && item.round === nextRace.round;
    return <RaceCard event={item} isNext={isNext} />;
  };

  return (
    <View style={styles.container}>
      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, selectedView === 'upcoming' && styles.activeToggle]}
          onPress={() => setSelectedView('upcoming')}
        >
          <Text style={[styles.toggleText, selectedView === 'upcoming' && styles.activeToggleText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, selectedView === 'all' && styles.activeToggle]}
          onPress={() => setSelectedView('all')}
        >
          <Text style={[styles.toggleText, selectedView === 'all' && styles.activeToggleText]}>
            Full Season
          </Text>
        </TouchableOpacity>
      </View>

      {/* Next Race Countdown (if available) */}
      {nextRace && selectedView === 'upcoming' && (
        <View style={styles.nextRaceHighlight}>
          <CountdownDisplay targetDate={nextRace.date} title={`${nextRace.name} - ${nextRace.location}`} />
        </View>
      )}

      {/* Race List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderRaceCard}
        keyExtractor={(item) => `race-${item.round}`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151E',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2A',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeToggle: {
    backgroundColor: '#FF6B35',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
  },
  activeToggleText: {
    opacity: 1,
  },
  nextRaceHighlight: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  raceCard: {
    backgroundColor: '#1E1E2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  nextRaceCard: {
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  raceRound: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 1,
  },
  raceStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  pastRace: {
    color: '#757575',
  },
  raceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  raceLocation: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  raceDate: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  countdownContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  raceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 50,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 2,
    letterSpacing: 1,
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
  liveContainer: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  pastContainer: {
    backgroundColor: '#757575',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pastText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  criticalContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  criticalText: {
    color: '#FF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    flex: 1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 