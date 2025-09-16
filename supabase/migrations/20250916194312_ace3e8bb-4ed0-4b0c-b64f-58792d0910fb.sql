-- Find and fix security definer views
-- First, let's check if there are any views with SECURITY DEFINER

-- Drop any problematic security definer views if they exist
-- This is a common issue where views are created with SECURITY DEFINER when they don't need it

-- Check if there are any views that need to be recreated without SECURITY DEFINER
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%SECURITY DEFINER%';