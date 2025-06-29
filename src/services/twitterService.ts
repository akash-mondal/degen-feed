import API_CONFIG from './config';
import { TwitterResponse } from '../types';

export class TwitterService {
  private static instance: TwitterService;

  public static getInstance(): TwitterService {
    if (!TwitterService.instance) {
      TwitterService.instance = new TwitterService();
    }
    return TwitterService.instance;
  }

  async getUserTweets(username: string): Promise<TwitterResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.twitter.baseUrl}/twitter/user/last_tweets?userName=${username}&includeReplies=false`,
        {
          method: 'GET',
          headers: {
            'X-API-Key': API_CONFIG.twitter.key,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the API response to match our expected format
      const transformedResponse: TwitterResponse = {
        tweets: data.data?.tweets?.map((tweet: any) => ({
          id: tweet.id,
          url: tweet.url,
          text: tweet.text,
          source: tweet.source,
          retweetCount: tweet.retweetCount,
          replyCount: tweet.replyCount,
          likeCount: tweet.likeCount,
          quoteCount: tweet.quoteCount,
          viewCount: tweet.viewCount,
          createdAt: tweet.createdAt,
          lang: tweet.lang,
          bookmarkCount: tweet.bookmarkCount,
          isReply: tweet.isReply,
          author: {
            userName: tweet.author.userName,
            name: tweet.author.name,
            profilePicture: tweet.author.profilePicture,
            isBlueVerified: tweet.author.isBlueVerified
          }
        })) || [],
        has_next_page: data.data?.has_next_page || false,
        next_cursor: data.data?.next_cursor || '',
        status: data.status,
        message: data.msg || data.message || ''
      };

      return transformedResponse;
    } catch (error) {
      console.error('Error fetching tweets:', error);
      throw error;
    }
  }

  async getUserInfo(username: string) {
    try {
      const response = await fetch(
        `${API_CONFIG.twitter.baseUrl}/twitter/user/info?userName=${username}`,
        {
          method: 'GET',
          headers: {
            'X-API-Key': API_CONFIG.twitter.key,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }
}