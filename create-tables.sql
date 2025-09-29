-- Script SQL pour créer toutes les tables
-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types ENUM
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cheque', 'espece', 'cheque_et_espece');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('appartement', 'garage');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE check_type AS ENUM ('recu', 'donne');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE check_status AS ENUM ('emis', 'encaisse', 'annule');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sale_status AS ENUM ('en_cours', 'termine', 'annule');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_mode AS ENUM ('espece', 'cheque', 'cheque_espece', 'virement');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_plan_status AS ENUM ('en_attente', 'paye', 'en_retard', 'annule');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  telephone VARCHAR(50),
  societe VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  localisation VARCHAR(500) NOT NULL,
  societe VARCHAR(255) NOT NULL,
  surface_totale DECIMAL NOT NULL,
  nombre_lots INTEGER NOT NULL,
  nombre_appartements INTEGER DEFAULT 0,
  nombre_garages INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des ventes
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type_propriete property_type NOT NULL,
  unite_numero VARCHAR(50) NOT NULL,
  client_nom VARCHAR(255) NOT NULL,
  client_telephone VARCHAR(50),
  client_email VARCHAR(255),
  client_adresse TEXT,
  surface DECIMAL NOT NULL,
  prix_total DECIMAL NOT NULL,
  description TEXT NOT NULL,
  statut sale_status DEFAULT 'en_cours',
  mode_paiement payment_mode NOT NULL,
  avance_declare DECIMAL DEFAULT 0,
  avance_non_declare DECIMAL DEFAULT 0,
  avance_cheque DECIMAL DEFAULT 0,
  avance_espece DECIMAL DEFAULT 0,
  avance_total DECIMAL GENERATED ALWAYS AS (avance_declare + avance_non_declare) STORED,
  unite_disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, unite_numero)
);

-- Table des plans de paiement
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  numero_echeance INTEGER NOT NULL,
  date_prevue DATE NOT NULL,
  montant_prevu DECIMAL NOT NULL,
  montant_paye DECIMAL DEFAULT 0,
  montant_declare DECIMAL DEFAULT 0,
  montant_non_declare DECIMAL DEFAULT 0,
  date_paiement TIMESTAMP WITH TIME ZONE,
  mode_paiement payment_mode,
  montant_espece DECIMAL DEFAULT 0,
  montant_cheque DECIMAL DEFAULT 0,
  statut payment_plan_status DEFAULT 'en_attente',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des dépenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  montant_declare DECIMAL DEFAULT 0,
  montant_non_declare DECIMAL DEFAULT 0,
  montant_total DECIMAL GENERATED ALWAYS AS (montant_declare + montant_non_declare) STORED,
  methode_paiement payment_method NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des chèques
CREATE TABLE IF NOT EXISTS checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  type_cheque check_type NOT NULL,
  montant DECIMAL NOT NULL,
  numero_cheque VARCHAR(100),
  nom_beneficiaire VARCHAR(255),
  nom_emetteur VARCHAR(255),
  date_emission DATE NOT NULL,
  date_encaissement DATE,
  statut check_status DEFAULT 'emis',
  facture_recue BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_plans_updated_at ON payment_plans;
CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checks_updated_at ON checks;
CREATE TRIGGER update_checks_updated_at
  BEFORE UPDATE ON checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
