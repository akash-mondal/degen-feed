// ./src/services/telegramService.ts

import { TelegramUser } from '../types';

export class TelegramService {
  private static instance: TelegramService;

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  isTelegramMiniApp(): boolean {
    return !!window.Telegram?.WebApp?.initData;
  }

  getTelegramWebApp() {
    return window.Telegram?.WebApp;
  }

  initializeTelegramApp(): void {
    const tg = this.getTelegramWebApp();
    if (tg) {
      tg.expand();
      if (tg.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  async authenticateUser(): Promise<TelegramUser | null> {
    const tg = this.getTelegramWebApp();
    if (!tg || !tg.initData) {
      console.warn("authenticateUser called but tg.initData is not available.");
      return null;
    }

    try {
      const initData = this.parseInitData(tg.initData);
      if (initData.user) {
        localStorage.setItem('telegram_user', JSON.stringify(initData.user));
        return initData.user;
      }
      return null;
    } catch (error) {
      console.error('Error authenticating Telegram user:', error);
      return null;
    }
  }

  getStoredTelegramUser(): TelegramUser | null {
    try {
      const stored = localStorage.getItem('telegram_user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error retrieving stored Telegram user:', error);
      return null;
    }
  }

  clearTelegramUser(): void {
    localStorage.removeItem('telegram_user');
  }

  private parseInitData(initDataRaw: string): any {
    const urlParams = new URLSearchParams(initDataRaw);
    const user = urlParams.get('user');
    const authDate = urlParams.get('auth_date');
    const hash = urlParams.get('hash');

    if (!user || !authDate || !hash) {
      throw new Error('Invalid init data');
    }

    try {
      const userData = JSON.parse(decodeURIComponent(user));
      return {
        user: userData,
        auth_date: parseInt(authDate),
        hash: hash
      };
    } catch (error) {
      throw new Error('Failed to parse user data');
    }
  }

  showBackButton(callback: () => void): void {
    const tg = this.getTelegramWebApp();
    if (tg?.BackButton) {
      tg.BackButton.onClick(callback);
      tg.BackButton.show();
    }
  }

  hideBackButton(): void {
    const tg = this.getTelegramWebApp();
    if (tg?.BackButton) {
      tg.BackButton.hide();
    }
  }

  hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    const tg = this.getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(type);
    }
  }

  showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      const tg = this.getTelegramWebApp();
      if (tg?.showAlert) {
        tg.showAlert(message, () => resolve());
      } else {
        alert(message);
        resolve();
      }
    });
  }

  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const tg = this.getTelegramWebApp();
      if (tg?.showConfirm) {
        tg.showConfirm(message, (confirmed) => resolve(confirmed));
      } else {
        resolve(confirm(message));
      }
    });
  }
}
