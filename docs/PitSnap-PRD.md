# PitSnap - Product Requirements Document & Development Checklist

## Executive Summary
PitSnap is an F1-themed ephemeral social media app combining real-time photo/video sharing with AR filters, live timing data, and community features.

## 🎯 CURRENT PHASE: 7 (Chat System Enhancement)
**Status**: Phase 6 Complete ✅ | Phase 7 - 5/10 Features Complete ✅ | Next: Mixed Conversations

**Ready for Next Step**: ❌ **Mixed Conversation Support** - Show text + media together seamlessly

## ✅ DEVELOPMENT STATUS - Phase 6 Complete + Phase 7 In Progress

### 🎉 COMPLETED FEATURES (Phase 1-6):
- ✅ **User Authentication** - Login/Signup with Supabase Auth
- ✅ **Photo Capture** - Camera functionality for taking photos
- ✅ **Video Recording** - Camera functionality for recording videos
- ✅ **Photo Upload** - Supabase Storage integration working
- ✅ **Photo/Video Sharing** - Can send photos and videos to friends
- ✅ **Basic Chat** - Can view shared photos and videos in chat
- ✅ **Friends System** - Add friends functionality
- ✅ **Tap-to-View** - Basic photo/video viewing with auto-delete after viewing
- ✅ **Camera UI** - Improved layout with flip camera and mode switcher

### ✅ PHASE 7 CRITICAL FIXES - COMPLETED:
- ✅ **Chat Auto-scroll Fix** - Chat now opens showing latest messages at bottom
- ✅ **Time Display Fix** - Now shows "2h ago" instead of expiry countdown
- ✅ **Proper Message Ordering** - Messages display in chronological order
- ✅ **Auto-scroll on New Messages** - Chat automatically scrolls when new content arrives

### 🔥 PHASE 7 REMAINING FEATURES (HIGH PRIORITY):
- ✅ **Text Message Input** - Add text input field with send button for basic messaging
- ✅ **Read Receipt Indicators** - White checkmarks showing delivered/read status
- ❌ **Mixed Conversations** - Support both text and media in same chat thread  
- ❌ **Reply Functionality** - Long-press to reply to specific messages
- ❌ **Message Threading** - Show context of what message is being replied to
- ❌ **Typing Indicators** - Show when someone is typing

### 🚧 PHASE 7 CHECKLIST - Chat System Enhancement:
**Essential Chat Features (In Priority Order):**
1. ✅ **Text Message Input** - Add input field and send functionality
2. ✅ **Send Text Messages** - Integrate with existing sendMessage service
3. ✅ **Read Receipt System** - White checkmarks for delivered/read status with auto-read for text messages
4. ❌ **Mixed Message Display** - Improve UI for text + media conversations
5. ❌ **Reply to Messages** - Long-press menu with reply option
6. ❌ **Reply Context Display** - Show original message when replying
7. ❌ **Typing Indicators** - Real-time typing status

### 🎯 NEXT PHASES (After Phase 7):
**Phase 8: Stories & Groups**
- ❌ 24-hour Stories functionality
- ❌ Group messaging
- ❌ Story viewers and interactions

**Phase 9: AR & Effects**
- ❌ Basic AR filters
- ❌ F1-themed camera effects
- ❌ Custom filter creation

**Phase 10+: F1 Magic**
- ❌ F1 team theming
- ❌ Race weekend features
- ❌ Live timing integration

## Core Features

### 1. Real-Time Photo/Video Sharing
- Race-Moment Snaps (2-10s self-destruct)
- Live-Timing Overlay integration
- Victory Lap Mode (5s highlight reels)

### 2. **Enhanced Chat System (PHASE 7 - IN PROGRESS)**
- ✅ **Auto-scroll Behavior** - Always show latest messages when opening chat
- ✅ **Proper Time Display** - Shows "2h ago" instead of expiry countdown
- ✅ **Message Ordering** - Chronological display with latest at bottom
- ✅ **Text Message Input** - Send text messages with input field and send button
- ✅ **Read Receipt System** - White checkmarks showing delivered/read status
- ❌ **Text + Media Messaging** - Support both text and media in same conversation
- ❌ **Reply Functionality** - Reply to specific messages with context
- ❌ **Message Threading** - Visual indication of replies and conversations
- ❌ **Mixed Message Types** - Seamless text, photo, video combinations
- ❌ **Typing Indicators** - Show when someone is typing

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