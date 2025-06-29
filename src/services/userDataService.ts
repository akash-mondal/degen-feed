import { Topic, TelegramUser, UserData } from '../types';

export class UserDataService {
  private static instance: UserDataService;
  private static readonly USER_DATA_KEY = 'degen_feed_user_data';

  public static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService();
    }
    return UserDataService.instance;
  }

  saveUserData(telegramUser: TelegramUser | undefined, topics: Topic[]): void {
    const userData: UserData = {
      telegramUser,
      topics,
      lastUpdated: Date.now()
    };
    
    try {
      localStorage.setItem(UserDataService.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  loadUserData(): UserData {
    try {
      const stored = localStorage.getItem(UserDataService.USER_DATA_KEY);
      if (stored) {
        const userData: UserData = JSON.parse(stored);
        return userData;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }

    return {
      telegramUser: undefined,
      topics: [],
      lastUpdated: Date.now()
    };
  }

  clearUserData(): void {
    localStorage.removeItem(UserDataService.USER_DATA_KEY);
  }

  // Migrate from old cache format to new user data format
  migrateFromOldCache(): UserData {
    try {
      const oldCache = localStorage.getItem('degen_feed_cache');
      if (oldCache) {
        const cacheData = JSON.parse(oldCache);
        const userData: UserData = {
          telegramUser: undefined,
          topics: cacheData.topics || [],
          lastUpdated: cacheData.lastUpdated || Date.now()
        };
        
        // Save in new format
        this.saveUserData(undefined, userData.topics);
        
        // Remove old cache
        localStorage.removeItem('degen_feed_cache');
        
        return userData;
      }
    } catch (error) {
      console.error('Error migrating from old cache:', error);
    }

    return {
      telegramUser: undefined,
      topics: [],
      lastUpdated: Date.now()
    };
  }
}