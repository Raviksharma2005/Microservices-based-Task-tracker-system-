import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import pino from 'pino';

dotenv.config({ path: '../../.env' });

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

// â”€â”€â”€ Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// â”€â”€â”€ Request logging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'Incoming request');
  next();
});

// â”€â”€â”€ Health check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Service health aggregation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Proxy configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const proxyOptions = (target: string, pathRewrite: Record<string, string>): Options => ({
  target,
  changeOrigin: true,
  pathRewrite,
  on: {
    proxyReq: (proxyReq, req) => {
      logger.debug({ target, path: (req as any).originalUrl }, 'Proxying request');
    },
    error: (err, _req, res) => {
      logger.error({ err, target }, 'Proxy error');
      (res as any).status?.(502).json({
        success: false,
        error: 'Service temporarily unavailable',
      });
    },
  },
});

// â”€â”€â”€ Route proxies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(
  '/api/auth',
  createProxyMiddleware(
    proxyOptions(
      process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      { '^/api/auth': '/auth' }
    )
  )
);

app.use(
  '/api/users',
  createProxyMiddleware(
    proxyOptions(
      process.env.USER_SERVICE_URL || 'http://localhost:3002',
      { '^/api/users': '/users' }
    )
  )
);

app.use(
  '/api/teams',
  createProxyMiddleware(
    proxyOptions(
      process.env.TEAM_SERVICE_URL || 'http://localhost:3003',
      { '^/api/teams': '/teams' }
    )
  )
);

app.use(
  '/api/tasks',
  createProxyMiddleware(
    proxyOptions(
      process.env.TASK_SERVICE_URL || 'http://localhost:3004',
      { '^/api/tasks': '/tasks' }
    )
  )
);

// Team tasks route (proxied to task service)
app.use(
  '/api/teams/:id/tasks',
  createProxyMiddleware(
    proxyOptions(
      process.env.TASK_SERVICE_URL || 'http://localhost:3004',
      { '^/api/teams': '/teams' }
    )
  )
);

// â”€â”€â”€ 404 fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found. Available routes: /api/auth, /api/users, /api/teams, /api/tasks',
  });
});

// â”€â”€â”€ Start â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'API Gateway started');
  logger.info('Routes:');
  logger.info('  /api/auth/*   -> Auth Service');
  logger.info('  /api/users/*  -> User Service');
  logger.info('  /api/teams/*  -> Team Service');
  logger.info('  /api/tasks/*  -> Task Service');
});

export default app;