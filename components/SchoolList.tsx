
import React, { useState } from 'react';
import { Search, Plus, ChevronRight, User, Filter, School as SchoolIcon, Eye, EyeOff, Trash2, Check } from 'lucide-react';
import { STAGE_CONFIG } from '../constants';
import { School, SalesRep, SalesStage } from '../types';
import { deleteSchool } from '../services/firebase';

interface SchoolListProps {
  onSelectSchool: (school: School) => void;
  onAddSchool: () => void;
  currentUser: SalesRep | null;
  schools: School[];
}

const SchoolList: React.FC<SchoolListProps> = ({ onSelectSchool, onAddSchool, currentUser, schools: allSchools }) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Admin users default to 'Team' view, regular reps default to 'Mine'
  const [repFilter, setRepFilter] = useState<'all' | 'mine'>(currentUser?.role === 'admin' ? 'all' : 'mine');
  const [stageFilter, setStageFilter] = useState<'all' | 'available' | 'communication' | 'appointment' | 'completed'>('all');
  const [hideNoEmail, setHideNoEmail] = useState(true);
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);

  // Debug log
  React.useEffect(() => {
    console.log('🏫 SchoolList received schools:', allSchools.length, 'Filter:', repFilter, 'Stage:', stageFilter);
  }, [allSchools, repFilter, stageFilter]);

  // Map old stage values to new ones for backwards compatibility
  const getMappedStage = (stage: string): string => {
    const stageMap: Record<string, string> = {
      'Available': SalesStage.AVAILABLE,
      'Cold Lead': SalesStage.AVAILABLE,
      'Fresh': SalesStage.AVAILABLE,
      'Communication': SalesStage.COMMUNICATION,
      'Email Sent': SalesStage.COMMUNICATION,
      'Email': SalesStage.COMMUNICATION,
      'More Info': SalesStage.COMMUNICATION,
      'More Info Requested': SalesStage.COMMUNICATION,
      'Appointment': SalesStage.APPOINTMENT,
      'Appointment Booked': SalesStage.APPOINTMENT,
      'Outcome Reached': SalesStage.OUTCOME_REACHED,
      'Finalizing': SalesStage.OUTCOME_REACHED,
      'Distribute Letter': SalesStage.DISTRIBUTE_LETTER,
      'Letter Distribution': SalesStage.DISTRIBUTE_LETTER,
      'Completed': SalesStage.COMPLETED,
      'Not Interested': SalesStage.AVAILABLE
    };
    
    return stageMap[stage] || stage;
  };

  // Rep filtering logic: 
  // - "Mine" view: Show schools assigned to user + Available schools (available to all)
  // - "Team" view: Show all schools
  const repFilteredSchools = repFilter === 'mine' 
    ? allSchools.filter(s => s.salesRepId === currentUser?.id || getMappedStage(s.stage) === SalesStage.AVAILABLE)
    : allSchools;

  // Apply stage filter
  const stageFilteredSchools = repFilteredSchools.filter(s => {
    const mappedStage = getMappedStage(s.stage);
    if (stageFilter === 'all') return true;
    // 'available' = any school before appointment (Available or Communication stages)
    if (stageFilter === 'available') return mappedStage === SalesStage.AVAILABLE || mappedStage === SalesStage.COMMUNICATION;
    if (stageFilter === 'communication') return mappedStage === SalesStage.COMMUNICATION;
    if (stageFilter === 'appointment') return mappedStage === SalesStage.APPOINTMENT;
    if (stageFilter === 'completed') return mappedStage === SalesStage.COMPLETED;
    return true;
  });

  // Apply search filter
  const filteredSchools = stageFilteredSchools.filter(s => {
    // Search filter
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.salesRepName ? s.salesRepName.toLowerCase().includes(searchTerm.toLowerCase()) : false);
    
    // Email filter
    const hasEmail = s.principalEmail && s.principalEmail.trim() !== '';
    const matchesEmail = !hideNoEmail || hasEmail;
    
    return matchesSearch && matchesEmail;
  });

  // Helper function to determine if school should display a rep
  const shouldShowRep = (school: School) => {
    const mappedStage = getMappedStage(school.stage);
    return school.salesRepId && school.salesRepName && 
      (mappedStage === SalesStage.APPOINTMENT || 
       mappedStage === SalesStage.OUTCOME_REACHED || 
       mappedStage === SalesStage.DISTRIBUTE_LETTER || 
       mappedStage === SalesStage.COMPLETED);
  };

  const getRepDisplay = (school: School) => {
    if (shouldShowRep(school)) {
      return `Rep: ${school.salesRepName}`;
    }
    return 'Rep: Unassigned';
  };

  // Toggle school selection
  const toggleSelection = (schoolId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedSchools);
    if (newSelected.has(schoolId)) {
      newSelected.delete(schoolId);
    } else {
      newSelected.add(schoolId);
    }
    setSelectedSchools(newSelected);
  };

  // Select/deselect all displayed schools
  const toggleSelectAll = () => {
    if (selectedSchools.size === filteredSchools.length) {
      setSelectedSchools(new Set());
    } else {
      setSelectedSchools(new Set(filteredSchools.map(s => s.id)));
    }
  };

  // Delete selected schools
  const handleDeleteSelected = async () => {
    if (selectedSchools.size === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedSchools.size} school${selectedSchools.size > 1 ? 's' : ''}? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedSchools).map(schoolId => deleteSchool(schoolId));
      await Promise.all(deletePromises);
      setSelectedSchools(new Set());
    } catch (error) {
      console.error('Error deleting schools:', error);
      alert('Error deleting schools. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Schools</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {selectedSchools.size > 0 
              ? `${selectedSchools.size} school${selectedSchools.size > 1 ? 's' : ''} selected`
              : 'Real-time lead status.'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {selectedSchools.size > 0 && currentUser?.role === 'admin' && (
            <button 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full md:rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest transition-all"
            >
              <Trash2 size={18} />
              {isDeleting ? 'Deleting...' : `Delete (${selectedSchools.size})`}
            </button>
          )}
          <button 
            onClick={onAddSchool}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 text-slate-900 px-6 py-3.5 md:px-8 md:py-4 rounded-full md:rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand/20"
          >
            <Plus size={18} />
            New School
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-50 bg-slate-50/30 space-y-4">
          {/* Select All Checkbox */}
          {filteredSchools.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all">
              <button
                onClick={toggleSelectAll}
                className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all ${
                  selectedSchools.size === filteredSchools.length && filteredSchools.length > 0
                    ? 'bg-brand border-brand'
                    : 'border-slate-300 hover:border-brand'
                }`}
              >
                {(selectedSchools.size === filteredSchools.length && filteredSchools.length > 0) && (
                  <Check size={16} className="text-slate-900" />
                )}
              </button>
              <span className="text-xs font-bold text-slate-600">
                {selectedSchools.size === filteredSchools.length && filteredSchools.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </span>
            </div>
          )}

          {/* Rep Filter (Mine/Team) */}
          <div className="flex w-full bg-white p-1 rounded-full border border-slate-100">
            <button 
              onClick={() => setRepFilter('mine')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${repFilter === 'mine' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
            >
              Mine
            </button>
            <button 
              onClick={() => setRepFilter('all')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${repFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
            >
              Team
            </button>
          </div>

          {/* Stage Filter Dropdown */}
          <div className="relative w-full md:w-64">
            <button 
              onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
              className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-full text-slate-900 font-black text-xs uppercase tracking-widest hover:border-slate-300 transition-all text-left flex items-center justify-between"
            >
              <span>{stageFilter === 'all' ? 'All Stages' : stageFilter.charAt(0).toUpperCase() + stageFilter.slice(1)}</span>
              <svg className={`w-4 h-4 transition-transform ${stageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9l7 7 7-7" />
              </svg>
            </button>
            {stageDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-10">
                <button 
                  onClick={() => { setStageFilter('all'); setStageDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 font-black text-xs uppercase tracking-widest transition-all ${stageFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  All Stages
                </button>
                <button 
                  onClick={() => { setStageFilter('available'); setStageDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 font-black text-xs uppercase tracking-widest transition-all ${stageFilter === 'available' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Available
                </button>
                <button 
                  onClick={() => { setStageFilter('communication'); setStageDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 font-black text-xs uppercase tracking-widest transition-all ${stageFilter === 'communication' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Communication
                </button>
                <button 
                  onClick={() => { setStageFilter('appointment'); setStageDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 font-black text-xs uppercase tracking-widest transition-all ${stageFilter === 'appointment' ? 'bg-purple-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Appointment
                </button>
                <button 
                  onClick={() => { setStageFilter('completed'); setStageDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 font-black text-xs uppercase tracking-widest transition-all ${stageFilter === 'completed' ? 'bg-green-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Completed
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full flex flex-col md:flex-row md:items-center gap-2">
            <button
              onClick={() => setHideNoEmail(!hideNoEmail)}
              className={`md:p-2.5 md:rounded-xl p-2.5 rounded-xl transition-all w-full md:w-auto flex items-center justify-start md:justify-center gap-2 md:gap-0 ${
                hideNoEmail 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900'
              }`}
              title={hideNoEmail ? 'Show all schools' : 'Hide schools without email'}
            >
              {hideNoEmail ? <Eye size={18} /> : <EyeOff size={18} />}
              <span className="md:hidden text-[10px] font-black uppercase tracking-widest">
                {hideNoEmail ? 'Hide No Email' : 'Show All'}
              </span>
            </button>
            <div className="relative w-full flex items-center gap-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-full focus:outline-none focus:ring-4 focus:ring-brand/5 transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Card Layout for Mobile */}
        <div className="md:hidden divide-y divide-slate-50">
          {filteredSchools.map((school) => (
            <div 
              key={school.id} 
              className={`p-5 flex items-center gap-4 transition-all cursor-pointer ${
                selectedSchools.has(school.id) 
                  ? 'bg-brand/10 border-l-4 border-brand pl-5' 
                  : 'active:bg-slate-50'
              }`}
              onClick={() => onSelectSchool(school as any)}
            >
              <button
                onClick={(e) => toggleSelection(school.id, e)}
                className={`flex items-center justify-center w-6 h-6 rounded border-2 shrink-0 transition-all ${
                  selectedSchools.has(school.id)
                    ? 'bg-brand border-brand'
                    : 'border-slate-300 hover:border-brand'
                }`}
              >
                {selectedSchools.has(school.id) && (
                  <Check size={16} className="text-slate-900" />
                )}
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <SchoolIcon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="block font-black text-slate-900 text-base truncate pr-2">{school.name}</span>
                  <span className="text-[10px] font-black text-brand">{school.engagementRate}%</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${STAGE_CONFIG[getMappedStage(school.stage)]?.color || 'bg-gray-100 text-gray-500'}`}>
                    {getMappedStage(school.stage)?.split('(')[0] || 'Unknown'}
                  </span>
                  <span className={`text-[10px] font-bold ${shouldShowRep(school) ? 'text-slate-600' : 'text-slate-400'}`}>
                    {getRepDisplay(school)}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-200" />
            </div>
          ))}
        </div>

        {/* Table for Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-slate-50 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6 w-12">
                  <button
                    onClick={toggleSelectAll}
                    className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all ${
                      selectedSchools.size === filteredSchools.length && filteredSchools.length > 0
                        ? 'bg-brand border-brand'
                        : 'border-slate-300 hover:border-brand'
                    }`}
                  >
                    {(selectedSchools.size === filteredSchools.length && filteredSchools.length > 0) && (
                      <Check size={16} className="text-slate-900" />
                    )}
                  </button>
                </th>
                <th className="px-8 py-6">School & Ownership</th>
                <th className="px-8 py-6">Sales Phase</th>
                <th className="px-8 py-6">Capacity</th>
                <th className="px-8 py-6">Revenue Potential</th>
                <th className="px-8 py-6 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSchools.map((school) => (
                <tr 
                  key={school.id} 
                  className={`group hover:bg-slate-50/50 transition-all cursor-pointer ${
                    selectedSchools.has(school.id) ? 'bg-brand/10' : ''
                  }`}
                  onClick={() => onSelectSchool(school as any)}
                >
                  <td className="px-8 py-6 w-12">
                    <button
                      onClick={(e) => toggleSelection(school.id, e)}
                      className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all ${
                        selectedSchools.has(school.id)
                          ? 'bg-brand border-brand'
                          : 'border-slate-300 hover:border-brand'
                      }`}
                    >
                      {selectedSchools.has(school.id) && (
                        <Check size={16} className="text-slate-900" />
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <SchoolIcon size={20} />
                      </div>
                      <div>
                        <span className="block font-black text-slate-900 text-lg group-hover:text-brand transition-colors">{school.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User size={12} className={shouldShowRep(school) ? "text-slate-600" : "text-slate-300"} />
                          <span className={`text-xs font-bold ${shouldShowRep(school) ? 'text-slate-600' : 'text-slate-400'}`}>
                            {getRepDisplay(school)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${STAGE_CONFIG[getMappedStage(school.stage)]?.color || 'bg-slate-100 text-slate-600'}`}>
                      {STAGE_CONFIG[getMappedStage(school.stage)]?.icon || null}
                      {getMappedStage(school.stage)}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700">{school.studentCount || '—'}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Learners</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-brand">{school.studentCount ? `R${(school.studentCount * 5).toLocaleString()}` : '—'}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Commission</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="text-right">
                        <span className="block text-xs font-black text-slate-900">{school.engagementRate}%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Activity</span>
                      </div>
                      <ChevronRight size={18} className="text-slate-200 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchoolList;
