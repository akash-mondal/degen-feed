import React from 'react';
import { User, Eye } from 'lucide-react';
import { TelegramMessage } from '../types';

interface TelegramMessageCardProps {
  message: TelegramMessage;
}

const TelegramMessageCard: React.FC<TelegramMessageCardProps> = ({ message }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatViews = (views: number | null) => {
    if (!views) return null;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="glass rounded-xl p-3 sm:p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300">
      <div className="flex items-start space-x-3 mb-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1 flex-wrap">
            <span className="font-semibold text-black dark:text-white text-sm truncate">
              {message.sender.name}
            </span>
            {message.sender.username && (
              <span className="text-gray-600 dark:text-gray-400 text-sm truncate">
                @{message.sender.username}
              </span>
            )}
            <span className="text-gray-600 dark:text-gray-400 text-sm flex-shrink-0">
              {formatDate(message.date)}
            </span>
          </div>
        </div>
      </div>
      
      <p className="text-black dark:text-white mb-3 leading-relaxed text-sm sm:text-base">
        {message.text}
      </p>
      
      {message.views && (
        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
          <Eye className="w-4 h-4" />
          <span className="text-sm">{formatViews(message.views)} views</span>
        </div>
      )}
    </div>
  );
};

export default TelegramMessageCard;