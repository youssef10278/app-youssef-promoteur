-- Modifier la table expenses pour séparer les montants chèque et espèce
ALTER TABLE public.expenses 
DROP COLUMN IF EXISTS methode_paiement,
ADD COLUMN montant_cheque numeric DEFAULT 0 NOT NULL,
ADD COLUMN montant_espece numeric DEFAULT 0 NOT NULL;

-- Modifier la table sales pour séparer les montants chèque et espèce  
ALTER TABLE public.sales
ADD COLUMN avance_cheque numeric DEFAULT 0 NOT NULL,
ADD COLUMN avance_espece numeric DEFAULT 0 NOT NULL;

-- Créer une fonction pour mettre à jour automatiquement les totaux
CREATE OR REPLACE FUNCTION public.update_expense_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.montant_total = NEW.montant_declare + NEW.montant_non_declare;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour les expenses
DROP TRIGGER IF EXISTS update_expense_total_trigger ON public.expenses;
CREATE TRIGGER update_expense_total_trigger
    BEFORE INSERT OR UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_expense_total();

-- Créer une fonction pour mettre à jour automatiquement les totaux des ventes
CREATE OR REPLACE FUNCTION public.update_sale_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.avance_total = NEW.avance_declare + NEW.avance_non_declare;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour les sales
DROP TRIGGER IF EXISTS update_sale_total_trigger ON public.sales;
CREATE TRIGGER update_sale_total_trigger
    BEFORE INSERT OR UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sale_total();