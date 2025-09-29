/**
 * Script pour exécuter la migration d'ajout des colonnes montant_declare et montant_non_declare
 * 
 * Usage:
 *   npm run migrate:declared-amounts
 *   ou
 *   ts-node src/scripts/run-migration.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

/**
 * Exécute une requête SQL
 */
async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('✅ Requête exécutée', { duration: `${duration}ms`, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la requête:', error);
    throw error;
  }
}

/**
 * Vérifie si les colonnes existent déjà
 */
async function checkColumnsExist(): Promise<boolean> {
  try {
    const result = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_plans' 
      AND column_name IN ('montant_declare', 'montant_non_declare')
    `);
    
    return result.rows.length === 2;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des colonnes:', error);
    return false;
  }
}

/**
 * Exécute le script SQL de migration
 */
async function runMigration() {
  console.log('🚀 Démarrage de la migration...\n');

  try {
    // Vérifier la connexion à la base de données
    console.log('📡 Connexion à la base de données...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connexion établie\n');

    // Vérifier si les colonnes existent déjà
    console.log('🔍 Vérification de l\'état actuel de la table...');
    const columnsExist = await checkColumnsExist();
    
    if (columnsExist) {
      console.log('⚠️  Les colonnes montant_declare et montant_non_declare existent déjà.');
      console.log('   Aucune migration nécessaire.\n');
      return;
    }

    console.log('📝 Les colonnes n\'existent pas encore. Migration nécessaire.\n');

    // Lire le fichier SQL de migration
    console.log('📖 Lecture du fichier de migration...');
    const migrationPath = path.join(__dirname, 'add-declared-amounts-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Fichier de migration chargé\n');

    // Exécuter la migration
    console.log('⚙️  Exécution de la migration...');
    await query(migrationSQL);
    console.log('✅ Migration exécutée avec succès\n');

    // Vérifier que les colonnes ont été ajoutées
    console.log('🔍 Vérification post-migration...');
    const result = await query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payment_plans' 
      AND column_name IN ('montant_declare', 'montant_non_declare')
      ORDER BY column_name
    `);

    if (result.rows.length === 2) {
      console.log('✅ Vérification réussie. Colonnes ajoutées:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default}, nullable: ${row.is_nullable})`);
      });
    } else {
      console.error('❌ Erreur: Les colonnes n\'ont pas été ajoutées correctement');
    }

    // Afficher un résumé des données
    console.log('\n📊 Résumé des données dans payment_plans:');
    const summary = await query(`
      SELECT 
        COUNT(*) as total_plans,
        COUNT(montant_declare) as plans_with_declare,
        COUNT(montant_non_declare) as plans_with_non_declare,
        SUM(montant_declare) as total_declare,
        SUM(montant_non_declare) as total_non_declare
      FROM payment_plans
    `);

    if (summary.rows.length > 0) {
      const stats = summary.rows[0];
      console.log(`   Total de plans: ${stats.total_plans}`);
      console.log(`   Plans avec montant_declare: ${stats.plans_with_declare}`);
      console.log(`   Plans avec montant_non_declare: ${stats.plans_with_non_declare}`);
      console.log(`   Total déclaré: ${stats.total_declare || 0} DH`);
      console.log(`   Total non déclaré: ${stats.total_non_declare || 0} DH`);
    }

    console.log('\n🎉 Migration terminée avec succès!');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    // Fermer la connexion
    await pool.end();
    console.log('\n👋 Connexion fermée');
  }
}

// Exécuter la migration
runMigration()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script terminé avec des erreurs:', error);
    process.exit(1);
  });

