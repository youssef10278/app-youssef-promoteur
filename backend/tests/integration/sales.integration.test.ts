import request from 'supertest';
import express from 'express';
import salesRoutes from '../../src/routes/sales';
import projectRoutes from '../../src/routes/projects';
import authRoutes from '../../src/routes/auth';
import { pool } from '../../src/config/database';

// Créer une app de test
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sales', salesRoutes);

describe('Sales API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;
  let saleId: string;

  // Créer un utilisateur et un projet avant tous les tests
  beforeAll(async () => {
    // Créer un utilisateur
    const authResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testsales@example.com',
        password: 'password123',
        nom: 'Test Sales User',
      });

    authToken = authResponse.body.data.token;
    userId = authResponse.body.data.user.id;

    // Créer un projet
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nom: 'Test Project for Sales',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: 1000,
        nombre_lots: 10,
      });

    projectId = projectResponse.body.data.id;
  });

  // Nettoyer après chaque test
  afterEach(async () => {
    await pool.query('DELETE FROM sales WHERE user_id = $1', [userId]);
  });

  // Fermer la connexion après tous les tests
  afterAll(async () => {
    await pool.query('DELETE FROM projects WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE email = $1', ['testsales@example.com']);
    await pool.end();
  });

  describe('POST /api/sales', () => {
    it('should create a new sale', async () => {
      const saleData = {
        project_id: projectId,
        type_propriete: 'appartement',
        unite_numero: 'A101',
        client_nom: 'Test Client',
        client_telephone: '0612345678',
        client_email: 'client@example.com',
        client_adresse: '123 Test Street',
        surface: 100,
        prix_total: 500000,
        description: 'Appartement 3 pièces',
        mode_paiement: 'cheque',
        avance_declare: 100000,
        avance_non_declare: 50000,
        reste_a_payer: 350000,
        statut: 'en_cours',
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client_nom).toBe(saleData.client_nom);
      expect(response.body.data.prix_total).toBe(saleData.prix_total);
      expect(response.body.data.id).toBeDefined();

      saleId = response.body.data.id;
    });

    it('should reject sale without authentication', async () => {
      const saleData = {
        project_id: projectId,
        type_propriete: 'appartement',
        unite_numero: 'A101',
        client_nom: 'Test Client',
        surface: 100,
        prix_total: 500000,
        description: 'Test',
        mode_paiement: 'cheque',
      };

      const response = await request(app)
        .post('/api/sales')
        .send(saleData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid sale data', async () => {
      const invalidData = {
        project_id: projectId,
        type_propriete: 'invalid_type', // Type invalide
        unite_numero: 'A101',
        client_nom: 'T', // Trop court
        surface: -100, // Négatif
        prix_total: 0, // Zéro
        description: 'Test',
        mode_paiement: 'invalid_mode', // Mode invalide
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject sale with non-existent project', async () => {
      const saleData = {
        project_id: '00000000-0000-0000-0000-000000000000',
        type_propriete: 'appartement',
        unite_numero: 'A101',
        client_nom: 'Test Client',
        surface: 100,
        prix_total: 500000,
        description: 'Test',
        mode_paiement: 'cheque',
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sales', () => {
    beforeEach(async () => {
      // Créer quelques ventes de test
      await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          type_propriete: 'appartement',
          unite_numero: 'A101',
          client_nom: 'Client 1',
          surface: 100,
          prix_total: 500000,
          description: 'Appartement 1',
          mode_paiement: 'cheque',
        });

      await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          type_propriete: 'garage',
          unite_numero: 'G01',
          client_nom: 'Client 2',
          surface: 20,
          prix_total: 100000,
          description: 'Garage 1',
          mode_paiement: 'espece',
        });
    });

    it('should get all user sales', async () => {
      const response = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter sales by project', async () => {
      const response = await request(app)
        .get(`/api/sales?project_id=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((sale: any) => {
        expect(sale.project_id).toBe(projectId);
      });
    });

    it('should filter sales by type', async () => {
      const response = await request(app)
        .get('/api/sales?type_propriete=appartement')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((sale: any) => {
        expect(sale.type_propriete).toBe('appartement');
      });
    });

    it('should search sales by client name', async () => {
      const response = await request(app)
        .get('/api/sales?search=Client 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/sales/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          type_propriete: 'appartement',
          unite_numero: 'A101',
          client_nom: 'Test Client',
          surface: 100,
          prix_total: 500000,
          description: 'Test Sale',
          mode_paiement: 'cheque',
        });

      saleId = response.body.data.id;
    });

    it('should get a specific sale', async () => {
      const response = await request(app)
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(saleId);
      expect(response.body.data.client_nom).toBe('Test Client');
    });

    it('should return 404 for non-existent sale', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/sales/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/sales/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          type_propriete: 'appartement',
          unite_numero: 'A101',
          client_nom: 'Original Client',
          surface: 100,
          prix_total: 500000,
          description: 'Original Sale',
          mode_paiement: 'cheque',
          statut: 'en_cours',
        });

      saleId = response.body.data.id;
    });

    it('should update a sale', async () => {
      const updateData = {
        client_nom: 'Updated Client',
        prix_total: 600000,
        statut: 'termine',
      };

      const response = await request(app)
        .put(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client_nom).toBe('Updated Client');
      expect(response.body.data.prix_total).toBe(600000);
      expect(response.body.data.statut).toBe('termine');
    });

    it('should reject invalid update data', async () => {
      const invalidData = {
        prix_total: -100,
      };

      const response = await request(app)
        .put(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/sales/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          type_propriete: 'appartement',
          unite_numero: 'A101',
          client_nom: 'Sale to Delete',
          surface: 100,
          prix_total: 500000,
          description: 'Test',
          mode_paiement: 'cheque',
        });

      saleId = response.body.data.id;
    });

    it('should delete a sale', async () => {
      const response = await request(app)
        .delete(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Vérifier que la vente n'existe plus
      const checkResponse = await request(app)
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(checkResponse.body.success).toBe(false);
    });
  });

  describe('GET /api/sales/stats', () => {
    beforeEach(async () => {
      // Créer des ventes avec différents statuts
      await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          type_propriete: 'appartement',
          unite_numero: 'A101',
          client_nom: 'Client 1',
          surface: 100,
          prix_total: 500000,
          description: 'Test',
          mode_paiement: 'cheque',
          statut: 'termine',
        });

      await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          type_propriete: 'appartement',
          unite_numero: 'A102',
          client_nom: 'Client 2',
          surface: 100,
          prix_total: 600000,
          description: 'Test',
          mode_paiement: 'espece',
          statut: 'en_cours',
        });
    });

    it('should get sales statistics', async () => {
      const response = await request(app)
        .get('/api/sales/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalVentes');
      expect(response.body.data).toHaveProperty('ventesFinalisees');
      expect(response.body.data).toHaveProperty('montantTotal');
      expect(response.body.data).toHaveProperty('montantEncaisse');
    });
  });
});

