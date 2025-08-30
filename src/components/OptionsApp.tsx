import React, { useState, useEffect } from 'react';
import { 
  Youtube, 
  Settings, 
  Wand2, 
  BarChart3, 
  Rocket,
  Save,
  RotateCcw,
  Wifi,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from './Button';
import { StatusIndicator } from './StatusIndicator';
import { ThemeToggle } from './ThemeToggle';
import { SettingsCard } from './SettingsCard';
import { Switch } from './Switch';
import { chromeStorage } from '../utils/storage';
import { themeManager } from '../utils/theme';

interface SettingsData {
  apiEndpoint: string;
  apiKey: string;
  requestTimeout: number;
  autoSubmit: boolean;
  skipShortComments: boolean;
  showNotifications: boolean;
  replyDelay: number;
  maxComments: number;
  skipSpam: boolean;
  skipOwnComments: boolean;
  blacklistedKeywords: string;
  retryAttempts: number;
  enableCaching: boolean;
  debugMode: boolean;
  customPrompt: string;
}

interface StatsData {
  totalReplies: number;
  successfulReplies: number;
  totalResponseTime: number;
  lastUsed: string | null;
}

const defaultSettings: SettingsData = {
  apiEndpoint: 'https://your-saas-domain.com/api/reply',
  apiKey: '',
  requestTimeout: 15,
  autoSubmit: true,
  skipShortComments: true,
  showNotifications: true,
  replyDelay: 3,
  maxComments: 10,
  skipSpam: true,
  skipOwnComments: true,
  blacklistedKeywords: '',
  retryAttempts: 3,
  enableCaching: false,
  debugMode: false,
  customPrompt: 'Reply politely and engagingly to this YouTube comment while being helpful and constructive.'
};

const promptTemplates = {
  professional: "Provide a professional and engaging response to this YouTube comment. Be respectful, informative, and maintain a positive tone while addressing the commenter's points.",
  friendly: "Reply to this YouTube comment in a friendly and casual manner. Be warm, approachable, and conversational while showing genuine interest in what the commenter said.",
  supportive: "Respond to this YouTube comment with support and encouragement. Be empathetic, understanding, and offer positive reinforcement or helpful advice where appropriate.",
  educational: "Provide an educational and informative response to this YouTube comment. Share relevant knowledge, explain concepts clearly, and help the commenter learn something new.",
  custom: ""
};

export const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [stats, setStats] = useState<StatsData>({
    totalReplies: 0,
    successfulReplies: 0,
    totalResponseTime: 0,
    lastUsed: null
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templatePreview, setTemplatePreview] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    themeManager.initTheme();
    loadData();
  }, []);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadSettings(), loadStats()]);
    } catch (error) {
      showStatus('error', 'Error loading data');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load settings from storage
  const loadSettings = async () => {
    try {
      const data = await chromeStorage.get(Object.keys(defaultSettings));
      setSettings({ ...defaultSettings, ...data });
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const data = await chromeStorage.get(['extensionStats']);
      if (data.extensionStats) {
        setStats({ ...stats, ...data.extensionStats });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Show status message
  const showStatus = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Handle settings change
  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle template selection
  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setTemplatePreview(promptTemplates[template as keyof typeof promptTemplates] || '');
  };

  // Save template as custom prompt
  const saveTemplate = async () => {
    if (!templatePreview.trim()) {
      showStatus('warning', 'Please select a template first');
      return;
    }

    try {
      await chromeStorage.set({ customPrompt: templatePreview.trim() });
      setSettings(prev => ({ ...prev, customPrompt: templatePreview.trim() }));
      showStatus('success', 'Template saved as default prompt!');
    } catch (error) {
      showStatus('error', 'Failed to save template');
      console.error('Save template error:', error);
    }
  };

  // Save all settings
  const saveAllSettings = async () => {
    try {
      // Validate required fields
      if (!settings.apiEndpoint || !isValidURL(settings.apiEndpoint)) {
        showStatus('error', 'Please enter a valid API endpoint URL');
        return;
      }

      await chromeStorage.set(settings);
      showStatus('success', 'All settings saved successfully!');
    } catch (error) {
      showStatus('error', 'Error saving settings');
      console.error('Save error:', error);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      await chromeStorage.clear();
      await chromeStorage.set(defaultSettings);
      setSettings(defaultSettings);
      setSelectedTemplate('');
      setTemplatePreview('');
      showStatus('success', 'Settings reset to defaults');
    } catch (error) {
      showStatus('error', 'Error resetting settings');
      console.error('Reset error:', error);
    }
  };

  // Test API connection
  const testAPIConnection = async () => {
    try {
      if (!settings.apiEndpoint || !isValidURL(settings.apiEndpoint)) {
        showStatus('error', 'Please enter a valid API endpoint');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), settings.requestTimeout * 1000);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      const response = await fetch(settings.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          comment: 'This is a test comment',
          prompt: 'Reply briefly to this test comment',
          test: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          showStatus('success', 'API connection successful!');
        } else {
          throw new Error('Invalid API response format');
        }
      } else {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

    } catch (error: any) {
      let errorMessage = 'Connection failed';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showStatus('error', `API test failed: ${errorMessage}`);
    }
  };

  // Reset statistics
  const resetStats = async () => {
    if (!confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      return;
    }

    try {
      const newStats = {
        totalReplies: 0,
        successfulReplies: 0,
        totalResponseTime: 0,
        lastUsed: null
      };
      
      await chromeStorage.set({ extensionStats: newStats });
      setStats(newStats);
      showStatus('success', 'Statistics reset successfully');
    } catch (error) {
      showStatus('error', 'Error resetting statistics');
      console.error('Reset stats error:', error);
    }
  };

  // Export data
  const exportData = async () => {
    try {
      const allData = await chromeStorage.get(null);
      
      const exportData = {
        settings,
        statistics: stats,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-auto-reply-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus('success', 'Data exported successfully');
    } catch (error) {
      showStatus('error', 'Error exporting data');
      console.error('Export error:', error);
    }
  };

  // Utility: validate URL
  const isValidURL = (string: string): boolean => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Calculate success rate
  const successRate = stats.totalReplies > 0 
    ? Math.round((stats.successfulReplies / stats.totalReplies) * 100)
    : 0;

  // Calculate average response time
  const avgResponseTime = stats.successfulReplies > 0
    ? Math.round(stats.totalResponseTime / stats.successfulReplies)
    : 0;

  // Format last used date
  const lastUsed = stats.lastUsed 
    ? new Date(stats.lastUsed).toLocaleDateString()
    : 'Never';

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-theme-border border-t-theme-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg-primary animate-fade-in">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-theme-bg-secondary border-b border-theme-border backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-theme-accent p-2 rounded-lg text-white">
                <Youtube className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-theme-text-primary">YouTube Auto Reply Pro</h1>
                <p className="text-sm text-theme-text-secondary">Advanced Settings & Configuration</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Message */}
        {statusMessage && (
          <div className="mb-6">
            <StatusIndicator
              type={statusMessage.type}
              message={statusMessage.message}
              onClose={() => setStatusMessage(null)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Configuration */}
          <SettingsCard 
            title="API Configuration" 
            icon={<Settings className="w-5 h-5" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Endpoint</label>
                <input 
                  type="url" 
                  value={settings.apiEndpoint}
                  onChange={(e) => handleSettingChange('apiEndpoint', e.target.value)}
                  className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20"
                  placeholder="https://your-api-domain.com/api/reply"
                />
                <p className="text-xs text-theme-text-secondary mt-1">Your SaaS backend API endpoint</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key (Optional)</label>
                <input 
                  type="password" 
                  value={settings.apiKey}
                  onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                  className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20"
                  placeholder="Enter your API key"
                />
                <p className="text-xs text-theme-text-secondary mt-1">API key for authentication if required</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Request Timeout (seconds)</label>
                <input 
                  type="number" 
                  min="5" 
                  max="60" 
                  value={settings.requestTimeout}
                  onChange={(e) => handleSettingChange('requestTimeout', parseInt(e.target.value))}
                  className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Behavior Settings */}
          <SettingsCard 
            title="Behavior Settings" 
            icon={<Wand2 className="w-5 h-5" />}
          >
            <div className="space-y-6">
              <Switch
                label="Auto-submit Replies"
                description="Automatically submit replies after generation"
                checked={settings.autoSubmit}
                onChange={(checked) => handleSettingChange('autoSubmit', checked)}
              />

              <Switch
                label="Skip Short Comments"
                description="Skip comments with less than 10 characters"
                checked={settings.skipShortComments}
                onChange={(checked) => handleSettingChange('skipShortComments', checked)}
              />

              <Switch
                label="Show Notifications"
                description="Display on-screen notifications during processing"
                checked={settings.showNotifications}
                onChange={(checked) => handleSettingChange('showNotifications', checked)}
              />

              <div>
                <label className="block text-sm font-medium mb-2">Reply Delay (seconds)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.replyDelay}
                  onChange={(e) => handleSettingChange('replyDelay', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-theme-text-secondary mt-1">
                  <span>1s</span>
                  <span>{settings.replyDelay}s</span>
                  <span>10s</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Comments per Session</label>
                <select 
                  value={settings.maxComments}
                  onChange={(e) => handleSettingChange('maxComments', parseInt(e.target.value))}
                  className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20"
                >
                  <option value={5}>5 comments</option>
                  <option value={10}>10 comments</option>
                  <option value={20}>20 comments</option>
                  <option value={50}>50 comments</option>
                  <option value={-1}>Unlimited</option>
                </select>
              </div>
            </div>
          </SettingsCard>

          {/* Prompt Templates */}
          <SettingsCard 
            title="Prompt Templates" 
            icon={<Wand2 className="w-5 h-5" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quick Templates</label>
                <select 
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20 mb-3"
                >
                  <option value="">Select a template...</option>
                  <option value="professional">Professional & Engaging</option>
                  <option value="friendly">Friendly & Casual</option>
                  <option value="supportive">Supportive & Encouraging</option>
                  <option value="educational">Educational & Informative</option>
                </select>
                
                <textarea 
                  value={templatePreview}
                  onChange={(e) => setTemplatePreview(e.target.value)}
                  className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20 resize-none"
                  rows={4}
                  placeholder="Template preview will appear here..."
                />
              </div>

              <Button 
                onClick={saveTemplate}
                disabled={!templatePreview.trim()}
                icon={<Save className="w-4 h-4" />}
                className="w-full"
              >
                Save as Default Prompt
              </Button>
            </div>
          </SettingsCard>

          {/* Statistics */}
          <SettingsCard 
            title="Statistics" 
            icon={<BarChart3 className="w-5 h-5" />}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-theme-bg-primary rounded-lg">
                <div className="text-2xl font-bold text-theme-accent">{stats.totalReplies}</div>
                <div className="text-sm text-theme-text-secondary">Total Replies</div>
              </div>
              <div className="text-center p-4 bg-theme-bg-primary rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
                <div className="text-sm text-theme-text-secondary">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-theme-bg-primary rounded-lg">
                <div className="text-2xl font-bold text-green-600">{avgResponseTime}s</div>
                <div className="text-sm text-theme-text-secondary">Avg Response Time</div>
              </div>
              <div className="text-center p-4 bg-theme-bg-primary rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{lastUsed}</div>
                <div className="text-sm text-theme-text-secondary">Last Used</div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={resetStats}
                variant="secondary"
                icon={<RefreshCw className="w-4 h-4" />}
                className="w-full"
              >
                Reset Statistics
              </Button>
              <Button 
                onClick={exportData}
                variant="secondary"
                icon={<Download className="w-4 h-4" />}
                className="w-full"
              >
                Export Data
              </Button>
            </div>
          </SettingsCard>

          {/* Advanced Features */}
          <div className="lg:col-span-2">
            <SettingsCard 
              title="Advanced Features" 
              icon={<Rocket className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Reply Filters</h3>
                  
                  <Switch
                    label="Skip Spam Comments"
                    description="Automatically detect and skip spam"
                    checked={settings.skipSpam}
                    onChange={(checked) => handleSettingChange('skipSpam', checked)}
                  />

                  <Switch
                    label="Skip Own Comments"
                    description="Don't reply to your own comments"
                    checked={settings.skipOwnComments}
                    onChange={(checked) => handleSettingChange('skipOwnComments', checked)}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">Blacklisted Keywords</label>
                    <textarea 
                      value={settings.blacklistedKeywords}
                      onChange={(e) => handleSettingChange('blacklistedKeywords', e.target.value)}
                      className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20 resize-none"
                      rows={3}
                      placeholder="Enter keywords to avoid, separated by commas"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Performance</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Retry Attempts</label>
                    <select 
                      value={settings.retryAttempts}
                      onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
                      className="w-full p-3 rounded-lg border border-theme-border bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20"
                    >
                      <option value={1}>1 attempt</option>
                      <option value={2}>2 attempts</option>
                      <option value={3}>3 attempts</option>
                      <option value={5}>5 attempts</option>
                    </select>
                  </div>

                  <Switch
                    label="Enable Caching"
                    description="Cache responses for similar comments"
                    checked={settings.enableCaching}
                    onChange={(checked) => handleSettingChange('enableCaching', checked)}
                  />

                  <Switch
                    label="Debug Mode"
                    description="Enable detailed logging"
                    checked={settings.debugMode}
                    onChange={(checked) => handleSettingChange('debugMode', checked)}
                  />
                </div>
              </div>
            </SettingsCard>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={saveAllSettings}
            icon={<Save className="w-4 h-4" />}
            size="lg"
            className="px-8"
          >
            Save All Settings
          </Button>
          <Button 
            onClick={resetToDefaults}
            variant="secondary"
            icon={<RotateCcw className="w-4 h-4" />}
            size="lg"
            className="px-8"
          >
            Reset to Defaults
          </Button>
          <Button 
            onClick={testAPIConnection}
            variant="secondary"
            icon={<Wifi className="w-4 h-4" />}
            size="lg"
            className="px-8"
          >
            Test API Connection
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-theme-text-secondary">
          <p className="mb-2">YouTube Auto Reply Pro v2.0.0</p>
          <div className="flex justify-center space-x-4 text-sm">
            <a href="#" className="hover:text-theme-accent transition-colors">Documentation</a>
            <a href="#" className="hover:text-theme-accent transition-colors">Support</a>
            <a href="#" className="hover:text-theme-accent transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};