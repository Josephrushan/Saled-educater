import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { DAILY_SALES_TIPS } from '../constants';

interface DailyTipProps {
  onClose?: () => void;
}

const DailyTip: React.FC<DailyTipProps> = ({ onClose }) => {
  const [dismissed, setDismissed] = useState(() => {
    // Check if already dismissed today
    const today = new Date().toISOString().split('T')[0];
    const lastDismissed = localStorage.getItem('daily_tip_dismissed_date');
    return lastDismissed === today;
  });

  // Get tip based on day of year (ensures same tip all day, rotates daily)
  const todaysTip = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const tipIndex = dayOfYear % DAILY_SALES_TIPS.length;
    return DAILY_SALES_TIPS[tipIndex];
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('daily_tip_dismissed_date', today);
    setDismissed(true);
    if (onClose) {
      onClose();
    }
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-brand/10 via-brand/5 to-transparent rounded-lg p-4 mb-6 relative flex items-center gap-4">
      {/* Speech Bubble Icon */}
      <img 
        src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/speech%20bubble_200x200.webp?alt=media&token=25c10f21-477c-4028-8217-fe815cfd540e"
        alt="Daily Tip"
        className="w-12 h-12 flex-shrink-0"
      />

      {/* Vertical Line Separator */}
      <div className="w-1 h-16 bg-gradient-to-b from-brand/30 to-brand/10 rounded-full"></div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 hover:bg-brand/10 rounded transition-colors"
        title="Dismiss"
      >
        <X size={18} className="text-slate-500 hover:text-slate-700" />
      </button>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-black text-sm text-slate-900 mb-1">💡 Daily Sales Tip</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          {todaysTip}
        </p>
      </div>
    </div>
  );
};

export default DailyTip;
