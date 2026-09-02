import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authMiddleware, validate } from '@taskflow/shared';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  teamTasksParamSchema,
} from '../validators/task.validators';

const router = Router();
const controller = new TaskController();

// All task routes require authentication
router.use(authMiddleware);

// Task CRUD
router.post('/', validate(createTaskSchema), controller.create.bind(controller));
router.get('/:id', validate(taskIdParamSchema, 'params'), controller.getById.bind(controller));
router.put(
  '/:id',
  validate(taskIdParamSchema, 'params'),
  validate(updateTaskSchema),
  controller.update.bind(controller)
);
router.delete('/:id', validate(taskIdParamSchema, 'params'), controller.delete.bind(controller));

export default router;