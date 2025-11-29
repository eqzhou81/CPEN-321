import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { jobApplicationModel } from '../models/jobApplication.model';
import { questionModel } from '../models/question.model';
import { ISession, sessionModel, SessionStatus } from '../models/session.model';
import { openaiService } from '../services/openai.service';
import { IQuestion, QuestionStatus, QuestionType } from '../types/questions.types';
import {
  CreateSessionRequest,
  ISessionWithQuestions,
  SessionAnswerFeedback,
  SessionProgress,
  SessionResponse,
  SubmitSessionAnswerRequest,
  UpdateSessionStatusRequest,
} from '../types/sessions.types';
import logger from '../utils/logger.util';

export class SessionsController {
  private formatSessionResponse(session: unknown): ISessionWithQuestions {
    const s = session as ISession & { questionIds: IQuestion[] };
    const sessionObj = s.toObject();
    
    // Explicitly construct ISessionWithQuestions with only required properties
    const result = {
      _id: sessionObj._id as mongoose.Types.ObjectId,
      userId: sessionObj.userId as mongoose.Types.ObjectId,
      jobId: sessionObj.jobId as mongoose.Types.ObjectId,
      questionIds: s.questionIds, // Populated questions array
      currentQuestionIndex: sessionObj.currentQuestionIndex as number,
      status: sessionObj.status as SessionStatus,
      startedAt: sessionObj.startedAt as Date,
      completedAt: sessionObj.completedAt as Date | undefined,
      totalQuestions: sessionObj.totalQuestions as number,
      answeredQuestions: sessionObj.answeredQuestions as number,
      createdAt: sessionObj.createdAt as Date,
      updatedAt: sessionObj.updatedAt as Date,
      // Additional computed properties
      progressPercentage: Math.round((sessionObj.answeredQuestions as number) / (sessionObj.totalQuestions as number) * 100),
      currentQuestion: s.currentQuestionIndex < s.questionIds.length 
        ? s.questionIds[s.currentQuestionIndex] 
        : null,
      remainingQuestions: (sessionObj.totalQuestions as number) - (sessionObj.answeredQuestions as number),
    };
    
    return result as unknown as ISessionWithQuestions;
  }
  
  async createSession(
    req: Request<unknown, unknown, CreateSessionRequest>,
    res: Response<SessionResponse>
  ) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          message: 'User not found in request',
        });
      }
      const { jobId, specificQuestionId } = req.body;

      if (!jobId || typeof jobId !== 'string') {
        return res.status(400).json({
          message: 'Job ID is required and must be a string',
        });
      }

      let jobObjectId = new mongoose.Types.ObjectId(jobId);
      let jobApplication = await jobApplicationModel.findById(jobObjectId, new mongoose.Types.ObjectId(user._id));
      if (!jobApplication) {
        try {
          jobApplication = await jobApplicationModel.create(new mongoose.Types.ObjectId(user._id), {
            title: 'Mock Interview Practice Session',
            company: 'Practice Company',
            description: 'This is a practice mock interview session to help you prepare for real interviews. Answer behavioral questions and receive AI-powered feedback.',
            location: 'Remote',
            url: 'https://example.com',
          });
          jobObjectId = jobApplication._id;
        } catch (error) {
          logger.error('Failed to create placeholder job:', error);
          return res.status(500).json({
            message: 'Failed to create mock interview session',
          });
        }
      }

      const existingSession = await sessionModel.findActiveByJobId(jobObjectId, new mongoose.Types.ObjectId(user._id));
      if (existingSession) {
        // If creating a session for a specific question, cancel the existing session first
        if (specificQuestionId) {
          logger.info(`Canceling existing session ${String(existingSession._id)} to create new session for specific question`);
          await sessionModel.updateStatus(existingSession._id, new mongoose.Types.ObjectId(user._id), SessionStatus.CANCELLED);
        } else {
          return res.status(409).json({
            message: 'An active session already exists for this job. Please complete or cancel it first.',
            data: {
              session: this.formatSessionResponse(existingSession),
            },
          });
        }
      }

      let questionIds: mongoose.Types.ObjectId[];

      if (specificQuestionId) {
        // Create session with existing questions from the job, starting with the specific question
        logger.info(`Looking for existing questions for job: ${String(jobObjectId)}, user: ${String(user._id)}`);
        const existingQuestions = await questionModel.findByJobId(jobObjectId, new mongoose.Types.ObjectId(user._id));
        logger.info(`Found ${existingQuestions.length} existing questions`);
        
        const behavioralQuestions = existingQuestions.filter(q => q.type === QuestionType.BEHAVIORAL);
        logger.info(`Found ${behavioralQuestions.length} behavioral questions`);
        
        if (behavioralQuestions.length === 0) {
          logger.warn('No behavioral questions found, falling back to default questions');
          // Fall back to default questions
          const defaultBehavioralQuestions = [
            "Tell me about a time when you had to resolve a conflict with a team member. How did you approach the situation, and what was the outcome?",
            "Describe a situation where you had to work under pressure to meet a tight deadline. How did you manage your time and prioritize tasks?",
            "Give me an example of a time when you had to learn a new skill or technology quickly. What was your approach?",
            "Tell me about a project where you took initiative and went above and beyond what was expected. What motivated you?",
            "Describe a situation where you received critical feedback. How did you respond and what did you learn from it?"
          ];

          const questionPromises = defaultBehavioralQuestions.map(questionText => 
            questionModel.create(new mongoose.Types.ObjectId(user._id), {
              jobId: jobObjectId.toString(),
              type: QuestionType.BEHAVIORAL,
              title: questionText,
              description: 'Behavioral interview question for mock interview session',
              difficulty: 'medium',
            })
          );

          const createdQuestions = await Promise.all(questionPromises);
          questionIds = createdQuestions.map(q => q._id);
        } else {
          // Find the specific question and put it first
          const specificQuestion = behavioralQuestions.find(q => q._id.toString() === specificQuestionId);
          logger.info(`Looking for specific question: ${specificQuestionId}`);
          logger.info(`Specific question found: ${specificQuestion ? 'YES' : 'NO'}`);
          
          if (specificQuestion) {
            // Put the specific question first, then add the rest
            const otherQuestions = behavioralQuestions.filter(q => q._id.toString() !== specificQuestionId);
            questionIds = [specificQuestion._id, ...otherQuestions.map(q => q._id)];
            logger.info(`Created session with specific question first: ${questionIds.length} questions`);
          } else {
            // If specific question not found, use all behavioral questions
            questionIds = behavioralQuestions.map(q => q._id);
            logger.info(`Specific question not found, using all behavioral questions: ${questionIds.length} questions`);
          }
        }
      } else {
        // Create session with default behavioral questions
        const defaultBehavioralQuestions = [
          "Tell me about a time when you had to resolve a conflict with a team member. How did you approach the situation, and what was the outcome?",
          "Describe a situation where you had to work under pressure to meet a tight deadline. How did you manage your time and prioritize tasks?",
          "Give me an example of a time when you had to learn a new skill or technology quickly. What was your approach?",
          "Tell me about a project where you took initiative and went above and beyond what was expected. What motivated you?",
          "Describe a situation where you received critical feedback. How did you respond and what did you learn from it?"
        ];

        const questionPromises = defaultBehavioralQuestions.map(questionText => 
          questionModel.create(new mongoose.Types.ObjectId(user._id), {
            jobId: jobObjectId.toString(),
            type: QuestionType.BEHAVIORAL,
            title: questionText,
            description: 'Behavioral interview question for mock interview session',
            difficulty: 'medium',
          })
        );

        const createdQuestions = await Promise.all(questionPromises);
        questionIds = createdQuestions.map(q => q._id);
      }

      const session = await sessionModel.create(new mongoose.Types.ObjectId(user._id), jobObjectId, questionIds);

      const populatedSession = await sessionModel.findById(session._id, new mongoose.Types.ObjectId(user._id));

      // Get the first question for the response
      let currentQuestion: IQuestion | undefined;
      if (questionIds.length > 0) {
        currentQuestion = await questionModel.findById(questionIds[0], new mongoose.Types.ObjectId(user._id)) ?? undefined;
      }

      res.status(201).json({
        message: 'Mock interview session created successfully',
        data: {
          session: this.formatSessionResponse(populatedSession),
          currentQuestion,
        },
      });
    } catch (error) {
      logger.error('Failed to create session:', error);
      
      if (error instanceof Error && error.message.includes('active session already exists')) {
        return res.status(409).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: 'Failed to create session',
      });
    }
  }

  async getSession(
    req: Request<{ sessionId: string }>,
    res: Response<SessionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const sessionId = new mongoose.Types.ObjectId(req.params.sessionId);

      const session = await sessionModel.findById(sessionId, new mongoose.Types.ObjectId(user._id));
      if (!session) {
        return res.status(404).json({
          message: 'Session not found',
        });
      }

      const currentQuestion = session.currentQuestionIndex < session.questionIds.length 
        ? session.questionIds[session.currentQuestionIndex] 
        : null;

      res.status(200).json({
        message: 'Session retrieved successfully',
        data: {
          session: this.formatSessionResponse(session),
          currentQuestion: currentQuestion ? (currentQuestion as unknown as IQuestion) : null,
        },
      });
    } catch (error) {
      logger.error('Failed to get session:', error);
      return res.status(500).json({
        message: 'Failed to retrieve session',
      });
    }
  }

  async getUserSessions(
    req: Request,
    res: Response<SessionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const limit = parseInt(req.query.limit as string) || 20;

      const sessions = await sessionModel.findByUserId(new mongoose.Types.ObjectId(user._id), limit);
      const stats = await sessionModel.getSessionStats(new mongoose.Types.ObjectId(user._id));

      res.status(200).json({
        message: 'Sessions retrieved successfully',
        data: {
          sessions: sessions.map(session => this.formatSessionResponse(session)),
          stats,
        },
      });
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      return res.status(500).json({
        message: 'Failed to retrieve sessions',
      });
    }
  }

  async submitSessionAnswer(
    req: Request<unknown, unknown, SubmitSessionAnswerRequest>,
    res: Response<SessionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const { sessionId, questionId, answer } = req.body;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({
          message: 'Session ID is required and must be a string',
        });
      }

      if (!questionId || typeof questionId !== 'string') {
        return res.status(400).json({
          message: 'Question ID is required and must be a string',
        });
      }

      if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
        return res.status(400).json({
          message: 'Answer is required and must be a non-empty string',
        });
      }

      if (answer.length > 5000) {
        return res.status(400).json({
          message: 'Answer too long (max 5000 characters)',
        });
      }

      const sessionObjectId = new mongoose.Types.ObjectId(sessionId);
      const questionObjectId = new mongoose.Types.ObjectId(questionId);

      const session = await sessionModel.findById(sessionObjectId, new mongoose.Types.ObjectId(user._id));
      if (!session) {
        return res.status(404).json({
          message: 'Session not found',
        });
      }

      if (session.status !== SessionStatus.ACTIVE) {
        return res.status(400).json({
          message: 'Session is not active',
        });
      }

      const question = await questionModel.findById(questionObjectId, new mongoose.Types.ObjectId(user._id));
      if (!question) {
        return res.status(404).json({
          message: 'Question not found',
        });
      }

      const questionInSession = session.questionIds.some((q: unknown) => {
        const question = q as { _id?: { toString: () => string } } | null;
        return question?._id?.toString() === questionId;
      });
      
      if (!questionInSession) {
        logger.error('Question verification failed:', {
          questionId,
          sessionQuestionIds: session.questionIds.map(q =>
            q._id.toString()
          ),
        });
        return res.status(400).json({
          message: 'Question does not belong to this session',
        });
      }

      let feedback: SessionAnswerFeedback;

      if (question.type === QuestionType.BEHAVIORAL) {
        try {
          logger.info('Submitting behavioral answer for feedback', {
            questionId,
            questionTitle: question.title,
            answerLength: answer.length,
            answer
          });

          const aiFeedback = await openaiService.generateAnswerFeedback(
            question.title,
            answer,
            'Mock interview session'
          );

          await questionModel.updateStatus(questionObjectId, new mongoose.Types.ObjectId(user._id), QuestionStatus.COMPLETED);

          feedback = {
            feedback: aiFeedback.feedback || 'Good answer!',
            score: aiFeedback.score ?? 7,
            strengths: aiFeedback.strengths ?? [],
            improvements: aiFeedback.improvements ?? [],
            isLastQuestion: false,
            sessionCompleted: false,
          };
        } catch (error) {
          logger.error('Error generating AI feedback:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            questionId,
            answerLength: answer.length
          });
          
          // Only return generic feedback if it's a real error, not just OpenAI being unavailable
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
            logger.error('OpenAI API key issue - check environment variables');
          }
          
          feedback = {
            feedback: 'Thank you for your answer. Due to a technical issue, detailed feedback is not available right now. Please try again later.',
            score: 7,
            strengths: ['Provided a complete response'],
            improvements: ['Continue practicing to improve your interview skills'],
            isLastQuestion: false,
            sessionCompleted: false,
          };
        }
      } else {
        feedback = {
          feedback: 'Technical question noted. Please solve this problem on the external platform and mark it as complete when done.',
          score: 0,
          strengths: [],
          improvements: [],
          isLastQuestion: false,
          sessionCompleted: false,
        };
      }

      const updatedSession = await sessionModel.updateProgress(
        sessionObjectId, 
        new mongoose.Types.ObjectId(user._id), 
        session.answeredQuestions + 1
      );
      
      if (!updatedSession) {
        return res.status(500).json({
          message: 'Failed to update session progress',
        });
      }

      const isLastQuestion = session.currentQuestionIndex >= session.totalQuestions - 1;
      const sessionCompleted = updatedSession.status === SessionStatus.COMPLETED || isLastQuestion;

      feedback.isLastQuestion = isLastQuestion;
      feedback.sessionCompleted = sessionCompleted;

      res.status(200).json({
        message: sessionCompleted ? 'Session completed successfully' : 'Answer submitted successfully',
        data: {
          session: this.formatSessionResponse(updatedSession),
          feedback,
        },
      });
    } catch (error) {
      logger.error('Failed to submit session answer:', error);
      return res.status(500).json({
        message: 'Failed to submit answer',
      });
    }
  }

  async updateSessionStatus(
    req: Request<{ sessionId: string }, unknown, UpdateSessionStatusRequest>,
    res: Response<SessionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const sessionId = new mongoose.Types.ObjectId(req.params.sessionId);
      const { status } = req.body;

      if (typeof status !== 'string') {
        return res.status(400).json({
          message: 'Status is required and must be a string',
        });
      }

      const validStatuses = ['active', 'paused', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Must be one of: active, paused, cancelled, completed',
        });
      }

      const session = await sessionModel.findById(sessionId, new mongoose.Types.ObjectId(user._id));
      if (!session) {
        return res.status(404).json({
          message: 'Session not found',
        });
      }

      const updatedSession = await sessionModel.updateStatus(sessionId, new mongoose.Types.ObjectId(user._id), status as SessionStatus);
      if (!updatedSession) {
        return res.status(500).json({
          message: 'Failed to update session status',
        });
      }

      res.status(200).json({
        message: `Session ${status} successfully`,
        data: {
          session: this.formatSessionResponse(updatedSession),
        },
      });
    } catch (error) {
      logger.error('Failed to update session status:', error);
      return res.status(500).json({
        message: 'Failed to update session status',
      });
    }
  }

  async deleteSession(
    req: Request<{ sessionId: string }>,
    res: Response<SessionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const sessionId = new mongoose.Types.ObjectId(req.params.sessionId);

      const deleted = await sessionModel.delete(sessionId, new mongoose.Types.ObjectId(user._id));
      if (!deleted) {
        return res.status(404).json({
          message: 'Session not found',
        });
      }

      res.status(200).json({
        message: 'Session deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete session:', error);
      return res.status(500).json({
        message: 'Failed to delete session',
      });
    }
  }

  async navigateToQuestion(
    req: Request<{ sessionId: string }, unknown, { questionIndex: number }>,
    res: Response<SessionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      
      // Validate sessionId format
      let sessionId: mongoose.Types.ObjectId;
      try {
        sessionId = new mongoose.Types.ObjectId(req.params.sessionId);
      } catch (error) {
        return res.status(400).json({
          message: 'Invalid session ID format',
        });
      }

      const { questionIndex } = req.body;

      if (typeof questionIndex !== 'number') {
        return res.status(400).json({
          message: 'Question index must be a number',
        });
      }

      // Check if session exists first
      const existingSession = await sessionModel.findById(sessionId, new mongoose.Types.ObjectId(user._id));
      if (!existingSession) {
        return res.status(404).json({
          message: 'Session not found',
        });
      }

      const session = await sessionModel.navigateToQuestion(sessionId, new mongoose.Types.ObjectId(user._id), questionIndex);
      if (!session) {
        return res.status(404).json({
          message: 'Session not found',
        });
      }

      const currentQuestion = session.currentQuestionIndex < session.questionIds.length 
        ? session.questionIds[session.currentQuestionIndex] 
        : null;

      res.status(200).json({
        message: 'Navigation successful',
        data: {
          session: this.formatSessionResponse(session),
          currentQuestion: currentQuestion ? (currentQuestion as unknown as IQuestion) : null,
        },
      });
    } catch (error) {
      logger.error('Failed to navigate to question:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid question index')) {
          return res.status(400).json({
            message: error.message,
          });
        }
        if (error.message.includes('Session not found')) {
          return res.status(404).json({
            message: 'Session not found',
          });
        }
      }

      return res.status(500).json({
        message: 'Failed to navigate to question',
      });
    }
  }

  async getSessionProgress(
    req: Request<{ sessionId: string }>,
    res: Response<SessionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const sessionId = new mongoose.Types.ObjectId(req.params.sessionId);

      const session = await sessionModel.findById(sessionId, new mongoose.Types.ObjectId(user._id));
      if (!session) {
        return res.status(404).json({
          message: 'Session not found',
        });
      }

      const progress = {
        sessionId: session._id.toString(),
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions,
        answeredQuestions: session.answeredQuestions,
        progressPercentage: Math.round((session.answeredQuestions / session.totalQuestions) * 100),
        status: session.status,
        remainingQuestions: session.totalQuestions - session.answeredQuestions,
        estimatedTimeRemaining: Math.max(0, (session.totalQuestions - session.answeredQuestions) * 3), // 3 minutes per question
      };

      res.status(200).json({
        message: 'Session progress retrieved successfully',
        data: {
          session: progress as SessionProgress,
        },
      });
    } catch (error) {
      logger.error('Failed to get session progress:', error);
      return res.status(500).json({
        message: 'Failed to retrieve session progress',
      });
    }
  }
}
