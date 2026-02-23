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
      <div className="bg-white rounded-[2rem] max-w-md w-full p-8 space-y-6 animate-scale-up relative shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-all"
          title="Close"
        >
          <X size={24} className="text-slate-400 hover:text-slate-600" />
        </button>

        {/* Speech Bubble Icon - Centered */}
        <div className="flex justify-center">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/speech%20bubble_200x200.webp?alt=media&token=25c10f21-477c-4028-8217-fe815cfd540e"
            alt="Message"
            className="w-16 h-16"
          />
        </div>

        {/* Content */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-slate-900">{title}</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#072432] hover:bg-[#0d3a47] text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

export default PopupBanner;
