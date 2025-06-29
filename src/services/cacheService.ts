import { Topic, CacheData } from '../types';

export class CacheService {
  private static instance: CacheService;
  private static readonly CACHE_KEY = 'degen_feed_cache';
  private static readonly CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  saveTopics(topics: Topic[]): void {
    const cacheData: CacheData = {
      topics,
      lastUpdated: Date.now()
    };
    localStorage.setItem(CacheService.CACHE_KEY, JSON.stringify(cacheData));
  }

  loadTopics(): Topic[] {
    try {
      const cached = localStorage.getItem(CacheService.CACHE_KEY);
      if (!cached) return [];

      const cacheData: CacheData = JSON.parse(cached);
      return cacheData.topics || [];
    } catch (error) {
      console.error('Error loading cache:', error);
      return [];
    }
  }

  isTopicStale(topic: Topic): boolean {
    const now = Date.now();
    return (now - topic.lastUpdated) > CacheService.CACHE_DURATION;
  }

  clearCache(): void {
    localStorage.removeItem(CacheService.CACHE_KEY);
  }
}