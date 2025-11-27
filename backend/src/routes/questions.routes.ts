import { Router } from 'express';
import { QuestionsController } from '../controllers/questions.controller';
import { asyncHandler } from '../utils/asyncHandler.util';

const router = Router();
const questionsController = new QuestionsController();

router.post(
  '/generate',
  asyncHandler(questionsController.generateQuestions.bind(questionsController))
);

router.get('/job/:jobId', asyncHandler(questionsController.getQuestions.bind(questionsController)));

router.post('/behavioral/submit', asyncHandler(questionsController.submitBehavioralAnswer.bind(questionsController)));

router.put('/:questionId/toggle', asyncHandler(questionsController.toggleQuestionCompleted.bind(questionsController)));

router.get('/job/:jobId/progress', asyncHandler(questionsController.getQuestionProgress.bind(questionsController)));

export default router;