import axios from 'axios';
import OpenAI from 'openai';
import { IJobApplication } from '../../src/types/jobs.types';
import logger from '../../src/utils/logger.util';

// Mock dependencies
jest.mock('axios');
jest.mock('../../src/utils/logger.util');

// Mock OpenAI instance BEFORE any imports
const mockOpenAIInstance = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAIInstance);
});

// Import after mocking
const { openaiService } = require('../../src/services/openai.service');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenAIService - Mocked Unit Tests', () => {
  afterAll(() => {
    // Restore all mocks after tests complete to prevent interference with other test files
    jest.restoreAllMocks();
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should have service instance defined', () => {
      // Service is exported as singleton from module
      expect(openaiService).toBeDefined();
    });

    it('should have API key defined in environment', () => {
      // The service was initialized when module loaded
      // Check that environment has the key
      expect(process.env.OPENAI_API_KEY).toBeDefined();
    });
  });

  describe('sanitizeText - Private Method (tested indirectly)', () => {
    it('should sanitize text in generateBehavioralQuestions', async () => {
      const jobApplication: IJobApplication = {
        _id: 'job-1',
        userId: 'user-1',
        title: 'Software\r\nEngineer\t',
        company: 'Tech\nCorp\r',
        description: 'Great\u0000opportunity',
        skills: ['React\r\n', 'Node.js\t\t'],
        experienceLevel: 'mid\n\r',
        applicationStatus: 'applied',
        dateApplied: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  question: 'Test question',
                  context: 'Test context',
                  tips: ['Tip 1', 'Tip 2'],
                },
              ]),
            },
          }],
        },
      });

      await openaiService.generateBehavioralQuestions(jobApplication, 5);

      // Verify axios was called with sanitized text
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];
      const requestBody = callArgs[1];
      const prompt = requestBody.messages[1].content;

      // Check that the job data is sanitized (no \r or \t from original data)
      // Note: The prompt template itself contains \n for formatting, which is correct
      expect(prompt).not.toContain('mid\n\r'); // Original data had this
      expect(prompt).toContain('mid'); // Should be sanitized to just 'mid'
    });

    it('should handle undefined text in sanitization', async () => {
      const jobApplication: IJobApplication = {
        _id: 'job-1',
        userId: 'user-1',
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: undefined as any, // Test undefined handling
        skills: undefined, // Test undefined array
        experienceLevel: undefined, // Test undefined level
        applicationStatus: 'applied',
        dateApplied: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  question: 'Test question',
                  context: 'Test context',
                  tips: ['Tip 1'],
                },
              ]),
            },
          }],
        },
      });

      const result = await openaiService.generateBehavioralQuestions(jobApplication, 5);

      expect(result).toHaveLength(1);
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];
      const requestBody = callArgs[1];
      const prompt = requestBody.messages[1].content;

      // Should handle undefined gracefully
      expect(prompt).toContain('Not specified');
    });

    it('should collapse multiple spaces in sanitization', async () => {
      const jobApplication: IJobApplication = {
        _id: 'job-1',
        userId: 'user-1',
        title: 'Software     Engineer',
        company: 'Tech   Corp',
        description: 'Great    opportunity',
        applicationStatus: 'applied',
        dateApplied: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  question: 'Test question',
                  context: 'Test context',
                  tips: ['Tip 1'],
                },
              ]),
            },
          }],
        },
      });

      await openaiService.generateBehavioralQuestions(jobApplication, 5);

      const callArgs = mockedAxios.post.mock.calls[0];
      const requestBody = callArgs[1];
      const prompt = requestBody.messages[1].content;

      // Check that the title data with multiple spaces was collapsed to single space
      expect(prompt).toContain('Software Engineer'); // Spaces should be collapsed
      expect(prompt).not.toContain('Software     Engineer'); // Original had this, should be removed
    });
  });

  describe('generateBehavioralQuestions', () => {
    const mockJobApplication: IJobApplication = {
      _id: 'job-1',
      userId: 'user-1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      description: 'Develop scalable applications',
      skills: ['JavaScript', 'React', 'Node.js'],
      experienceLevel: 'mid',
      applicationStatus: 'applied',
      dateApplied: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate behavioral questions successfully', async () => {
      const mockQuestions = [
        {
          question: 'Tell me about a time when you faced a technical challenge',
          context: 'This tests problem-solving skills',
          tips: ['Use STAR method', 'Be specific'],
        },
        {
          question: 'Describe a situation where you worked in a team',
          context: 'This tests teamwork skills',
          tips: ['Highlight collaboration', 'Show results'],
        },
      ];

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify(mockQuestions),
            },
          }],
        },
      });

      const result = await openaiService.generateBehavioralQuestions(mockJobApplication, 2);

      expect(result).toHaveLength(2);
      expect(result[0].question).toBe(mockQuestions[0].question);
      expect(result[0].context).toBe(mockQuestions[0].context);
      expect(result[0].tips).toEqual(mockQuestions[0].tips);
      expect(result[1].question).toBe(mockQuestions[1].question);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 2000,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'You are an expert HR interviewer. Always return valid JSON.',
            }),
            expect.objectContaining({
              role: 'user',
            }),
          ]),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle questions with missing fields', async () => {
      const mockQuestions = [
        {
          question: 'Test question 1',
          // Missing context and tips
        },
        {
          title: 'Test question 2', // Using 'title' instead of 'question'
          context: 'Test context',
          // Missing tips
        },
      ];

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify(mockQuestions),
            },
          }],
        },
      });

      const result = await openaiService.generateBehavioralQuestions(mockJobApplication, 2);

      expect(result).toHaveLength(2);
      expect(result[0].question).toBe('Test question 1');
      expect(result[0].context).toBe('');
      expect(result[0].tips).toEqual([]);
      expect(result[1].question).toBe('Test question 2');
      expect(result[1].tips).toEqual([]);
    });

    it('should throw error when OpenAI returns no content', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: null,
            },
          }],
        },
      });

      await expect(
        openaiService.generateBehavioralQuestions(mockJobApplication, 5)
      ).rejects.toThrow('No response from OpenAI');

      expect(logger.error).toHaveBeenCalledWith(
        'Error generating behavioral questions:',
        expect.any(Error)
      );
    });

    it('should throw error when OpenAI returns no choices', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [],
        },
      });

      await expect(
        openaiService.generateBehavioralQuestions(mockJobApplication, 5)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle axios error', async () => {
      const axiosError = new Error('Network error');
      mockedAxios.post.mockRejectedValue(axiosError);

      await expect(
        openaiService.generateBehavioralQuestions(mockJobApplication, 5)
      ).rejects.toThrow('Network error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error generating behavioral questions:',
        axiosError
      );
    });

    it('should handle JSON parse error', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: 'Invalid JSON response',
            },
          }],
        },
      });

      await expect(
        openaiService.generateBehavioralQuestions(mockJobApplication, 5)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });

    it('should use default count of 10 when not specified', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                { question: 'Q1', context: 'C1', tips: [] },
              ]),
            },
          }],
        },
      });

      await openaiService.generateBehavioralQuestions(mockJobApplication);

      const callArgs = mockedAxios.post.mock.calls[0];
      const requestBody = callArgs[1];
      const prompt = requestBody.messages[1].content;

      expect(prompt).toContain('Generate 10 behavioral interview questions');
    });

    it('should include all job details in prompt', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                { question: 'Test', context: 'Test', tips: [] },
              ]),
            },
          }],
        },
      });

      await openaiService.generateBehavioralQuestions(mockJobApplication, 5);

      const callArgs = mockedAxios.post.mock.calls[0];
      const requestBody = callArgs[1];
      const prompt = requestBody.messages[1].content;

      expect(prompt).toContain('Software Engineer');
      expect(prompt).toContain('Tech Corp');
      expect(prompt).toContain('Develop scalable applications');
      expect(prompt).toContain('JavaScript, React, Node.js');
      expect(prompt).toContain('mid');
    });
  });

  describe('generateAnswerFeedback', () => {
    const mockQuestion = 'Tell me about a time when you faced a challenge';
    const mockAnswer = 'I faced a challenge when building a React application...';
    const mockJobContext = 'Software Engineer at Tech Corp';

    it('should generate answer feedback successfully', async () => {
      const mockFeedback = {
        feedback: 'Great answer! You used the STAR method effectively.',
        score: 8,
        strengths: ['Clear structure', 'Specific examples', 'Good outcome'],
        improvements: ['Add more technical details', 'Mention team collaboration'],
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockFeedback),
          },
        }],
      });

      const result = await openaiService.generateAnswerFeedback(
        mockQuestion,
        mockAnswer,
        mockJobContext
      );

      expect(result).toEqual(mockFeedback);
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('expert interview coach'),
          },
          {
            role: 'user',
            content: expect.stringContaining(mockQuestion),
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      // Verify prompt includes job context
      const callArgs = mockOpenAIInstance.chat.completions.create.mock.calls[0];
      const prompt = callArgs[0].messages[1].content;
      expect(prompt).toContain(mockQuestion);
      expect(prompt).toContain(mockAnswer);
      expect(prompt).toContain(mockJobContext);
    });

    it('should generate feedback without job context', async () => {
      const mockFeedback = {
        feedback: 'Good answer with room for improvement.',
        score: 6,
        strengths: ['Shows initiative'],
        improvements: ['Be more specific'],
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockFeedback),
          },
        }],
      });

      const result = await openaiService.generateAnswerFeedback(mockQuestion, mockAnswer);

      expect(result).toEqual(mockFeedback);

      const callArgs = mockOpenAIInstance.chat.completions.create.mock.calls[0];
      const prompt = callArgs[0].messages[1].content;
      expect(prompt).toContain(mockQuestion);
      expect(prompt).toContain(mockAnswer);
      expect(prompt).not.toContain('Job Context:');
    });

    it('should provide default values for missing feedback fields', async () => {
      const incompleteFeedback = {
        // Missing feedback, score, strengths, improvements
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(incompleteFeedback),
          },
        }],
      });

      const result = await openaiService.generateAnswerFeedback(mockQuestion, mockAnswer);

      expect(result.feedback).toBe('Good answer!');
      expect(result.score).toBe(7);
      expect(result.strengths).toEqual([]);
      expect(result.improvements).toEqual([]);
    });

    it('should throw error when OpenAI returns no content', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
          },
        }],
      });

      await expect(
        openaiService.generateAnswerFeedback(mockQuestion, mockAnswer)
      ).rejects.toThrow('No response from OpenAI');

      expect(logger.error).toHaveBeenCalledWith(
        'Error generating answer feedback:',
        expect.any(Error)
      );
    });

    it('should throw error when OpenAI returns no choices', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [],
      });

      await expect(
        openaiService.generateAnswerFeedback(mockQuestion, mockAnswer)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle OpenAI SDK error', async () => {
      const openaiError = new Error('OpenAI API error');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(openaiError);

      await expect(
        openaiService.generateAnswerFeedback(mockQuestion, mockAnswer)
      ).rejects.toThrow('OpenAI API error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error generating answer feedback:',
        openaiError
      );
    });

    it('should handle JSON parse error in feedback', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response',
          },
        }],
      });

      await expect(
        openaiService.generateAnswerFeedback(mockQuestion, mockAnswer)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });

    it('should use correct temperature and max_tokens', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              feedback: 'Test',
              score: 7,
              strengths: [],
              improvements: [],
            }),
          },
        }],
      });

      await openaiService.generateAnswerFeedback(mockQuestion, mockAnswer);

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 1000,
        })
      );
    });
  });

  describe('Private methods - createBehavioralQuestionsPrompt (tested indirectly)', () => {
    it('should create proper prompt structure for behavioral questions', async () => {
      const jobApplication: IJobApplication = {
        _id: 'job-1',
        userId: 'user-1',
        title: 'Senior Developer',
        company: 'Innovation Inc',
        description: 'Lead development team',
        skills: ['Python', 'AWS'],
        experienceLevel: 'senior',
        applicationStatus: 'applied',
        dateApplied: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                { question: 'Test', context: 'Test', tips: [] },
              ]),
            },
          }],
        },
      });

      await openaiService.generateBehavioralQuestions(jobApplication, 3);

      const callArgs = mockedAxios.post.mock.calls[0];
      const prompt = callArgs[1].messages[1].content;

      // Verify prompt structure
      expect(prompt).toContain('Generate 3 behavioral interview questions');
      expect(prompt).toContain('Job Title: Senior Developer');
      expect(prompt).toContain('Company: Innovation Inc');
      expect(prompt).toContain('Job Description: Lead development team');
      expect(prompt).toContain('Skills: Python, AWS');
      expect(prompt).toContain('Experience Level: senior');
    });
  });

  describe('Private methods - createFeedbackPrompt (tested indirectly)', () => {
    it('should create proper prompt structure for feedback', async () => {
      const question = 'Describe a challenge';
      const answer = 'I faced a technical challenge...';
      const jobContext = 'Backend Developer role';

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              feedback: 'Test',
              score: 7,
              strengths: [],
              improvements: [],
            }),
          },
        }],
      });

      await openaiService.generateAnswerFeedback(question, answer, jobContext);

      const callArgs = mockOpenAIInstance.chat.completions.create.mock.calls[0];
      const prompt = callArgs[0].messages[1].content;

      // Verify prompt structure
      expect(prompt).toContain('INTERVIEW QUESTION:');
      expect(prompt).toContain('Describe a challenge');
      expect(prompt).toContain('CANDIDATE\'S ANSWER:');
      expect(prompt).toContain('I faced a technical challenge...');
      expect(prompt).toContain('JOB CONTEXT:');
      expect(prompt).toContain('Backend Developer role');
      expect(prompt).toContain('STAR method');
      expect(prompt).toContain('Specificity and detail');
      expect(prompt).toContain('number between 1-10');
    });

    it('should create feedback prompt without job context when not provided', async () => {
      const question = 'Test question';
      const answer = 'Test answer';

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              feedback: 'Test',
              score: 7,
              strengths: [],
              improvements: [],
            }),
          },
        }],
      });

      await openaiService.generateAnswerFeedback(question, answer);

      const callArgs = mockOpenAIInstance.chat.completions.create.mock.calls[0];
      const prompt = callArgs[0].messages[1].content;

      expect(prompt).toContain('INTERVIEW QUESTION:');
      expect(prompt).toContain('Test question');
      expect(prompt).toContain('CANDIDATE\'S ANSWER:');
      expect(prompt).toContain('Test answer');
      expect(prompt).not.toContain('JOB CONTEXT:');
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle empty skills array', async () => {
      const jobApplication: IJobApplication = {
        _id: 'job-1',
        userId: 'user-1',
        title: 'Developer',
        company: 'TechCo',
        description: 'Dev role',
        skills: [],
        applicationStatus: 'applied',
        dateApplied: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                { question: 'Test', context: 'Test', tips: [] },
              ]),
            },
          }],
        },
      });

      await openaiService.generateBehavioralQuestions(jobApplication, 1);

      const callArgs = mockedAxios.post.mock.calls[0];
      const prompt = callArgs[1].messages[1].content;

      expect(prompt).toContain('Skills: Not specified');
    });

    it('should handle missing experienceLevel', async () => {
      const jobApplication: IJobApplication = {
        _id: 'job-1',
        userId: 'user-1',
        title: 'Developer',
        company: 'TechCo',
        description: 'Dev role',
        applicationStatus: 'applied',
        dateApplied: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify([
                { question: 'Test', context: 'Test', tips: [] },
              ]),
            },
          }],
        },
      });

      await openaiService.generateBehavioralQuestions(jobApplication, 1);

      const callArgs = mockedAxios.post.mock.calls[0];
      const prompt = callArgs[1].messages[1].content;

      expect(prompt).toContain('Experience Level: Not specified');
    });

    it('should handle axios timeout error', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ECONNABORTED';
      mockedAxios.post.mockRejectedValue(timeoutError);

      const jobApplication: IJobApplication = {
        _id: 'job-1',
        userId: 'user-1',
        title: 'Developer',
        company: 'TechCo',
        description: 'Dev role',
        applicationStatus: 'applied',
        dateApplied: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(
        openaiService.generateBehavioralQuestions(jobApplication, 1)
      ).rejects.toThrow('Timeout');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle OpenAI rate limit error', async () => {
      const rateLimitError: any = new Error('Rate limit exceeded');
      rateLimitError.response = {
        status: 429,
        data: { error: { message: 'Rate limit exceeded' } },
      };
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(rateLimitError);

      await expect(
        openaiService.generateAnswerFeedback('Question', 'Answer')
      ).rejects.toThrow('Rate limit exceeded');

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
