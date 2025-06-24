# Stories & Group Messaging - Implementation Plan

## 📋 Current State Analysis

### ✅ **What We Have:**
- **Database**: Users, Friends, Messages tables with RLS
- **Services**: messagesService, friendsService, mediaService
- **Auth**: Supabase auth with user management
- **Chat**: Individual messaging with text/media support
- **Media**: Photo/video capture and upload to Supabase Storage
- **Friends**: Add/accept/decline friend system

### 📊 **Current Schema Summary:**
```sql
-- Current Tables
users (id, email, display_name, avatar_url, created_at, updated_at)
friends (id, user_id, friend_id, status, created_at)
messages (id, sender_id, recipient_id, content, media_url, message_type, expires_at, read_at, created_at)
```

---

## 🎬 **STORIES FEATURE PLANNING**

### 🎯 **Core Requirements:**
- 24-hour auto-delete functionality
- All friends can see stories
- Multi-media support (photos/videos)
- View tracking (who viewed your story)
- Privacy controls
- Story progression (tap to advance)

### 📊 **Database Schema Changes for Stories:**

```sql
-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story views tracking
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Indexes for performance
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);

-- RLS Policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies - friends can view stories
CREATE POLICY "Users can view friends' stories" ON stories
  FOR SELECT USING (
    user_id = auth.uid() OR -- Own stories
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (user_id = auth.uid() AND friend_id = stories.user_id AND status = 'accepted')
         OR (friend_id = auth.uid() AND user_id = stories.user_id AND status = 'accepted')
    )
  );

CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can view story views for own stories" ON story_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can record story views" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);
```

### 🔧 **Stories Service Layer (storiesService.ts):**

```typescript
export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  expires_at: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  viewers?: StoryView[];
  has_viewed?: boolean; // For current user
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

// Key Functions:
- createStory(mediaUrl: string, mediaType: 'image' | 'video', caption?: string)
- getFriendsStories(): Promise<Story[]> // Stories from friends
- getMyStories(): Promise<Story[]> // Current user's stories
- viewStory(storyId: string): Promise<boolean> // Mark as viewed
- getStoryViewers(storyId: string): Promise<StoryView[]>
- deleteStory(storyId: string): Promise<boolean>
- cleanupExpiredStories(): Promise<number> // Cron job function
- subscribeToStories(onNewStory: (story: Story) => void)
- isStoryExpired(story: Story): boolean
```

### 📱 **Stories UI Workflow:**

#### **Story Creation Flow:**
1. **Camera Screen** → "Add to Story" button after capture
2. **Story Composer** → Add caption, preview, post
3. **Confirmation** → "Story posted" feedback

#### **Story Viewing Flow:**
1. **Stories Feed** → Horizontal scroll of friend story rings
2. **Story Viewer** → Full-screen story progression
3. **Story Progress** → Top progress bars, tap to advance
4. **Story Details** → Viewers list for own stories

#### **Story Management Flow:**
1. **My Stories** → View own active stories
2. **Story Analytics** → See who viewed
3. **Delete Stories** → Manual removal option

---

## 👥 **GROUP MESSAGING PLANNING**

### 🎯 **Core Requirements:**
- Create groups with multiple friends
- Group admin controls (add/remove members)
- Group messaging with ephemeral media
- Group name and avatar
- Leave group functionality
- Group stories sharing

### 📊 **Database Schema Changes for Groups:**

```sql
-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group messages table (extends current messages)
-- Option 1: Extend messages table
ALTER TABLE messages ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT messages_recipient_or_group_check 
  CHECK ((recipient_id IS NOT NULL AND group_id IS NULL) OR (recipient_id IS NULL AND group_id IS NOT NULL));

-- Indexes
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_messages_group_id ON messages(group_id);

-- RLS Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups policies - only members can see group
CREATE POLICY "Users can view groups they're members of" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group members policies
CREATE POLICY "Users can view group members for their groups" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage group members" ON group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Update messages policies for groups
DROP POLICY "Users can view own messages" ON messages;
CREATE POLICY "Users can view accessible messages" ON messages
  FOR SELECT USING (
    (auth.uid() = sender_id OR auth.uid() = recipient_id) OR -- Direct messages
    (group_id IS NOT NULL AND EXISTS ( -- Group messages
      SELECT 1 FROM group_members 
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    ))
  );
```

### 🔧 **Groups Service Layer (groupsService.ts):**

```typescript
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  members?: GroupMember[];
  member_count?: number;
  last_message?: Message;
  creator?: User;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: User;
}

// Key Functions:
- createGroup(name: string, description?: string, memberIds: string[])
- getMyGroups(): Promise<Group[]>
- getGroupDetails(groupId: string): Promise<Group | null>
- addMembersToGroup(groupId: string, memberIds: string[])
- removeMemberFromGroup(groupId: string, memberId: string)
- leaveGroup(groupId: string): Promise<boolean>
- updateGroup(groupId: string, updates: Partial<Group>)
- deleteGroup(groupId: string): Promise<boolean>
- getUserRole(groupId: string): Promise<'admin' | 'member' | null>
```

### 📱 **Group Messaging UI Workflow:**

#### **Group Creation Flow:**
1. **Chats Screen** → "New Group" button
2. **Select Friends** → Multi-select from friends list
3. **Group Setup** → Name, description, avatar
4. **Group Created** → Navigate to group chat

#### **Group Chat Flow:**
1. **Group Chat Screen** → Similar to individual chat but with member avatars
2. **Group Info** → Tap header to see members, settings
3. **Group Management** → Add/remove members, change name (admins only)
4. **Leave Group** → Leave option for members

#### **Group Stories Flow:**
1. **Share to Groups** → Option when posting story
2. **Group Stories Feed** → Separate section for group stories
3. **Group Story Viewers** → See all group members who viewed

---

## 🗓️ **IMPLEMENTATION PRIORITY & PHASES**

### **Phase 8A: Stories Foundation (Week 1-2)**
**Recommended Priority**: HIGH - Core Snapchat feature
1. Database schema for stories and story_views
2. storiesService.ts with core functions
3. Story creation flow (camera → story composer)
4. Basic stories feed (horizontal scroll)
5. Story viewer (full-screen, tap to advance)
6. 24-hour auto-cleanup functionality

### **Phase 9A: Group Messaging Foundation (Week 3-4)**
**Priority**: HIGH - Multi-user engagement
1. Database schema for groups and group_members
2. groupsService.ts with core functions
3. Group creation flow
4. Group chat functionality
5. Group member management

## 💭 **QUESTIONS FOR DECISION:**

1. **Stories vs Groups Priority**: Which feature to build first?
2. **Group Size Limits**: Maximum members per group?
3. **Story Privacy**: Public stories or friends-only?
4. **Media Limits**: File size/duration limits for stories?

**Recommendation**: Start with **Stories** - simpler to implement, more engaging, core Snapchat differentiator. 