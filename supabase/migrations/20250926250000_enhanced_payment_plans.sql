-- Migration pour améliorer le système de paiements échelonnés
-- Ajouter les champs pour montants déclarés/non déclarés et modes de paiement par échéance

-- Ajouter les nouveaux champs à la table payment_plans
ALTER TABLE public.payment_plans 
ADD COLUMN IF NOT EXISTS montant_declare numeric NOT NULL DEFAULT 0 CHECK (montant_declare >= 0),
ADD COLUMN IF NOT EXISTS montant_non_declare numeric NOT NULL DEFAULT 0 CHECK (montant_non_declare >= 0),
ADD COLUMN IF NOT EXISTS mode_paiement payment_mode DEFAULT 'espece' NOT NULL,
ADD COLUMN IF NOT EXISTS montant_cheque numeric NOT NULL DEFAULT 0 CHECK (montant_cheque >= 0),
ADD COLUMN IF NOT EXISTS montant_espece numeric NOT NULL DEFAULT 0 CHECK (montant_espece >= 0);

-- Ajouter les contraintes de cohérence
ALTER TABLE public.payment_plans 
ADD CONSTRAINT IF NOT EXISTS payment_plans_montant_coherence 
CHECK (montant_prevu = montant_declare + montant_non_declare);

ALTER TABLE public.payment_plans 
ADD CONSTRAINT IF NOT EXISTS payment_plans_mode_paiement_coherence 
CHECK (
    (mode_paiement = 'espece' AND montant_cheque = 0 AND montant_espece = montant_prevu) OR
    (mode_paiement = 'cheque' AND montant_espece = 0 AND montant_cheque = montant_prevu) OR
    (mode_paiement = 'cheque_espece' AND montant_cheque + montant_espece = montant_prevu) OR
    (mode_paiement = 'virement' AND montant_cheque = 0 AND montant_espece = 0)
);

-- Ajouter le lien entre les chèques et les payment_plans
ALTER TABLE public.checks 
ADD COLUMN IF NOT EXISTS payment_plan_id uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL;

-- Créer une vue pour les chèques liés aux échéances
CREATE OR REPLACE VIEW public.payment_plan_checks AS
SELECT 
    pp.id as payment_plan_id,
    pp.sale_id,
    pp.numero_echeance,
    pp.description as echeance_description,
    pp.montant_prevu,
    pp.montant_declare,
    pp.montant_non_declare,
    pp.mode_paiement,
    pp.montant_cheque,
    pp.montant_espece,
    pp.date_prevue,
    pp.statut as echeance_statut,
    c.id as check_id,
    c.numero_cheque,
    c.nom_beneficiaire,
    c.nom_emetteur,
    c.date_emission,
    c.date_encaissement,
    c.montant as check_montant,
    c.description as check_description,
    c.statut as check_statut,
    s.description as sale_description,
    p.nom as project_nom
FROM public.payment_plans pp
LEFT JOIN public.checks c ON c.payment_plan_id = pp.id
LEFT JOIN public.sales s ON s.id = pp.sale_id
LEFT JOIN public.projects p ON p.id = s.project_id
ORDER BY pp.sale_id, pp.numero_echeance, c.date_emission;

-- Créer une vue pour le résumé des paiements par échéance
CREATE OR REPLACE VIEW public.payment_plan_summary AS
SELECT 
    pp.id as payment_plan_id,
    pp.sale_id,
    pp.numero_echeance,
    pp.description,
    pp.montant_prevu,
    pp.montant_declare,
    pp.montant_non_declare,
    pp.mode_paiement,
    pp.montant_cheque,
    pp.montant_espece,
    pp.date_prevue,
    pp.statut,
    pp.notes,
    s.description as sale_description,
    p.nom as project_nom,
    -- Calculs des montants reçus
    COALESCE(SUM(pay.montant_recu), 0) as montant_recu_total,
    COALESCE(COUNT(c.id), 0) as nombre_cheques,
    COALESCE(SUM(c.montant), 0) as montant_cheques_total,
    -- Statut calculé
    CASE 
        WHEN pp.statut = 'recu' THEN 'Payé'
        WHEN pp.date_prevue < CURRENT_DATE AND pp.statut = 'planifie' THEN 'En retard'
        WHEN pp.date_prevue <= CURRENT_DATE + INTERVAL '7 days' AND pp.statut = 'planifie' THEN 'À venir'
        ELSE 'Planifié'
    END as statut_affichage,
    -- Pourcentage de progression
    CASE 
        WHEN pp.montant_prevu > 0 THEN 
            ROUND((COALESCE(SUM(pay.montant_recu), 0) / pp.montant_prevu) * 100, 2)
        ELSE 0
    END as pourcentage_paye
FROM public.payment_plans pp
LEFT JOIN public.payments pay ON pay.payment_plan_id = pp.id
LEFT JOIN public.checks c ON c.payment_plan_id = pp.id
LEFT JOIN public.sales s ON s.id = pp.sale_id
LEFT JOIN public.projects p ON p.id = s.project_id
GROUP BY pp.id, pp.sale_id, pp.numero_echeance, pp.description, pp.montant_prevu, 
         pp.montant_declare, pp.montant_non_declare, pp.mode_paiement, 
         pp.montant_cheque, pp.montant_espece, pp.date_prevue, pp.statut, pp.notes,
         s.description, p.nom
ORDER BY pp.sale_id, pp.numero_echeance;

-- Mettre à jour les politiques RLS pour les nouvelles colonnes
-- (Les politiques existantes couvrent déjà les nouvelles colonnes)

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_payment_plans_mode_paiement ON public.payment_plans(mode_paiement);
CREATE INDEX IF NOT EXISTS idx_payment_plans_montant_declare ON public.payment_plans(montant_declare);
CREATE INDEX IF NOT EXISTS idx_payment_plans_statut_date ON public.payment_plans(statut, date_prevue);
CREATE INDEX IF NOT EXISTS idx_checks_payment_plan_id ON public.checks(payment_plan_id);

-- Commentaires pour la documentation
COMMENT ON COLUMN public.payment_plans.montant_declare IS 'Montant déclaré fiscalement pour cette échéance';
COMMENT ON COLUMN public.payment_plans.montant_non_declare IS 'Montant non déclaré fiscalement pour cette échéance';
COMMENT ON COLUMN public.payment_plans.mode_paiement IS 'Mode de paiement pour cette échéance (espece, cheque, cheque_espece, virement)';
COMMENT ON COLUMN public.payment_plans.montant_cheque IS 'Montant total des chèques pour cette échéance';
COMMENT ON COLUMN public.payment_plans.montant_espece IS 'Montant en espèces pour cette échéance';
COMMENT ON COLUMN public.checks.payment_plan_id IS 'Référence vers l''échéance de paiement associée';

COMMENT ON VIEW public.payment_plan_checks IS 'Vue combinant les échéances et leurs chèques associés';
COMMENT ON VIEW public.payment_plan_summary IS 'Vue résumé des échéances avec calculs de progression et statuts';
