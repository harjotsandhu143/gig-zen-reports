-- Add archived column to incomes table
ALTER TABLE public.incomes ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Add archived column to expenses table  
ALTER TABLE public.expenses ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Create index for faster filtering
CREATE INDEX idx_incomes_archived ON public.incomes(archived);
CREATE INDEX idx_expenses_archived ON public.expenses(archived);