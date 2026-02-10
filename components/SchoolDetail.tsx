import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Send, Sparkles, 
  User, Users, MailCheck, GraduationCap,
  Zap, BarChart3, Clock, XCircle, Info, Calendar, CheckSquare, TrendingUp,
  Phone, MoreHorizontal, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { School, SalesStage } from '../types';
import { STAGE_CONFIG } from '../constants';
import { generatePersonalizedEmail, getSalesAdvice } from '../services/gemini';

interface SchoolDetailProps {
  school: School;
  onBack: () => void;
  onUpdateStage: (schoolId: string, newStage: SalesStage) => void;
}

const SchoolDetail: React.FC<SchoolDetailProps> = ({ school, onBack, onUpdateStage }) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'ai_coach' | 'emails'>('activity');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState<string>('');

  const handleUpdate = (newStage: SalesStage) => {
    onUpdateStage(school.id, newStage);
  };

  const handleGetAdvice = async () => {
    setIsLoadingAdvice(true);
    const advice = await getSalesAdvice(school.stage);
    setAiAdvice(advice);
    setIsLoadingAdvice(false);
    setActiveTab('ai_coach');
  };

  const handleGenerateEmail = async (type: 'problem' | 'solution' | 'social' | 'nudge') => {
    setIsGeneratingEmail(true);
    const email = await generatePersonalizedEmail(school.name, school.principalName, type);
    setDraftEmail(email || '');
    setActiveTab('emails');
    setIsGeneratingEmail(false);
    handleUpdate(SalesStage.EMAIL_SENT);
  };

  const stages = [
    SalesStage.COLD_LEAD,
    SalesStage.EMAIL_SENT,
    SalesStage.MORE_INFO_REQUESTED,
    SalesStage.APPOINTMENT_BOOKED,
    SalesStage.FINALIZING,
    SalesStage.LETTER_DISTRIBUTION,
    SalesStage.COMPLETED
  ];

  const currentIdx = stages.indexOf(school.stage);
  const nextStage = stages[currentIdx + 1];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 bg-slate-50/50 -m-4 md:-m-8">
      {/* Main Detail Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* Top Navigation / Breadcrumbs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center text-xs font-medium text-slate-500 gap-2">
             <button onClick={onBack} className="hover:text-slate-900 transition-colors flex items-center gap-1">
               <ArrowLeft size={14} /> Back
             </button>
             <span className="text-slate-300">/</span>
             <span className="font-semibold text-slate-900">Pipeline: Sales Pipeline</span>
             <span className="text-slate-300">/</span>
             <span className="text-slate-500">Stage: {school.stage}</span>
          </div>
          <div className="text-xs font-semibold text-slate-400 hidden md:block">
            Last updated: Today, 9:41 AM
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="mb-8 w-full overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex items-center min-w-max px-1">
            {stages.map((stage, idx) => {
              const isCompleted = currentIdx > idx;
              const isCurrent = currentIdx === idx;
              return (
                <div key={stage} className={`flex items-center ${idx !== stages.length - 1 ? 'flex-1' : ''}`}>
                  <div 
                    className={`
                      relative flex items-center justify-center px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap z-10 transition-all
                      ${isCurrent ? 'bg-brand text-slate-900 shadow-md ring-2 ring-white scale-105' : 
                        isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}
                    `}
                  >
                    {stage.replace(/\(.*?\)/, '').trim()}
                  </div>
                  {idx !== stages.length - 1 && (
                    <div className={`h-0.5 w-8 md:w-12 mx-2 ${isCompleted ? 'bg-emerald-100' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">
          
          {/* LEFT SIDEBAR: Deal Info */}
          <div className="w-full xl:w-80 space-y-6 flex-shrink-0 lg:sticky lg:top-0">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Hot Lead</span>
                <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{school.track}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{school.name}</h1>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleGenerateEmail('problem')}
                className="flex-1 bg-brand hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-200/50 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                <PlusIcon className="w-4 h-4" />
                New Activity
              </button>
              <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Value</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-slate-900 tracking-tight">R{(school.studentCount * 5).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-1 rounded-lg">Potential</span>
              </div>
            </div>

            <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-wider">Contact Details</h3>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                    {school.principalName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{school.principalName}</p>
                    <p className="text-xs text-slate-500 mb-2">Principal</p>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand cursor-pointer transition-colors group">
                         <div className="p-1.5 bg-slate-50 rounded-md group-hover:bg-brand group-hover:text-white transition-colors"><Mail size={12} /></div>
                         <span className="font-medium">principal@school.co.za</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand cursor-pointer transition-colors group">
                         <div className="p-1.5 bg-slate-50 rounded-md group-hover:bg-brand group-hover:text-white transition-colors"><Phone size={12} /></div>
                         <span className="font-medium">+(27) 82 555 0123</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Salesperson</h3>
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                     SA
                   </div>
                   <div> 
                     <span className="text-sm font-bold text-slate-900 block">Sales Admin</span>
                     <span className="text-xs text-slate-400">Owner</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN: Activity & Tabs */}
          <div className="flex-1 bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm min-h-[600px]">
             {/* Tabs */}
             <div className="flex items-center gap-8 border-b border-slate-100 mb-8 overflow-x-auto">
               {['activity', 'ai_coach', 'emails'].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`text-sm font-bold capitalize transition-all pb-4 -mb-[1px] border-b-2 whitespace-nowrap px-1 ${
                     activeTab === tab 
                     ? 'text-slate-900 border-brand' 
                     : 'text-slate-400 border-transparent hover:text-slate-600'
                   }`}
                 >
                   {tab.replace('_', ' ')}
                 </button>
               ))}
             </div>

             {/* Tab Content */}
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
               
               {activeTab === 'activity' && (
                 <>
                   <div className="flex flex-col gap-4">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                       <h3 className="text-sm font-bold text-slate-900 mb-2">Stage Management</h3>
                       <p className="text-xs text-slate-500 mb-4">Current stage is <span className="font-bold text-slate-900">{school.stage}</span>.</p>
                       
                       <div className="flex flex-wrap gap-2">
                         {nextStage && (
                           <button 
                             onClick={() => handleUpdate(nextStage)}
                             className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/10"
                           >
                             Move to {nextStage}
                           </button>
                         )}
                         <button 
                           onClick={() => handleUpdate(SalesStage.NOT_INTERESTED)}
                           className="bg-white border border-slate-200 text-rose-500 px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-50 hover:border-rose-200 transition-all"
                         >
                           Mark Lost
                         </button>
                       </div>
                     </div>
                   </div>

                   <div className="relative pl-6 space-y-8 border-l-2 border-slate-100 ml-3">
                     {/* Timeline Item 1 */}
                     <div className="relative group">
                       <div className="absolute -left-[31px] bg-emerald-50 p-1.5 rounded-full border-4 border-white group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                       </div>
                       <div className="flex justify-between items-start mb-1">
                         <p className="text-sm font-bold text-slate-900">System: Deal Created</p>
                         <span className="text-[10px] font-bold text-slate-400">Today, 9:00 AM</span>
                       </div>
                       <p className="text-xs text-slate-500 line-clamp-2">
                         Added to pipeline automatically via API.
                       </p>
                     </div>

                     {/* Timeline Item 2 */}
                     <div className="relative group">
                       <div className="absolute -left-[31px] bg-blue-50 p-1.5 rounded-full border-4 border-white group-hover:scale-110 transition-transform">
                          <TrendingUp size={16} className="text-blue-500" />
                       </div>
                       <div className="flex justify-between items-start mb-1">
                         <p className="text-sm font-bold text-slate-900">Current Stage: {school.stage}</p>
                         <span className="text-[10px] font-bold text-slate-400">Just now</span>
                       </div>
                       <div className="mt-2 bg-slate-50 p-3 rounded-xl text-xs text-slate-600 border border-slate-100">
                         Waiting for action from sales representative.
                       </div>
                     </div>
                   </div>
                 </>
               )}

               {activeTab === 'ai_coach' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm"><Sparkles size={24} /></div>
                      <div>
                        <h4 className="font-bold text-slate-900">AI Sales Coach</h4>
                        <p className="text-xs text-indigo-700/80 mt-1">
                           Get tactical advice for the {school.stage} stage.
                        </p>
                      </div>
                      <button 
                         onClick={handleGetAdvice}
                         className="ml-auto px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200"
                       >
                         {isLoadingAdvice ? 'Thinking...' : 'Analyze Deal'}
                       </button>
                    </div>

                    {aiAdvice && (
                      <div className="p-6 bg-white border border-slate-100 rounded-2xl prose prose-sm max-w-none text-slate-600 leading-relaxed shadow-sm">
                        {aiAdvice}
                      </div>
                    )}
                  </div>
               )}

               {activeTab === 'emails' && (
                 <div className="grid grid-cols-2 gap-4">
                   <button 
                      onClick={() => handleGenerateEmail('problem')}
                      className="p-4 border border-slate-200 rounded-2xl hover:border-brand hover:bg-brand/5 hover:shadow-lg transition-all text-left group"
                    >
                      <Mail className="text-slate-400 group-hover:text-brand mb-3" size={24} />
                      <h4 className="font-bold text-slate-900 text-sm">Cold Outreach</h4>
                      <p className="text-xs text-slate-500 mt-1">Initial contact focusing on pain points.</p>
                    </button>
                    <button 
                      onClick={() => handleGenerateEmail('nudge')}
                      className="p-4 border border-slate-200 rounded-2xl hover:border-brand hover:bg-brand/5 hover:shadow-lg transition-all text-left group"
                    >
                      <Send className="text-slate-400 group-hover:text-brand mb-3" size={24} />
                      <h4 className="font-bold text-slate-900 text-sm">Follow Up</h4>
                      <p className="text-xs text-slate-500 mt-1">Gentle check-in after no response.</p>
                    </button>
                    
                    {draftEmail && (
                      <div className="col-span-2 mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold uppercase text-slate-400">Draft Content</span>
                          <button className="text-xs font-bold text-brand">Copy</button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600">{draftEmail}</pre>
                      </div>
                    )}
                 </div>
               )}

             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for the icon
const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

export default SchoolDetail;
