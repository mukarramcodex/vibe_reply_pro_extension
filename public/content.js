// Enhanced content script for YouTube Auto Reply
class YouTubeAutoReply {
  constructor() {
    this.isProcessing = false;
    this.processedComments = new Set();
    this.apiEndpoint = "https://your-saas-domain.com/api/reply";
    this.maxRetries = 3;
    this.settings = {};
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindMessageListener();
    this.observePageChanges();
    this.injectStyles();
    console.log("YouTube Auto Reply Pro: Content script initialized");
  }

  // Load settings from storage
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (data) => {
        this.settings = {
          apiEndpoint: data.apiEndpoint || this.apiEndpoint,
          apiKey: data.apiKey || '',
          requestTimeout: (data.requestTimeout || 15) * 1000,
          autoSubmit: data.autoSubmit !== false,
          skipShortComments: data.skipShortComments !== false,
          showNotifications: data.showNotifications !== false,
          replyDelay: (data.replyDelay || 3) * 1000,
          maxComments: data.maxComments || 10,
          skipSpam: data.skipSpam !== false,
          skipOwnComments: data.skipOwnComments !== false,
          blacklistedKeywords: data.blacklistedKeywords || '',
          retryAttempts: data.retryAttempts || 3,
          customPrompt: data.customPrompt || "Reply politely and engagingly to this YouTube comment."
        };
        resolve();
      });
    });
  }

  // Inject enhanced styles
  injectStyles() {
    if (document.getElementById('youtube-auto-reply-styles')) return;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'youtube-auto-reply-styles';
    styleSheet.textContent = `
      .youtube-auto-reply-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.95);
        color: #FAFAFA;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        max-width: 320px;
        min-width: 280px;
        word-wrap: break-word;
        animation: slideInRight 0.3s ease-out;
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }

      .youtube-auto-reply-overlay.success {
        background: rgba(34, 197, 94, 0.95);
        border-color: rgba(34, 197, 94, 0.3);
        color: white;
      }

      .youtube-auto-reply-overlay.error {
        background: rgba(239, 68, 68, 0.95);
        border-color: rgba(239, 68, 68, 0.3);
        color: white;
      }

      .youtube-auto-reply-overlay.warning {
        background: rgba(245, 158, 11, 0.95);
        border-color: rgba(245, 158, 11, 0.3);
        color: white;
      }

      .youtube-auto-reply-overlay.processing {
        background: rgba(204, 0, 31, 0.95);
        border-color: rgba(204, 0, 31, 0.3);
        color: white;
      }

      .youtube-auto-reply-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
        margin-right: 10px;
        vertical-align: middle;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .youtube-auto-reply-progress {
        position: fixed;
        top: 90px;
        right: 20px;
        z-index: 9998;
        background: rgba(0, 0, 0, 0.95);
        color: #FAFAFA;
        padding: 20px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 280px;
        animation: slideInRight 0.3s ease-out;
      }

      .youtube-auto-reply-progress .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-weight: 600;
      }

      .youtube-auto-reply-progress .progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        margin: 12px 0;
        overflow: hidden;
        position: relative;
      }

      .youtube-auto-reply-progress .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #CC001F, #FF6B8A);
        border-radius: 3px;
        transition: width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .youtube-auto-reply-progress .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .youtube-auto-reply-highlight {
        outline: 2px solid #CC001F !important;
        outline-offset: 2px;
        border-radius: 6px;
        animation: pulseGlow 2s infinite;
        box-shadow: 0 0 0 4px rgba(204, 0, 31, 0.2);
      }

      @keyframes pulseGlow {
        0%, 100% { 
          outline-color: #CC001F;
          box-shadow: 0 0 0 4px rgba(204, 0, 31, 0.2);
        }
        50% { 
          outline-color: rgba(204, 0, 31, 0.7);
          box-shadow: 0 0 0 8px rgba(204, 0, 31, 0.1);
        }
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .youtube-auto-reply-overlay,
        .youtube-auto-reply-progress {
          right: 12px;
          left: 12px;
          max-width: none;
          min-width: auto;
        }
        
        .youtube-auto-reply-overlay {
          top: 12px;
          font-size: 13px;
          padding: 14px 16px;
        }
        
        .youtube-auto-reply-progress {
          top: 80px;
          padding: 16px;
          font-size: 12px;
        }
      }

      @media (max-width: 480px) {
        .youtube-auto-reply-overlay,
        .youtube-auto-reply-progress {
          right: 8px;
          left: 8px;
        }
        
        .youtube-auto-reply-overlay {
          top: 8px;
          font-size: 12px;
          padding: 12px 14px;
        }
        
        .youtube-auto-reply-progress {
          top: 70px;
          padding: 14px;
        }
      }

      /* Dark mode adjustments */
      @media (prefers-color-scheme: dark) {
        .youtube-auto-reply-overlay {
          background: rgba(17, 17, 17, 0.95);
          border-color: rgba(255, 255, 255, 0.15);
        }
        
        .youtube-auto-reply-progress {
          background: rgba(17, 17, 17, 0.95);
          border-color: rgba(255, 255, 255, 0.15);
        }
      }

      /* Ensure overlays don't interfere with YouTube controls */
      .youtube-auto-reply-overlay,
      .youtube-auto-reply-progress {
        pointer-events: none;
        user-select: none;
      }

      .youtube-auto-reply-overlay.interactive,
      .youtube-auto-reply-progress.interactive {
        pointer-events: auto;
      }
    `;
    
    document.head.appendChild(styleSheet);
  }

  // Enhanced notification system
  showNotification(message, type = 'info', duration = 4000) {
    if (!this.settings.showNotifications) return;

    // Remove existing notifications
    const existing = document.querySelectorAll('.youtube-auto-reply-overlay');
    existing.forEach(el => {
      el.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => el.remove(), 300);
    });

    const notification = document.createElement('div');
    notification.className = `youtube-auto-reply-overlay ${type}`;
    
    const icon = type === 'processing' ? 
      '<span class="youtube-auto-reply-spinner"></span>' :
      this.getStatusIcon(type);
    
    notification.innerHTML = `${icon}${message}`;
    document.body.appendChild(notification);

    // Auto-remove
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);

    return notification;
  }

  // Show progress indicator
  showProgress(current, total) {
    let progressEl = document.querySelector('.youtube-auto-reply-progress');
    
    if (!progressEl) {
      progressEl = document.createElement('div');
      progressEl.className = 'youtube-auto-reply-progress';
      document.body.appendChild(progressEl);
    }

    const percentage = Math.round((current / total) * 100);
    
    progressEl.innerHTML = `
      <div class="progress-header">
        <span>Processing Comments</span>
        <span>${current}/${total}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div style="font-size: 11px; opacity: 0.8; margin-top: 8px;">
        ${percentage}% complete
      </div>
    `;
  }

  // Hide progress indicator
  hideProgress() {
    const progressEl = document.querySelector('.youtube-auto-reply-progress');
    if (progressEl) {
      progressEl.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => progressEl.remove(), 300);
    }
  }

  getStatusIcon(type) {
    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; margin-right: 8px; vertical-align: middle;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; margin-right: 8px; vertical-align: middle;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; margin-right: 8px; vertical-align: middle;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; margin-right: 8px; vertical-align: middle;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    };
    return icons[type] || icons.info;
  }

  // Listen for messages from popup
  bindMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });
  }

  // Handle messages from popup
  async handleMessage(message, sendResponse) {
    try {
      await this.loadSettings(); // Refresh settings
      
      switch (message.action) {
        case 'replyOne':
          const singleResult = await this.replyToSingleComment();
          sendResponse(singleResult);
          break;
          
        case 'replyAll':
          const allResult = await this.replyToAllComments();
          sendResponse(allResult);
          break;
          
        case 'getStats':
          const stats = await this.getPageStats();
          sendResponse(stats);
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Enhanced API call with retry logic and better error handling
  async fetchAIReply(comment, retryCount = 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.settings.requestTimeout);
      
      const headers = { 
        "Content-Type": "application/json",
        "User-Agent": "YouTube-Auto-Reply-Extension/2.0"
      };
      
      if (this.settings.apiKey) {
        headers["Authorization"] = `Bearer ${this.settings.apiKey}`;
      }
      
      const response = await fetch(this.settings.apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          comment: comment.trim(), 
          prompt: this.settings.customPrompt,
          source: "youtube",
          timestamp: new Date().toISOString(),
          settings: {
            maxLength: 500,
            tone: "friendly",
            language: "auto-detect"
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.reply) {
        throw new Error("Invalid API response: missing reply field");
      }

      return {
        success: true,
        reply: data.reply.trim(),
        confidence: data.confidence || 0.8,
        processingTime: data.processingTime || 0
      };

    } catch (error) {
      console.error(`API call failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.settings.retryAttempts && error.name !== 'AbortError') {
        await this.delay(1000 * Math.pow(2, retryCount));
        return this.fetchAIReply(comment, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  // Get comment elements with improved selectors
  getCommentElements() {
    const selectors = [
      'ytd-comment-thread-renderer #content-text',
      'ytd-comment-renderer #content-text',
      '#content-text',
      '.ytd-comment-renderer .comment-text',
      '[id="content-text"]'
    ];

    let comments = [];
    
    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      if (elements.length > 0) {
        comments = elements;
        break;
      }
    }

    // Filter based on settings
    return comments.filter(comment => {
      const commentId = this.getCommentId(comment);
      const commentText = comment.textContent?.trim() || '';
      
      // Skip already processed
      if (this.processedComments.has(commentId)) return false;
      
      // Skip short comments if enabled
      if (this.settings.skipShortComments && commentText.length < 10) return false;
      
      // Skip blacklisted keywords
      if (this.settings.blacklistedKeywords) {
        const keywords = this.settings.blacklistedKeywords.split(',').map(k => k.trim().toLowerCase());
        const textLower = commentText.toLowerCase();
        if (keywords.some(keyword => keyword && textLower.includes(keyword))) return false;
      }
      
      // Skip own comments (basic check)
      if (this.settings.skipOwnComments) {
        const authorElement = comment.closest('ytd-comment-thread-renderer')?.querySelector('#author-text');
        // This would need to be enhanced with actual user detection
      }
      
      return true;
    }).slice(0, this.settings.maxComments);
  }

  // Generate unique comment ID
  getCommentId(commentElement) {
    try {
      const commentText = commentElement.textContent?.trim() || '';
      const container = commentElement.closest('ytd-comment-thread-renderer') || commentElement.closest('ytd-comment-renderer');
      const authorElement = container?.querySelector('#author-text, .author-text');
      const author = authorElement?.textContent?.trim() || 'unknown';
      const timestamp = container?.querySelector('#published-time-text, .published-time-text')?.textContent?.trim() || '';
      
      return btoa(encodeURIComponent(`${author}:${commentText}:${timestamp}`)).substring(0, 32);
    } catch (error) {
      return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  // Enhanced comment reply with better UX
  async replyToComment(commentElement, index = 0, total = 1) {
    const commentId = this.getCommentId(commentElement);
    
    if (this.processedComments.has(commentId)) {
      return { success: false, error: 'Comment already processed', skipped: true };
    }

    try {
      // Highlight current comment
      commentElement.classList.add('youtube-auto-reply-highlight');
      
      const comment = commentElement.textContent?.trim();
      
      if (!comment || comment.length < 3) {
        return { success: false, error: 'Comment too short or empty', skipped: true };
      }

      // Show processing notification for single comments or update progress for multiple
      if (total === 1) {
        this.showNotification(`Processing comment...`, 'processing', 8000);
      } else {
        this.showProgress(index + 1, total);
      }

      // Get AI reply with timing
      const startTime = Date.now();
      const aiResponse = await this.fetchAIReply(comment);
      const processingTime = Date.now() - startTime;
      
      if (!aiResponse.success) {
        commentElement.classList.remove('youtube-auto-reply-highlight');
        return { success: false, error: aiResponse.error };
      }

      // Find comment container
      const commentContainer = commentElement.closest('ytd-comment-thread-renderer') || 
                             commentElement.closest('ytd-comment-renderer');
      
      if (!commentContainer) {
        commentElement.classList.remove('youtube-auto-reply-highlight');
        return { success: false, error: 'Could not find comment container' };
      }

      // Find and click reply button
      const replyButton = this.findReplyButton(commentContainer);
      
      if (!replyButton) {
        commentElement.classList.remove('youtube-auto-reply-highlight');
        return { success: false, error: 'Reply button not found' };
      }

      replyButton.click();
      
      // Wait for reply box with timeout
      await this.delay(1500);
      
      // Populate reply
      const success = await this.populateReplyBox(aiResponse.reply);
      
      // Clean up highlight
      commentElement.classList.remove('youtube-auto-reply-highlight');
      
      if (success) {
        this.processedComments.add(commentId);
        
        // Update statistics
        chrome.runtime.sendMessage({
          action: 'updateStats',
          data: {
            totalReplies: 1,
            successfulReplies: 1,
            responseTime: processingTime
          }
        });

        return { 
          success: true, 
          commentId, 
          reply: aiResponse.reply,
          processingTime 
        };
      } else {
        return { success: false, error: 'Failed to populate reply box' };
      }

    } catch (error) {
      commentElement.classList.remove('youtube-auto-reply-highlight');
      console.error('Reply error:', error);
      return { success: false, error: error.message };
    }
  }

  // Find reply button with enhanced selectors
  findReplyButton(commentContainer) {
    const selectors = [
      '#reply-button-end button',
      'ytd-button-renderer[is-paper-button] button',
      '.ytd-comment-action-buttons-renderer button[aria-label*="Reply"]',
      '.ytd-comment-action-buttons-renderer button[aria-label*="reply"]',
      'button[aria-label*="Reply"]',
      '.reply-button',
      '[role="button"][aria-label*="Reply"]',
      'tp-yt-paper-button[aria-label*="Reply"]'
    ];

    for (const selector of selectors) {
      const button = commentContainer.querySelector(selector);
      if (button && !button.disabled && this.isElementVisible(button)) {
        return button;
      }
    }

    // Fallback: search by text content
    const buttons = commentContainer.querySelectorAll('button, tp-yt-paper-button');
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      
      if ((text.includes('reply') || ariaLabel.includes('reply')) && 
          !button.disabled && this.isElementVisible(button)) {
        return button;
      }
    }

    return null;
  }

  // Enhanced reply box population
  async populateReplyBox(replyText) {
    const maxAttempts = 8;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.delay(300 * (attempt + 1));
      
      const textarea = this.findReplyTextarea();
      
      if (textarea && this.isElementVisible(textarea)) {
        try {
          // Focus first
          textarea.focus();
          await this.delay(100);
          
          // Clear existing content
          textarea.textContent = '';
          textarea.innerText = '';
          if (textarea.value !== undefined) textarea.value = '';
          
          // Set new content
          textarea.textContent = replyText;
          textarea.innerText = replyText;
          if (textarea.value !== undefined) textarea.value = replyText;

          // Trigger comprehensive events
          const events = [
            new Event('focus', { bubbles: true }),
            new Event('input', { bubbles: true }),
            new Event('change', { bubbles: true }),
            new Event('keyup', { bubbles: true }),
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
            new Event('blur', { bubbles: true })
          ];
          
          events.forEach(event => textarea.dispatchEvent(event));

          // Wait and attempt submission if auto-submit is enabled
          if (this.settings.autoSubmit) {
            await this.delay(800);
            const submitSuccess = await this.submitReply();
            return submitSuccess;
          }
          
          return true;
          
        } catch (error) {
          console.warn(`Reply population attempt ${attempt + 1} failed:`, error);
        }
      }
    }
    
    return false;
  }

  // Find reply textarea with comprehensive selectors
  findReplyTextarea() {
    const selectors = [
      'ytd-commentbox div[contenteditable="true"]',
      '#contenteditable-root[contenteditable="true"]',
      '.ytd-commentbox #contenteditable-root',
      'div[contenteditable="true"][aria-label*="comment"]',
      'div[contenteditable="true"][aria-label*="reply"]',
      'textarea[aria-label*="reply"]',
      'textarea[aria-label*="comment"]',
      '#comment-simplebox-text textarea',
      '.comment-simplebox-text textarea'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) {
        return element;
      }
    }

    // Fallback: find any contenteditable or textarea in comment area
    const commentboxes = document.querySelectorAll('ytd-commentbox, .commentbox');
    for (const box of commentboxes) {
      const editables = box.querySelectorAll('div[contenteditable="true"], textarea');
      for (const editable of editables) {
        if (this.isElementVisible(editable)) {
          return editable;
        }
      }
    }

    return null;
  }

  // Enhanced reply submission
  async submitReply() {
    const submitSelectors = [
      'ytd-commentbox tp-yt-paper-button[aria-label*="Comment"]',
      'ytd-commentbox button[aria-label*="Comment"]',
      '#submit-button:not([disabled])',
      '.ytd-commentbox #submit-button:not([disabled])',
      'tp-yt-paper-button[aria-label*="Reply"]:not([disabled])',
      'button[aria-label*="Reply"]:not([disabled])',
      '.comment-submit-button:not([disabled])'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      
      if (button && !button.disabled && this.isElementVisible(button)) {
        try {
          // Scroll button into view
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await this.delay(200);
          
          button.click();
          await this.delay(1500);
          
          // Verify submission (reply box should disappear)
          const replyBox = this.findReplyTextarea();
          if (!replyBox || !this.isElementVisible(replyBox)) {
            return true;
          }
          
        } catch (error) {
          console.warn('Submit button click failed:', error);
        }
      }
    }

    // Keyboard shortcut fallback
    try {
      const textarea = this.findReplyTextarea();
      if (textarea) {
        textarea.focus();
        const ctrlEnterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          ctrlKey: true,
          bubbles: true,
          cancelable: true
        });
        textarea.dispatchEvent(ctrlEnterEvent);
        await this.delay(1500);
        return true;
      }
    } catch (error) {
      console.warn('Keyboard shortcut failed:', error);
    }

    return false;
  }

  // Check element visibility
  isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           style.opacity !== '0' &&
           element.offsetParent !== null;
  }

  // Reply to single comment
  async replyToSingleComment() {
    if (this.isProcessing) {
      return { success: false, error: 'Already processing comments' };
    }

    try {
      this.isProcessing = true;
      
      if (!this.isYouTubeVideoPage()) {
        return { success: false, error: 'Please navigate to a YouTube video page' };
      }
      
      const comments = this.getCommentElements();
      
      if (comments.length === 0) {
        return { success: false, error: 'No comments found on this page' };
      }

      const result = await this.replyToComment(comments[0], 0, 1);
      
      if (result.success) {
        this.showNotification('✓ Successfully replied to comment!', 'success');
      } else if (!result.skipped) {
        this.showNotification(`✗ Failed: ${result.error}`, 'error');
      }
      
      return {
        success: result.success,
        error: result.error,
        repliedCount: result.success ? 1 : 0,
        totalComments: comments.length,
        skipped: result.skipped || false
      };

    } finally {
      this.isProcessing = false;
    }
  }

  // Reply to all comments with enhanced progress tracking
  async replyToAllComments() {
    if (this.isProcessing) {
      return { success: false, error: 'Already processing comments' };
    }

    try {
      this.isProcessing = true;
      
      if (!this.isYouTubeVideoPage()) {
        return { success: false, error: 'Please navigate to a YouTube video page' };
      }
      
      const comments = this.getCommentElements();
      
      if (comments.length === 0) {
        return { success: false, error: 'No comments found on this page' };
      }

      let successCount = 0;
      let skippedCount = 0;
      const errors = [];
      const totalComments = Math.min(comments.length, this.settings.maxComments);

      this.showNotification(`Starting to process ${totalComments} comments...`, 'processing');

      // Process comments with enhanced progress tracking
      for (let i = 0; i < totalComments; i++) {
        try {
          const result = await this.replyToComment(comments[i], i, totalComments);
          
          if (result.success) {
            successCount++;
          } else if (result.skipped) {
            skippedCount++;
          } else {
            errors.push(`Comment ${i + 1}: ${result.error}`);
          }

          // Dynamic delay based on success rate
          if (i < totalComments - 1) {
            const baseDelay = this.settings.replyDelay;
            const randomDelay = Math.random() * 1000; // 0-1s random
            const adaptiveDelay = errors.length > successCount ? baseDelay * 1.5 : baseDelay;
            await this.delay(adaptiveDelay + randomDelay);
          }

        } catch (error) {
          errors.push(`Comment ${i + 1}: ${error.message}`);
        }
      }

      // Hide progress and show final results
      this.hideProgress();
      
      const totalProcessed = successCount + skippedCount + errors.length;
      const successRate = totalProcessed > 0 ? Math.round((successCount / totalProcessed) * 100) : 0;
      
      if (successCount > 0) {
        this.showNotification(
          `✓ Completed! ${successCount} replies sent (${successRate}% success rate)`, 
          'success', 
          6000
        );
      } else {
        this.showNotification(
          `⚠ No replies sent. ${skippedCount} skipped, ${errors.length} errors`, 
          'warning', 
          6000
        );
      }
      
      return {
        success: successCount > 0,
        repliedCount: successCount,
        totalComments: comments.length,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
        successRate
      };

    } finally {
      this.isProcessing = false;
      this.hideProgress();
    }
  }

  // Get comprehensive page statistics
  async getPageStats() {
    const comments = this.getCommentElements();
    const allComments = document.querySelectorAll('#content-text, .comment-text');
    const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer, .title')?.textContent?.trim();
    const channelName = document.querySelector('#channel-name a, .channel-name')?.textContent?.trim();
    
    return {
      success: true,
      totalComments: allComments.length,
      availableComments: comments.length,
      processedComments: this.processedComments.size,
      isVideoPage: this.isYouTubeVideoPage(),
      videoTitle,
      channelName,
      settings: this.settings
    };
  }

  // Enhanced YouTube video page detection
  isYouTubeVideoPage() {
    const url = window.location;
    return url.hostname === 'www.youtube.com' && 
           url.pathname === '/watch' &&
           url.search.includes('v=') &&
           document.querySelector('ytd-watch-flexy, #watch-flexy');
  }

  // Enhanced page change observation
  observePageChanges() {
    let currentUrl = window.location.href;
    
    // URL change detection
    const observer = new MutationObserver((mutations) => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.handlePageChange();
      }
      
      // Also watch for comment section loading
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          const hasComments = Array.from(mutation.addedNodes).some(node => 
            node.nodeType === 1 && (
              node.querySelector?.('#content-text') ||
              node.id === 'content-text' ||
              node.classList?.contains('ytd-comment-renderer')
            )
          );
          
          if (hasComments) {
            console.log('YouTube Auto Reply: New comments detected');
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Browser navigation events
    window.addEventListener('popstate', () => this.handlePageChange());
    window.addEventListener('pushstate', () => this.handlePageChange());
    window.addEventListener('replacestate', () => this.handlePageChange());
  }

  // Handle page changes
  handlePageChange() {
    this.processedComments.clear();
    
    // Hide any existing notifications
    const notifications = document.querySelectorAll('.youtube-auto-reply-overlay, .youtube-auto-reply-progress');
    notifications.forEach(el => el.remove());
    
    console.log('YouTube Auto Reply: Page changed, reset state');
  }

  // Utility functions
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  sanitizeText(text) {
    return text?.replace(/[<>]/g, '').trim().substring(0, 2000) || '';
  }
}

// Initialize the enhanced YouTube Auto Reply system
const youtubeAutoReply = new YouTubeAutoReply();

// Handle extension lifecycle
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    port.onDisconnect.addListener(() => {
      console.log('YouTube Auto Reply: Popup disconnected');
    });
  }
});

// Expose for debugging in development
if (process.env.NODE_ENV === 'development') {
  window.youtubeAutoReply = youtubeAutoReply;
}