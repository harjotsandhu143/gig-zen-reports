-- Add weekly_target column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN weekly_target numeric DEFAULT 0;