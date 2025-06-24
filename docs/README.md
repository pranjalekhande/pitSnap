# PitSnap - F1 Themed Ephemeral Social App

<div align="center">
  <h3>🏎️ The ultimate F1-themed ephemeral social experience</h3>
  <p>Share racing moments that disappear, just like the thrill of the track.</p>
</div>

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Emulator
- Supabase account

### Environment Setup

1. **Copy the environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Add your Supabase credentials to `.env.local`:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_APP_NAME=PitSnap
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

   **From your Vercel environment variables, use:**
   - `SUPABASE_URL` for `EXPO_PUBLIC_SUPABASE_URL`
   - `SUPABASE_ANON_KEY` for `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on your device:**
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## 🗄️ Database Setup

### Supabase Configuration

1. **Go to your Supabase project dashboard**
2. **Navigate to the SQL Editor**
3. **Run the provided schema:**
   ```bash
   # Copy and paste the contents of supabase-schema.sql into the SQL editor
   ```

This will create:
- User profiles table
- Messages table with ephemeral support
- Friends/relationships table
- Media storage bucket
- Row Level Security policies
- Automatic cleanup for expired messages

### Storage Setup

The schema automatically creates a `media` storage bucket for photos and videos. Ensure your Supabase project has sufficient storage quota.

## 📱 Features

### ✅ Implemented Core Features

- **🔐 Authentication System**
  - Email/password signup and login
  - Secure token management
  - Protected routes

- **📸 Camera Functionality**
  - Photo capture with quality optimization
  - Video recording (max 10 seconds)
  - Camera controls (flip, flash)
  - Real-time preview

- **💬 Messaging System**
  - Direct messaging between users
  - Photo/video sharing in chats
  - Real-time message updates
  - Message read receipts
  - Ephemeral messages (24-hour expiry)

- **👥 Social Features**
  - User search and discovery
  - Friend requests and management
  - Profile creation and editing
  - User avatars (text-based)

- **🎨 F1 Design System**
  - F1 red primary color (#E10600)
  - Racing black secondary color
  - Clean, modern UI components
  - Responsive design

### 🏗️ App Architecture

```
src/
├── components/           # Reusable UI components
├── screens/             # Screen components
│   ├── auth/            # Authentication screens
│   ├── camera/          # Camera and capture screens
│   ├── chat/            # Chat and messaging screens
│   ├── profile/         # User profile screens
│   └── social/          # Social features screens
├── store/               # Zustand state management
├── services/            # API and external services
├── navigation/          # React Navigation setup
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
├── types/               # TypeScript type definitions
├── constants/           # App constants and config
└── theme/               # Design system implementation
```

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK 50+
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper + NativeWind (Tailwind)
- **Authentication**: Supabase Auth
- **Backend**: Supabase (Database, Storage, Realtime)
- **Camera**: expo-camera
- **Styling**: NativeWind (Tailwind CSS for React Native)

## 🎯 Core User Flows

### Authentication Flow
1. Welcome screen with F1 branding
2. Signup/Login with email and password
3. Automatic profile creation
4. Secure session management

### Camera & Messaging Flow
1. Camera screen as primary interface
2. Tap to capture photo, hold for video
3. Share directly with friends via chat
4. Messages expire after 24 hours

### Social Flow
1. Search for users by name or email
2. Send friend requests
3. Accept/reject incoming requests
4. Start conversations with friends

## 🔧 Configuration

### Camera Settings
- **Image Quality**: 0.8 (configurable in `src/constants/index.ts`)
- **Video Length**: 10 seconds max
- **Supported Formats**: JPEG for photos, MP4 for videos

### Message Expiry
- **Default**: 24 hours
- **Configurable** in `MEDIA_CONFIG.messageExpiry`

### F1 Theme Colors
```typescript
const COLORS = {
  primary: '#E10600',      // F1 Red
  secondary: '#15151E',    // Racing Black
  background: '#FFFFFF',   // White
  // ... other colors
}
```

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **Authenticated-only** media uploads
- **Automatic message expiry** for privacy
- **Secure file storage** with Supabase
- **JWT-based authentication** with automatic refresh

## 📋 Development Scripts

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Build for production
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **Camera permissions not working**
   - Ensure permissions are granted in device settings
   - Restart the Expo development server

2. **Supabase connection errors**
   - Verify environment variables are correct
   - Check Supabase project status
   - Ensure RLS policies are properly configured

3. **Messages not sending**
   - Check network connection
   - Verify user authentication status
   - Check Supabase database policies

### Environment Variables Missing
If you see errors about missing environment variables:
1. Ensure `.env.local` exists and is properly formatted
2. Restart the Expo development server after adding variables
3. Check that variable names match exactly (including `EXPO_PUBLIC_` prefix)

## 🚧 Future Enhancements

- [ ] Push notifications for new messages
- [ ] Story/feed functionality
- [ ] Advanced F1 team selection
- [ ] Group chats
- [ ] Message reactions
- [ ] Advanced camera filters
- [ ] Offline message queue
- [ ] Enhanced friend discovery

## 📄 License

This project is built as a demonstration application. 

## 🏁 Ready to Race?

Your PitSnap app is ready to go! The app combines the excitement of Formula 1 with the ephemeral nature of modern social media, creating a unique racing-themed experience.

**Start your engines and happy coding! 🏎️💨**
