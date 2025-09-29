// Test final de l'API des chèques
const API_BASE_URL = 'http://localhost:3001/api';

async function testCheckFinal() {
  try {
    console.log('🧪 Test final de l\'API des chèques...');
    
    // 1. Connexion
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
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
      console.log('⚠️ Aucun projet trouvé, création d\'un projet de test...');
      
      const newProject = {
        nom: 'Projet Test',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: 1000,
        nombre_lots: 10,
        nombre_appartements: 8,
        nombre_garages: 2
      };
      
      const createProjectResponse = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject)
      });
      
      if (createProjectResponse.ok) {
        const projectData = await createProjectResponse.json();
        projects.push(projectData.data);
        console.log('✅ Projet de test créé');
      }
    }
    
    const projectId = projects[0].id;
    console.log(`✅ Projet: ${projects[0].nom} (${projectId})`);
    
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
      facture_recue: false,
      description: 'Chèque de test pour dépense'
    };
    
    console.log('📤 Création du chèque:', checkData);
    
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
    
    // 5. Vérifier que le chèque apparaît dans la liste des chèques donnés
    const checksResponse = await fetch(`${API_BASE_URL}/checks?type=donne`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const checksData = await checksResponse.json();
    const checks = checksData.data || [];
    
    const donneChecks = checks.filter(check => check.type_cheque === 'donne');
    console.log(`\n📋 ${donneChecks.length} chèques donnés trouvés:`);
    
    donneChecks.forEach((check, index) => {
      console.log(`  ${index + 1}. ${check.numero_cheque} - ${check.montant} DH - ${check.statut}`);
      console.log(`     Bénéficiaire: ${check.nom_beneficiaire}`);
      console.log(`     Émetteur: ${check.nom_emetteur}`);
      console.log(`     Description: ${check.description}`);
      console.log('');
    });
    
    // Vérifier si notre chèque de test est dans la liste
    const testCheck = donneChecks.find(check => check.numero_cheque === 'TEST-001');
    if (testCheck) {
      console.log('🎉 SUCCÈS: Le chèque de test est bien dans la liste des chèques donnés !');
    } else {
      console.log('❌ PROBLÈME: Le chèque de test n\'est pas dans la liste');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCheckFinal();

