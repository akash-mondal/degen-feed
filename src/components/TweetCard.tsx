import React from 'react';
import { Heart, MessageCircle, Repeat2, ExternalLink } from 'lucide-react';
import { Tweet } from '../types';

interface TweetCardProps {
  tweet: Tweet;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass rounded-xl p-3 sm:p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300">
      <div className="flex items-start space-x-3 mb-3">
        <img 
          src={tweet.author.profilePicture} 
          alt={tweet.author.name}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-black/20 dark:border-white/20 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1 flex-wrap">
            <span className="font-semibold text-black dark:text-white text-sm truncate">
              {tweet.author.name}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-sm truncate">
              @{tweet.author.userName}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-sm flex-shrink-0">
              {formatDate(tweet.createdAt)}
            </span>
          </div>
        </div>
        
        <a 
          href={tweet.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-4 h-4 text-black dark:text-white" />
        </a>
      </div>
      
      <p className="text-black dark:text-white mb-3 leading-relaxed text-sm sm:text-base">
        {tweet.text}
      </p>
      
      <div className="flex items-center space-x-4 sm:space-x-6 text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{formatNumber(tweet.replyCount)}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Repeat2 className="w-4 h-4" />
          <span className="text-sm">{formatNumber(tweet.retweetCount)}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Heart className="w-4 h-4" />
          <span className="text-sm">{formatNumber(tweet.likeCount)}</span>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;