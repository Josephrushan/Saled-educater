import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, CheckCircle2, XCircle, AlertCircle, Search, Lock, LogOut, Check, X, Trash2 } from 'lucide-react';
import { SalesRep } from '../types';
import { 
  getTeamMembers, 
  suggestTeamMember, 
  getTeamSuggestions, 
  getUserTeam,
  checkIfRepIsTeamLead,
  checkIfRepInTeam,
  createTeam,
  sendTeamInvitation,
  getAvailableRepsForTeam,
  getMyPendingInvitations,
  acceptTeamInvitation,
  rejectTeamInvitation,
  leaveTeam,
  deleteTeam
} from '../services/firebase';
import SuggestTeamMember from './SuggestTeamMember';

interface TeamManagementProps {
  currentUser: SalesRep;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ currentUser }) => {
  const [team, setTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [isInTeam, setIsInTeam] = useState(false);
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [showCreateTeamPrompt, setShowCreateTeamPrompt] = useState(false);
  const [availableReps, setAvailableReps] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [myTeamInfo, setMyTeamInfo] = useState<any>(null);

  // Fetch team info on mount
  useEffect(() => {
    loadTeamInfo();
  }, [currentUser?.id]);

  // Load available reps when "Add Member" modal opens
  useEffect(() => {
    if (showAddExisting && isTeamLead) {
      console.log('📱 Add Member modal opened, loading available reps for:', currentUser.id);
      loadAvailableReps();
    }
  }, [showAddExisting]);

  const loadTeamInfo = async () => {
    setIsLoading(true);

    // Check if current user is team lead
    const isLead = await checkIfRepIsTeamLead(currentUser.id);
    setIsTeamLead(isLead);

    // Check if current user is in another team
    const inTeam = await checkIfRepInTeam(currentUser.id);
    setIsInTeam(inTeam);

    // Load pending invitations if not team lead
    if (!isLead) {
      const invitations = await getMyPendingInvitations(currentUser.id);
      setPendingInvitations(invitations);
      
      // Load my team info if I'm in a team
      if (inTeam) {
        const teamLeadData = await Promise.all(
          invitations.map(inv => inv.teamLeadId)
        );
        // Try to find team I'm in by checking team members
        // This would be better with a dedicated function but we'll use this for now
      }
    }

    // If team lead, load team and members
    if (isLead) {
      const userTeam = await getUserTeam(currentUser.id);
      if (userTeam) {
        setTeam(userTeam);
        const members = await getTeamMembers(currentUser.id);
        setTeamMembers(members);
      }
    }

    setIsLoading(false);
  };

  const loadAvailableReps = async () => {
    try {
      console.log('🔍 Loading available reps for team lead:', currentUser.id);
      const reps = await getAvailableRepsForTeam(currentUser.id);
      console.log('✅ Loaded available reps:', reps.length, reps);
      setAvailableReps(reps);
    } catch (error) {
      console.error('❌ Error loading available reps:', error);
      setAvailableReps([]);
    }
  };

  const handleCreateTeam = async (teamName: string, profilePictureUrl?: string) => {
    console.log('Creating team:', teamName);
    
    const success = await createTeam(
      currentUser.id,
      currentUser.name,
      currentUser.email,
      teamName,
      profilePictureUrl,
      currentUser.profilePicUrl
    );

    if (success) {
      alert('✅ Team created successfully!');
      setShowCreateTeam(false);
      await loadTeamInfo();
    } else {
      alert('❌ Failed to create team');
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) return;
    
    const confirmed = window.confirm('⚠️ Are you sure you want to delete this team? This action cannot be undone.');
    if (!confirmed) return;

    const success = await deleteTeam(currentUser.id);
    
    if (success) {
      alert('✅ Team deleted successfully');
      setTeam(null);
      setTeamMembers([]);
      await loadTeamInfo();
    } else {
      alert('❌ Failed to delete team');
    }
  };

  const handleAddExistingRep = async (repId: string) => {
    const success = await sendTeamInvitation(currentUser.id, repId);

    if (success) {
      alert('📧 Invitation sent! Rep will receive it in their My Team tab.');
      setSearchQuery('');
      setShowAddExisting(false);
      await loadTeamInfo();
      setAvailableReps(availableReps.filter(r => r.id !== repId));
    } else {
      alert('❌ Failed to send invitation');
    }
  };

  const handleSuggestionSubmitted = async (formData: any) => {
    const suggestionData = {
      ...formData,
      suggestedBy: currentUser.id,
      suggestedByName: `${currentUser.name} ${currentUser.surname || ''}`.trim()
    };

    const result = await suggestTeamMember(suggestionData);

    if (result) {
      alert('✅ Suggestion sent to admin for approval!');
      setShowSuggestForm(false);
    } else {
      alert('❌ Failed to submit suggestion. Please try again.');
    }
  };

  const filteredReps = availableReps.filter(rep => 
    rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rep.surname && rep.surname.toLowerCase().includes(searchQuery.toLowerCase())) ||
    rep.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // User already in a team
  if (isInTeam && !isTeamLead) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-white border-b border-slate-200 p-6">
          <h1 className="font-black text-2xl">My Team</h1>
          <p className="text-sm text-slate-600 mt-1">You are a member of a team</p>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6 max-w-2xl">
            {/* Team Information Card */}
            {pendingInvitations.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-black text-base mb-4">Team Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">TEAM NAME</p>
                    <p className="text-base font-bold text-slate-900">{pendingInvitations[0]?.teamName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">TEAM LEAD</p>
                    <p className="text-base font-bold text-slate-900">{pendingInvitations[0]?.teamLeadName}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const confirmed = window.confirm('Are you sure you want to leave this team?');
                    if (confirmed) {
                      const success = await leaveTeam(currentUser.id);
                      if (success) {
                        alert('✅ You have left the team');
                        await loadTeamInfo();
                      } else {
                        alert('❌ Failed to leave team');
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition border border-red-200"
                >
                  <LogOut size={18} /> Leave Team
                </button>
              </div>
            )}

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-black text-base mb-4">Team Invitations</h3>
                <div className="space-y-3">
                  {pendingInvitations.map(invitation => (
                    <div key={invitation.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="mb-4">
                        <p className="text-sm font-bold text-slate-900">
                          {invitation.teamLeadName} invited you to join <span className="text-brand">{invitation.teamName}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Received on {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            const success = await acceptTeamInvitation(invitation.id, currentUser.id);
                            if (success) {
                              alert('✅ Invitation accepted! You are now part of the team.');
                              await loadTeamInfo();
                            } else {
                              alert('❌ Failed to accept invitation');
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-100 transition border border-green-200"
                        >
                          <Check size={16} /> Accept
                        </button>
                        <button
                          onClick={async () => {
                            const success = await rejectTeamInvitation(invitation.id);
                            if (success) {
                              alert('✅ Invitation rejected');
                              await loadTeamInfo();
                            } else {
                              alert('❌ Failed to reject invitation');
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition border border-red-200"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingInvitations.length === 0 && (
              <div className="flex items-center justify-center p-12">
                <div className="bg-white rounded-lg border border-slate-200 p-12 text-center max-w-md">
                  <Users size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-600 font-bold mb-2">No Pending Invitations</p>
                  <p className="text-sm text-slate-500">
                    You don't have any pending team invitations. Ask a team lead to invite you!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  // User is not a team lead - show options to create or join team
  if (!isTeamLead) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-white border-b border-slate-200 p-6">
          <h1 className="font-black text-2xl">My Team</h1>
          <p className="text-sm text-slate-600 mt-1">Create or manage your sales team</p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3 max-w-2xl">
            {/* Add Existing Members */}
            <button
              onClick={() => {
                if (!team) {
                  setShowCreateTeamPrompt(true);
                } else {
                  setShowAddExisting(true);
                  loadAvailableReps();
                }
              }}
              className="w-full flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-lg hover:border-brand hover:bg-brand/5 transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition flex-shrink-0">
                <Search size={24} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-black text-base">Search Members</h3>
                <p className="text-sm text-slate-600">
                  Find and add existing sales reps to your team
                </p>
              </div>
            </button>

            {/* Create New Team */}
            <button
              onClick={() => setShowCreateTeam(true)}
              className="w-full flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-lg hover:border-brand hover:bg-brand/5 transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition flex-shrink-0">
                <Plus size={24} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-black text-base">Create Team</h3>
                <p className="text-sm text-slate-600">
                  Create a new team with custom name and profile picture
                </p>
              </div>
            </button>

            {/* Suggest New Member */}
            <button
              onClick={() => setShowSuggestForm(true)}
              className="w-full flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-lg hover:border-green-500 hover:bg-green-50 transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition flex-shrink-0">
                <Users size={24} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-black text-base">Suggest New Member</h3>
                <p className="text-sm text-slate-600">
                  Suggest an applicant to your admin for approval
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Modals */}
        {showCreateTeam && (
          <CreateTeamModal
            onClose={() => setShowCreateTeam(false)}
            onSubmit={handleCreateTeam}
          />
        )}

        {showAddExisting && (
          <AddExistingMemberModal
            onClose={() => setShowAddExisting(false)}
            availableReps={filteredReps}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddRep={handleAddExistingRep}
          />
        )}

        {showSuggestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-slate-200">
                <h2 className="font-black text-xl">Suggest New Team Member</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Suggest an applicant to join your team. The admin will review and approve.
                </p>
              </div>
              <SuggestTeamMember onSubmit={handleSuggestionSubmitted} />
              <div className="p-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setShowSuggestForm(false)}
                  className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateTeamPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4 max-w-sm">
              {/* Speech Bubble */}
              <div className="bg-white rounded-[2rem] p-8 shadow-lg relative">
                <div className="flex justify-center mb-4">
                  <img 
                    src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/speech%20bubble_200x200.webp?alt=media&token=25c10f21-477c-4028-8217-fe815cfd540e"
                    alt="Message"
                    className="w-16 h-16"
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-slate-900 font-black text-lg">Create a team first</p>
                  <p className="text-slate-600 text-sm">You need to create a team before you can search for and add members.</p>
                </div>
              </div>

              {/* Got It Button */}
              <button
                onClick={() => {
                  setShowCreateTeamPrompt(false);
                  setShowCreateTeam(true);
                }}
                className="bg-[#072432] hover:bg-[#0d3a47] text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // User is team lead - show team management
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-black text-2xl">{team?.teamName || 'My Team'}</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your sales team</p>
          </div>
          <div className="flex items-center gap-2">
            {team?.teamProfilePictureUrl && (
              <img 
                src={team.teamProfilePictureUrl} 
                alt={team.teamName} 
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
            )}
            <button
              onClick={() => setShowAddExisting(true)}
              className="flex items-center gap-2 bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition"
            >
              <Plus size={18} /> Add Member
            </button>
            <button
              onClick={handleDeleteTeam}
              className="flex items-center gap-2 bg-rose-50 text-rose-500 px-4 py-2 rounded-lg font-bold text-sm hover:bg-rose-100 transition"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-black text-base mb-4">Team Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">TEAM NAME</p>
                <p className="text-base font-bold text-slate-900">{team?.teamName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">MEMBERS</p>
                <p className="text-base font-bold text-slate-900">{teamMembers.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">CREATED</p>
                <p className="text-base font-bold text-slate-900">
                  {new Date(team?.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">STATUS</p>
                <p className="text-base font-bold text-green-700 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Active
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-black text-base mb-4">Team Members ({teamMembers.length})</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-3 border-brand border-t-transparent rounded-full" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <Users size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-bold">No team members yet</p>
                <button
                  onClick={() => setShowAddExisting(true)}
                  className="mt-4 bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition"
                >
                  Add Your First Member
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg border border-slate-200 p-4 hover:border-brand transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-black text-base">
                          {member.firstName} {member.surname}
                        </h4>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={16} />
                            {member.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={16} />
                            {member.telephoneNumber}
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                        <CheckCircle2 size={14} /> Member
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddExisting && (
        <AddExistingMemberModal
          onClose={() => setShowAddExisting(false)}
          availableReps={filteredReps}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddRep={handleAddExistingRep}
        />
      )}
    </div>
  );
};

// Create Team Modal
interface CreateTeamModalProps {
  onClose: () => void;
  onSubmit: (teamName: string, profilePictureUrl?: string) => Promise<void>;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, onSubmit }) => {
  const [teamName, setTeamName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('❌ File size must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('❌ Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setProfilePicture(base64String);
        setProfilePicturePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    setIsSubmitting(true);
    await onSubmit(teamName, profilePicture || undefined);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="font-black text-xl mb-4">Create Your Team</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Sales Champions"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Team Profile Picture</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id="file-upload"
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="flex-1 bg-[#072432] hover:bg-[#0d3a47] text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-all text-center"
              >
                Choose File
              </label>
            </div>
            {profilePicturePreview && (
              <div className="mt-3">
                <p className="text-xs text-slate-500 font-bold mb-2">Preview:</p>
                <img 
                  src={profilePicturePreview} 
                  alt="Preview" 
                  className="w-20 h-20 rounded-lg object-cover border border-slate-200"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!teamName.trim() || isSubmitting}
              className="flex-1 bg-brand text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Existing Member Modal
interface AddExistingMemberModalProps {
  onClose: () => void;
  availableReps: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddRep: (repId: string) => Promise<void>;
}

const AddExistingMemberModal: React.FC<AddExistingMemberModalProps> = ({
  onClose,
  availableReps,
  searchQuery,
  setSearchQuery,
  onAddRep
}) => {
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const handleAdd = async (repId: string) => {
    setIsAdding(repId);
    await onAddRep(repId);
    setIsAdding(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-auto flex flex-col">
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="font-black text-xl mb-4">Add Team Member</h2>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {availableReps.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-600 font-bold">No available reps</p>
              <p className="text-sm text-slate-500 mt-1">All sales reps are already in teams</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableReps.map(rep => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-brand transition"
                >
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      {rep.name} {rep.surname || ''}
                    </p>
                    <p className="text-xs text-slate-500">{rep.email}</p>
                  </div>
                  <button
                    onClick={() => handleAdd(rep.id)}
                    disabled={isAdding === rep.id}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isAdding === rep.id ? 'Adding...' : '+'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
