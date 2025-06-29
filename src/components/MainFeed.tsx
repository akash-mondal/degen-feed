import React, { useState, useEffect } from 'react';
import { Plus, Moon, Sun, RefreshCw, User, MessageSquare, LayoutGrid, List } from 'lucide-react';
import { Topic, TelegramUser } from '../types';
import { TwitterService } from '../services/twitterService';
import { TelegramChannelService } from '../services/telegramChannelService';
import { AIService } from '../services/aiService';
import { UserDataService } from '../services/userDataService';
import { TelegramService } from '../services/telegramService';
import TopicCard from './TopicCard';
import AddTopicModal from './AddTopicModal';
import DailyBriefModal from './DailyBriefModal';
import TweetDetailView from './TweetDetailView';
import AILoader from './AILoader';

interface MainFeedProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  telegramUser?: TelegramUser;
}

const MainFeed: React.FC<MainFeedProps> = ({ darkMode, toggleDarkMode, telegramUser }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDailyBriefModalOpen, setIsDailyBriefModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAILoader, setShowAILoader] = useState(false);
  const [refreshingTopics, setRefreshingTopics] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [compactView, setCompactView] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const twitterService = TwitterService.getInstance();
  const telegramChannelService = TelegramChannelService.getInstance();
  const aiService = AIService.getInstance();
  const userDataService = UserDataService.getInstance();
  const telegramService = TelegramService.getInstance();

  useEffect(() => {
    // Load user data on mount
    const userData = userDataService.loadUserData();
    setTopics(userData.topics);

    // Check for stale topics and refresh them
    userData.topics.forEach(topic => {
      if (isTopicStale(topic)) {
        handleRefreshTopic(topic.id);
      }
    });
  }, []);

  useEffect(() => {
    // Save user data whenever topics change
    userDataService.saveUserData(telegramUser, topics);
  }, [topics, telegramUser]);

  const isTopicStale = (topic: Topic): boolean => {
    const now = Date.now();
    const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
    return (now - topic.lastUpdated) > CACHE_DURATION;
  };

  const generateTopicId = (username?: string, channelName?: string) => {
    const identifier = username || channelName || 'topic';
    return `${identifier}_${Date.now()}`;
  };

  const handleAddTopic = async (data: { 
    type: 'twitter' | 'telegram' | 'both'; 
    username?: string; 
    channelName?: string;
    summaryLength: 'concise' | 'detailed' | 'comprehensive';
  }) => {
    setIsLoading(true);
    
    try {
      // Check if topic already exists
      const existingTopic = topics.find(topic => 
        (data.username && topic.username?.toLowerCase() === data.username.toLowerCase()) ||
        (data.channelName && topic.channelName?.toLowerCase() === data.channelName.toLowerCase())
      );
      
      if (existingTopic) {
        const message = 'This source is already being tracked!';
        if (telegramUser) {
          await telegramService.showAlert(message);
        } else {
          alert(message);
        }
        setIsLoading(false);
        return;
      }

      let twitterData = null;
      let telegramMessages = null;
      let displayName = '';
      let profilePicture = '';
      let twitterError = false;
      let telegramError = false;

      // Fetch Twitter data if needed
      if ((data.type === 'twitter' || data.type === 'both') && data.username) {
        try {
          twitterData = await twitterService.getUserTweets(data.username);
          if (twitterData.status !== 'success' || !twitterData.tweets.length) {
            // Handle Twitter fetch failure without throwing error
            twitterError = true;
            
            if (data.type === 'twitter') {
              // If only Twitter, show error and return
              const errorMessage = `Unable to find X user "${data.username}". Please check the username and try again.`;
              if (telegramUser) {
                await telegramService.showAlert(errorMessage);
              } else {
                alert(errorMessage);
              }
              setIsLoading(false);
              return;
            }
            // If both, continue with just Telegram
          } else {
            displayName = twitterData.tweets[0]?.author.name || data.username;
            profilePicture = twitterData.tweets[0]?.author.profilePicture || '';
          }
        } catch (error) {
          twitterError = true;
          
          if (data.type === 'twitter') {
            // If only Twitter, show error and return
            const errorMessage = `Unable to find X user "${data.username}". Please check the username and try again.`;
            if (telegramUser) {
              await telegramService.showAlert(errorMessage);
            } else {
              alert(errorMessage);
            }
            setIsLoading(false);
            return;
          }
          // If both, continue with just Telegram
        }
      }

      // Fetch Telegram data if needed
      if ((data.type === 'telegram' || data.type === 'both') && data.channelName) {
        try {
          // First validate the channel (this should already be done in the modal, but double-check)
          const isValid = await telegramChannelService.checkChannel(data.channelName);
          if (!isValid) {
            throw new Error('Invalid or inaccessible Telegram channel');
          }
          
          // Then fetch messages
          telegramMessages = await telegramChannelService.getChannelMessages(data.channelName);
          
          if (!displayName) {
            displayName = data.channelName;
          }
        } catch (error) {
          console.error('Telegram fetch failed:', error);
          telegramError = true;
          
          if (data.type === 'telegram') {
            // If only Telegram, show error and return
            const errorMessage = `Unable to access Telegram channel "${data.channelName}". Please check the channel name and try again.`;
            if (telegramUser) {
              await telegramService.showAlert(errorMessage);
            } else {
              alert(errorMessage);
            }
            setIsLoading(false);
            return;
          }
          // If both, continue with just Twitter
        }
      }

      // If both sources failed, show error
      if (twitterError && telegramError) {
        const errorMessage = 'Unable to fetch data from both sources. Please check the usernames and try again.';
        if (telegramUser) {
          await telegramService.showAlert(errorMessage);
        } else {
          alert(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      // Show AI loader and hide modal before generating summaries
      setIsModalOpen(false);
      setShowAILoader(true);

      // Generate summaries separately for each platform
      let twitterSummary: string | undefined;
      let telegramSummary: string | undefined;

      if (twitterData?.tweets && twitterData.tweets.length > 0) {
        const twitterResult = await aiService.summarizeContent(
          twitterData.tweets,
          [],
          data.username,
          undefined,
          data.summaryLength
        );
        twitterSummary = twitterResult.twitterSummary;
      }

      if (telegramMessages && telegramMessages.length > 0) {
        const telegramResult = await aiService.summarizeContent(
          [],
          telegramMessages,
          undefined,
          data.channelName,
          data.summaryLength
        );
        telegramSummary = telegramResult.telegramSummary;
      }

      // Hide AI loader
      setShowAILoader(false);

      const newTopic: Topic = {
        id: generateTopicId(data.username, data.channelName),
        type: data.type,
        username: data.username,
        channelName: data.channelName,
        displayName,
        twitterSummary,
        telegramSummary,
        tweets: twitterData?.tweets,
        telegramMessages,
        lastUpdated: Date.now(),
        profilePicture,
        summaryLength: data.summaryLength
      };

      setTopics(prev => [newTopic, ...prev]);
      
      // Haptic feedback for Telegram users
      if (telegramUser) {
        telegramService.hapticFeedback('medium');
      }
    } catch (error) {
      console.error('Error adding topic:', error);
      setShowAILoader(false);
      const errorMessage = 'Failed to add signal source. Please check the details and try again.';
      
      if (telegramUser) {
        await telegramService.showAlert(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshTopic = async (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    setRefreshingTopics(prev => new Set(prev).add(topicId));

    try {
      let twitterData = null;
      let telegramMessages = null;
      let displayName = topic.displayName;
      let profilePicture = topic.profilePicture;

      // Refresh Twitter data if applicable
      if ((topic.type === 'twitter' || topic.type === 'both') && topic.username) {
        try {
          twitterData = await twitterService.getUserTweets(topic.username);
          if (twitterData.status === 'success' && twitterData.tweets.length) {
            displayName = twitterData.tweets[0]?.author.name || displayName;
            profilePicture = twitterData.tweets[0]?.author.profilePicture || profilePicture;
          }
        } catch (error) {
          console.warn('X refresh failed:', error);
        }
      }

      // Refresh Telegram data if applicable
      if ((topic.type === 'telegram' || topic.type === 'both') && topic.channelName) {
        try {
          telegramMessages = await telegramChannelService.getChannelMessages(topic.channelName);
        } catch (error) {
          console.warn('Telegram refresh failed:', error);
        }
      }

      // Show AI loader before generating new summaries
      setShowAILoader(true);

      // Generate new summaries separately
      let newTwitterSummary = topic.twitterSummary;
      let newTelegramSummary = topic.telegramSummary;

      if (twitterData?.tweets && twitterData.tweets.length > 0) {
        const twitterResult = await aiService.summarizeContent(
          twitterData.tweets,
          [],
          topic.username,
          undefined,
          topic.summaryLength || 'detailed'
        );
        newTwitterSummary = twitterResult.twitterSummary || topic.twitterSummary;
      }

      if (telegramMessages && telegramMessages.length > 0) {
        const telegramResult = await aiService.summarizeContent(
          [],
          telegramMessages,
          undefined,
          topic.channelName,
          topic.summaryLength || 'detailed'
        );
        newTelegramSummary = telegramResult.telegramSummary || topic.telegramSummary;
      }

      // Hide AI loader
      setShowAILoader(false);

      setTopics(prev => prev.map(t => 
        t.id === topicId 
          ? { 
              ...t, 
              twitterSummary: newTwitterSummary,
              telegramSummary: newTelegramSummary,
              tweets: twitterData?.tweets || t.tweets,
              telegramMessages: telegramMessages || t.telegramMessages,
              lastUpdated: Date.now(),
              displayName,
              profilePicture
            }
          : t
      ));
      
      // Haptic feedback for Telegram users
      if (telegramUser) {
        telegramService.hapticFeedback('light');
      }
    } catch (error) {
      console.error('Error refreshing topic:', error);
      setShowAILoader(false);
      const errorMessage = 'Failed to refresh signal. Please try again.';
      
      if (telegramUser) {
        await telegramService.showAlert(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setRefreshingTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const confirmed = telegramUser 
      ? await telegramService.showConfirm('Are you sure you want to remove this signal source?')
      : confirm('Are you sure you want to remove this signal source?');
      
    if (confirmed) {
      setTopics(prev => prev.filter(t => t.id !== topicId));
      
      // Haptic feedback for Telegram users
      if (telegramUser) {
        telegramService.hapticFeedback('medium');
      }
    }
  };

  const handleReorderTopics = (draggedId: string, targetId: string, position: 'before' | 'after') => {
    setTopics(prev => {
      const newTopics = [...prev];
      const draggedIndex = newTopics.findIndex(t => t.id === draggedId);
      const targetIndex = newTopics.findIndex(t => t.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      // Remove the dragged item
      const [draggedItem] = newTopics.splice(draggedIndex, 1);
      
      // Calculate new position
      let insertIndex = targetIndex;
      if (draggedIndex < targetIndex) {
        insertIndex = position === 'before' ? targetIndex - 1 : targetIndex;
      } else {
        insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      }
      
      // Insert at new position
      newTopics.splice(insertIndex, 0, draggedItem);
      
      return newTopics;
    });
    
    // Haptic feedback for Telegram users
    if (telegramUser) {
      telegramService.hapticFeedback('light');
    }
  };

  const handleToggleExpand = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const handleViewTweets = (topic: Topic) => {
    setSelectedTopic(topic);
    
    // Show back button in Telegram
    if (telegramUser) {
      telegramService.showBackButton(() => handleBackToFeed());
    }
  };

  const handleBackToFeed = () => {
    setSelectedTopic(null);
    
    // Hide back button in Telegram
    if (telegramUser) {
      telegramService.hideBackButton();
    }
  };

  // Show tweet detail view if a topic is selected
  if (selectedTopic) {
    return (
      <TweetDetailView 
        topic={selectedTopic} 
        onBack={handleBackToFeed}
        darkMode={darkMode}
        telegramUser={telegramUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
                Built with ❤️ and OpenServ AI
              </span>
              <img 
                src="https://cdn.discordapp.com/icons/1176767100350644254/a_53359cdad4839fbd5343771a641e780a.png?size=128&quality=lossless" 
                alt="OpenServ AI"
                className="w-5 h-5 rounded-full animate-spin"
                style={{ animationDuration: '3s' }}
              />
            </div>
            <div className="flex items-center space-x-2">
              {telegramUser && (
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full glass">
                  <User className="w-4 h-4 text-black dark:text-white" />
                  <span className="text-sm text-black dark:text-white">
                    {telegramUser.first_name}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 sm:p-3 rounded-full glass border hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              )}
            </button>

            {topics.length > 0 && (
              <button
                onClick={() => setCompactView(!compactView)}
                className="p-2 sm:p-3 rounded-full glass border hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                title={compactView ? "Switch to detailed view" : "Switch to compact view"}
              >
                {compactView ? (
                  <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
                ) : (
                  <List className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
                )}
              </button>
            )}

            <button
              onClick={() => setIsDailyBriefModalOpen(true)}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium flex items-center space-x-2 text-sm sm:text-base"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Daily Brief</span>
              <span className="sm:hidden">Brief</span>
            </button>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center space-x-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Signal</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Topics */}
        {topics.length === 0 ? (
          <div className="text-center py-8 sm:py-16">
            <div className="glass rounded-2xl p-6 sm:p-12 max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full glass flex items-center justify-center">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-black dark:text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white mb-2">
                No signals yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
                Add your first signal source to start tracking
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
              >
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
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onRefresh={handleRefreshTopic}
                  onDelete={handleDeleteTopic}
                  onViewTweets={handleViewTweets}
                  onReorder={handleReorderTopics}
                  isRefreshing={refreshingTopics.has(topic.id)}
                  compactView={shouldShowCompact}
                  onToggleExpand={compactView ? handleToggleExpand : undefined}
                />
              );
            })}
          </div>
        )}
      </div>

      <AddTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTopic}
        isLoading={isLoading}
        showAILoader={showAILoader}
      />

      <DailyBriefModal
        isOpen={isDailyBriefModalOpen}
        onClose={() => setIsDailyBriefModalOpen(false)}
        topics={topics}
      />

      <AILoader isVisible={showAILoader} />
    </div>
  );
};

export default MainFeed;