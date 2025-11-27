import { Router } from 'express';
import { DiscussionsController } from '../controllers/discussions.controller';
import { asyncHandler } from '../utils/asyncHandler.util';
import { validateBody } from '../middleware/validation.middleware';
import { createDiscussionSchema, postMessageSchema } from '../types/discussions.types';

const router = Router();
const controller = new DiscussionsController();


router.get('/', asyncHandler(controller.getDiscussions.bind(controller)));
router.get('/:id', asyncHandler(controller.getDiscussionById.bind(controller)));
router.post('/', validateBody(createDiscussionSchema), asyncHandler(controller.createDiscussion.bind(controller)));
router.post('/:id/messages', validateBody(postMessageSchema), asyncHandler(controller.postMessage.bind(controller)));
router.get('/my/discussions', asyncHandler(controller.getMyDiscussions.bind(controller))); //maybe not in mvp

export default router;