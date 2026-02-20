
import React from 'react';
import { LayoutDashboard, School, Users, FileText, LogOut, Download, BookOpen, CreditCard, ShieldCheck, MessageCircle, Mail, Gift } from 'lucide-react';
import { SIDEBAR_LOGO_URL } from '../constants';
import { SalesRep } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: SalesRep | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, hide: false },
    { id: 'reps', label: 'Sales Members', icon: <Users size={20} />, hide: !isAdmin },
    { id: 'schools', label: 'Schools', icon: <School size={20} />, hide: false },
    { id: 'templates', label: 'Email Drafts', icon: <FileText size={20} />, hide: false },
    { id: 'tools', label: 'Sales Tools', icon: <Download size={20} />, hide: false },
    { id: 'training', label: 'Training', icon: <BookOpen size={20} />, hide: false },
    { id: 'crew', label: 'Crew Directory', icon: <Users size={20} />, hide: false },
    { id: 'group-chat', label: 'Group Chat', icon: <MessageCircle size={20} />, hide: false },
    { id: 'direct-message', label: 'Direct Message', icon: <Mail size={20} />, hide: false },
    { id: 'incentives', label: 'Incentives', icon: <Gift size={20} />, hide: false },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-slate-100 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-8 pb-4 flex items-center justify-start">
        <img src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/Educator.svg?alt=media&token=474dc685-fd5c-4475-b93a-b8d55c367d75" alt="Educater" className="h-10 object-contain" />
      </div>
      
      <nav className="flex-1 p-4 mt-4 space-y-1">
        {menuItems.filter(item => !item.hide).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-bold tracking-tight ${
              activeTab === item.id 
                ? 'bg-brand text-slate-900 shadow-lg shadow-brand/20' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50 space-y-4">
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
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all text-sm font-bold"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
