import { ISession, SessionStatus } from '../models/session.model';
import { IQuestion } from '../types/questions.types';

// Request types
export interface CreateSessionRequest {
  jobId: string;
  questionTypes?: ('behavioral' | 'technical')[];
  questionCount?: number;
}

export interface UpdateSessionStatusRequest {
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface SubmitSessionAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
}

// Response types
export interface SessionResponse {
  message: string;
  data?: {
    session?: ISessionWithQuestions;
    sessions?: ISessionWithQuestions[];
    stats?: SessionStats;
    currentQuestion?: IQuestion;
    feedback?: SessionAnswerFeedback;
  };
}

export interface ISessionWithQuestions extends Omit<ISession, 'questionIds'> {
  questionIds: IQuestion[];
  progressPercentage: number;
  currentQuestion: IQuestion | null;
  remainingQuestions: number;
}

export interface SessionStats {
  total: number;
  completed: number;
  active: number;
  averageProgress: number;
}

export interface SessionAnswerFeedback {
  feedback: string;
  score: number;
  strengths: string[];
  improvements: string[];
  isLastQuestion: boolean;
  nextQuestionId?: string;
  sessionCompleted?: boolean;
}

export interface SessionProgress {
  sessionId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  progressPercentage: number;
  status: SessionStatus;
  remainingQuestions: number;
  estimatedTimeRemaining?: number; // in minutes
}

export interface SessionSummary {
  sessionId: string;
  jobId: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in minutes
  totalQuestions: number;
  answeredQuestions: number;
  progressPercentage: number;
  status: SessionStatus;
  behavioralQuestions: number;
  technicalQuestions: number;
  averageScore?: number;
}

// Session question with answer tracking
export interface SessionQuestion extends IQuestion {
  isAnswered: boolean;
  answeredAt?: Date;
  userAnswer?: string;
  feedback?: {
    score: number;
    strengths: string[];
    improvements: string[];
    feedback: string;
  };
}

// Session navigation
export interface SessionNavigation {
  canGoBack: boolean;
  canGoForward: boolean;
  canSkip: boolean;
  currentIndex: number;
  totalQuestions: number;
  previousQuestionId?: string;
  nextQuestionId?: string;
}

export { SessionStatus };
