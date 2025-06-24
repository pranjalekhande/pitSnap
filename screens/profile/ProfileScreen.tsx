import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getFriends, getPendingRequests, acceptFriendRequest, declineFriendRequest, type User, type FriendRequest } from '../../services/friendsService';
import AddFriendsScreen from '../friends/AddFriendsScreen';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    setLoading(true);
    try {
      const [friendsData, pendingData] = await Promise.all([
        getFriends(),
        getPendingRequests()
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const success = await acceptFriendRequest(requestId);
    if (success) {
      Alert.alert('Success!', 'Friend request accepted');
      loadFriendsData(); // Refresh data
    } else {
      Alert.alert('Error', 'Could not accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const success = await declineFriendRequest(requestId);
    if (success) {
      loadFriendsData(); // Refresh data
    } else {
      Alert.alert('Error', 'Could not decline friend request');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: signOut 
        }
      ]
    );
  };

  const renderFriend = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>
          {item.display_name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.display_name}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
    </View>
  );

  const renderPendingRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>
          {item.user?.display_name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.user?.display_name}</Text>
        <Text style={styles.friendUsername}>@{item.user?.username}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showAddFriends) {
    return (
      <AddFriendsScreen onBack={() => {
        setShowAddFriends(false);
        loadFriendsData(); // Refresh when coming back
      }} />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🏎️</Text>
          </View>
          <Text style={styles.username}>
            {user?.user_metadata?.display_name || 'F1 Fan'}
          </Text>
          <Text style={styles.userSubtitle}>
            @{user?.user_metadata?.username || user?.user_metadata?.display_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'racer'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Friends Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Friends ({friends.length})</Text>
            <TouchableOpacity
              style={styles.addFriendsButton}
              onPress={() => setShowAddFriends(true)}
            >
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.addFriendsText}>Add</Text>
            </TouchableOpacity>
          </View>

          {friends.length > 0 ? (
            <FlatList
              data={friends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Add friends to start sharing moments!</Text>
            </View>
          )}
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📩 Friend Requests ({pendingRequests.length})</Text>
            <FlatList
              data={pendingRequests}
              renderItem={renderPendingRequest}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏁 Account</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>@{user?.user_metadata?.username || user?.user_metadata?.display_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'racer'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Display Name</Text>
            <Text style={styles.infoValue}>{user?.user_metadata?.display_name}</Text>
          </View>
        </View>

        {/* Coming Soon Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Coming Soon</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>Phase 6: Direct Messaging</Text>
            <Text style={styles.featureDescription}>Send photos/videos to friends</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>Phase 7: Stories</Text>
            <Text style={styles.featureDescription}>24-hour disappearing stories</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>Phase 10+: F1 Features</Text>
            <Text style={styles.featureDescription}>Team themes, F1 AR filters, race data</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151E', // Racing Black
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E10600',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E10600', // F1 Red
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E28',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#E10600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 16,
    color: '#E10600',
    fontWeight: '500',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E28',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E10600',
  },
  addFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E10600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addFriendsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    marginBottom: 8,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E10600',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E10600',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  requestActions: {
    flexDirection: 'row',
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00C851',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E28',
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#E10600',
    fontWeight: '500',
  },
  featureItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E28',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E10600',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  logoutButton: {
    backgroundColor: '#1E1E28',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
  },
}); 