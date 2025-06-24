# PitSnap - Product Requirements Document & Brainstorming

**Product Name:** PitSnap  
**Product Type:** F1-Themed Ephemeral Social Media Mobile App  
**Target Platform:** iOS & Android (React Native)  
**Version:** 1.0 MVP  
**Date:** December 2024  

---

## 🏁 Executive Summary

PitSnap is an F1-themed ephemeral social media app that combines real-time photo/video sharing with AR filters, live timing data, and community features. Think Snapchat meets Formula 1 - where fans can share race moments that disappear, connect with other fans, and enhance their F1 experience with AR overlays and live data integration.

---

## 🎯 Product Vision & Goals

### Vision Statement
To create the ultimate social platform for F1 fans to share authentic, ephemeral race moments while building a passionate community around the sport.

### Primary Goals
- **Engagement**: Increase F1 fan engagement during race weekends
- **Community**: Build tight-knit communities around teams and drivers
- **Real-time**: Provide live, contextual information overlays
- **Ephemeral**: Create authentic, pressure-free sharing experiences
- **AR/Filters**: Enhance photos/videos with F1-themed effects

### Success Metrics
- Daily Active Users (DAU) during race weekends
- Snaps shared per race weekend
- User retention rate across racing season
- Team/driver community participation rates
- AR filter usage and engagement

---

## 👥 Target Audience

### Primary Users
- **Passionate F1 Fans (Ages 18-35)**
  - Watch races regularly
  - Active on social media
  - Engage with F1 content and communities
  - Tech-savvy mobile users

### Secondary Users
- **Casual F1 Viewers (Ages 25-45)**
  - Watch occasional races
  - Interested in major F1 events
  - Share sports content occasionally

### User Personas
**"Race Weekend Riley" (Primary)**
- Age: 24, Marketing Professional
- Watches every race, follows F1 news daily
- Creates content for Instagram/TikTok
- Values authentic, in-the-moment sharing
- Wants to connect with other fans

**"Grand Prix Gary" (Secondary)**
- Age: 32, Software Engineer
- Watches major races (Monaco, Silverstone, etc.)
- Shares sports content occasionally
- Interested in tech/data aspects of F1

---

## 🚀 Core Features & Use Cases

### 1. Real-Time Photo/Video Sharing (Disappearing Snaps)

#### Race-Moment Snaps
- **Feature**: Capture and share photos/videos that self-destruct after viewing
- **Duration**: 2-10 seconds viewing time
- **Use Case**: Share TV screen shots, trackside views, reaction videos
- **Technical**: Auto-deletion after view, screenshot detection

#### Live-Timing Overlay
- **Feature**: Automatically superimpose live F1 timing data onto snaps
- **Data**: Gap to leader, sector times, lap times, positions
- **Integration**: F1 API or live timing feeds
- **Customization**: Toggle data elements on/off

#### Victory Lap Mode
- **Feature**: 5-second highlight reel that loops once before disappearing
- **Use Case**: Capture winning moments, podium celebrations
- **Enhancement**: Auto-generate from multiple snaps during race end

### 2. AR Filters & Camera Effects

#### Helmet Visor Overlay
- **Feature**: Face-tracking AR that overlays driver helmets on user faces
- **Drivers**: All current F1 drivers' helmet designs
- **Technology**: Face detection + 3D helmet models
- **Customization**: Adjust helmet size, position, opacity

#### Checkered Flag Frame
- **Feature**: World-lens effect scattering animated checkered flags
- **Trigger**: Manual activation or race finish detection
- **Animation**: Flags fall from top of screen with physics

#### Podium Confetti
- **Feature**: Confetti effect triggered by text recognition
- **Trigger**: Keywords like "podium", "winner", "victory"
- **Visual**: Gold, silver, bronze confetti matching podium colors

#### Track Map Backgrounds
- **Feature**: Replace background with 3D circuit renders
- **Tracks**: All current F1 calendar circuits
- **Quality**: High-resolution 3D models with proper lighting

### 3. User Authentication & Friend Management

#### Team-Tag Signup
- **Feature**: Onboarding flow for team/driver preference selection
- **Purpose**: Auto-join relevant fan communities
- **Data**: Used for content personalization and friend suggestions

#### Snapcode + Fandom QR
- **Feature**: Unique QR codes embedding team/driver preferences
- **Functionality**: One-tap friend additions with shared interests
- **Design**: F1-themed QR code styling

#### Mutual-Race Suggestions
- **Feature**: Friend suggestions based on shared race attendance/viewing
- **Logic**: Users who snapped at same GP events
- **Privacy**: Opt-in location sharing required

### 4. Stories & Group Messaging

#### My Race Weekend Story
- **Feature**: Auto-compile all weekend snaps into single story
- **Duration**: Friday practice through Sunday race
- **Sharing**: Public story visible to friends for 24h

#### Team Chat Rooms
- **Feature**: Group DMs organized by F1 teams
- **Functionality**: Ephemeral voice notes, GIF reactions
- **Moderation**: Community guidelines enforcement

#### Race-Day Poll Stories
- **Feature**: Built-in polling stickers for race predictions
- **Types**: Race winner, fastest lap, safety car predictions
- **Results**: Real-time animated results during/after race

### 5. Core Social Features

#### Race-Day Streaks
- **Feature**: Track consecutive GPs with user snaps
- **Rewards**: Trophy emojis at 5, 10, 20 race milestones
- **Display**: Profile badge and leaderboard integration

#### Snap Map → Track Map
- **Feature**: Interactive world map showing live circuit locations
- **Functionality**: View public snaps by tapping circuit locations
- **Privacy**: Location sharing controls

#### Screenshot Alerts
- **Feature**: Notifications for screenshot attempts on exclusive content
- **Use Case**: Protect pit-lane access, insider content
- **Implementation**: Native screenshot detection APIs

#### Discover Channels
- **Feature**: Curated live-feed channels for F1 content
- **Content**: Pre-race analysis, onboard clips, post-race interviews
- **Curation**: Mix of official F1 content and community highlights

---

## 🧠 Brainstorming Ideas & Future Features

### Phase 2 Enhancements

#### AI-Powered Features
- **Smart Captions**: AI-generated captions based on image content and F1 context
- **Driver Recognition**: Auto-tag drivers in photos using computer vision
- **Race Moment Detection**: AI identifies key race moments for auto-highlights
- **Personalized Content**: RAG-powered content recommendations
- **Predictive Timing**: AI predicts lap times and race outcomes
- **Voice Commands**: "Hey PitSnap, show me Hamilton's sector times"

#### Advanced AR Experiences
- **Virtual Garage**: AR experience to explore F1 cars in 3D
- **Track Walk**: AR overlay showing racing line on real tracks
- **Speed Visualization**: AR speedometer overlay for go-karting/driving
- **Weather Effects**: AR rain/sun effects matching race conditions
- **Holographic Drivers**: AR avatars of drivers for photos
- **Car Setup Visualization**: AR overlay showing aerodynamic elements

#### Community & Gamification
- **Fantasy Integration**: Connect with F1 fantasy leagues
- **Prediction Leaderboards**: Season-long prediction accuracy tracking
- **Fan Badges**: Achievement system for various activities
- **Team Loyalty Points**: Reward consistent team support
- **Constructor Championships**: User competitions mirroring F1 structure
- **Daily Challenges**: F1-themed photo/video challenges

#### Live Experience Integration
- **Trackside Mode**: Enhanced features for users at live races
- **Audio Sync**: Sync snaps with live race audio/commentary
- **Multi-View Stories**: Combine multiple users' perspectives of same moment
- **VIP Access**: Special content from paddock/pit lane access
- **Crowd Sentiment**: Real-time mood tracking during races
- **Weather Integration**: Live weather overlays for trackside users

### Creative Feature Ideas

#### "Pit Stop Timer"
- Time users performing everyday tasks with F1 pit stop overlays
- Leaderboards for fastest "coffee prep" or "morning routine"
- Team-themed timer animations (Red Bull, Mercedes styling)

#### "Driver's Eye View"
- First-person AR filter simulating onboard camera perspective
- Include HUD elements like speed, gear, DRS status
- Different views for different tracks

#### "Team Radio"
- Voice message feature with F1 team radio styling
- Add radio static effects and team-specific sound profiles
- "Bleep" out messages like real F1 censoring

#### "Grid Walk"
- Pre-race feature where users can "walk" virtual grid
- Interview other users with reporter-style AR overlays
- Martin Brundle-style commentary generation

#### "Podium Ceremony"
- AR recreation of podium celebrations
- Users can stand on virtual podiums with trophies
- National anthem audio integration

#### "Safety Car Mode"
- Special yellow-themed UI during actual safety car periods
- Encourage fans to share "waiting" moments
- Countdown timer to green flag

### Wild & Experimental Ideas

#### "Time Attack Mode"
- Photo challenges with limited time (like qualifying sessions)
- Fastest to capture specific F1-related items wins points
- Seasonal leaderboards with real prizes

#### "Telemetry Sync"
- Sync user heart rate with race excitement levels
- Share biometric data during thrilling race moments
- Compare fan excitement across different races

#### "Virtual Paddock Club"
- Premium AR experience simulating VIP access
- Exclusive content and interactions
- Meet other "VIP" users in virtual space

#### "Racing Line Detection"
- Use AI to analyze user's driving videos (go-kart, sim racing)
- Overlay optimal racing line suggestions
- Compare to real F1 driver lines

#### "Crash Analysis Mode"
- Educational feature breaking down racing incidents
- User-generated analysis and discussions
- Safety education through gamification

### Integration Opportunities

#### Cross-Platform Features
- **F1 TV Pro Sync**: Watch parties with synchronized reactions
- **Official F1 App**: Deep-link integration for stats and news
- **Social Media Cross-Post**: Auto-share highlights to other platforms
- **Calendar Integration**: Race reminders and session notifications
- **Spotify Integration**: Race-themed playlists and audio sync
- **Gaming Integration**: Connect with F1 game achievements

#### Brand Partnership Ideas
- **Team-Specific Filters**: Official team AR content
- **Driver Collaborations**: Personal content from drivers
- **Sponsor Integration**: Tasteful brand placement in AR effects
- **Automotive Partners**: Car manufacturer-themed content
- **Fashion Brands**: F1-inspired clothing try-on filters
- **Energy Drink Partners**: Special effects and animations

#### Data Integration Possibilities
- **Weather APIs**: Real-time track condition overlays
- **Timing Services**: Live sector and lap time data
- **News APIs**: Breaking F1 news integration
- **Stats Services**: Historical data and comparisons
- **Travel APIs**: Race weekend travel planning integration
- **Ticketing**: Direct links to race ticket purchases

---

## 📱 Technical Architecture

### Frontend Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **UI**: NativeWind + React Native Paper
- **State**: Zustand
- **Navigation**: React Navigation
- **Camera/AR**: expo-camera, react-native-vision-camera, expo-gl

### Backend & Services
- **Auth**: Supabase Auth
- **Database**: PostgreSQL (Supabase)
- **Realtime**: Supabase Realtime
- **Storage**: Supabase Storage with auto-expiry
- **Functions**: Supabase Edge Functions (Deno)
- **AI/RAG**: OpenAI GPT-4 API + Pinecone/Supabase Vector

### External Integrations
- **F1 Data**: Official F1 API or third-party timing services
- **Push**: Firebase Cloud Messaging
- **Analytics**: Mixpanel or Amplitude
- **Error Tracking**: Sentry

---

## 🎨 Design Principles

### Visual Design
- **F1 Aesthetic**: Racing-inspired UI with speed lines, checkered patterns
- **Team Colors**: Dynamic theming based on user's favorite team
- **Typography**: Modern, bold fonts reflecting F1's premium feel
- **Iconography**: Custom F1-themed icons (helmets, flags, trophies)

### User Experience
- **Speed First**: Quick loading, instant capture, minimal friction
- **Authentic Moments**: Encourage genuine, unpolished content
- **Community Focus**: Easy discovery and connection with other fans
- **Privacy Aware**: Clear controls for sharing and data usage

---

## 🗓️ Development Roadmap

### Phase 1: MVP (Months 1-3)
- Core photo/video sharing with basic filters
- User authentication and basic profiles
- Simple chat functionality
- Basic AR helmet overlay
- Team selection and basic communities

### Phase 2: Enhanced Features (Months 4-6)
- Live timing data integration
- Advanced AR filters and effects
- Stories and weekend compilation
- Snap Map with location features
- Push notifications and engagement features

### Phase 3: AI & Advanced Social (Months 7-9)
- RAG-powered content generation
- Advanced community features
- Prediction and polling systems
- Analytics and personalization
- Performance optimization

### Phase 4: Scale & Monetization (Months 10-12)
- Premium features and subscriptions
- Brand partnerships with F1 teams
- Advanced analytics and insights
- International expansion
- Platform integrations

---

## 🎯 Success Criteria & KPIs

### User Engagement
- **Daily Active Users**: 10K+ during race weekends by end of season
- **Snaps per User**: Average 5+ snaps per race weekend
- **Session Duration**: 15+ minutes during race periods
- **Retention**: 60%+ weekly retention rate

### Feature Adoption
- **AR Filter Usage**: 70%+ of snaps use at least one filter
- **Community Participation**: 40%+ users join team communities
- **Story Creation**: 30%+ users create weekend stories
- **Friend Connections**: Average 20+ friends per active user

### Technical Performance
- **App Store Rating**: 4.5+ stars across platforms
- **Crash Rate**: <1% of sessions
- **Load Time**: <3 seconds for core features
- **Data Usage**: Optimized for mobile data consumption

---

## 🚀 Launch Strategy

### Pre-Launch
1. **Alpha Testing**: Internal team and F1 fan beta testers
2. **Community Building**: Engage F1 social media communities
3. **Content Creation**: Develop initial AR filters and effects
4. **Partnership Outreach**: Connect with F1 influencers and fan accounts

### Launch
1. **Soft Launch**: Release during off-season for testing
2. **Race Weekend Beta**: Limited users during early season races
3. **Full Launch**: Major marketing push before high-profile GP (Monaco/Silverstone)
4. **Influencer Campaign**: Partner with F1 content creators for authentic promotion

### Post-Launch
1. **Community Management**: Active engagement and support
2. **Feature Iteration**: Rapid iteration based on user feedback
3. **Content Updates**: Regular new filters and effects
4. **Seasonal Events**: Special features for major F1 events

---

## 💡 Monetization Strategy (Future Phases)

### Premium Features
- **Exclusive Filters**: Premium AR effects and team-specific content
- **Extended Storage**: Longer story duration and archive access
- **Advanced Analytics**: Personal stats and engagement insights
- **Priority Support**: Enhanced customer service

### Brand Partnerships
- **Team Sponsorships**: Official team filters and exclusive content
- **Driver Collaborations**: Personal driver content and appearances
- **F1 Official**: Partnership for exclusive timing data and content
- **Automotive Brands**: Sponsored filters and branded content

### In-App Purchases
- **Custom Filters**: User-generated or commissioned AR effects
- **Collectible Items**: Digital trading cards or memorabilia
- **Event Access**: Premium content from live race events
- **Gift Features**: Send premium content to friends

---

This comprehensive PRD serves as the foundation for building PitSnap into the ultimate F1 fan social platform, combining cutting-edge technology with authentic community experiences. 