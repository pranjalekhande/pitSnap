import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { HelmetOverlay } from './HelmetConstants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface DetectedFace {
  faceID?: number;
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  rollAngle?: number;
  yawAngle?: number;
}

interface FaceDetectionOverlayProps {
  faces: DetectedFace[];
  selectedHelmet: HelmetOverlay;
  cameraViewDimensions: { width: number; height: number };
}

export const FaceDetectionOverlay: React.FC<FaceDetectionOverlayProps> = ({
  faces,
  selectedHelmet,
  cameraViewDimensions,
}) => {
  // Don't render anything if no helmet selected
  if (selectedHelmet.id === 'none') {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Single prominent helmet in center-top area */}
      <View 
        style={[
          styles.mainHelmetContainer,
          {
            left: (screenWidth - 180) / 2, // Center horizontally
            top: screenHeight * 0.2, // 20% from top
          }
        ]}
      >
        {/* Helmet Background Circle */}
        <View
          style={[
            styles.helmetBackground,
            {
              backgroundColor: `${selectedHelmet.teamColor}15`, // Subtle background
              borderColor: selectedHelmet.teamColor,
            }
          ]}
        />
        
        {/* Large Helmet Emoji */}
        <Text style={styles.helmetEmoji}>
          {selectedHelmet.emoji}
        </Text>
        
        {/* Team name label */}
        <View style={[styles.teamLabel, { backgroundColor: selectedHelmet.teamColor }]}>
          <Text style={styles.teamLabelText}>{selectedHelmet.name}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5, // Above filter overlay, below UI controls
  },
  mainHelmetContainer: {
    position: 'absolute',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helmetBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
    borderWidth: 3,
  },
  helmetEmoji: {
    fontSize: 80,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    zIndex: 1,
  },
  teamLabel: {
    position: 'absolute',
    bottom: -20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  teamLabelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 