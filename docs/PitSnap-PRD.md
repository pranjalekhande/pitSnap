# PitSnap - Product Requirements Document & Development Checklist

## Executive Summary
PitSnap is an F1-themed ephemeral social media app combining real-time photo/video sharing with Stories, AR filters, live timing data, and community features.

## 🎯 CURRENT PHASE: 8 (AR Filters & Polish)
**Status**: Phase 7 Complete ✅ | Stories Feature Complete ✅ | Next: Mixed Conversations + AR Features

**Ready for Next Step**: ❌ **Mixed Conversation Support** + ❌ **F1-Themed AR Filters**

## ✅ DEVELOPMENT STATUS - Phase 7 Complete + Stories Complete!

### 🎉 COMPLETED FEATURES (Phase 1-7 + Stories):
- ✅ **User Authentication** - Login/Signup with Supabase Auth
- ✅ **Photo Capture** - Camera functionality for taking photos
- ✅ **Video Recording** - Camera functionality for recording videos  
- ✅ **Photo/Video Upload** - Supabase Storage integration working
- ✅ **Photo/Video Sharing** - Can send photos and videos to friends
- ✅ **Basic Chat** - Can view shared photos and videos in chat
- ✅ **Friends System** - Add friends functionality
- ✅ **Tap-to-View** - Basic photo/video viewing with auto-delete after viewing
- ✅ **Camera UI** - Improved layout with flip camera and mode switcher
- ✅ **Text Messaging** - Send and receive text messages
- ✅ **Read Receipt System** - White checkmarks showing delivered/read status
- ✅ **Chat Auto-scroll** - Chat opens showing latest messages at bottom
- ✅ **Time Display** - Shows "2h ago" instead of expiry countdown
- ✅ **Message Ordering** - Messages display in chronological order

### 🚀 **STORIES FEATURE - COMPLETE!** ✅
- ✅ **Stories Screen** - Main stories feed with friend stories
- ✅ **Story Composer** - Create stories with photos/videos and captions
- ✅ **Story Viewer** - Full-screen story viewing with progress bars
- ✅ **My Stories Screen** - Manage your own stories with analytics
- ✅ **24-Hour Auto-Expiry** - Stories automatically delete after 24 hours
- ✅ **Story Views Tracking** - See who viewed your stories
- ✅ **Real-time Updates** - Stories update in real-time via Supabase
- ✅ **Friend-only Visibility** - Stories only visible to friends (RLS policies)
- ✅ **Story Ring UI** - Red rings for new stories, gray for viewed
- ✅ **Navigation Integration** - Stories tab in bottom navigation

### 🔥 PHASE 8 PRIORITIES - Mixed Conversations + AR Features:

#### **Chat System Completion (High Priority)**:
- ❌ **Mixed Conversations** - Support both text and media in same chat thread seamlessly
- ❌ **Reply Functionality** - Long-press to reply to specific messages  
- ❌ **Message Threading** - Show context of what message is being replied to
- ❌ **Typing Indicators** - Show when someone is typing
- ❌ **Message Reactions** - React to messages with emojis
- ❌ **Group Messaging** - Create group chats with multiple friends

#### **AR & F1 Features (Medium Priority)**:
- ❌ **Basic AR Filters** - Helmet visor overlay, checkered flag frame
- ❌ **F1 Team Theming** - Red Bull, Ferrari, Mercedes themes
- ❌ **Race Weekend Mode** - Special UI during race weekends
- ❌ **F1 Driver Recognition** - AI to detect drivers in photos
- ❌ **Track Map Backgrounds** - 3D rendered F1 circuit backgrounds

#### **Performance & Polish (Medium Priority)**:
- ❌ **Push Notifications** - Real-time message and story notifications
- ❌ **Offline Support** - Cache messages and stories for offline viewing
- ❌ **Performance Optimization** - Lazy loading, image compression
- ❌ **Error Handling** - Comprehensive error states and retry logic
- ❌ **Accessibility** - Screen reader support, keyboard navigation

### 🚧 CURRENT DEVELOPMENT CHECKLIST:

#### **🎯 IMMEDIATE NEXT STEPS (Week 1-2):**
1. ❌ **Mixed Message Display** - Improve UI to show text + media messages together
2. ❌ **Reply to Messages** - Long-press menu with reply option
3. ❌ **Reply Context Display** - Show original message when replying
4. ❌ **Group Chat Creation** - Add ability to create group conversations
5. ❌ **Basic Push Notifications** - Set up Expo notifications

#### **🔧 TECHNICAL IMPROVEMENTS (Week 3-4):**
6. ❌ **Typing Indicators** - Real-time typing status via Supabase
7. ❌ **Message Reactions** - Add emoji reactions to messages
8. ❌ **Performance Optimization** - Image lazy loading and compression
9. ❌ **Error Boundary Components** - Better error handling
10. ❌ **Offline Message Queue** - Queue messages when offline

#### **🎨 F1 FEATURES & POLISH (Week 5-8):**
11. ❌ **Basic AR Filters** - Start with helmet visor overlay
12. ❌ **F1 Team Themes** - Red Bull, Ferrari, Mercedes color schemes
13. ❌ **Race Weekend Detection** - Special UI during F1 race weekends
14. ❌ **Driver Photo Recognition** - Basic AI to detect F1 drivers
15. ❌ **Circuit Background Filters** - Add F1 track backgrounds to stories

#### **🚀 ADVANCED FEATURES (Week 9-12):**
16. ❌ **Live F1 Timing Integration** - Show race timing in app
17. ❌ **Snap Map → Track Map** - Show friends' locations on F1 circuits
18. ❌ **Voice Messages** - Team radio style voice notes
19. ❌ **Prediction Games** - Race prediction mini-games
20. ❌ **Virtual Garage** - 3D F1 car exploration

## Core Features

### 1. ✅ **Real-Time Photo/Video Sharing** - COMPLETE
- ✅ Race-Moment Snaps (self-destruct after viewing)
- ✅ Camera functionality with photo/video modes
- ✅ Supabase storage integration

### 2. ✅ **Stories System** - COMPLETE
- ✅ 24-hour Stories with auto-expiry
- ✅ Story creation, viewing, and management
- ✅ Friend-only visibility with RLS
- ✅ View tracking and analytics
- ✅ Real-time story updates

### 3. ✅ **Enhanced Chat System** - 80% COMPLETE
- ✅ **Auto-scroll Behavior** - Always show latest messages when opening chat
- ✅ **Proper Time Display** - Shows "2h ago" instead of expiry countdown  
- ✅ **Message Ordering** - Chronological display with latest at bottom
- ✅ **Text Message Input** - Send text messages with input field and send button
- ✅ **Read Receipt System** - White checkmarks showing delivered/read status
- ❌ **Mixed Conversations** - Support both text and media in same conversation
- ❌ **Reply Functionality** - Reply to specific messages with context
- ❌ **Message Threading** - Visual indication of replies and conversations
- ❌ **Typing Indicators** - Show when someone is typing
- ❌ **Group Messaging** - Multi-person conversations

### 4. ❌ **AR Filters & Camera Effects** - NEXT PRIORITY
- ❌ Helmet Visor Overlay with face-tracking
- ❌ Checkered Flag Frame animations  
- ❌ Podium Confetti triggered by keywords
- ❌ Track Map Backgrounds with 3D renders

### 5. ✅ **User Authentication & Friends** - COMPLETE
- ✅ Supabase authentication system
- ✅ Friend adding and management
- ✅ User profiles and settings

### 6. ❌ **Advanced Social Features** - FUTURE
- ❌ Race-Day Streaks tracking
- ❌ Snap Map → Track Map integration  
- ❌ Screenshot Alerts for exclusive content
- ❌ Discover Channels for curated F1 content

## 📊 **DEVELOPMENT PROGRESS SUMMARY:**
- **Phase 1-6**: 100% Complete ✅
- **Phase 7 (Chat)**: 80% Complete ✅  
- **Stories Feature**: 100% Complete ✅
- **Phase 8 (AR + Polish)**: 0% Complete ❌

**Total App Completion**: ~75% 🚀

## 🎯 **RECOMMENDED NEXT STEPS:**

### **This Week (High Impact):**
1. **Mixed Conversations** - Show text and media messages together
2. **Reply Functionality** - Essential chat feature
3. **Group Chat Creation** - Expand social functionality

### **Next 2 Weeks (Polish & Performance):**
4. **Push Notifications** - Keep users engaged
5. **Performance Optimization** - Smooth user experience
6. **Error Handling** - Production readiness

### **Following Month (F1 Magic):**
7. **Basic AR Filters** - Core differentiator
8. **F1 Team Theming** - Brand identity
9. **Race Weekend Features** - Seasonal engagement

## Technical Stack
- Frontend: React Native + Expo, TypeScript
- Backend: Supabase (Auth, Database, Realtime, Storage)  
- AI: OpenAI GPT-4 + Pinecone Vector DB (Future)
- AR: expo-camera, react-native-vision-camera, expo-gl (Future)

## Success Metrics
- 10K+ DAU during race weekends
- 5+ snaps per user per race weekend  
- 70%+ Stories engagement rate
- 60%+ weekly retention rate 