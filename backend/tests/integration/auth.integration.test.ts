import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth';
import { pool } from '../../src/config/database';

// Créer une app de test
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Integration Tests', () => {
  // Nettoyer la base de données avant chaque test
  beforeEach(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  // Fermer la connexion après tous les tests
  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        nom: 'Test User',
        telephone: '0612345678',
        societe: 'Test Company',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.nom).toBe(userData.nom);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'password123',
        nom: 'Test User',
      };

      // Premier enregistrement
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Deuxième enregistrement avec le même email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('existe déjà');
    });

    it('should reject invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        nom: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const userData = {
        email: 'test3@example.com',
        password: '123',
        nom: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('6 caractères');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testlogin@example.com',
          password: 'password123',
          nom: 'Test Login User',
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('testlogin@example.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('incorrect');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('incorrect');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Créer et connecter un utilisateur
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testme@example.com',
          password: 'password123',
          nom: 'Test Me User',
        });

      authToken = response.body.data.token;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('testme@example.com');
      expect(response.body.data.nom).toBe('Test Me User');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('invalide');
    });
  });
});

