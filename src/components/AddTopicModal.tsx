import React, { useState, useEffect } from 'react';
import { X, Plus, Twitter, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { 
    type: 'twitter' | 'telegram' | 'both'; 
    username?: string; 
    channelName?: string;
    summaryLength: 'concise' | 'detailed' | 'comprehensive';
  }) => void;
  isLoading?: boolean;
  showAILoader?: boolean;
}

const AddTopicModal: React.FC<AddTopicModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  isLoading = false,
  showAILoader = false 
}) => {
  const [selectedType, setSelectedType] = useState<'twitter' | 'telegram' | 'both'>('twitter');
  const [username, setUsername] = useState('');
  const [channelName, setChannelName] = useState('');
  const [summaryLength, setSummaryLength] = useState<'concise' | 'detailed' | 'comprehensive'>('detailed');
  const [channelValidation, setChannelValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>({ isValidating: false, isValid: null, message: '' });

  const validateTelegramChannel = async (channel: string) => {
    if (!channel.trim()) {
      setChannelValidation({ isValidating: false, isValid: null, message: '' });
      return;
    }

    setChannelValidation({ isValidating: true, isValid: null, message: 'Checking channel...' });

    try {
      const response = await fetch(`/telegram-api/check/${channel.trim().replace('@', '')}`);
      const data = await response.json();
      
      if (response.ok && data.valid_and_joinable) {
        setChannelValidation({ 
          isValidating: false, 
          isValid: true, 
          message: 'Channel is valid and accessible' 
        });
      } else {
        setChannelValidation({ 
          isValidating: false, 
          isValid: false, 
          message: data.message || 'Channel not found or not accessible' 
        });
      }
    } catch (error) {
      setChannelValidation({ 
        isValidating: false, 
        isValid: false, 
        message: 'Error checking channel' 
      });
    }
  };
  
  useEffect(() => {
    // Condition to run the validation
    const shouldValidate = (selectedType === 'telegram' || selectedType === 'both') && channelName.trim().length > 3;

    if (!shouldValidate) {
        setChannelValidation({ isValidating: false, isValid: null, message: '' });
        return;
    }

    const handler = setTimeout(() => {
      validateTelegramChannel(channelName);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [channelName, selectedType]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: { 
      type: 'twitter' | 'telegram' | 'both'; 
      username?: string; 
      channelName?: string;
      summaryLength: 'concise' | 'detailed' | 'comprehensive';
    } = {
      type: selectedType,
      summaryLength
    };

    if (selectedType === 'twitter' || selectedType === 'both') {
      if (!username.trim()) return;
      data.username = username.trim().replace('@', '');
    }

    if (selectedType === 'telegram' || selectedType === 'both') {
      if (!channelName.trim() || channelValidation.isValid !== true) return;
      data.channelName = channelName.trim().replace('@', '');
    }

    onAdd(data);
    setUsername('');
    setChannelName('');
    setSummaryLength('detailed');
    setChannelValidation({ isValidating: false, isValid: null, message: '' });
    setSelectedType('twitter');
  };

  const isFormValid = () => {
    if (selectedType === 'twitter') return username.trim();
    if (selectedType === 'telegram') return channelName.trim() && channelValidation.isValid === true;
    if (selectedType === 'both') return username.trim() && channelName.trim() && channelValidation.isValid === true;
    return false;
  };

  const getSummaryDescription = (length: string) => {
    switch (length) {
      case 'concise': return '20-30 words - Quick overview';
      case 'detailed': return '50-75 words - Balanced summary';
      case 'comprehensive': return '100-150 words - Full analysis';
      default: return '';
    }
  };

  const getSliderValue = (length: 'concise' | 'detailed' | 'comprehensive') => {
    switch (length) {
      case 'concise': return 0;
      case 'detailed': return 1;
      case 'comprehensive': return 2;
      default: return 1;
    }
  };

  const getSliderLength = (value: number): 'concise' | 'detailed' | 'comprehensive' => {
    switch (value) {
      case 0: return 'concise';
      case 1: return 'detailed';
      case 2: return 'comprehensive';
      default: return 'detailed';
    }
  };

  if (!isOpen) return null;

  // Don't show the modal if AI loader is active
  if (showAILoader) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
              Add New Signal Source
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Source Type Selection */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Signal Source
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedType('twitter')}
                  className={`p-2 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${
                    selectedType === 'twitter'
                      ? 'border-black dark:border-white bg-black/10 dark:bg-white/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-black/50 dark:hover:border-white/50'
                  }`}
                >
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
                  <span className="text-xs font-medium text-black dark:text-white">X</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedType('telegram')}
                  className={`p-2 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${
                    selectedType === 'telegram'
                      ? 'border-black dark:border-white bg-black/10 dark:bg-white/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-black/50 dark:hover:border-white/50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
                  <span className="text-xs font-medium text-black dark:text-white">Telegram</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedType('both')}
                  className={`p-2 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${
                    selectedType === 'both'
                      ? 'border-black dark:border-white bg-black/10 dark:bg-white/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-black/50 dark:hover:border-white/50'
                  }`}
                >
                  <div className="flex space-x-1">
                    <Twitter className="w-3 h-3 sm:w-4 sm:h-4 text-black dark:text-white" />
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-black dark:text-white" />
                  </div>
                  <span className="text-xs font-medium text-black dark:text-white">Both</span>
                </button>
              </div>
            </div>

            {/* Summary Length Slider */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-3">
                Summary Detail Level
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={getSliderValue(summaryLength)}
                    onChange={(e) => setSummaryLength(getSliderLength(parseInt(e.target.value)))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, 
                        ${getSliderValue(summaryLength) >= 0 ? '#000' : '#e5e7eb'} 0%, 
                        ${getSliderValue(summaryLength) >= 0 ? '#000' : '#e5e7eb'} ${(getSliderValue(summaryLength) / 2) * 100}%, 
                        #e5e7eb ${(getSliderValue(summaryLength) / 2) * 100}%, 
                        #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span className={summaryLength === 'concise' ? 'font-medium text-black dark:text-white' : ''}>
                      Concise
                    </span>
                    <span className={summaryLength === 'detailed' ? 'font-medium text-black dark:text-white' : ''}>
                      Detailed
                    </span>
                    <span className={summaryLength === 'comprehensive' ? 'font-medium text-black dark:text-white' : ''}>
                      Comprehensive
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="text-sm font-medium text-black dark:text-white capitalize mb-1">
                    {summaryLength}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {getSummaryDescription(summaryLength)}
                  </div>
                </div>
              </div>
            </div>

            {/* X Username Input */}
            {(selectedType === 'twitter' || selectedType === 'both') && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-black dark:text-white mb-2">
                  X Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="elonmusk"
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 focus:border-transparent text-sm sm:text-base"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Enter username without @ symbol
                </p>
              </div>
            )}

            {/* Telegram Channel Input */}
            {(selectedType === 'telegram' || selectedType === 'both') && (
              <div>
                <label htmlFor="channelName" className="block text-sm font-medium text-black dark:text-white mb-2">
                  Telegram Channel
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="channelName"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="openservai"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 focus:border-transparent text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  {channelValidation.isValidating && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!channelValidation.isValidating && channelValidation.isValid === true && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  )}
                  {!channelValidation.isValidating && channelValidation.isValid === false && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  channelValidation.isValid === true ? 'text-green-600 dark:text-green-400' :
                  channelValidation.isValid === false ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {channelValidation.message || 'Enter channel name (min 4 chars)'}
                </p>
              </div>
            )}
            
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || isLoading}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Signal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTopicModal;
