import { TelegramResponse, TelegramMessage } from '../types';
import API_CONFIG from './config';

export class TelegramChannelService {
  private static instance: TelegramChannelService;
  private static readonly BASE_URL = API_CONFIG.telegram.baseUrl;

  public static getInstance(): TelegramChannelService {
    if (!TelegramChannelService.instance) {
      TelegramChannelService.instance = new TelegramChannelService();
    }
    return TelegramChannelService.instance;
  }

  async checkChannel(channelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${TelegramChannelService.BASE_URL}/check/${channelName}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TelegramResponse = await response.json();
      return data.valid_and_joinable || false;
    } catch (error) {
      console.error('Error checking Telegram channel:', error);
      return false;
    }
  }

  async getChannelMessages(channelName: string): Promise<TelegramMessage[]> {
    try {
      const response = await fetch(`${TelegramChannelService.BASE_URL}/scrape/${channelName}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if the response is an array (messages) or an object with a message property
      if (Array.isArray(data)) {
        // Filter messages from the last 24 hours
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        const recentMessages = data.filter((message: TelegramMessage) => {
          const messageTime = new Date(message.date).getTime();
          return (now - messageTime) <= twentyFourHours;
        });

        return recentMessages;
      } else if (data.message && data.message.includes('No activity')) {
        return [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching Telegram messages:', error);
      throw error;
    }
  }
}