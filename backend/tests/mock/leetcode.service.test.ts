import axios from 'axios';
import { leetService } from '../../src/services/leetcode.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LeetCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should return empty array for empty query', async () => {
      const result = await leetService.search('');
      expect(result).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return empty array for null query', async () => {
      const result = await leetService.search(null as any);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined query', async () => {
      const result = await leetService.search(undefined as any);
      expect(result).toEqual([]);
    });

    it('should search and return questions successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            title: 'Two Sum',
            url: 'https://leetcode.com/problems/two-sum',
            difficulty: 'Easy',
            tags: ['Array', 'Hash Table'],
          },
          {
            slug: 'reverse-linked-list',
            name: 'Reverse Linked List',
            link: 'https://leetcode.com/problems/reverse-linked-list',
            level: 'Medium',
            topicTags: ['Linked List'],
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await leetService.search('array');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum',
        difficulty: 'Easy',
        tags: ['Array', 'Hash Table'],
      });
      expect(result[1].id).toBeDefined();
      expect(result[1].title).toBe('Reverse Linked List');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('array'),
        { timeout: 10000 }
      );
    });

    it('should handle non-array response', async () => {
      mockedAxios.get.mockResolvedValue({ data: { error: 'Invalid response' } });

      const result = await leetService.search('test');

      expect(result).toEqual([]);
    });

    it('should handle null response data', async () => {
      mockedAxios.get.mockResolvedValue({ data: null });

      const result = await leetService.search('test');

      expect(result).toEqual([]);
    });

    it('should handle items with missing fields', async () => {
      const mockResponse = {
        data: [
          {
            slug: 'test-problem',
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await leetService.search('test');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBeDefined();
      expect(result[0].title).toBe('test-problem');
      expect(result[0].url).toBe('');
    });

    it('should handle axios errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(leetService.search('test')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('timeout of 10000ms exceeded'));

      await expect(leetService.search('test')).rejects.toThrow();
    });

    it('should generate unique IDs for items without id', async () => {
      const mockResponse = {
        data: [
          { title: 'Problem 1' },
          { title: 'Problem 2' },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await leetService.search('test');

      expect(result).toHaveLength(2);
      expect(result[0].id).not.toBe(result[1].id);
    });
  });

  describe('toCreateInput', () => {
    it('should convert ExternalQuestion to CreateQuestionInput', () => {
      const externalQuestion = {
        id: '1',
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum',
        difficulty: 'Easy',
        tags: ['Array', 'Hash Table'],
      };

      const result = leetService.toCreateInput(externalQuestion);

      expect(result).toEqual({
        name: 'Two Sum',
        link: 'https://leetcode.com/problems/two-sum',
        url: 'https://leetcode.com/problems/two-sum',
        difficulty: 'Easy',
        tags: ['Array', 'Hash Table'],
      });
    });



    it('should handle question with missing tags', () => {
      const externalQuestion = {
        id: '1',
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum',
        difficulty: 'Easy',
      };

      const result = leetService.toCreateInput(externalQuestion);

      expect(result.tags).toEqual([]);
    });

    it('should handle question with missing difficulty', () => {
      const externalQuestion = {
        id: '1',
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum',
        tags: ['Array'],
      };

      const result = leetService.toCreateInput(externalQuestion);

      expect(result.difficulty).toBeUndefined();
    });
  });
});

