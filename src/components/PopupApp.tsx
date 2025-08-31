import React, { useState, useEffect } from 'react';
import {
  Youtube,
  MessageCircle,
  MessagesSquare,
  Settings,
  BarChart3,
  Save,
  Wand2
} from 'lucide-react';
import { Button } from './Button';
import { StatusIndicator } from './StatusIndicator';
import { ThemeToggle } from './ThemeToggle';
import { chromeStorage, clearAuthTokens, tabMessaging } from '../utils/storage';
import { themeManager } from '../utils/theme';
import { supabase } from '../utils/supabaseClient';

interface Stats {
  repliedCount: number;
  commentsFound: number;
}

interface StatusMessage {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  id: string;
}

export const PopupApp: React.FC = () => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [stats, setStats] = useState<Stats>({ repliedCount: 0, commentsFound: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [charCount, setCharCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  // Initialize theme and load data
  useEffect(() => {
    themeManager.initTheme();
    loadSavedData();

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    })();
  }, []);

  // Google Login
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: chrome.identity.getRedirectURL(),
      },
    });
    if (error) console.error("Google login error", error);
  };

  const handleDashboardLogin = () => {
    const extensionId = chrome.runtime.id;
    chrome.tabs.create({
      url: `https://vibereply.pro/connect-extension?extensionId=${extensionId}`,
    });
  };

  // const handleLogin = async () => {
  //   const { error } = await supabase.auth.signInWithOtp({
  //     email: prompt("Enter your email") || "",
  //   });
  //   if (error) {
  //     showStatus("error", "Login failed");
  //     console.error(error);
  //   } else {
  //     showStatus("success", "Check your email for login link");
  //   }
  // };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await clearAuthTokens();
    setUser(null);
  };

  // Load saved data from Chrome storage
  const loadSavedData = async () => {
    try {
      const data = await chromeStorage.get(['customPrompt', 'sessionStats']);

      setCustomPrompt(data.customPrompt || '');
      setCharCount((data.customPrompt || '').length);

      if (data.sessionStats) {
        setStats({
          repliedCount: data.sessionStats.repliedCount || 0,
          commentsFound: data.sessionStats.commentsFound || 0
        });
      }
    } catch (error) {
      showStatus('error', 'Error loading saved data');
      console.error('Error loading data:', error);
    }
  };

  // Show status message
  const showStatus = (type: StatusMessage['type'], message: string) => {
    const id = `status-${Date.now()}-${Math.random()}`;
    const newStatus: StatusMessage = { type, message, id };

    setStatusMessages(prev => [...prev, newStatus]);

    // Auto-remove non-loading messages
    if (type !== 'loading') {
      setTimeout(() => {
        setStatusMessages(prev => prev.filter(s => s.id !== id));
      }, 5000);
    }

    return id;
  };

  // Remove status message
  const removeStatus = (id: string) => {
    setStatusMessages(prev => prev.filter(s => s.id !== id));
  };

  // Handle prompt text change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 500); // Limit to 500 chars
    setCustomPrompt(value);
    setCharCount(value.length);
  };

  // Save custom prompt
  const savePrompt = async () => {
    if (!customPrompt.trim()) {
      showStatus('warning', 'Please enter a custom prompt');
      return;
    }

    try {
      await chromeStorage.set({ customPrompt: customPrompt.trim() });
      showStatus('success', 'Custom prompt saved successfully!');
    } catch (error) {
      showStatus('error', 'Failed to save prompt');
      console.error('Save error:', error);
    }
  };

  // Handle reply actions
  const handleReplyAction = async (action: 'replyOne' | 'replyAll') => {
    if (isProcessing) {
      showStatus('warning', 'Already processing...');
      return;
    }

    try {
      setIsProcessing(true);

      // Check if we're on YouTube
      const tab = await tabMessaging.getActiveTab();

      if (!tab.url?.includes('youtube.com')) {
        showStatus('warning', 'Please navigate to a YouTube video page');
        return;
      }

      const loadingId = showStatus('loading',
        action === 'replyOne'
          ? 'Replying to comment...'
          : 'Processing all comments...'
      );

      // Send message to content script
      const response = await tabMessaging.sendMessage(tab.id, { action });

      // Remove loading status
      removeStatus(loadingId);

      if (response?.success) {
        const newRepliedCount = stats.repliedCount + (response.repliedCount || 0);
        const newStats = {
          repliedCount: newRepliedCount,
          commentsFound: response.totalComments || 0
        };

        setStats(newStats);

        // Save session stats
        await chromeStorage.set({
          sessionStats: {
            ...newStats,
            lastUpdated: new Date().toISOString()
          }
        });

        const message = action === 'replyOne'
          ? 'Successfully replied to comment!'
          : `Successfully processed ${response.repliedCount} comments!`;

        showStatus('success', message);

      } else {
        throw new Error(response?.error || 'Unknown error occurred');
      }

    } catch (error) {
      if (error instanceof Error) {
        showStatus('error', `Error: ${error.message}`);
        console.error('Reply action error:', error);
      } else {
        showStatus('error', 'An unknown error occurred');
        console.error('Reply action unknown error:', error);
      }
    }
  };

  // Open settings
  const openSettings = () => {
    if (window.chrome?.runtime?.openOptionsPage) {
      window.chrome.runtime.openOptionsPage();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            savePrompt();
            break;
          case '1':
            e.preventDefault();
            handleReplyAction('replyOne');
            break;
          case 'a':
            e.preventDefault();
            handleReplyAction('replyAll');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [customPrompt, isProcessing]);

  return (
    <div className="min-h-screen bg-theme-bg-primary animate-fade-in">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-theme-accent to-red-700 text-white">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">VibeReply.pro Extension</h1>
              <p className="text-red-100 text-sm">AI-Powered Comment Responses</p>
            </div>
          </div>
        </div>
      </div>
      {!user ? (
        <div className="px-6 py-6">
          <Button onClick={handleGoogleLogin} className="w-full bg-blue-500 text-white">
            Continue with Google
          </Button>
          <Button onClick={handleDashboardLogin} className="w-full bg-blue-500 text-white">
            Login via Dashboard
          </Button>
        </div>
      ) : (
        <>
          {/* Status Messages */}
          {statusMessages.length > 0 && (
            <div className="px-6 py-4 space-y-3">
              {statusMessages.map((status) => (
                <StatusIndicator
                  key={status.id}
                  type={status.type}
                  message={status.message}
                  onClose={status.type !== 'loading' ? () => removeStatus(status.id) : undefined}
                />
              ))}
            </div>
          )}
          {/* Main Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Custom Prompt Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Wand2 className="w-4 h-4 text-theme-accent" />
                <label className="text-sm font-semibold text-theme-text-primary">
                  Custom AI Prompt
                </label>
              </div>

              <div className="relative">
                <textarea
                  value={customPrompt}
                  onChange={handlePromptChange}
                  className="
                w-full p-4 rounded-xl border border-theme-border bg-theme-bg-secondary
                text-theme-text-primary text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20
                focus:border-theme-accent transition-all duration-200
                placeholder-theme-text-secondary
              "
                  placeholder="Enter how you want the AI to respond to comments... (e.g., 'Reply professionally and engagingly to this YouTube comment')"
                  rows={4}
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3 text-xs text-theme-text-secondary">
                  <span className={charCount > 450 ? 'text-theme-accent' : ''}>
                    {charCount}
                  </span>
                  /500
                </div>
              </div>

              <Button
                onClick={savePrompt}
                disabled={!customPrompt.trim()}
                icon={<Save className="w-4 h-4" />}
                className="w-full"
              >
                Save Prompt
              </Button>
            </div>

            {/* Divider */}
            <div className="border-t border-theme-border"></div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="w-4 h-4 text-theme-accent" />
                <h3 className="text-sm font-semibold text-theme-text-primary">
                  AI Reply Actions
                </h3>
              </div>

              <Button
                onClick={() => handleReplyAction('replyOne')}
                disabled={isProcessing}
                loading={isProcessing}
                variant="secondary"
                icon={<MessageCircle className="w-4 h-4" />}
                className="w-full"
              >
                Reply to First Comment
              </Button>

              <Button
                onClick={() => handleReplyAction('replyAll')}
                disabled={isProcessing}
                loading={isProcessing}
                icon={<MessagesSquare className="w-4 h-4" />}
                className="w-full"
              >
                Reply to All Comments
              </Button>
            </div>

            {/* Statistics Section */}
            <div className="bg-theme-bg-secondary rounded-xl border border-theme-border p-5">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-4 h-4 text-theme-accent" />
                <h4 className="text-sm font-semibold text-theme-text-primary">
                  Session Stats
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-theme-bg-primary rounded-lg">
                  <div className="text-2xl font-bold text-theme-accent">
                    {stats.repliedCount}
                  </div>
                  <div className="text-xs text-theme-text-secondary">
                    Replies Sent
                  </div>
                </div>
                <div className="text-center p-3 bg-theme-bg-primary rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.commentsFound}
                  </div>
                  <div className="text-xs text-theme-text-secondary">
                    Comments Found
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Link */}
            <div className="pt-2">
              <button
                onClick={openSettings}
                className="
              text-sm text-theme-text-secondary hover:text-theme-accent
              transition-colors duration-200 flex items-center space-x-2
              hover:underline
            "
              >
                <Settings className="w-4 h-4" />
                <span>Advanced Settings</span>
              </button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="text-xs text-theme-text-secondary text-center space-y-1 pt-2 border-t border-theme-border">
              <p className="font-medium">Keyboard Shortcuts:</p>
              <p>Ctrl+S: Save Prompt • Ctrl+1: Reply One • Ctrl+A: Reply All</p>
            </div>
            {/* Logout button */}
            <p className="text-sm">Hi, {user.email}</p>
            <Button onClick={handleLogout} className="w-full bg-red-500 text-white">
              Logout
            </Button>
          </div>
        </>
      )};
    </div>
  );
};