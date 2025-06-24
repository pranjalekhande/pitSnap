import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SnapchatFilter, FaceElement } from './SnapchatFilters';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SnapchatFilterOverlayProps {
  filter: SnapchatFilter;
  faceDetected: boolean;
  style?: any;
}

export const SnapchatFilterOverlay: React.FC<SnapchatFilterOverlayProps> = ({ 
  filter, 
  faceDetected, 
  style 
}) => {
  // Don't render anything for the 'none' filter
  if (filter.id === 'none') {
    return null;
  }

  // Calculate face center position (you can adjust this based on actual face detection)
  const faceCenterX = screenWidth * 0.5;
  const faceCenterY = screenHeight * 0.4; // Slightly above center for natural face position
  const faceWidth = screenWidth * 0.6; // Approximate face width
  const faceHeight = screenHeight * 0.4; // Approximate face height

  const getFaceElementPosition = (element: FaceElement) => {
    let baseX = faceCenterX;
    let baseY = faceCenterY;

    // Calculate base position based on face region
    switch (element.position) {
      case 'forehead':
        baseY = faceCenterY - faceHeight * 0.3;
        break;
      case 'eyes':
        baseY = faceCenterY - faceHeight * 0.1;
        break;
      case 'nose':
        // baseY stays at face center
        break;
      case 'mouth':
        baseY = faceCenterY + faceHeight * 0.15;
        break;
      case 'chin':
        baseY = faceCenterY + faceHeight * 0.35;
        break;
      case 'ears':
        baseX = faceCenterX; // Will be offset by element.offset
        break;
      case 'full_face':
        // Use face center
        break;
    }

    // Apply element-specific offset
    if (element.offset) {
      baseX += element.offset.x;
      baseY += element.offset.y;
    }

    return { x: baseX, y: baseY };
  };

  const renderFaceElement = (element: FaceElement, index: number) => {
    const position = getFaceElementPosition(element);
    
    return (
      <View
        key={index}
        style={[
          styles.faceElement,
          {
            left: position.x - element.size / 2,
            top: position.y - element.size / 2,
            width: element.size,
            height: element.size,
            opacity: element.opacity || 1,
            transform: element.rotation ? [{ rotate: `${element.rotation}deg` }] : undefined,
          }
        ]}
      >
        {element.type === 'emoji' && (
          <Text style={[styles.emoji, { fontSize: element.size * 0.8 }]}>
            {element.content}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.overlay, filter.overlayStyle, style]} pointerEvents="none">
      {/* Background overlay effect (for beauty filters, etc.) */}
      {filter.overlayStyle && Object.keys(filter.overlayStyle).length > 0 && (
        <View style={[styles.backgroundOverlay, filter.overlayStyle]} />
      )}
      
      {/* Face Elements */}
      {faceDetected && filter.faceElements.map((element, index) => 
        renderFaceElement(element, index)
      )}
      
      {/* Filter name indicator (optional, can be removed) */}
      {faceDetected && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterName}>{filter.name}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3, // Above filter overlay, below UI controls
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  faceElement: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  emoji: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  filterIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  filterName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
}); 