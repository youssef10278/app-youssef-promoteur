const { Client } = require('pg');

async function createTestData() {
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

    // Récupérer l'utilisateur et le projet existants
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', ['abranto.shop@gmail.com']);
    if (userResult.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    const userId = userResult.rows[0].id;
    console.log('✅ Utilisateur trouvé:', userId);

    const projectResult = await client.query('SELECT id FROM projects WHERE user_id = $1', [userId]);
    if (projectResult.rows.length === 0) {
      console.log('❌ Projet non trouvé');
      return;
    }
    const projectId = projectResult.rows[0].id;
    console.log('✅ Projet trouvé:', projectId);

    // Créer des unités de test
    console.log('📦 Création des unités de test...');
    
    // Créer un appartement
    const apartmentResult = await client.query(`
      INSERT INTO units (id, project_id, user_id, numero, type, surface, prix_unitaire, statut, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'A101', 'appartement', 85.5, 1200000, 'disponible', NOW())
      RETURNING id
    `, [projectId, userId]);
    const apartmentId = apartmentResult.rows[0].id;
    console.log('✅ Appartement créé:', apartmentId);

    // Créer un garage
    const garageResult = await client.query(`
      INSERT INTO units (id, project_id, user_id, numero, type, surface, prix_unitaire, statut, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'G001', 'garage', 15.0, 150000, 'disponible', NOW())
      RETURNING id
    `, [projectId, userId]);
    const garageId = garageResult.rows[0].id;
    console.log('✅ Garage créé:', garageId);

    // Créer une vente de test
    console.log('💰 Création d\'une vente de test...');
    const saleResult = await client.query(`
      INSERT INTO sales (
        id, project_id, unit_id, user_id, client_nom, client_telephone, client_email,
        prix_total, avance_declare, avance_non_declare, mode_paiement,
        avance_espece, avance_cheque, statut, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, 'Ahmed Benali', '+212600123456', 'ahmed.benali@email.com',
        1200000, 60000, 25000, 'cheque_espece',
        25000, 60000, 'en_cours', NOW()
      )
      RETURNING id
    `, [projectId, apartmentId, userId]);
    const saleId = saleResult.rows[0].id;
    console.log('✅ Vente créée:', saleId);

    // Créer des plans de paiement
    console.log('📅 Création des plans de paiement...');
    
    // Plan de paiement 1 - Avance initiale (sera automatiquement créé par le nouveau système)
    await client.query(`
      INSERT INTO payment_plans (
        id, sale_id, user_id, numero_echeance, description, montant_prevu, montant_paye,
        date_prevue, date_paiement, mode_paiement, montant_espece, montant_cheque, statut, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 1, 'Avance initiale (premier paiement)', 85000, 85000,
        CURRENT_DATE, NOW(), 'cheque_espece', 25000, 60000, 'paye', NOW()
      )
    `, [saleId, userId]);

    // Plan de paiement 2 - Deuxième échéance
    await client.query(`
      INSERT INTO payment_plans (
        id, sale_id, user_id, numero_echeance, description, montant_prevu, montant_paye,
        date_prevue, date_paiement, mode_paiement, montant_espece, montant_cheque, statut, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 2, 'Deuxième échéance', 200000, 200000,
        CURRENT_DATE + INTERVAL '30 days', NOW() - INTERVAL '5 days', 'cheque', 0, 200000, 'paye', NOW()
      )
    `, [saleId, userId]);

    // Plan de paiement 3 - Troisième échéance (non payée)
    await client.query(`
      INSERT INTO payment_plans (
        id, sale_id, user_id, numero_echeance, description, montant_prevu, montant_paye,
        date_prevue, mode_paiement, statut, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 3, 'Troisième échéance', 300000, 0,
        CURRENT_DATE + INTERVAL '60 days', 'virement', 'en_attente', NOW()
      )
    `, [saleId, userId]);

    console.log('✅ Plans de paiement créés');

    // Mettre à jour le statut de l'unité
    await client.query('UPDATE units SET statut = $1 WHERE id = $2', ['vendue', apartmentId]);
    console.log('✅ Statut de l\'unité mis à jour');

    // Créer une deuxième vente pour plus de tests
    console.log('💰 Création d\'une deuxième vente de test...');
    const sale2Result = await client.query(`
      INSERT INTO sales (
        id, project_id, unit_id, user_id, client_nom, client_telephone, client_email,
        prix_total, avance_declare, avance_non_declare, mode_paiement,
        avance_espece, avance_cheque, statut, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, 'Fatima Zahra', '+212661234567', 'fatima.zahra@email.com',
        150000, 30000, 15000, 'espece',
        45000, 0, 'en_cours', NOW()
      )
      RETURNING id
    `, [projectId, garageId, userId]);
    const sale2Id = sale2Result.rows[0].id;
    console.log('✅ Deuxième vente créée:', sale2Id);

    // Plan de paiement pour la deuxième vente - Avance initiale
    await client.query(`
      INSERT INTO payment_plans (
        id, sale_id, user_id, numero_echeance, description, montant_prevu, montant_paye,
        date_prevue, date_paiement, mode_paiement, montant_espece, montant_cheque, statut, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 1, 'Avance initiale (premier paiement)', 45000, 45000,
        CURRENT_DATE, NOW(), 'espece', 45000, 0, 'paye', NOW()
      )
    `, [sale2Id, userId]);

    // Plan de paiement pour la deuxième vente - Solde
    await client.query(`
      INSERT INTO payment_plans (
        id, sale_id, user_id, numero_echeance, description, montant_prevu, montant_paye,
        date_prevue, mode_paiement, statut, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 2, 'Solde final', 105000, 0,
        CURRENT_DATE + INTERVAL '15 days', 'espece', 'en_attente', NOW()
      )
    `, [sale2Id, userId]);

    // Mettre à jour le statut du garage
    await client.query('UPDATE units SET statut = $1 WHERE id = $2', ['vendue', garageId]);
    console.log('✅ Statut du garage mis à jour');

    console.log('\n🎉 Données de test créées avec succès !');
    console.log('📊 Résumé:');
    console.log('- 2 unités créées (1 appartement, 1 garage)');
    console.log('- 2 ventes créées');
    console.log('- 5 plans de paiement créés');
    console.log('- Vente 1: 285 000 DH payés sur 1 200 000 DH (23.75%)');
    console.log('- Vente 2: 45 000 DH payés sur 150 000 DH (30%)');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

createTestData();
