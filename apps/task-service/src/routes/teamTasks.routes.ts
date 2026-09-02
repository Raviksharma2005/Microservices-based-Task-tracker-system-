import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authMiddleware, validate } from '@taskflow/shared';
import { teamTasksParamSchema } from '../validators/task.validators';

const router = Router();
const controller = new TaskController();

router.use(authMiddleware);

// GET /teams/:id/tasks â€” list tasks for a team
router.get(
  '/:id/tasks',
  validate(teamTasksParamSchema, 'params'),
  controller.getTeamTasks.bind(controller)
);

export default router;