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

// Extended to include the successful join response from our API
export interface TelegramResponse {
  messages?: TelegramMessage[];
  message?: string;
  channel_name?: string;
  valid_and_joinable?: boolean;
  status?: 'success' | 'error';
  details?: {
    id: number;
    title: string;
    type: string;
  };
}

// MODIFICATION: Updated Topic interface with new fields
export interface Topic {
  id: string;
  type: 'twitter' | 'telegram' | 'both';
  username?: string; // Twitter username
  channelName?: string; // Telegram channel public name or private title
  telegramChannelId?: number; // NEW: The numeric ID for private/public channels
  displayName: string;
  twitterSummary?: string;
  telegramSummary?: string;
  tweets?: Tweet[];
  telegramMessages?: TelegramMessage[];
  lastUpdated: number;
  profilePicture?: string;
  summaryLength?: 'concise' | 'detailed' | 'comprehensive';
  customSummaryLength?: number; // NEW: For custom word count
  trackedSenders?: string[]; // NEW: For tracking specific people/senders (Usernames or IDs)
}

// NEW: Interface for defining a rule within a Signal Profile
export interface SignalRule {
  type: 'ticker' | 'ca' | 'keyword' | 'custom'; // Type of rule
  value: string; // The ticker, CA, keyword, or natural language rule
  mentionThreshold?: number; // e.g., "alert if mentioned > 5 times"
  groupThreshold?: number; // e.g., "in at least 2 groups"
}

// NEW: Interface for the Signal Profile feature
export interface SignalProfile {
  id: string;
  userId: number;
  profileName: string;
  rules: SignalRule[];
  topics: Topic[]; // We'll nest the full topics here for easy frontend use
  createdAt: string;
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
