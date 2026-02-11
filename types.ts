
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

export interface Resource {
  id: string;
  name: string;
  type: string; // 'PDF', 'Link', etc.
  url: string;
  category: 'tools' | 'training';
  createdAt: string;
}
