export interface SnapchatFilter {
  id: string;
  name: string;
  emoji: string;
  overlayStyle: any;
  faceElements: FaceElement[];
  category: 'fun' | 'beauty' | 'animals' | 'accessories' | 'f1_teams';
}

export interface FaceElement {
  type: 'emoji' | 'shape' | 'effect';
  content: string;
  position: 'forehead' | 'eyes' | 'nose' | 'mouth' | 'chin' | 'ears' | 'full_face';
  size: number;
  offset?: { x: number; y: number };
  rotation?: number;
  opacity?: number;
}

export const SNAPCHAT_FILTERS: SnapchatFilter[] = [
  {
    id: 'none',
    name: 'No Filter',
    emoji: '',
    overlayStyle: {},
    faceElements: [],
    category: 'fun'
  },
  
  // Fun Filters
  {
    id: 'sunglasses_cool',
    name: 'Cool Shades',
    emoji: '😎',
    overlayStyle: {},
    faceElements: [
      {
        type: 'emoji',
        content: '🕶️',
        position: 'eyes',
        size: 120,
        offset: { x: 0, y: -10 }
      }
    ],
    category: 'accessories'
  },
  {
    id: 'dog_filter',
    name: 'Puppy Dog',
    emoji: '🐶',
    overlayStyle: {},
    faceElements: [
      {
        type: 'emoji',
        content: '🐶',
        position: 'nose',
        size: 80,
        offset: { x: 0, y: 0 }
      },
      {
        type: 'emoji',
        content: '👂',
        position: 'ears',
        size: 60,
        offset: { x: -100, y: -120 }
      },
      {
        type: 'emoji',
        content: '👂',
        position: 'ears',
        size: 60,
        offset: { x: 100, y: -120 }
      }
    ],
    category: 'animals'
  },
  {
    id: 'cat_filter',
    name: 'Cute Cat',
    emoji: '🐱',
    overlayStyle: {},
    faceElements: [
      {
        type: 'emoji',
        content: '🐱',
        position: 'nose',
        size: 70,
        offset: { x: 0, y: 5 }
      },
      {
        type: 'emoji',
        content: '👂',
        position: 'ears',
        size: 50,
        offset: { x: -80, y: -100 }
      },
      {
        type: 'emoji',
        content: '👂',
        position: 'ears',
        size: 50,
        offset: { x: 80, y: -100 }
      }
    ],
    category: 'animals'
  },
  {
    id: 'heart_eyes',
    name: 'Heart Eyes',
    emoji: '😍',
    overlayStyle: {},
    faceElements: [
      {
        type: 'emoji',
        content: '❤️',
        position: 'eyes',
        size: 40,
        offset: { x: -30, y: 0 }
      },
      {
        type: 'emoji',
        content: '❤️',
        position: 'eyes',
        size: 40,
        offset: { x: 30, y: 0 }
      }
    ],
    category: 'fun'
  },
  {
    id: 'flower_crown',
    name: 'Flower Crown',
    emoji: '🌸',
    overlayStyle: {},
    faceElements: [
      {
        type: 'emoji',
        content: '🌸',
        position: 'forehead',
        size: 50,
        offset: { x: -60, y: -80 }
      },
      {
        type: 'emoji',
        content: '🌺',
        position: 'forehead',
        size: 55,
        offset: { x: 0, y: -90 }
      },
      {
        type: 'emoji',
        content: '🌸',
        position: 'forehead',
        size: 50,
        offset: { x: 60, y: -80 }
      }
    ],
    category: 'beauty'
  },
  
  // Beauty Filters
  {
    id: 'vintage_sepia',
    name: 'Vintage',
    emoji: '📸',
    overlayStyle: {
      backgroundColor: 'rgba(255, 220, 150, 0.25)',
      opacity: 0.85,
    },
    faceElements: [
      {
        type: 'emoji',
        content: '🎞️',
        position: 'forehead',
        size: 25,
        offset: { x: -60, y: -80 }
      },
      {
        type: 'emoji',
        content: '📸',
        position: 'forehead',
        size: 20,
        offset: { x: 60, y: -70 }
      }
    ],
    category: 'beauty'
  },
  {
    id: 'night_mode',
    name: 'Night Race',
    emoji: '🌙',
    overlayStyle: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      opacity: 0.9,
    },
    faceElements: [
      {
        type: 'emoji',
        content: '🌙',
        position: 'chin',
        size: 30,
        offset: { x: 50, y: 40 }
      },
      {
        type: 'emoji',
        content: '⭐',
        position: 'forehead',
        size: 15,
        offset: { x: -50, y: -80 }
      },
      {
        type: 'emoji',
        content: '⭐',
        position: 'forehead',
        size: 12,
        offset: { x: 40, y: -70 }
      }
    ],
    category: 'beauty'
  },
  {
    id: 'championship_gold',
    name: 'Gold',
    emoji: '🏆',
    overlayStyle: {
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      opacity: 0.7,
    },
    faceElements: [
      {
        type: 'emoji',
        content: '🏆',
        position: 'forehead',
        size: 40,
        offset: { x: 0, y: -80 }
      },
      {
        type: 'emoji',
        content: '✨',
        position: 'chin',
        size: 20,
        offset: { x: -40, y: 50 }
      },
      {
        type: 'emoji',
        content: '✨',
        position: 'chin',
        size: 20,
        offset: { x: 40, y: 50 }
      }
    ],
    category: 'beauty'
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    emoji: '✨',
    overlayStyle: {
      backgroundColor: 'rgba(255, 182, 193, 0.1)', // Light pink glow
    },
    faceElements: [
      {
        type: 'emoji',
        content: '✨',
        position: 'forehead',
        size: 30,
        offset: { x: -40, y: -60 }
      },
      {
        type: 'emoji',
        content: '✨',
        position: 'forehead',
        size: 25,
        offset: { x: 50, y: -70 }
      },
      {
        type: 'emoji',
        content: '✨',
        position: 'chin',
        size: 20,
        offset: { x: -30, y: 40 }
      }
    ],
    category: 'beauty'
  },
  {
    id: 'rainbow_filter',
    name: 'Rainbow',
    emoji: '🌈',
    overlayStyle: {
      background: 'linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,165,0,0.1), rgba(255,255,0,0.1), rgba(0,128,0,0.1), rgba(0,0,255,0.1), rgba(75,0,130,0.1), rgba(238,130,238,0.1))',
    },
    faceElements: [
      {
        type: 'emoji',
        content: '🌈',
        position: 'forehead',
        size: 100,
        offset: { x: 0, y: -70 }
      }
    ],
    category: 'fun'
  },
  
  // Racing Theme Filters
  {
    id: 'ferrari_helmet',
    name: 'Ferrari',
    emoji: '🔴',
    overlayStyle: {
      backgroundColor: 'rgba(225, 6, 0, 0.1)', // Ferrari red tint
    },
    faceElements: [
      {
        type: 'emoji',
        content: '🔴',
        position: 'forehead',
        size: 120,
        offset: { x: 0, y: -40 }
      },
      {
        type: 'emoji',
        content: '🏎️',
        position: 'chin',
        size: 30,
        offset: { x: 0, y: 60 }
      }
    ],
    category: 'f1_teams'
  },
  {
    id: 'mercedes_helmet',
    name: 'Mercedes',
    emoji: '⚫',
    overlayStyle: {
      backgroundColor: 'rgba(0, 210, 190, 0.1)', // Mercedes teal tint
    },
    faceElements: [
      {
        type: 'emoji',
        content: '⚫',
        position: 'forehead',
        size: 120,
        offset: { x: 0, y: -40 }
      },
      {
        type: 'emoji',
        content: '🏆',
        position: 'chin',
        size: 25,
        offset: { x: 0, y: 60 }
      }
    ],
    category: 'f1_teams'
  },
  {
    id: 'redbull_helmet',
    name: 'Red Bull',
    emoji: '🔵',
    overlayStyle: {
      backgroundColor: 'rgba(30, 65, 147, 0.1)', // Red Bull blue tint
    },
    faceElements: [
      {
        type: 'emoji',
        content: '🔵',
        position: 'forehead',
        size: 120,
        offset: { x: 0, y: -40 }
      },
      {
        type: 'emoji',
        content: '⚡',
        position: 'chin',
        size: 30,
        offset: { x: 0, y: 60 }
      }
    ],
    category: 'f1_teams'
  },
  {
    id: 'mclaren_helmet',
    name: 'McLaren',
    emoji: '🟠',
    overlayStyle: {
      backgroundColor: 'rgba(255, 135, 0, 0.1)', // McLaren orange tint
    },
    faceElements: [
      {
        type: 'emoji',
        content: '🟠',
        position: 'forehead',
        size: 120,
        offset: { x: 0, y: -40 }
      },
      {
        type: 'emoji',
        content: '🧡',
        position: 'chin',
        size: 25,
        offset: { x: 0, y: 60 }
      }
    ],
    category: 'f1_teams'
  },
  {
    id: 'champion_helmet',
    name: 'Champion',
    emoji: '👑',
    overlayStyle: {
      backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold tint
    },
    faceElements: [
      {
        type: 'emoji',
        content: '👑',
        position: 'forehead',
        size: 100,
        offset: { x: 0, y: -50 }
      },
      {
        type: 'emoji',
        content: '🏆',
        position: 'chin',
        size: 35,
        offset: { x: 0, y: 50 }
      }
    ],
    category: 'f1_teams'
  },
  {
    id: 'racing_helmet',
    name: 'Racing Helmet',
    emoji: '🏎️',
    overlayStyle: {},
    faceElements: [
      {
        type: 'emoji',
        content: '🪖',
        position: 'forehead',
        size: 120,
        offset: { x: 0, y: -40 }
      },
      {
        type: 'emoji',
        content: '🏎️',
        position: 'chin',
        size: 40,
        offset: { x: 0, y: 60 }
      }
    ],
    category: 'accessories'
  },
  {
    id: 'winner_crown',
    name: 'Winner',
    emoji: '👑',
    overlayStyle: {},
    faceElements: [
      {
        type: 'emoji',
        content: '👑',
        position: 'forehead',
        size: 80,
        offset: { x: 0, y: -70 }
      },
      {
        type: 'emoji',
        content: '🏆',
        position: 'chin',
        size: 35,
        offset: { x: -50, y: 50 }
      },
      {
        type: 'emoji',
        content: '🏆',
        position: 'chin',
        size: 35,
        offset: { x: 50, y: 50 }
      }
    ],
    category: 'fun'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    emoji: '⚡',
    overlayStyle: {},
    faceElements: [
      {
        type: 'emoji',
        content: '⚡',
        position: 'forehead',
        size: 60,
        offset: { x: -40, y: -50 }
      },
      {
        type: 'emoji',
        content: '⚡',
        position: 'forehead',
        size: 60,
        offset: { x: 40, y: -50 }
      },
      {
        type: 'emoji',
        content: '🔥',
        position: 'eyes',
        size: 50,
        offset: { x: 0, y: 0 }
      }
    ],
    category: 'fun'
  }
];

export const FILTER_CATEGORIES = {
  fun: '🎉 Fun',
  beauty: '💄 Beauty', 
  animals: '🐾 Animals',
  accessories: '👓 Accessories',
  f1_teams: '🏎️ F1 Teams'
} as const; 