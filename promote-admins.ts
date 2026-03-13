/**
 * Temporary utility to promote specific users to admin role
 * Run this once to set up admin permissions for:
 * - Imraandamon@educater.co.za
 * - Shaunese@educater.co.za
 * 
 * Usage: Import and call promoteSpecificUsersToAdmin() in your app
 */

import { promoteUserToAdmin } from './services/firebase';

export async function promoteSpecificUsersToAdmin() {
  const usersToPromote = [
    'Imraandamon@educater.co.za',
    'Shaunese@educater.co.za'
  ];

  console.log('🚀 Starting admin promotion process...');
  console.log('Users to promote:', usersToPromote);

  for (const email of usersToPromote) {
    const success = await promoteUserToAdmin(email);
    if (success) {
      console.log(`✅ Successfully promoted: ${email}`);
    } else {
      console.log(`❌ Failed to promote: ${email}`);
    }
  }

  console.log('🎉 Admin promotion process complete!');
}
