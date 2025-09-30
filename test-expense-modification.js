#!/usr/bin/env node

/**
 * Script de test pour vérifier la modification des dépenses
 * Ce script teste l'endpoint PUT /api/expenses/:id
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Fonction pour tester la modification d'une dépense
async function testExpenseModification() {
  console.log('🧪 Test de modification des dépenses');
  console.log('====================================');

  try {
    // 1. Se connecter pour obtenir un token
    console.log('\n1. 🔐 Connexion...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erreur de connexion:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');

    // 2. Récupérer les projets disponibles
    console.log('\n2. 📋 Récupération des projets...');
    const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!projectsResponse.ok) {
      console.error('❌ Erreur lors de la récupération des projets');
      return;
    }

    const projectsData = await projectsResponse.json();
    const projects = projectsData.data || [];
    console.log(`✅ ${projects.length} projets trouvés`);

    if (projects.length === 0) {
      console.log('⚠️ Aucun projet disponible pour le test');
      return;
    }

    const projectId = projects[0].id;
    console.log(`📋 Utilisation du projet: ${projects[0].nom} (ID: ${projectId})`);

    // 3. Créer une dépense de test
    console.log('\n3. ➕ Création d\'une dépense de test...');
    const testExpense = {
      project_id: projectId,
      nom: 'Test Modification Dépense',
      montant_declare: 1000,
      montant_non_declare: 200,
      methode_paiement: 'espece',
      description: 'Dépense de test pour la modification'
    };

    const createResponse = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testExpense)
    });

    if (!createResponse.ok) {
      console.error('❌ Erreur lors de la création de la dépense:', await createResponse.text());
      return;
    }

    const createdExpense = await createResponse.json();
    const expenseId = createdExpense.data.id;
    console.log(`✅ Dépense créée avec l'ID: ${expenseId}`);

    // 4. Modifier la dépense
    console.log('\n4. ✏️ Modification de la dépense...');
    const updatedExpense = {
      nom: 'Test Modification Dépense - MODIFIÉE',
      montant_declare: 1500,
      montant_non_declare: 300,
      methode_paiement: 'cheque',
      description: 'Dépense de test modifiée avec succès'
    };

    const updateResponse = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedExpense)
    });

    if (!updateResponse.ok) {
      console.error('❌ Erreur lors de la modification de la dépense:', await updateResponse.text());
      return;
    }

    const modifiedExpense = await updateResponse.json();
    console.log('✅ Dépense modifiée avec succès');
    console.log('📊 Données modifiées:', {
      nom: modifiedExpense.data.nom,
      montant_declare: modifiedExpense.data.montant_declare,
      montant_non_declare: modifiedExpense.data.montant_non_declare,
      methode_paiement: modifiedExpense.data.methode_paiement,
      description: modifiedExpense.data.description
    });

    // 5. Vérifier que la modification a bien été appliquée
    console.log('\n5. 🔍 Vérification de la modification...');
    const verifyResponse = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!verifyResponse.ok) {
      console.error('❌ Erreur lors de la vérification de la dépense');
      return;
    }

    const verifyData = await verifyResponse.json();
    const expense = verifyData.data;

    // Vérifications
    const checks = [
      { field: 'nom', expected: 'Test Modification Dépense - MODIFIÉE', actual: expense.nom },
      { field: 'montant_declare', expected: 1500, actual: expense.montant_declare },
      { field: 'montant_non_declare', expected: 300, actual: expense.montant_non_declare },
      { field: 'methode_paiement', expected: 'cheque', actual: expense.methode_paiement },
      { field: 'description', expected: 'Dépense de test modifiée avec succès', actual: expense.description }
    ];

    let allChecksPassed = true;
    checks.forEach(check => {
      if (check.expected === check.actual) {
        console.log(`✅ ${check.field}: ${check.actual}`);
      } else {
        console.log(`❌ ${check.field}: attendu ${check.expected}, obtenu ${check.actual}`);
        allChecksPassed = false;
      }
    });

    if (allChecksPassed) {
      console.log('\n🎉 Tous les tests de modification ont réussi !');
    } else {
      console.log('\n❌ Certains tests de modification ont échoué');
    }

    // 6. Nettoyer - Supprimer la dépense de test
    console.log('\n6. 🧹 Nettoyage - Suppression de la dépense de test...');
    const deleteResponse = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Dépense de test supprimée');
    } else {
      console.log('⚠️ Impossible de supprimer la dépense de test');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testExpenseModification();
