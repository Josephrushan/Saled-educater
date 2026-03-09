
import React from 'react';
import { X, Download, BookOpen, LogOut, ChevronRight, Users, LayoutDashboard, School, FileText, Mail, Gift, Briefcase } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  isAdmin: boolean;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, onNavigate, onLogout, isAdmin }) => {
  if (!isOpen) return null;

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, hide: false },
    { id: 'schools', label: 'Schools', icon: <School size={20} />, hide: false },
    { id: 'templates', label: 'Email Drafts', icon: <FileText size={20} />, hide: false },
    { id: 'tools', label: 'Sales Tools', icon: <Download size={20} />, hide: false },
    { id: 'training', label: 'Training', icon: <BookOpen size={20} />, hide: false },
    { id: 'crew', label: 'Crew Directory', icon: <Users size={20} />, hide: false },
    { id: 'direct-message', label: 'Direct Message', icon: <Mail size={20} />, hide: false },
    { id: 'incentives', label: 'Incentives', icon: <Gift size={20} />, hide: false },
    { id: 'team', label: 'Team', icon: <Briefcase size={20} />, hide: false },
    { id: 'reps', label: 'Sales Members', icon: <Users size={20} />, hide: false },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-[60] animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between flex-shrink-0">
          <span className="text-lg font-black text-slate-900 uppercase tracking-widest">Menu</span>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.filter(i => !i.hide).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 rounded-full hover:bg-slate-50 text-slate-600 font-bold transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="text-slate-400 group-hover:text-brand">{item.icon}</div>
                <span className="text-sm">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-slate-900 rounded-full font-black text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-black"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
