# PitSnap - F1-Themed Social Media App

> **🚀 LIVE DEMO**: `exp://v7xfdne-pranjalekhande-8081.exp.direct`
> 
> **📱 How to Test**: Download [Expo Go](https://expo.dev/client) app and scan the QR code or paste the link above

## 📋 Project Overview

PitSnap is a **Snapchat-inspired social media app** with F1 theming, featuring ephemeral messaging, 24-hour stories, real-time chat, and camera functionality. Built with React Native, Expo, and Supabase.

### ✅ **Current Features (75% Complete)**
- 🔐 **User Authentication** - Login/Signup with Supabase Auth
- 📸 **Camera System** - Photo/video capture with front/back camera
- 💬 **Real-time Messaging** - Text + media messages with read receipts  
- 📖 **24-Hour Stories** - Complete Stories system with view tracking
- 👥 **Friends System** - Add friends, manage connections
- ⏱️ **Ephemeral Content** - Messages disappear after viewing
- 🎨 **F1 Theming** - Racing-inspired UI with red/black color scheme

---

## 🏗️ **Project Structure**

```
pitSnap/
├── screens/                 # All app screens
│   ├── auth/               # Login/Signup screens
│   ├── camera/             # Camera functionality
│   ├── chat/               # Individual & group chat
│   ├── friends/            # Friend management
│   ├── profile/            # User profiles
│   └── stories/            # Stories system (4 screens)
├── services/               # Backend service layers
│   ├── messagesService.ts  # Chat & messaging logic
│   ├── storiesService.ts   # Stories CRUD operations
│   ├── friendsService.ts   # Friend management
│   └── mediaService.ts     # File upload/storage
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Authentication state
├── navigation/             # App navigation
│   ├── AppNavigation.tsx   # Main tab navigation
│   └── AuthNavigator.tsx   # Auth flow navigation
├── components/             # Reusable components
├── lib/                    # Configuration
│   └── supabase.ts        # Supabase client setup
└── docs/                  # Project documentation
```

---

## 🛠️ **Tech Stack**

### **Frontend**
- **Framework**: React Native + Expo (SDK 53)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: React Context + Hooks
- **Styling**: React Native StyleSheet
- **Camera**: expo-camera + expo-media-library

### **Backend & Database**
- **Backend**: Supabase (PostgreSQL + Real-time + Auth + Storage)
- **Authentication**: Supabase Auth (email/password)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for photos/videos
- **Real-time**: Supabase Realtime subscriptions

### **Database Schema**
```sql
-- Core Tables
users (id, email, display_name, avatar_url, created_at, updated_at)
friends (id, user_id, friend_id, status, created_at)
messages (id, sender_id, recipient_id, content, media_url, message_type, expires_at, read_at, first_viewed_at, created_at)

-- Stories Tables  
stories (id, user_id, media_url, media_type, caption, expires_at, view_count, created_at, updated_at)
story_views (id, story_id, viewer_id, viewed_at)
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### **1. Clone Repository**
```bash
git clone https://github.com/pranjalekhande/pitSnap.git
cd pitSnap
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Setup**
Create `.env.local` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **4. Database Setup**
1. Create Supabase project
2. Run the SQL schema from `pitsnap-schema.sql` in Supabase SQL Editor
3. Enable RLS policies included in schema

### **5. Run Development Server**

#### **Local Development**
```bash
npx expo start
```

#### **Global Sharing (Tunnel)**
```bash
npx expo start --tunnel
```
*Creates globally accessible link like: `exp://v7xfdne-pranjalekhande-8081.exp.direct`*

---

## 📱 **How to Test the App**

### **Option 1: Expo Go (Recommended)**
1. **Install Expo Go** on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. **Open this link**: `exp://v7xfdne-pranjalekhande-8081.exp.direct`
3. **Or scan QR code** when running `npx expo start --tunnel`

### **Option 2: iOS Simulator**
```bash
npx expo start
# Press 'i' to open iOS simulator
```

### **Option 3: Android Emulator**
```bash
npx expo start  
# Press 'a' to open Android emulator
```

---

## 🎯 **Key Features Demo**

### **🔐 Authentication**
- Sign up with email/password
- Login with existing account
- Secure user sessions

### **📸 Camera & Media**
- Take photos/videos with front/back camera
- Send ephemeral media messages
- Create 24-hour stories with captions

### **💬 Real-time Messaging**
- Send text messages instantly
- Share photos/videos that disappear after viewing
- Read receipts and message status
- Auto-scroll to latest messages

### **📖 Stories System**
- **Stories Feed**: View friends' 24-hour stories
- **Story Creation**: Add photos/videos with captions
- **Story Viewer**: Full-screen viewing with progress bars
- **My Stories**: Manage your stories + view analytics

### **👥 Social Features** 
- Add friends by username
- Friends-only content visibility
- Real-time updates and notifications

---

## 🔧 **Development**

### **Available Scripts**
```bash
npm start              # Start Expo development server
npm run tunnel         # Start with global tunnel access
npm run web           # Run web version  
npm run ios           # Run iOS simulator
npm run android       # Run Android emulator
```

### **Database Management**
- **Schema**: `pitsnap-schema.sql` - Complete database setup
- **Migrations**: `stories-migration.sql` - Safe schema updates
- **RLS Policies**: Implemented for data security

### **Real-time Features**
- Stories updates via Supabase subscriptions
- Message delivery notifications
- Friend status changes
- Auto-cleanup of expired content

---

## 🚀 **Deployment Options**

### **1. Expo Go Sharing (Current)**
```bash
npx expo start --tunnel
# Share: exp://v7xfdne-pranjalekhande-8081.exp.direct
```

### **2. GitHub Actions CI/CD** 
- Workflow configured in `.github/workflows/expo-deploy.yml`
- Auto-deploy on push to main branch
- Requires `EXPO_TOKEN` in GitHub secrets

### **3. Production Builds**
```bash
# Development build
eas build --platform ios --profile preview

# Production release (requires developer accounts)
eas build --platform all --profile production
```

---

## 📊 **Project Status & Roadmap**

### **✅ Completed (Phase 1-7)**
- Core Snapchat functionality
- Complete Stories system
- Real-time messaging
- User authentication & friends
- Camera integration

### **🔄 Next Steps (Phase 8)**
- Mixed conversation support (text + media together)
- Reply functionality with message threading
- Group messaging 
- Push notifications
- Basic AR filters with F1 theming

### **🎯 Future Features**
- F1 team theming and customization
- Race weekend special modes
- Live F1 timing data integration
- Advanced AR filters (helmet overlays)
- Voice messaging (team radio style)

---

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 **License**

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 **Author**

**Pranjal Ekhande** - [@pranjalekhande](https://github.com/pranjalekhande)

---

## 🆘 **Support**

Having issues? 
1. Check the [Issues](https://github.com/pranjalekhande/pitSnap/issues) page
2. Review the `/docs` folder for detailed documentation
3. Test the live demo: `exp://v7xfdne-pranjalekhande-8081.exp.direct`

---

**🏎️ Built for the love of F1 and social connection!** 🏁 