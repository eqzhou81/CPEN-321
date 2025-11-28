import axios from 'axios';
import { generateQuestions } from '../../src/services/generateQuestions.service';
import { leetService } from '../../src/services/leetcode.service';
import logger from '../../src/utils/logger.util';

jest.mock('axios');
jest.mock('../../src/services/leetcode.service');
jest.mock('../../src/utils/logger.util');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedLeetService = leetService as jest.Mocked<typeof leetService>;

describe('generateQuestions service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_MODEL = 'gpt-4o';
    process.env.OPENAI_MAX_TOKENS = '100';
    process.env.OPENAI_TEMPERATURE = '0.5';
    process.env.QUESTIONS_PER_TOPIC = '6';
  });

  describe('generateQuestions', () => {
    it('should generate questions successfully', async () => {
      const jobDescription = 'Software Engineer position requiring React and Node.js';
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: 'arrays, strings, dynamic programming',
            },
          }],
        },
      };

      const mockLeetCodeQuestions = [
        { id: '1', title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum' },
        { id: '2', title: 'Reverse String', url: 'https://leetcode.com/problems/reverse-string' },
      ];

      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);
      (mockedLeetService.search as jest.Mock).mockResolvedValue(mockLeetCodeQuestions);

      const result = await generateQuestions(jobDescription);

      expect(result).toHaveLength(3);
      expect(result[0].topic).toBe('arrays');
      expect(result[0].questions).toHaveLength(2);
      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockedLeetService.search).toHaveBeenCalled();
    });

    it('should handle OpenAI API errors', async () => {
      const jobDescription = 'Test job description';
      mockedAxios.post.mockRejectedValue(new Error('OpenAI API error'));

      await expect(generateQuestions(jobDescription)).rejects.toThrow('OpenAI API error');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle axios error with response', async () => {
      const jobDescription = 'Test job description';
      const axiosError = {
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' },
        },
      };

      mockedAxios.post.mockRejectedValue(axiosError);

      await expect(generateQuestions(jobDescription)).rejects.toEqual(axiosError);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle empty OpenAI response', async () => {
      const jobDescription = 'Test job description';
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: '',
            },
          }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);

      const result = await generateQuestions(jobDescription);

      expect(result).toHaveLength(0);
    });

    it('should filter out invalid topics', async () => {
      const jobDescription = 'Software Engineer';
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: 'arrays, invalid-topic, strings, another-invalid',
            },
          }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);
      (mockedLeetService.search as jest.Mock).mockResolvedValue([]);

      const result = await generateQuestions(jobDescription);

      expect(result).toHaveLength(2);
      expect(result[0].topic).toBe('arrays');
      expect(result[1].topic).toBe('strings');
    });

    it('should handle topics with newlines and commas', async () => {
      const jobDescription = 'Software Engineer';
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: '1. arrays\n2. strings\n3. dynamic programming',
            },
          }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);
      (mockedLeetService.search as jest.Mock).mockResolvedValue([]);

      const result = await generateQuestions(jobDescription);

      expect(result).toHaveLength(3);
    });

    it('should limit questions per topic', async () => {
      const jobDescription = 'Software Engineer';
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: 'arrays',
            },
          }],
        },
      };

      const manyQuestions = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        title: `Question ${i}`,
        url: `https://leetcode.com/problems/question-${i}`,
      }));

      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);
      (mockedLeetService.search as jest.Mock).mockResolvedValue(manyQuestions);

      const result = await generateQuestions(jobDescription);

      expect(result[0].questions).toHaveLength(6);
    });

    it('should use environment variables for configuration', async () => {
      process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
      process.env.OPENAI_MAX_TOKENS = '200';
      process.env.OPENAI_TEMPERATURE = '0.7';
      process.env.QUESTIONS_PER_TOPIC = '10';

      const jobDescription = 'Software Engineer';
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: 'arrays',
            },
          }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);
      (mockedLeetService.search as jest.Mock).mockResolvedValue([]);

      await generateQuestions(jobDescription);

      const callArgs = mockedAxios.post.mock.calls[0];
      const requestBody = callArgs[1];
      expect(requestBody.model).toBe('gpt-3.5-turbo');
      expect(requestBody.max_tokens).toBe(200);
      expect(requestBody.temperature).toBe(0.7);
    });
  });
});

