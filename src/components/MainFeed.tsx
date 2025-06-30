// ./src/components/MainFeed.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Moon, Sun, RefreshCw, User, MessageSquare, LayoutGrid, List, Menu } from 'lucide-react';
import { Topic, TelegramUser } from '../types';
import { TwitterService } from '../services/twitterService';
import { TelegramChannelService } from '../services/telegramChannelService';
import { AIService } from '../services/aiService';
import { SupabaseService } from '../services/supabaseService';
import { TelegramService } from '../services/telegramService';
import TopicCard from './TopicCard';
import AddTopicModal from './AddTopicModal';
import DailyBriefModal from './DailyBriefModal';
import TweetDetailView from './TweetDetailView';
import AILoader from './AILoader';
import Footer from './Footer';

interface MainFeedProps {
  initialTopics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
  darkMode: boolean;
  toggleDarkMode: () => void;
  telegramUser?: TelegramUser;
}

const MainFeed: React.FC<MainFeedProps> = ({ initialTopics, setTopics, darkMode, toggleDarkMode, telegramUser }) => {
  const topics = initialTopics; 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDailyBriefModalOpen, setIsDailyBriefModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAILoader, setShowAILoader] = useState(false);
  const [refreshingTopics, setRefreshingTopics] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [compactView, setCompactView] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const twitterService = TwitterService.getInstance();
  const telegramChannelService = TelegramChannelService.getInstance();
  const aiService = AIService.getInstance();
  const supabaseService = SupabaseService.getInstance();
  const telegramService = TelegramService.getInstance();

  useEffect(() => {
    topics.forEach(topic => {
      if (isTopicStale(topic)) {
        handleRefreshTopic(topic.id);
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const isTopicStale = (topic: Topic): boolean => {
    const now = Date.now();
    const CACHE_DURATION = 12 * 60 * 60 * 1000;
    return (now - topic.lastUpdated) > CACHE_DURATION;
  };

  const handleAddTopic = async (data: { 
    type: 'twitter' | 'telegram' | 'both'; 
    username?: string; 
    channelName?: string;
    summaryLength: 'concise' | 'detailed' | 'comprehensive';
  }) => {
    if (!telegramUser) return;
    setIsLoading(true);
    
    try {
      const existingTopic = topics.find(topic => 
        (data.username && topic.username?.toLowerCase() === data.username.toLowerCase()) ||
        (data.channelName && topic.channelName?.toLowerCase() === data.channelName.toLowerCase())
      );
      
      if (existingTopic) {
        await telegramService.showAlert('This source is already being tracked!');
        setIsLoading(false);
        return;
      }

      let twitterData = null, telegramMessages = null;
      let displayName = '', profilePicture = '';
      let twitterError = false, telegramError = false;

      if ((data.type === 'twitter' || data.type === 'both') && data.username) {
        try {
          twitterData = await twitterService.getUserTweets(data.username);
          if (twitterData.status !== 'success' || !twitterData.tweets.length) {
            twitterError = true;
            if (data.type === 'twitter') {
              await telegramService.showAlert(`Unable to find X user "${data.username}". Please check the username and try again.`);
              setIsLoading(false); return;
            }
          } else {
            displayName = twitterData.tweets[0]?.author.name || data.username;
            profilePicture = twitterData.tweets[0]?.author.profilePicture || '';
          }
        } catch (error) {
          twitterError = true;
          if (data.type === 'twitter') {
            await telegramService.showAlert(`Unable to find X user "${data.username}". Please check the username and try again.`);
            setIsLoading(false); return;
          }
        }
      }

      if ((data.type === 'telegram' || data.type === 'both') && data.channelName) {
        try {
          const isValid = await telegramChannelService.checkChannel(data.channelName);
          if (!isValid) throw new Error('Invalid or inaccessible Telegram channel');
          telegramMessages = await telegramChannelService.getChannelMessages(data.channelName);
          if (!displayName) displayName = data.channelName;
        } catch (error) {
          console.error('Telegram fetch failed:', error);
          telegramError = true;
          if (data.type === 'telegram') {
            await telegramService.showAlert(`Unable to access Telegram channel "${data.channelName}". Please check the channel name and try again.`);
            setIsLoading(false); return;
          }
        }
      }

      if (twitterError && telegramError) {
        await telegramService.showAlert('Unable to fetch data from both sources. Please check the usernames and try again.');
        setIsLoading(false); return;
      }

      setIsModalOpen(false);
      setShowAILoader(true);

      let twitterSummary, telegramSummary;

      if (twitterData?.tweets && twitterData.tweets.length > 0) {
        twitterSummary = (await aiService.summarizeContent(twitterData.tweets, [], data.username, undefined, data.summaryLength)).twitterSummary;
      }
      if (telegramMessages && telegramMessages.length > 0) {
        telegramSummary = (await aiService.summarizeContent([], telegramMessages, undefined, data.channelName, data.summaryLength)).telegramSummary;
      }
      
      setShowAILoader(false);
      
      const newTopicData: Omit<Topic, 'id'> = {
        type: data.type, username: data.username, channelName: data.channelName, displayName,
        twitterSummary, telegramSummary, tweets: twitterData?.tweets, telegramMessages,
        lastUpdated: Date.now(), profilePicture, summaryLength: data.summaryLength
      };

      const addedTopicFromDB = await supabaseService.addTopic(telegramUser.id, newTopicData as Topic);
      
      const finalNewTopic: Topic = { id: addedTopicFromDB.id, ...newTopicData };

      // *** BUG FIX: Add to the end of the list to match database order ***
      setTopics(prev => [...prev, finalNewTopic]);
      
      telegramService.hapticFeedback('medium');
    } catch (error) {
      console.error('Error adding topic:', error);
      setShowAILoader(false);
      await telegramService.showAlert('Failed to add signal source. Please check the details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshTopic = async (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    setRefreshingTopics(prev => new Set(prev).add(topicId));
    try {
        let twitterData = null, telegramMessages = null;
        let displayName = topic.displayName, profilePicture = topic.profilePicture;
        
        if ((topic.type === 'twitter' || topic.type === 'both') && topic.username) {
            twitterData = await twitterService.getUserTweets(topic.username);
            if (twitterData.status === 'success' && twitterData.tweets.length) {
                displayName = twitterData.tweets[0]?.author.name || displayName;
                profilePicture = twitterData.tweets[0]?.author.profilePicture || profilePicture;
            }
        }
        if ((topic.type === 'telegram' || topic.type === 'both') && topic.channelName) {
            telegramMessages = await telegramChannelService.getChannelMessages(topic.channelName);
        }
        
        setShowAILoader(true);
        let newTwitterSummary, newTelegramSummary;
        if (twitterData?.tweets?.length) {
            newTwitterSummary = (await aiService.summarizeContent(twitterData.tweets, [], topic.username, undefined, topic.summaryLength || 'detailed')).twitterSummary;
        }
        if (telegramMessages?.length) {
            newTelegramSummary = (await aiService.summarizeContent([], telegramMessages, undefined, topic.channelName, topic.summaryLength || 'detailed')).telegramSummary;
        }
        setShowAILoader(false);

        const updatedFields: Partial<Topic> = {
            twitterSummary: newTwitterSummary || topic.twitterSummary,
            telegramSummary: newTelegramSummary || topic.telegramSummary,
            tweets: twitterData?.tweets || topic.tweets,
            telegramMessages: telegramMessages || topic.telegramMessages,
            lastUpdated: Date.now(), displayName, profilePicture
        };
        await supabaseService.updateTopic(topicId, updatedFields);
        setTopics(prev => prev.map(t => t.id === topicId ? { ...t, ...updatedFields } : t));
        telegramService.hapticFeedback('light');
    } catch (error) {
        console.error('Error refreshing topic:', error);
        setShowAILoader(false);
        await telegramService.showAlert('Failed to refresh signal. Please try again.');
    } finally {
        setRefreshingTopics(prev => {
            const newSet = new Set(prev);
            newSet.delete(topicId);
            return newSet;
        });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const confirmed = await telegramService.showConfirm('Are you sure you want to remove this signal source?');
    if (confirmed) {
      await supabaseService.deleteTopic(topicId);
      const remainingTopics = topics.filter(t => t.id !== topicId);
      const orderUpdates = remainingTopics.map((topic, index) => ({ id: topic.id, topic_order: index }));
      setTopics(remainingTopics);
      if (orderUpdates.length > 0) {
        await supabaseService.updateTopicOrder(orderUpdates);
      }
      telegramService.hapticFeedback('medium');
    }
  };

  const handleReorderTopics = async (draggedId: string, targetId: string, position: 'before' | 'after') => {
    let reorderedTopics = [...topics];
    const draggedIndex = reorderedTopics.findIndex(t => t.id === draggedId);
    let targetIndex = reorderedTopics.findIndex(t => t.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const [draggedItem] = reorderedTopics.splice(draggedIndex, 1);
    targetIndex = reorderedTopics.findIndex(t => t.id === targetId);
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    reorderedTopics.splice(insertIndex, 0, draggedItem);
    setTopics(reorderedTopics);
    const orderUpdates = reorderedTopics.map((topic, index) => ({ id: topic.id, topic_order: index }));
    await supabaseService.updateTopicOrder(orderUpdates);
    telegramService.hapticFeedback('light');
  };

  const handleToggleExpand = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) newSet.delete(topicId);
      else newSet.add(topicId);
      return newSet;
    });
  };

  const handleViewTweets = (topic: Topic) => {
    setSelectedTopic(topic);
    if (telegramUser) telegramService.showBackButton(() => handleBackToFeed());
  };

  const handleBackToFeed = () => {
    setSelectedTopic(null);
    if (telegramUser) telegramService.hideBackButton();
  };

  if (selectedTopic) {
    return <TweetDetailView topic={selectedTopic} onBack={handleBackToFeed} darkMode={darkMode} telegramUser={telegramUser} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex flex-col">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl flex-grow">
        <div className="flex flex-col items-center sm:flex-row sm:justify-center sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          {/* Telegram user display block was removed from here */}
          <div className="relative" ref={menuRef}>
            <div className="hidden sm:flex items-center space-x-3">
              <button onClick={toggleDarkMode} className="p-2 sm:p-3 rounded-full glass border hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-black" />}
              </button>
              {topics.length > 0 && (
                <button onClick={() => setCompactView(!compactView)} className="p-2 sm:p-3 rounded-full glass border hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title={compactView ? "Switch to detailed view" : "Switch to compact view"}>
                  {compactView ? <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" /> : <List className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />}
                </button>
              )}
              <button onClick={() => setIsDailyBriefModalOpen(true)} className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium flex items-center space-x-2 text-sm sm:text-base">
                <MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">Daily Brief</span><span className="sm:hidden">Brief</span>
              </button>
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center space-x-2 text-sm sm:text-base">
                <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Signal</span><span className="sm:hidden">Add</span>
              </button>
            </div>
            <div className="flex sm:hidden justify-end">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full glass border hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <Menu className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                <button onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg">
                  <Plus className="w-4 h-4 mr-3" /> Add Signal
                </button>
                <button onClick={() => { setIsDailyBriefModalOpen(true); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                  <MessageSquare className="w-4 h-4 mr-3" /> Daily Brief
                </button>
                {topics.length > 0 && (
                  <button onClick={() => { setCompactView(!compactView); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                    {compactView ? <LayoutGrid className="w-4 h-4 mr-3" /> : <List className="w-4 h-4 mr-3" />} {compactView ? 'Show Detailed View' : 'Show Compact View'}
                  </button>
                )}
                <button onClick={() => { toggleDarkMode(); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-b-lg">
                  {darkMode ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />} {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
              </div>
            )}
          </div>
        </div>
        {topics.length === 0 ? (
          <div className="text-center py-8 sm:py-16">
            <div className="glass rounded-2xl p-6 sm:p-12 max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full glass flex items-center justify-center">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-black dark:text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white mb-2">No signals yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">Add your first signal source to start tracking</p>
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base">
                Get Started
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {topics.map((topic) => {
              const isExpanded = expandedTopics.has(topic.id);
              const shouldShowCompact = compactView && !isExpanded;
              return (
                <TopicCard key={topic.id} topic={topic} onRefresh={handleRefreshTopic} onDelete={handleDeleteTopic} onViewTweets={handleViewTweets} onReorder={handleReorderTopics} isRefreshing={refreshingTopics.has(topic.id)} compactView={shouldShowCompact} onToggleExpand={compactView ? handleToggleExpand : undefined} />
              );
            })}
          </div>
        )}
      </div>
      <Footer telegramUser={telegramUser} />
      <AddTopicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddTopic} isLoading={isLoading} showAILoader={showAILoader} />
      <DailyBriefModal isOpen={isDailyBriefModalOpen} onClose={() => setIsDailyBriefModalOpen(false)} topics={topics} />
      <AILoader isVisible={showAILoader} />
    </div>
  );
};

export default MainFeed;
