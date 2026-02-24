
import React from 'react';
import { LayoutDashboard, School, Users, FileText, LogOut, Download, BookOpen, CreditCard, ShieldCheck, Mail, Gift, UserPlus, CheckSquare, Newspaper } from 'lucide-react';
import { SIDEBAR_LOGO_URL } from '../constants';
import { SalesRep } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: SalesRep | null;
  onLogout: () => void;
  unreadMessageCount?: number;
  unreadUpdatesCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout, unreadMessageCount = 0, unreadUpdatesCount = 0 }) => {
  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, hide: false },
    { id: 'reps', label: 'Sales Members', icon: <Users size={20} />, hide: !isAdmin },
    { id: 'schools', label: 'Schools', icon: <School size={20} />, hide: false },
    { id: 'team', label: 'My Team', icon: <UserPlus size={20} />, hide: false },
    { id: 'approvals', label: 'Team Approvals', icon: <CheckSquare size={20} />, hide: !isAdmin },
    { id: 'templates', label: 'Email Drafts', icon: <FileText size={20} />, hide: false },
    { id: 'tools', label: 'Sales Tools', icon: <Download size={20} />, hide: false },
    { id: 'training', label: 'Training', icon: <BookOpen size={20} />, hide: false },
    { id: 'crew', label: 'Crew Directory', icon: <Users size={20} />, hide: false },
    { id: 'direct-message', label: 'Direct Message', icon: <Mail size={20} />, hide: false },
    { id: 'updates', label: 'Updates', icon: <Newspaper size={20} />, hide: false },
    { id: 'incentives', label: 'Incentives', icon: <Gift size={20} />, hide: false },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-slate-100 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <img src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/Educator.svg?alt=media&token=474dc685-fd5c-4475-b93a-b8d55c367d75" alt="Educater" className="h-8 object-contain" />
        <button 
          onClick={onLogout}
          className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {menuItems.filter(item => !item.hide).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-bold tracking-tight relative ${
              activeTab === item.id 
                ? 'bg-brand text-slate-900 shadow-lg shadow-brand/20' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.icon}
            {item.label}
            {item.id === 'direct-message' && unreadMessageCount > 0 && (
              <div className="absolute right-4 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
            {item.id === 'updates' && unreadUpdatesCount > 0 && (
              <div className="absolute right-4 w-3 h-3 bg-brand rounded-full animate-pulse"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        {currentUser && (
          <button 
            onClick={() => setActiveTab('payment')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              activeTab === 'payment' ? 'border-brand bg-brand/10' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
              activeTab === 'payment' ? 'bg-brand text-slate-900' : 'bg-slate-200 text-slate-900'
            }`}>
              {currentUser.profilePicUrl ? (
                <img src={currentUser.profilePicUrl} className="w-full h-full object-cover rounded-xl" alt="" />
              ) : currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1">
                {isAdmin ? <ShieldCheck size={10} /> : <CreditCard size={10} />}
                {isAdmin ? 'Admin View' : 'Get Paid'}
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
