import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { authMiddleware, validate } from '@taskflow/shared';
import {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
  teamIdParamSchema,
  memberParamSchema,
} from '../validators/team.validators';

const router = Router();
const controller = new TeamController();

// All team routes require authentication
router.use(authMiddleware);

router.post('/', validate(createTeamSchema), controller.create.bind(controller));
router.get('/my/list', controller.getMyTeams.bind(controller));
router.get('/:id', validate(teamIdParamSchema, 'params'), controller.getById.bind(controller));
router.put(
  '/:id',
  validate(teamIdParamSchema, 'params'),
  validate(updateTeamSchema),
  controller.update.bind(controller)
);
router.delete('/:id', validate(teamIdParamSchema, 'params'), controller.delete.bind(controller));
router.post(
  '/:id/members',
  validate(teamIdParamSchema, 'params'),
  validate(addMemberSchema),
  controller.addMember.bind(controller)
);
router.delete(
  '/:id/members/:userId',
  validate(memberParamSchema, 'params'),
  controller.removeMember.bind(controller)
);
router.get(
  '/:id/members',
  validate(teamIdParamSchema, 'params'),
  controller.getMembers.bind(controller)
);

export default router;