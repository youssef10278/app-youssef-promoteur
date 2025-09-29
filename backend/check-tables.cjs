const { Client } = require('pg');

async function checkTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'promoteur_db',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Lister toutes les tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 Tables existantes:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Vérifier les ventes existantes
    const salesResult = await client.query('SELECT COUNT(*) as count FROM sales');
    console.log(`\n💰 Nombre de ventes existantes: ${salesResult.rows[0].count}`);

    if (salesResult.rows[0].count > 0) {
      const salesData = await client.query(`
        SELECT id, client_nom, prix_total, avance_declare, avance_non_declare, statut
        FROM sales 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('\n📊 Ventes existantes:');
      salesData.rows.forEach(sale => {
        console.log(`- ${sale.client_nom}: ${sale.prix_total} DH (${sale.statut})`);
      });
    }

    // Vérifier les payment_plans existants
    const plansResult = await client.query('SELECT COUNT(*) as count FROM payment_plans');
    console.log(`\n📅 Nombre de plans de paiement existants: ${plansResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkTables();
