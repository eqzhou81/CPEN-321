import axios from 'axios';
import { ExternalQuestion, leetService } from './leetcode.service';
import logger from '../utils/logger.util';

// List of available LeetCode question types
const LEETCODE_TOPICS = [
  'arrays', 'strings', 'linked list', 'trees', 'graphs', 'sliding window', 'heap',
  'dynamic programming', 'backtracking', 'greedy', 'math', 'bit manipulation',
  'two pointers', 'stack', 'queue', 'recursion', 'binary search', 'hash table',
];


interface GenerateQuestionsResult {
  topic: string;
  questions: ExternalQuestion[];
}

export async function generateQuestions(jobDescription: string): Promise<GenerateQuestionsResult[]> {
  // 1. Call OpenAI API to get suggested LeetCode topics
  const openAIPrompt = `Given the following job description, suggest the most relevant LeetCode question types (from this list: ${LEETCODE_TOPICS.join(', ')}). Return 3-5 types that would best help a candidate prepare. Only return the types, do not explain why. \n\nJob Description:\n${jobDescription}`;

  try {
    const openAIResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for interview preparation. Try to structure the response to be technical and concise.' },
          { role: 'user', content: openAIPrompt },
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '100'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE ?? '0.5'),
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );


    // Log the full OpenAI API response
    logger.debug('FULL OPENAI API RESPONSE:', JSON.stringify(openAIResponse.data, null, 2));

    // Log the raw OpenAI response
    const rawOpenAI = openAIResponse.data.choices[0].message.content;
    logger.debug('RAW OPENAI RESPONSE:', rawOpenAI);

    // Parse the response to extract suggested types
    const suggestedTypes = extractTypesFromOpenAI(rawOpenAI);
    logger.debug('PARSED SUGGESTED TYPES:', suggestedTypes);

    // 2. For each type, call LeetCode search API to get questions (no difficulty split)
    const dbResults: GenerateQuestionsResult[] = [];
    const questionsPerTopic = parseInt(process.env.QUESTIONS_PER_TOPIC ?? '6');
    for (const topic of suggestedTypes) {
      const questions = await leetcodeSearch({ topic, limit: questionsPerTopic });
      dbResults.push({ topic, questions });
    }

    // (No additional LeetCode search by difficulty)

    return dbResults;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[generateQuestions] Error calling OpenAI API:', errorMessage);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response) {
        logger.error('[generateQuestions] OpenAI Response Status:', axiosError.response.status);
        logger.error('[generateQuestions] OpenAI Response Data:', JSON.stringify(axiosError.response.data, null, 2));
      }
    }
    throw error;
  }
}

// Helper to extract types from OpenAI response
function extractTypesFromOpenAI(response: string): string[] {
  // Try to extract comma/line separated list of types
  return response
    .toLowerCase()
    .split(/\n|,|\d+\.|-/)
    .map(s => s.trim())
    .filter(s => s && LEETCODE_TOPICS.includes(s));
}

// Placeholder for LeetCode search function
async function leetcodeSearch({ topic, limit }: { topic: string, limit: number }): Promise<ExternalQuestion[]> {
  const results = await leetService.search(topic);
  return results.slice(0, limit);
}
