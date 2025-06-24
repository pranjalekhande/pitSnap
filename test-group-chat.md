# Group Chat Testing Guide

## Step 1: Apply Database Migration

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `group-chat-migration.sql`
4. Execute the SQL

## Step 2: Test Individual Chat Still Works

**IMPORTANT: Test this first to ensure we didn't break anything!**

1. Open your app
2. Go to Chat screen
3. Send a message to a friend
4. Verify it works exactly as before

## Step 3: Test Group Functions (Console/Debug)

You can test the new group functions by adding some debug code to any screen:

```typescript
import { createGroup, getUserGroups } from '../services/groupsService';
import { sendGroupMessage, getGroupMessages } from '../services/messagesService';

// Test creating a group
const testCreateGroup = async () => {
  const group = await createGroup('Test Group', ['friend-user-id-here']);
  console.log('Created group:', group);
};

// Test sending group message
const testSendGroupMessage = async () => {
  await sendGroupMessage('group-id-here', 'Hello group!', null, 'text');
  console.log('Group message sent');
};

// Test getting group messages
const testGetGroupMessages = async () => {
  const messages = await getGroupMessages('group-id-here');
  console.log('Group messages:', messages);
};
```

## Step 4: Verify Database Changes

Check your Supabase dashboard:

1. **Tables**: You should see `groups` and `group_members` tables
2. **Messages table**: Should have new `group_id` column
3. **Policies**: New RLS policies should be created

## Expected Results

### ✅ What Should Work:
- Individual messaging (unchanged)
- Camera capture (unchanged)
- Group creation via service functions
- Group messaging via service functions
- Database queries return correct data

### 🔄 What's Not Ready Yet:
- Group chat UI (next step)
- Group selection in camera (next step)
- Group management screens (next step)

## Next Steps After Testing

Once you confirm the database and services work:

1. **Week 2**: Create group chat UI screens
2. **Week 3**: Integrate with camera sharing
3. **Week 4**: Polish and group management

## Troubleshooting

### If Individual Chat Breaks:
- Check if `recipient_id` field is still working
- Verify existing RLS policies weren't broken
- Check console for SQL errors

### If Group Functions Don't Work:
- Verify migration ran successfully
- Check RLS policies are correct
- Verify user is authenticated

### Common Issues:
- **Foreign key constraint**: Make sure `groups` table is created before adding `group_id` column
- **RLS policies**: User must be group member to send/receive group messages
- **Null values**: Either `recipient_id` OR `group_id` should be set, not both

---

**Status**: Ready for database migration and basic testing
**Next**: Create group chat UI screens 