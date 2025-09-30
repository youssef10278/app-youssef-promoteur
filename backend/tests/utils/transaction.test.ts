import { pool } from '../../src/config/database';
import { withTransaction, executeQuery, resourceExists, userHasAccess } from '../../src/utils/transaction';

describe('Transaction Utils', () => {
  // Créer une table de test
  beforeAll(async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_transactions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        value INTEGER NOT NULL
      )
    `);
  });

  // Nettoyer après chaque test
  afterEach(async () => {
    await pool.query('DELETE FROM test_transactions');
  });

  // Supprimer la table et fermer la connexion
  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS test_transactions');
    await pool.end();
  });

  describe('withTransaction', () => {
    it('should commit transaction on success', async () => {
      const result = await withTransaction(async (client) => {
        await client.query(
          'INSERT INTO test_transactions (name, value) VALUES ($1, $2)',
          ['test1', 100]
        );
        await client.query(
          'INSERT INTO test_transactions (name, value) VALUES ($1, $2)',
          ['test2', 200]
        );
        return { success: true };
      });

      expect(result.success).toBe(true);

      // Vérifier que les données ont été insérées
      const checkResult = await pool.query('SELECT COUNT(*) FROM test_transactions');
      expect(parseInt(checkResult.rows[0].count)).toBe(2);
    });

    it('should rollback transaction on error', async () => {
      try {
        await withTransaction(async (client) => {
          await client.query(
            'INSERT INTO test_transactions (name, value) VALUES ($1, $2)',
            ['test1', 100]
          );
          
          // Provoquer une erreur
          throw new Error('Test error');
        });
      } catch (error: any) {
        expect(error.message).toBe('Test error');
      }

      // Vérifier qu'aucune donnée n'a été insérée
      const checkResult = await pool.query('SELECT COUNT(*) FROM test_transactions');
      expect(parseInt(checkResult.rows[0].count)).toBe(0);
    });

    it('should rollback on SQL error', async () => {
      try {
        await withTransaction(async (client) => {
          await client.query(
            'INSERT INTO test_transactions (name, value) VALUES ($1, $2)',
            ['test1', 100]
          );
          
          // Provoquer une erreur SQL (colonne inexistante)
          await client.query(
            'INSERT INTO test_transactions (invalid_column) VALUES ($1)',
            ['test']
          );
        });
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Vérifier qu'aucune donnée n'a été insérée
      const checkResult = await pool.query('SELECT COUNT(*) FROM test_transactions');
      expect(parseInt(checkResult.rows[0].count)).toBe(0);
    });
  });

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const result = await executeQuery(
        pool,
        'INSERT INTO test_transactions (name, value) VALUES ($1, $2) RETURNING *',
        ['test', 100]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('test');
      expect(result.rows[0].value).toBe(100);
    });

    it('should throw error on invalid query', async () => {
      await expect(
        executeQuery(pool, 'SELECT * FROM non_existent_table', [])
      ).rejects.toThrow();
    });
  });

  describe('resourceExists', () => {
    it('should return true for existing resource', async () => {
      // Insérer une ressource de test
      const insertResult = await pool.query(
        'INSERT INTO test_transactions (name, value) VALUES ($1, $2) RETURNING id',
        ['test', 100]
      );
      const id = insertResult.rows[0].id;

      const exists = await resourceExists(pool, 'test_transactions', id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent resource', async () => {
      const exists = await resourceExists(pool, 'test_transactions', '99999');
      expect(exists).toBe(false);
    });
  });

  describe('userHasAccess', () => {
    // Créer une table de test avec user_id
    beforeAll(async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS test_user_resources (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL
        )
      `);
    });

    afterEach(async () => {
      await pool.query('DELETE FROM test_user_resources');
    });

    afterAll(async () => {
      await pool.query('DROP TABLE IF EXISTS test_user_resources');
    });

    it('should return true when user has access', async () => {
      const userId = 'user123';
      const insertResult = await pool.query(
        'INSERT INTO test_user_resources (user_id, name) VALUES ($1, $2) RETURNING id',
        [userId, 'test resource']
      );
      const resourceId = insertResult.rows[0].id;

      const hasAccess = await userHasAccess(pool, 'test_user_resources', resourceId, userId);
      expect(hasAccess).toBe(true);
    });

    it('should return false when user does not have access', async () => {
      const userId = 'user123';
      const otherUserId = 'user456';
      const insertResult = await pool.query(
        'INSERT INTO test_user_resources (user_id, name) VALUES ($1, $2) RETURNING id',
        [userId, 'test resource']
      );
      const resourceId = insertResult.rows[0].id;

      const hasAccess = await userHasAccess(pool, 'test_user_resources', resourceId, otherUserId);
      expect(hasAccess).toBe(false);
    });
  });
});

