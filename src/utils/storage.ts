// Chrome storage utilities with enhanced error handling
export const chromeStorage = {
  async get(keys?: string[] | string | null): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!window.chrome?.storage?.sync) {
        reject(new Error('Chrome storage not available'));
        return;
      }

      const safeKeys = keys ?? null;
      
      window.chrome.storage.sync.get(safeKeys, (result) => {
        if (window.chrome.runtime.lastError) {
          reject(new Error(window.chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  },

  async set(items: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.chrome?.storage?.sync) {
        reject(new Error('Chrome storage not available'));
        return;
      }
      
      window.chrome.storage.sync.set(items, () => {
        if (window.chrome.runtime.lastError) {
          reject(new Error(window.chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.chrome?.storage?.sync) {
        reject(new Error('Chrome storage not available'));
        return;
      }
      
      window.chrome.storage.sync.clear(() => {
        if (window.chrome.runtime.lastError) {
          reject(new Error(window.chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
};

// Tab messaging utilities
export const tabMessaging = {
  async sendMessage(tabId: number, message: any): Promise<any> {
    return new Promise((resolve) => {
      if (!window.chrome?.tabs?.sendMessage) {
        resolve({ success: false, error: 'Chrome tabs API not available' });
        return;
      }
      
      window.chrome.tabs.sendMessage(tabId, message, (response) => {
        if (window.chrome.runtime.lastError) {
          resolve({ success: false, error: window.chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response received' });
        }
      });
    });
  },

  async getActiveTab(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!window.chrome?.tabs?.query) {
        reject(new Error('Chrome tabs API not available'));
        return;
      }
      
      window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (window.chrome.runtime.lastError) {
          reject(new Error(window.chrome.runtime.lastError.message));
        } else if (tabs.length > 0) {
          resolve(tabs[0]);
        } else {
          reject(new Error('No active tab found'));
        }
      });
    });
  }
};

export async function setAuthTokens(tokens: any) {
  await chrome.storage.sync.set({ auth: tokens });
}

export async function getAuthTokens() {
  const data = await chrome.storage.sync.get("auth");
  return data.auth || null;
}

export async function clearAuthTokens() {
  await chrome.storage.sync.remove("auth");
}