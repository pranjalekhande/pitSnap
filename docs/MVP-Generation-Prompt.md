# PitSnap MVP Generation Prompt

## Project Overview
Generate a complete React Native Expo application for "PitSnap" - an F1-themed ephemeral social media app. This is the MVP focusing on core Snapchat-like functionality with Formula 1 branding and theming.

## Technical Requirements

### Core Stack
- **Framework**: React Native with Expo SDK 50+
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **UI Library**: NativeWind (Tailwind CSS) + React Native Paper
- **Authentication**: Supabase Auth
- **Backend**: Supabase (Database, Storage, Realtime)
- **Camera**: expo-camera
- **Push Notifications**: Expo Notifications

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── camera/          # Camera-specific components
│   ├── chat/            # Chat components
│   └── f1/              # F1-themed components
├── screens/             # Screen components
│   ├── auth/            # Authentication screens
│   ├── camera/          # Camera and capture screens
│   ├── chat/            # Chat and messaging screens
│   ├── profile/         # User profile screens
│   └── social/          # Social feed screens
├── store/               # Zustand stores
├── services/            # API and external services
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
├── types/               # TypeScript type definitions
├── constants/           # App constants and config
└── theme/               # Design system implementation
```

## Core Features to Implement

### 1. Authentication System
```typescript
// Features needed:
- Email/password signup and login
- Basic user profile creation
- Secure token management
- Protected route handling
- Simple F1-themed UI (red/black colors only)
```

### 2. Camera Functionality
```typescript
// Core camera features:
- Photo and video capture (max 10 seconds)
- Basic camera controls (flip, flash)
- Real-time preview
- Media compression and optimization
- Temporary local storage before sending
```

### 3. User Management
```typescript
// User features:
- Profile creation and editing
- F1 team preference selection
- Friend discovery and management
- User search functionality
- Profile pictures and display names
```

### 4. Chat System
```typescript
// Messaging features:
- Direct messaging between users
- Photo/video sharing in chats
- Message read receipts
- Ephemeral messages (disappear after viewing)
- Typing indicators
- Real-time message updates
```

### 5. Social Feed
```typescript
// Feed features:
- Story-style disappearing content
- Friend activity feed
- Content interaction (like, reply)
- Content expiration (24-hour stories)
```

## F1 Design System Implementation

### Typography System
```typescript
// Use system fonts for simplicity:
const fonts = {
  default: 'System', // iOS: SF Pro, Android: Roboto
};

// Standard font size scale:
const fontSize = {
  xs: 10,    // Fine print
  sm: 12,    // Captions
  md: 14,    // Body text
  lg: 16,    // Primary text
  xl: 20,    // Screen titles
  '2xl': 24, // Headers
};
```

### Color Theming
```typescript
// Simple F1-themed colors (minimal approach):
const colors = {
  // Primary Colors (F1-inspired)
  primary: '#E10600',      // F1 Red
  secondary: '#15151E',    // Racing Black
  background: '#FFFFFF',   // White
  text: '#000000',         // Black text
  textSecondary: '#8E8E93', // Gray text
  
  // Basic Status Colors
  success: '#00C851',      // Green
  warning: '#FFD600',      // Yellow  
  error: '#FF4444',        // Red
  info: '#33B5E5',         // Blue
};
```

## Simple F1 Branding
Apply minimal F1 theming throughout the app:
- Use F1 red (#E10600) as primary color for buttons and accents
- Use racing black (#15151E) for headers and navigation
- Keep standard fonts (no custom F1 fonts needed for MVP)
- Add subtle racing-inspired button styles (rounded corners, bold text)

### UI Components
```typescript
// Create these basic components with F1 styling:
- Button (standard button with F1 red primary color)
- Header (navigation header with F1 red accent)
- UserCard (basic user profile card)
- MessageBubble (chat message with F1-inspired styling)
- CameraButton (large circular capture button)
- Loading (simple loading spinner with F1 colors)
```

## Screen Requirements

### Authentication Screens
1. **WelcomeScreen**: Simple app intro with F1 red branding
2. **LoginScreen**: Email/password login
3. **SignupScreen**: Basic registration

### Main Application Screens
1. **CameraScreen**: Primary camera interface (Snapchat-style)
2. **ChatListScreen**: List of conversations
3. **ChatScreen**: Individual chat conversation
4. **ProfileScreen**: User profile management
5. **FriendsScreen**: Friend discovery and management
6. **SettingsScreen**: App preferences and team switching

### Navigation Structure
```typescript
// Tab Navigation (main app):
- Camera (primary tab, center position) 
- Chats (left tab)
- Profile (right tab)

// Stack Navigation:
- Auth Stack (welcome, login, signup)
- Main Stack (camera, chat details, profile edit, settings)
```

## Dependencies to Include
```json
{
  "expo": "~50.0.0",
  "@supabase/supabase-js": "^2.38.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "@react-navigation/native-stack": "^6.9.0",
  "expo-camera": "~14.0.0",
  "expo-media-library": "~15.0.0",
  "expo-av": "~13.0.0",
  "expo-notifications": "~0.27.0",
  "zustand": "^4.4.0",
  "nativewind": "^2.0.0",
  "react-native-paper": "^5.11.0",
  "react-native-vector-icons": "^10.0.0",
  "@expo/vector-icons": "^13.0.0",
  "react-native-super-grid": "^4.9.0",
  "react-native-gesture-handler": "~2.14.0",
  "react-native-reanimated": "~3.6.0"
}
```

## Key Implementation Details

### Supabase Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Friends table
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  friend_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  content TEXT,
  media_url TEXT,
  message_type TEXT DEFAULT 'text', -- text, image, video
  expires_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### State Management Structure
```typescript
// User store
interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

// Chat store
interface ChatStore {
  conversations: Conversation[];
  activeChat: string | null;
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, message: Message) => void;
  loadMessages: (chatId: string) => Promise<void>;
}

// Camera store
interface CameraStore {
  capturedMedia: CapturedMedia | null;
  isRecording: boolean;
  setCapturedMedia: (media: CapturedMedia) => void;
  clearMedia: () => void;
}
```

## Styling Guidelines

### NativeWind Configuration
```typescript
// Simple F1-inspired utility classes:
- Primary colors: `bg-red-600`, `text-gray-900`, `bg-white`
- Standard fonts: System fonts, no custom typography needed
- Spacing: 8px grid system (`space-2`, `space-4`, `space-6`)
- Simple styling: `rounded-lg`, `shadow-md`
```

### Component Styling Examples
```typescript
// Primary button with F1 red
<Pressable className="bg-red-600 px-6 py-3 rounded-lg active:bg-red-700">
  <Text className="text-white text-lg font-bold text-center">
    Login
  </Text>
</Pressable>

// Secondary button
<Pressable className="bg-gray-900 px-6 py-3 rounded-lg border border-gray-300">
  <Text className="text-white text-lg font-medium text-center">
    Sign Up
  </Text>
</Pressable>

// Simple user card
<View className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
  <Text className="text-lg font-bold text-gray-900">
    John Doe
  </Text>
  <Text className="text-sm text-gray-600">
    @johndoe
  </Text>
</View>
```

## Performance Requirements
- App launch time: < 3 seconds
- Camera loading: < 1 second
- Message delivery: Real-time (< 500ms)
- Image compression: Optimize for mobile data
- Smooth 60fps animations

## Security & Privacy
- Secure authentication tokens
- Media encryption for ephemeral content
- Privacy controls for user discovery
- Content moderation hooks
- GDPR compliance considerations

## Generate This Application
Create a **simple, working MVP** React Native Expo application focused on core Snapchat functionality. Include basic TypeScript types, error handling, and clear code structure.

**MVP Focus**: 
- Core Snapchat features: Camera, messaging, friends, auth
- Minimal F1 theming: Just use F1 red (#E10600) for primary buttons/accents
- Working functionality over complex design
- No advanced F1 features, team selection, or complex animations
- Focus on getting basic photo sharing and chat working properly


The app should be immediately runnable with `npx expo start` after running `npm install`. 