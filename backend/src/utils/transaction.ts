import { PoolClient } from 'pg';
import { pool } from '../config/database';
import logger from './logger';

/**
 * Exécute une fonction dans une transaction SQL
 * 
 * @param callback - Fonction à exécuter dans la transaction
 * @returns Le résultat de la fonction callback
 * 
 * @example
 * const result = await withTransaction(async (client) => {
 *   await client.query('UPDATE sales SET ...');
 *   await client.query('UPDATE payment_plans SET ...');
 *   return { success: true };
 * });
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    // Démarrer la transaction
    await client.query('BEGIN');
    logger.debug('Transaction started');
    
    // Exécuter le callback
    const result = await callback(client);
    
    // Commit si tout s'est bien passé
    await client.query('COMMIT');
    logger.debug('Transaction committed');
    
    return result;
  } catch (error) {
    // Rollback en cas d'erreur
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error });
    throw error;
  } finally {
    // Toujours libérer le client
    client.release();
  }
}

/**
 * Exécute une requête SQL dans le contexte d'un client (transaction ou non)
 * 
 * @param client - Client PostgreSQL (peut être un PoolClient ou le pool)
 * @param text - Requête SQL
 * @param params - Paramètres de la requête
 * @returns Résultat de la requête
 */
export async function executeQuery(
  client: PoolClient | typeof pool,
  text: string,
  params?: any[]
) {
  const start = Date.now();
  
  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    // Logger la requête
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        query: text,
        params,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    } else {
      logger.debug('Query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    logger.error('Query failed', {
      query: text,
      params,
      duration: `${duration}ms`,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Exécute plusieurs requêtes dans une transaction
 * Utile pour les opérations batch
 * 
 * @param queries - Array de requêtes à exécuter
 * @returns Array des résultats
 * 
 * @example
 * const results = await batchTransaction([
 *   { text: 'UPDATE sales SET ...', params: [id1] },
 *   { text: 'UPDATE payment_plans SET ...', params: [id2] },
 * ]);
 */
export async function batchTransaction(
  queries: Array<{ text: string; params?: any[] }>
): Promise<any[]> {
  return withTransaction(async (client) => {
    const results = [];
    
    for (const query of queries) {
      const result = await executeQuery(client, query.text, query.params);
      results.push(result);
    }
    
    return results;
  });
}

/**
 * Vérifie si une ressource existe avant de l'utiliser
 * Utile pour éviter les erreurs de foreign key
 * 
 * @param client - Client PostgreSQL
 * @param table - Nom de la table
 * @param id - ID de la ressource
 * @returns true si la ressource existe, false sinon
 */
export async function resourceExists(
  client: PoolClient | typeof pool,
  table: string,
  id: string
): Promise<boolean> {
  const result = await executeQuery(
    client,
    `SELECT EXISTS(SELECT 1 FROM ${table} WHERE id = $1)`,
    [id]
  );
  
  return result.rows[0].exists;
}

/**
 * Vérifie que l'utilisateur a accès à une ressource
 * 
 * @param client - Client PostgreSQL
 * @param table - Nom de la table
 * @param resourceId - ID de la ressource
 * @param userId - ID de l'utilisateur
 * @returns true si l'utilisateur a accès, false sinon
 */
export async function userHasAccess(
  client: PoolClient | typeof pool,
  table: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  const result = await executeQuery(
    client,
    `SELECT EXISTS(SELECT 1 FROM ${table} WHERE id = $1 AND user_id = $2)`,
    [resourceId, userId]
  );
  
  return result.rows[0].exists;
}

