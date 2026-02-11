
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { SalesRep, School, SalesStage, Resource } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Safety check for environment variables
if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing! Check your environment variables.');
  if (typeof window !== 'undefined') {
    alert('Critical Error: Firebase config is missing. Please set VITE_FIREBASE_API_KEY and other variables in your Vercel project settings.');
  }
}

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// Initialize Firebase Cloud Messaging
let messaging: any = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.log('Firebase Messaging not supported in this environment', err);
}

export const requestForToken = async () => {
  if (!messaging) return null;
  try {
    // Note: You need to generate a VAPID key in Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration
    // and replace 'YOUR_VAPID_KEY' below.
    const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      // TODO: Save this token to the user's profile in Firestore
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

// Collection names as requested
const REPS_COLLECTION = 'educater_salesman';
const SCHOOLS_COLLECTION = 'schools';
const TOOLS_COLLECTION = 'sales_artillery';
const TRAINING_COLLECTION = 'training_academy';

/**
 * Deletes a sales representative.
 */
export async function deleteSalesRep(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, REPS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting rep:", error);
    return false;
  }
}

/**
 * Fetches resources (Sales Artillery or Training)
 */
export async function getResources(category: 'tools' | 'training'): Promise<Resource[]> {
  const collectionName = category === 'tools' ? TOOLS_COLLECTION : TRAINING_COLLECTION;
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Resource));
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return [];
  }
}

/**
 * Adds a new resource
 */
export async function addResource(resource: Omit<Resource, 'id'>): Promise<string | null> {
  const collectionName = resource.category === 'tools' ? TOOLS_COLLECTION : TRAINING_COLLECTION;
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...resource,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding ${resource.category}:`, error);
    return null;
  }
}

/**
 * Deletes a resource
 */
export async function deleteResource(id: string, category: 'tools' | 'training'): Promise<boolean> {
  const collectionName = category === 'tools' ? TOOLS_COLLECTION : TRAINING_COLLECTION;
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting ${category}:`, error);
    return false;
  }
}

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file object to upload
 * @param path The storage path (e.g. 'profile_pics/' or 'resources/')
 */
export async function uploadFileToStorage(file: File, path: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, `${path}${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
}

/**
 * Persists salesperson data to the 'salesman' collection.
 */
export async function syncSalesRepToFirebase(rep: SalesRep) {
  console.log(`[Firebase Sync] Saving rep to salesman collection: ${rep.email}`);
  try {
    const repRef = doc(db, REPS_COLLECTION, rep.id);
    await setDoc(repRef, {
      ...rep,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error syncing rep:", error);
    return false;
  }
}

/**
 * Authenticates users, including Super Admin check.
 */
export async function loginSalesRep(email: string, password: string): Promise<SalesRep | null> {
  // Super Admin Check
  if (email === 'info@visualmotion.co.za' && password === 'Imsocool1989') {
    const adminId = 'admin_super';
    const admin: SalesRep = {
      id: adminId,
      name: 'Keagan',
      surname: 'Smith',
      email: email,
      avatar: 'KS',
      totalSchools: 0,
      activeCommissions: 0,
      role: 'admin'
    };
    // Ensure the admin exists in the salesman collection
    await syncSalesRepToFirebase(admin);
    // Run migration to fix old admin data on login
    await migrateOldAdminData();
    return admin;
  }

  try {
    const q = query(collection(db, REPS_COLLECTION), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const repDoc = querySnapshot.docs[0];
      const data = repDoc.data() as SalesRep;
      
      // Password Check
      if (data.password && data.password !== password) {
        console.error("Invalid password provided.");
        return null;
      }

      // If no password is set on the user account yet, you might want to allow login 
      // OR force them to set one. For now, we will deny login if a password exists and is wrong.
      // If data.password is undefined, this block incorrectly allows access (which matches your issue).
      // Let's enforce that a password MUST match if one is expected, or handle initial setup.
      // Given the requirement "no way they can create a password", I assume the Admin sets it.
      
      // Strict Check:
      if (!data.password) {
         // If user has no password in DB, disallow login to be safe, 
         // OR allow any password if you are in a migration phase. 
         // Based on your security concern "any password works", we should block this or require setup.
         // Let's assume accounts created via the app MUST have a password.
         console.warn("User has no password set. Login denied for security.");
          return null; // Uncomment this to block legacy users without passwords
      }

      return data;
    }
  } catch (error) {
    console.error("Login error:", error);
  }

  return null;
}

/**
 * Fetches all sales representatives.
 */
export async function getAllReps(): Promise<SalesRep[]> {
  try {
    const querySnapshot = await getDocs(collection(db, REPS_COLLECTION));
    return querySnapshot.docs.map(doc => doc.data() as SalesRep);
  } catch (error) {
    console.error("Error fetching reps:", error);
    return [];
  }
}

/**
 * Fetches all schools from Firestore.
 */
export async function getSchoolsFromFirebase(): Promise<School[]> {
  try {
    const querySnapshot = await getDocs(collection(db, SCHOOLS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as School));
  } catch (error) {
    console.error("Error fetching schools:", error);
    return [];
  }
}

/**
 * Adds a new school to the 'schools' collection.
 */
export async function addSchoolToFirebase(school: Omit<School, 'id'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, SCHOOLS_COLLECTION), {
      ...school,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding school:", error);
    return null;
  }
}

/**
 * Updates a school's stage in Firestore and optionally assigns it to a rep.
 */
export async function updateSchoolStageInFirebase(schoolId: string, newStage: SalesStage, repId?: string, repName?: string) {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const updateData: any = {
      stage: newStage,
      lastContactDate: new Date().toISOString().split('T')[0]
    };
    
    // If appointment stage is reached and rep info provided, assign to rep
    if (newStage === SalesStage.APPOINTMENT_BOOKED && repId && repName) {
      updateData.salesRepId = repId;
      updateData.salesRepName = repName;
    }
    
    await updateDoc(schoolRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating school stage:", error);
    return false;
  }
}

/**
 * Updates school contact information and tracks who edited it.
 */
export async function updateSchoolContactInfo(schoolId: string, contactData: {
  principalName?: string;
  principalEmail?: string;
  secretaryEmail?: string;
  studentCount?: number;
}, editorName: string) {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const updateData: any = {
      lastEditedBy: editorName,
      lastEditedAt: new Date().toISOString()
    };
    
    if (contactData.principalName !== undefined) updateData.principalName = contactData.principalName;
    if (contactData.principalEmail !== undefined) updateData.principalEmail = contactData.principalEmail;
    if (contactData.secretaryEmail !== undefined) updateData.secretaryEmail = contactData.secretaryEmail;
    if (contactData.studentCount !== undefined) updateData.studentCount = contactData.studentCount;
    
    console.log('Firestore update data:', updateData);
    await updateDoc(schoolRef, updateData);
    console.log('School contact info updated successfully');
    return true;
  } catch (error) {
    console.error("Error updating school contact info:", error);
    return false;
  }
}

/**
 * Normalize school name: remove spaces and standardize school type suffixes
 * High School and Secondary School are treated as the same
 */
function normalizeSchoolName(name: string): string {
  let normalized = name.trim().toLowerCase();
  // Remove all spaces
  normalized = normalized.replace(/\s+/g, '');
  // Normalize high school and secondary school to the same value
  normalized = normalized.replace(/(highschool|secondaryschool)/g, 'highschool');
  return normalized;
}

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  const editDistance = getEditDistance(longer, shorter);
  return (longerLength - editDistance) / longerLength;
}

/**
 * Calculate edit distance (Levenshtein)
 */
function getEditDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Checks if a school with a similar name already exists in the database.
 * Ignores spaces, treats High School = Secondary School, detects typos.
 */
export async function checkSchoolExists(schoolName: string): Promise<boolean> {
  try {
    const normalizedInput = normalizeSchoolName(schoolName);
    const querySnapshot = await getDocs(collection(db, SCHOOLS_COLLECTION));
    
    for (const doc of querySnapshot.docs) {
      const existingName = doc.data().name;
      const normalizedExisting = normalizeSchoolName(existingName);
      
      // Check for exact match after normalization
      if (normalizedExisting === normalizedInput) {
        return true;
      }
      
      // Check for fuzzy match (> 85% similar)
      const similarity = stringSimilarity(normalizedExisting, normalizedInput);
      if (similarity > 0.85) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking school:", error);
    return false;
  }
}

/**
 * Fetches all email templates from Firestore.
 */
export async function getEmailTemplates(): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'email_templates'));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return [];
  }
}

/**
 * Adds a new email template to Firestore.
 */
export async function addEmailTemplate(template: { track: string; title: string; subject: string; content: string }): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'email_templates'), {
      ...template,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding email template:", error);
    return null;
  }
}

/**
 * Updates an email template in Firestore.
 */
export async function updateEmailTemplate(templateId: string, template: { track: string; title: string; subject: string; content: string }): Promise<boolean> {
  try {
    const docRef = doc(db, 'email_templates', templateId);
    await updateDoc(docRef, {
      ...template,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating email template:", error);
    return false;
  }
}

/**
 * Deletes an email template from Firestore.
 */
export async function deleteEmailTemplate(templateId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'email_templates', templateId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting email template:", error);
    return false;
  }
}

/**
 * Deletes a school from Firestore.
 */
export async function deleteSchool(schoolId: string): Promise<boolean> {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    await deleteDoc(schoolRef);
    return true;
  } catch (error) {
    console.error("Error deleting school:", error);
    return false;
  }
}

/**
 * Migration: Updates old "Super Admin" references to "Keagan Smith" and fixes rep assignments
 */
export async function migrateOldAdminData(): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, SCHOOLS_COLLECTION));
    
    for (const docSnap of querySnapshot.docs) {
      const school = docSnap.data() as School;
      const schoolId = docSnap.id;
      
      const isAppointmentOrLater = 
        school.stage === SalesStage.APPOINTMENT_BOOKED ||
        school.stage === SalesStage.FINALIZING ||
        school.stage === SalesStage.LETTER_DISTRIBUTION ||
        school.stage === SalesStage.COMPLETED;
      
      // Check if this school has old admin data
      if (school.salesRepName === 'Super Admin' || school.salesRepId === 'admin_super') {
        const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
        const updateData: any = {};
        
        if (isAppointmentOrLater) {
          // Update appointment or later stage schools to use "Keagan Smith"
          updateData.salesRepId = 'admin_super';
          updateData.salesRepName = 'Keagan Smith';
        } else {
          // Remove rep assignment from early-stage schools
          updateData.salesRepId = null;
          updateData.salesRepName = null;
        }
        
        await updateDoc(schoolRef, updateData);
        console.log(`Migrated school: ${school.name}`);
      } else if (!isAppointmentOrLater && school.salesRepId) {
        // Remove any rep assignment from early-stage schools
        const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
        await updateDoc(schoolRef, {
          salesRepId: null,
          salesRepName: null
        });
        console.log(`Cleared rep from early-stage school: ${school.name}`);
      }
    }
    
    console.log("Admin data migration completed");
  } catch (error) {
    console.error("Error during admin data migration:", error);
  }
}
