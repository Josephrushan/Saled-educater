
import React from 'react';
import { X, Download, BookOpen, LogOut, ChevronRight, Users } from 'lucide-react';

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
    { id: 'reps', label: 'Sales Members', icon: <Users size={20} />, hide: !isAdmin },
    { id: 'tools', label: 'Sales Artillery', icon: <Download size={20} />, hide: false },
    { id: 'training', label: 'Training Academy', icon: <BookOpen size={20} />, hide: false },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-[60] animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <span className="text-lg font-black text-slate-900 uppercase tracking-widest">Menu</span>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {items.filter(i => !i.hide).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="text-slate-400 group-hover:text-brand">{item.icon}</div>
                <span className="text-sm">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-4 text-rose-500 bg-rose-50 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
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
