import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

import { connectDatabase, createLogger, errorHandler, notFoundHandler, rateLimiter } from '@taskflow/shared';
import userRoutes from './routes/user.routes';

const logger = createLogger('user-service');
const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3002;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/users', rateLimiter());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

app.use('/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectDatabase('user-service');
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'User service started');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start user service');
    process.exit(1);
  }
}

bootstrap();
export default app;