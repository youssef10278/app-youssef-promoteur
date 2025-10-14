import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { pool, closePool, query } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import des routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import salesRoutes from './routes/sales';
import expenseRoutes from './routes/expenses';
import checkRoutes from './routes/checks';
import paymentRoutes from './routes/payments';
import expensePaymentRoutes from './routes/expensePayments';
import migrateRoutes from './routes/migrate';
import companySettingsRoutes from './routes/companySettings';
import dataOperationsRoutes from './routes/dataOperations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Force redeploy for data operations routes - 2025-01-14 v2
console.log('🚀 Serveur démarré avec routes data-operations v2');

// Configuration CORS - Support de plusieurs domaines
const allowedOrigins = [
  'http://localhost:8080',
  'https://app-youssef-promoteur-production.up.railway.app',
  'https://www.kbgestion.xyz',
  'https://kbgestion.xyz'
];

// Ajouter les domaines depuis les variables d'environnement
if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  allowedOrigins.push(...envOrigins);
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permettre les requêtes sans origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Origine non autorisée: ${origin}`);
      callback(new Error('Non autorisé par la politique CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Rate limiting - Plus permissif pour le développement et production initiale
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute par défaut
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requêtes par minute par défaut
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting pour les requêtes de développement et Railway health checks
  skip: (req) => {
    // Skip pour localhost en développement
    if (process.env.NODE_ENV === 'development' &&
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    // Skip pour Railway health checks
    if (req.headers['user-agent']?.includes('RailwayHealthCheck')) {
      return true;
    }
    // Skip pour les IPs Railway internes
    if (req.ip?.startsWith('100.64.') || req.ip?.startsWith('::ffff:100.64.')) {
      return true;
    }
    return false;
  }
});

// Middlewares globaux
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Logging pour debug du rate limiting
app.use((req, res, next) => {
  console.log(`🔍 Request from IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
  next();
});

app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});


// Route de debug temporaire SANS authentification
app.get('/api/debug-data', async (req, res) => {
  try {
    console.log('🔍 DEBUG DATA - Début');

    const expensesResult = await query(
      `SELECT e.id, e.nom, e.project_id, e.user_id, e.montant_declare, e.montant_non_declare, p.nom as project_nom
       FROM expenses e
       LEFT JOIN projects p ON e.project_id = p.id
       ORDER BY e.created_at DESC`
    );

    const projectsResult = await query(
      `SELECT id, nom, user_id FROM projects ORDER BY created_at DESC`
    );

    const salesResult = await query(
      `SELECT s.*, p.nom as project_nom
       FROM sales s
       LEFT JOIN projects p ON s.project_id = p.id
       ORDER BY s.created_at DESC`
    );

    const paymentPlansResult = await query(
      `SELECT pp.*, s.client_nom, s.unite_numero, p.nom as project_nom
       FROM payment_plans pp
       LEFT JOIN sales s ON pp.sale_id = s.id
       LEFT JOIN projects p ON s.project_id = p.id
       ORDER BY pp.created_at DESC`
    );

    console.log('🔍 DEBUG - Toutes les dépenses:', expensesResult.rows);
    console.log('🔍 DEBUG - Tous les projets:', projectsResult.rows);
    console.log('🔍 DEBUG - Toutes les ventes:', salesResult.rows);
    console.log('🔍 DEBUG - Tous les plans de paiement:', paymentPlansResult.rows);

    res.json({
      success: true,
      data: {
        expenses: expensesResult.rows,
        projects: projectsResult.rows,
        sales: salesResult.rows,
        payment_plans: paymentPlansResult.rows
      }
    });
  } catch (error) {
    console.error('❌ Erreur debug:', error);
    res.status(500).json({ error: 'Erreur debug' });
  }
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/checks', checkRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expense-payments', expensePaymentRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/company-settings', companySettingsRoutes);
app.use('/api/data', dataOperationsRoutes);

// Route de test temporaire pour diagnostiquer
app.post('/api/test-file-upload', (req, res) => {
  console.log('🧪 Route test temporaire appelée:', {
    hasBody: !!req.body,
    contentType: req.headers['content-type'],
    bodyKeys: Object.keys(req.body || {}),
    files: req.files || 'Aucun fichier'
  });

  res.json({
    success: true,
    message: 'Route test temporaire fonctionne',
    hasBody: !!req.body,
    contentType: req.headers['content-type']
  });
});

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'API Promoteur Immobilier Pro',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Middlewares d'erreur (doivent être en dernier)
app.use(notFound);
app.use(errorHandler);

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 CORS autorisé pour: ${allowedOrigins.join(', ')}`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', async () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Signal SIGINT reçu, arrêt du serveur...');
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
});

export default app;
