// Type definitions for Chrome Extension API
export interface ChromeStorage {
  sync: {
    get: (keys?: string[] | string | null) => Promise<any>;
    set: (items: Record<string, any>) => Promise<void>;
    clear: () => Promise<void>;
  };
}

export interface ChromeRuntime {
  onMessage: {
    addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
  };
  sendMessage: (message: any, callback?: (response: any) => void) => void;
  openOptionsPage: () => void;
}

export interface ChromeTabs {
  query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<any[]>;
  sendMessage: (tabId: number, message: any, callback?: (response: any) => void) => void;
}

declare global {
  interface Window {
    chrome: {
      storage: ChromeStorage;
      runtime: ChromeRuntime;
      tabs: ChromeTabs;
    };
  }
}