import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag, Hash, Type } from 'lucide-react';
import { Topic, SignalRule } from '../types';

interface SignalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: {
    profileName: string;
    rules: SignalRule[];
    trackedSenders: string[];
    topicIds: string[];
  }, profileId?: string) => void;
  isLoading: boolean;
  allTopics: Topic[];
  existingProfile?: any; // Use 'any' for flexibility during editing
}

const SignalProfileModal: React.FC<SignalProfileModalProps> = ({
  isOpen, onClose, onSave, isLoading, allTopics, existingProfile
}) => {
  const [profileName, setProfileName] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [rules, setRules] = useState<SignalRule[]>([]);
  const [trackedSenders, setTrackedSenders] = useState('');

  useEffect(() => {
    if (existingProfile) {
      setProfileName(existingProfile.profileName || '');
      setSelectedTopicIds(new Set(existingProfile.topics?.map((t: Topic) => t.id) || []));
      setRules(existingProfile.rules || []);
      setTrackedSenders((existingProfile.trackedSenders || []).join(', '));
    } else {
      // Reset form when opening for a new profile
      setProfileName('');
      setSelectedTopicIds(new Set());
      setRules([]);
      setTrackedSenders('');
    }
  }, [existingProfile, isOpen]);
  
  const handleAddRule = () => {
    setRules([...rules, { type: 'ticker', value: '', mentionThreshold: 3, groupThreshold: 1 }]);
  };
  
  const handleRuleChange = (index: number, field: keyof SignalRule, value: any) => {
    const newRules = [...rules];
    (newRules[index] as any)[field] = value;
    setRules(newRules);
  };
  
  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };
  
  const handleTopicToggle = (topicId: string) => {
    const newSelection = new Set(selectedTopicIds);
    if (newSelection.has(topicId)) {
      newSelection.delete(topicId);
    } else {
      newSelection.add(topicId);
    }
    setSelectedTopicIds(newSelection);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim() || selectedTopicIds.size === 0) {
      alert('Profile name and at least one topic are required.');
      return;
    }
    onSave({
      profileName,
      rules,
      trackedSenders: trackedSenders.split(',').map(s => s.trim()).filter(Boolean),
      topicIds: Array.from(selectedTopicIds)
    }, existingProfile?.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">{existingProfile ? 'Edit' : 'Create'} Signal Profile</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-6">
            {/* Profile Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Profile Name</label>
              <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g., 'AI Coins Alpha'" className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border" />
            </div>

            {/* Select Topics */}
            <div>
              <label className="block text-sm font-medium mb-2">Included Signal Sources ({selectedTopicIds.size})</label>
              <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                {allTopics.map(topic => (
                  <div key={topic.id} onClick={() => handleTopicToggle(topic.id)} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer border-2 ${selectedTopicIds.has(topic.id) ? 'border-black dark:border-white' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 ${selectedTopicIds.has(topic.id) ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-gray-300'}`}></div>
                    <img src={topic.profilePicture} className="w-8 h-8 rounded-full" alt={topic.displayName} />
                    <span className="font-medium truncate">{topic.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tracked Senders */}
            <div>
              <label className="block text-sm font-medium mb-2">Track People Across All Sources</label>
              <input type="text" value={trackedSenders} onChange={e => setTrackedSenders(e.target.value)} placeholder="vitalik.eth, user_id_123" className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border" />
               <p className="text-xs text-gray-500 mt-1">Comma-separated usernames or IDs.</p>
            </div>

            {/* Rules Engine */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Alerting Rules</label>
                <button onClick={handleAddRule} className="text-xs flex items-center space-x-1 font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800"><Plus size={14}/><span>Add Rule</span></button>
              </div>
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 space-y-2">
                    <div className="flex items-center space-x-2">
                       <select value={rule.type} onChange={e => handleRuleChange(index, 'type', e.target.value)} className="p-1 rounded-md bg-white dark:bg-gray-800 border-none text-sm">
                          <option value="ticker">$Ticker</option>
                          <option value="ca">CA</option>
                          <option value="keyword">Keyword</option>
                          <option value="custom">Custom</option>
                        </select>
                      <input type="text" value={rule.value} onChange={e => handleRuleChange(index, 'value', e.target.value)} className="flex-grow px-2 py-1 rounded-md bg-white dark:bg-gray-800 border" placeholder={rule.type === 'custom' ? 'e.g., "mentions of new partnerships"' : 'Value'}/>
                      <button onClick={() => handleRemoveRule(index)}><Trash2 className="w-4 h-4 text-red-500"/></button>
                    </div>
                    {rule.type !== 'custom' && (
                      <div className="flex items-center space-x-4 text-xs">
                        <span>Alert if mentioned &gt;</span>
                        <input type="number" value={rule.mentionThreshold} onChange={e => handleRuleChange(index, 'mentionThreshold', parseInt(e.target.value))} className="w-16 px-2 py-1 rounded-md bg-white dark:bg-gray-800 border" />
                        <span>times in</span>
                        <input type="number" value={rule.groupThreshold} onChange={e => handleRuleChange(index, 'groupThreshold', parseInt(e.target.value))} className="w-16 px-2 py-1 rounded-md bg-white dark:bg-gray-800 border" />
                        <span>group(s)</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800">Cancel</button>
              <button onClick={handleSaveProfile} disabled={isLoading} className="flex-1 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-medium disabled:opacity-50">
                {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalProfileModal;
