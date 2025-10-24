import { Router } from 'express';
import { generateQuestionsController } from '../controllers/generateQuestions.controller';
import { QuestionsController } from '../controllers/questions.controller';

const router = Router();
const questionsController = new QuestionsController();

router.post(
  '/generate',
  questionsController.generateQuestions.bind(questionsController)
);

// Jack-dev generate questions endpoint
router.post('/generateQuestions', generateQuestionsController);

router.get('/job/:jobId', questionsController.getQuestions.bind(questionsController));

router.post('/behavioral/submit', questionsController.submitBehavioralAnswer.bind(questionsController));

router.put('/:questionId/toggle', questionsController.toggleQuestionCompleted.bind(questionsController));

router.get('/job/:jobId/progress', questionsController.getQuestionProgress.bind(questionsController));

export default router;