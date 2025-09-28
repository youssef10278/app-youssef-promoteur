-- Migration pour supporter les chèques liés aux ventes
-- Ajouter le champ sale_id à la table checks pour lier les chèques aux ventes

-- Ajouter le champ sale_id à la table checks pour lier les chèques aux ventes
ALTER TABLE public.checks 
ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE;

-- Ajouter le champ mode_paiement à la table sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS mode_paiement payment_mode DEFAULT 'espece' NOT NULL;

-- Créer une vue pour les chèques avec informations de vente
CREATE OR REPLACE VIEW public.sale_checks AS
SELECT 
    c.*,
    s.description as sale_description,
    s.prix_total as sale_prix_total,
    s.avance_total as sale_avance_total,
    p.nom as project_nom
FROM public.checks c
LEFT JOIN public.sales s ON c.sale_id = s.id
LEFT JOIN public.projects p ON c.project_id = p.id;

-- Mettre à jour les politiques RLS pour les chèques liés aux ventes
CREATE POLICY "Users can view checks for their sales" ON public.checks
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.sales s
            JOIN public.projects p ON s.project_id = p.id
            WHERE s.id = checks.sale_id 
            AND p.user_id = auth.uid()
        )
    );

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_checks_sale_id ON public.checks(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_mode_paiement ON public.sales(mode_paiement);

-- Commentaires pour la documentation
COMMENT ON COLUMN public.sales.mode_paiement IS 'Mode de paiement: espece, cheque, cheque_espece, virement';
COMMENT ON COLUMN public.checks.sale_id IS 'ID de la vente associée (pour les chèques de ventes)';
COMMENT ON VIEW public.sale_checks IS 'Vue combinant les chèques avec les informations de vente et projet';

-- Créer une vue unifiée pour tous les chèques (dépenses et ventes)
CREATE OR REPLACE VIEW public.all_checks AS
SELECT 
    c.*,
    CASE 
        WHEN c.expense_id IS NOT NULL THEN 'expense'
        WHEN c.sale_id IS NOT NULL THEN 'sale'
        ELSE 'standalone'
    END as source_type,
    CASE 
        WHEN c.expense_id IS NOT NULL THEN e.nom
        WHEN c.sale_id IS NOT NULL THEN s.description
        ELSE NULL
    END as source_description,
    CASE 
        WHEN c.expense_id IS NOT NULL THEN e.montant_total
        WHEN c.sale_id IS NOT NULL THEN s.avance_total
        ELSE NULL
    END as source_amount,
    p.nom as project_nom
FROM public.checks c
LEFT JOIN public.expenses e ON c.expense_id = e.id
LEFT JOIN public.sales s ON c.sale_id = s.id
LEFT JOIN public.projects p ON c.project_id = p.id;

COMMENT ON VIEW public.all_checks IS 'Vue unifiée pour tous les chèques avec informations de source (dépense ou vente)';
