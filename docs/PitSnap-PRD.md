# PitSnap - Product Requirements Document & Brainstorming

## Executive Summary
PitSnap is an F1-themed ephemeral social media app combining real-time photo/video sharing with AR filters, live timing data, and community features.

## ✅ DEVELOPMENT STATUS - Phase 6 Complete + Critical Fixes Needed

### 🎉 COMPLETED FEATURES:
- ✅ **User Authentication** - Login/Signup with Supabase Auth
- ✅ **Photo Capture** - Camera functionality for taking photos
- ✅ **Video Recording** - Camera functionality for recording videos
- ✅ **Photo Upload** - Supabase Storage integration working
- ✅ **Photo/Video Sharing** - Can send photos and videos to friends
- ✅ **Basic Chat** - Can view shared photos and videos in chat
- ✅ **Friends System** - Add friends functionality
- ✅ **Tap-to-View** - Basic photo/video viewing
- ✅ **Camera UI** - Improved layout with flip camera and mode switcher

### 🚨 CRITICAL BUGS TO FIX (HIGH PRIORITY):
- ❌ **Chat Scroll Issue** - Chat opens at top instead of showing latest messages
- ❌ **Auto-scroll to Bottom** - Need to automatically scroll to latest content when entering chat

### 🔥 MISSING CORE FEATURES (HIGH PRIORITY):
- ❌ **Text Chat Input** - Users can only send media, no basic text messaging
- ❌ **Reply Functionality** - Cannot reply to specific messages
- ❌ **Message Threading** - No context for conversations

### 🚧 IMMEDIATE NEXT PHASE (Phase 7 - Critical Chat Improvements):
**Essential Chat Features:**
1. **Auto-scroll to Latest Messages** - Fix chat opening behavior
2. **Text Message Input** - Add text input field with send button
3. **Reply to Messages** - Allow replying to specific photos/videos/text
4. **Message Context** - Show what message is being replied to
5. **Better Message Layout** - Improve chat bubble design for mixed media + text

**Then Continue With:**
- Stories & Group Messaging
- AR Filters & Camera Effects  
- F1-specific features and theming

## Core Features

### 1. Real-Time Photo/Video Sharing
- Race-Moment Snaps (2-10s self-destruct)
- Live-Timing Overlay integration
- Victory Lap Mode (5s highlight reels)

### 2. **Enhanced Chat System (PRIORITY UPDATE)**
- **Text + Media Messaging** - Support both text and media in same conversation
- **Reply Functionality** - Reply to specific messages with context
- **Message Threading** - Visual indication of replies and conversations
- **Auto-scroll Behavior** - Always show latest messages when opening chat
- **Mixed Message Types** - Seamless text, photo, video combinations
- **Typing Indicators** - Show when someone is typing
- **Message Status** - Delivered, read, expired indicators

### 3. AR Filters & Camera Effects
- Helmet Visor Overlay with face-tracking
- Checkered Flag Frame animations
- Podium Confetti triggered by keywords
- Track Map Backgrounds with 3D renders

### 4. User Authentication & Friends
- Team-Tag Signup for community auto-join
- Snapcode + Fandom QR codes
- Mutual-Race friend suggestions

### 5. Stories & Group Messaging
- My Race Weekend Story compilation
- Team Chat Rooms with ephemeral voice notes
- Race-Day Poll Stories with real-time results

### 6. Core Social Features
- Race-Day Streaks tracking
- Snap Map → Track Map integration
- Screenshot Alerts for exclusive content
- Discover Channels for curated F1 content

## Brainstorming Ideas

### AI-Powered Features
- Smart Captions based on image content
- Driver Recognition using computer vision
- Race Moment Detection for auto-highlights
- Personalized Content via RAG

### Creative Features
- Pit Stop Timer for daily tasks
- Driver's Eye View AR filter
- Team Radio voice messaging
- Grid Walk interview mode

### Future Enhancements
- Virtual Garage 3D car exploration
- Track Walk AR racing line overlay
- Fantasy Integration
- Prediction Leaderboards

## Technical Stack
- Frontend: React Native + Expo, TypeScript
- Backend: Supabase (Auth, Database, Realtime, Storage)
- AI: OpenAI GPT-4 + Pinecone Vector DB
- AR: expo-camera, react-native-vision-camera, expo-gl

## Success Metrics
- 10K+ DAU during race weekends
- 5+ snaps per user per race weekend
- 70%+ AR filter usage
- 60%+ weekly retention rate 