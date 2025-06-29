import React, { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
import { TelegramUser } from '../types';
import { TelegramService } from '../services/telegramService';

interface TelegramAuthProps {
  onAuthComplete: (user: TelegramUser | null) => void;
}

const TelegramAuth: React.FC<TelegramAuthProps> = ({ onAuthComplete }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authStatus, setAuthStatus] = useState('Connecting to Telegram...');

  const telegramService = TelegramService.getInstance();

  useEffect(() => {
    authenticateUser();
  }, []);

  const authenticateUser = async () => {
    try {
      setAuthStatus('Initializing Telegram Mini App...');
      
      // Initialize Telegram WebApp
      telegramService.initializeTelegramApp();
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAuthStatus('Authenticating user...');
      
      // Try to authenticate
      const user = await telegramService.authenticateUser();
      
      if (user) {
        setAuthStatus(`Welcome, ${user.first_name}!`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        setAuthStatus('Authentication failed');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      onAuthComplete(user);
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthStatus('Authentication failed');
      await new Promise(resolve => setTimeout(resolve, 1500));
      onAuthComplete(null);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center p-8">
        <div className="mb-8">
          {isAuthenticating ? (
            <Loader2 className="mx-auto h-16 w-16 text-black dark:text-white animate-spin" />
          ) : (
            <User className="mx-auto h-16 w-16 text-black dark:text-white" />
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-black dark:text-white mb-4" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
          Degen Feed
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          {authStatus}
        </p>
        
        {isAuthenticating && (
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramAuth;