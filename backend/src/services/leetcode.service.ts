import axios from 'axios';
import { CreateQuestionInput } from '../types/question.types';

export interface ExternalQuestion {
  id: string;
  title: string;
  url: string;
  difficulty?: string;
  tags?: string[];
}

// Base URL for the community LeetCode API
const BASE = 'https://leetcode-api-pied.vercel.app/';

export class LeetCodeService {
  async search(query: string): Promise<ExternalQuestion[]> {
    if (!query) return [];

    const url = `${BASE}search?query=${encodeURIComponent(query)}`;

    const resp = await axios.get(url, { timeout: 10000 });

    const data = resp.data;

    // Expecting array-like response; fallback to empty
    if (!Array.isArray(data)) return [];

    const results: ExternalQuestion[] = data.map((item: unknown) => ({
      id: item.id ?? item.slug ?? item.title ?? String(Math.random()),
      title: item.title ?? item.name ?? item.slug ?? '',
      url: item.url ?? item.link ?? item.leetcodeUrl ?? item.title ?? '',
      difficulty: item.difficulty ?? item.level ?? undefined,
      tags: item.tags ?? item.topicTags ?? undefined,
    }));

    return results;
  }

  toCreateInput(ext: ExternalQuestion): CreateQuestionInput {
    return {
      name: ext.title,
      link: ext.url ?? '',
      url: ext.url,
      difficulty: ext.difficulty,
      tags: ext.tags ?? [],
    };
  }
}

export const leetService = new LeetCodeService();
