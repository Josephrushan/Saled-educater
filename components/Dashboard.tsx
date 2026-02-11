
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { TrendingUp, Users, DollarSign, School as SchoolIcon, Star, Zap } from 'lucide-react';
import { School, SalesRep } from '../types';
import { seedSchoolsDatabase } from '../services/firebase';

interface DashboardProps {
  currentUser: SalesRep | null;
  schools: School[];
  onSchoolsUpdated?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, schools, onSchoolsUpdated }) => {
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  
  const mySchools = schools.filter(s => s.salesRepId === currentUser?.id);
  
  const handleSeedSchools = async () => {
    setSeeding(true);
    setSeedMessage('Seeding schools...');
    try {
      await seedSchoolsDatabase();
      setSeedMessage('✅ Successfully added 100 schools!');
      setTimeout(() => {
        setSeedMessage(null);
        onSchoolsUpdated?.();
        window.location.reload();
      }, 2000);
    } catch (error) {
      setSeedMessage('❌ Failed to seed schools');
      console.error(error);
      setSeeding(false);
      setTimeout(() => setSeedMessage(null), 3000);
    }
  };
  
  const stats = [
    { label: 'My Schools', value: mySchools.length, icon: <SchoolIcon className="text-slate-900" />, sub: 'Owned by you' },
    { label: 'Active Commission', value: `R${(mySchools.reduce((acc, s) => acc + (s.studentCount * 5), 0)).toLocaleString()}`, icon: <DollarSign className="text-brand" />, sub: 'Monthly recurring' },
    { label: 'Global Schools', value: schools.length, icon: <Users className="text-slate-400" />, sub: 'Educater Network' },
    { label: 'Top Engagement', value: '92%', icon: <Star className="text-brand" />, sub: 'Engagement Track' },
  ];

  const chartData = [
    { name: 'Mon', count: 2 },
    { name: 'Tue', count: 5 },
    { name: 'Wed', count: 3 },
    { name: 'Thu', count: 8 },
    { name: 'Fri', count: 6 },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Welcome, {currentUser?.name.split(' ')[0]}</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Performance snapshot for today.</p>
        </div>
        {currentUser?.role === 'admin' && schools.length < 100 && (
          <button
            onClick={handleSeedSchools}
            disabled={seeding}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            <Zap size={16} />
            {seeding ? 'Seeding...' : 'Seed Schools'}
          </button>
        )}
      </div>

      {seedMessage && (
        <div className={`p-4 rounded-xl font-medium text-sm ${
          seedMessage.includes('✅') 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : seedMessage.includes('❌')
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {seedMessage}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all duration-300">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className="p-2.5 md:p-3.5 bg-slate-50 rounded-xl md:rounded-2xl text-slate-900">{stat.icon}</div>
              <div className="text-[8px] md:text-[10px] font-black text-slate-900 bg-brand px-2 py-0.5 md:py-1 rounded-full uppercase tracking-widest">Live</div>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">{stat.label}</p>
            <p className="text-xl md:text-3xl font-black text-slate-900 mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8 md:mb-10">
            <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Leads Activity</h3>
            <select className="bg-slate-50 text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-xl border-none outline-none">
              <option>This Week</option>
              <option>Month</option>
            </select>
          </div>
          <div className="h-48 md:h-72 w-full min-h-[200px]">
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff8e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00ff8e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#00ff8e" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg md:text-xl font-black mb-1 tracking-tight">Milestones</h3>
            <p className="text-slate-400 text-xs font-medium mb-6 md:mb-8">Strategy to maximize commission.</p>
            
            <div className="space-y-5 md:space-y-6">
              {[
                { label: 'Acquisition', desc: '5 Leads pending', val: 65 },
                { label: 'Engagement', desc: 'Onboarding active', val: 32 },
                { label: 'Commission', desc: 'Target R15k', val: 80 }
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span>{item.label}</span>
                    <span className="text-brand">{item.val}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{width: `${item.val}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 md:mt-10 bg-brand hover:bg-brand/90 text-slate-900 py-3.5 md:py-4 rounded-2xl font-black text-[11px] md:text-sm transition-all tracking-widest uppercase shadow-lg shadow-brand/20">
              View Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
