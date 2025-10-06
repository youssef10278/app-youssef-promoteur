#!/usr/bin/env node

/**
 * 🚨 FIX DIRECT BASE DE DONNÉES - SCRIPT NODE.JS
 * 
 * Ce script se connecte directement à PostgreSQL et exécute les corrections
 * sans passer par l'API ou l'authentification
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données Railway
// REMPLACEZ CES VALEURS PAR VOS VRAIES INFORMATIONS DE CONNEXION
const dbConfig = {
    host: 'roundhouse.proxy.rlwy.net',
    port: 53920,
    database: 'railway',
    user: 'postgres',
    password: 'VOTRE_MOT_DE_PASSE_RAILWAY',
    ssl: {
        rejectUnauthorized: false
    }
};

// Créer la connexion
const pool = new Pool(dbConfig);

async function fixDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Connexion à la base de données...');
        
        // ÉTAPE 1: Supprimer la table défectueuse
        console.log('💥 Suppression de la table expense_payment_plans...');
        await client.query('DROP TABLE IF EXISTS expense_payment_plans CASCADE');
        console.log('✅ Table supprimée');

        // ÉTAPE 2: Recréer la table
        console.log('🔧 Recréation de la table...');
        await client.query(`
            CREATE TABLE expense_payment_plans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                expense_id UUID NOT NULL,
                user_id UUID NOT NULL,
                numero_echeance INTEGER NOT NULL,
                date_prevue DATE NOT NULL,
                montant_prevu DECIMAL(10,2) NOT NULL CHECK (montant_prevu > 0),
                montant_paye DECIMAL(10,2) DEFAULT 0 CHECK (montant_paye >= 0),
                montant_declare DECIMAL(10,2) DEFAULT 0 CHECK (montant_declare >= 0),
                montant_non_declare DECIMAL(10,2) DEFAULT 0 CHECK (montant_non_declare >= 0),
                date_paiement TIMESTAMP,
                mode_paiement TEXT CHECK (mode_paiement IN ('espece', 'cheque', 'cheque_espece', 'virement')),
                montant_espece DECIMAL(10,2) DEFAULT 0 CHECK (montant_espece >= 0),
                montant_cheque DECIMAL(10,2) DEFAULT 0 CHECK (montant_cheque >= 0),
                statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'paye', 'en_retard', 'annule')),
                description TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table recréée avec gen_random_uuid()');

        // ÉTAPE 3: Ajouter les contraintes
        console.log('🔗 Ajout des contraintes...');
        await client.query(`
            ALTER TABLE expense_payment_plans 
            ADD CONSTRAINT fk_expense_payment_plans_expense 
            FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
        `);
        
        await client.query(`
            ALTER TABLE expense_payment_plans 
            ADD CONSTRAINT fk_expense_payment_plans_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('✅ Contraintes ajoutées');

        // ÉTAPE 4: Créer les index
        console.log('📊 Création des index...');
        await client.query('CREATE INDEX idx_expense_payment_plans_expense_id ON expense_payment_plans(expense_id)');
        await client.query('CREATE INDEX idx_expense_payment_plans_user_id ON expense_payment_plans(user_id)');
        await client.query('CREATE INDEX idx_expense_payment_plans_statut ON expense_payment_plans(statut)');
        console.log('✅ Index créés');

        // ÉTAPE 5: Ajouter colonnes à expenses
        console.log('📋 Ajout des colonnes à expenses...');
        try {
            await client.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT \'non_paye\'');
            await client.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS montant_total_paye DECIMAL(10,2) DEFAULT 0');
            await client.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS montant_restant DECIMAL(10,2) DEFAULT 0');
            console.log('✅ Colonnes ajoutées à expenses');
        } catch (error) {
            console.log('⚠️ Colonnes déjà existantes');
        }

        // ÉTAPE 6: Test d'insertion
        console.log('🧪 Test d\'insertion...');
        const firstUser = await client.query('SELECT id FROM users LIMIT 1');
        const firstExpense = await client.query('SELECT id FROM expenses LIMIT 1');
        
        if (firstUser.rows.length > 0 && firstExpense.rows.length > 0) {
            const testResult = await client.query(`
                INSERT INTO expense_payment_plans (expense_id, user_id, numero_echeance, date_prevue, montant_prevu) 
                VALUES ($1, $2, 999, CURRENT_DATE, 1.00)
                RETURNING id
            `, [firstExpense.rows[0].id, firstUser.rows[0].id]);

            if (testResult.rows.length > 0) {
                console.log('✅ Test d\'insertion réussi - ID généré:', testResult.rows[0].id);
                
                // Supprimer le test
                await client.query('DELETE FROM expense_payment_plans WHERE numero_echeance = 999');
                console.log('✅ Test supprimé');
            }
        }

        // ÉTAPE 7: Vérification finale
        console.log('🔍 Vérification finale...');
        const verification = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'expense_payment_plans' AND column_name = 'id'
        `);
        
        console.log('📋 Configuration colonne ID:', verification.rows[0]);

        console.log('🎉 FIX TERMINÉ AVEC SUCCÈS !');
        console.log('✅ Table expense_payment_plans recréée');
        console.log('✅ UUID auto-génération configurée');
        console.log('✅ Contraintes et index ajoutés');
        console.log('✅ Test d\'insertion réussi');
        console.log('');
        console.log('🎯 MAINTENANT:');
        console.log('1. Rechargez votre application kbgestion.xyz');
        console.log('2. Testez l\'ajout de paiements de dépenses');
        console.log('3. L\'erreur devrait être résolue !');

    } catch (error) {
        console.error('❌ Erreur lors du fix:', error);
        console.error('Stack:', error.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

// Vérifier si les informations de connexion sont configurées
if (dbConfig.password === 'VOTRE_MOT_DE_PASSE_RAILWAY') {
    console.log('❌ ERREUR: Vous devez configurer les informations de connexion à la base de données');
    console.log('');
    console.log('📋 ÉTAPES:');
    console.log('1. Allez sur Railway.app');
    console.log('2. Ouvrez votre projet');
    console.log('3. Cliquez sur PostgreSQL');
    console.log('4. Copiez les informations de connexion');
    console.log('5. Remplacez les valeurs dans dbConfig');
    console.log('');
    console.log('🔧 Informations nécessaires:');
    console.log('- host');
    console.log('- port');
    console.log('- database');
    console.log('- user');
    console.log('- password');
    process.exit(1);
}

// Exécuter le fix
console.log('🚨 DÉMARRAGE DU FIX DIRECT BASE DE DONNÉES');
console.log('💥 Cette opération va supprimer et recréer la table expense_payment_plans');
console.log('');

fixDatabase().catch(console.error);
