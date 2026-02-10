
import React from 'react';
import { LayoutDashboard, School, FileText, CreditCard } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'schools', label: 'Schools', icon: <School size={20} /> },
    { id: 'templates', label: 'Emails', icon: <FileText size={20} /> },
    { id: 'payment', label: 'Profile', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 z-50 flex justify-between items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex flex-col items-center gap-1 transition-all ${
            activeTab === tab.id ? 'text-brand' : 'text-slate-400'
          }`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-brand/10' : ''}`}>
            {tab.icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileNav;
