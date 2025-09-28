-- Migration pour corriger l'enum payment_mode et la colonne mode_paiement
-- Créer l'enum payment_mode qui manque

-- Créer l'enum payment_mode
DO $$ BEGIN
    CREATE TYPE public.payment_mode AS ENUM ('espece', 'cheque', 'cheque_espece', 'virement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Supprimer la colonne mode_paiement existante si elle existe (avec mauvais type)
ALTER TABLE public.sales 
DROP COLUMN IF EXISTS mode_paiement;

-- Ajouter la colonne mode_paiement avec le bon type
ALTER TABLE public.sales 
ADD COLUMN mode_paiement payment_mode DEFAULT 'espece' NOT NULL;

-- Ajouter la colonne statut si elle n'existe pas
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS statut sale_status DEFAULT 'en_cours' NOT NULL;

-- Ajouter la colonne user_id si elle n'existe pas
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mettre à jour les index
CREATE INDEX IF NOT EXISTS idx_sales_mode_paiement ON public.sales(mode_paiement);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_statut ON public.sales(statut);

-- Commentaires pour la documentation
COMMENT ON COLUMN public.sales.mode_paiement IS 'Mode de paiement: espece, cheque, cheque_espece, virement';
COMMENT ON COLUMN public.sales.statut IS 'Statut de la vente: en_cours, termine, annule';
COMMENT ON COLUMN public.sales.user_id IS 'ID de l''utilisateur propriétaire de la vente';
