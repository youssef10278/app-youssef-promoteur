-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_plan_id uuid NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    montant numeric NOT NULL CHECK (montant > 0),
    date_paiement date NOT NULL,
    mode_paiement payment_mode NOT NULL,
    montant_espece numeric DEFAULT 0 CHECK (montant_espece >= 0),
    montant_cheque numeric DEFAULT 0 CHECK (montant_cheque >= 0),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraint to ensure payment amounts are coherent with payment mode
ALTER TABLE public.payments ADD CONSTRAINT payments_montant_coherent CHECK (
    CASE
        WHEN mode_paiement = 'cheque_espece' THEN (montant_espece + montant_cheque = montant)
        WHEN mode_paiement = 'espece' THEN (montant_espece = montant AND montant_cheque = 0)
        WHEN mode_paiement = 'cheque' THEN (montant_cheque = montant AND montant_espece = 0)
        WHEN mode_paiement = 'virement' THEN (montant_espece = 0 AND montant_cheque = 0)
        ELSE true
    END
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_payment_plan_id ON public.payments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date_paiement ON public.payments(date_paiement);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments" ON public.payments
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
