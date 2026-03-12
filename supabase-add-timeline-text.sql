-- Add timeline_text column to service_requests table
-- Run this in Supabase SQL Editor to update existing table

ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS timeline_text TEXT DEFAULT '';

-- This allows storing the original timeline selection like:
-- "Esta semana", "Soon – within 1 month", etc.
-- while preferred_date remains for actual date values
