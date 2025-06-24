import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { 
  searchUsers, 
  sendFriendRequest, 
  getFriendshipStatus,
  type User 
} from '../../services/friendsService';

interface UserSearchResult extends User {
  friendshipStatus?: 'none' | 'pending' | 'accepted' | 'blocked';
}

interface AddFriendsScreenProps {
  onBack: () => void;
}

export default function AddFriendsScreen({ onBack }: AddFriendsScreenProps) {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const users = await searchUsers(searchQuery);
      
      // Filter out current user and get friendship status for each
      const filteredUsers = users.filter(user => user.id !== currentUser?.id);
      
      const usersWithStatus = await Promise.all(
        filteredUsers.map(async (user) => {
          const status = await getFriendshipStatus(user.id);
          return { ...user, friendshipStatus: status };
        })
      );

      setSearchResults(usersWithStatus);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      const success = await sendFriendRequest(friendId);
      if (success) {
        Alert.alert('Success!', 'Friend request sent');
        // Update the status in search results
        setSearchResults(prev => 
          prev.map(user => 
            user.id === friendId 
              ? { ...user, friendshipStatus: 'pending' }
              : user
          )
        );
      } else {
        Alert.alert('Error', 'Could not send friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const getStatusButton = (user: UserSearchResult) => {
    switch (user.friendshipStatus) {
      case 'accepted':
        return (
          <View style={[styles.statusButton, styles.friendsButton]}>
            <Text style={styles.friendsButtonText}>✓ Friends</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusButton, styles.pendingButton]}>
            <Text style={styles.pendingButtonText}>Pending</Text>
          </View>
        );
      default:
        return (
          <TouchableOpacity
            style={[styles.statusButton, styles.addButton]}
            onPress={() => handleSendRequest(user.id)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        );
    }
  };

  const renderUser = ({ item }: { item: UserSearchResult }) => (
    <View style={styles.userItem}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {item.display_name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.display_name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>

      {getStatusButton(item)}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Add Friends</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.textInput}
            placeholder="Search by username or name"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {searchQuery.length >= 2 ? (
          <>
            <Text style={styles.resultsHeader}>
              {loading ? 'Searching...' : `${searchResults.length} results`}
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderUser}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No users found</Text>
                    <Text style={styles.emptySubtext}>
                      Try searching for a different username
                    </Text>
                  </View>
                ) : null
              }
            />
          </>
        ) : (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>🔍 Find Friends</Text>
            <Text style={styles.instructionsText}>
              Search for friends by their username or display name.{'\n'}
              Start typing to see results!
            </Text>
          </View>
        )}
      </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    marginBottom: 8,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#E10600',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#666',
  },
  pendingButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  friendsButton: {
    backgroundColor: 'rgba(0, 200, 81, 0.2)',
    borderWidth: 1,
    borderColor: '#00C851',
  },
  friendsButtonText: {
    color: '#00C851',
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
}); 