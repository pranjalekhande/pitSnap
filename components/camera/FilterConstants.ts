import { ViewStyle } from 'react-native';

export interface CameraFilter {
  id: string;
  name: string;
  overlayStyle: ViewStyle;
  previewColor: string; // Color for the filter preview circle
  description?: string;
}

export const CAMERA_FILTERS: CameraFilter[] = [
  {
    id: 'none',
    name: 'Original',
    overlayStyle: {},
    previewColor: '#FFFFFF',
    description: 'No filter applied'
  },
  {
    id: 'racing_red',
    name: 'Racing Red',
    overlayStyle: {
      backgroundColor: 'rgba(225, 6, 0, 0.15)',
      opacity: 0.8,
    },
    previewColor: '#E10600',
    description: 'Ferrari-inspired red tint'
  },
  {
    id: 'mercedes_silver',
    name: 'Silver Arrow',
    overlayStyle: {
      backgroundColor: 'rgba(192, 192, 192, 0.2)',
      opacity: 0.7,
    },
    previewColor: '#C0C0C0',
    description: 'Mercedes silver tone'
  },
  {
    id: 'mclaren_orange',
    name: 'Papaya',
    overlayStyle: {
      backgroundColor: 'rgba(255, 135, 0, 0.18)',
      opacity: 0.75,
    },
    previewColor: '#FF8700',
    description: 'McLaren papaya orange'
  },
  {
    id: 'redbull_blue',
    name: 'Energy',
    overlayStyle: {
      backgroundColor: 'rgba(30, 65, 147, 0.2)',
      opacity: 0.8,
    },
    previewColor: '#1E4193',
    description: 'Red Bull racing blue'
  },
  {
    id: 'vintage_sepia',
    name: 'Vintage',
    overlayStyle: {
      backgroundColor: 'rgba(255, 220, 150, 0.25)',
      opacity: 0.85,
    },
    previewColor: '#DCBC96',
    description: 'Classic racing era look'
  },
  {
    id: 'night_mode',
    name: 'Night Race',
    overlayStyle: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      opacity: 0.9,
    },
    previewColor: '#2D2D2D',
    description: 'Singapore GP night effect'
  },
  {
    id: 'championship',
    name: 'Gold',
    overlayStyle: {
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      opacity: 0.7,
    },
    previewColor: '#FFD700',
    description: 'Championship gold'
  }
];

// F1 Team Colors for future use
export const F1_TEAM_COLORS = {
  FERRARI: '#E10600',
  MERCEDES: '#00D2BE',
  RED_BULL: '#1E4193',
  MCLAREN: '#FF8700',
  ALPINE: '#0090FF',
  ASTON_MARTIN: '#006F62',
  WILLIAMS: '#005AFF',
  ALPHA_TAURI: '#2B4562',
  ALFA_ROMEO: '#900000',
  HAAS: '#FFFFFF'
} as const; 