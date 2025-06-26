# PitSnap - F1-Themed Social Media App

> **🚀 LIVE DEMO**: `exp://v7xfdne-pranjalekhande-8081.exp.direct`
> 
> **📱 How to Test**: Download [Expo Go](https://expo.dev/client) app and scan the QR code or paste the link above

## 📋 Project Overview

PitSnap is a **Snapchat-inspired social media app** with F1 theming, featuring ephemeral messaging, 24-hour stories, real-time chat, and camera functionality. Built with React Native, Expo, and Supabase.

### ✅ **Current Features (85% Complete)**
- 🔐 **User Authentication** - Login/Signup with Supabase Auth
- 📸 **Camera System** - Photo/video capture with front/back camera
- 💬 **Real-time Messaging** - Text + media messages with read receipts  
- 📖 **24-Hour Stories** - Complete Stories system with view tracking
- 👥 **Friends System** - Add friends, manage connections
- ⏱️ **Ephemeral Content** - Messages disappear after viewing
- 🎨 **F1 Theming** - Racing-inspired UI with red/black color scheme
- 🤖 **Paddock AI** - Advanced F1 strategic analysis and chatbot

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
In `services/paddockAiService.ts`:
```typescript
// For iOS Simulator:
const API_URL = "http://127.0.0.1:8000";

// For Physical Device:
const API_URL = "http://YOUR_LOCAL_IP:8000";
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
│   ├── profile/            # User profiles
│   └── stories/            # Stories system (4 screens)
├── services/               # Backend service layers
│   ├── messagesService.ts  # Chat & messaging logic
│   ├── storiesService.ts   # Stories CRUD operations
│   ├── friendsService.ts   # Friend management
│   ├── paddockAiService.ts # Paddock AI communication
│   └── mediaService.ts     # File upload/storage
├── components/             # Reusable components
│   └── paddock/            # Paddock AI UI components
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Authentication state
├── navigation/             # App navigation
│   ├── AppNavigation.tsx   # Main tab navigation
│   └── AuthNavigator.tsx   # Auth flow navigation
├── lib/                    # Configuration
│   └── supabase.ts        # Supabase client setup
├── paddock-ai-backend/     # F1 Strategic Analysis Backend
│   ├── main.py            # FastAPI + LangChain agent
│   ├── f1_api_client.py   # F1 data with fallbacks
│   ├── what_if_explorer.py # Strategic scenario analysis
│   ├── historical_strategy_detective.py # F1 case studies
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

### **Backend & Database**
- **Main Backend**: Supabase (PostgreSQL + Real-time + Auth + Storage)
- **AI Backend**: FastAPI + LangChain + OpenAI GPT-4
- **Authentication**: Supabase Auth (email/password)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Vector Database**: Pinecone for F1 strategic knowledge
- **Storage**: Supabase Storage for photos/videos
- **Real-time**: Supabase Realtime subscriptions
- **AI Tools**: 6 specialized F1 strategic analysis tools

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

### **✅ Completed (Phase 1-8)**
- Core Snapchat functionality
- Complete Stories system
- Real-time messaging
- User authentication & friends
- Camera integration
- **Paddock AI**: Advanced F1 strategic analysis system
- **What-If Explorer**: Alternative strategic scenario analysis
- **Historical Strategy Detective**: F1 strategic case studies
- **Strategic Quick Actions**: 6 discoverable feature buttons

### **🔄 Next Steps (Phase 9)**
- Enhanced Paddock AI with live race data integration
- Mixed conversation support (text + media together)
- Reply functionality with message threading
- Group messaging 
- Push notifications
- Basic AR filters with F1 theming

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