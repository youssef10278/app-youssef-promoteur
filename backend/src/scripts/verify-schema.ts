/**
 * Script de vérification du schéma de la base de données
 * Vérifie que toutes les colonnes nécessaires existent
 * 
 * Usage:
 *   npm run verify:schema
 *   ou
 *   ts-node src/scripts/verify-schema.ts
 */

import { Pool } from 'pg';
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

interface ColumnInfo {
  column_name: string;
  data_type: string;
  column_default: string | null;
  is_nullable: string;
}

interface TableCheck {
  table: string;
  requiredColumns: string[];
}

/**
 * Vérifie qu'une table existe
 */
async function tableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

/**
 * Récupère les informations sur les colonnes d'une table
 */
async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const result = await pool.query<ColumnInfo>(
    `SELECT column_name, data_type, column_default, is_nullable
     FROM information_schema.columns 
     WHERE table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );
  return result.rows;
}

/**
 * Vérifie qu'une colonne existe dans une table
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    )`,
    [tableName, columnName]
  );
  return result.rows[0].exists;
}

/**
 * Affiche un résumé des données
 */
async function getDataSummary() {
  const queries = [
    {
      name: 'Payment Plans',
      query: `SELECT 
        COUNT(*) as total,
        COUNT(montant_declare) as with_declare,
        COUNT(montant_non_declare) as with_non_declare,
        COALESCE(SUM(montant_declare), 0) as total_declare,
        COALESCE(SUM(montant_non_declare), 0) as total_non_declare
      FROM payment_plans`
    },
    {
      name: 'Sales',
      query: `SELECT COUNT(*) as total FROM sales`
    },
    {
      name: 'Projects',
      query: `SELECT COUNT(*) as total FROM projects`
    }
  ];

  console.log('\n📊 RÉSUMÉ DES DONNÉES\n');
  
  for (const q of queries) {
    try {
      const result = await pool.query(q.query);
      console.log(`${q.name}:`);
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('');
    } catch (error) {
      console.log(`${q.name}: ❌ Erreur`);
      console.log('');
    }
  }
}

/**
 * Fonction principale de vérification
 */
async function verifySchema() {
  console.log('🔍 VÉRIFICATION DU SCHÉMA DE LA BASE DE DONNÉES\n');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Vérifier la connexion
    console.log('📡 Connexion à la base de données...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connexion établie\n');

    // Tables à vérifier
    const tablesToCheck: TableCheck[] = [
      {
        table: 'users',
        requiredColumns: ['id', 'email', 'password_hash', 'nom']
      },
      {
        table: 'projects',
        requiredColumns: ['id', 'nom', 'user_id']
      },
      {
        table: 'sales',
        requiredColumns: ['id', 'project_id', 'user_id', 'prix_total', 'client_nom']
      },
      {
        table: 'payment_plans',
        requiredColumns: [
          'id', 
          'sale_id', 
          'user_id', 
          'montant_prevu', 
          'montant_paye',
          'montant_declare',      // ⭐ COLONNE CRITIQUE
          'montant_non_declare'   // ⭐ COLONNE CRITIQUE
        ]
      },
      {
        table: 'expenses',
        requiredColumns: ['id', 'project_id', 'user_id', 'nom']
      },
      {
        table: 'checks',
        requiredColumns: ['id', 'user_id', 'montant', 'type_cheque']
      }
    ];

    let allOk = true;

    // Vérifier chaque table
    for (const check of tablesToCheck) {
      console.log(`\n📋 Table: ${check.table}`);
      console.log('-'.repeat(60));

      // Vérifier que la table existe
      const exists = await tableExists(check.table);
      if (!exists) {
        console.log(`❌ La table ${check.table} n'existe pas`);
        allOk = false;
        continue;
      }

      console.log(`✅ La table existe`);

      // Récupérer toutes les colonnes
      const columns = await getTableColumns(check.table);
      console.log(`   Nombre de colonnes: ${columns.length}`);

      // Vérifier les colonnes requises
      const missingColumns: string[] = [];
      for (const requiredCol of check.requiredColumns) {
        const exists = await columnExists(check.table, requiredCol);
        if (!exists) {
          missingColumns.push(requiredCol);
        }
      }

      if (missingColumns.length > 0) {
        console.log(`\n❌ Colonnes manquantes:`);
        missingColumns.forEach(col => {
          console.log(`   - ${col}`);
          if (col === 'montant_declare' || col === 'montant_non_declare') {
            console.log(`     ⚠️  CRITIQUE: Cette colonne est nécessaire pour la modification des paiements`);
          }
        });
        allOk = false;
      } else {
        console.log(`✅ Toutes les colonnes requises sont présentes`);
      }

      // Afficher les colonnes importantes pour payment_plans
      if (check.table === 'payment_plans') {
        console.log(`\n📝 Colonnes importantes:`);
        const importantCols = columns.filter(c => 
          ['montant_prevu', 'montant_paye', 'montant_declare', 'montant_non_declare', 'mode_paiement'].includes(c.column_name)
        );
        importantCols.forEach(col => {
          const status = check.requiredColumns.includes(col.column_name) ? '✅' : '  ';
          console.log(`   ${status} ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
        });
      }
    }

    // Afficher le résumé des données
    await getDataSummary();

    // Résultat final
    console.log('='.repeat(60));
    if (allOk) {
      console.log('\n✅ SCHÉMA VALIDE - Toutes les tables et colonnes sont présentes\n');
      console.log('🎉 Vous pouvez utiliser l\'application sans problème\n');
    } else {
      console.log('\n❌ SCHÉMA INCOMPLET - Des tables ou colonnes sont manquantes\n');
      console.log('🔧 Actions recommandées:');
      console.log('   1. Exécuter la migration principale: npm run migrate');
      console.log('   2. Exécuter la migration des colonnes déclarées: npm run migrate:declared-amounts');
      console.log('   3. Re-vérifier le schéma: npm run verify:schema\n');
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('👋 Connexion fermée\n');
  }
}

// Exécuter la vérification
verifySchema()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script terminé avec des erreurs:', error);
    process.exit(1);
  });

