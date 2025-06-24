# Stories Database Migration Guide

## 📊 **Required Database Changes**

To enable the Stories feature, you need to run the updated schema on your Supabase database.

### **What's Added:**
- `stories` table - Store story posts with 24h expiry
- `story_views` table - Track who viewed each story
- `increment_story_view_count()` function - Efficiently update view counts
- **RLS Policies** - Friend-only story visibility
- **Indexes** - Performance optimization

### **📋 Migration Steps:**

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Click on "SQL Editor" in the sidebar

2. **Run the Updated Schema**
   - Copy the contents of `pitsnap-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify Tables Created**
   - Go to "Table Editor"
   - Confirm you see:
     - ✅ `stories` table
     - ✅ `story_views` table
   - Check that existing tables (`users`, `friends`, `messages`) are unchanged

### **🔧 What's Already Done:**
- ✅ Service layer (`storiesService.ts`)
- ✅ All story screens built
- ✅ Navigation integration complete
- ✅ Camera integration added

### **🚀 After Migration:**
The Stories feature will be fully functional:
- Create stories from camera
- View friends' stories
- 24-hour auto-expiry
- View tracking and analytics
- Stories tab in navigation

### **⚠️ Important Notes:**
- **Backward Compatible** - Won't affect existing data
- **RLS Enabled** - Stories are only visible to friends
- **Auto-Cleanup** - Stories expire after 24 hours
- **Performance Optimized** - Proper indexes included

Run this migration when you're ready to enable Stories! 🎬 