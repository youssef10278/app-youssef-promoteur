#!/usr/bin/env node

/**
 * Script de test pour vérifier l'affichage des montants détaillés dans les paiements
 * Ce script teste l'ajout et la modification de paiements avec montant principal et autre montant
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Fonction pour tester les montants détaillés des paiements
async function testPaymentDetailedAmounts() {
  console.log('🧪 Test des montants détaillés des paiements');
  console.log('============================================');

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
    const token = loginResponse.data?.token || loginData.data?.token;
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

    // 3. Créer une vente de test
    console.log('\n3. ➕ Création d\'une vente de test...');
    const testSale = {
      project_id: projectId,
      type_propriete: 'appartement',
      unite_numero: 'TEST-001',
      client_nom: 'Client Test Montants',
      client_telephone: '0612345678',
      client_email: 'client@test.com',
      client_adresse: 'Adresse Test',
      surface: 80,
      prix_total: 500000,
      description: 'Vente de test pour les montants détaillés',
      premier_paiement: {
        montant: 100000,
        montant_declare: 80000,
        montant_non_declare: 20000,
        date_paiement: new Date().toISOString().split('T')[0],
        mode_paiement: 'espece',
        notes: 'Premier paiement de test'
      }
    };

    const createSaleResponse = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testSale)
    });

    if (!createSaleResponse.ok) {
      console.error('❌ Erreur lors de la création de la vente:', await createSaleResponse.text());
      return;
    }

    const createdSale = await createSaleResponse.json();
    const saleId = createdSale.data.id;
    console.log(`✅ Vente créée avec l'ID: ${saleId}`);

    // 4. Vérifier que la vente a été créée avec les montants détaillés
    console.log('\n4. 🔍 Vérification de la vente créée...');
    const saleResponse = await fetch(`${API_BASE_URL}/sales/${saleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!saleResponse.ok) {
      console.error('❌ Erreur lors de la récupération de la vente');
      return;
    }

    const saleData = await saleResponse.json();
    const sale = saleData.data;
    console.log('✅ Vente récupérée avec succès');

    // Vérifier les montants du premier paiement
    if (sale.payment_plans && sale.payment_plans.length > 0) {
      const firstPayment = sale.payment_plans[0];
      console.log('📊 Premier paiement:', {
        montant_paye: firstPayment.montant_paye,
        montant_declare: firstPayment.montant_declare,
        montant_non_declare: firstPayment.montant_non_declare
      });

      // Vérifications
      const checks = [
        { field: 'montant_paye', expected: 100000, actual: firstPayment.montant_paye },
        { field: 'montant_declare', expected: 80000, actual: firstPayment.montant_declare },
        { field: 'montant_non_declare', expected: 20000, actual: firstPayment.montant_non_declare }
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
        console.log('\n🎉 Tous les montants détaillés du premier paiement sont corrects !');
      } else {
        console.log('\n❌ Certains montants détaillés du premier paiement sont incorrects');
      }
    }

    // 5. Ajouter un deuxième paiement avec montants détaillés
    console.log('\n5. ➕ Ajout d\'un deuxième paiement...');
    const secondPayment = {
      montant: 150000,
      montant_declare: 120000,
      montant_non_declare: 30000,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'cheque',
      notes: 'Deuxième paiement de test'
    };

    const addPaymentResponse = await fetch(`${API_BASE_URL}/sales/${saleId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(secondPayment)
    });

    if (!addPaymentResponse.ok) {
      console.error('❌ Erreur lors de l\'ajout du deuxième paiement:', await addPaymentResponse.text());
      return;
    }

    console.log('✅ Deuxième paiement ajouté avec succès');

    // 6. Vérifier que le deuxième paiement a été ajouté avec les montants détaillés
    console.log('\n6. 🔍 Vérification du deuxième paiement...');
    const updatedSaleResponse = await fetch(`${API_BASE_URL}/sales/${saleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!updatedSaleResponse.ok) {
      console.error('❌ Erreur lors de la récupération de la vente mise à jour');
      return;
    }

    const updatedSaleData = await updatedSaleResponse.json();
    const updatedSale = updatedSaleData.data;

    if (updatedSale.payment_plans && updatedSale.payment_plans.length >= 2) {
      const secondPayment = updatedSale.payment_plans[1];
      console.log('📊 Deuxième paiement:', {
        montant_paye: secondPayment.montant_paye,
        montant_declare: secondPayment.montant_declare,
        montant_non_declare: secondPayment.montant_non_declare
      });

      // Vérifications
      const checks = [
        { field: 'montant_paye', expected: 150000, actual: secondPayment.montant_paye },
        { field: 'montant_declare', expected: 120000, actual: secondPayment.montant_declare },
        { field: 'montant_non_declare', expected: 30000, actual: secondPayment.montant_non_declare }
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
        console.log('\n🎉 Tous les montants détaillés du deuxième paiement sont corrects !');
      } else {
        console.log('\n❌ Certains montants détaillés du deuxième paiement sont incorrects');
      }
    }

    // 7. Calculer les totaux
    console.log('\n7. 📊 Calcul des totaux...');
    const totalPaid = updatedSale.payment_plans.reduce((sum, plan) => sum + (plan.montant_paye || 0), 0);
    const totalDeclare = updatedSale.payment_plans.reduce((sum, plan) => sum + (plan.montant_declare || 0), 0);
    const totalNonDeclare = updatedSale.payment_plans.reduce((sum, plan) => sum + (plan.montant_non_declare || 0), 0);

    console.log('📊 Totaux calculés:', {
      totalPaid,
      totalDeclare,
      totalNonDeclare,
      verification: totalDeclare + totalNonDeclare === totalPaid ? '✅ Correct' : '❌ Incorrect'
    });

    // 8. Nettoyer - Supprimer la vente de test
    console.log('\n8. 🧹 Nettoyage - Suppression de la vente de test...');
    const deleteResponse = await fetch(`${API_BASE_URL}/sales/${saleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Vente de test supprimée');
    } else {
      console.log('⚠️ Impossible de supprimer la vente de test');
    }

    console.log('\n🎉 Test des montants détaillés terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testPaymentDetailedAmounts();
