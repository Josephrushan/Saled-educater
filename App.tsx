import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SchoolList from './components/SchoolList';
import SchoolDetail from './components/SchoolDetail';
import AddSchoolModal from './components/AddSchoolModal';
import Login from './components/Login';
import EmailTemplates from './components/EmailTemplates';
import Resources from './components/Resources';
import PaymentInfo from './components/PaymentInfo';
import RepManagement from './components/RepManagement';
import MobileNav from './components/MobileNav';
import MobileTopBar from './components/MobileTopBar';
import MobileDrawer from './components/MobileDrawer';
import CrewDirectoryModule from './components/CrewDirectoryModule';
import DirectMessageModule from './components/DirectMessageModule';
import IncentivesModule from './components/IncentivesModule';
import PopupBanner from './components/PopupBanner';
import DailyTip from './components/DailyTip';
import NotificationToast from './components/NotificationToast';
import { School, SalesRep, SalesStage, TrackType, Message } from './types';
import { 
  getSchoolsFromFirebase, 
  addSchoolToFirebase, 
  updateSchoolStageInFirebase,
  updateSchoolContactInfo,
  deleteSchool,
  seedSchoolsDatabase,
  updateSalesRepLastSeen,
  getSalesReps,
  getOrCreateDirectMessage,
  subscribeToDirectMessages
} from './services/firebase';
import { MOCK_SCHOOLS } from './constants';
import PWAControls from './components/PWAControls';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SalesRep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePopup, setActivePopup] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type?: 'message' | 'alert'; messageId?: string }>>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notifiedMessageIds, setNotifiedMessageIds] = useState<Set<string>>(new Set());
  const [allReps, setAllReps] = useState<SalesRep[]>([]);
  const [directMessageUnsubscribers, setDirectMessageUnsubscribers] = useState<Map<string, () => void>>(new Map());
  
  // Ref to always have the latest notified message IDs (prevents stale closure)
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  
  // Keep ref in sync with state
  useEffect(() => {
    notifiedMessageIdsRef.current = notifiedMessageIds;
    // Persist to localStorage so we don't re-notify old messages on app reload
    localStorage.setItem('notifiedMessageIds', JSON.stringify(Array.from(notifiedMessageIds)));
  }, [notifiedMessageIds]);

  // Restore notified message IDs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifiedMessageIds');
    if (saved) {
      try {
        const ids = new Set(JSON.parse(saved));
        setNotifiedMessageIds(ids);
        notifiedMessageIdsRef.current = ids;
      } catch (error) {
        console.error('Error restoring notified message IDs:', error);
      }
    }
  }, []);

  // Handle tab change and clear unread count for direct messages
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'direct-message') {
      setUnreadMessageCount(0);
    }
  };

  // Restore user session on app mount
  useEffect(() => {
    const savedUser = localStorage.getItem('educater_currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error restoring user session:', error);
        localStorage.removeItem('educater_currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  // Update lastSeen when user is set or app comes into focus
  useEffect(() => {
    if (currentUser) {
      // Update lastSeen when component mounts and user is loaded
      updateSalesRepLastSeen(currentUser.id);

      // Update lastSeen when the app comes back into focus
      const handleFocus = () => {
        updateSalesRepLastSeen(currentUser.id);
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [currentUser?.id]);

  // Check and display popup once per session
  useEffect(() => {
    if (currentUser) {
      checkAndShowPopup();
    }
  }, [currentUser]);

  const checkAndShowPopup = () => {
    // Only show popup once per session using sessionStorage
    const popupShownThisSession = sessionStorage.getItem('popup_shown_this_session');
    
    if (!popupShownThisSession) {
      setActivePopup(true);
    }
  };

  const handleClosePopup = () => {
    setActivePopup(false);
    
    // Mark popup as shown for this session
    sessionStorage.setItem('popup_shown_this_session', 'true');
  };

  // Subscribe to all direct messages from all reps
  useEffect(() => {
    if (!currentUser) return;

    const subscribeToAllMessages = async () => {
      try {
        const reps = await getSalesReps();
        const otherReps = reps.filter(r => r.id !== currentUser.id);
        setAllReps(otherReps);

        // Subscribe to each rep's messages
        const newUnsubscribers = new Map<string, () => void>();

        for (const rep of otherReps) {
          try {
            const dmId = await getOrCreateDirectMessage(currentUser.id, rep.id);
            const unsubscribe = subscribeToDirectMessages(dmId, (messages) => {
              // Count unread messages from this rep (incoming only, not sent by current user)
              // Use ref to get latest notified IDs (prevents stale closure)
              const unread = messages.filter(
                m => m.senderId !== currentUser.id && !notifiedMessageIdsRef.current.has(m.id)
              );

              // Show notification for each new message
              unread.forEach(message => {
                if (!notifiedMessageIdsRef.current.has(message.id)) {
                  showNotification(
                    `New message from ${message.senderName}`,
                    message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
                    'message',
                    message.id
                  );
                  // Immediately add to ref to prevent duplicate notifications in rapid callbacks
                  notifiedMessageIdsRef.current.add(message.id);
                  setNotifiedMessageIds(prev => new Set([...prev, message.id]));
                }
              });

              // Update unread count
              setUnreadMessageCount(prev => prev + unread.length);
            });
            newUnsubscribers.set(rep.id, unsubscribe);
          } catch (error) {
            console.error(`Error subscribing to messages for ${rep.name}:`, error);
          }
        }

        setDirectMessageUnsubscribers(newUnsubscribers);

        // Cleanup function
        return () => {
          newUnsubscribers.forEach(unsub => unsub());
        };
      } catch (error) {
        console.error('Error subscribing to all messages:', error);
      }
    };

    subscribeToAllMessages();
  }, [currentUser]);

  // Fetch schools on mount or when user changes
  useEffect(() => {
    if (currentUser) {
      console.log('📚 Loading schools for user:', currentUser.name);
      const loadData = async () => {
        let firebaseSchools = await getSchoolsFromFirebase();
        console.log('✅ Schools loaded from Firebase:', firebaseSchools.length);
        
        // Data cleanup: Migrate old "Super Admin" to "Keagan Smith" and fix rep assignments
        firebaseSchools = firebaseSchools.map(school => {
          const isAppointmentOrLater = 
            school.stage === SalesStage.APPOINTMENT_BOOKED ||
            school.stage === SalesStage.FINALIZING ||
            school.stage === SalesStage.LETTER_DISTRIBUTION ||
            school.stage === SalesStage.COMPLETED;
          
          let updated = { ...school };
          
          // Migrate old "Super Admin" references to "Keagan Smith"
          if (updated.salesRepName === 'Super Admin' || updated.salesRepId === 'admin_super') {
            if (isAppointmentOrLater) {
              // Keep assignment but update name
              updated.salesRepId = 'admin_super';
              updated.salesRepName = 'Keagan Smith';
            } else {
              // Remove rep assignment for early-stage schools
              updated.salesRepId = undefined;
              updated.salesRepName = undefined;
            }
          } else if (!isAppointmentOrLater && updated.salesRepId) {
            // Remove any rep assignment from early-stage schools
            updated.salesRepId = undefined;
            updated.salesRepName = undefined;
          }
          
          return updated;
        });
        
        console.log('📊 Final schools count:', firebaseSchools.length);
        setSchools(firebaseSchools);
      };
      loadData();
    }
  }, [currentUser]);

  // Expose seedSchoolsDatabase to window for one-time setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).seedSchools = async () => {
        console.log("Starting school database seed...");
        try {
          await seedSchoolsDatabase();
          console.log("Seed complete! Refreshing...");
          // Reload schools from Firebase
          const firebaseSchools = await getSchoolsFromFirebase();
          setSchools(firebaseSchools);
        } catch (error) {
          console.error("Seed failed:", error);
        }
      };
      console.log("💡 Tip: To seed the database with 100 schools, run: seedSchools()");
    }
  }, []);

  const handleLogin = (rep: SalesRep) => {
    setCurrentUser(rep);
    // Save user session to localStorage
    localStorage.setItem('educater_currentUser', JSON.stringify(rep));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSelectedSchoolId(null);
    setIsDrawerOpen(false);
    // Clear user session from localStorage
    localStorage.removeItem('educater_currentUser');
  };

  const showNotification = (title: string, message: string, type: 'message' | 'alert' = 'message', messageId?: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setNotifications(prev => [...prev, { id, title, message, type, messageId }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markMessageAsRead = (messageId: string) => {
    // Immediately add to ref
    notifiedMessageIdsRef.current.add(messageId);
    // Mark message as notified so it doesn't notify again
    setNotifiedMessageIds(prev => new Set([...prev, messageId]));
    // Remove notification if still displayed
    setNotifications(prev => prev.filter(n => n.messageId !== messageId));
    // Decrement unread count
    setUnreadMessageCount(prev => Math.max(0, prev - 1));
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchoolId(school.id);
    setActiveTab('school_detail');
  };

  const handleAddSchool = async (data: any) => {
    const schoolData: Omit<School, 'id'> = {
      name: data.name,
      principalName: data.principalName,
      principalEmail: data.principalEmail,
      // Don't assign to a rep on creation - do it when appointment stage is reached
      salesRepId: undefined,
      salesRepName: undefined,
      stage: SalesStage.COLD_LEAD,
      track: TrackType.ACQUISITION,
      studentCount: parseInt(data.studentCount) || 0,
      lastContactDate: new Date().toISOString().split('T')[0],
      commissionEarned: 0,
      engagementRate: 0,
      notes: ''
    };

    const newId = await addSchoolToFirebase(schoolData);
    if (newId) {
      setSchools([...schools, { ...schoolData, id: newId }]);
    }
    setShowAddModal(false);
  };

  const handleUpdateStage = async (schoolId: string, newStage: SalesStage) => {
    // Assign school to current user when appointment stage is reached
    const repId = currentUser?.id;
    const repName = `${currentUser?.name} ${currentUser?.surname || ''}`.trim();
    
    const success = await updateSchoolStageInFirebase(schoolId, newStage, repId, repName);
    if (success) {
      setSchools(schools.map(s => s.id === schoolId ? { 
        ...s, 
        stage: newStage, 
        lastContactDate: new Date().toISOString().split('T')[0],
        // Assign to current user when appointment stage is reached
        salesRepId: newStage === SalesStage.APPOINTMENT_BOOKED ? repId : s.salesRepId,
        salesRepName: newStage === SalesStage.APPOINTMENT_BOOKED ? repName : s.salesRepName
      } : s));
    }
  };

  const handleUpdateSchoolContactInfo = async (schoolId: string, contactData: any) => {
    const editorName = `${currentUser?.name} ${currentUser?.surname || ''}`.trim();
    console.log('Updating contact info for school:', schoolId, contactData);
    const success = await updateSchoolContactInfo(schoolId, contactData, editorName);
    console.log('Update success:', success);
    if (success) {
      setSchools(schools.map(s => s.id === schoolId ? { 
        ...s, 
        ...contactData,
        lastEditedBy: editorName,
        lastEditedAt: new Date().toISOString()
      } : s));
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    try {
      const success = await deleteSchool(schoolId);
      if (success) {
        setSchools(schools.filter(s => s.id !== schoolId));
        setSelectedSchoolId(null);
        setActiveTab('schools');
        alert('School deleted successfully');
      } else {
        alert('Failed to delete school');
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Error deleting school');
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

  const renderContent = () => {
    if (activeTab === 'school_detail' && selectedSchool) {
      return (
        <SchoolDetail 
          school={selectedSchool} 
          onBack={() => {
            setSelectedSchoolId(null);
            setActiveTab('schools');
          }}
          onUpdateStage={handleUpdateStage}
          onUpdateContactInfo={handleUpdateSchoolContactInfo}
          onDeleteSchool={handleDeleteSchool}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard currentUser={currentUser} schools={schools} />;
      case 'reps': return <RepManagement />;
      case 'schools': return <SchoolList onSelectSchool={handleSchoolSelect} onAddSchool={() => setShowAddModal(true)} currentUser={currentUser} schools={schools} />;
      case 'templates': return <EmailTemplates />;
      case 'tools': return <Resources type="tools" currentUser={currentUser} />;
      case 'training': return <Resources type="training" currentUser={currentUser} />;
      case 'crew': return <CrewDirectoryModule currentUser={currentUser} />;
      case 'direct-message': return <DirectMessageModule currentUser={currentUser} onMarkMessageAsRead={markMessageAsRead} />;
      case 'incentives': return <IncentivesModule currentUser={currentUser} />;
      case 'payment': return <PaymentInfo currentUser={currentUser} onUpdate={setCurrentUser} />;
      default: return <Dashboard currentUser={currentUser} schools={schools} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-['Inter']">
      <div className="hidden md:block">
        <Sidebar 
          activeTab={activeTab === 'school_detail' ? 'schools' : (activeTab === 'reps' ? 'reps' : activeTab)} 
          setActiveTab={handleTabChange} 
          currentUser={currentUser}
          onLogout={handleLogout}
          unreadMessageCount={unreadMessageCount}
        />
      </div>

      <MobileTopBar 
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenProfile={() => setActiveTab('payment')}
        currentUser={currentUser}
      />

      <MobileDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={setActiveTab}
        onLogout={handleLogout}
        isAdmin={currentUser.role === 'admin'}
      />
      
      <main className="flex-1 w-full md:ml-64 p-5 md:p-14 pb-24 md:pb-14 overflow-y-auto max-w-[1400px]">
        {renderContent()}
      </main>

      <MobileNav 
        activeTab={activeTab === 'school_detail' ? 'schools' : activeTab} 
        setActiveTab={handleTabChange} 
      />

      {showAddModal && (
        <AddSchoolModal onClose={() => setShowAddModal(false)} onSubmit={handleAddSchool} />
      )}
      
      <PWAControls />

      {activePopup && (
        <PopupBanner
          title="Welcome Back!"
          message="Ready to close some deals today? You've got this! 💪"
          onClose={handleClosePopup}
        />
      )}

      {/* Notification Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            id={notification.id}
            title={notification.title}
            message={notification.message}
            type={notification.type}
            messageId={notification.messageId}
            onClose={removeNotification}
            onMarkAsRead={markMessageAsRead}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
