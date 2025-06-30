import React, { useEffect, useState, useCallback } from 'react';
import { Zap, Plus, Sun, Moon, MessageSquare, User, List, LayoutGrid } from 'lucide-react';
import { Topic, TelegramUser } from '../types';
import KineticTypographyAnimation from './KineticTypographyAnimation';

interface SplashScreenProps {
  onComplete: () => void;
  topics: Topic[];
  darkMode: boolean;
  telegramUser?: TelegramUser;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, topics, darkMode, telegramUser }) => {
  const [screenState, setScreenState] = useState<'initialLogo' | 'kinetic' | 'revealing'>('initialLogo');
  const [isFading, setIsFading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // State for mobile credits fade effect
  const [mobileCreditsOpacity, setMobileCreditsOpacity] = useState(0);

  // Effect for window resize to update width state
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect for initial logo fade out and screen state transition
  useEffect(() => {
    const fadeOutTimer = setTimeout(() => setIsFading(true), 1500);
    const screenSwitchTimer = setTimeout(() => setScreenState('kinetic'), 2000);
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(screenSwitchTimer);
    };
  }, []);

  // Callback for KineticTypographyAnimation completion
  const handleAnimationComplete = useCallback(() => {
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      setScreenState('revealing'); // Set revealing state only for mobile
      // Mobile: Fade-in, hold, and fade-out sequence for credits text
      const FADE_DURATION = 500;
      const HOLD_DURATION = 2000;
      
      // 1. Start fade-in almost immediately
      setTimeout(() => {
        setMobileCreditsOpacity(1);
      }, 100);

      // 2. Schedule the fade-out after the hold period
      setTimeout(() => {
        setMobileCreditsOpacity(0);
      }, 100 + FADE_DURATION + HOLD_DURATION);
      
      // 3. Call onComplete after the fade-out is finished
      setTimeout(() => {
        onComplete();
      }, 100 + FADE_DURATION + HOLD_DURATION + FADE_DURATION);
      
      return;
    }

    // If not mobile (desktop or wider screens), immediately call onComplete
    // No 'revealing' state or extra animation for desktop.
    onComplete();
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 bg-white dark:bg-black overflow-hidden`}>
      {/* Screen 1: Initial Logo with Fade-Out Logic */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isFading || screenState !== 'initialLogo' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-center transform scale-75">
          <div className="mb-6 animate-pulse"><Zap className="mx-auto h-12 w-12 text-black dark:text-white" /></div>
          <h1 className="text-4xl font-bold text-black dark:text-white mb-3" style={{ fontFamily: "'Bitcount Grid Double', monospace" }}>DEGEN FEED</h1>
          <div className="flex justify-center space-x-1"><div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div><div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div></div>
        </div>
      </div>
      
      {/* Screen 2: Kinetic Typography Animation with Fade-In Logic */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${screenState === 'kinetic' ? 'opacity-100' : 'opacity-0'}`}>
        {screenState === 'kinetic' && <KineticTypographyAnimation onComplete={handleAnimationComplete} />}
      </div>
      
      {/* Screen 3: Mobile-only "Revealing" State for Credits */}
      {screenState === 'revealing' && windowWidth < 640 && (
        <div 
          className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-opacity duration-500"
          style={{ opacity: mobileCreditsOpacity }}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>Built with ❤️ and OpenServ AI</span>
              <img src="https://cdn.discordapp.com/icons/1176767100350644254/a_53359cdad4839fbd5343771a641e780a.png?size=128&quality=lossless" alt="OpenServ AI" className="w-5 h-5 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
