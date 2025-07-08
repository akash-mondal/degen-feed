// ./src/services/supabaseService.ts

import { createClient } from '@supabase/supabase-js';
import { Topic, TelegramUser } from '../types';

const supabaseUrl = 'https://discbeocigspuhehnydz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpc2NiZW9jaWdzcHVoZWhueWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzA5MzUsImV4cCI6MjA2NjgwNjkzNX0.EfXFikegBfnz0PhB0cPdmbm2X0o6d6bEx1Dj8TxxxHY';

// Create a single, shared Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  private static instance: SupabaseService;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Creates or updates a user in the database.
   * This should be called every time the app loads to update 'last_seen'.
   */
  async upsertUser(user: TelegramUser): Promise<void> {
    const { error } = await supabase.rpc('upsert_user', {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || null,
      username: user.username || null,
    });

    if (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  /**
   * Fetches all topics for a given user, ordered correctly.
   */
  async getTopics(userId: number): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .order('topic_order', { ascending: true });

    if (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }

    if (!data) return [];

    // Transform the data from database schema to the app's Topic type
    return data.map((t: any) => ({
      id: t.id,
      type: t.type,
      username: t.twitter_username,
      channelName: t.telegram_channel_name,
      displayName: t.display_name,
      twitterSummary: t.twitter_summary,
      telegramSummary: t.telegram_summary,
      tweets: t.raw_tweets,
      telegramMessages: t.raw_telegram_messages,
      lastUpdated: new Date(t.last_updated).getTime(),
      profilePicture: t.profile_picture_url,
      summaryLength: t.summary_length,
    }));
  }

  /**
   * Adds a new topic to the database for a specific user.
   */
  async addTopic(userId: number, topic: Topic): Promise<any> {
    // Get the current topic count to set the order for the new topic
    const { count, error: countError } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (countError) {
        console.error('Error getting topic count:', countError);
        throw countError;
    }

    const { data, error } = await supabase
      .from('topics')
      .insert({
        user_id: userId,
        display_name: topic.displayName,
        type: topic.type,
        twitter_username: topic.username,
        telegram_channel_name: topic.channelName,
        profile_picture_url: topic.profilePicture,
        summary_length: topic.summaryLength,
        twitter_summary: topic.twitterSummary,
        telegram_summary: topic.telegramSummary,
        raw_tweets: topic.tweets,
        raw_telegram_messages: topic.telegramMessages,
        last_updated: new Date(topic.lastUpdated).toISOString(),
        topic_order: count || 0, // Set the order to the end of the list
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding topic:', error);
      throw error;
    }
    return data;
  }

  /**
   * Deletes a topic from the database by its ID.
   */
  async deleteTopic(topicId: string): Promise<void> {
    const { error } = await supabase.from('topics').delete().eq('id', topicId);
    if (error) {
      console.error('Error deleting topic:', error);
      throw error;
    }
  }

  /**
   * Updates an existing topic with new data (e.g., after a refresh).
   */
  async updateTopic(topicId: string, updates: Partial<Topic>): Promise<void> {
    // Transform app-facing property names to database column names
    const dbUpdates = {
      display_name: updates.displayName,
      twitter_summary: updates.twitterSummary,
      telegram_summary: updates.telegramSummary,
      raw_tweets: updates.tweets,
      raw_telegram_messages: updates.telegramMessages,
      last_updated: updates.lastUpdated ? new Date(updates.lastUpdated).toISOString() : new Date().toISOString(),
      profile_picture_url: updates.profilePicture,
    };

    // Remove undefined properties so they are not updated in the DB
    Object.keys(dbUpdates).forEach(key => (dbUpdates as any)[key] === undefined && delete (dbUpdates as any)[key]);

    const { error } = await supabase
      .from('topics')
      .update(dbUpdates)
      .eq('id', topicId);

    if (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  /**
   * Updates the order for multiple topics in a single batch operation.
   */
  async updateTopicOrder(orderUpdates: { id: string, topic_order: number }[]): Promise<void> {
    const { error } = await supabase.from('topics').upsert(orderUpdates);

    if (error) {
      console.error('Error updating topic order:', error);
      throw error;
    }
  }
}
