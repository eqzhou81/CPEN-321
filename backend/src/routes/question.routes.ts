import { Router } from 'express';

import { QuestionController } from '../controllers/question.controller';
import { validateBody } from '../middleware/validation.middleware';
import { createQuestionSchema } from '../types/question.types';

const router = Router();
const questionController = new QuestionController();
// Create a question
router.post('/', validateBody(createQuestionSchema), questionController.createQuestion);

// Update a question by id
router.put('/:id', validateBody(createQuestionSchema), questionController.updateQuestion);

// Get a single question by id
router.get('/:id', questionController.getQuestion);

// Get saved questions by tags for the authenticated user
router.get('/savedQuestionsByTags', questionController.getQuestionsByTags);

// Get all saved questions for the authenticated user
router.get('/savedQuestionsForUser', questionController.getAllUserQuestions);

export default router;