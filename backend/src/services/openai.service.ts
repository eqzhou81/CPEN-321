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
      apiKey: apiKey,
    });
  }

  /**
+   * Sanitize text by removing all CRLF and control characters
+   */
  private sanitizeText(text: string | undefined): string {
    if (!text) return '';
    return text
      .replace(/[\r\n\t\f\v\u0000-\u001f\u007f-\u009f]/g, ' ')  // Remove all control characters
      .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .trim();  // Remove leading/trailing spaces
 }

  async generateBehavioralQuestions(
  jobApplication: IJobApplication,
  count: number = 10
): Promise<OpenAIBehavioralQuestion[]> {
  try {
    const title = this.sanitizeText(jobApplication.title);
    const company = this.sanitizeText(jobApplication.company);
    const description = this.sanitizeText(jobApplication.description);
    const skills = jobApplication.skills?.map(s => this.sanitizeText(s)).join(', ') || 'Not specified';
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
    if (!content) throw new Error('No response from OpenAI');

    const questions = JSON.parse(content);
    return questions.map((q: any) => ({
      question: q.question || q.title || '',
      context: q.context || '',
      tips: q.tips || []
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
      const prompt = this.createFeedbackPrompt(question, answer, jobContext);

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
        throw new Error('No response from OpenAI');
      }

      const feedback = JSON.parse(response);
      
      return {
        feedback: feedback.feedback || 'Good answer!',
        score: feedback.score || 7,
        strengths: feedback.strengths || [],
        improvements: feedback.improvements || [],
      };
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
Required Skills: ${jobApplication.skills?.join(', ') || 'Not specified'}
Experience Level: ${jobApplication.experienceLevel || 'Not specified'}

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
    return `
Analyze this behavioral interview answer and provide constructive feedback:

Question: ${question}
Answer: ${answer}
${jobContext ? `Job Context: ${jobContext}` : ''}

Please evaluate the answer based on:
1. Structure (STAR method usage)
2. Specificity and detail
3. Relevance to the question
4. Professional communication
5. Demonstration of skills/competencies

Provide a score from 1-10 and return the response as JSON with this exact format:
{
  "feedback": "Detailed feedback paragraph...",
  "score": 8,
  "strengths": ["List of strengths"],
  "improvements": ["List of areas for improvement"]
}

Be constructive and encouraging while providing actionable advice.`;
  }

}

export const openaiService = new OpenAIService();
