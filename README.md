# PitSnap - F1-Themed Social Media App

> **🚀 LIVE DEMO**: `exp://v7xfdne-pranjalekhande-8081.exp.direct`
> 
> **📱 How to Test**: Download [Expo Go](https://expo.dev/client) app and scan the QR code or paste the link above

## 📋 Project Overview

PitSnap is a **Snapchat-inspired social media app** with F1 theming, featuring ephemeral messaging, 24-hour stories, real-time chat, and camera functionality. Built with React Native, Expo, and Supabase.

### ✅ **Current Features (90% Complete)**
- 🔐 **User Authentication** - Login/Signup with Supabase Auth
- 📸 **Camera System** - Photo/video capture with front/back camera
- 💬 **Real-time Messaging** - Text + media messages with read receipts  
- 📖 **24-Hour Stories** - Complete Stories system with view tracking
- 👥 **Friends System** - Add friends, manage connections
- ⏱️ **Ephemeral Content** - Messages disappear after viewing
- 🎨 **F1 Theming** - Racing-inspired UI with red/black color scheme
- 🤖 **Paddock AI** - Advanced F1 strategic analysis and chatbot
- ⚡ **Performance Optimized** - Smart caching, bundle optimization, skeleton loading

---

## ⚡ **Performance Optimizations (Latest Update)**

### **🚀 Major Performance Improvements**
The app has been significantly optimized for production-ready performance:

#### **📊 Performance Metrics**
- **Bundle Time**: Reduced from 20+ seconds → **5-8 seconds** (60%+ improvement)
- **API Calls**: Reduced from 6+ calls → **1-2 calls** per screen (70% reduction)
- **Loading Experience**: Instant cached data loading with smooth skeleton states
- **Network Efficiency**: Smart request deduplication prevents duplicate API calls

#### **🔧 Technical Optimizations**

##### **Smart API Caching System**
- **TTL-based caching**: 5 minutes to 1 hour depending on data type
- **Request deduplication**: Prevents multiple identical API calls
- **Intelligent fallbacks**: Cached data served when network is slow
- **Force refresh**: Pull-to-refresh bypasses cache for fresh data

##### **Metro Bundle Optimization**
- **Tree shaking**: Removes unused code from final bundle
- **Minification**: Compressed JavaScript for faster loading
- **Bundle splitting**: Optimized module loading
- **Asset optimization**: Efficient handling of images and media

##### **Smart Loading UX**
- **Skeleton screens**: Beautiful loading states while data fetches
- **Parallel data loading**: Stories and F1 data load independently
- **Progressive rendering**: Screen renders as data becomes available
- **Error boundaries**: Graceful handling of loading failures

#### **🎯 What Users Will Notice**
- **Faster app startup**: Significantly reduced initial loading time
- **Instant cached content**: F1 data and stories load immediately on repeat visits
- **Smoother transitions**: Better UI responsiveness during navigation
- **Reduced data usage**: Fewer API calls means less mobile data consumption

### **📱 Optimized Screens**
- **Pit Wall**: Smart F1 data caching with skeleton loading states
- **Paddock AI**: Cached F1 strategic data for instant responses
- **Stories**: Parallel loading of friends' stories and your content

---

## 🤖 **Paddock AI - Advanced F1 Strategic Analysis**

### **🏎️ Features**
- **🔍 What-If Analysis**: "What if Hamilton had pitted earlier at Abu Dhabi 2021?"
- **📚 Historical Strategy Detective**: Find similar scenarios from F1 history
- **🏆 Driver Rankings**: Current championship standings and points
- **🏁 Tire Strategy Analysis**: Detailed race strategy breakdowns
- **⚡ Strategic Scenarios**: Monaco rain decisions, safety car calls, pit window analysis
- **🎯 Quick Actions**: 6 discoverable buttons for instant strategic insights

### **🧠 Technical Architecture**
- **Backend**: FastAPI + LangChain agent system with specialized tools
- **AI Engine**: OpenAI GPT-4 for strategic reasoning and analysis
- **Knowledge Base**: Pinecone vector database with F1 strategic knowledge
- **Data Sources**: Real F1 APIs with intelligent fallback systems
- **Tools**: 6 specialized strategic analysis tools for different scenarios
- **Performance**: Cached F1 data for instant strategic analysis responses

### **🚀 Paddock AI Setup**

#### **1. Backend Setup**
```bash
cd paddock-ai-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### **2. Environment Variables**
Create `paddock-ai-backend/.env` file:
```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
```

#### **3. Start Paddock AI Backend**
```bash
cd paddock-ai-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### **4. Configure Frontend**
In `services/f1DataService.ts` and `services/paddockAiService.ts`:
```typescript
// For iOS Simulator:
const API_URL = "http://127.0.0.1:8000";

// For Physical Device (replace with your IP):
const API_URL = "http://10.0.0.210:8000";
```

### **🧪 Test Paddock AI**

#### **Quick Test Commands**
```bash
# Test backend directly
curl -X POST "http://127.0.0.1:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Max Verstappen ranking?"}'

# Test What-If Analysis
curl -X POST "http://127.0.0.1:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "What if Verstappen had pitted 5 laps earlier in Abu Dhabi 2024?"}'
```

#### **Mobile App Testing**
1. **Start both servers** (React Native + Paddock AI backend)
2. **Navigate to Paddock AI** screen in the app
3. **Try Quick Actions**: Tap colorful strategic feature buttons
4. **Ask Questions**: 
   - "Show me rain strategy decisions from F1 history"
   - "Compare tire strategies from the most recent race"
   - "What are the current championship standings?"

### **📊 Strategic Analysis Examples**

#### **What-If Scenarios**
- Alternative pit stop timing analysis
- Different tire compound strategies
- Safety car decision impacts
- Weather-related strategic choices

#### **Historical Comparisons**
- Brazil 2008 Hamilton championship decider
- Turkey 2020 Perez breakthrough victory
- Abu Dhabi 2021 controversial finish
- Monaco strategy disasters and successes

#### **Real-time Data**
- Current driver championship standings
- Recent race winner and results
- Tire strategy analysis from latest GP
- Performance comparisons (qualifying vs race)

---

## 🏗️ **Project Structure**

```
pitSnap/
├── screens/                 # All app screens
│   ├── auth/               # Login/Signup screens
│   ├── camera/             # Camera functionality
│   ├── chat/               # Individual & group chat
│   ├── friends/            # Friend management
│   ├── paddock/            # Paddock AI strategic analysis
│   ├── pit-wall/           # F1 data feed with optimized loading
│   ├── profile/            # User profiles
│   └── stories/            # Stories system (4 screens)
├── services/               # Backend service layers
│   ├── messagesService.ts  # Chat & messaging logic
│   ├── storiesService.ts   # Stories CRUD operations
│   ├── friendsService.ts   # Friend management
│   ├── f1DataService.ts    # F1 data with smart caching (OPTIMIZED)
│   ├── paddockAiService.ts # Paddock AI communication
│   └── mediaService.ts     # File upload/storage
├── components/             # Reusable components
│   ├── paddock/            # Paddock AI UI components
│   └── pit-wall/           # F1 data display components
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Authentication state
├── navigation/             # App navigation
│   ├── AppNavigation.tsx   # Main tab navigation
│   └── AuthNavigator.tsx   # Auth flow navigation
├── lib/                    # Configuration
│   └── supabase.ts        # Supabase client setup
├── metro.config.js         # Metro bundler optimization (OPTIMIZED)
├── paddock-ai-backend/     # F1 Strategic Analysis Backend
│   ├── main.py            # FastAPI + LangChain agent
│   ├── f1_api_client.py   # F1 data with fallbacks
│   ├── what_if_explorer.py # Strategic scenario analysis
│   ├── historical_strategy_detective.py # F1 strategic case studies
│   ├── knowledge_base_pipeline.py # Vector database setup
│   └── requirements.txt   # Python dependencies
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
- **Caching**: AsyncStorage for intelligent data caching
- **Performance**: Optimized Metro bundler configuration

### **Backend & Database**
- **Main Backend**: Supabase (PostgreSQL + Real-time + Auth + Storage)
- **AI Backend**: FastAPI + LangChain + OpenAI GPT-4
- **Authentication**: Supabase Auth (email/password)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Vector Database**: Pinecone for F1 strategic knowledge
- **Storage**: Supabase Storage for photos/videos
- **Real-time**: Supabase Realtime subscriptions
- **AI Tools**: 6 specialized F1 strategic analysis tools
- **Caching**: Smart TTL-based caching with request deduplication

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
- Python 3.8+ (for Paddock AI backend)

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

### **5. Start Paddock AI Backend (Required for F1 features)**
```bash
cd paddock-ai-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### **6. Run Development Server**

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

### **⚡ Performance Testing**
- **Bundle Time**: Notice the improved startup time (5-8 seconds vs previous 20+ seconds)
- **Pit Wall Screen**: Experience instant loading with cached F1 data
- **Pull to Refresh**: Force fresh data loading bypasses cache
- **Offline Experience**: Cached data available even with poor network

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

### **🏁 Pit Wall (F1 Data Feed)**
- **Next Race Information**: Upcoming F1 race details with countdown
- **Latest Results**: Recent race winners and championship standings
- **Smart Loading**: Skeleton screens while data loads
- **Cached Performance**: Instant loading on repeat visits
- **F1.com Integration**: Direct links to official F1 website

### **🤖 Paddock AI Strategic Analysis**
- **Quick Actions**: 6 strategic analysis buttons for instant insights
- **What-If Explorer**: Alternative strategic scenario analysis
- **Historical Detective**: Find similar F1 strategic situations
- **Real-time Data**: Current standings and race information
- **Intelligent Responses**: GPT-4 powered F1 strategic reasoning

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

### **Backend Development**
```bash
# Start Paddock AI backend
cd paddock-ai-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
```

### **Performance Monitoring**
- **Bundle analyzer**: Check bundle size optimizations
- **Cache statistics**: Monitor API cache hit rates in console
- **Network tab**: Verify reduced API call frequency

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

### **✅ Completed (Phase 1-9)**
- Core Snapchat functionality
- Complete Stories system
- Real-time messaging
- User authentication & friends
- Camera integration
- **Paddock AI**: Advanced F1 strategic analysis system
- **What-If Explorer**: Alternative strategic scenario analysis
- **Historical Strategy Detective**: F1 strategic case studies
- **Strategic Quick Actions**: 6 discoverable feature buttons
- **Performance Optimization**: 60%+ bundle time improvement, 70% API call reduction
- **Smart Caching**: TTL-based caching with request deduplication
- **UX Improvements**: Skeleton loading states and progressive rendering

### **🔄 Next Steps (Phase 10)**
- Package version updates for Expo compatibility
- Enhanced Paddock AI with live race data integration
- Mixed conversation support (text + media together)
- Reply functionality with message threading
- Group messaging 
- Push notifications

### **🎯 Future Features**
- **Advanced Paddock AI**: Race Engineer mode, Strategy Builder, Team Principal challenges
- **Live F1 Integration**: Real-time race data, live strategy analysis during GPs
- **AI-Powered Predictions**: Race outcome predictions, strategy recommendations
- F1 team theming and customization
- Race weekend special modes with Paddock AI insights
- Advanced AR filters (helmet overlays)
- Voice messaging (team radio style)
- **Strategic Social Features**: Share strategy analysis, debate scenarios with friends

---

## 🎮 **What to Expect When Using PitSnap**

### **🚀 Performance Experience**
- **Fast Startup**: App loads in 5-8 seconds (previously 20+ seconds)
- **Instant F1 Data**: Cached data loads immediately on repeat visits
- **Smooth Navigation**: No lag between screens with optimized bundle
- **Efficient Data Usage**: Reduced API calls save mobile data

### **🏁 F1 Features**
- **Pit Wall**: Your F1 command center with race data and next GP info
- **Paddock AI**: Ask strategic F1 questions and get expert analysis
- **Real F1 Data**: Current standings, race results, and upcoming events
- **Strategic Insights**: What-if scenarios and historical comparisons

### **📱 Social Experience**
- **Stories**: 24-hour ephemeral content sharing with friends
- **Camera**: Snapchat-style photo/video capture and sharing
- **Messaging**: Disappearing messages with read receipts
- **Friends**: Connect with other F1 and social media enthusiasts

### **🔧 Technical Reliability**
- **Offline Support**: Cached data available without internet
- **Error Handling**: Graceful fallbacks when network is poor
- **Real-time Updates**: Live notifications for messages and stories
- **Secure**: Row-level security for all user data

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
4. **Performance Issues**: Check console logs for cache statistics and API call frequency

---

**🏎️ Built for the love of F1 and social connection - now with blazing fast performance!** 🏁 