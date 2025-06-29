import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Linking,
} from 'react-native';

interface StandingsTabProps {
  pitWallData: any;
  f1DataLoading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

// Helper functions for driver/team display (copied from PitWallScreen)
const getCountryFlag = (driverName: string): string => {
  const flagMap: { [key: string]: string } = {
    'Max Verstappen': '🇳🇱', 'Lando Norris': '🇬🇧', 'Charles Leclerc': '🇲🇨',
    'Oscar Piastri': '🇦🇺', 'George Russell': '🇬🇧', 'Lewis Hamilton': '🇬🇧',
    'Carlos Sainz': '🇪🇸', 'Fernando Alonso': '🇪🇸', 'Sergio Perez': '🇲🇽',
    'Yuki Tsunoda': '🇯🇵', 'Lance Stroll': '🇨🇦', 'Nico Hulkenberg': '🇩🇪',
    'Pierre Gasly': '🇫🇷', 'Esteban Ocon': '🇫🇷', 'Alexander Albon': '🇹🇭',
    'Logan Sargeant': '🇺🇸', 'Kevin Magnussen': '🇩🇰', 'Valtteri Bottas': '🇫🇮',
    'Kimi Antonelli': '🇮🇹', 'Franco Colapinto': '🇦🇷', 'Oliver Bearman': '🇬🇧',
    'Gabriel Bortoleto': '🇧🇷', 'Isack Hadjar': '🇫🇷', 'Liam Lawson': '🇳🇿'
  };
  return flagMap[driverName] || '🏁';
};

const getTeamLogo = (teamName: string): { source: any; fallbackEmoji: string } => {
  const teamLogos: { [key: string]: { source: any; fallbackEmoji: string } } = {
    'Red Bull Racing': { source: require('../../../assets/team-logos/red-bull.png'), fallbackEmoji: '🟦' },
    'McLaren': { source: require('../../../assets/team-logos/mclaren.png'), fallbackEmoji: '🟠' },
    'Ferrari': { source: require('../../../assets/team-logos/ferrari.png'), fallbackEmoji: '🔴' },
    'Mercedes': { source: require('../../../assets/team-logos/mercedes.png'), fallbackEmoji: '⚪' },
    'Aston Martin': { source: require('../../../assets/team-logos/aston-martin.png'), fallbackEmoji: '🟢' },
    'Williams': { source: require('../../../assets/team-logos/williams.png'), fallbackEmoji: '🔵' },
    'Alpine': { source: require('../../../assets/team-logos/alpine.png'), fallbackEmoji: '🩷' },
    'Haas F1 Team': { source: require('../../../assets/team-logos/haas.png'), fallbackEmoji: '⚪' },
  };
  
  return teamLogos[teamName] || { source: null, fallbackEmoji: '⚫' };
};

// Handle navigation to external F1 website
const handleF1WebsiteNavigation = (url: string, context: string) => {
  Alert.alert(
    'Open F1 Website',
    `Would you like to view ${context} on the official Formula 1 website?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open F1.com',
        onPress: () => {
          Linking.openURL(url).catch(err => {
            Alert.alert('Error', 'Unable to open website. Please try again.');
            console.error('Failed to open URL:', err);
          });
        },
      },
    ],
    { cancelable: true }
  );
};

// Skeleton loading component
const SkeletonCard = ({ height = 120 }: { height?: number }) => (
  <View style={[styles.raceCard, { height, backgroundColor: '#1A1A24' }]}>
    <View style={[styles.skeletonLine, { width: '30%', height: 16, marginBottom: 12 }]} />
    <View style={[styles.skeletonLine, { width: '80%', height: 20, marginBottom: 6 }]} />
    <View style={[styles.skeletonLine, { width: '60%', height: 16, marginBottom: 4 }]} />
    <View style={[styles.skeletonLine, { width: '40%', height: 14 }]} />
  </View>
);

export default function StandingsTab({
  pitWallData,
  f1DataLoading,
  onRefresh,
  refreshing
}: StandingsTabProps) {
  const currentYear = new Date().getFullYear();

  const standingsItems = [];

  // Add championship standings if available
  if (pitWallData?.championship_standings) {
    standingsItems.push({
      id: 'championship_standings',
      type: 'championship_standings',
      data: pitWallData.championship_standings
    });
  }

  // Add next race
  if (pitWallData?.next_race) {
    standingsItems.push({
      id: 'next_race',
      type: 'next_race',
      data: pitWallData.next_race
    });
  }

  // Add latest results
  if (pitWallData?.latest_results) {
    standingsItems.push({
      id: 'latest_results',
      type: 'latest_results',
      data: pitWallData.latest_results
    });
  }

  const renderStandingsItem = ({ item }: { item: any }) => {
    if (f1DataLoading) {
      return <SkeletonCard height={140} />;
    }

    switch (item.type) {
      case 'championship_standings':
        const hasRealPoints = item.data.drivers?.some((driver: any) => driver.points > 0);
        const driversToShow = item.data.drivers?.slice(0, 5) || [];
        
        return (
          <TouchableOpacity 
            style={styles.raceCard}
            onPress={() => handleF1WebsiteNavigation(
              `https://www.formula1.com/en/racing/${currentYear}/drivers`, 
              'detailed championship standings and driver statistics'
            )}
            activeOpacity={0.7}
          >
            <Text style={styles.cardTitle}>🏆 Championship Standings</Text>
            <Text style={styles.raceName}>
              {hasRealPoints ? '2025 Drivers\' Championship' : '2025 Driver Lineup'}
            </Text>
            
            {hasRealPoints ? (
              // Show standings with points
              driversToShow.map((driver: any, index: number) => (
                <View key={driver.driver} style={styles.standingRow}>
                  <Text style={styles.standingPosition}>P{driver.position}</Text>
                  <Text style={styles.standingDriver}>{driver.driver}</Text>
                  <Text style={styles.standingPoints}>{driver.points} pts</Text>
                </View>
              ))
            ) : (
              // Show driver lineup with teams and countries/flags
              driversToShow.map((driver: any, index: number) => {
                const teamLogo = getTeamLogo(driver.team);
                return (
                  <View key={driver.driver} style={styles.standingRow}>
                    <Text style={styles.standingPosition}>{getCountryFlag(driver.driver)}</Text>
                    <View style={styles.driverTeamInfo}>
                      <Text style={styles.standingDriver}>{driver.driver}</Text>
                    </View>
                    <View style={styles.teamLogoContainer}>
                      {teamLogo.source ? (
                        <Image 
                          source={teamLogo.source} 
                          style={styles.teamLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.teamColor}>{teamLogo.fallbackEmoji}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
            
            <Text style={styles.cardLinkHint}>
              {hasRealPoints ? 'Tap to view full standings on F1.com' : 'Tap to view driver info on F1.com'}
            </Text>
          </TouchableOpacity>
        );

      case 'next_race':
        return (
          <TouchableOpacity 
            style={styles.raceCard}
            onPress={() => handleF1WebsiteNavigation(
              `https://www.formula1.com/en/racing/${currentYear}`, 
              'the complete race schedule and upcoming events'
            )}
            activeOpacity={0.7}
          >
            <Text style={styles.cardTitle}>🏁 Next Race</Text>
            <Text style={styles.raceName}>{item.data.name}</Text>
            <Text style={styles.raceLocation}>{item.data.location}, {item.data.country}</Text>
            <Text style={styles.raceTiming}>In {item.data.days_until} days</Text>
            <Text style={styles.cardLinkHint}>Tap to view full schedule on F1.com</Text>
          </TouchableOpacity>
        );

      case 'latest_results':
        return (
          <TouchableOpacity 
            style={styles.raceCard}
            onPress={() => handleF1WebsiteNavigation(
              `https://www.formula1.com/en/racing/${currentYear}`, 
              'detailed race results and championship standings'
            )}
            activeOpacity={0.7}
          >
            <Text style={styles.cardTitle}>🏆 Latest Results</Text>
            {item.data.results ? (
              <>
                <Text style={styles.raceName}>{item.data.race}</Text>
                <Text style={styles.winnerText}>Winner: {item.data.results[0]?.driver}</Text>
                <Text style={styles.teamText}>{item.data.results[0]?.team}</Text>
              </>
            ) : (
              <Text style={styles.raceLocation}>{item.data.message || 'No results available'}</Text>
            )}
            <Text style={styles.cardLinkHint}>Tap to view full results on F1.com</Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={standingsItems}
        renderItem={renderStandingsItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
        ListEmptyComponent={
          !f1DataLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>Standings & Results</Text>
              <Text style={styles.emptyText}>
                Championship standings and race results will appear here
              </Text>
            </View>
          ) : (
            <View>
              <SkeletonCard height={140} />
              <SkeletonCard height={140} />
              <SkeletonCard height={140} />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151E',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  raceCard: {
    backgroundColor: '#1E1E28',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E10600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E10600',
    marginBottom: 12,
  },
  raceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  raceLocation: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  raceTiming: {
    fontSize: 14,
    color: '#00FF88',
    fontWeight: '600',
  },
  winnerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00FF88',
    marginBottom: 4,
  },
  teamText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  cardLinkHint: {
    fontSize: 12,
    color: '#E10600',
    marginTop: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  // Championship standings styles
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  standingPosition: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E10600',
    width: 30,
  },
  standingDriver: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 12,
  },
  standingPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FF88',
  },
  driverTeamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamColor: {
    fontSize: 18,
  },
  teamLogoContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamLogo: {
    width: 24,
    height: 24,
  },
  // Skeleton and empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
  skeletonLine: {
    backgroundColor: '#2A2A36',
    borderRadius: 4,
  },
}); 