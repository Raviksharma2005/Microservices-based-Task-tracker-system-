import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pino from 'pino';

function loadEnv() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
    'E:/taskflow/.env',
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return;
    }
  }
  dotenv.config();
}
loadEnv();

const logger = pino({
  name: 'api-gateway',
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
      : undefined,
});

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'Incoming request');
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    upstreams: {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
      team: process.env.TEAM_SERVICE_URL || 'http://localhost:3003',
      task: process.env.TASK_SERVICE_URL || 'http://localhost:3004',
    },
  });
});

app.get('/api/health', async (_req, res) => {
  const services = [
    { name: 'auth', url: (process.env.AUTH_SERVICE_URL || 'http://localhost:3001') + '/health' },
    { name: 'user', url: (process.env.USER_SERVICE_URL || 'http://localhost:3002') + '/health' },
    { name: 'team', url: (process.env.TEAM_SERVICE_URL || 'http://localhost:3003') + '/health' },
    { name: 'task', url: (process.env.TASK_SERVICE_URL || 'http://localhost:3004') + '/health' },
  ];

  const results = await Promise.allSettled(
    services.map(async (s) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const resp = await fetch(s.url, { signal: controller.signal });
        clearTimeout(timeout);
        return { name: s.name, status: resp.ok ? 'healthy' : 'unhealthy' };
      } catch {
        clearTimeout(timeout);
        return { name: s.name, status: 'unreachable' };
      }
    })
  );

  const statuses = results.map((r) => (r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'error' }));
  const allHealthy = statuses.every((s) => s.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: statuses,
    timestamp: new Date().toISOString(),
  });
});

// ─── Route Proxies ────────────────────────────────────

// 1. Auth Service
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: (p) => '/auth' + p,
  })
);

// 2. User Service
app.use(
  '/api/users',
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: (p) => '/users' + p,
  })
);

// 3. Task Service: Specific team tasks route /api/teams/:id/tasks (must be BEFORE general /api/teams)
app.use(
  '/api/teams/:id/tasks',
  createProxyMiddleware({
    target: process.env.TASK_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: (_p, req: any) => '/teams' + (req.originalUrl ? req.originalUrl.replace('/api/teams', '') : _p),
  })
);

// 4. Team Service (general /api/teams/*)
app.use(
  '/api/teams',
  createProxyMiddleware({
    target: process.env.TEAM_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: (p) => '/teams' + p,
  })
);

// 5. Task Service (general /api/tasks/*)
app.use(
  '/api/tasks',
  createProxyMiddleware({
    target: process.env.TASK_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: (p) => '/tasks' + p,
  })
);

// ─── 404 fallback ─────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found. Available routes: /api/auth, /api/users, /api/teams, /api/tasks',
  });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'API Gateway started');
  logger.info('Routes:');
  logger.info('  /api/auth/*          -> Auth Service (:3001)');
  logger.info('  /api/users/*         -> User Service (:3002)');
  logger.info('  /api/teams/:id/tasks -> Task Service (:3004)');
  logger.info('  /api/teams/*         -> Team Service (:3003)');
  logger.info('  /api/tasks/*         -> Task Service (:3004)');
});

export default app;
