
import React from 'react';
import { 
  Clock, Mail, Users, AlertCircle, CheckCircle2, TrendingUp, XCircle, FileText, Calendar, CheckSquare
} from 'lucide-react';

export const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/Educator.svg?alt=media&token=474dc685-fd5c-4475-b93a-b8d55c367d75";
export const SIDEBAR_LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/icon.png?alt=media&token=0963de99-0e33-4484-8bc9-1d14c3adb1ce";

export const STAGE_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  'Cold Lead': { color: 'bg-slate-100 text-slate-600', icon: <Clock className="w-4 h-4" /> },
  'Email Sent': { color: 'bg-blue-50 text-blue-600', icon: <Mail className="w-4 h-4" /> },
  'More Info Requested': { color: 'bg-amber-50 text-amber-600', icon: <FileText className="w-4 h-4" /> },
  'Appointment Booked': { color: 'bg-purple-50 text-purple-600', icon: <Calendar className="w-4 h-4" /> },
  'Finalizing': { color: 'bg-slate-800 text-white', icon: <Users className="w-4 h-4" /> },
  'Letter Distribution': { color: 'bg-brand/20 text-slate-900 border border-brand/30', icon: <TrendingUp className="w-4 h-4" /> },
  'Completed': { color: 'bg-brand text-slate-900 shadow-sm shadow-brand/20', icon: <CheckCircle2 className="w-4 h-4" /> },
  'Not Interested': { color: 'bg-rose-50 text-rose-600', icon: <XCircle className="w-4 h-4" /> }
};

export const EMAIL_TEMPLATES = [
  {
    track: 'Acquisition',
    title: 'Initial Outreach',
    subject: 'Reducing [School Name] printing costs in 2026',
    content: `Hi [Principal Name],\n\nDid you know the average school spends thousands on paper and printing per month? \n\nAt Educater, we help schools eliminate that cost entirely while bridging the communication gap between teachers and parents. \n\nWould you be open to a 5-minute chat about how we can save [School Name] money next term?`
  },
  {
    track: 'Acquisition',
    title: 'More Info Pack',
    subject: 'Educater: Digital Transformation Overview',
    content: `Hi [Principal Name],\n\nAs requested, here is more information about how Educater helps schools like yours go paperless.\n\n[Link to PDF Brochure]\n\nI would love to walk you through a brief demo. Does next Tuesday at 10:00 work for you?`
  }
];

export const SALES_TOOLS = [
  { id: 't1', name: '1-Page Sales Flyer', type: 'Brochure', url: '#' },
  { id: 't2', name: 'Benefit Comparison Table', type: 'Form', url: '#' },
  { id: 't3', name: 'Principal Intro Presentation', type: 'Booklet', url: '#' }
];

export const TRAINING_RESOURCES = [
  { id: 'tr1', name: 'The Cold-to-Warm Lead Manual', type: 'PDF', url: '#' },
  { id: 'tr2', name: 'Closing the Principal: Script', type: 'PDF', url: '#' },
  { id: 'tr3', name: 'Commission & Churn Guide', type: 'PDF', url: '#' }
];

export const MOCK_REPS = [
  { id: 'rep1', name: 'John', surname: 'Smith', email: 'john@educater.app', avatar: 'JS', totalSchools: 12, activeCommissions: 4500 },
  { id: 'rep2', name: 'Sarah', surname: 'Jones', email: 'sarah@educater.app', avatar: 'SJ', totalSchools: 8, activeCommissions: 3200 },
  { id: 'rep3', name: 'Michael', surname: 'Chen', email: 'michael@educater.app', avatar: 'MC', totalSchools: 15, activeCommissions: 6100 }
];

export const MOCK_SCHOOLS = [
  {
    id: 's1',
    name: 'Greenwood High',
    principalName: 'Dr. Arthur Miller',
    principalEmail: 'a.miller@greenwood.edu',
    salesRepId: 'rep1',
    salesRepName: 'John Smith',
    stage: 'Cold Lead',
    track: 'Acquisition Track',
    studentCount: 850,
    lastContactDate: '2024-05-15',
    commissionEarned: 425,
    engagementRate: 0,
    notes: 'Very excited about reducing paper costs.'
  }
];
