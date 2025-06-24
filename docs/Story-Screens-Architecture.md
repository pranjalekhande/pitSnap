# Story Screens Architecture

## 📱 **Dedicated Story Screens Approach**

### ✅ **Why Separate Screens Are Better:**
- **Focused Functionality**: Each screen has one clear purpose
- **Clean Navigation**: Logical flow between story-related screens
- **Easier Maintenance**: Story logic contained in dedicated files
- **Better UX**: Optimized for each story interaction type
- **Scalable**: Easy to add story features without affecting other screens

## 📂 **Screen Breakdown:**

### 1. **StoriesScreen.tsx** (Main Stories Feed)
**Purpose**: Browse and discover friends' stories
**Layout**: Horizontal scrollable story rings + vertical feed
```typescript
interface StoriesScreenProps {
  navigation: NavigationProp<any>;
}

// Key Features:
- Horizontal scroll of friend story rings (red = new, gray = viewed)
- "My Story" ring with add button if no active story
- Story ring thumbnails with friend profile pictures
- Pull to refresh for new stories
- Real-time updates when friends post stories
- Navigate to StoryViewer when ring tapped
```

### 2. **StoryComposerScreen.tsx** (Create Story)
**Purpose**: Create and post new story with media and caption
**Navigation**: Accessed from CameraScreen after capture
```typescript
interface StoryComposerScreenProps {
  route: {
    params: {
      mediaUri: string;
      mediaType: 'image' | 'video';
    };
  };
  navigation: NavigationProp<any>;
}

// Key Features:
- Preview captured media (photo/video)
- Text input for caption (optional)
- "Add to Story" button to post
- "Cancel" to discard
- Loading state while uploading
- Navigate back to StoriesScreen after posting
```

### 3. **StoryViewerScreen.tsx** (Full-Screen Story Viewing)
**Purpose**: View friends' stories in full-screen with progression
**Navigation**: Accessed from StoriesScreen story rings
```typescript
interface StoryViewerScreenProps {
  route: {
    params: {
      stories: Story[]; // Array of stories to view
      initialIndex: number; // Which story to start with
    };
  };
  navigation: NavigationProp<any>;
}

// Key Features:
- Full-screen story display (image/video)
- Progress bars at top (one per story)
- Tap right = next story, tap left = previous story
- Auto-advance after time limit
- Show story creator name and timestamp
- Mark stories as viewed automatically
- Navigate back to StoriesScreen when done
```

### 4. **MyStoriesScreen.tsx** (Own Stories Management)
**Purpose**: View and manage user's own active stories
**Navigation**: Accessed from StoriesScreen "My Story" ring
```typescript
interface MyStoriesScreenProps {
  navigation: NavigationProp<any>;
}

// Key Features:
- List of user's active stories (24h remaining)
- Story analytics: view count, who viewed
- "Delete Story" option for each story
- "Add Another Story" button
- Time remaining display for each story
- Navigate to StoryViewer to preview own stories
```

## 🗺️ **Navigation Flow:**

### **Story Creation Flow:**
```
CameraScreen 
  → (after capture) 
StoryComposerScreen 
  → (after posting) 
StoriesScreen
```

### **Story Viewing Flow:**
```
StoriesScreen 
  → (tap friend ring) 
StoryViewerScreen 
  → (swipe through stories) 
  → (back) StoriesScreen
```

### **Story Management Flow:**
```
StoriesScreen 
  → (tap "My Story") 
MyStoriesScreen 
  → (view analytics, delete stories)
  → (back) StoriesScreen
```

## 🔧 **Integration with Existing Navigation:**

### **Bottom Tab Addition:**
```typescript
// Add Stories tab to bottom navigation
<Tab.Screen 
  name="Stories" 
  component={StoriesScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="book-outline" size={size} color={color} />
    ),
  }}
/>
```

### **Camera Screen Integration:**
```typescript
// Add "Add to Story" option after photo/video capture
const handleAddToStory = () => {
  navigation.navigate('StoryComposer', {
    mediaUri: capturedMedia.uri,
    mediaType: capturedMedia.type,
  });
};
```

## 📊 **Shared Components:**

### **StoryRing.tsx** (Reusable Component)
```typescript
interface StoryRingProps {
  user: User;
  hasNewStories: boolean;
  isMyStory?: boolean;
  onPress: () => void;
}
```

### **StoryProgressBar.tsx** (Reusable Component)
```typescript
interface StoryProgressBarProps {
  stories: Story[];
  currentIndex: number;
  progress: number; // 0-1 for current story
}
```

## 🎯 **Implementation Priority:**

### **Phase 1: Core Story Screens**
1. ✅ StoriesScreen (basic feed)
2. ✅ StoryComposerScreen (create story)
3. ✅ StoryViewerScreen (view stories)

### **Phase 2: Enhanced Features**
1. ✅ MyStoriesScreen (story management)
2. ✅ Story analytics and viewers
3. ✅ Real-time story updates

## 📱 **UI/UX Benefits:**

### **Clean User Experience:**
- Each screen optimized for its specific task
- Consistent navigation patterns
- No cluttered multi-purpose screens
- Clear visual hierarchy

### **Performance Benefits:**
- Lazy loading: only load story data when on Stories screens
- Memory management: unload story media when not viewing
- Optimized for story-specific interactions (swipe, tap, progress)

## 🚀 **Ready for Implementation:**

This architecture gives us:
- ✅ **Clear separation of concerns**
- ✅ **Scalable story features**
- ✅ **Optimized user experience**
- ✅ **Easy to test and maintain**

**Next Step**: Implement Phase 1 starting with StoriesScreen.tsx as the foundation. 