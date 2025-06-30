import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Topic } from '../types';
import GsapGridAnimation from './GsapGridAnimation'; // Import the new component

interface DailyBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
}

const DailyBriefModal: React.FC<DailyBriefModalProps> = ({ isOpen, onClose, topics }) => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'selection' | 'success'>('intro');
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('intro');
      setSelectedTopics(new Set());
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep === 'intro') {
      setCurrentStep('selection');
    }
  };

  const handleTopicToggle = (topicId: string) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId);
    } else {
      newSelected.add(topicId);
    }
    setSelectedTopics(newSelected);
  };

  const handleSetTopics = () => {
    setCurrentStep('success');
    // Here you would save the selected topics to backend
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
              Daily Brief Configuration
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
          </div>

          {/* Intro Step */}
          {currentStep === 'intro' && (
            <div className="text-center">
              {/* GSAP Grid Animation */}
              <div className="mb-4 flex justify-center overflow-hidden">
                <GsapGridAnimation />
              </div>

              <h3 className="text-xl font-bold text-black dark:text-white mb-4">
                Welcome to Degen Daily
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Add topics from the main feed and select them here. Our AI agents will use the social analysis 
                from here with additional research to give you a daily debrief on the topics you care about.
              </p>

              <button
                onClick={handleNext}
                className="w-full px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
              >
                Continue
              </button>
            </div>
          )}

          {/* Selection Step */}
          {currentStep === 'selection' && (
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                Select Topics for Daily Brief
              </h3>
              
              {topics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No topics available. Add some signal sources first.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        onClick={() => handleTopicToggle(topic.id)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedTopics.has(topic.id)
                            ? 'border-black dark:border-white bg-black/10 dark:bg-white/10'
                            : 'border-gray-300 dark:border-gray-600 hover:border-black/50 dark:hover:border-white/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedTopics.has(topic.id)
                              ? 'border-black dark:border-white bg-black dark:bg-white'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selectedTopics.has(topic.id) && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20,6 9,17 4,12" className="text-white dark:text-black" />
                              </svg>
                            )}
                          </div>
                          
                          {topic.profilePicture && (
                            <img 
                              src={topic.profilePicture} 
                              alt={topic.displayName}
                              className="w-8 h-8 rounded-full border border-black/20 dark:border-white/20"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-black dark:text-white truncate">
                              {topic.displayName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {topic.username && `@${topic.username}`}
                              {topic.channelName && topic.username && ' • '}
                              {topic.channelName}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setCurrentStep('intro')}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSetTopics}
                      disabled={selectedTopics.size === 0}
                      className="flex-1 px-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Topics ({selectedTopics.size})
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Success Step with SVG Animation */}
          {currentStep === 'success' && (
            <div className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24">
                  <style jsx>{`
                    .success-svg { width: 100%; height: 100%; }
                    .path { stroke-dasharray: 1000; stroke-dashoffset: 0; }
                    .path.circle { animation: dash 0.9s ease-in-out; }
                    .path.check { stroke-dashoffset: -100; animation: dash-check 0.9s 0.35s ease-in-out forwards; }
                    @keyframes dash { 0% { stroke-dashoffset: 1000; } 100% { stroke-dashoffset: 0; } }
                    @keyframes dash-check { 0% { stroke-dashoffset: -100; } 100% { stroke-dashoffset: 900; } }
                  `}</style>
                  <svg className="success-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
                    <circle className="path circle" fill="none" stroke="#73AF55" strokeWidth="6" strokeMiterlimit="10" cx="65.1" cy="65.1" r="62.1"/>
                    <polyline className="path check" fill="none" stroke="#73AF55" strokeWidth="6" strokeLinecap="round" strokeMiterlimit="10" points="100.2,40.2 51.5,88.8 29.8,67.5 "/>
                  </svg>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                Daily Brief Configured!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You'll receive daily briefings for {selectedTopics.size} selected topic{selectedTopics.size !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyBriefModal;
