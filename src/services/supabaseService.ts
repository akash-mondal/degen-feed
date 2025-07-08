// ./src/services/supabaseService.ts

import { createClient } from '@supabase/supabase-js';
import { Topic, TelegramUser, SignalProfile } from '../types';

const supabaseUrl = 'https://discbeocigspuhehnydz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpc2NiZW9jaWdzcHVoZWhueWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzA5MzUsImV4cCI6MjA2NjgwNjkzNX0.EfXFikegBfnz0PhB0cPdmbm2X0o6d6bEx1Dj8TxxxHY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  private static instance: SupabaseService;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  async upsertUser(user: TelegramUser): Promise<void> {
    const { error } = await supabase.rpc('upsert_user', {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || null,
      username: user.username || null,
    });
    if (error) throw error;
  }

  async getTopics(userId: number): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .order('topic_order', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((t: any) => ({
      id: t.id,
      type: t.type,
      username: t.twitter_username,
      channelName: t.telegram_channel_name,
      telegramChannelId: t.telegram_channel_id,
      displayName: t.display_name,
      twitterSummary: t.twitter_summary,
      telegramSummary: t.telegram_summary,
      tweets: t.raw_tweets,
      telegramMessages: t.raw_telegram_messages,
      lastUpdated: new Date(t.last_updated).getTime(),
      profilePicture: t.profile_picture_url,
      summaryLength: t.summary_length,
      customSummaryLength: t.custom_summary_length,
      trackedSenders: t.tracked_senders || [],
    }));
  }

  async addTopic(userId: number, topic: Topic): Promise<any> {
    const { count, error: countError } = await supabase.from('topics').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (countError) throw countError;

    const { data, error } = await supabase
      .from('topics')
      .insert({
        user_id: userId,
        display_name: topic.displayName,
        type: topic.type,
        twitter_username: topic.username,
        telegram_channel_name: topic.channelName,
        telegram_channel_id: topic.telegramChannelId,
        profile_picture_url: topic.profilePicture,
        summary_length: topic.summaryLength,
        custom_summary_length: topic.customSummaryLength,
        tracked_senders: topic.trackedSenders,
        twitter_summary: topic.twitterSummary,
        telegram_summary: topic.telegramSummary,
        raw_tweets: topic.tweets,
        raw_telegram_messages: topic.telegramMessages,
        last_updated: new Date(topic.lastUpdated).toISOString(),
        topic_order: count || 0,
      })
      .select().single();
      
    if (error) throw error;
    return data;
  }

  async deleteTopic(topicId: string): Promise<void> {
    const { error } = await supabase.from('topics').delete().eq('id', topicId);
    if (error) throw error;
  }

  async updateTopic(topicId: string, updates: Partial<Topic>): Promise<void> {
    const dbUpdates = {
      display_name: updates.displayName,
      twitter_summary: updates.twitterSummary,
      telegram_summary: updates.telegramSummary,
      raw_tweets: updates.tweets,
      raw_telegram_messages: updates.telegramMessages,
      last_updated: updates.lastUpdated ? new Date(updates.lastUpdated).toISOString() : new Date().toISOString(),
      profile_picture_url: updates.profilePicture,
      summary_length: updates.summaryLength,
      custom_summary_length: updates.customSummaryLength,
      tracked_senders: updates.trackedSenders
    };
    Object.keys(dbUpdates).forEach(key => (dbUpdates as any)[key] === undefined && delete (dbUpdates as any)[key]);
    const { error } = await supabase.from('topics').update(dbUpdates).eq('id', topicId);
    if (error) throw error;
  }

  async updateTopicOrder(orderUpdates: { id: string, topic_order: number }[]): Promise<void> {
    const { error } = await supabase.from('topics').upsert(orderUpdates);
    if (error) throw error;
  }
  
  // --- NEW METHODS FOR SIGNAL PROFILES ---

  async getSignalProfiles(userId: number, allTopics: Topic[]): Promise<SignalProfile[]> {
    const { data: profilesData, error: profilesError } = await supabase
      .from('signal_profiles')
      .select('*')
      .eq('user_id', userId);

    if (profilesError) throw profilesError;
    if (!profilesData) return [];
    
    const { data: linksData, error: linksError } = await supabase
      .from('signal_profile_topics')
      .select('*');

    if (linksError) throw linksError;

    // Map topics for quick lookup
    const topicMap = new Map(allTopics.map(t => [t.id, t]));

    return profilesData.map(p => ({
      id: p.id,
      userId: p.user_id,
      profileName: p.profile_name,
      rules: p.rules || [],
      createdAt: p.created_at,
      trackedSenders: p.tracked_senders || [],
      topics: linksData
        .filter(link => link.signal_profile_id === p.id)
        .map(link => topicMap.get(link.topic_id))
        .filter((t): t is Topic => !!t) // Filter out undefined topics
    }));
  }

  async addSignalProfile(userId: number, profile: Omit<SignalProfile, 'id' | 'createdAt' | 'userId' | 'topics'>, topicIds: string[]): Promise<SignalProfile> {
    // 1. Insert the profile
    const { data: newProfile, error: profileError } = await supabase
      .from('signal_profiles')
      .insert({
        user_id: userId,
        profile_name: profile.profileName,
        rules: profile.rules,
        tracked_senders: profile.trackedSenders,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // 2. Insert the links to topics
    if (topicIds.length > 0) {
      const links = topicIds.map(topicId => ({
        signal_profile_id: newProfile.id,
        topic_id: topicId,
      }));
      const { error: linkError } = await supabase.from('signal_profile_topics').insert(links);
      if (linkError) throw linkError;
    }

    return { ...newProfile, topics: [], userId: newProfile.user_id, profileName: newProfile.profile_name, createdAt: newProfile.created_at };
  }
  
  async updateSignalProfile(profileId: string, updates: Partial<Omit<SignalProfile, 'id' | 'topics'>>, topicIds: string[]): Promise<void> {
    // 1. Update the profile itself
    const { error: profileError } = await supabase
      .from('signal_profiles')
      .update({
        profile_name: updates.profileName,
        rules: updates.rules,
        tracked_senders: updates.trackedSenders,
      })
      .eq('id', profileId);

    if (profileError) throw profileError;

    // 2. Update the topic links (delete all, then re-insert)
    const { error: deleteError } = await supabase.from('signal_profile_topics').delete().eq('signal_profile_id', profileId);
    if (deleteError) throw deleteError;
    
    if (topicIds.length > 0) {
      const links = topicIds.map(topicId => ({
        signal_profile_id: profileId,
        topic_id: topicId,
      }));
      const { error: insertError } = await supabase.from('signal_profile_topics').insert(links);
      if (insertError) throw insertError;
    }
  }

  async deleteSignalProfile(profileId: string): Promise<void> {
    const { error } = await supabase.from('signal_profiles').delete().eq('id', profileId);
    if (error) throw error;
  }
}
