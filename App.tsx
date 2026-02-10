
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
import { School, SalesRep, SalesStage, TrackType } from './types';
import { 
  getSchoolsFromFirebase, 
  addSchoolToFirebase, 
  updateSchoolStageInFirebase 
} from './services/firebase';
import { MOCK_SCHOOLS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SalesRep | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch schools on mount or when user changes
  useEffect(() => {
    if (currentUser) {
      const loadData = async () => {
        const firebaseSchools = await getSchoolsFromFirebase();
        setSchools(firebaseSchools);
        setIsLoading(false);
      };
      loadData();
    }
  }, [currentUser]);

  const handleLogin = (rep: SalesRep) => {
    setCurrentUser(rep);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSelectedSchoolId(null);
    setIsDrawerOpen(false);
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
      salesRepId: currentUser?.id || 'rep1',
      salesRepName: `${currentUser?.name} ${currentUser?.surname || ''}`.trim(),
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
    const success = await updateSchoolStageInFirebase(schoolId, newStage);
    if (success) {
      setSchools(schools.map(s => s.id === schoolId ? { ...s, stage: newStage, lastContactDate: new Date().toISOString().split('T')[0] } : s));
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
    </div>
  );
};

export default App;
