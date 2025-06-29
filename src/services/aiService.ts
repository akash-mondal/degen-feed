import API_CONFIG from './config';
import { Tweet, TelegramMessage } from '../types';

export class AIService {
  private static instance: AIService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private isWithin24Hours(dateString: string): boolean {
    const messageTime = new Date(dateString).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - messageTime) <= twentyFourHours;
  }

  async summarizeContent(
    tweets: Tweet[] = [], 
    telegramMessages: TelegramMessage[] = [], 
    twitterUsername?: string, 
    telegramChannelName?: string,
    summaryLength: 'concise' | 'detailed' | 'comprehensive' = 'detailed'
  ): Promise<{ twitterSummary?: string; telegramSummary?: string }> {
    try {
      const now = new Date();
      const currentDateTime = now.toISOString();
      const currentDateTimeFormatted = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      let twitterSummary: string | undefined;
      let telegramSummary: string | undefined;

      // Get word count based on summary length
      const getWordCount = (length: 'concise' | 'detailed' | 'comprehensive', hasContent: boolean) => {
        if (!hasContent) return '20';
        
        switch (length) {
          case 'concise': return '20-30';
          case 'detailed': return '50-75';
          case 'comprehensive': return '100-150';
          default: return '50-75';
        }
      };

      // Process Twitter content
      if (tweets.length > 0 && twitterUsername) {
        const recentTweets = tweets.filter(tweet => this.isWithin24Hours(tweet.createdAt));
        const olderTweets = tweets.filter(tweet => !this.isWithin24Hours(tweet.createdAt));

        if (recentTweets.length === 0) {
          const oldTweetTexts = olderTweets.slice(0, 5).map(tweet => 
            `"${tweet.text}" (${new Date(tweet.createdAt).toLocaleDateString()})`
          ).join('\n\n');

          const prompt = `Current date and time: ${currentDateTimeFormatted}

@${twitterUsername} has not posted any tweets recently. Write a brief ${getWordCount(summaryLength, false)} word summary about what their last tweets were about. Be conversational and natural. Start with "${twitterUsername}" and then describe their content.

Their previous tweets:
${oldTweetTexts}`;

          twitterSummary = await this.callAI(prompt, `You are a social media observer. Write exactly ${getWordCount(summaryLength, false)} words in a conversational tone about what someone's last tweets were about. ALWAYS start with the person's name "${twitterUsername}" followed by their content description. Be natural and specific.`);
        } else {
          // Get top 5 most engaging tweets (by likes + retweets)
          const topTweets = recentTweets
            .sort((a, b) => (b.likeCount + b.retweetCount) - (a.likeCount + a.retweetCount))
            .slice(0, 5);

          const recentTweetTexts = topTweets.map(tweet => {
            const tweetDate = new Date(tweet.createdAt);
            const hoursAgo = Math.floor((now.getTime() - tweetDate.getTime()) / (1000 * 60 * 60));
            const timeAgo = hoursAgo === 0 ? 'just now' : `${hoursAgo}h ago`;
            
            return `"${tweet.text}" (${tweet.likeCount} likes, ${tweet.retweetCount} retweets, ${timeAgo})`;
          }).join('\n\n');

          const wordCount = getWordCount(summaryLength, true);

          const prompt = `Current date and time: ${currentDateTimeFormatted}

Write a detailed, conversational summary of what @${twitterUsername} has been posting about on X recently. Include specific names, companies, topics, numbers, and key details mentioned. Be natural and engaging, like you're telling a friend what's happening. Write ${wordCount} words. Start with "${twitterUsername}" and then describe their content.

Recent posts (top 5 by engagement):
${recentTweetTexts}`;

          twitterSummary = await this.callAI(prompt, `You are a social media observer who writes detailed, conversational summaries. Write ${wordCount} words that capture the key details, names, companies, topics, and numbers mentioned. ALWAYS start with the person's name "${twitterUsername}" followed by their content description. Be specific and include important context. Write as flowing, natural paragraphs.`);
        }
      }

      // Process Telegram content
      if (telegramMessages.length > 0 && telegramChannelName) {
        const recentMessages = telegramMessages.filter(msg => this.isWithin24Hours(msg.date));

        if (recentMessages.length === 0) {
          telegramSummary = `${telegramChannelName} has no recent messages in the current period.`;
        } else {
          // Get top 5 messages (by views if available, otherwise most recent)
          const topMessages = recentMessages
            .sort((a, b) => {
              if (a.views && b.views) return b.views - a.views;
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            })
            .slice(0, 5);

          const recentMessageTexts = topMessages.map(msg => {
            const msgDate = new Date(msg.date);
            const hoursAgo = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60));
            const timeAgo = hoursAgo === 0 ? 'just now' : `${hoursAgo}h ago`;
            
            return `"${msg.text}" (by ${msg.sender.name}, ${timeAgo})`;
          }).join('\n\n');

          const wordCount = getWordCount(summaryLength, true);

          const prompt = `Current date and time: ${currentDateTimeFormatted}

Write a detailed, conversational summary of what has been discussed in the ${telegramChannelName} Telegram channel recently. Include specific topics, key points, and important details mentioned. Be natural and engaging, like you're telling a friend what's happening. Write ${wordCount} words. Start with "${telegramChannelName}" and then describe the content.

Recent messages (top 5 by engagement):
${recentMessageTexts}`;

          telegramSummary = await this.callAI(prompt, `You are a social media observer who writes detailed, conversational summaries. Write ${wordCount} words that capture the key topics, discussions, and important details mentioned. ALWAYS start with the channel name "${telegramChannelName}" followed by the content description. Be specific and include important context. Write as flowing, natural paragraphs.`);
        }
      }

      return { twitterSummary, telegramSummary };
    } catch (error) {
      console.error('Error generating summaries:', error);
      return { 
        twitterSummary: tweets.length > 0 ? 'Unable to generate X summary at this time.' : undefined,
        telegramSummary: telegramMessages.length > 0 ? 'Unable to generate Telegram summary at this time.' : undefined
      };
    }
  }

  private async callAI(prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch(`${API_CONFIG.ai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.ai.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false,
        max_tokens: 4000,
        temperature: 0.7,
        stop: ["<think>", "</think>"]
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || 'No summary available.';
    content = this.cleanContent(content);
    
    return content || 'Unable to generate summary at this time.';
  }

  private cleanContent(content: string): string {
    // Remove thinking patterns
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    content = content.replace(/\*\*Think[\s\S]*?\*\*/gi, '');
    content = content.replace(/^Think[\s\S]*?:/gim, '');
    content = content.replace(/^Thinking[\s\S]*?:/gim, '');
    content = content.replace(/^Let me[\s\S]*?:/gim, '');
    content = content.replace(/^Hmm[\s\S]*?:/gim, '');
    content = content.replace(/^Based on[\s\S]*?,/gim, '');
    
    // Remove formal formatting
    content = content.replace(/^\d+\.\s*/gm, '');
    content = content.replace(/^\*\s*/gm, '');
    content = content.replace(/^-\s*/gm, '');
    content = content.replace(/\*\*/g, '');
    content = content.replace(/##/g, '');
    
    // Clean up and trim
    content = content.trim();
    
    return content;
  }

  // Legacy method for backward compatibility
  async summarizeTweets(tweets: Tweet[], username: string): Promise<string> {
    const result = await this.summarizeContent(tweets, [], username, undefined);
    return result.twitterSummary || 'Unable to generate summary at this time.';
  }
}