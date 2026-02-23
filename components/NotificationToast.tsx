import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Bell } from 'lucide-react';

interface NotificationToastProps {
  id: string;
  title: string;
  message: string;
  onClose: (id: string) => void;
  duration?: number;
  type?: 'message' | 'alert';
  messageId?: string;
  onMarkAsRead?: (messageId: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  title,
  message,
  onClose,
  duration = 5000,
  type = 'message',
  messageId,
  onMarkAsRead
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose(id);
        // Mark as read when auto-dismissed
        if (messageId && onMarkAsRead) {
          onMarkAsRead(messageId);
        }
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose, messageId, onMarkAsRead]);

  return (
    <div
      className={`flex items-start gap-3 bg-white rounded-lg shadow-lg p-4 mb-3 border-l-4 border-brand transition-all duration-300 animate-fade-in ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      style={{
        maxWidth: '360px',
        borderLeftColor: type === 'message' ? '#072432' : '#ef4444'
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {type === 'message' ? (
          <MessageSquare size={20} className="text-[#072432]" />
        ) : (
          <Bell size={20} className="text-red-500" />
        )}
      </div>

      <div className="flex-1">
        <h4 className="font-black text-sm text-slate-900">{title}</h4>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{message}</p>
      </div>

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose(id);
            // Mark as read when user dismisses
            if (messageId && onMarkAsRead) {
              onMarkAsRead(messageId);
            }
          }, 300);
        }}
        className="flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors"
        title="Close"
      >
        <X size={16} className="text-slate-400" />
      </button>
    </div>
  );
};

export default NotificationToast;
