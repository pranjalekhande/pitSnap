import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  getFriendsStories, 
  getMyStories, 
  subscribeToStories,
  type FriendWithStories,
  type Story 
} from '../../services/storiesService';
import { useAuth } from '../../contexts/AuthContext';
import StoryCarousel from '../../components/pit-wall/StoryCarousel';
import f1DataService, { type PitWallData } from '../../services/f1DataService';

const { width: screenWidth } = Dimensions.get('window');

// Helper functions for driver/team display
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
    'Red Bull Racing': { source: require('../../assets/team-logos/red-bull.png'), fallbackEmoji: '🟦' },
    'McLaren': { source: require('../../assets/team-logos/mclaren.png'), fallbackEmoji: '🟠' },
    'Ferrari': { source: require('../../assets/team-logos/ferrari.png'), fallbackEmoji: '🔴' },
    'Mercedes': { source: require('../../assets/team-logos/mercedes.png'), fallbackEmoji: '⚪' },
    'Aston Martin': { source: require('../../assets/team-logos/aston-martin.png'), fallbackEmoji: '🟢' },
    'Williams': { source: require('../../assets/team-logos/williams.png'), fallbackEmoji: '🔵' },
    'Alpine': { source: require('../../assets/team-logos/alpine.png'), fallbackEmoji: '🩷' },
    'Haas F1 Team': { source: require('../../assets/team-logos/haas.png'), fallbackEmoji: '⚪' },
  };
  
  return teamLogos[teamName] || { source: null, fallbackEmoji: '⚫' };
};

// Types for different card content
interface PitWallItem {
  id: string;
  type: 'story_carousel' | 'next_race' | 'latest_results' | 'championship_standings' | 'ai_insight';
  data: any;
}

// Skeleton loading components
const SkeletonCard = ({ height = 120 }: { height?: number }) => (
  <View style={[styles.raceCard, { height, backgroundColor: '#1A1A24' }]}>
    <View style={[styles.skeletonLine, { width: '30%', height: 16, marginBottom: 12 }]} />
    <View style={[styles.skeletonLine, { width: '80%', height: 20, marginBottom: 6 }]} />
    <View style={[styles.skeletonLine, { width: '60%', height: 16, marginBottom: 4 }]} />
    <View style={[styles.skeletonLine, { width: '40%', height: 14 }]} />
  </View>
);

const SkeletonStoryCarousel = () => (
  <View style={styles.storyCarouselContainer}>
    <View style={styles.skeletonStoryCircle} />
    <View style={styles.skeletonStoryCircle} />
    <View style={styles.skeletonStoryCircle} />
    <View style={styles.skeletonStoryCircle} />
  </View>
);

export default function PitWallScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Handle navigation to external F1 website with permission
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
  
  const [friendsWithStories, setFriendsWithStories] = useState<FriendWithStories[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [pitWallItems, setPitWallItems] = useState<PitWallItem[]>([]);
  const [pitWallData, setPitWallData] = useState<PitWallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [f1DataLoading, setF1DataLoading] = useState(true);

  // OPTIMIZED: Load stories and F1 data separately for better UX
  const loadStoriesData = useCallback(async () => {
    try {
      setStoriesLoading(true);
      const [friendsData, myStoriesData] = await Promise.all([
        getFriendsStories(),
        getMyStories(),
      ]);

      setFriendsWithStories(friendsData);
      setMyStories(myStoriesData);
    } catch (error) {
      console.error('Error loading stories data:', error);
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  // OPTIMIZED: Single batch API call for all F1 data
  const loadF1Data = useCallback(async () => {
    try {
      setF1DataLoading(true);
      const data = await f1DataService.getPitWallData(); // Uses caching internally
      setPitWallData(data);
    } catch (error) {
      console.error('Error loading F1 data:', error);
      Alert.alert('Error', 'Failed to load F1 data. Please try again.');
    } finally {
      setF1DataLoading(false);
    }
  }, []);

  // Build pit wall items when data is available
  useEffect(() => {
    if (!storiesLoading && !f1DataLoading && pitWallData) {
      // Log championship standings data for debugging
      if (pitWallData.championship_standings) {
        console.log('🏆 Championship Standings loaded:', pitWallData.championship_standings.drivers.length, 'drivers');
      } else {
        console.log('⚠️ No championship standings data available');
      }
      
      const items: PitWallItem[] = [
        // Story carousel always first
        {
          id: 'story_carousel',
          type: 'story_carousel',
          data: { friendsWithStories, myStories }
        },
        // Next race information
        {
          id: 'next_race',
          type: 'next_race',
          data: pitWallData.next_race
        },
        // Latest race results
        {
          id: 'latest_results',
          type: 'latest_results',
          data: pitWallData.latest_results
        },
        // NEW: Championship standings (if available)
        ...(pitWallData.championship_standings ? [{
          id: 'championship_standings',
          type: 'championship_standings' as const,
          data: pitWallData.championship_standings
        }] : []),
        // AI insight placeholder
        {
          id: 'ai_insight_1',
          type: 'ai_insight',
          data: { title: 'Race Analysis', content: 'Strategic insights powered by AI coming soon...' }
        }
      ];

      setPitWallItems(items);
    }
  }, [storiesLoading, f1DataLoading, pitWallData, friendsWithStories, myStories]);

  // Update overall loading state
  useEffect(() => {
    setLoading(storiesLoading || f1DataLoading);
  }, [storiesLoading, f1DataLoading]);

  // OPTIMIZED: Load data when screen comes into focus (cached calls are fast)
  useFocusEffect(
    useCallback(() => {
      loadStoriesData();
      loadF1Data();
    }, [loadStoriesData, loadF1Data])
  );

  // Set up real-time subscription for stories
  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;
    
    const setupSubscription = async () => {
      try {
        subscription = subscribeToStories((newStory) => {
          if (isMounted) {
            loadStoriesData(); // Only reload stories, not F1 data
          }
        });
      } catch (error) {
        console.error('Failed to setup stories subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from stories:', error);
        }
      }
    };
  }, [loadStoriesData]);

  // OPTIMIZED: Handle refresh with force refresh for F1 data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Force refresh F1 data (bypasses cache)
      await f1DataService.forceRefresh();
      await Promise.all([
        loadStoriesData(),
        loadF1Data(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadStoriesData, loadF1Data]);

  // Navigate to camera to add story
  const handleAddStory = () => {
    (navigation as any).navigate('Camera');
  };

  // Render different types of pit wall items with skeleton states
  const renderPitWallItem = ({ item }: { item: PitWallItem }) => {
    const currentYear = new Date().getFullYear(); // Get current year for F1 website links
    
    switch (item.type) {
      case 'story_carousel':
        if (storiesLoading) {
          return <SkeletonStoryCarousel />;
        }
        return (
          <StoryCarousel
            friendsWithStories={item.data.friendsWithStories}
            myStories={item.data.myStories}
            navigation={navigation}
            user={user}
          />
        );
      
      case 'next_race':
        if (f1DataLoading) {
          return <SkeletonCard height={140} />;
        }
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
        if (f1DataLoading) {
          return <SkeletonCard height={140} />;
        }
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
      
      case 'championship_standings':
        // Check if we have meaningful points data
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

      case 'ai_insight':
        return (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>{item.data.title}</Text>
            <Text style={styles.placeholderContent}>{item.data.content}</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏁 Pit Wall</Text>
        <TouchableOpacity onPress={handleAddStory} style={styles.addButton}>
          <Ionicons name="camera" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pitWallItems}
        renderItem={renderPitWallItem}
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
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏎️</Text>
              <Text style={styles.emptyTitle}>Welcome to the Pit Wall</Text>
              <Text style={styles.emptyText}>
                Your strategic command center is loading...
              </Text>
            </View>
          ) : (
            // Loading skeleton
            <View>
              <SkeletonStoryCarousel />
              <SkeletonCard height={140} />
              <SkeletonCard height={140} />
              <View style={styles.placeholderCard}>
                <View style={[styles.skeletonLine, { width: '40%', height: 18, marginBottom: 8 }]} />
                <View style={[styles.skeletonLine, { width: '80%', height: 14 }]} />
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E10600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
  },
  placeholderCard: {
    backgroundColor: '#1E1E28',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  placeholderContent: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
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
  // Skeleton loading styles
  skeletonLine: {
    backgroundColor: '#2A2A36',
    borderRadius: 4,
  },
  storyCarouselContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E28',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
  },
  skeletonStoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A2A36',
    marginRight: 15,
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
}); 