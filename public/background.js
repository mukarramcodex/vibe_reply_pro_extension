// Enhanced service worker for YouTube Auto Reply Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Auto Reply Pro Extension installed.");
  
  // Initialize default settings
  chrome.storage.sync.get(['customPrompt'], (data) => {
    if (!data.customPrompt) {
      chrome.storage.sync.set({
        customPrompt: "Reply politely and engagingly to this YouTube comment while being helpful and constructive.",
        apiEndpoint: 'https://your-saas-domain.com/api/reply',
        autoSubmit: true,
        skipShortComments: true,
        showNotifications: true,
        replyDelay: 3,
        maxComments: 10
      });
    }
  });
});

// Handle extension updates
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    port.onDisconnect.addListener(() => {
      console.log('YouTube Auto Reply: Popup disconnected');
    });
  }
});

// Message handling for cross-component communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStats') {
    // Handle statistics updates
    chrome.storage.sync.get(['extensionStats'], (data) => {
      const stats = data.extensionStats || {
        totalReplies: 0,
        successfulReplies: 0,
        totalResponseTime: 0,
        lastUsed: null
      };
      
      // Update stats
      stats.totalReplies += message.data.totalReplies || 0;
      stats.successfulReplies += message.data.successfulReplies || 0;
      stats.totalResponseTime += message.data.responseTime || 0;
      stats.lastUsed = new Date().toISOString();
      
      chrome.storage.sync.set({ extensionStats: stats });
      sendResponse({ success: true });
    });
    
    return true;
  }
});