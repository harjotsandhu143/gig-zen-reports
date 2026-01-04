-- Add income_type column to incomes table (additive only, nullable with default)
-- Options: 'salary', 'casual', 'abn', 'freelance', 'gig', 'other'
ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS income_type text DEFAULT 'gig';

-- Add source_name column for flexible income source names  
ALTER TABLE public.incomes
ADD COLUMN IF NOT EXISTS source_name text DEFAULT NULL;

-- Add has_completed_onboarding to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;