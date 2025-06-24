// Test Group Chat Functions
// Add this code temporarily to any screen to test group functionality

import { createGroup, getUserGroups, getGroupMembers } from './services/groupsService';
import { sendGroupMessage, getGroupMessages } from './services/messagesService';

// Test function you can call from any component
export const testGroupFunctions = async () => {
  console.log('🧪 Testing Group Chat Functions...');
  
  try {
    // Test 1: Create a group
    console.log('1. Creating test group...');
    const testGroup = await createGroup('Test Group', []); // Empty members for now
    console.log('✅ Group created:', testGroup);
    
    if (!testGroup) {
      console.error('❌ Failed to create group');
      return;
    }
    
    // Test 2: Get user's groups
    console.log('2. Getting user groups...');
    const userGroups = await getUserGroups();
    console.log('✅ User groups:', userGroups);
    
    // Test 3: Send a test message to the group
    console.log('3. Sending test message to group...');
    const messageSent = await sendGroupMessage(
      testGroup.id, 
      'Hello from group chat test!', 
      null, 
      'text'
    );
    console.log('✅ Message sent:', messageSent);
    
    // Test 4: Get group messages
    console.log('4. Getting group messages...');
    const groupMessages = await getGroupMessages(testGroup.id);
    console.log('✅ Group messages:', groupMessages);
    
    // Test 5: Get group members
    console.log('5. Getting group members...');
    const members = await getGroupMembers(testGroup.id);
    console.log('✅ Group members:', members);
    
    console.log('🎉 All group functions working!');
    
  } catch (error) {
    console.error('❌ Group function test failed:', error);
  }
};

// Example: Add this to any screen component to test
/*
import { testGroupFunctions } from '../test-group-functions';

// In your component:
useEffect(() => {
  // Test group functions when component mounts
  testGroupFunctions();
}, []);
*/ 