-- Migration pour créer le système de paiements échelonnés
-- Tables: payment_plans, payments

-- Créer les enums pour les statuts
DO $$ BEGIN
    CREATE TYPE public.payment_plan_status AS ENUM ('planifie', 'recu', 'en_retard', 'annule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('recu', 'encaisse', 'rejete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.sale_status AS ENUM ('en_cours', 'termine', 'annule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter le statut à la table sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS statut sale_status DEFAULT 'en_cours' NOT NULL;

-- Créer la table payment_plans (échéancier de paiement)
CREATE TABLE IF NOT EXISTS public.payment_plans (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_echeance integer NOT NULL,
    description text NOT NULL,
    montant_prevu numeric NOT NULL CHECK (montant_prevu > 0),
    montant_declare numeric NOT NULL DEFAULT 0 CHECK (montant_declare >= 0),
    montant_non_declare numeric NOT NULL DEFAULT 0 CHECK (montant_non_declare >= 0),
    mode_paiement payment_mode DEFAULT 'espece' NOT NULL,
    montant_cheque numeric NOT NULL DEFAULT 0 CHECK (montant_cheque >= 0),
    montant_espece numeric NOT NULL DEFAULT 0 CHECK (montant_espece >= 0),
    date_prevue date NOT NULL,
    statut payment_plan_status DEFAULT 'planifie' NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Contraintes
    CONSTRAINT payment_plans_numero_echeance_positive CHECK (numero_echeance > 0),
    CONSTRAINT payment_plans_unique_echeance_per_sale UNIQUE (sale_id, numero_echeance),
    -- Vérifier que montant_prevu = montant_declare + montant_non_declare
    CONSTRAINT payment_plans_montant_coherence CHECK (montant_prevu = montant_declare + montant_non_declare),
    -- Vérifier la cohérence des montants selon le mode de paiement
    CONSTRAINT payment_plans_mode_paiement_coherence CHECK (
        (mode_paiement = 'espece' AND montant_cheque = 0 AND montant_espece = montant_prevu) OR
        (mode_paiement = 'cheque' AND montant_espece = 0 AND montant_cheque = montant_prevu) OR
        (mode_paiement = 'cheque_espece' AND montant_cheque + montant_espece = montant_prevu) OR
        (mode_paiement = 'virement' AND montant_cheque = 0 AND montant_espece = 0)
    )
);

-- Créer la table payments (paiements reçus)
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_plan_id uuid NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    montant_recu numeric NOT NULL CHECK (montant_recu > 0),
    date_reception date NOT NULL,
    mode_paiement payment_mode NOT NULL,
    reference text, -- N° chèque, référence virement, etc.
    notes text,
    statut payment_status DEFAULT 'recu' NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_payment_plans_sale_id ON public.payment_plans(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_user_id ON public.payment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_date_prevue ON public.payment_plans(date_prevue);
CREATE INDEX IF NOT EXISTS idx_payment_plans_statut ON public.payment_plans(statut);

CREATE INDEX IF NOT EXISTS idx_payments_payment_plan_id ON public.payments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date_reception ON public.payments(date_reception);
CREATE INDEX IF NOT EXISTS idx_payments_statut ON public.payments(statut);

-- Créer les politiques RLS pour payment_plans
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment plans" ON public.payment_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment plans" ON public.payment_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment plans" ON public.payment_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment plans" ON public.payment_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Créer les politiques RLS pour payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments" ON public.payments
    FOR DELETE USING (auth.uid() = user_id);

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour updated_at
DROP TRIGGER IF EXISTS update_payment_plans_updated_at ON public.payment_plans;
CREATE TRIGGER update_payment_plans_updated_at
    BEFORE UPDATE ON public.payment_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Créer une fonction pour mettre à jour automatiquement le statut des échéances
CREATE OR REPLACE FUNCTION public.update_payment_plan_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si un paiement est ajouté, vérifier si l'échéance est complètement payée
    IF TG_OP = 'INSERT' THEN
        UPDATE public.payment_plans 
        SET statut = 'recu'
        WHERE id = NEW.payment_plan_id 
        AND statut = 'planifie'
        AND (
            SELECT COALESCE(SUM(montant_recu), 0) 
            FROM public.payments 
            WHERE payment_plan_id = NEW.payment_plan_id
        ) >= montant_prevu;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour le statut des échéances
DROP TRIGGER IF EXISTS update_payment_plan_status_trigger ON public.payments;
CREATE TRIGGER update_payment_plan_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_plan_status();

-- Ajouter le lien entre les chèques et les payment_plans
ALTER TABLE public.checks
ADD COLUMN IF NOT EXISTS payment_plan_id uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL;

-- Créer une vue pour les statistiques de paiement par vente
CREATE OR REPLACE VIEW public.sale_payment_summary AS
SELECT 
    s.id as sale_id,
    s.description as sale_description,
    s.prix_total,
    s.statut as sale_statut,
    COUNT(pp.id) as total_echeances,
    COUNT(CASE WHEN pp.statut = 'recu' THEN 1 END) as echeances_payees,
    COUNT(CASE WHEN pp.statut = 'en_retard' THEN 1 END) as echeances_en_retard,
    COALESCE(SUM(pp.montant_prevu), 0) as montant_total_prevu,
    COALESCE(SUM(p.montant_recu), 0) as montant_total_recu,
    COALESCE(SUM(pp.montant_prevu), 0) - COALESCE(SUM(p.montant_recu), 0) as montant_restant,
    MIN(CASE WHEN pp.statut = 'planifie' THEN pp.date_prevue END) as prochaine_echeance
FROM public.sales s
LEFT JOIN public.payment_plans pp ON s.id = pp.sale_id
LEFT JOIN public.payments p ON pp.id = p.payment_plan_id
GROUP BY s.id, s.description, s.prix_total, s.statut;

-- Commentaires pour la documentation
COMMENT ON TABLE public.payment_plans IS 'Échéancier de paiement pour chaque vente';
COMMENT ON TABLE public.payments IS 'Paiements reçus pour chaque échéance';
COMMENT ON VIEW public.sale_payment_summary IS 'Résumé des paiements par vente';

COMMENT ON COLUMN public.payment_plans.numero_echeance IS 'Numéro d''ordre de l''échéance (1, 2, 3...)';
COMMENT ON COLUMN public.payment_plans.description IS 'Description de l''échéance (ex: Avance signature, 1ère tranche)';
COMMENT ON COLUMN public.payment_plans.montant_prevu IS 'Montant prévu pour cette échéance';
COMMENT ON COLUMN public.payment_plans.date_prevue IS 'Date prévue de paiement';
COMMENT ON COLUMN public.payment_plans.statut IS 'Statut: planifie, recu, en_retard, annule';

COMMENT ON COLUMN public.payments.montant_recu IS 'Montant effectivement reçu';
COMMENT ON COLUMN public.payments.date_reception IS 'Date de réception du paiement';
COMMENT ON COLUMN public.payments.reference IS 'Référence du paiement (N° chèque, virement, etc.)';
COMMENT ON COLUMN public.payments.statut IS 'Statut: recu, encaisse, rejete';

COMMENT ON COLUMN public.sales.statut IS 'Statut de la vente: en_cours, termine, annule';
