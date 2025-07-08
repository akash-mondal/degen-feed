import React, { useState, useEffect } from 'react';
import { X, Plus, Twitter, MessageSquare, CheckCircle, XCircle, Link, Users } from 'lucide-react';
import { TelegramChannelService } from '../services/telegramChannelService';
import { TelegramResponse } from '../types';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { 
    type: 'twitter' | 'telegram' | 'private_telegram' | 'both'; 
    username?: string; 
    channelName?: string;
    channelId?: number;
    inviteLink?: string;
    summaryLength: 'concise' | 'detailed' | 'comprehensive' | 'custom';
    customSummaryLength?: number;
    trackedSenders?: string[];
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
  const [selectedType, setSelectedType] = useState<'twitter' | 'telegram' | 'private_telegram' | 'both'>('twitter');
  const [username, setUsername] = useState('');
  const [channelName, setChannelName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [summaryLength, setSummaryLength] = useState<'concise' | 'detailed' | 'comprehensive' | 'custom'>('detailed');
  const [customLength, setCustomLength] = useState(200);
  const [trackedSenders, setTrackedSenders] = useState('');

  // States for channel validation
  const [publicChannelValidation, setPublicChannelValidation] = useState({ isValidating: false, isValid: null as boolean | null, message: '' });
  const [privateChannelValidation, setPrivateChannelValidation] = useState({ isValidating: false, isValid: null as boolean | null, message: '', details: null as TelegramResponse['details'] | null });

  const telegramService = TelegramChannelService.getInstance();

  const handlePublicChannelValidation = async (channel: string) => {
    if (!channel.trim()) {
      setPublicChannelValidation({ isValidating: false, isValid: null, message: '' });
      return;
    }
    setPublicChannelValidation({ isValidating: true, isValid: null, message: 'Checking channel...' });
    const isValid = await telegramService.checkChannel(channel.trim().replace('@', ''));
    setPublicChannelValidation({
      isValidating: false,
      isValid,
      message: isValid ? 'Channel is valid and accessible' : 'Channel not found or not accessible'
    });
  };

  const handlePrivateChannelValidation = async (link: string) => {
    if (!link.trim() || !link.includes('t.me/')) {
        setPrivateChannelValidation({ isValidating: false, isValid: null, message: '', details: null });
        return;
    }
    setPrivateChannelValidation({ isValidating: true, isValid: null, message: 'Joining & verifying...', details: null });
    try {
        const result = await telegramService.joinPrivateChannel(link);
        if (result.status === 'success' && result.details) {
            setPrivateChannelValidation({
                isValidating: false,
                isValid: true,
                message: `Successfully joined '${result.details.title}'`,
                details: result.details
            });
        } else {
            throw new Error((result as any).detail || 'Failed to join.');
        }
    } catch (error: any) {
        setPrivateChannelValidation({
            isValidating: false,
            isValid: false,
            message: error.message || 'Error joining channel',
            details: null
        });
    }
  };

  useEffect(() => {
    if (selectedType === 'telegram' || (selectedType === 'both' && channelName.trim().length > 3)) {
      const handler = setTimeout(() => handlePublicChannelValidation(channelName), 500);
      return () => clearTimeout(handler);
    } else {
      setPublicChannelValidation({ isValidating: false, isValid: null, message: '' });
    }
  }, [channelName, selectedType]);

  useEffect(() => {
    if (selectedType === 'private_telegram' && inviteLink.trim().length > 10) {
        const handler = setTimeout(() => handlePrivateChannelValidation(inviteLink), 800);
        return () => clearTimeout(handler);
    } else {
        setPrivateChannelValidation({ isValidating: false, isValid: null, message: '', details: null });
    }
  }, [inviteLink, selectedType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    let data: Parameters<typeof onAdd>[0] = {
      type: selectedType,
      summaryLength,
      customSummaryLength: summaryLength === 'custom' ? customLength : undefined,
      trackedSenders: trackedSenders.trim() ? trackedSenders.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    };

    if (selectedType === 'twitter') data.username = username.trim().replace('@', '');
    if (selectedType === 'telegram') data.channelName = channelName.trim().replace('@', '');
    if (selectedType === 'private_telegram') {
      data.inviteLink = inviteLink;
      data.channelName = privateChannelValidation.details?.title;
      data.channelId = privateChannelValidation.details?.id;
    }
    if (selectedType === 'both') {
      data.username = username.trim().replace('@', '');
      data.channelName = channelName.trim().replace('@', '');
    }

    onAdd(data);
    // Reset form state after adding
    setUsername(''); setChannelName(''); setInviteLink(''); setTrackedSenders('');
    setSummaryLength('detailed'); setCustomLength(200); setSelectedType('twitter');
  };

  const isFormValid = () => {
    if (isLoading) return false;
    if (selectedType === 'twitter') return username.trim();
    if (selectedType === 'telegram') return channelName.trim() && publicChannelValidation.isValid === true;
    if (selectedType === 'private_telegram') return inviteLink.trim() && privateChannelValidation.isValid === true;
    if (selectedType === 'both') return username.trim() && channelName.trim() && publicChannelValidation.isValid === true;
    return false;
  };

  const getSliderValue = (length: string) => ({ 'concise': 0, 'detailed': 1, 'comprehensive': 2, 'custom': 3 }[length] || 1);
  const getSliderLength = (value: number) => (['concise', 'detailed', 'comprehensive', 'custom'] as const)[value] || 'detailed';
  
  const getSummaryDescription = (length: string) => ({
      'concise': '30-40 words - Quick overview',
      'detailed': '50-75 words - Balanced summary',
      'comprehensive': '100-150 words - Full analysis',
      'custom': `Up to ${customLength} words - Your choice`
  }[length] || '');

  if (!isOpen || showAILoader) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">Add New Signal Source</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-5 h-5 text-black dark:text-white" /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Signal Source</label>
              <div className="grid grid-cols-4 gap-2">
                {/* Twitter Button */}
                <button type="button" onClick={() => setSelectedType('twitter')} className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${selectedType === 'twitter' ? 'border-black dark:border-white bg-black/10 dark:bg-white/10' : 'border-gray-300 dark:border-gray-600'}`}>
                    <Twitter className="w-5 h-5 text-black dark:text-white" /><span className="text-xs font-medium text-black dark:text-white">X</span>
                </button>
                {/* Public Telegram Button */}
                <button type="button" onClick={() => setSelectedType('telegram')} className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${selectedType === 'telegram' ? 'border-black dark:border-white bg-black/10 dark:bg-white/10' : 'border-gray-300 dark:border-gray-600'}`}>
                    <MessageSquare className="w-5 h-5 text-black dark:text-white" /><span className="text-xs font-medium text-black dark:text-white">Public</span>
                </button>
                {/* Private Telegram Button */}
                <button type="button" onClick={() => setSelectedType('private_telegram')} className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${selectedType === 'private_telegram' ? 'border-black dark:border-white bg-black/10 dark:bg-white/10' : 'border-gray-300 dark:border-gray-600'}`}>
                    <Link className="w-5 h-5 text-black dark:text-white" /><span className="text-xs font-medium text-black dark:text-white">Private</span>
                </button>
                {/* Both Button */}
                <button type="button" onClick={() => setSelectedType('both')} className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${selectedType === 'both' ? 'border-black dark:border-white bg-black/10 dark:bg-white/10' : 'border-gray-300 dark:border-gray-600'}`}>
                    <div className="flex space-x-1"><Twitter className="w-4 h-4" /><MessageSquare className="w-4 h-4" /></div><span className="text-xs font-medium text-black dark:text-white">Both</span>
                </button>
              </div>
            </div>

            {/* X Username Input */}
            {(selectedType === 'twitter' || selectedType === 'both') && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-black dark:text-white mb-2">X Username</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="elonmusk" className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" disabled={isLoading} />
              </div>
            )}

            {/* Public Telegram Channel Input */}
            {(selectedType === 'telegram' || selectedType === 'both') && (
              <div>
                <label htmlFor="channelName" className="block text-sm font-medium text-black dark:text-white mb-2">Public Telegram Channel</label>
                <div className="relative">
                  <input type="text" id="channelName" value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="openservai" className="w-full px-3 py-2 pr-10 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" disabled={isLoading} />
                  {publicChannelValidation.isValidating && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-t-black dark:border-t-white rounded-full animate-spin"></div>}
                  {!publicChannelValidation.isValidating && publicChannelValidation.isValid && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                  {!publicChannelValidation.isValidating && publicChannelValidation.isValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
                </div>
                <p className={`text-xs mt-1 ${publicChannelValidation.isValid === true ? 'text-green-600' : 'text-red-600'}`}>{publicChannelValidation.message || 'Enter channel name (min 4 chars)'}</p>
              </div>
            )}
            
            {/* Private Telegram Invite Link Input */}
            {selectedType === 'private_telegram' && (
              <div>
                <label htmlFor="inviteLink" className="block text-sm font-medium text-black dark:text-white mb-2">Private Group Invite Link</label>
                <div className="relative">
                    <input type="text" id="inviteLink" value={inviteLink} onChange={(e) => setInviteLink(e.target.value)} placeholder="https://t.me/joinchat/..." className="w-full px-3 py-2 pr-10 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" disabled={isLoading || privateChannelValidation.isValidating} />
                    {privateChannelValidation.isValidating && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-t-black dark:border-t-white rounded-full animate-spin"></div>}
                    {!privateChannelValidation.isValidating && privateChannelValidation.isValid && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                    {!privateChannelValidation.isValidating && privateChannelValidation.isValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
                </div>
                <p className={`text-xs mt-1 ${privateChannelValidation.isValid === true ? 'text-green-600' : 'text-red-600'}`}>{privateChannelValidation.message || 'Paste the full invite link'}</p>
              </div>
            )}
            
            {/* Tracked Senders Input */}
             <div>
                <label htmlFor="trackedSenders" className="block text-sm font-medium text-black dark:text-white mb-2">Track Specific People (optional)</label>
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                    <input type="text" id="trackedSenders" value={trackedSenders} onChange={(e) => setTrackedSenders(e.target.value)} placeholder="user1, user2, 12345678" className="w-full pl-10 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" disabled={isLoading} />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Comma-separated usernames or user IDs.</p>
            </div>

            {/* Summary Length Slider */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-3">Summary Detail Level</label>
              <div className="space-y-3">
                  <input type="range" min="0" max="3" step="1" value={getSliderValue(summaryLength)} onChange={(e) => setSummaryLength(getSliderLength(parseInt(e.target.value)))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"/>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <span className={summaryLength === 'concise' ? 'font-bold' : ''}>Concise</span>
                      <span className={summaryLength === 'detailed' ? 'font-bold' : ''}>Detailed</span>
                      <span className={summaryLength === 'comprehensive' ? 'font-bold' : ''}>Full</span>
                      <span className={summaryLength === 'custom' ? 'font-bold' : ''}>Custom</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-sm font-medium capitalize mb-1">{summaryLength}</div>
                      <div className="text-xs text-gray-500">{getSummaryDescription(summaryLength)}</div>
                      {summaryLength === 'custom' && (
                        <div className="mt-2">
                          <input type="number" value={customLength} onChange={e => setCustomLength(Math.min(1000, Math.max(50, parseInt(e.target.value) || 50)))} className="w-full px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"/>
                          <p className="text-xs text-gray-500 mt-1">Enter a word count between 50 and 1000.</p>
                        </div>
                      )}
                  </div>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700" disabled={isLoading}>Cancel</button>
              <button type="submit" disabled={!isFormValid() || isLoading} className="flex-1 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                {isLoading ? <div className="w-5 h-5 border-2 border-t-white dark:border-t-black rounded-full animate-spin"></div> : <><Plus className="w-5 h-5" /><span>Add Signal</span></>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTopicModal;
