import mongoose from 'mongoose';

export enum QuestionType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral'
}

export enum QuestionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed'
}


export interface IQuestion {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: QuestionType;
  title: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  externalUrl?: string;
  status: QuestionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuestionRequest {
  jobId: string;
  type: QuestionType;
  title: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  externalUrl?: string;
}

export interface UpdateQuestionRequest {
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  externalUrl?: string;
  status?: QuestionStatus;
}

export interface GenerateQuestionsRequest {
  jobId: string;
  types: QuestionType[];
  count?: number;
}

export interface SubmitBehavioralAnswerRequest {
  questionId: string;
  answer: string;
}

export interface QuestionResponse {
  message: string;
  data?: {
    question?: IQuestion;
    questions?: IQuestion[];
    behavioralQuestions?: IQuestion[];
    technicalQuestions?: IQuestion[];
    total?: number;
    totalQuestions?: number;
    jobApplication?: unknown;
  };
}

export interface BehavioralAnswerResponse {
  message: string;
  data?: {
    feedback?: string;
    score?: number;
    strengths?: string[];
    improvements?: string[];
  };
}


export interface QuestionProgressResponse {
  message: string;
  data?: {
    jobId: string;
    progress: {
      technical: {
        total: number;
        completed: number;
      };
      behavioral: {
        total: number;
        completed: number;
      };
      overall: {
        total: number;
        completed: number;
      };
    };
  };
}


export interface OpenAIBehavioralQuestion {
  question: string;
  context?: string;
  tips?: string[];
}

export interface OpenAIFeedback {
  feedback: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
}

