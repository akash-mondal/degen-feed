// ./src/services/aiService.ts

import API_CONFIG from './config';
import { Tweet, TelegramMessage, SignalProfile, SignalRule } from '../types';

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

  // MODIFICATION: The main summarize method is now much more powerful.
  async summarizeContent(
    tweets: Tweet[] = [], 
    telegramMessages: TelegramMessage[] = [], 
    twitterUsername?: string, 
    telegramChannelName?: string,
    summaryLengthOption: 'concise' | 'detailed' | 'comprehensive' | 'custom' = 'detailed',
    customWordCount?: number,
    trackedSenders?: string[]
  ): Promise<{ twitterSummary?: string; telegramSummary?: string }> {
    try {
      const now = new Date();
      let twitterSummary: string | undefined;
      let telegramSummary: string | undefined;

      const getWordCount = () => {
        if (summaryLengthOption === 'custom' && customWordCount) {
          return `${customWordCount - 10}-${customWordCount}`;
        }
        switch (summaryLengthOption) {
          case 'concise': return '30-40';
          case 'detailed': return '50-75';
          case 'comprehensive': return '100-150';
          default: return '50-75';
        }
      };
      
      const wordCount = getWordCount();
      const hasTrackedSenders = trackedSenders && trackedSenders.length > 0;

      // --- Process Twitter Content ---
      if (tweets.length > 0 && twitterUsername) {
        let relevantTweets = tweets.filter(tweet => this.isWithin24Hours(tweet.createdAt));
        
        // If tracking specific senders, filter tweets by them.
        if (hasTrackedSenders) {
          const lowercasedSenders = trackedSenders.map(s => s.toLowerCase());
          relevantTweets = relevantTweets.filter(tweet => 
            lowercasedSenders.includes(tweet.author.userName.toLowerCase())
          );
        }

        if (relevantTweets.length === 0) {
          twitterSummary = hasTrackedSenders
            ? `The tracked users in @${twitterUsername} have not posted in the last 24 hours.`
            : `No new posts from @${twitterUsername} in the last 24 hours.`;
        } else {
          const topTweets = relevantTweets
            .sort((a, b) => (b.likeCount + b.retweetCount) - (a.likeCount + a.retweetCount))
            .slice(0, 7); // Get a slightly larger sample for better summaries

          const tweetTexts = topTweets.map(tweet => {
            const hoursAgo = Math.floor((now.getTime() - new Date(tweet.createdAt).getTime()) / 3600000);
            return `From @${tweet.author.userName}: "${tweet.text}" (Likes: ${tweet.likeCount}, ~${hoursAgo}h ago)`;
          }).join('\n\n');

          const focusPrompt = hasTrackedSenders 
            ? `Pay special attention to the posts from these users: ${trackedSenders.join(', ')}.`
            : `Synthesize the key themes, topics, and sentiment from the posts.`;
          
          const systemPrompt = `You are a sharp social media analyst. Your goal is to synthesize raw X posts into a clear, engaging briefing of about ${wordCount} words. ${focusPrompt} Weave these details into a smooth, easy-to-read paragraph. Do not use lists.`;
          const userPrompt = `Summarize the recent X activity for @${twitterUsername}. The most relevant posts from the last 24 hours are:\n\n${tweetTexts}`;
          
          twitterSummary = await this.callAI(userPrompt, systemPrompt);
        }
      }

      // --- Process Telegram Content ---
      if (telegramMessages.length > 0 && telegramChannelName) {
        let relevantMessages = telegramMessages.filter(msg => this.isWithin24Hours(msg.date));

        // If tracking specific senders, filter messages by them.
        if (hasTrackedSenders) {
          const lowercasedSenders = trackedSenders.map(s => s.toLowerCase());
          relevantMessages = relevantMessages.filter(msg => 
            lowercasedSenders.includes(msg.sender.name.toLowerCase()) || 
            (msg.sender.username && lowercasedSenders.includes(msg.sender.username.toLowerCase())) ||
            lowercasedSenders.includes(String(msg.sender.id))
          );
        }
        
        if (relevantMessages.length === 0) {
          telegramSummary = hasTrackedSenders
            ? `The tracked members in the "${telegramChannelName}" channel have not sent messages recently.`
            : `No new activity in the "${telegramChannelName}" channel recently.`;
        } else {
          const topMessages = relevantMessages
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 10); // More messages for better context

          const messageTexts = topMessages.map(msg => {
            const hoursAgo = Math.floor((now.getTime() - new Date(msg.date).getTime()) / 3600000);
            return `From ${msg.sender.name}: "${msg.text}" (~${hoursAgo}h ago)`;
          }).join('\n\n');

          const focusPrompt = hasTrackedSenders
            ? `Focus on the conversation points from these specific members: ${trackedSenders.join(', ')}.`
            : `Identify the main themes of conversation from the channel.`;

          const systemPrompt = `You are an analyst summarizing a group chat. Synthesize key discussion points from a Telegram channel into a clear summary of about ${wordCount} words. ${focusPrompt} Weave details into a smooth paragraph. Do not use lists.`;
          const userPrompt = `Summarize the recent discussion in the "${telegramChannelName}" Telegram channel based on these key messages from the last 24 hours:\n\n${messageTexts}`;

          telegramSummary = await this.callAI(userPrompt, systemPrompt);
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

  // NEW: Method to summarize an entire signal profile based on rules
  async summarizeSignalProfile(profile: SignalProfile): Promise<string> {
    try {
      const allMessages = profile.topics.flatMap(topic => topic.telegramMessages || []);
      const recentMessages = allMessages.filter(msg => this.isWithin24Hours(msg.date));

      if (recentMessages.length === 0) {
        return "No recent activity across any sources in this profile.";
      }

      // --- Rule-based Filtering ---
      let findings: string[] = [];
      const lowercasedMessageTexts = recentMessages.map(m => m.text.toLowerCase());

      profile.rules.forEach(rule => {
        let mentionCount = 0;
        let mentionedInGroups = new Set<string>();

        recentMessages.forEach(msg => {
          if (msg.text.toLowerCase().includes(rule.value.toLowerCase())) {
            mentionCount++;
            if(msg.sender.name) mentionedInGroups.add(msg.sender.name);
          }
        });

        if (rule.type !== 'custom' && rule.mentionThreshold && rule.groupThreshold) {
          if (mentionCount >= rule.mentionThreshold && mentionedInGroups.size >= rule.groupThreshold) {
            findings.push(`ALERT: "${rule.value}" (${rule.type}) was mentioned ${mentionCount} times across ${mentionedInGroups.size} groups.`);
          }
        } else if (rule.type === 'custom') {
          // For custom rules, we can add more sophisticated logic or just pass it to the AI
          findings.push(`Custom Rule to check: ${rule.value}`);
        }
      });
      
      const topMessages = recentMessages.sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 15);
      const contextText = topMessages.map(m => `From ${m.sender.name}: "${m.text}"`).join('\n');

      const systemPrompt = `You are an elite intelligence analyst. Your task is to provide a high-level briefing for the signal profile named "${profile.profileName}". First, state any alerts that were triggered. Then, synthesize the overall narrative, key themes, and sentiment from the provided chat messages. The summary should be around 150-200 words. Be concise and impactful.`;
      
      const userPrompt = `
        Signal Profile: "${profile.profileName}"

        Triggered Alerts:
        ${findings.length > 0 ? findings.join('\n') : 'None'}

        Key Messages from the last 24 hours:
        ${contextText}

        Please provide your intelligence briefing.
      `;
      
      const summary = await this.callAI(userPrompt, systemPrompt);
      return summary;

    } catch (error) {
      console.error('Error summarizing signal profile:', error);
      return 'Could not generate profile summary at this time.';
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
        model: 'meta-llama/Llama-3-8B-Instruct', // Using a slightly more powerful model for better synthesis
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: false,
        max_tokens: 4000,
        temperature: 0.6,
        stop: ["<think>", "</think>"]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AI API Error:", errorData);
      throw new Error(`AI API error! status: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || 'No summary available.';
    content = this.cleanContent(content);
    
    return content || 'Unable to generate summary at this time.';
  }

  private cleanContent(content: string): string {
    // Basic cleaning of AI artifacts
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '')
                 .replace(/\*\*Think[\s\S]*?\*\*/gi, '')
                 .replace(/^Here's a summary:/i, '')
                 .trim();
  }
}
