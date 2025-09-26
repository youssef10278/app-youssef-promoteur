-- Create enum types for better data integrity
CREATE TYPE public.payment_method AS ENUM ('cheque', 'espece', 'cheque_et_espece');
CREATE TYPE public.property_type AS ENUM ('appartement', 'garage');
CREATE TYPE public.check_type AS ENUM ('recu', 'donne');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nom text NOT NULL,
    email text NOT NULL,
    telephone text,
    societe text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom text NOT NULL,
    localisation text NOT NULL,
    societe text NOT NULL,
    surface_totale numeric NOT NULL,
    nombre_lots integer NOT NULL,
    nombre_appartements integer NOT NULL DEFAULT 0,
    nombre_garages integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    nom text NOT NULL,
    montant_declare numeric NOT NULL DEFAULT 0,
    montant_non_declare numeric NOT NULL DEFAULT 0,
    montant_total numeric GENERATED ALWAYS AS (montant_declare + montant_non_declare) STORED,
    methode_paiement payment_method NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type_propriete property_type NOT NULL,
    description text NOT NULL, -- e.g., "Appartement 1er étage"
    surface numeric NOT NULL,
    prix_total numeric NOT NULL,
    avance_declare numeric NOT NULL DEFAULT 0,
    avance_non_declare numeric NOT NULL DEFAULT 0,
    avance_total numeric GENERATED ALWAYS AS (avance_declare + avance_non_declare) STORED,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create checks table
CREATE TABLE public.checks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    type_cheque check_type NOT NULL,
    montant numeric NOT NULL,
    numero_cheque text,
    nom_beneficiaire text,
    nom_emetteur text,
    date_emission date NOT NULL,
    date_encaissement date,
    facture_recue boolean NOT NULL DEFAULT false,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for expenses
CREATE POLICY "Users can view expenses for their projects" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = expenses.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create expenses for their projects" ON public.expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = expenses.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update expenses for their projects" ON public.expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = expenses.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete expenses for their projects" ON public.expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = expenses.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Create RLS policies for sales
CREATE POLICY "Users can view sales for their projects" ON public.sales
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = sales.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create sales for their projects" ON public.sales
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = sales.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sales for their projects" ON public.sales
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = sales.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sales for their projects" ON public.sales
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = sales.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Create RLS policies for checks
CREATE POLICY "Users can view their own checks" ON public.checks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checks" ON public.checks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checks" ON public.checks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checks" ON public.checks
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checks_updated_at
    BEFORE UPDATE ON public.checks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, nom, email)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'nom', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();