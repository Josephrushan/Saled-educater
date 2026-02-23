import React, { useState } from 'react';
import { 
  ArrowLeft, Phone, Mail, Calendar, CheckCircle2, XCircle, 
  FileCheck, AlertCircle, Trash2, MoreHorizontal
} from 'lucide-react';
import { School, SalesStage, CommunicationType, OutcomeType, AttemptRecord } from '../types';
import { STAGE_CONFIG } from '../constants';

interface SchoolDetailNewProps {
  school: School;
  currentUser: any;
  onBack: () => void;
  onUpdateStage: (schoolId: string, newStage: SalesStage, data?: any) => void;
  onUpdateAttempt: (schoolId: string, attempt: AttemptRecord) => void;
  onDeleteSchool: (schoolId: string) => void;
  onResetProgress: (schoolId: string) => void;
}

const SchoolDetailNew: React.FC<SchoolDetailNewProps> = ({
  school,
  currentUser,
  onBack,
  onUpdateStage,
  onUpdateAttempt,
  onDeleteSchool,
  onResetProgress
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Communication stage
  const [communicationType, setCommunicationType] = useState<CommunicationType | null>(null);
  const [communicationFailureReason, setCommunicationFailureReason] = useState('');
  
  // Outcome stage
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeType | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [showReasonForm, setShowReasonForm] = useState(false);
  
  // Distribute letter
  const [letterDistributed, setLetterDistributed] = useState(!!school.letterDistributedDate);
  
  // Editable contact details
  const [editingDetails, setEditingDetails] = useState(false);
  const [editPrincipalEmail, setEditPrincipalEmail] = useState(school.principalEmail);
  const [editSecretaryEmail, setEditSecretaryEmail] = useState(school.secretaryEmail || '');
  const [editStudentCount, setEditStudentCount] = useState(school.studentCount?.toString() || '');

  // Monitor stage changes
  React.useEffect(() => {
    console.log('🔄 School stage changed:', school.stage, 'ID:', school.id);
  }, [school.stage, school.id]);

  const handleMoveToCommunication = () => {
    console.log('📞 Moving to COMMUNICATION stage');
    onUpdateStage(school.id, SalesStage.COMMUNICATION);
  };

  const handleCompleteCommunication = (type: CommunicationType) => {
    console.log('✅ Completing communication with type:', type);
    const attempt: AttemptRecord = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      repId: currentUser?.id || '',
      repName: currentUser?.name || 'Unknown',
      communicationType: type
    };
    
    console.log('📝 Saving attempt:', attempt);
    onUpdateAttempt(school.id, attempt);
    console.log('🎯 Moving to APPOINTMENT stage');
    onUpdateStage(school.id, SalesStage.APPOINTMENT);
    setCommunicationType(null);
  };

  const handleMoveToOutcome = () => {
    console.log('📊 Moving to OUTCOME stage');
    onUpdateStage(school.id, SalesStage.OUTCOME_REACHED);
  };

  const handleOutcome = () => {
    if (!selectedOutcome) return;

    if (selectedOutcome === OutcomeType.FAILED) {
      setShowReasonForm(true);
    } else {
      // Signed up - move to distribute letter
      onUpdateStage(school.id, SalesStage.DISTRIBUTE_LETTER);
      setSelectedOutcome(null);
    }
  };

  const handleSubmitFailure = async () => {
    if (!failureReason.trim()) return;

    const attempt: AttemptRecord = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      repId: currentUser?.id || '',
      repName: currentUser?.name || 'Unknown',
      outcome: OutcomeType.FAILED,
      reason: failureReason
    };

    console.log('💔 Outcome failed, recording attempt first');
    await onUpdateAttempt(school.id, attempt);
    console.log('💔 Reverting to AVAILABLE stage');
    onUpdateStage(school.id, SalesStage.AVAILABLE);
    setSelectedOutcome(null);
    setFailureReason('');
    setShowReasonForm(false);
  };

  const handleDistributeLetter = () => {
    const today = new Date().toISOString().split('T')[0];
    onUpdateStage(school.id, SalesStage.COMPLETED, { letterDistributedDate: today });
    setLetterDistributed(true);
  };

  const handleSaveContactDetails = () => {
    // In a real app, you'd call onUpdateSchool or similar
    // For now, we're just closing the edit mode
    setEditingDetails(false);
    console.log('Save contact details:', {
      principalEmail: editPrincipalEmail,
      secretaryEmail: editSecretaryEmail,
      studentCount: parseInt(editStudentCount)
    });
  };

  const handleDeleteSchool = () => {
    if (deleteConfirmation === school.name) {
      onDeleteSchool(school.id);
    }
  };

  // Map old stage values to new ones for backwards compatibility
  const getMappedStage = (): SalesStage => {
    const stageMap: Record<string, SalesStage> = {
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
      'Not Interested': SalesStage.AVAILABLE // Move back to available if not interested
    };
    
    return stageMap[school.stage] || SalesStage.AVAILABLE;
  };

  const renderStageContent = () => {
    const mappedStage = getMappedStage();
    console.log('🎯 Rendering stage content for:', school.stage, '→ mapped to:', mappedStage, 'Enum value:', SalesStage.AVAILABLE);
    switch (mappedStage) {
      case SalesStage.AVAILABLE:
        return (
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="font-black text-base mb-4">School Status: Available</h3>
            <p className="text-sm text-slate-600 mb-4">This school is ready for outreach. Start by initiating communication.</p>
            <button
              onClick={handleMoveToCommunication}
              className="bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition"
            >
              Move to Communication
            </button>
          </div>
        );

      case SalesStage.COMMUNICATION:
        return (
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            {!communicationType ? (
              <>
                <h3 className="font-black text-base mb-4">How did you communicate?</h3>
                <p className="text-sm text-slate-600 mb-6">Select the method you used to reach the school. This will log the attempt and ask about the outcome.</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setCommunicationType(CommunicationType.PHONE_CALL)}
                    className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-brand hover:bg-slate-50 transition flex items-center justify-center gap-3 font-bold text-base text-slate-700 hover:text-slate-900"
                  >
                    <Phone size={20} /> Phone Call
                  </button>
                  <button
                    onClick={() => setCommunicationType(CommunicationType.EMAIL)}
                    className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-brand hover:bg-slate-50 transition flex items-center justify-center gap-3 font-bold text-base text-slate-700 hover:text-slate-900"
                  >
                    <Mail size={20} /> Email
                  </button>
                </div>
              </>
            ) : !communicationFailureReason && selectedOutcome === OutcomeType.FAILED ? (
              <>
                <h3 className="font-black text-base mb-4">Why did the communication fail?</h3>
                <p className="text-sm text-slate-600 mb-4">Please specify the reason so we can track what happened.</p>
                
                <div className="space-y-3">
                  <textarea
                    value={communicationFailureReason}
                    onChange={(e) => setCommunicationFailureReason(e.target.value)}
                    placeholder="e.g., Principal not available, number disconnected, email bounced, not interested, etc."
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:border-brand"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const attempt: AttemptRecord = {
                          id: Math.random().toString(36).substring(7),
                          timestamp: new Date().toISOString(),
                          repId: currentUser?.id || '',
                          repName: currentUser?.name || 'Unknown',
                          communicationType,
                          outcome: OutcomeType.FAILED,
                          reason: communicationFailureReason
                        };
                        
                        console.log('❌ Communication failed, recording attempt first');
                        await onUpdateAttempt(school.id, attempt);
                        console.log('❌ Reverting to AVAILABLE stage');
                        onUpdateStage(school.id, SalesStage.AVAILABLE);
                        setCommunicationType(null);
                        setCommunicationFailureReason('');
                        setSelectedOutcome(null);
                      }}
                      disabled={!communicationFailureReason.trim()}
                      className="flex-1 p-3 rounded-lg border-2 border-brand bg-brand text-slate-900 font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save & Return to Available
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOutcome(null);
                        setCommunicationFailureReason('');
                      }}
                      className="flex-1 p-3 rounded-lg border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-black text-base mb-4">What was the outcome?</h3>
                <p className="text-sm text-slate-600 mb-6">You contacted them via <strong>{communicationType}</strong>. Did you schedule an appointment?</p>
                
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      const attempt: AttemptRecord = {
                        id: Math.random().toString(36).substring(7),
                        timestamp: new Date().toISOString(),
                        repId: currentUser?.id || '',
                        repName: currentUser?.name || 'Unknown',
                        communicationType
                      };
                      
                      console.log('✅ Appointment scheduled, recording attempt first');
                      console.log('📝 Calling onUpdateAttempt with:', attempt);
                      await onUpdateAttempt(school.id, attempt);
                      console.log('✅ Attempt recorded, now updating stage to APPOINTMENT');
                      onUpdateStage(school.id, SalesStage.APPOINTMENT);
                      setCommunicationType(null);
                      setSelectedOutcome(null);
                    }}
                    className="w-full p-4 rounded-lg border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition flex items-center justify-center gap-3 font-bold text-base text-green-700 hover:text-green-900"
                  >
                    <CheckCircle2 size={20} /> Yes, Appointment Scheduled →
                  </button>
                  <button
                    onClick={() => setSelectedOutcome(OutcomeType.FAILED)}
                    className="w-full p-4 rounded-lg border-2 border-red-200 hover:border-red-500 hover:bg-red-50 transition flex items-center justify-center gap-3 font-bold text-base text-red-700 hover:text-red-900"
                  >
                    <XCircle size={20} /> No, Failed
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case SalesStage.APPOINTMENT:
        return (
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="font-black text-base mb-2">✓ Appointment Scheduled</h3>
            <p className="text-sm text-slate-600 mb-6">You have scheduled an appointment with {school.principalName}.</p>
            <button
              onClick={handleMoveToOutcome}
              className="w-full bg-brand text-slate-900 px-6 py-3 rounded-lg font-bold text-base hover:opacity-90 transition"
            >
              Record Appointment Outcome →
            </button>
          </div>
        );

      case SalesStage.OUTCOME_REACHED:
        return (
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="font-black text-base mb-4">Appointment Outcome</h3>
            <p className="text-sm text-slate-600 mb-4">What was the outcome of the appointment?</p>

            {!showReasonForm ? (
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setSelectedOutcome(OutcomeType.SIGNED_UP)}
                  className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-2 font-bold text-sm ${
                    selectedOutcome === OutcomeType.SIGNED_UP
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 size={18} /> Signed Up
                </button>
                <button
                  onClick={() => setSelectedOutcome(OutcomeType.FAILED)}
                  className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-2 font-bold text-sm ${
                    selectedOutcome === OutcomeType.FAILED
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <XCircle size={18} /> Failed
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold mb-2">Reason for failure:</label>
                  <textarea
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="Enter the reason why the outcome was not successful..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitFailure}
                    disabled={!failureReason.trim()}
                    className="flex-1 bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit & Return to Available
                  </button>
                  <button
                    onClick={() => setShowReasonForm(false)}
                    className="flex-1 bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedOutcome && !showReasonForm && (
              <button
                onClick={handleOutcome}
                className="w-full mt-4 bg-brand text-slate-900 px-6 py-3 rounded-lg font-bold text-base hover:opacity-90 transition"
              >
                {selectedOutcome === OutcomeType.SIGNED_UP ? 'Move to Distribute Letter →' : 'Submit'}
              </button>
            )}
          </div>
        );

      case SalesStage.DISTRIBUTE_LETTER:
        return (
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="font-black text-base mb-4">Distribute Letter</h3>
            <p className="text-sm text-slate-600 mb-4">School is ready to receive and distribute enrollment letter.</p>
            {!school.letterDistributedDate ? (
              <button
                onClick={handleDistributeLetter}
                className="bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition w-full flex items-center justify-center gap-2"
              >
                <FileCheck size={18} /> Mark as Distributed
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} /> Distributed on {school.letterDistributedDate}
                  </p>
                </div>
                <button
                  onClick={() => onUpdateStage(school.id, SalesStage.COMPLETED)}
                  className="bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition w-full"
                >
                  Mark as Complete
                </button>
              </div>
            )}
          </div>
        );

      case SalesStage.COMPLETED:
        return (
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={24} className="text-green-500" />
              <h3 className="font-black text-base">Completed</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">School signed up on: {school.letterDistributedDate}</p>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-bold">✓ Sales process complete</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="font-black text-base mb-4">Stage: {school.stage}</h3>
            <p className="text-sm text-slate-600 mb-4">This stage is not recognized. Current value: <code className="bg-slate-100 px-2 py-1 rounded">{school.stage}</code></p>
            <button
              onClick={handleMoveToCommunication}
              className="bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition"
            >
              Move to Communication
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex-1 ml-4">
            <h1 className="font-black text-2xl">{school.name}</h1>
            <p className="text-sm text-slate-600">Principal: {school.principalName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${STAGE_CONFIG[getMappedStage()]?.color || 'bg-slate-100 text-slate-600'}`}>
              {STAGE_CONFIG[getMappedStage()]?.icon || null}
              {getMappedStage()}
            </span>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <MoreHorizontal size={20} className="text-slate-600" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-6 top-24 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowResetConfirm(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 font-bold text-sm flex items-center gap-2 rounded-lg"
                  >
                    🔄 Reset Progress
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 font-bold text-sm flex items-center gap-2 rounded-lg"
                >
                  <Trash2 size={16} /> Delete School
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stage Progression */}
        <div className="flex items-center justify-between gap-1 text-xs font-bold">
          {[
            { stage: SalesStage.AVAILABLE, label: 'Available' },
            { stage: SalesStage.COMMUNICATION, label: 'Communication' },
            { stage: SalesStage.APPOINTMENT, label: 'Appointment' },
            { stage: SalesStage.OUTCOME_REACHED, label: 'Outcome' },
            { stage: SalesStage.DISTRIBUTE_LETTER, label: 'Letter' },
            { stage: SalesStage.COMPLETED, label: 'Complete' }
          ].map((item, idx, arr) => {
            const mappedStage = getMappedStage();
            return (
            <div key={item.stage} className="flex items-center flex-1">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                mappedStage === item.stage ? 'bg-brand text-slate-900 scale-110' : 
                // Compare index to determine if completed or current
                arr.findIndex(s => s.stage === mappedStage) >= idx ? 'bg-brand/30 text-slate-700' : 'bg-slate-200 text-slate-400'
              }`}>
                {idx + 1}
              </div>
              {idx < arr.length - 1 && (
                <div className={`flex-1 h-1 mx-1 ${
                  arr.findIndex(s => s.stage === mappedStage) > idx ? 'bg-brand' : 'bg-slate-200'
                }`} />
              )}
            </div>
            );
          })}
        </div>
        {/* Stage Labels - Hidden on mobile */}
        <div className="hidden md:flex justify-between text-xs font-bold mt-2 text-slate-600">
          <span>Available</span>
          <span>Communication</span>
          <span>Appointment</span>
          <span>Outcome</span>
          <span>Letter</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {/* Current Stage Info & Student Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-brand/10 border border-brand/30 rounded-lg p-4">
              <p className="text-xs font-bold text-brand uppercase tracking-widest">Current Stage</p>
              <p className="text-lg font-black text-slate-900">{getMappedStage()}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Active Students</p>
              <p className="text-lg font-black text-slate-900">{school.studentCount || 0}</p>
            </div>
          </div>

          {renderStageContent()}

          {/* Attempts History */}
          {school.attempts && school.attempts.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-slate-200 mt-6">
              <h3 className="font-black text-base mb-4">Attempt History</h3>
              <div className="space-y-3">
                {school.attempts.map((attempt) => (
                  <div key={attempt.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-bold text-sm">{attempt.repName}</p>
                      <p className="text-xs text-slate-500">{new Date(attempt.timestamp).toLocaleString()}</p>
                    </div>
                    {attempt.communicationType && (
                      <p className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                        {attempt.communicationType === CommunicationType.PHONE_CALL ? (
                          <Phone size={14} />
                        ) : (
                          <Mail size={14} />
                        )}
                        {attempt.communicationType}
                      </p>
                    )}
                    {attempt.outcome && (
                      <p className={`text-xs font-bold flex items-center gap-1 ${
                        attempt.outcome === OutcomeType.SIGNED_UP ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attempt.outcome === OutcomeType.SIGNED_UP ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                        {attempt.outcome}
                      </p>
                    )}
                    {attempt.reason && (
                      <p className="text-xs text-slate-600 mt-1">Reason: {attempt.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* School Details */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base">School Details</h3>
              <button
                onClick={() => setEditingDetails(!editingDetails)}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                {editingDetails ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {!editingDetails ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-bold">Email:</span> {school.principalEmail}</p>
                <p><span className="font-bold">Secretary Email:</span> {school.secretaryEmail || 'N/A'}</p>
                <p><span className="font-bold">Student Count:</span> {school.studentCount}</p>
                <p><span className="font-bold">Assigned Rep:</span> {school.salesRepName || 'N/A'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Principal Email:</label>
                  <input
                    type="email"
                    value={editPrincipalEmail}
                    onChange={(e) => setEditPrincipalEmail(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Secretary Email:</label>
                  <input
                    type="email"
                    value={editSecretaryEmail}
                    onChange={(e) => setEditSecretaryEmail(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Student Count:</label>
                  <input
                    type="number"
                    value={editStudentCount}
                    onChange={(e) => setEditStudentCount(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  onClick={handleSaveContactDetails}
                  className="w-full bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="font-black text-lg mb-2">Delete School</h3>
            <p className="text-sm text-slate-600 mb-4">
              This action cannot be undone. Type the school name to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={school.name}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:border-brand"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (deleteConfirmation === school.name) {
                    handleDeleteSchool();
                  }
                }}
                disabled={deleteConfirmation !== school.name}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Progress Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="font-black text-lg mb-2 text-blue-600">🔄 Reset School Progress</h3>
            <p className="text-sm text-slate-600 mb-4">
              This will reset the school to <strong>AVAILABLE</strong> stage and clear:<br/>
              • All attempts and communication history<br/>
              • Contact dates<br/>
              • Letter distribution dates<br/>
              • Sales rep assignment
            </p>
            <p className="text-sm text-slate-600 mb-4 font-bold">
              This action cannot be undone. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onResetProgress(school.id);
                  setShowResetConfirm(false);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition"
              >
                Yes, Reset Progress
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolDetailNew;
