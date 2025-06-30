// ./src/components/NotInTelegramScreen.tsx

import React from 'react';
import { Send } from 'lucide-react';

// The direct link to the Mini App provided by the user.
const MINI_APP_URL = 'https://t.me/ur_degen_bot/feed';
const TELEGRAM_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/768px-Telegram_logo.svg.png?20220101141644';

const NotInTelegramScreen: React.FC = () => {
  const openInTelegram = () => {
    window.location.href = MINI_APP_URL;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-lg space-y-8">
        
        {/* Large, animated Telegram logo from URL */}
        <div className="animate-pulse" style={{ animationDuration: '3s' }}>
          <img 
            src={TELEGRAM_LOGO_URL} 
            alt="Telegram Logo" 
            className="mx-auto h-28 w-28"
          />
        </div>

        {/* Text content with improved typography and spacing */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            Access Denied
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg sm:text-xl leading-relaxed">
            This is a Telegram Mini App and must be opened within the Telegram messenger.
          </p>
        </div>

        {/* Enhanced button */}
        <button
          onClick={openInTelegram}
          className="w-full max-w-xs px-6 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg dark:shadow-white/10 font-semibold flex items-center justify-center space-x-3 text-lg"
        >
          <Send className="w-5 h-5" />
          <span>Open in Telegram</span>
        </button>
      </div>
    </div>
  );
};

export default NotInTelegramScreen;	
