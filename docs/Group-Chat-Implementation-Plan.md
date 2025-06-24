# Group Chat Implementation Plan

## Overview
Now that the camera system is stable, we can focus on implementing group chat functionality. This will allow users to create groups, send messages/media to multiple friends at once, and manage group conversations.

## Current State Analysis

### Existing Infrastructure ✅
- Individual messaging system working
- Friend system implemented
- Media sharing to individual friends
- Supabase backend with user authentication
- Message storage and retrieval

### What We Need to Build 🔄
- Group creation and management
- Group messaging system
- Group member management
- Group media sharing
- Group chat UI components

## Database Schema Changes

### New Tables Needed

#### 1. Groups Table
```sql
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true
);
```

#### 2. Group Members Table
```sql
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(group_id, user_id)
);
```

#### 3. Group Messages Table
```sql
CREATE TABLE group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);
```

### Database Migration Script
```sql
-- Add to pitsnap-schema.sql or create new migration
-- Groups and group messaging tables
-- (Include the CREATE TABLE statements above)

-- Add RLS policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view groups they're members of" ON groups FOR SELECT
USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can create groups" ON groups FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Group members policies
CREATE POLICY "Users can view group members of their groups" ON group_members FOR SELECT
USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND is_active = true));

-- Group messages policies
CREATE POLICY "Users can view messages from their groups" ON group_messages FOR SELECT
USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can send messages to their groups" ON group_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND is_active = true)
);
```

## Service Layer Implementation

### 1. Group Service (`services/groupsService.ts`)
```typescript
export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  is_active: boolean;
  member_count?: number;
  last_message?: GroupMessage;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  is_active: boolean;
  user?: User; // Joined user data
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  expires_at?: string;
  created_at: string;
  is_deleted: boolean;
  sender?: User; // Joined sender data
}

// Service functions
export async function createGroup(name: string, description?: string): Promise<Group>;
export async function getUserGroups(): Promise<Group[]>;
export async function getGroupMembers(groupId: string): Promise<GroupMember[]>;
export async function addGroupMember(groupId: string, userId: string): Promise<void>;
export async function removeGroupMember(groupId: string, userId: string): Promise<void>;
export async function leaveGroup(groupId: string): Promise<void>;
export async function updateGroup(groupId: string, updates: Partial<Group>): Promise<Group>;
```

### 2. Group Messages Service (`services/groupMessagesService.ts`)
```typescript
export async function sendGroupMessage(
  groupId: string,
  content?: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
  expiresInHours?: number
): Promise<GroupMessage>;

export async function getGroupMessages(
  groupId: string,
  limit: number = 50,
  offset: number = 0
): Promise<GroupMessage[]>;

export async function deleteGroupMessage(messageId: string): Promise<void>;

export async function markGroupMessagesAsRead(groupId: string): Promise<void>;
```

## UI Components Implementation

### Phase 1: Core Components

#### 1. Group List Screen (`screens/chat/GroupListScreen.tsx`)
- Display user's groups
- Create new group button
- Search groups
- Show last message preview
- Unread message indicators

#### 2. Group Chat Screen (`screens/chat/GroupChatScreen.tsx`)
- Group message list
- Send text messages
- Send media (photos/videos from camera)
- Group info header
- Member list access

#### 3. Group Creation Screen (`screens/chat/CreateGroupScreen.tsx`)
- Group name input
- Group description input
- Friend selection for initial members
- Create group action

#### 4. Group Info Screen (`screens/chat/GroupInfoScreen.tsx`)
- Group details
- Member list with roles
- Add/remove members
- Leave group option
- Group settings

### Phase 2: Enhanced Components

#### 1. Group Member Selection (`components/chat/GroupMemberSelector.tsx`)
- Friend list with selection
- Search functionality
- Role assignment (admin/member)
- Bulk selection

#### 2. Group Message Bubble (`components/chat/GroupMessageBubble.tsx`)
- Sender name display
- Message content
- Media preview
- Timestamp
- Expiration indicator

#### 3. Group Media Sharing (`components/chat/GroupMediaShare.tsx`)
- Integration with camera
- Group selection for media
- Batch sending to multiple groups

## Navigation Updates

### Add Group Chat Routes
```typescript
// In navigation/AppNavigation.tsx
const ChatStack = createStackNavigator();

function ChatNavigator() {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen name="ChatList" component={ChatScreen} />
      <ChatStack.Screen name="IndividualChat" component={IndividualChatScreen} />
      {/* New Group Chat Screens */}
      <ChatStack.Screen name="GroupList" component={GroupListScreen} />
      <ChatStack.Screen name="GroupChat" component={GroupChatScreen} />
      <ChatStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <ChatStack.Screen name="GroupInfo" component={GroupInfoScreen} />
    </ChatStack.Navigator>
  );
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. **Database Setup**
   - [ ] Create migration script with new tables
   - [ ] Set up RLS policies
   - [ ] Test database schema

2. **Basic Services**
   - [ ] Implement `groupsService.ts`
   - [ ] Implement `groupMessagesService.ts`
   - [ ] Add TypeScript interfaces

3. **Core UI**
   - [ ] Create `GroupListScreen`
   - [ ] Create `CreateGroupScreen`
   - [ ] Basic navigation setup

### Phase 2: Messaging (Week 2)
1. **Group Chat Functionality**
   - [ ] Implement `GroupChatScreen`
   - [ ] Text messaging in groups
   - [ ] Message history loading

2. **Member Management**
   - [ ] Add members to groups
   - [ ] Remove members
   - [ ] Role management (admin/member)

### Phase 3: Media Integration (Week 3)
1. **Camera Integration**
   - [ ] Send photos to groups
   - [ ] Send videos to groups
   - [ ] Group selection in camera sharing flow

### Phase 4: Polish (Week 4)
1. **UI/UX Improvements**
   - [ ] Message bubbles with sender names
   - [ ] Unread message indicators
   - [ ] Group avatars

## Next Steps

**Immediate Action**: Begin Phase 1 database setup
**Timeline**: 4 weeks for full implementation
**Dependencies**: Stable camera system (✅ Complete)

---

**Last Updated**: December 2024 