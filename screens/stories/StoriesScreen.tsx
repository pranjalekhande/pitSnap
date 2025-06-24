import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Alert,
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

const { width: screenWidth } = Dimensions.get('window');

export default function StoriesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [friendsWithStories, setFriendsWithStories] = useState<FriendWithStories[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load all stories data
  const loadStories = useCallback(async () => {
    try {
      const [friendsData, myStoriesData] = await Promise.all([
        getFriendsStories(),
        getMyStories(),
      ]);

      setFriendsWithStories(friendsData);
      setMyStories(myStoriesData);
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('Error', 'Failed to load stories. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load stories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStories();
    }, [loadStories])
  );

  // Set up real-time subscription
  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;
    
    const setupSubscription = async () => {
      try {
        subscription = subscribeToStories((newStory) => {
          // Only update if component is still mounted
          if (isMounted) {
            loadStories();
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
  }, []); // Empty dependency array to prevent re-subscription

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStories();
  }, [loadStories]);

  // Navigate to story viewer
  const handleViewStories = (friend: FriendWithStories, initialIndex: number = 0) => {
    (navigation as any).navigate('StoryViewer', {
      stories: friend.stories,
      friendName: friend.display_name,
      initialIndex,
    });
  };

  // Navigate to my stories management
  const handleViewMyStories = () => {
    if (myStories.length === 0) {
      // Navigate to camera to create first story
      (navigation as any).navigate('Camera');
    } else {
      // Navigate to story viewer to preview own stories
      (navigation as any).navigate('StoryViewer', {
        stories: myStories,
        friendName: 'Your Story',
        initialIndex: 0,
      });
    }
  };

  // Navigate to camera to add story
  const handleAddStory = () => {
    (navigation as any).navigate('Camera');
  };

  // Render story ring component
  const renderStoryRing = ({ item }: { item: FriendWithStories }) => {
    return (
      <TouchableOpacity
        style={styles.storyRing}
        onPress={() => handleViewStories(item)}
      >
        <View style={[
          styles.storyRingContainer,
          item.has_new_stories ? styles.newStoryRing : styles.viewedStoryRing
        ]}>
          <Image
            source={{ 
              uri: item.avatar_url || 'https://via.placeholder.com/60x60?text=👤' 
            }}
            style={styles.storyRingImage}
          />
          {item.has_new_stories && (
            <View style={styles.newStoryIndicator} />
          )}
        </View>
        <Text style={styles.storyRingName} numberOfLines={1}>
          {item.display_name}
        </Text>
        <Text style={styles.storyCount}>
          {item.total_stories} {item.total_stories === 1 ? 'story' : 'stories'}
        </Text>
      </TouchableOpacity>
    );
  };

  // Navigate to story management 
  const handleManageMyStories = () => {
    (navigation as any).navigate('MyStories');
  };

  // Render my story ring (special case)
  const renderMyStoryRing = () => {
    return (
      <TouchableOpacity
        style={styles.storyRing}
        onPress={handleViewMyStories}
        onLongPress={myStories.length > 0 ? handleManageMyStories : undefined}
      >
        <View style={[
          styles.storyRingContainer,
          styles.myStoryRing
        ]}>
          <Image
            source={{ 
              uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/60x60?text=👤' 
            }}
            style={styles.storyRingImage}
          />
          {myStories.length === 0 ? (
            <View style={styles.addStoryButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.myStoryIndicator}>
              <Text style={styles.myStoryCount}>{myStories.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.storyRingName} numberOfLines={1}>
          {myStories.length === 0 ? 'Add Story' : 'My Story'}
        </Text>
        <Text style={styles.storyCount}>
          {myStories.length === 0 
            ? 'Tap to add' 
            : `${myStories.length} active • Long press to manage`
          }
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
        <TouchableOpacity onPress={handleAddStory} style={styles.addButton}>
          <Ionicons name="camera" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[null, ...friendsWithStories]} // null represents "My Story" slot
        renderItem={({ item, index }) => {
          if (index === 0) {
            return renderMyStoryRing();
          }
          return renderStoryRing({ item: item as FriendWithStories });
        }}
        keyExtractor={(item, index) => 
          index === 0 ? 'my-story' : (item as FriendWithStories).id
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
        ListEmptyComponent={
          !loading && friendsWithStories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyTitle}>No Stories Yet</Text>
              <Text style={styles.emptyText}>
                Add friends to see their stories here!
              </Text>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading stories...</Text>
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
    borderBottomWidth: 1,
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
  storiesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  storyRing: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  storyRingContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    marginBottom: 8,
  },
  newStoryRing: {
    backgroundColor: '#E10600',
  },
  viewedStoryRing: {
    backgroundColor: '#666',
  },
  myStoryRing: {
    backgroundColor: '#1E1E28',
    borderWidth: 2,
    borderColor: '#E10600',
  },
  storyRingImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E1E28',
  },
  newStoryIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00FF88',
    borderWidth: 2,
    borderColor: '#15151E',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#15151E',
  },
  myStoryIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#15151E',
  },
  myStoryCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  storyRingName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  storyCount: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    width: screenWidth - 40,
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