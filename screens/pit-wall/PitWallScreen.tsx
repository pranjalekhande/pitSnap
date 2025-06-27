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
import PitWallTabs from '../../components/pit-wall/PitWallTabs';
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

// Note: PitWallItem type moved to individual tab components

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
  // Note: pitWallItems state removed - handled by individual tabs
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

  // Log championship standings data for debugging
  useEffect(() => {
    if (!storiesLoading && !f1DataLoading && pitWallData) {
      if (pitWallData.championship_standings) {
        console.log('🏆 Championship Standings loaded:', pitWallData.championship_standings.drivers.length, 'drivers');
      } else {
        console.log('⚠️ No championship standings data available');
      }
    }
  }, [storiesLoading, f1DataLoading, pitWallData]);

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

    // Note: Render functions moved to individual tab components

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏁 Pit Wall</Text>
        <TouchableOpacity onPress={handleAddStory} style={styles.addButton}>
          <Ionicons name="camera" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <PitWallTabs
        friendsWithStories={friendsWithStories}
        myStories={myStories}
        pitWallData={pitWallData}
        storiesLoading={storiesLoading}
        f1DataLoading={f1DataLoading}
        navigation={navigation}
        user={user}
        onRefresh={onRefresh}
        refreshing={refreshing}
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