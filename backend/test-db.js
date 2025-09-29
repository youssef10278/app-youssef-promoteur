const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'promoteur_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testDatabase() {
  console.log('🔍 Test de la base de données...\n');

  try {
    // Test de connexion
    console.log('📡 Test de connexion...');
    const client = await pool.connect();
    console.log('✅ Connexion réussie\n');

    // Vérifier les tables
    console.log('📋 Vérification des tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables trouvées:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');

    // Compter les enregistrements dans chaque table
    const tables = ['users', 'projects', 'sales', 'expenses', 'checks', 'payment_plans'];
    
    console.log('📊 Nombre d\'enregistrements par table:');
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult.rows[0].count;
        console.log(`  - ${table}: ${count} enregistrements`);
      } catch (error) {
        console.log(`  - ${table}: ❌ Erreur (${error.message})`);
      }
    }
    console.log('');

    // Vérifier s'il y a des utilisateurs
    console.log('👥 Vérification des utilisateurs...');
    const usersResult = await client.query('SELECT id, email, nom FROM users LIMIT 5');
    if (usersResult.rows.length > 0) {
      console.log('Utilisateurs trouvés:');
      usersResult.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Nom: ${user.nom}`);
      });
    } else {
      console.log('❌ Aucun utilisateur trouvé');
    }
    console.log('');

    // Vérifier s'il y a des projets
    console.log('🏗️ Vérification des projets...');
    const projectsResult = await client.query('SELECT id, nom, user_id FROM projects LIMIT 5');
    if (projectsResult.rows.length > 0) {
      console.log('Projets trouvés:');
      projectsResult.rows.forEach(project => {
        console.log(`  - ID: ${project.id}, Nom: ${project.nom}, User ID: ${project.user_id}`);
      });
    } else {
      console.log('❌ Aucun projet trouvé');
    }
    console.log('');

    // Vérifier s'il y a des ventes
    console.log('💰 Vérification des ventes...');
    const salesResult = await client.query('SELECT id, prix_total, user_id FROM sales LIMIT 5');
    if (salesResult.rows.length > 0) {
      console.log('Ventes trouvées:');
      salesResult.rows.forEach(sale => {
        console.log(`  - ID: ${sale.id}, Prix: ${sale.prix_total}, User ID: ${sale.user_id}`);
      });
    } else {
      console.log('❌ Aucune vente trouvée');
    }
    console.log('');

    // Test d'une requête de statistiques
    console.log('📈 Test des statistiques des projets...');
    try {
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as active_projects,
          COUNT(CASE WHEN statut = 'termine' THEN 1 END) as completed_projects
        FROM projects 
        WHERE user_id = (SELECT id FROM users LIMIT 1)
      `);
      
      if (statsResult.rows.length > 0) {
        const stats = statsResult.rows[0];
        console.log('Statistiques des projets:');
        console.log(`  - Total: ${stats.total_projects}`);
        console.log(`  - Actifs: ${stats.active_projects}`);
        console.log(`  - Terminés: ${stats.completed_projects}`);
      }
    } catch (error) {
      console.log(`❌ Erreur lors du calcul des statistiques: ${error.message}`);
    }
    console.log('');

    client.release();
    console.log('✅ Test terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du test de la base de données:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Exécuter le test
testDatabase().catch(console.error);
