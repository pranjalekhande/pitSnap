import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>F1 Chats</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>💬 Race Community</Text>
          <Text style={styles.subtitle}>
            Connect with F1 fans worldwide{'\n'}
            Coming in Phase 7
          </Text>
        </View>

        {/* Placeholder Chat Items */}
        <View style={styles.chatList}>
          <Text style={styles.sectionTitle}>Upcoming Features:</Text>
          
          <TouchableOpacity style={styles.chatItem}>
            <View style={styles.chatAvatar}>
              <Text style={styles.avatarText}>🏎️</Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>Team Red Bull Fans</Text>
              <Text style={styles.chatPreview}>Phase 7: Group chats</Text>
            </View>
            <Text style={styles.chatTime}>Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chatItem}>
            <View style={styles.chatAvatar}>
              <Text style={styles.avatarText}>🏁</Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>Race Weekend Updates</Text>
              <Text style={styles.chatPreview}>Phase 7: Direct messaging</Text>
            </View>
            <Text style={styles.chatTime}>Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chatItem}>
            <View style={styles.chatAvatar}>
              <Text style={styles.avatarText}>⚡</Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>Live Race Commentary</Text>
              <Text style={styles.chatPreview}>Phase 7: Ephemeral messages</Text>
            </View>
            <Text style={styles.chatTime}>Soon</Text>
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
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
  },
  chatList: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E10600',
    marginBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E10600',
  },
  chatAvatar: {
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
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  chatTime: {
    fontSize: 12,
    color: '#E10600',
    fontWeight: '500',
  },
}); 