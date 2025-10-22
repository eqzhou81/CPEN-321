import { JobApplication, TechnicalQuestion, BehavioralQuestion, Discussion, SimilarJob } from '@/types';

export const mockJobApplications: JobApplication[] = [
  {
    id: '1',
    title: 'Software Development Engineer',
    company: 'Amazon',
    description: 'Build scalable systems for millions of customers',
    addedDate: '2025-10-01',
    progress: { technical: 3, behavioral: 5 }
  },
  {
    id: '2',
    title: 'Software Engineer',
    company: 'Google',
    description: 'Work on cutting-edge technology',
    addedDate: '2025-10-03',
    progress: { technical: 0, behavioral: 0 }
  },
  {
    id: '3',
    title: 'Frontend Developer',
    company: 'Microsoft',
    description: 'Build user interfaces for cloud products',
    addedDate: '2025-10-05',
    progress: { technical: 2, behavioral: 3 }
  },
  {
    id: '4',
    title: 'Full Stack Engineer',
    company: 'Meta',
    description: 'Develop social media features',
    addedDate: '2025-10-07',
    progress: { technical: 0, behavioral: 0 }
  }
];

export const mockTechnicalQuestions: TechnicalQuestion[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    link: 'https://leetcode.com/problems/two-sum/',
    completed: false
  },
  {
    id: '2',
    title: 'Add Two Numbers',
    difficulty: 'Medium',
    link: 'https://leetcode.com/problems/add-two-numbers/',
    completed: false
  },
  {
    id: '3',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    completed: false
  },
  {
    id: '4',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
    completed: false
  },
  {
    id: '5',
    title: 'Longest Palindromic Substring',
    difficulty: 'Medium',
    link: 'https://leetcode.com/problems/longest-palindromic-substring/',
    completed: false
  }
];

export const mockBehavioralQuestions: BehavioralQuestion[] = [
  {
    id: '1',
    question: 'Tell me about a time when you had to resolve a conflict with a team member. How did you approach the situation, and what was the outcome?',
    completed: false
  },
  {
    id: '2',
    question: 'Describe a situation where you had to work under pressure to meet a tight deadline.',
    completed: false
  },
  {
    id: '3',
    question: 'Tell me about a time you failed. What did you learn from it?',
    completed: false
  },
  {
    id: '4',
    question: 'Describe a project where you had to learn a new technology quickly.',
    completed: false
  },
  {
    id: '5',
    question: 'Tell me about a time you had to give constructive feedback to a colleague.',
    completed: false
  }
];

export const mockDiscussions: Discussion[] = [
  {
    id: '1',
    title: 'Amazon SDE Interview Tips',
    author: 'Sarah Chen',
    date: '2025-10-08',
    replies: 24,
    preview: 'Just completed my Amazon interview loop. Here are some key insights...'
  },
  {
    id: '2',
    title: 'Google Behavioral Questions - What to Expect',
    author: 'Mike Johnson',
    date: '2025-10-09',
    replies: 18,
    preview: 'Google really focuses on leadership principles. Make sure to...'
  },
  {
    id: '3',
    title: 'LeetCode Study Plan for FAANG',
    author: 'Emily Rodriguez',
    date: '2025-10-09',
    replies: 42,
    preview: 'I created a 3-month study plan that helped me land offers from...'
  }
];

export const mockSimilarJobs: SimilarJob[] = [
  {
    id: '1',
    title: 'Software Engineer II',
    company: 'Amazon Web Services',
    location: 'Vancouver, BC',
    type: 'Hybrid',
    distance: '2.5 km',
    link: 'https://amazon.jobs'
  },
  {
    id: '2',
    title: 'SDE - Cloud Services',
    company: 'Amazon',
    location: 'Remote',
    type: 'Remote',
    link: 'https://amazon.jobs'
  },
  {
    id: '3',
    title: 'Backend Developer',
    company: 'Shopify',
    location: 'Vancouver, BC',
    type: 'Hybrid',
    distance: '5.1 km',
    link: 'https://shopify.com/careers'
  },
  {
    id: '4',
    title: 'Full Stack Engineer',
    company: 'SAP',
    location: 'Burnaby, BC',
    type: 'On-site',
    distance: '12.3 km',
    link: 'https://sap.com/careers'
  }
];
