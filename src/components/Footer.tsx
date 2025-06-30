import React from 'react';
import { User } from 'lucide-react';
import { TelegramUser } from '../types';

interface FooterProps {
  telegramUser?: TelegramUser;
}

const Footer: React.FC<FooterProps> = ({ telegramUser }) => {
  return (
    <footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* This first div will only render if the user is on Telegram */}
        {telegramUser && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full glass">
            <User className="w-4 h-4 text-black dark:text-white" />
            <span className="text-sm text-black dark:text-white">
              {telegramUser.first_name}
            </span>
          </div>
        )}
        
        {/* This div will always be visible in the footer */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            Built with ❤️ and OpenServ AI
          </span>
          <img 
            src="https://cdn.discordapp.com/icons/1176767100350644254/a_53359cdad4839fbd5343771a641e780a.png?size=128&quality=lossless" 
            alt="OpenServ AI"
            className="w-4 h-4 rounded-full animate-spin"
            style={{ animationDuration: '3s' }}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
