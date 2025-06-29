import React from 'react';
import { ArrowLeft, Twitter, MessageSquare } from 'lucide-react';
import { Topic, TelegramUser } from '../types';
import TweetCard from './TweetCard';
import TelegramMessageCard from './TelegramMessageCard';

interface TweetDetailViewProps {
  topic: Topic;
  onBack: () => void;
  darkMode: boolean;
  telegramUser?: TelegramUser;
}

const TweetDetailView: React.FC<TweetDetailViewProps> = ({ topic, onBack, darkMode, telegramUser }) => {
  // Get top 5 tweets and messages
  const topTweets = topic.tweets?.slice(0, 5) || [];
  const topMessages = topic.telegramMessages?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          {!telegramUser && (
            <button
              onClick={onBack}
              className="p-2 sm:p-3 rounded-full glass border hover:bg-black/10 dark:hover:bg-white/10 transition-colors mr-3 sm:mr-4 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
            </button>
          )}
          
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {topic.profilePicture && (
              <img 
                src={topic.profilePicture} 
                alt={topic.displayName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-black/20 dark:border-white/20 flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white truncate" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
                {topic.displayName}
              </h1>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
                {topic.username && <span className="truncate">@{topic.username}</span>}
                {topic.channelName && topic.username && <span>•</span>}
                {topic.channelName && <span className="truncate">{topic.channelName}</span>}
                <div className="flex items-center space-x-1 ml-2">
                  {(topic.type === 'twitter' || topic.type === 'both') && <Twitter className="w-4 h-4" />}
                  {(topic.type === 'telegram' || topic.type === 'both') && <MessageSquare className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          {topic.twitterSummary && (
            <div className="glass rounded-2xl shadow-xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Twitter className="w-5 h-5 text-black dark:text-white" />
                <h2 className="text-base sm:text-lg font-semibold text-black dark:text-white">
                  X Activity Summary
                </h2>
              </div>
              <p className="text-black dark:text-white leading-relaxed text-sm sm:text-lg">
                {topic.twitterSummary}
              </p>
            </div>
          )}

          {topic.telegramSummary && (
            <div className="glass rounded-2xl shadow-xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-5 h-5 text-black dark:text-white" />
                <h2 className="text-base sm:text-lg font-semibold text-black dark:text-white">
                  Telegram Activity Summary
                </h2>
              </div>
              <p className="text-black dark:text-white leading-relaxed text-sm sm:text-lg">
                {topic.telegramSummary}
              </p>
            </div>
          )}
        </div>

        {/* Content Sections */}
        <div className="space-y-6 sm:space-y-8">
          {/* X Content */}
          {topTweets.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Twitter className="w-5 h-5 text-black dark:text-white" />
                <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
                  Top 5 Posts
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {topTweets.map((tweet) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
              </div>
            </div>
          )}

          {/* Telegram Content */}
          {topMessages.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-5 h-5 text-black dark:text-white" />
                <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
                  Top 5 Messages
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {topMessages.map((message) => (
                  <TelegramMessageCard key={message.message_id} message={message} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TweetDetailView;