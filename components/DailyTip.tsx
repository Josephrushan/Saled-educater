import React, { useState, useMemo } from 'react';
import { X, Lightbulb } from 'lucide-react';
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
    <div className="bg-[#181818] rounded-lg p-4 mb-6 relative flex items-center gap-4 shadow-sm">
      {/* Video Loop */}
      <video 
        autoPlay
        muted
        loop
        className="w-32 h-32 flex-shrink-0 rounded"
      >
        <source src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/edu%20sales%2FSales%20Tip2.mp4?alt=media&token=a7648599-2958-4bcf-ba68-0872d6753c81" type="video/mp4" />
      </video>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 hover:bg-slate-700 rounded transition-colors"
        title="Dismiss"
      >
        <X size={18} className="text-slate-400 hover:text-slate-200" />
      </button>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-black text-sm text-white mb-1 flex items-center gap-2">
          <Lightbulb size={18} className="text-white stroke-2" />
          Daily Sales Tip
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {todaysTip}
        </p>
      </div>
    </div>
  );
};

export default DailyTip;
