import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  getMyStories, 
  getStoryViewers, 
  deleteStory, 
  getTimeUntilExpiry,
  type Story,
  type StoryView 
} from '../../services/storiesService';

export default function MyStoriesScreen() {
  const navigation = useNavigation();
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load user's stories
  const loadMyStories = useCallback(async () => {
    try {
      const stories = await getMyStories();
      setMyStories(stories);
    } catch (error) {
      console.error('Error loading my stories:', error);
      Alert.alert('Error', 'Failed to load stories. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load stories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMyStories();
    }, [loadMyStories])
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMyStories();
  }, [loadMyStories]);

  // Delete story with confirmation
  const handleDeleteStory = (story: Story) => {
    Alert.alert(
      'Delete Story?',
      'This story will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteStory(story.id);
            if (success) {
              Alert.alert('Deleted', 'Story has been deleted successfully.');
              loadMyStories(); // Refresh the list
            } else {
              Alert.alert('Error', 'Failed to delete story. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Navigate to add new story
  const handleAddStory = () => {
    (navigation as any).navigate('Camera');
  };

  // Render individual story item
  const renderStoryItem = ({ item: story }: { item: Story }) => {
    return (
      <View style={styles.storyItem}>
        <Image
          source={{ uri: story.media_url }}
          style={styles.storyThumbnail}
        />
        
        <View style={styles.storyInfo}>
          <View style={styles.storyHeader}>
            <Ionicons 
              name={story.media_type === 'video' ? 'videocam' : 'camera'} 
              size={16} 
              color="#E10600" 
            />
            <Text style={styles.storyTime}>
              {getTimeUntilExpiry(story)}
            </Text>
          </View>

          {story.caption && (
            <Text style={styles.storyCaption} numberOfLines={2}>
              {story.caption}
            </Text>
          )}

          <Text style={styles.storyViews}>
            {story.view_count} {story.view_count === 1 ? 'view' : 'views'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteStory(story)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF4757" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Stories</Text>
        <TouchableOpacity onPress={handleAddStory} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={myStories}
        renderItem={renderStoryItem}
        keyExtractor={(story) => story.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
        contentContainerStyle={styles.storiesList}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyTitle}>No Active Stories</Text>
              <Text style={styles.emptyText}>
                Your stories will appear here and expire after 24 hours.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddStory}>
                <Text style={styles.emptyButtonText}>Create Your First Story</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading your stories...</Text>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 4,
  },
  storiesList: {
    padding: 20,
  },
  storyItem: {
    flexDirection: 'row',
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  storyThumbnail: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#333',
    marginRight: 16,
  },
  storyInfo: {
    flex: 1,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyTime: {
    color: '#E10600',
    fontSize: 12,
    fontWeight: '500',
  },
  storyCaption: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  storyViews: {
    color: '#666',
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#E10600',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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