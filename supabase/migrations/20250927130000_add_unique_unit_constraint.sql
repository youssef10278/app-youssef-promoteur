-- Migration pour ajouter une contrainte unique sur les unités vendues
-- Empêche la vente de la même unité plusieurs fois

-- Ajouter une contrainte unique pour empêcher la vente de la même unité plusieurs fois
-- La contrainte s'applique seulement aux ventes non annulées
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_active_unit_per_project 
ON public.sales (project_id, unite_numero, user_id) 
WHERE statut != 'annule';

-- Ajouter un commentaire pour expliquer la contrainte
COMMENT ON INDEX unique_active_unit_per_project IS 
'Empêche la vente de la même unité plusieurs fois dans un projet (exclut les ventes annulées)';
