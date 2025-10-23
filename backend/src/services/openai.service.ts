import dotenv from 'dotenv';
import OpenAI from 'openai';
import { IJobApplication } from '../types/jobs.types';
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

  async generateBehavioralQuestions(
    jobApplication: IJobApplication,
    count: number = 10
  ): Promise<OpenAIBehavioralQuestion[]> {
    try {
      const prompt = this.createBehavioralQuestionsPrompt(jobApplication, count);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR interviewer who creates tailored behavioral interview questions based on job descriptions. Always respond with valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const questions = JSON.parse(response);
      
      if (!Array.isArray(questions)) {
        throw new Error('Invalid response format from OpenAI');
      }

      return questions.map((q: any) => ({
        question: q.question || q.title || '',
        context: q.context || '',
        tips: q.tips || [],
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
        model: 'gpt-3.5-turbo',
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
