import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { SalesRep } from '../types';
import { getSalesReps } from '../services/firebase';

interface CrewDirectoryModuleProps {
  currentUser: SalesRep | null;
}

const CrewDirectoryModule: React.FC<CrewDirectoryModuleProps> = ({ currentUser }) => {
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReps();
  }, []);

  const fetchReps = async () => {
    setIsLoading(true);
    try {
      const data = await getSalesReps();
      // Filter out current user and sort by name
      const filteredReps = data
        .filter(rep => rep.id !== currentUser?.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      setReps(filteredReps);
    } catch (error) {
      console.error('Error fetching reps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReps = reps.filter(rep =>
    rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rep.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
          <Users className="text-brand" size={32} />
          Sales Team
        </h1>
        <p className="text-slate-500 mt-2">Connect with your team members</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredReps.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400 font-bold">
              {searchQuery ? 'No team members found' : 'No team members available'}
            </p>
          </div>
        ) : (
          filteredReps.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-slate-100 p-6 text-center hover:shadow-lg transition-all"
            >
              {/* Avatar */}
              <div className="mb-4 flex justify-center">
                {rep.profilePicUrl ? (
                  <img
                    src={rep.profilePicUrl}
                    alt={rep.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-slate-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-black text-slate-600">
                    {rep.avatar || rep.name[0]}
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="text-lg font-bold text-slate-900 mb-1">{rep.name}</h3>

              {/* Role Badge */}
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${
                rep.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {rep.role === 'admin' ? 'Admin' : 'Sales Rep'}
              </span>

              {/* Email */}
              <p className="text-xs text-slate-500 truncate px-2">{rep.email}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-2xl font-black text-brand">{rep.totalSchools}</p>
                  <p className="text-xs text-slate-500 font-bold">Schools</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-600">{rep.activeCommissions}</p>
                  <p className="text-xs text-slate-500 font-bold">Active</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CrewDirectoryModule;
