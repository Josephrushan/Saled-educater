
import React, { useState, useEffect } from 'react';
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
import { School, SalesRep, SalesStage, TrackType } from './types';
import { 
  getSchoolsFromFirebase, 
  addSchoolToFirebase, 
  updateSchoolStageInFirebase,
  updateSchoolContactInfo,
  deleteSchool,
  seedSchoolsDatabase
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
      case 'direct-message': return <DirectMessageModule currentUser={currentUser} />;
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
          setActiveTab={setActiveTab} 
          currentUser={currentUser}
          onLogout={handleLogout}
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
        setActiveTab={setActiveTab} 
      />

      {showAddModal && (
        <AddSchoolModal onClose={() => setShowAddModal(false)} onSubmit={handleAddSchool} />
      )}
      
      <PWAControls />
    </div>
  );
};

export default App;
