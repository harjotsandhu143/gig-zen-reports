-- Add tips column to incomes table
ALTER TABLE public.incomes 
ADD COLUMN tips numeric DEFAULT 0;