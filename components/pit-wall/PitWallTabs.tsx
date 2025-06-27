import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedTab from './tabs/FeedTab';
import StandingsTab from './tabs/StandingsTab';
import CalendarTab from './tabs/CalendarTab';

const { width: screenWidth } = Dimensions.get('window');

interface PitWallTabsProps {
  friendsWithStories: any[];
  myStories: any[];
  pitWallData: any;
  storiesLoading: boolean;
  f1DataLoading: boolean;
  navigation: any;
  user: any;
  onRefresh: () => void;
  refreshing: boolean;
}

type TabType = 'feed' | 'standings' | 'calendar';

export default function PitWallTabs({
  friendsWithStories,
  myStories,
  pitWallData,
  storiesLoading,
  f1DataLoading,
  navigation,
  user,
  onRefresh,
  refreshing
}: PitWallTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  const tabs = [
    { id: 'feed', label: 'Feed', icon: 'play-circle' },
    { id: 'standings', label: 'Standings', icon: 'trophy' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <FeedTab
            friendsWithStories={friendsWithStories}
            myStories={myStories}
            pitWallData={pitWallData}
            storiesLoading={storiesLoading}
            navigation={navigation}
            user={user}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        );
      case 'standings':
        return (
          <StandingsTab
            pitWallData={pitWallData}
            f1DataLoading={f1DataLoading}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        );
      case 'calendar':
        return (
          <CalendarTab
            pitWallData={pitWallData}
            f1DataLoading={f1DataLoading}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab(tab.id as TabType)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#E10600' : '#FFFFFF'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1E1E28',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(225, 6, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#E10600',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
    opacity: 0.7,
  },
  tabLabelActive: {
    color: '#E10600',
    opacity: 1,
  },
  tabContent: {
    flex: 1,
  },
}); 