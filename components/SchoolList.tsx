
import React, { useState } from 'react';
import { Search, Plus, ChevronRight, User, Filter, School as SchoolIcon } from 'lucide-react';
import { STAGE_CONFIG } from '../constants';
import { School, SalesRep, SalesStage } from '../types';

interface SchoolListProps {
  onSelectSchool: (school: School) => void;
  onAddSchool: () => void;
  currentUser: SalesRep | null;
  schools: School[];
}

const SchoolList: React.FC<SchoolListProps> = ({ onSelectSchool, onAddSchool, currentUser, schools: allSchools }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'mine'>('mine');

  // Only show schools assigned to current user in "Mine" view
  // Don't filter by stage - the stage filter happens elsewhere
  const schools = filter === 'mine' 
    ? allSchools.filter(s => s.salesRepId === currentUser?.id)
    : allSchools;

  // Log for debugging
  React.useEffect(() => {
    console.log('CurrentUser ID:', currentUser?.id);
    console.log('Total schools:', allSchools.length);
    console.log('Filtered schools (Mine):', schools.length);
    console.log('Schools:', allSchools.map(s => ({ name: s.name, salesRepId: s.salesRepId, currentId: currentUser?.id })));
  }, [currentUser, allSchools, schools]);

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.salesRepName ? s.salesRepName.toLowerCase().includes(searchTerm.toLowerCase()) : false)
  );

  // Helper function to determine if school should display a rep
  const shouldShowRep = (school: School) => {
    return school.salesRepId && school.salesRepName && 
      (school.stage === SalesStage.APPOINTMENT_BOOKED || 
       school.stage === SalesStage.FINALIZING || 
       school.stage === SalesStage.LETTER_DISTRIBUTION || 
       school.stage === SalesStage.COMPLETED);
  };

  const getRepDisplay = (school: School) => {
    if (shouldShowRep(school)) {
      return `Rep: ${school.salesRepName}`;
    }
    return 'Rep: Unassigned';
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Schools</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Real-time lead status.</p>
        </div>
        <button 
          onClick={onAddSchool}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 text-slate-900 px-6 py-3.5 md:px-8 md:py-4 rounded-2xl md:rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand/20"
        >
          <Plus size={18} />
          New Lead
        </button>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex w-full md:w-auto bg-white p-1 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setFilter('mine')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'mine' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
            >
              Mine
            </button>
            <button 
              onClick={() => setFilter('all')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
            >
              Team
            </button>
          </div>

          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/5 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Card Layout for Mobile */}
        <div className="md:hidden divide-y divide-slate-50">
          {filteredSchools.map((school) => (
            <div 
              key={school.id} 
              className="p-5 active:bg-slate-50 flex items-center gap-4 transition-all"
              onClick={() => onSelectSchool(school as any)}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <SchoolIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="block font-black text-slate-900 text-base truncate pr-2">{school.name}</span>
                  <span className="text-[10px] font-black text-brand">{school.engagementRate}%</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${STAGE_CONFIG[school.stage]?.color || 'bg-gray-100 text-gray-500'}`}>
                    {school.stage?.split('(')[0] || 'Unknown'}
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
                <th className="px-8 py-6">School & Ownership</th>
                <th className="px-8 py-6">Sales Phase</th>
                <th className="px-8 py-6">Capacity</th>
                <th className="px-8 py-6 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSchools.map((school) => (
                <tr 
                  key={school.id} 
                  className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                  onClick={() => onSelectSchool(school as any)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
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
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${STAGE_CONFIG[school.stage].color}`}>
                      {STAGE_CONFIG[school.stage].icon}
                      {school.stage}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700">{school.studentCount}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Learners</span>
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
