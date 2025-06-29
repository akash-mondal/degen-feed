import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { Topic } from '../types';

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
              {/* LEGO Animation with exact timeline */}
              <div className="mb-8 flex justify-center">
                <div className="lego-container">
                  <style jsx>{`
                    .lego-container {
                      position: relative;
                      width: 150px;
                      height: 130px;
                      margin: 0 auto;
                      transform: scale(0.8);
                    }

                    .lego {
                      width: 25px;
                      height: 25px;
                      position: absolute;
                      transform: rotate(45deg);
                    }

                    .dot {
                      width: 7.5px;
                      height: 7.5px;
                      border-radius: 50%;
                      position: absolute;
                      transform: rotate(-45deg);
                    }

                    .dot:after {
                      content: "";
                      position: absolute;
                      left: 0;
                      top: -1.75px;
                      width: 7.5px;
                      height: 7.5px;
                      border-radius: 50%;
                    }

                    .dot:nth-child(1) {
                      top: 3.75px;
                      left: 3.75px;
                    }

                    .dot:nth-child(2) {
                      bottom: 3.75px;
                      left: 3.75px;
                    }

                    .dot:nth-child(3) {
                      top: 3.75px;
                      right: 3.75px;
                    }

                    .dot:nth-child(4) {
                      bottom: 3.75px;
                      right: 3.75px;
                    }

                    .lego:before {
                      content: "";
                      position: absolute;
                      top: 100%;
                      left: 3.75px;
                      height: 7.5px;
                      width: 100%;
                      transform: skewX(45deg);
                    }

                    .lego:after {
                      content: "";
                      position: absolute;
                      left: 100%;
                      top: 3.75px;
                      height: 100%;
                      width: 7.5px;
                      transform: skewY(45deg);
                    }

                    #lego-one {
                      top: 75px;
                      left: 50px;
                      z-index: 100;
                      background: #63D2F3;
                      animation: lego-one-moves 8s infinite ease-in-out;
                    }

                    #lego-one:before {
                      background: #4FACCE;
                    }

                    #lego-one:after {
                      background: #2585A9;
                    }

                    #lego-one .dot {
                      background: #2585A9;
                    }

                    #lego-one .dot:after {
                      background: #63D2F3;
                    }

                    #lego-two {
                      top: 57.5px;
                      left: 67.5px;
                      z-index: 90;
                      background: #9ED027;
                      animation: lego-two-moves 8s infinite ease-in-out;
                    }

                    #lego-two:before {
                      background: #96C42F;
                    }

                    #lego-two:after {
                      background: #719318;
                    }

                    #lego-two .dot {
                      background: #719318;
                    }

                    #lego-two .dot:after {
                      background: #9ED027;
                    }

                    #lego-three {
                      top: 40px;
                      left: 85px;
                      z-index: 80;
                      background: #F9EB2F;
                      animation: lego-three-moves 8s infinite ease-in-out;
                    }

                    #lego-three:before {
                      background: #F9E22E;
                    }

                    #lego-three:after {
                      background: #E7B825;
                    }

                    #lego-three .dot {
                      background: #E7B825;
                    }

                    #lego-three .dot:after {
                      background: #F9EB2F;
                    }

                    #lego-four {
                      top: 40px;
                      left: 50px;
                      z-index: 70;
                      background: #FF9D52;
                      animation: lego-four-moves 8s infinite ease-in-out;
                    }

                    #lego-four:before {
                      background: #FD6914;
                    }

                    #lego-four:after {
                      background: #F45205;
                    }

                    #lego-four .dot {
                      background: #F45205;
                    }

                    #lego-four .dot:after {
                      background: #FF9D52;
                    }

                    #lego-five {
                      top: 22.5px;
                      left: 67.5px;
                      z-index: 60;
                      background: #EB413B;
                      animation: lego-five-moves 8s infinite ease-in-out;
                    }

                    #lego-five:before {
                      background: #E6242A;
                    }

                    #lego-five:after {
                      background: #D3001D;
                    }

                    #lego-five .dot {
                      background: #D3001D;
                    }

                    #lego-five .dot:after {
                      background: #EB413B;
                    }

                    /* Exact timeline animations following the GSAP code */
                    @keyframes lego-one-moves {
                      0% { transform: rotate(45deg) translate(0, 0); z-index: 100; }
                      5% { transform: rotate(45deg) translate(-17.5px, -17.5px); z-index: 75; }
                      10% { transform: rotate(45deg) translate(-17.5px, -17.5px); z-index: 75; }
                      15.625% { transform: rotate(45deg) translate(0, -35px); z-index: 75; }
                      31.25% { transform: rotate(45deg) translate(17.5px, -52.5px); z-index: 75; }
                      37.5% { transform: rotate(45deg) translate(17.5px, -17.5px); z-index: 80; }
                      43.75% { transform: rotate(45deg) translate(35px, -35px); z-index: 75; }
                      50% { transform: rotate(45deg) translate(0, 0); z-index: 100; }
                      100% { transform: rotate(45deg) translate(0, 0); z-index: 100; }
                    }

                    @keyframes lego-two-moves {
                      0% { transform: rotate(45deg) translate(0, 0); z-index: 90; }
                      10% { transform: rotate(45deg) translate(-17.5px, 17.5px); z-index: 90; }
                      18.75% { transform: rotate(45deg) translate(-35px, 0); z-index: 75; }
                      31.25% { transform: rotate(45deg) translate(-17.5px, -17.5px); z-index: 65; }
                      37.5% { transform: rotate(45deg) translate(0, -35px); z-index: 90; }
                      43.75% { transform: rotate(45deg) translate(17.5px, -17.5px); z-index: 75; }
                      50% { transform: rotate(45deg) translate(0, 0); z-index: 90; }
                      100% { transform: rotate(45deg) translate(0, 0); z-index: 90; }
                    }

                    @keyframes lego-three-moves {
                      0% { transform: rotate(45deg) translate(0, 0); z-index: 80; }
                      12.5% { transform: rotate(45deg) translate(-17.5px, 17.5px); z-index: 80; }
                      18.75% { transform: rotate(45deg) translate(-35px, 35px); z-index: 80; }
                      25% { transform: rotate(45deg) translate(-52.5px, 17.5px); z-index: 75; }
                      31.25% { transform: rotate(45deg) translate(-35px, 0); z-index: 65; }
                      43.75% { transform: rotate(45deg) translate(-17.5px, -17.5px); z-index: 65; }
                      50% { transform: rotate(45deg) translate(0, 0); z-index: 80; }
                      100% { transform: rotate(45deg) translate(0, 0); z-index: 80; }
                    }

                    @keyframes lego-four-moves {
                      0% { transform: rotate(45deg) translate(0, 0); z-index: 70; }
                      12.5% { transform: rotate(45deg) translate(35px, 0); z-index: 75; }
                      25% { transform: rotate(45deg) translate(35px, 0); z-index: 75; }
                      31.25% { transform: rotate(45deg) translate(0, 35px); z-index: 85; }
                      37.5% { transform: rotate(45deg) translate(17.5px, 17.5px); z-index: 85; }
                      43.75% { transform: rotate(45deg) translate(-17.5px, 17.5px); z-index: 70; }
                      50% { transform: rotate(45deg) translate(0, 0); z-index: 70; }
                      100% { transform: rotate(45deg) translate(0, 0); z-index: 70; }
                    }

                    @keyframes lego-five-moves {
                      0% { transform: rotate(45deg) translate(0, 0); z-index: 60; }
                      12.5% { transform: rotate(45deg) translate(17.5px, 17.5px); z-index: 75; }
                      18.75% { transform: rotate(45deg) translate(0, 35px); z-index: 75; }
                      25% { transform: rotate(45deg) translate(-17.5px, 52.5px); z-index: 75; }
                      31.25% { transform: rotate(45deg) translate(-35px, 35px); z-index: 75; }
                      43.75% { transform: rotate(45deg) translate(-17.5px, 17.5px); z-index: 60; }
                      50% { transform: rotate(45deg) translate(0, 0); z-index: 60; }
                      100% { transform: rotate(45deg) translate(0, 0); z-index: 60; }
                    }
                  `}</style>
                  
                  <div className="lego" id="lego-one">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <div className="lego" id="lego-two">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <div className="lego" id="lego-three">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <div className="lego" id="lego-four">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <div className="lego" id="lego-five">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
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
                    .success-svg {
                      width: 100%;
                      height: 100%;
                    }
                    
                    .path {
                      stroke-dasharray: 1000;
                      stroke-dashoffset: 0;
                    }
                    
                    .path.circle {
                      animation: dash 0.9s ease-in-out;
                    }
                    
                    .path.check {
                      stroke-dashoffset: -100;
                      animation: dash-check 0.9s 0.35s ease-in-out forwards;
                    }
                    
                    @keyframes dash {
                      0% {
                        stroke-dashoffset: 1000;
                      }
                      100% {
                        stroke-dashoffset: 0;
                      }
                    }
                    
                    @keyframes dash-check {
                      0% {
                        stroke-dashoffset: -100;
                      }
                      100% {
                        stroke-dashoffset: 900;
                      }
                    }
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