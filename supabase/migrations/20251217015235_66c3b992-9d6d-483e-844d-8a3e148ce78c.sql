-- Allow employees to delete their own transactions
CREATE POLICY "Employees can delete own transactions" 
ON public.transactions 
FOR DELETE 
USING (auth.uid() = employee_id);

-- Allow admins to delete any transactions
CREATE POLICY "Admins can delete any transactions" 
ON public.transactions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow deletion of transaction items when parent transaction is deleted
CREATE POLICY "Can delete transaction items" 
ON public.transaction_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.id = transaction_items.transaction_id 
  AND (t.employee_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));