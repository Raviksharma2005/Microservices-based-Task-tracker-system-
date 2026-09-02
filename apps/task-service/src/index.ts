import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';
import fs from 'fs';

// Find root .env file robustly
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

import { connectDatabase, createLogger, errorHandler, notFoundHandler, rateLimiter } from '@taskflow/shared';
import taskRoutes from './routes/task.routes';
import teamTasksRoutes from './routes/teamTasks.routes';

const logger = createLogger('task-service');
const app = express();
const PORT = process.env.TASK_SERVICE_PORT || 3004;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/tasks', rateLimiter());
app.use('/teams', rateLimiter());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', service: 'task-service', timestamp: new Date().toISOString() });
});

app.use('/tasks', taskRoutes);
app.use('/teams', teamTasksRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectDatabase('task-service');
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Task service started');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start task service');
    process.exit(1);
  }
}

bootstrap();
export default app;