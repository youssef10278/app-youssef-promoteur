/**
 * Script pour corriger l'ENUM payment_method
 * Ajoute la valeur 'cheque_espece' qui est utilisée par le frontend
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
  // Configuration pour Railway
  ...(process.env.DATABASE_URL && {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
});

async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function fixPaymentMethodEnum() {
  console.log('🔧 Correction de l\'ENUM payment_method...');
  
  try {
    // Vérifier les valeurs actuelles de l'ENUM
    console.log('📋 Valeurs actuelles de payment_method:');
    const currentValues = await query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method') 
      ORDER BY enumsortorder
    `);
    
    currentValues.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    // Vérifier si 'cheque_espece' existe déjà
    const hasChequEspece = currentValues.rows.some(row => row.enumlabel === 'cheque_espece');
    
    if (hasChequEspece) {
      console.log('✅ La valeur "cheque_espece" existe déjà dans l\'ENUM');
    } else {
      console.log('➕ Ajout de la valeur "cheque_espece" à l\'ENUM...');
      
      // Ajouter la nouvelle valeur
      await query(`ALTER TYPE payment_method ADD VALUE 'cheque_espece'`);
      
      console.log('✅ Valeur "cheque_espece" ajoutée avec succès');
    }

    // Afficher les valeurs finales
    console.log('📋 Valeurs finales de payment_method:');
    const finalValues = await query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method') 
      ORDER BY enumsortorder
    `);
    
    finalValues.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    console.log('🎉 Correction terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  fixPaymentMethodEnum()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script échoué:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

export { fixPaymentMethodEnum };
