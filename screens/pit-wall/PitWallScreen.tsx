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
import f1DataService, { type F1NextRace, type F1LatestResults } from '../../services/f1DataService';

const { width: screenWidth } = Dimensions.get('window');

// Types for different card content
interface PitWallItem {
  id: string;
  type: 'story_carousel' | 'next_race' | 'latest_results' | 'ai_insight';
  data: any;
}

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
  const [nextRace, setNextRace] = useState<F1NextRace | null>(null);
  const [latestResults, setLatestResults] = useState<F1LatestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load stories and pit wall data
  const loadPitWallData = useCallback(async () => {
    try {
      const [friendsData, myStoriesData, nextRaceData, latestResultsData] = await Promise.all([
        getFriendsStories(),
        getMyStories(),
        f1DataService.getNextRace(),
        f1DataService.getLatestResults(),
      ]);

      setFriendsWithStories(friendsData);
      setMyStories(myStoriesData);
      setNextRace(nextRaceData);
      setLatestResults(latestResultsData);

      // Build pit wall items array
      const items: PitWallItem[] = [
        // Story carousel always first
        {
          id: 'story_carousel',
          type: 'story_carousel',
          data: { friendsWithStories: friendsData, myStories: myStoriesData }
        },
        // Next race information
        {
          id: 'next_race',
          type: 'next_race',
          data: nextRaceData
        },
        // Latest race results
        {
          id: 'latest_results',
          type: 'latest_results',
          data: latestResultsData
        },
        // AI insight placeholder
        {
          id: 'ai_insight_1',
          type: 'ai_insight',
          data: { title: 'Race Analysis', content: 'Strategic insights powered by AI coming soon...' }
        }
      ];

      setPitWallItems(items);
    } catch (error) {
      console.error('Error loading pit wall data:', error);
      Alert.alert('Error', 'Failed to load pit wall. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPitWallData();
    }, [loadPitWallData])
  );

  // Set up real-time subscription for stories
  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;
    
    const setupSubscription = async () => {
      try {
        subscription = subscribeToStories((newStory) => {
          if (isMounted) {
            loadPitWallData();
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
  }, []);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPitWallData();
  }, [loadPitWallData]);

  // Navigate to camera to add story
  const handleAddStory = () => {
    (navigation as any).navigate('Camera');
  };

  // Render different types of pit wall items  
  const renderPitWallItem = ({ item }: { item: PitWallItem }) => {
    const currentYear = new Date().getFullYear(); // Get current year for F1 website links
    
    switch (item.type) {
      case 'story_carousel':
        return (
          <StoryCarousel
            friendsWithStories={item.data.friendsWithStories}
            myStories={item.data.myStories}
            navigation={navigation}
            user={user}
          />
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
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading pit wall...</Text>
        </View>
      )}
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
  loadingState: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.7,
  },
}); 