import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Save, 
  Github, 
  Database, 
  Bell,
  Shield,
  Palette,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    githubToken: '',
    githubOrganization: '',
    autoSync: true,
    syncInterval: 15,
    retentionDays: 90,
    cleanupEnabled: true,
    emailNotifications: true,
    slackNotifications: false,
    webhookUrl: '',
    sessionTimeout: 60,
    requireAuth: false,
    defaultTimeRange: '30',
    showAnimations: true,
    compactMode: false
  });

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'github', name: 'GitHub', icon: Github },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'display', name: 'Display', icon: Palette },
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      githubToken: '',
      githubOrganization: '',
      autoSync: true,
      syncInterval: 15,
      retentionDays: 90,
      cleanupEnabled: true,
      emailNotifications: true,
      slackNotifications: false,
      webhookUrl: '',
      sessionTimeout: 60,
      requireAuth: false,
      defaultTimeRange: '30',
      showAnimations: true,
      compactMode: false
    };
    setSettings(defaultSettings);
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your CI/CD Visualizer preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={resetSettings} className="btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          <button onClick={saveSettings} className="btn-primary">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  {tabs.find(tab => tab.id === activeTab)?.name} Settings
                </h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-gray-500">
                  Configure your {tabs.find(tab => tab.id === activeTab)?.name.toLowerCase()} preferences here.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;