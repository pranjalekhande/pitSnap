import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  type FriendWithStories,
  type Story 
} from '../../services/storiesService';

interface StoryCarouselProps {
  friendsWithStories: FriendWithStories[];
  myStories: Story[];
  navigation: any;
  user: any;
}

export default function StoryCarousel({ 
  friendsWithStories, 
  myStories, 
  navigation, 
  user 
}: StoryCarouselProps) {
  
  // Navigate to story viewer
  const handleViewStories = (friend: FriendWithStories, initialIndex: number = 0) => {
    navigation.navigate('StoryViewer', {
      stories: friend.stories,
      friendName: friend.display_name,
      initialIndex,
    });
  };

  // Navigate to my stories management
  const handleViewMyStories = () => {
    if (myStories.length === 0) {
      // Navigate to camera to create first story
      navigation.navigate('Camera');
    } else {
      // Navigate to story viewer to preview own stories
      navigation.navigate('StoryViewer', {
        stories: myStories,
        friendName: 'Your Story',
        initialIndex: 0,
      });
    }
  };

  // Navigate to story management 
  const handleManageMyStories = () => {
    navigation.navigate('MyStories');
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
      <Text style={styles.sectionTitle}>Stories</Text>
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
        ListEmptyComponent={
          friendsWithStories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Add friends to see their stories here!
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#15151E',
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  storiesContainer: {
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
}); 