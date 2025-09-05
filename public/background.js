// Enhanced service worker for YouTube Auto Reply Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("VibeReply.pro Extension installed.");
  
  // Initialize default settings
  chrome.storage.sync.get(['customPrompt'], (data) => {
    if (!data.customPrompt) {
      chrome.storage.sync.set({
        customPrompt: "Reply politely and engagingly to this YouTube comment while being helpful and constructive.",
        apiEndpoint: 'https://vibereply.pro/api/reply',
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
      console.log('VibeReply.pro: Popup disconnected');
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

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log("External message received: ", message);

  if (message.type === "AUTH_SESSION") {
    chrome.storage.local.set({ supabaseSession: message.session }, () => {
      console.log("Supabase session saved: ", message.session);
      sendResponse({ success: true });
    });
    return true;
  }

  sendResponse({ success: false, error: "Unknown message type" });
});