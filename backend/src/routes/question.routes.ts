
console.log('question.routes.ts loaded');
import { Router } from 'express';

import { QuestionController } from '../controllers/question.controller';
import { validateBody } from '../middleware/validation.middleware';
import { createQuestionSchema } from '../types/question.types';
import { leetCodeController } from '../controllers/leetcode.controller';
import { generateQuestionsController } from '../controllers/generateQuestions.controller';

const router = Router();
const questionController = new QuestionController();
// Create a question
router.post('/', validateBody(createQuestionSchema), (req, res, next) => {
	console.log('POST /api/question handler called');
	return questionController.createQuestion(req, res, next);
});

// Update a question by id
router.put('/:id', validateBody(createQuestionSchema), (req: any, res, next) => {
	console.log('PUT /api/question/:id handler called');
	return questionController.updateQuestion(req, res, next);
});


// Get saved questions by tags for the authenticated user
router.get('/savedQuestionsByTags', (req: any, res, next) => {
	console.log('GET /api/question/savedQuestionsByTags handler called');
	return questionController.getQuestionsByTags(req, res, next);
});

// Generate questions based on job description using OpenAI + LeetCode API
router.post('/generateQuestions', (req, res) => {
	console.log('POST /api/question/generateQuestions handler called');
	return generateQuestionsController(req, res);
});

// Search LeetCode questions using the community API (renamed to leetCodeSearch and moved above :id)
router.get('/leetCodeSearch', (req, res, next) => {
	console.log('GET /api/question/leetCodeSearch handler called');
	return leetCodeController.searchExternal(req, res, next);
});

// Get all saved questions for the authenticated user
router.get('/savedQuestionsForUser', (req, res, next) => {
	console.log('GET /api/question/savedQuestionsForUser handler called');
	return questionController.getAllUserQuestions(req, res, next);
});

// Get a single question by id (keep this last)
router.get('/:id', (req, res, next) => {
	console.log('GET /api/question/:id handler called');
	return questionController.getQuestion(req, res, next);
});

export default router;