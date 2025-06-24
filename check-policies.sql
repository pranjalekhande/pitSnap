-- Run this in Supabase SQL Editor to check if the DELETE policy was added
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY cmd; 