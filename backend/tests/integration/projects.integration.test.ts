import request from 'supertest';
import express from 'express';
import projectRoutes from '../../src/routes/projects';
import authRoutes from '../../src/routes/auth';
import { pool } from '../../src/config/database';

// Créer une app de test
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

describe('Projects API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;

  // Créer un utilisateur et obtenir un token avant tous les tests
  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testprojects@example.com',
        password: 'password123',
        nom: 'Test Projects User',
      });

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  });

  // Nettoyer après chaque test
  afterEach(async () => {
    await pool.query('DELETE FROM projects WHERE user_id = $1', [userId]);
  });

  // Fermer la connexion après tous les tests
  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['testprojects@example.com']);
    await pool.end();
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        nom: 'Test Project',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: 1000,
        nombre_lots: 10,
        nombre_appartements: 8,
        nombre_garages: 2,
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nom).toBe(projectData.nom);
      expect(response.body.data.localisation).toBe(projectData.localisation);
      expect(response.body.data.surface_totale).toBe(projectData.surface_totale);
      expect(response.body.data.id).toBeDefined();

      projectId = response.body.data.id;
    });

    it('should reject project creation without authentication', async () => {
      const projectData = {
        nom: 'Test Project',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: 1000,
        nombre_lots: 10,
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid project data', async () => {
      const invalidData = {
        nom: 'T', // Trop court
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: -100, // Négatif
        nombre_lots: 0, // Zéro
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should set default values for optional fields', async () => {
      const projectData = {
        nom: 'Test Project',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: 1000,
        nombre_lots: 10,
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.data.nombre_appartements).toBe(0);
      expect(response.body.data.nombre_garages).toBe(0);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Créer quelques projets de test
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Project 1',
          localisation: 'Location 1',
          societe: 'Company 1',
          surface_totale: 1000,
          nombre_lots: 10,
        });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Project 2',
          localisation: 'Location 2',
          societe: 'Company 2',
          surface_totale: 2000,
          nombre_lots: 20,
        });
    });

    it('should get all user projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Test Project',
          localisation: 'Test Location',
          societe: 'Test Company',
          surface_totale: 1000,
          nombre_lots: 10,
        });

      projectId = response.body.data.id;
    });

    it('should get a specific project', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(projectId);
      expect(response.body.data.nom).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Original Project',
          localisation: 'Original Location',
          societe: 'Original Company',
          surface_totale: 1000,
          nombre_lots: 10,
        });

      projectId = response.body.data.id;
    });

    it('should update a project', async () => {
      const updateData = {
        nom: 'Updated Project',
        localisation: 'Updated Location',
        societe: 'Updated Company',
        surface_totale: 2000,
        nombre_lots: 20,
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nom).toBe('Updated Project');
      expect(response.body.data.surface_totale).toBe(2000);
    });

    it('should reject invalid update data', async () => {
      const invalidData = {
        surface_totale: -100,
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Project to Delete',
          localisation: 'Test Location',
          societe: 'Test Company',
          surface_totale: 1000,
          nombre_lots: 10,
        });

      projectId = response.body.data.id;
    });

    it('should delete a project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Vérifier que le projet n'existe plus
      const checkResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(checkResponse.body.success).toBe(false);
    });

    it('should return 404 when deleting non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

