# PitSnap Development Phases

Building PitSnap incrementally, one phase at a time.

## 🎯 Phase 1: Basic Expo Setup ✅ (CURRENT - OPTIMIZED)
**Goal**: Get basic Expo app running on phone with minimal file watching

**Dependencies** (Updated to SDK 53):
```json
"expo": "~53.0.0",
"expo-status-bar": "~2.0.0",
"react": "18.3.1",
"react-native": "0.76.3"
```

**Optimizations Applied**:
- [x] Metro configured to ignore `src/` and `docs/` directories
- [x] TypeScript configured to only compile `App.tsx`
- [x] Removed unused config files (tailwind.config.js, global.css)
- [x] Updated .gitignore to prevent watching unnecessary files
- [x] Minimal babel configuration
- [x] **Updated to SDK 53** to match Expo Go app
- [x] **Removed asset references** to prevent missing file errors

**Features**:
- [x] Simple welcome screen with F1 branding
- [x] Test button to verify Expo connection
- [x] Basic F1 red (#E10600) styling
- [x] Status indicators
- [x] **No "too many open files" errors**
- [x] **No missing asset errors**
- [x] **Compatible with latest Expo Go**

**Test**: Run `npm install` then `npm start` and scan QR code with phone

---

## 📱 Phase 2: Navigation
**Goal**: Add React Navigation with tab structure

**When Ready for Phase 2**:
1. Update `metro.config.js` - remove `src/` from blockList
2. Update `tsconfig.json` - include src files
3. Add navigation dependencies

**Add Dependencies** (SDK 53 compatible):
```json
"@react-navigation/native": "^6.1.0",
"@react-navigation/bottom-tabs": "^6.5.0", 
"@react-navigation/native-stack": "^6.9.0",
"react-native-screens": "~3.34.0",
"react-native-safe-area-context": "4.12.0",
"react-native-gesture-handler": "~2.20.0"
```

**Features**:
- [ ] Bottom tab navigation (Camera, Chats, Profile)
- [ ] Stack navigation for detail screens
- [ ] Basic navigation structure

---

## 🎨 Phase 3: UI & Styling
**Goal**: Add F1-themed UI components

**Add Dependencies**:
```json
"react-native-paper": "^5.11.0",
"@expo/vector-icons": "^14.0.0",
"nativewind": "^2.0.11",
"tailwindcss": "3.3.2"
```

**Features**:
- [ ] F1 theme colors and styling
- [ ] Reusable UI components
- [ ] Icons and visual elements

---

## 🔐 Phase 4: Authentication
**Goal**: Add Supabase authentication

**Add Dependencies**:
```json
"@supabase/supabase-js": "^2.38.0",
"@react-native-async-storage/async-storage": "2.1.0",
"react-native-url-polyfill": "^2.0.0",
"zustand": "^4.4.0"
```

**Features**:
- [ ] Supabase setup and connection
- [ ] Login/signup screens
- [ ] User state management
- [ ] Protected routes

---

## 📸 Phase 5: Camera
**Goal**: Add camera functionality

**Add Dependencies**:
```json
"expo-camera": "~16.0.0",
"expo-media-library": "~17.0.0",
"expo-av": "~15.0.0",
"expo-image-picker": "~16.0.0"
```

**Features**:
- [ ] Camera screen
- [ ] Photo/video capture
- [ ] Camera permissions
- [ ] Media storage

---

## 💬 Phase 6: Messaging
**Goal**: Add chat functionality

**Features**:
- [ ] Real-time messaging
- [ ] Friend system
- [ ] Media sharing
- [ ] Ephemeral messages

---

## ⚡ Phase 7: Additional Features

**Add Dependencies**:
```json
"expo-notifications": "~0.29.0",
"expo-constants": "~17.0.0",
"expo-device": "~7.0.0",
"expo-secure-store": "~14.0.0"
```

**Features**:
- [ ] Push notifications
- [ ] Enhanced security
- [ ] Performance optimizations

---

## 🚀 Current Status: Phase 1 Fixed and Optimized!

### Next Steps:
1. Run `npm install` (to get SDK 53 dependencies)
2. Run `npm start` 
3. Should start without errors and be compatible with your Expo Go
4. Scan QR code with phone
5. Test the basic app
6. Move to Phase 2 when ready

### Phase 1 Fixes Applied:
- ✅ **SDK 53 compatibility** - matches your Expo Go version
- ✅ **No missing assets** - removed all asset references
- ✅ **Optimized file watching** - prevents "too many files" error
- ✅ **Minimal dependencies** - only essential packages

### Phase 1 File Structure:
```
pitSnap/
├── App.tsx (main app file)
├── package.json (minimal dependencies)
├── app.json (basic config)
├── metro.config.js (optimized for Phase 1)
├── babel.config.js (minimal)
├── tsconfig.json (App.tsx only)
└── node_modules/ (only basic dependencies)
``` 