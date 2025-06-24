import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { CameraFilter } from './FilterConstants';

interface FilterOverlayProps {
  filter: CameraFilter;
  style?: ViewStyle;
}

export const FilterOverlay: React.FC<FilterOverlayProps> = ({ filter, style }) => {
  // Don't render anything for the 'none' filter
  if (filter.id === 'none') {
    return null;
  }

  return (
    <View 
      style={[
        styles.overlay,
        filter.overlayStyle,
        style
      ]}
      pointerEvents="none" // Allow touches to pass through to camera controls
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, // Ensure it's above the camera but below controls
  },
}); 