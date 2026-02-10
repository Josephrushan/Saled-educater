
import React from 'react';
import { Menu, User } from 'lucide-react';
import { SIDEBAR_LOGO_URL } from '../constants';
import { SalesRep } from '../types';

interface MobileTopBarProps {
  onOpenDrawer: () => void;
  onOpenProfile: () => void;
  currentUser: SalesRep | null;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ onOpenDrawer, onOpenProfile, currentUser }) => {
  return (
    <div className="md:hidden sticky top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-40 shadow-sm">
      <button 
        onClick={onOpenDrawer}
        className="p-2 -ml-2 text-slate-500 active:bg-slate-50 rounded-xl"
      >
        <Menu size={24} />
      </button>

      <div className="flex items-center justify-center">
        <img src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/Educator.svg?alt=media&token=474dc685-fd5c-4475-b93a-b8d55c367d75" alt="Educater" className="h-8 object-contain" />
      </div>

      <button 
        onClick={onOpenProfile}
        className="w-10 h-10 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center transition-transform active:scale-95"
      >
        {currentUser?.profilePicUrl ? (
          <img src={currentUser.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-black text-slate-400">{currentUser?.avatar}</span>
        )}
      </button>
    </div>
  );
};

export default MobileTopBar;
