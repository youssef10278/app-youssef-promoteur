// Script de diagnostic de la table expenses
const { Pool } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
  config.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(config);

async function diagnoseExpensesTable() {
  console.log('🔍 DIAGNOSTIC DE LA TABLE EXPENSES');
  console.log('=' .repeat(50));

  try {
    // 1. Structure de la table expenses
    console.log('\n📋 Structure de la table expenses:');
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        is_generated,
        generation_expression
      FROM information_schema.columns 
      WHERE table_name = 'expenses' 
      ORDER BY ordinal_position
    `);

    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      if (col.column_default) console.log(`    Default: ${col.column_default}`);
      if (col.is_generated === 'ALWAYS') console.log(`    Generated: ${col.generation_expression}`);
    });

    // 2. Contraintes
    console.log('\n🔒 Contraintes:');
    const constraints = await pool.query(`
      SELECT 
        constraint_name, 
        constraint_type,
        check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'expenses'
    `);

    constraints.rows.forEach(constraint => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
      if (constraint.check_clause) console.log(`    Check: ${constraint.check_clause}`);
    });

    // 3. Index
    console.log('\n📊 Index:');
    const indexes = await pool.query(`
      SELECT 
        indexname, 
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'expenses'
    `);

    indexes.rows.forEach(index => {
      console.log(`  - ${index.indexname}`);
      console.log(`    ${index.indexdef}`);
    });

    // 4. Données d'exemple
    console.log('\n📄 Exemple de données (5 premières lignes):');
    const sampleData = await pool.query(`
      SELECT id, nom, montant_total, montant_declare, montant_non_declare, statut, created_at
      FROM expenses 
      LIMIT 5
    `);

    sampleData.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} - Total: ${row.montant_total} - Statut: ${row.statut || 'NULL'}`);
    });

    // 5. Vérifier si expense_payments existe
    console.log('\n🔍 Table expense_payments:');
    const paymentsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expense_payments'
      ) as exists
    `);

    if (paymentsExists.rows[0].exists) {
      console.log('✅ Table expense_payments existe');
      
      const paymentsCount = await pool.query('SELECT COUNT(*) as count FROM expense_payments');
      console.log(`   Nombre de paiements: ${paymentsCount.rows[0].count}`);
    } else {
      console.log('❌ Table expense_payments n\'existe pas');
    }

    // 6. Vérifier si la vue existe
    console.log('\n🔍 Vue expenses_with_totals:');
    const viewExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_name = 'expenses_with_totals'
      ) as exists
    `);

    if (viewExists.rows[0].exists) {
      console.log('✅ Vue expenses_with_totals existe');
      
      try {
        const viewTest = await pool.query('SELECT COUNT(*) as count FROM expenses_with_totals LIMIT 1');
        console.log(`   Vue accessible, ${viewTest.rows[0].count} dépenses`);
      } catch (error) {
        console.log(`❌ Erreur lors de l'accès à la vue: ${error.message}`);
      }
    } else {
      console.log('❌ Vue expenses_with_totals n\'existe pas');
    }

    console.log('\n✅ Diagnostic terminé');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

diagnoseExpensesTable();
