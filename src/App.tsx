// ./src/App.tsx

import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import MainFeed from './components/MainFeed';
import NotInTelegramScreen from './components/NotInTelegramScreen';
import { Topic, TelegramUser } from './types';
import { TelegramService } from './services/telegramService';
import { SupabaseService } from './services/supabaseService';
import { Loader2 } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<'loading' | 'in_telegram' | 'not_in_telegram'>('loading');
  const [showSplash, setShowSplash] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const telegramService = TelegramService.getInstance();
  const supabaseService = SupabaseService.getInstance();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Wait for the Telegram environment to be fully ready.
        // This is the key fix that replaces polling/setTimeout.
        await telegramService.waitForReady();

        // 2. Now that we're sure it's ready, proceed with initialization.
        telegramService.initializeTelegramApp();
        const tg = telegramService.getTelegramWebApp();
        setDarkMode(tg?.colorScheme === 'dark');
        
        const user = await telegramService.authenticateUser();
        if (user) {
          setTelegramUser(user);
          
          await supabaseService.upsertUser(user);
          const initialTopics = await supabaseService.getTopics(user.id);
          setTopics(initialTopics);
          
          setAppState('in_telegram');
        } else {
          // This path should now be much harder to reach inside Telegram
          throw new Error("Failed to authenticate Telegram user even after waiting.");
        }
      } catch (error) {
        // This will catch the rejection from waitForReady() or any subsequent error.
        console.error("Failed to initialize the app:", error);
        setAppState('not_in_telegram');
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleSplashComplete = () => setShowSplash(false);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  
  // Render based on app state
  switch (appState) {
    case 'loading':
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-black dark:text-white" />
        </div>
      );

    case 'not_in_telegram':
      return <NotInTelegramScreen />;

    case 'in_telegram':
      if (showSplash) {
        return (
          <SplashScreen 
            onComplete={handleSplashComplete}
            topics={topics}
            darkMode={darkMode}
            telegramUser={telegramUser || undefined}
          />
        );
      }
      return (
        <div className="App">
          <MainFeed 
            initialTopics={topics} 
            setTopics={setTopics}
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode}
            telegramUser={telegramUser || undefined}
          />
        </div>
      );

    default:
      return <NotInTelegramScreen />;
  }
}

export default App;
