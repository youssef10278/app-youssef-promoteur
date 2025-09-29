// Script de test pour vérifier l'ajout de chèques avec les dépenses
const API_BASE_URL = 'http://localhost:3001/api';

async function testExpenseWithCheck() {
  try {
    console.log('🧪 Test de création d\'une dépense avec chèque...');
    
    // 1. D'abord, récupérer un token d'authentification
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'abranto.shop@gmail.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Échec de la connexion');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');
    
    // 2. Récupérer les projets
    const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const projectsData = await projectsResponse.json();
    const projects = projectsData.data || [];
    
    if (projects.length === 0) {
      throw new Error('Aucun projet trouvé');
    }
    
    const projectId = projects[0].id;
    console.log(`✅ Projet trouvé: ${projects[0].nom} (${projectId})`);
    
    // 3. Créer une dépense
    const expenseData = {
      project_id: projectId,
      nom: 'Test dépense avec chèque',
      montant_declare: 1000,
      montant_non_declare: 0,
      methode_paiement: 'cheque',
      description: 'Test de création de chèque via dépense'
    };
    
    const expenseResponse = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData)
    });
    
    if (!expenseResponse.ok) {
      const errorText = await expenseResponse.text();
      throw new Error(`Erreur création dépense: ${errorText}`);
    }
    
    const expenseResult = await expenseResponse.json();
    const expenseId = expenseResult.data.id;
    console.log(`✅ Dépense créée: ${expenseId}`);
    
    // 4. Créer un chèque associé à cette dépense
    const checkData = {
      project_id: projectId,
      expense_id: expenseId,
      type_cheque: 'donne',
      montant: 1000,
      numero_cheque: 'TEST-001',
      nom_beneficiaire: 'Fournisseur Test',
      nom_emetteur: 'Promoteur Test',
      date_emission: new Date().toISOString().split('T')[0],
      statut: 'emis',
      description: 'Chèque de test pour dépense'
    };
    
    const checkResponse = await fetch(`${API_BASE_URL}/checks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkData)
    });
    
    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      throw new Error(`Erreur création chèque: ${errorText}`);
    }
    
    const checkResult = await checkResponse.json();
    console.log(`✅ Chèque créé: ${checkResult.data.id}`);
    
    // 5. Vérifier que le chèque apparaît dans la liste
    const checksResponse = await fetch(`${API_BASE_URL}/checks?type=donne`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const checksData = await checksResponse.json();
    const checks = checksData.data || [];
    
    const testCheck = checks.find(check => check.id === checkResult.data.id);
    
    if (testCheck) {
      console.log('✅ Chèque trouvé dans la liste des chèques donnés');
      console.log('📋 Détails du chèque:', {
        id: testCheck.id,
        type: testCheck.type_cheque,
        montant: testCheck.montant,
        statut: testCheck.statut,
        numero: testCheck.numero_cheque,
        beneficiaire: testCheck.nom_beneficiaire,
        emetteur: testCheck.nom_emetteur
      });
    } else {
      console.log('❌ Chèque non trouvé dans la liste');
    }
    
    console.log('🎉 Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testExpenseWithCheck();

