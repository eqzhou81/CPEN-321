export interface JobApplication {
  id: string;
  title: string;
  company: string;
  description: string;
  link?: string;
  addedDate: string;
  progress: {
    technical: number;
    behavioral: number;
  };
}

export interface TechnicalQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  link: string;
  completed: boolean;
}

export interface BehavioralQuestion {
  id: string;
  question: string;
  completed: boolean;
  answer?: string;
  feedback?: {
    strengths: string;
    improvements: string;
  };
}

export interface Discussion {
  id: string;
  title: string;
  author: string;
  date: string;
  replies: number;
  preview: string;
}

export interface DiscussionMessage {
  id: string;
  author: string;
  date: string;
  content: string;
}

export interface SimilarJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Remote' | 'Hybrid' | 'On-site';
  distance?: string;
  link: string;
}
