import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import AppNavigation from './AppNavigation';

export default function AuthNavigator() {
  const { user, loading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Show loading screen while checking auth status
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🏎️ PitSnap</Text>
        <Text style={styles.loadingSubtext}>Loading...</Text>
      </View>
    );
  }

  // If user is logged in, show main app
  if (user) {
    return <AppNavigation />;
  }

  // If not logged in, show auth screens
  return (
    <>
      {isLoginMode ? (
        <LoginScreen
          onLoginSuccess={() => {
            // Navigation will automatically update via useAuth
          }}
          onSignupPress={() => setIsLoginMode(false)}
        />
      ) : (
        <SignupScreen
          onSignupSuccess={() => setIsLoginMode(true)}
          onLoginPress={() => setIsLoginMode(true)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#15151E', // Racing Black
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#E10600', // F1 Red
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}); 