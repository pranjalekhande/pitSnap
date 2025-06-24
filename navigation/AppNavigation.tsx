import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import CameraScreen from '../screens/camera/CameraScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import StoriesScreen from '../screens/stories/StoriesScreen';
import StoryComposerScreen from '../screens/stories/StoryComposerScreen';
import StoryViewerScreen from '../screens/stories/StoryViewerScreen';
import MyStoriesScreen from '../screens/stories/MyStoriesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stories Stack Navigator
function StoriesStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#15151E' },
      }}
    >
      <Stack.Screen name="StoriesFeed" component={StoriesScreen} />
      <Stack.Screen name="StoryComposer" component={StoryComposerScreen} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
      <Stack.Screen name="MyStories" component={MyStoriesScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigation() {
  const [tabBarVisible, setTabBarVisible] = useState(true);

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Camera"
        screenOptions={{
          headerShown: false,
          tabBarStyle: tabBarVisible ? {
            backgroundColor: '#15151E', // Racing Black
            borderTopWidth: 1,
            borderTopColor: '#E10600', // F1 Red
            height: 90,
            paddingBottom: 30,
            paddingTop: 10,
          } : { display: 'none' },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarActiveTintColor: '#E10600', // F1 Red
          tabBarInactiveTintColor: '#FFFFFF',
        }}
      >
        <Tab.Screen
          name="Chats"
          component={ChatScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Stories"
          component={StoriesStackNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Camera"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="camera" size={size} color={color} />
            ),
          }}
        >
          {(props) => <CameraScreen {...props} setTabBarVisible={setTabBarVisible} />}
        </Tab.Screen>
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
} 