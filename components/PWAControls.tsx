import React, { useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '../services/firebase';
import { Bell, Download } from 'lucide-react';

const PWAControls: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for foreground messages
        onMessageListener().then((payload: any) => {
           console.log('Foreground Message:', payload);
           if (payload?.notification) {
              // Basic alert for demo purposes
              alert(`${payload.notification.title}\n${payload.notification.body}`);
           }
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                setDeferredPrompt(null);
                setShowInstallBtn(false);
            });
        }
    };

    const handleNotificationClick = async () => {
        const token = await requestForToken();
        if (token) {
            setNotificationPermission('granted');
            alert('Notifications enabled! Token generated (check console).');
        }
    };

    if (!showInstallBtn && notificationPermission === 'granted') return null;

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            {showInstallBtn && (
                <button 
                  onClick={handleInstallClick}
                  className="bg-[#00ff8e] text-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium hover:bg-green-400 transition-colors"
                >
                    <Download size={18} />
                    Install App
                </button>
            )}
            {notificationPermission === 'default' && (
                 <button 
                 onClick={handleNotificationClick}
                 className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium hover:bg-blue-700 transition-colors"
               >
                 <Bell size={18} />
                 Enable Alerts
               </button>
            )}
        </div>
    );
};

export default PWAControls;