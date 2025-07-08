export interface Tweet {
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  bookmarkCount: number;
  isReply: boolean;
  author: {
    userName: string;
    name: string;
    profilePicture: string;
    isBlueVerified: boolean;
  };
}

export interface TwitterResponse {
  tweets: Tweet[];
  has_next_page: boolean;
  next_cursor: string;
  status: string;
  message: string;
}

export interface TelegramMessage {
  message_id: number;
  text: string;
  date: string;
  views: number | null;
  sender: {
    id: number;
    type: 'user' | 'channel';
    name: string;
    username: string | null;
  };
}

export interface TelegramResponse {
  messages?: TelegramMessage[];
  message?: string;
  channel_name?: string;
  valid_and_joinable?: boolean;
}

export interface Topic {
  id: string;
  type: 'twitter' | 'telegram' | 'both';
  username?: string; // Twitter username
  channelName?: string; // Telegram channel name
  displayName: string;
  twitterSummary?: string;
  telegramSummary?: string;
  tweets?: Tweet[];
  telegramMessages?: TelegramMessage[];
  lastUpdated: number;
  profilePicture?: string;
  summaryLength?: 'concise' | 'detailed' | 'comprehensive';
}

export interface CacheData {
  topics: Topic[];
  lastUpdated: number;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface UserData {
  telegramUser?: TelegramUser;
  topics: Topic[];
  lastUpdated: number;
}

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        initDataRaw: string;
        initData: string;
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: any;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isProgressVisible: boolean;
          isActive: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        showPopup: (params: any, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup: (params: any, callback?: (text: string) => void) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: (callback?: (text: string) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        requestContact: (callback?: (granted: boolean, contact?: any) => void) => void;
      };
    };
  }
}