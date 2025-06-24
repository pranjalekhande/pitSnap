export interface HelmetOverlay {
  id: string;
  name: string;
  emoji: string;
  teamColor: string;
  description: string;
  scale: number; // How much to scale the helmet relative to face size
}

export const F1_HELMETS: HelmetOverlay[] = [
  {
    id: 'none',
    name: 'No Helmet',
    emoji: '',
    teamColor: '#FFFFFF',
    description: 'No helmet overlay',
    scale: 1.0
  },
  {
    id: 'ferrari_helmet',
    name: 'Ferrari',
    emoji: '🔴',
    teamColor: '#E10600',
    description: 'Ferrari red racing helmet',
    scale: 1.2
  },
  {
    id: 'mercedes_helmet',
    name: 'Mercedes',
    emoji: '⚫',
    teamColor: '#00D2BE',
    description: 'Mercedes silver helmet',
    scale: 1.2
  },
  {
    id: 'redbull_helmet',
    name: 'Red Bull',
    emoji: '🔵',
    teamColor: '#1E4193',
    description: 'Red Bull racing helmet',
    scale: 1.2
  },
  {
    id: 'mclaren_helmet',
    name: 'McLaren',
    emoji: '🟠',
    teamColor: '#FF8700',
    description: 'McLaren papaya helmet',
    scale: 1.2
  },
  {
    id: 'racing_helmet',
    name: 'Racing',
    emoji: '🪖',
    teamColor: '#FFD700',
    description: 'Classic racing helmet',
    scale: 1.3
  },
  {
    id: 'champion_helmet',
    name: 'Champion',
    emoji: '👑',
    teamColor: '#FFD700',
    description: 'World champion crown',
    scale: 1.1
  },
  {
    id: 'fire_helmet',
    name: 'Speed',
    emoji: '🔥',
    teamColor: '#FF4500',
    description: 'Speed demon fire helmet',
    scale: 1.0
  },
  {
    id: 'lightning_helmet',
    name: 'Lightning',
    emoji: '⚡',
    teamColor: '#FFFF00',
    description: 'Lightning fast helmet',
    scale: 0.9
  },
  {
    id: 'star_helmet',
    name: 'Superstar',
    emoji: '⭐',
    teamColor: '#FFD700',
    description: 'Superstar racing helmet',
    scale: 1.0
  }
];

// Fun racing emojis for additional overlays
export const RACING_EMOJIS = [
  '🏎️', '🏁', '🏆', '🥇', '🔥', '⚡', '💨', '🚀', '⭐', '👑'
] as const;

export type RacingEmoji = typeof RACING_EMOJIS[number]; 