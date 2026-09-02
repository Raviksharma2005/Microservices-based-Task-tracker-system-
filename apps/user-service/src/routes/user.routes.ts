import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, validate } from '@taskflow/shared';
import { updateUserSchema, userIdParamSchema } from '../validators/user.validators';

const router = Router();
const controller = new UserController();

// All user routes require authentication
router.use(authMiddleware);

router.get('/me', controller.getMe.bind(controller));
router.get('/:id', validate(userIdParamSchema, 'params'), controller.getUser.bind(controller));
router.put(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  controller.updateUser.bind(controller)
);
router.get('/', controller.listUsers.bind(controller));

export default router;