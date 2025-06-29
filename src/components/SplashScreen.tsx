import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState<'first' | 'second' | 'revealing'>('first');
  const [ribbonStage, setRibbonStage] = useState(0); // 0: not started, 1: first ribbon, 2: second ribbon, 3: third ribbon, 4: ribbons exiting, 5: all ribbons off screen
  const [blurAmount, setBlurAmount] = useState(20); // Start with strong blur

  useEffect(() => {
    // First screen for 2 seconds
    const firstTimer = setTimeout(() => {
      setCurrentScreen('second');
      // Start ribbon animation sequence with proper delays
      setTimeout(() => setRibbonStage(1), 200);    // First ribbon starts
      setTimeout(() => setRibbonStage(2), 800);    // Second ribbon starts (600ms after first)
      setTimeout(() => setRibbonStage(3), 1400);   // Third ribbon starts (600ms after second)
      setTimeout(() => setRibbonStage(4), 2000);   // Start ribbons exiting
      setTimeout(() => {
        setRibbonStage(5); // All ribbons off screen
        setCurrentScreen('revealing');
        
        // Smooth blur reduction over 1.5 seconds
        const blurInterval = setInterval(() => {
          setBlurAmount(prev => {
            const newAmount = prev - 1;
            if (newAmount <= 0) {
              clearInterval(blurInterval);
              // Complete the splash screen after blur is gone
              setTimeout(onComplete, 200);
              return 0;
            }
            return newAmount;
          });
        }, 75); // 20 steps over 1.5 seconds (75ms each)
        
      }, 3200);   // Wait for all ribbons to fully exit
    }, 2000);

    return () => {
      clearTimeout(firstTimer);
    };
  }, [onComplete]);

  const getRibbonClasses = (ribbonNumber: number) => {
    const baseClasses = "absolute w-full h-20 flex items-center justify-center transition-all duration-700 ease-out";
    const roundedClasses = "rounded-full"; // Rounded on both ends
    
    let transformClasses = "";
    let opacityClasses = "opacity-100";
    
    if (ribbonStage >= ribbonNumber) {
      transformClasses = "translate-x-0";
    } else {
      transformClasses = "-translate-x-full";
    }
    
    if (ribbonStage >= 4) {
      transformClasses = "translate-x-full";
      opacityClasses = "opacity-0"; // Fade out as they exit
    }
    
    return `${baseClasses} ${roundedClasses} ${transformClasses} ${opacityClasses}`;
  };

  const getRibbonStyle = (ribbonNumber: number, topPosition: string) => {
    let transitionDelay = '0s';
    
    if (ribbonStage >= 4) {
      // Staggered exit delays
      const exitDelays = ['0s', '0.3s', '0.6s'];
      transitionDelay = exitDelays[ribbonNumber - 1] || '0s';
    }
    
    return {
      top: topPosition,
      transitionDelay,
      transitionProperty: 'transform, opacity'
    };
  };

  return (
    <div className={`fixed inset-0 z-50 bg-white dark:bg-black transition-opacity duration-300`}>
      {/* First Screen - DEGEN FEED (30% smaller) */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${currentScreen === 'first' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-center transform scale-75">
          <div className="mb-6 animate-pulse">
            <Zap className="mx-auto h-12 w-12 text-black dark:text-white" />
          </div>
          <h1 className="text-4xl font-bold text-black dark:text-white mb-3" style={{ fontFamily: "'Bitcount Grid Double', monospace" }}>
            DEGEN FEED
          </h1>
          <div className="flex justify-center space-x-1">
            <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>

      {/* Second Screen - Ribbon Animation */}
      <div className={`absolute inset-0 overflow-hidden ${currentScreen === 'second' ? 'block' : 'hidden'}`}>
        {/* Ribbon 1 - "never." - 20% from top */}
        <div 
          className={`${getRibbonClasses(1)} bg-black dark:bg-white`}
          style={getRibbonStyle(1, '20%')}
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-white dark:text-black" style={{ fontFamily: "'Bitcount Grid Double', monospace" }}>
            never.
          </h1>
        </div>

        {/* Ribbon 2 - "miss." - 50% from top (center) */}
        <div 
          className={`${getRibbonClasses(2)} bg-gray-700 dark:bg-gray-300`}
          style={{
            ...getRibbonStyle(2, '50%'),
            transform: `translateY(-50%) ${ribbonStage >= 2 ? 'translateX(0)' : 'translateX(-100%)'} ${ribbonStage >= 4 ? 'translateX(100%)' : ''}`,
          }}
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-white dark:text-black" style={{ fontFamily: "'Bitcount Grid Double', monospace" }}>
            miss.
          </h1>
        </div>

        {/* Ribbon 3 - "a. signal." - 70% from top */}
        <div 
          className={`${getRibbonClasses(3)} bg-gray-500 dark:bg-gray-500`}
          style={getRibbonStyle(3, '70%')}
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-white dark:text-black" style={{ fontFamily: "'Bitcount Grid Double', monospace" }}>
            a. signal.
          </h1>
        </div>
      </div>

      {/* Revealing Screen - Main UI with Mosaic Blur Effect */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${currentScreen === 'revealing' ? 'opacity-100' : 'opacity-0'}`}
        style={{
          filter: `blur(${blurAmount * 0.5}px)`,
          backdropFilter: `blur(${blurAmount}px)`,
          transition: 'filter 75ms ease-out'
        }}
      >
        <div className="min-h-screen bg-white dark:bg-black">
          <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
                    Built with ❤️ and OpenServ AI
                  </span>
                  <img 
                    src="https://cdn.discordapp.com/icons/1176767100350644254/a_53359cdad4839fbd5343771a641e780a.png?size=128&quality=lossless" 
                    alt="OpenServ AI"
                    className="w-5 h-5 rounded-full animate-spin"
                    style={{ animationDuration: '3s' }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full glass">
                    <span className="text-sm text-black dark:text-white">Ready to track signals</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="p-2 sm:p-3 rounded-full glass border hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" />
                </button>
                
                <button className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center space-x-2 text-sm sm:text-base">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Signal</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
            
            <div className="text-center py-8 sm:py-16">
              <div className="glass rounded-2xl p-6 sm:p-12 max-w-md mx-auto">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full glass flex items-center justify-center">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-black dark:text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white mb-2">
                  No signals yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
                  Add your first signal source to start tracking
                </p>
                <button className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base">
                  Get Started
                </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;