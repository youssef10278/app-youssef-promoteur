-- Corriger les fonctions pour la sécurité
CREATE OR REPLACE FUNCTION public.update_expense_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.montant_total = NEW.montant_declare + NEW.montant_non_declare;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_sale_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.avance_total = NEW.avance_declare + NEW.avance_non_declare;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;