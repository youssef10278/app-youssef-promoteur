-- Migration pour supporter les chèques liés aux dépenses
-- Ajouter les champs manquants à la table expenses

-- Ajouter le champ mode_paiement à la table expenses
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS mode_paiement text DEFAULT 'espece' NOT NULL;

-- Créer un enum pour les modes de paiement
DO $$ BEGIN
    CREATE TYPE public.payment_mode AS ENUM ('espece', 'cheque', 'cheque_espece', 'virement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modifier la colonne pour utiliser l'enum
ALTER TABLE public.expenses 
ALTER COLUMN mode_paiement TYPE payment_mode USING mode_paiement::payment_mode;

-- Ajouter le champ expense_id à la table checks pour lier les chèques aux dépenses
ALTER TABLE public.checks 
ADD COLUMN IF NOT EXISTS expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE;

-- Créer un enum pour les statuts de chèques
DO $$ BEGIN
    CREATE TYPE public.check_status AS ENUM ('emis', 'encaisse', 'annule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter le champ statut à la table checks
ALTER TABLE public.checks 
ADD COLUMN IF NOT EXISTS statut check_status DEFAULT 'emis' NOT NULL;

-- Modifier la colonne montant_total pour ne plus être générée automatiquement
-- car nous voulons permettre la saisie manuelle
ALTER TABLE public.expenses 
DROP COLUMN IF EXISTS montant_total CASCADE;

ALTER TABLE public.expenses 
ADD COLUMN montant_total numeric DEFAULT 0 NOT NULL;

-- Créer une fonction pour valider la cohérence des montants
CREATE OR REPLACE FUNCTION public.validate_expense_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Pour les paiements mixtes, vérifier que montant_cheque + montant_espece = montant_total
    IF NEW.mode_paiement = 'cheque_espece' THEN
        IF ABS((NEW.montant_cheque + NEW.montant_espece) - NEW.montant_total) > 0.01 THEN
            RAISE EXCEPTION 'Le total des paiements (% DH) doit égaler le montant total (% DH)', 
                (NEW.montant_cheque + NEW.montant_espece), NEW.montant_total;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour valider les montants
DROP TRIGGER IF EXISTS validate_expense_amounts_trigger ON public.expenses;
CREATE TRIGGER validate_expense_amounts_trigger
    BEFORE INSERT OR UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_expense_amounts();

-- Créer une vue pour les chèques avec informations de dépense
CREATE OR REPLACE VIEW public.expense_checks AS
SELECT 
    c.*,
    e.nom as expense_nom,
    e.montant_total as expense_montant_total,
    p.nom as project_nom
FROM public.checks c
LEFT JOIN public.expenses e ON c.expense_id = e.id
LEFT JOIN public.projects p ON c.project_id = p.id;

-- Mettre à jour les politiques RLS pour les chèques liés aux dépenses
CREATE POLICY "Users can view checks for their expenses" ON public.checks
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.projects p ON e.project_id = p.id
            WHERE e.id = checks.expense_id 
            AND p.user_id = auth.uid()
        )
    );

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_checks_expense_id ON public.checks(expense_id);
CREATE INDEX IF NOT EXISTS idx_expenses_mode_paiement ON public.expenses(mode_paiement);
CREATE INDEX IF NOT EXISTS idx_checks_statut ON public.checks(statut);

-- Commentaires pour la documentation
COMMENT ON COLUMN public.expenses.mode_paiement IS 'Mode de paiement: espece, cheque, cheque_espece, virement';
COMMENT ON COLUMN public.checks.expense_id IS 'ID de la dépense associée (pour les chèques de dépenses)';
COMMENT ON COLUMN public.checks.statut IS 'Statut du chèque: emis, encaisse, annule';
COMMENT ON VIEW public.expense_checks IS 'Vue combinant les chèques avec les informations de dépense et projet';
