import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { SalesRep } from '../types';
import { getTeamSuggestions, approveTeamMember, rejectTeamMember } from '../services/firebase';

interface AdminApprovalPanelProps {
  currentUser: SalesRep;
}

const AdminApprovalPanel: React.FC<AdminApprovalPanelProps> = ({ currentUser }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    const data = await getTeamSuggestions();
    setSuggestions(data);
    setIsLoading(false);
  };

  const handleApprove = async (suggestionId: string) => {
    if (!window.confirm('Approve this team member suggestion?')) return;

    setIsLoading(true);
    const result = await approveTeamMember(suggestionId, currentUser.id, currentUser.name);

    if (result && typeof result === 'object' && result.success) {
      alert(`✅ Approved!\n\nUsername: ${result.username}\nPassword: ${result.password}\n\nMake sure to share these credentials with the new member.`);
      await loadSuggestions();
    } else {
      alert('❌ Failed to approve. Please try again.');
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    if (!selectedId || !rejectionReason.trim()) return;

    setIsLoading(true);
    const result = await rejectTeamMember(selectedId, currentUser.id, rejectionReason);

    if (result) {
      alert('✅ Suggestion rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedId(null);
      await loadSuggestions();
    } else {
      alert('❌ Failed to reject. Please try again.');
    }
    setIsLoading(false);
  };

  const filteredSuggestions = suggestions.filter(s => s.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'approved':
        return <CheckCircle2 size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div>
          <h1 className="font-black text-2xl">Team Member Approvals</h1>
          <p className="text-sm text-slate-600 mt-1">Review and approve team member suggestions from sales reps</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          {[
            { id: 'pending', label: 'Pending', icon: Clock },
            { id: 'approved', label: 'Approved', icon: CheckCircle2 },
            { id: 'rejected', label: 'Rejected', icon: XCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-bold text-sm transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-b-2 border-brand text-brand'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon size={18} />
              {tab.label} ({filteredSuggestions.length})
            </button>
          ))}
        </div>

        {/* Items */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Users size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-bold">
              No {activeTab} suggestions
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Team member suggestions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="bg-white rounded-lg border border-slate-200 p-5 hover:border-brand transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-black text-base">
                          {suggestion.firstName} {suggestion.surname}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Suggested by: <span className="font-bold">{suggestion.suggestedByName}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                      suggestion.status
                    )}`}
                  >
                    {getStatusIcon(suggestion.status)}
                    {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">EMAIL</p>
                    <p className="text-sm text-slate-700">{suggestion.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">TELEPHONE</p>
                    <p className="text-sm text-slate-700">{suggestion.telephoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">SUGGESTED</p>
                    <p className="text-sm text-slate-700">
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {suggestion.approvedAt && (
                    <div>
                      <p className="text-xs text-slate-500 font-bold mb-1">APPROVED</p>
                      <p className="text-sm text-slate-700">
                        {new Date(suggestion.approvedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Rejection Reason */}
                {suggestion.status === 'rejected' && suggestion.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                    <p className="text-xs font-bold text-red-600 mb-1">REJECTION REASON</p>
                    <p className="text-sm text-red-700">{suggestion.rejectionReason}</p>
                  </div>
                )}

                {/* Actions */}
                {suggestion.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(suggestion.id)}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} className="inline mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(suggestion.id);
                        setShowRejectModal(true);
                      }}
                      disabled={isLoading}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <XCircle size={16} className="inline mr-2" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="font-black text-lg mb-4">Reject Suggestion</h3>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejecting this team member suggestion:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Missing required information, Does not meet qualifications, etc."
              className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none h-24 mb-4 focus:outline-none focus:ring-2 focus:ring-red-200"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleReject();
                }}
                disabled={!rejectionReason.trim() || isLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
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

export default AdminApprovalPanel;
