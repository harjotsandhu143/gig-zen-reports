-- Add coles_hours column to track hours worked at Coles
ALTER TABLE public.incomes 
ADD COLUMN coles_hours numeric DEFAULT NULL;