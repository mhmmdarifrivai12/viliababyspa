-- Drop the existing policy
DROP POLICY IF EXISTS "Employees can view own transactions" ON public.transactions;

-- Create separate policies for better security
-- Employees can only view their own transactions
CREATE POLICY "Employees can view own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = employee_id);

-- Admins can view all transactions (separate policy)
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));