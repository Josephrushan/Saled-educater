
export enum SalesStage {
  COLD_LEAD = 'Cold Lead',
  EMAIL_SENT = 'Email Sent',
  MORE_INFO_REQUESTED = 'More Info Requested',
  APPOINTMENT_BOOKED = 'Appointment Booked',
  FINALIZING = 'Finalizing',
  LETTER_DISTRIBUTION = 'Letter Distribution',
  COMPLETED = 'Completed',
  NOT_INTERESTED = 'Not Interested'
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
