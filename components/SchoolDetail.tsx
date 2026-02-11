import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Send, Sparkles, 
  User, Users, MailCheck, GraduationCap,
  Zap, BarChart3, Clock, XCircle, Info, Calendar, CheckSquare, TrendingUp,
  Phone, MoreHorizontal, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { School, SalesStage } from '../types';
import { STAGE_CONFIG } from '../constants';

// Basic templates since AI is removed
const EMAIL_TEMPLATES: Record<string, (name: string, principal: string) => string> = {
  problem: (name, principal) => `Subject: Reducing Printing Costs at ${name}

Dear ${principal},

I hope you are well. I noticed many schools like ${name} are struggling with high paper costs (often over R1200/month per student in printing).

Educater helps specific schools go digital, saving significantly on these operational costs while improving parent engagement.

Would you be open to a 10-minute chat this week to see how much we could save you?

Best,
[Your Name]`,
  solution: (name, principal) => `Subject: Digital Solution for ${name}

Dear ${principal},

Following up on our paper-saving initiative. Educater isn't just about saving trees—it's about streamlining your entire school admin process.

Our platform handles:
- Digital homework & resources
- Instant parent communication
- Analytics for student performance

Let me know if you'd like a demo.

Best,
[Your Name]`,
  social: (name, principal) => `Subject: Quick question about ${name}'s digital strategy

Hi ${principal},

I saw ${name} recently posted about your sports day - looks like a great event!

We help schools capture these moments and share them securely with parents. Just wanted to connect and see if you have a digital strategy in place for this term?

Cheers,
[Your Name]`,
  nudge: (name, principal) => `Subject: Any thoughts on my previous email?

Hi ${principal},

Just floating this to the top of your inbox. I know term time is busy!

Do you have 5 minutes this week to discuss digital transformation for ${name}?

Best,
[Your Name]`
};

const SALES_ADVICE = [
  "Focus on the cost-saving benefit. Schools care about budget right now.",
  "Try to schedule a face-to-face meeting with the principal.",
  "Mention a nearby school that is already using Educater successfully.",
  "Send a short video demo of the parent app features.",
  "Follow up on Tuesday mornings - specifically between 9am and 10am."
];

// Confetti animation
const triggerConfetti = () => {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff', '#ff85a2'];
  const confettiPieces = 50;
  
  for (let i = 0; i < confettiPieces; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.animation = `fall ${2 + Math.random() * 1}s linear forwards`;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
};

// Add CSS animations - ensure they're in the DOM
if (typeof document !== 'undefined' && !document.getElementById('school-detail-styles')) {
  const style = document.createElement('style');
  style.id = 'school-detail-styles';
  style.innerHTML = `
    @keyframes fall {
      0% {
        opacity: 1;
        transform: translateY(0) rotate(0deg);
      }
      100% {
        opacity: 0;
        transform: translateY(100vh) rotate(360deg);
      }
    }
    @keyframes coinFall {
      0% {
        opacity: 1;
        transform: translateY(0) rotateY(0deg);
      }
      100% {
        opacity: 0;
        transform: translateY(100vh) rotateY(720deg);
      }
    }
  `;
  document.head.appendChild(style);
}

// Coin animation
const triggerCoins = () => {
  const coinCount = 30;
  
  for (let i = 0; i < coinCount; i++) {
    const coin = document.createElement('div');
    coin.style.position = 'fixed';
    coin.style.left = Math.random() * 100 + '%';
    coin.style.top = '-20px';
    coin.style.width = '24px';
    coin.style.height = '24px';
    coin.style.backgroundColor = '#FFD700';
    coin.style.borderRadius = '50%';
    coin.style.pointerEvents = 'none';
    coin.style.zIndex = '9999';
    coin.style.border = '2px solid #DAA520';
    coin.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.6)';
    coin.style.animation = `coinFall ${2.5 + Math.random() * 1}s ease-in forwards`;
    coin.innerHTML = '💰';
    coin.style.fontSize = '20px';
    coin.style.display = 'flex';
    coin.style.alignItems = 'center';
    coin.style.justifyContent = 'center';
    
    document.body.appendChild(coin);
    
    setTimeout(() => coin.remove(), 3500);
  }
};

interface SchoolDetailProps {
  school: School;
  onBack: () => void;
  onUpdateStage: (schoolId: string, newStage: SalesStage) => void;
  onUpdateContactInfo: (schoolId: string, contactData: any) => void;
  onDeleteSchool: (schoolId: string) => void;
}

const SchoolDetail: React.FC<SchoolDetailProps> = ({ school, onBack, onUpdateStage, onUpdateContactInfo, onDeleteSchool }) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'ai_coach' | 'emails'>('activity');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState<string>('');
  const [editingContact, setEditingContact] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [contactForm, setContactForm] = useState({
    principalName: school.principalName || '',
    principalEmail: school.principalEmail || '',
    secretaryEmail: school.secretaryEmail || '',
    studentCount: school.studentCount || null
  });

  // Sync contact form with school data when school changes
  React.useEffect(() => {
    setContactForm({
      principalName: school.principalName || '',
      principalEmail: school.principalEmail || '',
      secretaryEmail: school.secretaryEmail || '',
      studentCount: school.studentCount || null
    });
  }, [school.id, school.principalName, school.principalEmail, school.secretaryEmail, school.studentCount]);

  const handleUpdate = (newStage: SalesStage) => {
    onUpdateStage(school.id, newStage);
    // Trigger confetti when appointment is booked
    if (newStage === SalesStage.APPOINTMENT_BOOKED) {
      triggerConfetti();
    }
    // Trigger coins when completed
    if (newStage === SalesStage.COMPLETED) {
      triggerCoins();
    }
  };

  const handleGetAdvice = async () => {
    setIsLoadingAdvice(true);
    // Simulate API delay
    setTimeout(() => {
      // Pick random advice
      const advice = SALES_ADVICE[Math.floor(Math.random() * SALES_ADVICE.length)];
      setAiAdvice(advice);
      setIsLoadingAdvice(false);
      setActiveTab('ai_coach');
    }, 1000);
  };

  const handleGenerateEmail = async (type: 'problem' | 'solution' | 'social' | 'nudge') => {
    setIsGeneratingEmail(true);
    // Simulate API delay
    setTimeout(() => {
      const templateFn = EMAIL_TEMPLATES[type];
      const email = templateFn ? templateFn(school.name, school.principalName || 'Principal') : "No template found.";
      setDraftEmail(email || '');
      setActiveTab('emails');
      setIsGeneratingEmail(false);
      handleUpdate(SalesStage.EMAIL_SENT);
    }, 800);
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
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                >
                  <MoreHorizontal size={18} />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-slate-100 last:border-b-0"
                    >
                      Delete School
                    </button>
                  </div>
                )}
              </div>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact Details</h3>
                  {!editingContact && (
                    <button
                      onClick={() => setEditingContact(true)}
                      className="text-[10px] font-bold text-brand bg-brand/10 px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-all"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {editingContact ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Principal Name</label>
                      <input
                        type="text"
                        value={contactForm.principalName}
                        onChange={e => setContactForm({...contactForm, principalName: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Principal Email</label>
                      <input
                        type="email"
                        value={contactForm.principalEmail}
                        onChange={e => setContactForm({...contactForm, principalEmail: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Secretary Email (Optional)</label>
                      <input
                        type="email"
                        value={contactForm.secretaryEmail}
                        onChange={e => setContactForm({...contactForm, secretaryEmail: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Student Count</label>
                      <input
                        type="number"
                        value={contactForm.studentCount}
                        onChange={e => setContactForm({...contactForm, studentCount: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={async () => {
                          try {
                            setIsSavingContact(true);
                            console.log('Saving contact info:', contactForm);
                            await onUpdateContactInfo(school.id, contactForm);
                            setIsSavingContact(false);
                            setEditingContact(false);
                            console.log('Contact info saved successfully');
                          } catch (error) {
                            console.error('Error saving contact info:', error);
                            setIsSavingContact(false);
                            alert('Error saving contact information. Please try again.');
                          }
                        }}
                        disabled={isSavingContact}
                        className="flex-1 bg-brand text-slate-900 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-brand/90 transition-all disabled:opacity-50"
                      >
                        {isSavingContact ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setContactForm({
                            principalName: school.principalName,
                            principalEmail: school.principalEmail,
                            secretaryEmail: school.secretaryEmail || '',
                            studentCount: school.studentCount
                          });
                          setEditingContact(false);
                        }}
                        className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {school.principalName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{school.principalName || 'Name Not Provided'}</p>
                        <p className="text-xs text-slate-500 mb-2">Principal</p>
                        <div className="space-y-2 mt-3">
                          {school.principalEmail && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand cursor-pointer transition-colors group">
                              <div className="p-1.5 bg-slate-50 rounded-md group-hover:bg-brand group-hover:text-white transition-colors"><Mail size={12} /></div>
                              <span className="font-medium">{school.principalEmail}</span>
                            </div>
                          )}
                          {school.secretaryEmail && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand cursor-pointer transition-colors group">
                              <div className="p-1.5 bg-slate-50 rounded-md group-hover:bg-brand group-hover:text-white transition-colors"><Mail size={12} /></div>
                              <span className="font-medium">{school.secretaryEmail} (Secretary)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {school.lastEditedBy && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400">Last edited by <span className="font-bold">{school.lastEditedBy}</span></p>
                        {school.lastEditedAt && (
                          <p className="text-[10px] text-slate-400">{new Date(school.lastEditedAt).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {school.salesRepId && (
                school.stage === SalesStage.APPOINTMENT_BOOKED ||
                school.stage === SalesStage.FINALIZING ||
                school.stage === SalesStage.LETTER_DISTRIBUTION ||
                school.stage === SalesStage.COMPLETED
              ) && (
                <div className="pt-6 border-t border-slate-50">
                  <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Assigned Rep</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                      {school.salesRepName?.charAt(0)}
                    </div>
                    <div> 
                      <span className="text-sm font-bold text-slate-900 block">{school.salesRepName}</span>
                      <span className="text-xs text-slate-400">Sales Representative</span>
                    </div>
                  </div>
                </div>
              )}
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
                        <h4 className="font-bold text-slate-900">Digital Sales Coach</h4>
                        <p className="text-xs text-indigo-700/80 mt-1">
                           Get tactical advice for the {school.stage} stage.
                        </p>
                      </div>
                      <button 
                         onClick={handleGetAdvice}
                         className="ml-auto px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200"
                       >
                         {isLoadingAdvice ? 'Thinking...' : 'Get Advice'}
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

        {/* Delete School Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full space-y-6 p-8 animate-in fade-in zoom-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Delete School?</h2>
                <p className="text-slate-600 text-sm">
                  This action cannot be undone. Please type the school name below to confirm deletion.
                </p>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <p className="text-sm font-bold text-rose-900 mb-2">School to delete:</p>
                <p className="text-sm font-black text-rose-600">{school.name}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Type the school name to confirm:
                </label>
                <input
                  type="text"
                  placeholder={school.name}
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold text-sm uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirmation === school.name) {
                      onDeleteSchool(school.id);
                      setShowDeleteModal(false);
                      setDeleteConfirmation('');
                    } else {
                      alert('Please type the school name exactly to confirm deletion.');
                    }
                  }}
                  disabled={deleteConfirmation !== school.name}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold text-sm uppercase tracking-widest transition-all"
                >
                  Delete School
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper for the icon
const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

export default SchoolDetail;
