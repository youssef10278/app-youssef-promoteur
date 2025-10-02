import { query, closePool } from '../config/database';

const createTables = async () => {
  console.log('🚀 Début de la migration de la base de données...');

  try {
    // Création des types ENUM
    await query(`
      DO $$ BEGIN
        CREATE TYPE payment_method AS ENUM ('cheque', 'espece', 'cheque_et_espece');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE property_type AS ENUM ('appartement', 'garage');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE check_type AS ENUM ('recu', 'donne');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE check_status AS ENUM ('emis', 'encaisse', 'annule');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE sale_status AS ENUM ('en_cours', 'termine', 'annule');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE payment_mode AS ENUM ('espece', 'cheque', 'cheque_espece', 'virement');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      DO $$ BEGIN
        CREATE TYPE payment_plan_status AS ENUM ('en_attente', 'paye', 'en_retard', 'annule');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Extension UUID si pas déjà présente
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Correction de l'ENUM payment_method pour inclure 'cheque_espece'
    console.log('🔧 Correction de l\'ENUM payment_method...');
    try {
      await query(`ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'cheque_espece';`);
      console.log('✅ ENUM payment_method corrigé');
    } catch (error) {
      // L'erreur peut survenir si l'ENUM n'existe pas encore, on l'ignore
      console.log('ℹ️ ENUM payment_method sera créé avec les bonnes valeurs');
    }

    // Table des utilisateurs
    await query(`
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
    `);

    // Table des projets
    await query(`
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
    `);

    // Table des ventes
    await query(`
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
    `);

    // Table des plans de paiement
    await query(`
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
    `);

    // Table des dépenses
    await query(`
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
    `);

    // Table des chèques
    await query(`
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
    `);

    // Table des paramètres d'entreprise
    await query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        footer_text TEXT,
        additional_info TEXT,
        is_default BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Tables principales créées');

    // Fonction pour mettre à jour updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Triggers pour updated_at
    const tables = ['users', 'projects', 'sales', 'payment_plans', 'expenses', 'checks', 'company_settings'];
    for (const table of tables) {
      await query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    console.log('✅ Triggers créés');
    console.log('🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
};

// Exécution si appelé directement
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('✅ Migration réussie');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration échouée:', error);
      process.exit(1);
    })
    .finally(() => {
      closePool();
    });
}

export { createTables };
