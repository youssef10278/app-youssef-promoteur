-- Migration pour créer la table payment_checks
-- Table pour stocker les chèques liés aux échéances de paiement

-- Créer la table payment_checks
CREATE TABLE IF NOT EXISTS public.payment_checks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_plan_id uuid NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_cheque text NOT NULL,
    montant numeric NOT NULL CHECK (montant > 0),
    banque text,
    date_emission date,
    date_encaissement date,
    statut check_status DEFAULT 'emis' NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Contraintes
    CONSTRAINT payment_checks_numero_cheque_not_empty CHECK (length(trim(numero_cheque)) > 0),
    CONSTRAINT payment_checks_date_coherence CHECK (date_encaissement IS NULL OR date_encaissement >= date_emission)
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_payment_checks_payment_plan_id ON public.payment_checks(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_checks_user_id ON public.payment_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_checks_statut ON public.payment_checks(statut);
CREATE INDEX IF NOT EXISTS idx_payment_checks_numero_cheque ON public.payment_checks(numero_cheque);
CREATE INDEX IF NOT EXISTS idx_payment_checks_date_emission ON public.payment_checks(date_emission);

-- Activer RLS
ALTER TABLE public.payment_checks ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view their own payment checks" ON public.payment_checks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment checks" ON public.payment_checks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment checks" ON public.payment_checks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment checks" ON public.payment_checks
    FOR DELETE USING (auth.uid() = user_id);

-- Créer une vue pour les chèques avec informations de paiement
CREATE OR REPLACE VIEW public.payment_checks_with_details AS
SELECT 
    pc.*,
    pp.sale_id,
    pp.numero_echeance,
    pp.description as echeance_description,
    pp.montant_prevu as echeance_montant,
    pp.date_prevue as echeance_date,
    pp.statut as echeance_statut,
    s.client_nom,
    s.unite_numero,
    s.description as sale_description,
    p.nom as project_nom
FROM public.payment_checks pc
LEFT JOIN public.payment_plans pp ON pc.payment_plan_id = pp.id
LEFT JOIN public.sales s ON pp.sale_id = s.id
LEFT JOIN public.projects p ON s.project_id = p.id;

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_payment_checks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
CREATE TRIGGER update_payment_checks_updated_at
    BEFORE UPDATE ON public.payment_checks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_checks_updated_at();

-- Ajouter les champs manquants à la table sales pour les informations client
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS client_nom text,
ADD COLUMN IF NOT EXISTS client_telephone text,
ADD COLUMN IF NOT EXISTS client_email text,
ADD COLUMN IF NOT EXISTS client_adresse text,
ADD COLUMN IF NOT EXISTS unite_numero text;

-- Créer des index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS idx_sales_client_nom ON public.sales(client_nom);
CREATE INDEX IF NOT EXISTS idx_sales_unite_numero ON public.sales(unite_numero);

-- Mettre à jour la vue sale_payment_summary pour inclure les nouvelles colonnes
CREATE OR REPLACE VIEW public.sale_payment_summary AS
SELECT 
    s.id as sale_id,
    s.project_id,
    s.client_nom,
    s.unite_numero,
    s.type_propriete,
    s.surface,
    s.description as sale_description,
    s.prix_total,
    s.statut as sale_statut,
    s.created_at as sale_created_at,
    COUNT(pp.id) as total_echeances,
    COUNT(CASE WHEN pp.statut = 'recu' THEN 1 END) as echeances_payees,
    COUNT(CASE WHEN pp.statut = 'en_retard' THEN 1 END) as echeances_en_retard,
    COALESCE(SUM(pp.montant_prevu), 0) as montant_total_prevu,
    COALESCE(SUM(p.montant_recu), 0) as montant_total_recu,
    COALESCE(SUM(pp.montant_prevu), 0) - COALESCE(SUM(p.montant_recu), 0) as montant_restant,
    MIN(CASE WHEN pp.statut = 'planifie' THEN pp.date_prevue END) as prochaine_echeance,
    CASE 
        WHEN COALESCE(SUM(pp.montant_prevu), 0) > 0 
        THEN (COALESCE(SUM(p.montant_recu), 0) / COALESCE(SUM(pp.montant_prevu), 0)) * 100 
        ELSE 0 
    END as progression_pourcentage
FROM public.sales s
LEFT JOIN public.payment_plans pp ON s.id = pp.sale_id
LEFT JOIN public.payments p ON pp.id = p.payment_plan_id
GROUP BY s.id, s.project_id, s.client_nom, s.unite_numero, s.type_propriete, s.surface, s.description, s.prix_total, s.statut, s.created_at;

-- Commentaires pour la documentation
COMMENT ON TABLE public.payment_checks IS 'Chèques liés aux échéances de paiement des ventes';
COMMENT ON COLUMN public.payment_checks.payment_plan_id IS 'ID de l''échéance de paiement associée';
COMMENT ON COLUMN public.payment_checks.numero_cheque IS 'Numéro du chèque';
COMMENT ON COLUMN public.payment_checks.montant IS 'Montant du chèque';
COMMENT ON COLUMN public.payment_checks.banque IS 'Nom de la banque émettrice';
COMMENT ON COLUMN public.payment_checks.date_emission IS 'Date d''émission du chèque';
COMMENT ON COLUMN public.payment_checks.date_encaissement IS 'Date d''encaissement du chèque';
COMMENT ON COLUMN public.payment_checks.statut IS 'Statut du chèque: emis, encaisse, annule';

COMMENT ON VIEW public.payment_checks_with_details IS 'Vue des chèques avec détails des paiements et ventes';
COMMENT ON VIEW public.sale_payment_summary IS 'Résumé des paiements par vente avec progression';

COMMENT ON COLUMN public.sales.client_nom IS 'Nom complet du client';
COMMENT ON COLUMN public.sales.client_telephone IS 'Numéro de téléphone du client';
COMMENT ON COLUMN public.sales.client_email IS 'Adresse email du client';
COMMENT ON COLUMN public.sales.client_adresse IS 'Adresse complète du client';
COMMENT ON COLUMN public.sales.unite_numero IS 'Numéro de l''unité vendue (ex: A3, G12, V1)';
