import dotenv from 'dotenv';
import OpenAI from 'openai';
import { IJobApplication } from '../types/jobs.types';
import axios from 'axios';
import { OpenAIBehavioralQuestion, OpenAIFeedback } from '../types/questions.types';
import logger from '../utils/logger.util';

// Ensure environment variables are loaded
dotenv.config();

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
+   * Sanitize text by removing all CRLF and control characters
+   */
  private sanitizeText(text: string | undefined): string {
    if (!text) return '';
    // eslint-disable-next-line no-control-regex
    return text
      .replace(/[\r\n\t\f\v\u0000-\u001f\u007f-\u009f]/g, ' ')  // Remove all control characters
      .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .trim();  // Remove leading/trailing spaces
 }

  async generateBehavioralQuestions(
  jobApplication: IJobApplication,
  count = 10
): Promise<OpenAIBehavioralQuestion[]> {
  try {
    const title = this.sanitizeText(jobApplication.title);
    const company = this.sanitizeText(jobApplication.company);
    const description = this.sanitizeText(jobApplication.description);
    const skills = jobApplication.skills?.map(s => this.sanitizeText(s)).join(', ') ?? 'Not specified';
    const experienceLevel = this.sanitizeText(jobApplication.experienceLevel) || 'Not specified';

    const prompt = `Generate ${count} behavioral interview questions for:
    Job Title: ${title}
    Company: ${company}
    Job Description: ${description}
    Skills: ${skills}
    Experience Level: ${experienceLevel}

    Return as JSON array: [{"question": "...", "context": "...", "tips": [...]}]`;

    // Use axios instead of OpenAI SDK
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert HR interviewer. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    if (typeof content !== 'string') {
      throw new Error('Invalid response format from OpenAI');
    }

    interface OpenAIQuestionResponse {
      question?: string;
      title?: string;
      context?: string;
      tips?: string[];
    }
    
    const questions = JSON.parse(content) as OpenAIQuestionResponse[];
    return questions.map((q: OpenAIQuestionResponse): OpenAIBehavioralQuestion => ({
      question: (q.question ?? q.title) ?? '',
      context: q.context ?? '',
      tips: q.tips ?? []
    }));
  } catch (error) {
    logger.error('Error generating behavioral questions:', error);
    throw error;
  }
}

  async generateAnswerFeedback(
    question: string,
    answer: string,
    jobContext?: string
  ): Promise<OpenAIFeedback> {
    try {
      // Validate that answer is provided and not empty
      if (!answer || answer.trim().length === 0) {
        logger.error('Empty answer provided to generateAnswerFeedback');
        throw new Error('Answer is required for feedback generation');
      }

      logger.info('Generating feedback for answer', {
        question,
        questionLength: question.length,
        answer,
        answerLength: answer.length
      });

      const prompt = this.createFeedbackPrompt(question, answer, jobContext);

      logger.debug('Feedback prompt created', {
        prompt
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach who provides constructive feedback on behavioral interview answers. Always respond with valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        logger.error('No response content from OpenAI');
        throw new Error('No response from OpenAI');
      }
      
      if (typeof response !== 'string') {
        throw new Error('Invalid response format from OpenAI');
      }

      logger.debug('OpenAI response received', {
        response
      });

      let feedback;
      try {
        feedback = JSON.parse(response);
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response as JSON', {
          error: parseError,
          response: response.substring(0, 500)
        });
        throw new Error('Invalid JSON response from OpenAI');
      }

      logger.info('Feedback generated', {
        score: feedback.score,
        feedbackLength: feedback.feedback?.length ?? 0,
        strengthsCount: feedback.strengths?.length ?? 0,
        improvementsCount: feedback.improvements?.length ?? 0
      });
      
      return {
        feedback: feedback.feedback ?? 'Good answer!',
        score: feedback.score ?? 7,
        strengths: feedback.strengths ?? [],
        improvements: feedback.improvements ?? [],      };
    } catch (error) {
      logger.error('Error generating answer feedback:', error);
      throw error;
    }
  }

  private createBehavioralQuestionsPrompt(
    jobApplication: IJobApplication,
    count: number
  ): string {
    return `
Generate ${count} behavioral interview questions for the following job position:

Job Title: ${jobApplication.title}
Company: ${jobApplication.company}
Job Description: ${jobApplication.description}
    Required Skills: ${jobApplication.skills?.join(', ') ?? 'Not specified'}
    Experience Level: ${jobApplication.experienceLevel ?? 'Not specified'}

Please create questions that are:
1. Relevant to the job role and industry
2. Follow the STAR method (Situation, Task, Action, Result)
3. Test key competencies for this position
4. Vary in difficulty and focus areas

Return the response as a JSON array with this exact format:
[
  {
    "question": "Tell me about a time when...",
    "context": "This question assesses...",
    "tips": ["Use the STAR method", "Be specific with examples"]
  }
]

Ensure the JSON is valid and properly formatted.`;
  }

  private createFeedbackPrompt(
    question: string,
    answer: string,
    jobContext?: string
  ): string {
    // Ensure answer is properly included and escaped
    const sanitizedAnswer = answer.trim();
    const sanitizedQuestion = question.trim();
    
    if (!sanitizedAnswer || sanitizedAnswer.length === 0) {
      throw new Error('Answer cannot be empty when generating feedback');
    }

    return `You are an expert interview coach. Analyze the following behavioral interview answer and provide detailed, specific feedback tailored to the actual content of the answer provided.

INTERVIEW QUESTION:
${sanitizedQuestion}

CANDIDATE'S ANSWER:
${sanitizedAnswer}

${jobContext ? `JOB CONTEXT: ${jobContext}` : ''}

INSTRUCTIONS:
Carefully read and analyze the candidate's answer above. Your feedback MUST be specific to the content of their answer. Do not provide generic feedback.

Evaluate the answer based on:
1. Structure (STAR method usage - Situation, Task, Action, Result)
2. Specificity and detail - Does the answer include concrete examples?
3. Relevance to the question - Does the answer address what was asked?
4. Professional communication - Clarity, conciseness, professionalism
5. Demonstration of skills/competencies - What skills does the answer showcase?

IMPORTANT: Your feedback must reference specific details from the candidate's answer. Mention specific examples, situations, or points they made. Do not provide generic feedback that could apply to any answer.

Return your response as valid JSON with this exact format:
{
  "feedback": "A detailed paragraph (3-5 sentences) that specifically references content from the candidate's answer. Mention specific examples they provided, what they did well, and what could be improved based on their actual response.",
  "score": <number between 1-10>,
  "strengths": ["Specific strength 1 based on their answer", "Specific strength 2 based on their answer", "Specific strength 3 based on their answer"],
  "improvements": ["Specific improvement 1 based on their answer", "Specific improvement 2 based on their answer"]
}

Be constructive, encouraging, and provide actionable advice that is tailored to their specific answer.`;
  }

}

// Export class for testing
export { OpenAIService };

// Export singleton instance for application use
export const openaiService = new OpenAIService();
