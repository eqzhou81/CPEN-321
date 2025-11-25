import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { DiscussionsController } from '../controllers/discussions.controller';
import { catchAsync } from '../utils/catchAsync';

const router = Router();
const controller = new DiscussionsController();

router.get('/', catchAsync(controller.getDiscussions.bind(controller)));
router.get('/:id', catchAsync(controller.getDiscussionById.bind(controller)));
router.post('/', catchAsync(controller.createDiscussion.bind(controller)));
router.post('/:id/messages', catchAsync(controller.postMessage.bind(controller)));
router.get('/my/discussions', catchAsync(controller.getMyDiscussions.bind(controller))); //maybe not in mvp

export default router;