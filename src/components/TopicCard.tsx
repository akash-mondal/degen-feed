import React, { useState } from 'react';
import { RefreshCw, Trash2, ArrowRight, Twitter, MessageSquare, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Topic } from '../types';

interface TopicCardProps {
  topic: Topic;
  onRefresh: (topicId: string) => void;
  onDelete: (topicId: string) => void;
  onViewTweets: (topic: Topic) => void;
  onReorder?: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  isRefreshing?: boolean;
  compactView?: boolean;
  onToggleExpand?: (topicId: string) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ 
  topic, 
  onRefresh, 
  onDelete, 
  onViewTweets, 
  onReorder,
  isRefreshing = false,
  compactView = false,
  onToggleExpand
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState<'before' | 'after' | null>(null);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRefresh(topic.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(topic.id);
  };

  const handleViewTweets = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewTweets(topic);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand(topic.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', topic.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';
    setDragOver(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the card entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y < rect.bottom) {
      setDragOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId !== topic.id && onReorder && dragOver) {
      onReorder(draggedId, topic.id, dragOver);
    }
    
    setDragOver(null);
  };

  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getSourceIcons = () => {
    const icons = [];
    if (topic.type === 'twitter' || topic.type === 'both') {
      icons.push(<Twitter key="twitter" className="w-4 h-4" />);
    }
    if (topic.type === 'telegram' || topic.type === 'both') {
      icons.push(<MessageSquare key="telegram" className="w-4 h-4" />);
    }
    return icons;
  };

  const getContentCount = () => {
    const tweetCount = topic.tweets?.length || 0;
    const messageCount = topic.telegramMessages?.length || 0;
    
    if (topic.type === 'twitter') return `${tweetCount} posts`;
    if (topic.type === 'telegram') return `${messageCount} messages`;
    return `${tweetCount} posts, ${messageCount} messages`;
  };

  // Compact view rendering
  if (compactView) {
    return (
      <div 
        className={`glass rounded-xl shadow-lg transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-95' : ''
        } ${
          dragOver === 'before' ? 'border-t-4 border-t-black dark:border-t-white' : ''
        } ${
          dragOver === 'after' ? 'border-b-4 border-b-black dark:border-b-white' : ''
        }`}
        draggable={!!onReorder}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Drag Handle */}
              {onReorder && (
                <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors">
                  <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                </div>
              )}
              
              {topic.profilePicture && (
                <img 
                  src={topic.profilePicture} 
                  alt={topic.displayName}
                  className="w-8 h-8 rounded-full border border-black/20 dark:border-white/20 flex-shrink-0"
                />
              )}
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white truncate">
                    {topic.displayName}
                  </h3>
                  <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {getSourceIcons()}
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {topic.username && `@${topic.username}`}
                  {topic.channelName && topic.username && ' • '}
                  {topic.channelName}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-black dark:text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-full hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
              
              {onToggleExpand && (
                <button
                  onClick={handleToggleExpand}
                  className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-black dark:text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full view rendering
  return (
    <div 
      className={`glass rounded-2xl shadow-xl relative transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        dragOver === 'before' ? 'border-t-4 border-t-black dark:border-t-white' : ''
      } ${
        dragOver === 'after' ? 'border-b-4 border-b-black dark:border-b-white' : ''
      }`}
      draggable={!!onReorder}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Drag Handle */}
            {onReorder && (
              <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors">
                <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-600" />
              </div>
            )}
            
            {topic.profilePicture && (
              <img 
                src={topic.profilePicture} 
                alt={topic.displayName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-black/20 dark:border-white/20 flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white truncate">
                  {topic.displayName}
                </h3>
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 flex-shrink-0">
                  {getSourceIcons()}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                {topic.username && <span className="truncate">@{topic.username}</span>}
                {topic.channelName && topic.username && <span>•</span>}
                {topic.channelName && <span className="truncate">{topic.channelName}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-black dark:text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleDelete}
              className="p-2 rounded-full hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>

            {onToggleExpand && (
              <button
                onClick={handleToggleExpand}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <ChevronUp className="w-4 h-4 text-black dark:text-white" />
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4 mb-4">
          {/* X Summary */}
          {topic.twitterSummary && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Twitter className="w-4 h-4 text-black dark:text-white" />
                <span className="text-sm font-medium text-black dark:text-white">X</span>
              </div>
              <p className="text-black dark:text-white leading-relaxed pl-6 text-sm sm:text-base">
                {topic.twitterSummary}
              </p>
            </div>
          )}
          
          {/* Telegram Summary */}
          {topic.telegramSummary && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="w-4 h-4 text-black dark:text-white" />
                <span className="text-sm font-medium text-black dark:text-white">Telegram</span>
              </div>
              <p className="text-black dark:text-white leading-relaxed pl-6 text-sm sm:text-base">
                {topic.telegramSummary}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span>{getContentCount()} • Updated {timeAgo(topic.lastUpdated)}</span>
          </div>
          
          <button
            onClick={handleViewTweets}
            className="flex items-center justify-center sm:justify-start space-x-2 px-4 py-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-black dark:text-white"
          >
            <span className="text-sm font-medium">View Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
