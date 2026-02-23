import React, { useMemo } from 'react';
import { School, SalesRep, SalesStage } from '../types';

interface AnalyticsStrategyProps {
  currentUser: SalesRep | null;
  schools: School[];
  onBack: () => void;
}

const AnalyticsStrategy: React.FC<AnalyticsStrategyProps> = ({ currentUser, schools, onBack }) => {
  const mySchools = useMemo(() => schools.filter(s => s.salesRepId === currentUser?.id), [schools, currentUser]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = mySchools.length;
    if (total === 0) return {
      acquisition: 0,
      engagement: 0,
      commission: 0,
      earned: 0,
      target: 20000,
      leads: { available: 0, communication: 0, appointment: 0, outcome: 0, letter: 0, completed: 0 },
      attempts: 0,
      activeSchools: 0
    };

    // Acquisition: schools in early stages (Available + Communication)
    const availableSchools = mySchools.filter(s => s.stage === SalesStage.AVAILABLE).length;
    const communicationSchools = mySchools.filter(s => s.stage === SalesStage.COMMUNICATION).length;
    const acquisition = Math.round(((availableSchools + communicationSchools) / total) * 100);

    // Engagement: schools with attempts > 0
    const engagedSchools = mySchools.filter(s => s.attempts && s.attempts.length > 0).length;
    const engagement = Math.round((engagedSchools / total) * 100);

    // Commission: earned (studentCount * 5) vs target (20000)
    const earned = mySchools.reduce((acc, s) => acc + ((s.studentCount || 0) * 5), 0);
    const commission = Math.round((earned / 20000) * 100);

    // Count attempts
    const totalAttempts = mySchools.reduce((acc, s) => acc + (s.attempts?.length || 0), 0);

    // Count by stage
    const appointmentSchools = mySchools.filter(s => s.stage === SalesStage.APPOINTMENT).length;
    const outcomeSchools = mySchools.filter(s => s.stage === SalesStage.OUTCOME_REACHED).length;
    const letterSchools = mySchools.filter(s => s.stage === SalesStage.DISTRIBUTE_LETTER).length;
    const completedSchools = mySchools.filter(s => s.stage === SalesStage.COMPLETED).length;

    return {
      acquisition,
      engagement,
      commission: Math.min(commission, 100), // Cap at 100%
      earned,
      target: 20000,
      leads: {
        available: availableSchools,
        communication: communicationSchools,
        appointment: appointmentSchools,
        outcome: outcomeSchools,
        letter: letterSchools,
        completed: completedSchools
      },
      attempts: totalAttempts,
      activeSchools: engagedSchools,
      totalSchools: total
    };
  }, [mySchools]);

  const recommendations = [
    {
      title: 'Focus on Quick Wins',
      description: `You have ${metrics.leads.communication} schools in communication stage. Follow up with these to move them to appointments.`,
      priority: metrics.leads.communication > 0 ? 'high' : 'low'
    },
    {
      title: 'Increase Contact Frequency',
      description: `You've made ${metrics.attempts} total contact attempts. Aim for 2-3 touches per school to improve conversion.`,
      priority: 'medium'
    },
    {
      title: 'Target Engagement',
      description: `${metrics.activeSchools} of your ${metrics.totalSchools} schools have been engaged. Focus on reaching the remaining ${metrics.totalSchools - metrics.activeSchools} schools.`,
      priority: metrics.totalSchools - metrics.activeSchools > 5 ? 'high' : 'low'
    },
    {
      title: 'Completion Momentum',
      description: `You have ${metrics.leads.completed} completed schools. Each completion generates consistent commission revenue.`,
      priority: 'info'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 font-bold text-sm"
          >
            ← Back
          </button>
        </div>
        <h1 className="font-black text-2xl">Strategy & Analytics</h1>
        <p className="text-sm text-slate-600 mt-1">Detailed performance metrics and recommendations</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8 max-w-6xl">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Acquisition */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acquisition Rate</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{metrics.acquisition}%</p>
              </div>
              <p className="text-sm text-slate-600">
                {metrics.leads.available + metrics.leads.communication} of {metrics.totalSchools} schools in early stages (Available + Communication)
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Available</span>
                    <span className="font-bold">{metrics.leads.available}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Communication</span>
                    <span className="font-bold">{metrics.leads.communication}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Engagement Rate</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{metrics.engagement}%</p>
              </div>
              <p className="text-sm text-slate-600">
                {metrics.activeSchools} of {metrics.totalSchools} schools have been contacted
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Total Attempts</span>
                    <span className="font-bold">{metrics.attempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg per School</span>
                    <span className="font-bold">{metrics.activeSchools > 0 ? (metrics.attempts / metrics.activeSchools).toFixed(1) : 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Commission Progress</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{metrics.commission}%</p>
              </div>
              <p className="text-sm text-slate-600">
                R{metrics.earned.toLocaleString()} / R{metrics.target.toLocaleString()} target
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-slate-900 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(metrics.commission, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="font-black text-base mb-6">Smart Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((rec, idx) => (
                <div 
                  key={idx} 
                  className="rounded-lg border border-slate-200 p-6 bg-white"
                >
                  <h4 className="font-black text-base mb-2">{rec.title}</h4>
                  <p className="text-sm text-slate-600">{rec.description}</p>
                  {rec.priority === 'high' && (
                    <div className="mt-3 inline-block bg-slate-100 text-slate-900 px-3 py-1 rounded text-xs font-bold">
                      High Priority
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-black text-base mb-4">Quick Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Total Schools</p>
                <p className="text-2xl font-black mt-2">{metrics.totalSchools}</p>
              </div>
              <div>
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Engaged Schools</p>
                <p className="text-2xl font-black mt-2">{metrics.activeSchools}</p>
              </div>
              <div>
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Completed Deals</p>
                <p className="text-2xl font-black mt-2">{metrics.leads.completed}</p>
              </div>
              <div>
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Monthly Recurring</p>
                <p className="text-2xl font-black mt-2">R{metrics.earned.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsStrategy;
