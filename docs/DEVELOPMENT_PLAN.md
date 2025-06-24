# PitSnap Development Plan - Snapchat Core First

## 📋 Project Overview
**PitSnap** is a Snapchat-inspired social media app with F1 theming. We're building **core Snapchat functionality first**, then adding F1 magic as differentiators.

**Strategy**: Proven Snapchat features → F1 enhancements → Unique racing community

---

## 🚀 Phase-by-Phase Development

### Phase 1: Foundation Setup ✅ **COMPLETE**
**Status**: ✅ Done  
**Goal**: Basic Expo app with minimal structure

**Deliverables**:
- [x] Expo project with TypeScript
- [x] Supabase connection
- [x] Basic project structure
- [x] Git repository setup

---

### Phase 2: Navigation & UI Foundation ✅ **COMPLETE**
**Status**: ✅ Done  
**Goal**: Core navigation with Snapchat-style tabs

**Deliverables**:
- [x] Bottom tab navigation
- [x] Basic screen structure (Camera, Chats, Profile)
- [x] Minimal F1 theming (red accents, black background)
- [x] Tab icons and navigation flow

---

### Phase 3: Authentication System 🔄 **NEXT**
**Goal**: Core user system like Snapchat

**Core Features**:
- [ ] Email/password signup and login
- [ ] User profile creation
- [ ] Secure token management
- [ ] Protected routes (only authenticated users)
- [ ] Basic user database setup

**Snapchat-like Features**:
- [ ] Username system (@username)
- [ ] Display name + username
- [ ] Basic profile pictures
- [ ] Account settings

**Database Schema**:
```sql
-- Users table (keep simple)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Phase 4: Camera Core 📸 **SNAPCHAT ESSENCE**
**Goal**: Camera-first experience like Snapchat

**Core Features**:
- [ ] **Camera as default tab** (opens to camera)
- [ ] Photo capture with front/back camera
- [ ] Video recording (up to 10 seconds)
- [ ] Basic camera controls (flip, flash, timer)
- [ ] Real-time preview
- [ ] Save to device storage

**Snapchat-like Features**:
- [ ] Tap to capture photo, hold to record video
- [ ] Swipe to switch cameras
- [ ] Gallery access for recent photos
- [ ] Basic editing (crop, rotate)

---

### Phase 5: Friends System 👥 **SOCIAL CORE**
**Goal**: Friend discovery and management like Snapchat

**Core Features**:
- [ ] Add friends by username search
- [ ] Friend requests (send/receive/accept/decline)
- [ ] Friends list management
- [ ] User search and discovery
- [ ] Block/unblock users

**Snapchat-like Features**:
- [ ] Friend suggestions
- [ ] Recently added friends
- [ ] Friend activity indicators
- [ ] Privacy controls (who can add me)

**Database Schema**:
```sql
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
```

---

### Phase 6: Direct Messaging 💬 **EPHEMERAL CORE**
**Goal**: Core Snapchat messaging experience

**Core Features**:
- [ ] Send photos/videos to friends
- [ ] **Ephemeral messages** (disappear after viewing)
- [ ] Text messages between friends
- [ ] Read receipts and opened indicators
- [ ] Screenshot detection and alerts

**Snapchat-like Features**:
- [ ] Swipe to reply
- [ ] Message timer (disappear after X seconds)
- [ ] Replay messages (once per message)
- [ ] Typing indicators
- [ ] Chat history (text only, media disappears)

**Database Schema**:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video')),
  expires_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Phase 7: Stories 📖 **SNAPCHAT SIGNATURE**
**Goal**: 24-hour disappearing stories

**Core Features**:
- [ ] Post photos/videos to your story
- [ ] **24-hour automatic deletion**
- [ ] View friends' stories
- [ ] Story viewers list
- [ ] Story privacy controls

**Snapchat-like Features**:
- [ ] Story ring indicators (new stories)
- [ ] Story progression (tap to advance)
- [ ] Story replies (private messages)
- [ ] Story highlights/saved stories
- [ ] Story screenshots detection

**Database Schema**:
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);
```

---

### Phase 8: Group Chats 👥💬
**Goal**: Multi-person messaging

**Core Features**:
- [ ] Create group chats
- [ ] Add/remove members
- [ ] Group messaging with ephemeral media
- [ ] Group story sharing
- [ ] Group admin controls

---

### Phase 9: Basic AR Filters 🎭
**Goal**: Simple face filters and effects

**Core Features**:
- [ ] Basic face detection
- [ ] Simple overlay filters
- [ ] Color filters and effects
- [ ] Filter library
- [ ] Custom filter creation

---

## 🏎️ **Phase 10+: F1 Magic** (Differentiators)

### Phase 10: F1 Theming & Branding
- [ ] F1 team color themes (user choice)
- [ ] F1-inspired UI elements
- [ ] Racing typography and iconography
- [ ] Team-based friend matching

### Phase 11: F1 AR Filters
- [ ] F1 helmet overlay filters
- [ ] Team-specific AR effects
- [ ] Victory celebration filters
- [ ] Track/circuit backgrounds

### Phase 12: F1 Community Features
- [ ] Team-based group chats
- [ ] Race weekend special modes
- [ ] F1 trivia and polls
- [ ] Driver/team loyalty badges

### Phase 13: Live F1 Integration
- [ ] Race calendar integration
- [ ] Live timing data overlays
- [ ] Race result sharing
- [ ] Automatic race weekend content

---

## 📊 Success Metrics

### Snapchat Core Metrics
- **Daily Active Users**: 1K+ (Phase 7 launch)
- **Story Creation**: 3+ stories per user per week
- **Message Sending**: 10+ messages per user per day
- **Friend Connections**: 5+ friends per user
- **Retention**: 60%+ weekly retention

### F1 Enhancement Metrics
- **Team Engagement**: 70%+ users choose favorite team
- **AR Filter Usage**: 50%+ of content uses F1 filters
- **Community Participation**: 30%+ users join team groups
- **Race Weekend Activity**: 3x higher usage during race weekends

---

## 🎯 **Why This Approach Works**

### ✅ **Advantages**:
1. **Proven Product**: Snapchat's core features are validated
2. **Step-by-Step Testing**: Each phase is independently testable
3. **Clear User Journey**: Users understand Snapchat UX
4. **F1 Differentiation**: Unique features come after core works
5. **Faster MVP**: Core app working sooner

### 🏁 **F1 Advantage**:
- **Passionate Community**: F1 fans are highly engaged
- **Clear Differentiation**: Not just another Snapchat clone
- **Event-Driven Growth**: Race weekends drive usage spikes
- **Global Appeal**: F1 is worldwide sport

---

## 📅 Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1 | Week 1 | ✅ Foundation |
| 2 | Week 2 | ✅ Navigation |
| 3 | Week 3-4 | Authentication |
| 4 | Week 5-6 | Camera Core |
| 5 | Week 7-8 | Friends System |
| 6 | Week 9-10 | Direct Messaging |
| 7 | Week 11-12 | Stories |
| 8 | Week 13-14 | Group Chats |
| 9 | Week 15-16 | Basic AR |
| 10+ | Week 17+ | F1 Magic |

**MVP Launch**: End of Phase 7 (Snapchat core complete)  
**F1 Launch**: End of Phase 13 (Full differentiation)

---

## 🔄 Current Status

**✅ Phase 1-2 Complete**  
**🔄 Phase 3 Next**: Authentication System  

**Ready to build core Snapchat functionality!** 🚀 