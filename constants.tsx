
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

export const DAILY_SALES_TIPS = [
  // Phase 1: Mindset & Foundation (Tips 1-10)
  "Don't be afraid of rejection. It isn't personal; it's just a 'no' for today.",
  "Confidence is your best closing tool. If you don't believe in the app, they won't either.",
  "View yourself as a Consultant. You aren't 'selling'; you are solving a school's communication problem.",
  "The 80/20 Rule. 80% of your results come from 20% of your activities. Focus on high-value prospects.",
  "Visualize success. Before you walk in, see the principal nodding and saying 'yes.'",
  "Practice your 'inner game.' Your internal self-talk determines your external success.",
  "Be a 'Problem Finder.' Don't talk about features until you find a pain point (like missed homework).",
  "Set clear goals. Decide how many schools you will visit before you leave the house.",
  "Love what you do. Enthusiasm is contagious.",
  "Refuse to fail. Decide in advance that you will persist until you succeed.",
  
  // Phase 2: The Approach (Tips 11-20)
  "Stop selling, start helping. 'I'm here to help your teachers save time.'",
  "The '15-Minute' Rule. Never ask for an hour. 15 minutes feels low-risk to a busy principal.",
  "Focus on the 'No Cost' hook. Lead with the fact that the budget isn't an obstacle.",
  "Use Social Proof. 'We are working with [Neighboring School] to streamline their alerts.'",
  "Treat the Secretary as an Ally. They are the gatekeeper; win them over first.",
  "Sell the Result, not the App. Principals care about student engagement, not code.",
  "Use 'The Gap' technique. Show them where they are and where they could be with Educater.",
  "Avoid 'Salesy' Language. Replace 'I want to sell you' with 'I'd like to show you.'",
  "Ask for the Principal by name. It shows you've done your homework.",
  "Keep the door open. If they say no, ask: 'When would be a better time to follow up?'",
  
  // Phase 3: Communication & Persuasion (Tips 21-35)
  "Listen twice as much as you speak.",
  "Mirror the prospect. Match their energy and pace of speech.",
  "Use the power of 'Because.' 'I'm calling because we want to automate your school's push notifications.'",
  "Focus on the 'Result-Oriented' pitch. Talk about the amazing features and how they save time.",
  "The Friendship Factor. People buy from people they like.",
  "Be an expert. Know every module—from the inbox to the calendar—inside out.",
  "Ask open-ended questions. 'How do you currently handle emergency alerts?'",
  "Maintain eye contact. It signals honesty and authority.",
  "Nod while you speak. It subtly encourages the other person to agree with you.",
  "Use the 'Feel-Felt-Found' technique. 'I understand how you feel... other principals felt the same... but they found that...'",
  "Highlight student safety in the pitch. Principals are always worried about emergency communication.",
  "Show, don't tell. A live demo is worth a thousand words.",
  "Use silence strategically. After asking a question, wait for their response without jumping in.",
  "Speak with conviction. You are not suggesting; you are sharing a proven solution.",
  "Remember: Schools want paperless solutions. Lead with this benefit always.",
  
  // Phase 4: Overcoming Objections (Tips 36-45)
  "An objection is an invitation to provide more info.",
  "Stay calm. Never argue with a prospect.",
  "Clarify the 'No.' 'Is it the timing, or is it the app itself?'",
  "Isolate the problem. 'Other than the schedule, is there anything else holding us back?'",
  "The 'Price' isn't the issue. Since it's 'no cost,' the real objection is usually 'time.'",
  "Focus on the Push Notifications. Remind them how this solves the 'lost homework' problem.",
  "Highlight the Inbox. Show how it clears up the clutter of physical paperwork.",
  "Assume the meeting. 'Does Tuesday at 10:00 work, or is Wednesday better?'",
  "Don't take 'I'm busy' as a permanent rejection. It just means 'not right now.'",
  "Be persistent, not pushy. There is a fine line.",
  
  // Phase 5: Closing & Follow-Up (Tips 46-55)
  "The 'Invitation' Close. 'Why don't you give it a try for a term?'",
  "The 'Directive' Close. 'If you're happy with this, let's set up the onboarding.'",
  "The 'Secondary' Close. 'Would you like the alerts to go to parents only, or students too?'",
  "Always have a next step. Never leave a meeting without a date for the next one.",
  "Follow up within 24 hours. A quick 'thank you' goes a long way.",
  "Ask for referrals. 'Which other principal should I show this to?'",
  "Use a 'Success Story.' Tell a 30-second story about a school that loves the app.",
  "Create Urgency. 'We are only onboarding five more schools this month.'",
  "Be the 'Authority.' Speak like a person who has the solution to their chaos.",
  "Keep your promises. If you say you'll call at 9:00, call at 9:00.",
  
  // Phase 6: Elevator Pitches (Tips 56-60)
  "'We help schools go paperless at zero cost.'",
  "'It's like having your school's front office in every parent's pocket.'",
  "'I'm not here to sell; I'm here to simplify your communication.'",
  "'What if your teachers never had to chase homework again?'",
  "'The best time to automate was last year; the second best time is today.'"
];
