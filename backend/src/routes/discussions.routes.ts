import { Router } from 'express';
import { DiscussionsController } from '../controllers/discussions.controller';

const router = Router();
const controller = new DiscussionsController();


router.get('/', controller.getDiscussions.bind(controller));
router.get('/:id', controller.getDiscussionById.bind(controller));
router.post('/', controller.createDiscussion.bind(controller));
router.post('/:id/messages', controller.postMessage.bind(controller));
router.get('/my/discussions', controller.getMyDiscussions.bind(controller)); //maybe not in mvp

export default router;