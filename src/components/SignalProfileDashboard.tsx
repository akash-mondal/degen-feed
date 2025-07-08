import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Users, Tag, Hash, Type } from 'lucide-react';
import { SignalProfile, Topic } from '../types';
import SignalProfileModal from './SignalProfileModal';

interface SignalProfileDashboardProps {
  profiles: SignalProfile[];
  allTopics: Topic[];
  onBack: () => void;
  onSaveProfile: (data: any, profileId?: string) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
}

const SignalProfileDashboard: React.FC<SignalProfileDashboardProps> = ({ profiles, allTopics, onBack, onSaveProfile, onDeleteProfile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SignalProfile | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (data: any, profileId?: string) => {
    setIsLoading(true);
    await onSaveProfile(data, profileId);
    setIsLoading(false);
    setIsModalOpen(false);
    setEditingProfile(undefined);
  };
  
  const openEditModal = (profile: SignalProfile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
  };
  
  const openNewModal = () => {
    setEditingProfile(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="p-3 rounded-full glass border hover:bg-black/10 dark:hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Signal Profiles</h1>
          </div>
          <button onClick={openNewModal} className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium flex items-center space-x-2">
            <Plus size={18} />
            <span>New Profile</span>
          </button>
        </div>

        {/* Profiles List */}
        <div className="space-y-6">
          {profiles.length > 0 ? (
            profiles.map(profile => (
              <div key={profile.id} className="glass rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{profile.profileName}</h2>
                    <p className="text-sm text-gray-500">{profile.topics.length} sources included</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => openEditModal(profile)} className="p-2 hover:bg-black/10 rounded-full"><Edit size={16}/></button>
                    <button onClick={() => onDeleteProfile(profile.id)} className="p-2 hover:bg-red-500/20 rounded-full"><Trash2 size={16} className="text-red-500"/></button>
                  </div>
                </div>

                {/* Included Topics */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.topics.map(topic => (
                      <div key={topic.id} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-sm">
                        <img src={topic.profilePicture} className="w-5 h-5 rounded-full" />
                        <span>{topic.displayName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                {profile.rules.length > 0 && (
                   <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Alerting Rules</h3>
                     <div className="space-y-2">
                       {profile.rules.map((rule, i) => (
                         <div key={i} className="flex items-center space-x-2 text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                            {rule.type === 'ticker' && <Tag size={14} className="text-green-500"/>}
                            {rule.type === 'ca' && <Hash size={14} className="text-blue-500"/>}
                            {rule.type === 'keyword' && <Type size={14} className="text-purple-500"/>}
                            <span className="font-mono bg-white dark:bg-black px-2 py-0.5 rounded">{rule.value}</span>
                            {/* THIS IS THE FIX */}
                            {rule.type !== 'custom' && <span className="text-gray-500">(&gt;{rule.mentionThreshold} in {rule.groupThreshold} groups)</span>}
                         </div>
                       ))}
                     </div>
                   </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16 glass rounded-2xl">
              <h3 className="text-xl font-semibold mb-2">No Profiles Yet</h3>
              <p className="text-gray-500 mb-6">Group your signals together to create powerful, custom alerts.</p>
              <button onClick={openNewModal} className="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium">Create Your First Profile</button>
            </div>
          )}
        </div>
      </div>
      
      <SignalProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isLoading={isLoading}
        allTopics={allTopics}
        existingProfile={editingProfile}
      />
    </div>
  );
};

export default SignalProfileDashboard;
