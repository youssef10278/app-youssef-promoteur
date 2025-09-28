-- Add declared and non-declared amounts to payment_plans table
ALTER TABLE public.payment_plans 
ADD COLUMN IF NOT EXISTS montant_declare numeric DEFAULT 0 CHECK (montant_declare >= 0),
ADD COLUMN IF NOT EXISTS montant_non_declare numeric DEFAULT 0 CHECK (montant_non_declare >= 0);

-- Add declared and non-declared amounts to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS montant_declare numeric DEFAULT 0 CHECK (montant_declare >= 0),
ADD COLUMN IF NOT EXISTS montant_non_declare numeric DEFAULT 0 CHECK (montant_non_declare >= 0);

-- Add constraint to ensure declared + non-declared = total amount for payment_plans
ALTER TABLE public.payment_plans 
ADD CONSTRAINT payment_plans_declared_amounts_coherent 
CHECK (montant_declare + montant_non_declare = montant_paye);

-- Add constraint to ensure declared + non-declared = total amount for payments
ALTER TABLE public.payments 
ADD CONSTRAINT payments_declared_amounts_coherent 
CHECK (montant_declare + montant_non_declare = montant);

-- Update existing records to have declared amount equal to total amount (assuming all was declared)
UPDATE public.payment_plans 
SET montant_declare = montant_paye, montant_non_declare = 0 
WHERE montant_declare IS NULL OR montant_non_declare IS NULL;

UPDATE public.payments 
SET montant_declare = montant, montant_non_declare = 0 
WHERE montant_declare IS NULL OR montant_non_declare IS NULL;
