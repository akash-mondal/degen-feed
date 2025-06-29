import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import TelegramAuth from './components/TelegramAuth';
import MainFeed from './components/MainFeed';
import { TelegramUser } from './types';
import { TelegramService } from './services/telegramService';
import { UserDataService } from './services/userDataService';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showTelegramAuth, setShowTelegramAuth] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const telegramService = TelegramService.getInstance();
  const userDataService = UserDataService.getInstance();

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Check if running in Telegram Mini App
    if (telegramService.isTelegramMiniApp()) {
      // Check if user is already authenticated
      const storedUser = telegramService.getStoredTelegramUser();
      if (storedUser) {
        setTelegramUser(storedUser);
        setShowTelegramAuth(false);
      } else {
        setShowTelegramAuth(true);
      }
    } else {
      // Regular web browser - migrate old cache if needed
      const userData = userDataService.loadUserData();
      if (userData.topics.length === 0) {
        // Try to migrate from old cache format
        userDataService.migrateFromOldCache();
      }
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleTelegramAuthComplete = (user: TelegramUser | null) => {
    setTelegramUser(user);
    setShowTelegramAuth(false);
    
    if (user) {
      // Migrate existing data if any
      const userData = userDataService.loadUserData();
      if (userData.topics.length === 0) {
        userDataService.migrateFromOldCache();
      }
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show Telegram authentication if needed
  if (showTelegramAuth) {
    return <TelegramAuth onAuthComplete={handleTelegramAuthComplete} />;
  }

  // Show main app
  return (
    <div className="App">
      <MainFeed 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode}
        telegramUser={telegramUser || undefined}
      />
    </div>
  );
}

export default App;