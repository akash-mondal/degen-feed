// ./src/App.tsx

import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import MainFeed from './components/MainFeed';
import NotInTelegramScreen from './components/NotInTelegramScreen';
import { Topic, TelegramUser } from './types';
import { TelegramService } from './services/telegramService';
import { SupabaseService } from './services/supabaseService';
import { Loader2 } from 'lucide-react';

// Define the Telegram WebApp type locally for the component for type safety
type TelegramWebApp = Window['Telegram']['WebApp'];

function App() {
  const [appState, setAppState] = useState<'loading' | 'in_telegram' | 'not_in_telegram'>('loading');
  const [showSplash, setShowSplash] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const telegramService = TelegramService.getInstance();
  const supabaseService = SupabaseService.getInstance();

  useEffect(() => {
    // This function will be called ONLY after we confirm the Telegram WebApp object is available.
    const initializeApp = async (tg: TelegramWebApp) => {
      try {
        // 1. Tell the Telegram client that the app is ready to be displayed.
        tg.ready();

        // 2. Now that the app is ready, proceed with the rest of your initialization.
        telegramService.initializeTelegramApp();
        setDarkMode(tg.colorScheme === 'dark');
        
        const user = await telegramService.authenticateUser();
        if (user) {
          setTelegramUser(user);
          await supabaseService.upsertUser(user);
          const initialTopics = await supabaseService.getTopics(user.id);
          setTopics(initialTopics);
          setAppState('in_telegram');
        } else {
          throw new Error("Failed to authenticate Telegram user.");
        }
      } catch (error) {
        console.error("Failed to initialize the app within Telegram:", error);
        setAppState('not_in_telegram');
      }
    };

    // --- NEW ROBUST POLLING LOGIC ---
    // We will try to find the window.Telegram.WebApp object every 100ms for 5 seconds.
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 seconds
    const intervalId = setInterval(() => {
      const tg = window.Telegram?.WebApp;

      // If we find the object, we clear the interval and initialize the app.
      if (tg) {
        clearInterval(intervalId);
        initializeApp(tg);
      } else {
        attempts++;
        // If we've tried for 5 seconds and it's still not there, we assume we're not in Telegram.
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          console.error("Telegram WebApp SDK could not be found after 5 seconds. Running in browser mode.");
          setAppState('not_in_telegram');
        }
      }
    }, 100);

    // This is a cleanup function that runs if the component unmounts.
    return () => clearInterval(intervalId);

  }, []); // The empty dependency array ensures this effect runs only once on mount.

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
  
  // The rest of your component's render logic remains the same
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
