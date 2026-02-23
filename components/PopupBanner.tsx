import React from 'react';
import { X } from 'lucide-react';

interface PopupBannerProps {
  title: string;
  message: string;
  onClose: () => void;
  type?: 'morning' | 'afternoon'; // For styling if needed
}

const PopupBanner: React.FC<PopupBannerProps> = ({ 
  title, 
  message, 
  onClose,
  type = 'morning'
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 space-y-6 animate-scale-up relative border-2 border-brand">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-all"
          title="Close"
        >
          <X size={24} className="text-slate-400 hover:text-slate-600" />
        </button>

        {/* Content */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-slate-900">{title}</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-brand hover:bg-brand/90 text-slate-900 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

export default PopupBanner;
