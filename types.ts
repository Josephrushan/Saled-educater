
export enum SalesStage {
  AVAILABLE = 'Available',
  COMMUNICATION = 'Communication',
  APPOINTMENT = 'Appointment',
  OUTCOME_REACHED = 'Outcome Reached',
  DISTRIBUTE_LETTER = 'Distribute Letter',
  COMPLETED = 'Completed'
}

export enum CommunicationType {
  PHONE_CALL = 'Phone Call',
  EMAIL = 'Email'
}

export enum OutcomeType {
  SIGNED_UP = 'Signed Up',
  FAILED = 'Failed'
}

export interface AttemptRecord {
  id: string;
  timestamp: string;
  repId: string;
  repName: string;
  communicationType?: CommunicationType;
  outcome?: OutcomeType;
  reason?: string;
}

export enum TrackType {
  ACQUISITION = 'Acquisition Track',
  ENGAGEMENT = 'Engagement Track'
}

export interface School {
  id: string;
  name: string;
  principalName: string;
  principalEmail: string;
  secretaryEmail?: string;
  salesRepId?: string;
  salesRepName?: string;
  stage: SalesStage;
  track: TrackType;
  studentCount: number;
  lastContactDate: string;
  commissionEarned: number;
  engagementRate: number;
  notes: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  attempts?: AttemptRecord[];
  letterDistributedDate?: string;
}

export interface SalesRep {
  id: string;
  name: string;
  surname?: string;
  email: string;
  password?: string; // Added for custom auth
  avatar: string;
  profilePicUrl?: string;
  idNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  branchCode?: string;
  accountHolderName?: string;
  bankProofUrl?: string;
  totalSchools: number;
  activeCommissions: number;
  role?: 'admin' | 'rep';
  lastSeen?: string; // ISO timestamp of last login
}

export interface ResourceCategory {
  id: string;
  name: string;
  displayOrder: number; // Priority/ordering number - higher numbers appear first
  category: 'tools' | 'training';
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string; // 'PDF', 'Link', etc.
  url: string;
  coverImage?: string; // URL to cover image
  category: 'tools' | 'training';
  categoryId?: string; // Link to ResourceCategory
  createdAt: string;
}

export enum TemplateType {
  EMAIL = 'Email Draft',
  DIALOGUE = 'Call Dialogue',
  SCRIPT = 'Verbal Script'
}

export interface SalesTemplate {
  id?: string;
  track: string;
  title: string;
  templateType: TemplateType;
  subject: string;
  content: string;
  isImportant?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePic?: string;
  content: string;
  createdAt: string;
  readBy?: string[]; // Array of user IDs who read this message
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  members: string[]; // Array of sales rep IDs
  lastMessage?: Message;
  lastMessageTime?: string;
  createdAt: string;
  createdBy: string;
}

export interface DirectMessage {
  id: string;
  participantIds: string[]; // Two participant IDs
  lastMessage?: Message;
  lastMessageTime?: string;
  createdAt: string;
}

export interface Incentive {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdBy: string; // Should be info@visualmotion (admin)
  createdAt: string;
  expiresAt?: string;
}

// Team Management
export interface TeamSuggestion {
  id: string;
  suggestedBy: string; // Sales rep ID who suggested
  suggestedByName: string;
  firstName: string;
  surname: string;
  email: string;
  telephoneNumber: string;
  status: 'pending' | 'approved' | 'rejected'; // Admin approval status
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string; // Admin ID
  rejectionReason?: string;
}

export interface TeamMember {
  id: string; // Same as SalesRep ID
  firstName: string;
  surname: string;
  email: string; // firstname@educater.co.za
  telephoneNumber: string;
  teamLeadId: string; // Sales rep ID they report to
  teamLeadName: string;
  username: string; // firstname@educater.co.za
  createdAt: string;
  approvedAt: string;
  approvedBy: string; // Admin ID
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamLeadId: string;
  teamLeadName: string;
  teamName: string;
  repId: string;
  repName: string;
  repEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

export interface Team {
  id: string; // Same as Sales Rep ID (team lead)
  leadId: string; // Sales rep ID
  leadName: string;
  leadEmail: string;
  leadProfilePictureUrl?: string;
  teamName: string;
  teamProfilePictureUrl?: string;
  members: string[]; // Array of TeamMember IDs
  schoolIds: string[]; // Schools the team can access
  createdAt: string;
  updatedAt: string;
}
