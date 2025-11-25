import { Router } from 'express';
import { QuestionsController } from '../controllers/questions.controller';
import { catchAsync } from '../utils/catchAsync';

const router = Router();
const questionsController = new QuestionsController();

router.post(
  '/generate',
  catchAsync(questionsController.generateQuestions.bind(questionsController))
);

router.get('/job/:jobId', catchAsync(questionsController.getQuestions.bind(questionsController)));

router.post('/behavioral/submit', catchAsync(questionsController.submitBehavioralAnswer.bind(questionsController)));

router.put('/:questionId/toggle', catchAsync(questionsController.toggleQuestionCompleted.bind(questionsController)));

router.get('/job/:jobId/progress', catchAsync(questionsController.getQuestionProgress.bind(questionsController)));

export default router;