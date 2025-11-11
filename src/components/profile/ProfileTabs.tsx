import React from 'react';
import { History, Share2, Settings } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile?: boolean;
}

export default function ProfileTabs({ activeTab, setActiveTab, isMobile = false }: ProfileTabsProps) {
  const tabs = [
    { id: 'history', label: 'My History', icon: History },
    { id: 'sharing', label: 'My Sharing', icon: Share2 },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  if (isMobile) {
    return (
      <div className='flex flex-col gap-2'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-purple-100 text-purple-600'
                : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <tab.icon className='w-5 h-5' />
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className='mb-8'>
      <div className='flex gap-2 border-b border-gray-200 pb-2'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className='w-4 h-4' />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
