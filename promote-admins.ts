/**
 * Temporary utility to promote specific users to team_approver role
 * Run this once to set up team member approval permissions for:
 * - Imraan@educater.co.za
 * - Shaunese@educater.co.za
 * 
 * These users can only approve team members, they cannot delete anything
 * Usage: Import and call promoteSpecificUsersToTeamApprover() in your app
 */

import { promoteUserToTeamApprover } from './services/firebase';

export async function promoteSpecificUsersToTeamApprover() {
  const usersToPromote = [
    'Imraan@educater.co.za',
    'Shaunese@educater.co.za'
  ];

  console.log('🚀 Starting team approver promotion process...');
  console.log('Users to promote:', usersToPromote);

  for (const email of usersToPromote) {
    const success = await promoteUserToTeamApprover(email);
    if (success) {
      console.log(`✅ Successfully promoted to team_approver: ${email}`);
    } else {
      console.log(`❌ Failed to promote: ${email}`);
    }
  }

  console.log('🎉 Team approver promotion process complete!');
}
