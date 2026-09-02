import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, validate } from '@taskflow/shared';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validators';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', validate(registerSchema), controller.register.bind(controller));
router.post('/login', validate(loginSchema), controller.login.bind(controller));
router.post('/refresh', validate(refreshSchema), controller.refresh.bind(controller));

// Protected routes
router.get('/me', authMiddleware, controller.me.bind(controller));
router.post('/logout', authMiddleware, controller.logout.bind(controller));

export default router;