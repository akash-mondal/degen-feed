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
      let twitterSummary: string | undefined;
      let telegramSummary: string | undefined;

      const getWordCount = (length: 'concise' | 'detailed' | 'comprehensive', hasContent: boolean) => {
        if (!hasContent) return '20-30';
        switch (length) {
          case 'concise': return '30-40';
          case 'detailed': return '50-75';
          case 'comprehensive': return '100-150';
          default: return '50-75';
        }
      };

      // Process Twitter content
      if (tweets.length > 0 && twitterUsername) {
        const recentTweets = tweets.filter(tweet => this.isWithin24Hours(tweet.createdAt));
        const olderTweets = tweets.filter(tweet => !this.isWithin24Hours(tweet.createdAt));
        const wordCount = getWordCount(summaryLength, recentTweets.length > 0);

        if (recentTweets.length === 0) {
          const oldTweetTexts = olderTweets.slice(0, 5).map(tweet => 
            `"${tweet.text}" (from ${new Date(tweet.createdAt).toLocaleDateString()})`
          ).join('\n\n');

          const systemPrompt = `You are a social media analyst. The user you're tracking hasn't posted recently. Briefly summarize their last known activity in a conversational tone, making it clear the information isn't current. Write about ${wordCount} words.`;
          const userPrompt = `@${twitterUsername} has been quiet. What were their last few posts about?\n\nPrevious Posts:\n${oldTweetTexts}`;
          
          twitterSummary = await this.callAI(userPrompt, systemPrompt, twitterUsername);

        } else {
          const topTweets = recentTweets
            .sort((a, b) => (b.likeCount + b.retweetCount) - (a.likeCount + a.retweetCount))
            .slice(0, 5);

          const recentTweetTexts = topTweets.map(tweet => {
            const hoursAgo = Math.floor((now.getTime() - new Date(tweet.createdAt).getTime()) / 3600000);
            return `"${tweet.text}" (Likes: ${tweet.likeCount}, Retweets: ${tweet.retweetCount}, ~${hoursAgo}h ago)`;
          }).join('\n\n');

          const systemPrompt = `You are a sharp social media analyst. Your goal is to synthesize raw social media posts into a clear, engaging, and concise briefing. Identify the key themes, topics, and sentiment. Weave these details into a smooth, easy-to-read paragraph of about ${wordCount} words. The tone should be informative but conversational. Do not use lists. Vary your sentence structure and avoid starting every summary with the person's name.`;
          const userPrompt = `Summarize the recent X activity for @${twitterUsername} based on their top posts from the last 24 hours.\n\nPosts:\n${recentTweetTexts}`;
          
          twitterSummary = await this.callAI(userPrompt, systemPrompt, twitterUsername);
        }
      }

      // Process Telegram content
      if (telegramMessages.length > 0 && telegramChannelName) {
        const recentMessages = telegramMessages.filter(msg => this.isWithin24Hours(msg.date));
        const wordCount = getWordCount(summaryLength, recentMessages.length > 0);

        if (recentMessages.length === 0) {
          telegramSummary = `There has been no new activity in the ${telegramChannelName} channel recently.`;
        } else {
          const topMessages = recentMessages
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);

          const recentMessageTexts = topMessages.map(msg => {
             const hoursAgo = Math.floor((now.getTime() - new Date(msg.date).getTime()) / 3600000);
            return `"${msg.text}" (from ${msg.sender.name}, ~${hoursAgo}h ago)`;
          }).join('\n\n');

          const systemPrompt = `You are an analyst summarizing a group chat. Your goal is to synthesize the key discussion points, topics, and overall sentiment from a Telegram channel into a clear, engaging summary. Identify the main themes of conversation. Weave these details into a smooth, easy-to-read paragraph of about ${wordCount} words. The tone should be informative and conversational. Do not use lists.`;
          const userPrompt = `Summarize the recent discussion in the "${telegramChannelName}" Telegram channel based on these key messages from the last 24 hours.\n\nMessages:\n${recentMessageTexts}`;

          telegramSummary = await this.callAI(userPrompt, systemPrompt, undefined, telegramChannelName);
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

  private async callAI(prompt: string, systemPrompt: string, twitterUsername?: string, telegramChannelName?: string): Promise<string> {
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
    content = this.cleanContent(content, twitterUsername, telegramChannelName);
    
    return content || 'Unable to generate summary at this time.';
  }

  private cleanContent(content: string, twitterUsername?: string, telegramChannelName?: string): string {
    // Remove thinking patterns and markdown
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    content = content.replace(/\*\*Think[\s\S]*?\*\*/gi, '');
    content = content.replace(/^Think[\s\S]*?:/gim, '');
    content = content.replace(/^Thinking[\s\S]*?:/gim, '');
    content = content.replace(/^Let me[\s\S]*?:/gim, '');
    content = content.replace(/^Hmm[\s\S]*?:/gim, '');
    content = content.replace(/^Based on[\s\S]*?,/gim, '');
    content = content.replace(/^\d+\.\s*/gm, '');
    content = content.replace(/^[\*\-]\s*/gm, '');
    content = content.replace(/[\*#]/g, '');
    
    // Remove introductory phrases that the AI might still add
    content = content.replace(/^Here's a summary of the recent activity:/i, '');
    content = content.replace(/^Here's a summary:/i, '');

    // Clean up and trim
    content = content.trim();
    
    // Check if the summary starts with the username (in quotes) and remove it
    if (twitterUsername && content.toLowerCase().startsWith(`"${twitterUsername.toLowerCase()}"`)) {
        content = content.substring(twitterUsername.length + 2).trim();
    }
    if (telegramChannelName && content.toLowerCase().startsWith(`"${telegramChannelName.toLowerCase()}"`)) {
        content = content.substring(telegramChannelName.length + 2).trim();
    }

    return content;
  }

  // Legacy method for backward compatibility
  async summarizeTweets(tweets: Tweet[], username: string): Promise<string> {
    const result = await this.summarizeContent(tweets, [], username, undefined);
    return result.twitterSummary || 'Unable to generate summary at this time.';
  }
}
