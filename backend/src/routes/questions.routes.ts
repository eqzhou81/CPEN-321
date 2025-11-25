import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { QuestionsController } from '../controllers/questions.controller';

const router = Router();
const questionsController = new QuestionsController();

router.post(
  '/generate',
  (req: Request, res: Response, next: NextFunction) => {
    void questionsController.generateQuestions(req, res);
  }
);

router.get('/job/:jobId', (req: Request<{ jobId: string }>, res: Response, next: NextFunction) => {
  void questionsController.getQuestions(req, res);
});

router.post('/behavioral/submit', questionsController.submitBehavioralAnswer.bind(questionsController));

router.put('/:questionId/toggle', questionsController.toggleQuestionCompleted.bind(questionsController));

router.get('/job/:jobId/progress', questionsController.getQuestionProgress.bind(questionsController));

export default router;