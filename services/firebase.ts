
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
  deleteDoc,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { SalesRep, School, SalesStage, Resource, ResourceCategory, Incentive, Message, DirectMessage, TeamSuggestion, TeamMember, Team } from '../types';

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
    // Remove undefined fields before adding to Firestore
    const cleanedResource = Object.fromEntries(
      Object.entries(resource).filter(([, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collection(db, collectionName), {
      ...cleanedResource,
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
 * Updates an existing resource
 */
export async function updateResource(id: string, category: 'tools' | 'training', updates: Partial<Resource>): Promise<boolean> {
  const collectionName = category === 'tools' ? TOOLS_COLLECTION : TRAINING_COLLECTION;
  try {
    // Remove undefined fields before updating
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await updateDoc(doc(db, collectionName, id), {
      ...cleanedUpdates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error(`Error updating ${category}:`, error);
    return false;
  }
}

/**
 * Fetches all categories for resources
 */
export async function getResourceCategories(category: 'tools' | 'training'): Promise<ResourceCategory[]> {
  try {
    const q = query(
      collection(db, 'resource_categories'),
      where('category', '==', category)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as ResourceCategory))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Checks if a display order is already used
 */
export async function checkDisplayOrderExists(displayOrder: number, category: 'tools' | 'training', excludeId?: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'resource_categories'),
      where('category', '==', category),
      where('displayOrder', '==', displayOrder)
    );
    const querySnapshot = await getDocs(q);
    if (excludeId && querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === excludeId) {
      return false; // It's the same document, not a duplicate
    }
    return querySnapshot.docs.length > 0;
  } catch (error) {
    console.error('Error checking display order:', error);
    return false;
  }
}

/**
 * Finds the next available display order number
 */
export async function getNextDisplayOrder(category: 'tools' | 'training'): Promise<number> {
  try {
    const categories = await getResourceCategories(category);
    if (categories.length === 0) return 1;
    return Math.max(...categories.map(c => c.displayOrder)) + 1;
  } catch (error) {
    console.error('Error getting next display order:', error);
    return 1;
  }
}

/**
 * Adds a new resource category
 */
export async function addResourceCategory(categoryData: Omit<ResourceCategory, 'id'>): Promise<string | null> {
  try {
    // Check if displayOrder already exists
    const exists = await checkDisplayOrderExists(categoryData.displayOrder, categoryData.category);
    if (exists) {
      throw new Error(`Display order ${categoryData.displayOrder} is already in use. Please choose a different number.`);
    }

    // Remove undefined fields before adding to Firestore
    const cleanedData = Object.fromEntries(
      Object.entries(categoryData).filter(([, value]) => value !== undefined)
    );

    const docRef = await addDoc(collection(db, 'resource_categories'), {
      ...cleanedData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

/**
 * Updates a resource category
 */
export async function updateResourceCategory(id: string, categoryData: Partial<ResourceCategory>): Promise<boolean> {
  try {
    if (categoryData.displayOrder !== undefined) {
      const exists = await checkDisplayOrderExists(categoryData.displayOrder, categoryData.category || 'training', id);
      if (exists) {
        throw new Error(`Display order ${categoryData.displayOrder} is already in use. Please choose a different number.`);
      }
    }

    await updateDoc(doc(db, 'resource_categories', id), {
      ...categoryData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Deletes a resource category
 */
export async function deleteResourceCategory(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'resource_categories', id));
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
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
/**
 * Persists salesperson data to the 'salesman' collection.
 */
export async function syncSalesRepToFirebase(rep: SalesRep) {
  console.log(`[Firebase Sync] Saving rep to salesman collection: ${rep.email}`, rep);
  try {
    const repRef = doc(db, REPS_COLLECTION, rep.id);
    
    // Remove undefined fields to prevent Firestore errors
    const cleanRep = Object.fromEntries(
      Object.entries(rep).filter(([_, value]) => value !== undefined)
    ) as any;
    
    await setDoc(repRef, {
      ...cleanRep,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[Firebase Sync] ✅ Successfully saved rep: ${rep.email}`);
    return true;
  } catch (error) {
    console.error("❌ Error syncing rep:", error);
    console.error("Collection:", REPS_COLLECTION);
    console.error("Rep ID:", rep.id);
    console.error("Rep Email:", rep.email);
    return false;
  }
}

/**
 * Authenticates users, including Super Admin check, and updates last seen timestamp
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
      role: 'admin',
      lastSeen: new Date().toISOString()
    };
    // Ensure the admin exists in the salesman collection
    await syncSalesRepToFirebase(admin);
    // Update lastSeen in Firebase
    await updateSalesRepLastSeen(adminId);
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

      // Update lastSeen timestamp
      await updateSalesRepLastSeen(repDoc.id);
      const updatedData = { ...data, lastSeen: new Date().toISOString() };
      
      return updatedData;
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
 * Updates the lastSeen timestamp for a sales rep
 */
export async function updateSalesRepLastSeen(repId: string): Promise<boolean> {
  try {
    const repRef = doc(db, REPS_COLLECTION, repId);
    await updateDoc(repRef, {
      lastSeen: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating lastSeen:", error);
    return false;
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
    // Remove undefined fields before adding to Firestore
    const cleanedSchool = Object.fromEntries(
      Object.entries(school).filter(([, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collection(db, SCHOOLS_COLLECTION), {
      ...cleanedSchool,
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
export async function updateSchoolStageInFirebase(schoolId: string, newStage: SalesStage, repId?: string, repName?: string, data?: any) {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const updateData: any = {
      stage: newStage,
      lastContactDate: new Date().toISOString().split('T')[0]
    };
    
    console.log('🟢 Firebase: Updating school', schoolId, 'to stage:', newStage);
    
    // If communication stage is reached and rep info provided, assign to rep
    if (newStage === SalesStage.COMMUNICATION && repId && repName) {
      updateData.salesRepId = repId;
      updateData.salesRepName = repName;
      console.log('🟢 Firebase: Assigning rep:', repName);
    }

    // Add additional data if provided (e.g., letterDistributedDate)
    if (data) {
      Object.assign(updateData, data);
      console.log('🟢 Firebase: Adding data:', data);
    }
    
    console.log('🟢 Firebase: Final update data:', updateData);
    await updateDoc(schoolRef, updateData);
    console.log('🟢 Firebase: Update successful!');
    return true;
  } catch (error) {
    console.error("❌ Error updating school stage:", error);
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
export async function addEmailTemplate(template: { track: string; title: string; templateType: string; subject: string; content: string; isImportant?: boolean }): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'email_templates'), {
      ...template,
      isImportant: template.isImportant || false,
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
export async function updateEmailTemplate(templateId: string, template: { track: string; title: string; templateType: string; subject: string; content: string; isImportant?: boolean }): Promise<boolean> {
  try {
    const docRef = doc(db, 'email_templates', templateId);
    await updateDoc(docRef, {
      ...template,
      isImportant: template.isImportant || false,
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
        school.stage === SalesStage.APPOINTMENT ||
        school.stage === SalesStage.OUTCOME_REACHED ||
        school.stage === SalesStage.DISTRIBUTE_LETTER ||
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

/**
 * Upload a file to Firebase Storage and return the download URL
 */
export async function uploadFile(file: File, path: string): Promise<string | null> {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
}

/**
 * Upload profile picture for a sales rep
 */
export async function uploadProfilePicture(file: File, repId: string): Promise<string | null> {
  return uploadFile(file, `profile_pictures/${repId}/${file.name}`);
}

/**
 * Upload bank proof document for a sales rep
 */
export async function uploadBankProof(file: File, repId: string): Promise<string | null> {
  return uploadFile(file, `bank_proofs/${repId}/${file.name}`);
}

/**
 * UTILITY: Seed database with 100 Western Cape schools
 * WARNING: This will DELETE ALL EXISTING SCHOOLS
 * Only call this function from the browser console or a temporary component
 */
export async function seedSchoolsDatabase(): Promise<void> {
  const schoolsData = [
    { name: "Bishops Diocesan College", location: "Rondebosch", principalEmail: "principal@bishops.org.za" },
    { name: "SACS High School", location: "Newlands", principalEmail: "highschool@sacs.org.za" },
    { name: "Rondebosch Boys' High", location: "Rondebosch", principalEmail: "infobhs@rondebosch.com" },
    { name: "Westerford High School", location: "Newlands", principalEmail: "admin@westerford.co.za" },
    { name: "Herschel Girls School", location: "Claremont", principalEmail: "head@herschel.org.za" },
    { name: "Rustenburg Girls' High", location: "Rondebosch", principalEmail: "info@rghs.org.za" },
    { name: "Wynberg Boys' High", location: "Wynberg", principalEmail: "secretaries@wbhs.org.za" },
    { name: "Wynberg Girls' High", location: "Wynberg", principalEmail: "seniorpost@wynghs.co.za" },
    { name: "Paul Roos Gymnasium", location: "Stellenbosch", principalEmail: "info@paulroos.co.za" },
    { name: "Rhenish Girls' High", location: "Stellenbosch", principalEmail: "info@rhenish.co.za" },
    { name: "Stellenbosch High", location: "Stellenbosch", principalEmail: "admin@stellies.com" },
    { name: "Paarl Boys' High", location: "Paarl", principalEmail: "head@paarlboyshigh.org.za" },
    { name: "Paarl Girls' High", location: "Paarl", principalEmail: "info@paarlgirlshigh.com" },
    { name: "Paarl Gymnasium", location: "Paarl", principalEmail: "info@paarlgym.co.za" },
    { name: "La Rochelle Girls' High", location: "Paarl", principalEmail: "info@larochelleghs.co.za" },
    { name: "Reddam House Atlantic", location: "Green Point", principalEmail: "info.atlanticseaboard@reddam.house" },
    { name: "Herzlia High School", location: "Vredehoek", principalEmail: "info@herzlia.com" },
    { name: "Camps Bay High School", location: "Camps Bay", principalEmail: "office@cbhs.co.za" },
    { name: "Parel Vallei High", location: "Somerset West", principalEmail: "secretary@parelvallei.org" },
    { name: "Strand High School", location: "Strand", principalEmail: "info@hshstrand.co.za" },
    { name: "Jan van Riebeeck High", location: "Gardens", principalEmail: "hjs@janvanriebeeck.co.za" },
    { name: "Pinelands High School", location: "Pinelands", principalEmail: "admin@phs.org.za" },
    { name: "Table View High", location: "Table View", principalEmail: "admin@tvh.co.za" },
    { name: "Fairmont High School", location: "Durbanville", principalEmail: "info@fairmont.co.za" },
    { name: "Durbanville High", location: "Durbanville", principalEmail: "durbanville.hs@wcgschools.gov.za" },
    { name: "Milnerton High School", location: "Milnerton", principalEmail: "info@milnertonhigh.co.za" },
    { name: "South Peninsula High", location: "Diep River", principalEmail: "admin@sphigh.org" },
    { name: "Bergvliet High School", location: "Bergvliet", principalEmail: "admin@bshs.org.za" },
    { name: "Fish Hoek High School", location: "Fish Hoek", principalEmail: "info@fishhoekhighschool.co.za" },
    { name: "Groote Schuur High", location: "Newlands", principalEmail: "info@gshs.co.za" },
    { name: "Claremont High School", location: "Claremont", principalEmail: "office@claremonthigh.co.za" },
    { name: "Livingstone High School", location: "Claremont", principalEmail: "admin@livingstonehigh.co.za" },
    { name: "Sans Souci Girls' High", location: "Newlands", principalEmail: "office@sanssouci.co.za" },
    { name: "Springfield Convent", location: "Wynberg", principalEmail: "sfshigh@sfshigh.org" },
    { name: "Constantia Waldorf", location: "Constantia", principalEmail: "admin@waldorfconstantia.co.za" },
    { name: "Reddam House Constantia", location: "Constantia", principalEmail: "info.constantia@reddam.house" },
    { name: "American International", location: "Constantia", principalEmail: "admissions@aisct.org" },
    { name: "International School Hout Bay", location: "Hout Bay", principalEmail: "info@houtbay.ies-net.com" },
    { name: "Hout Bay High School", location: "Hout Bay", principalEmail: "houtbay.sec@wcgschools.gov.za" },
    { name: "Bridge House School", location: "Franschhoek", principalEmail: "info@bridgehouse.org.za" },
    { name: "Somerset College", location: "Somerset West", principalEmail: "info@somersetcollege.org" },
    { name: "Helderberg High School", location: "Somerset West", principalEmail: "admin@helderberghigh.co.za" },
    { name: "Hottentots Holland High", location: "Somerset West", principalEmail: "admin@hhh.org.za" },
    { name: "Curro Durbanville", location: "Durbanville", principalEmail: "info.durbanville@curro.co.za" },
    { name: "Stellenberg High School", location: "Durbanville", principalEmail: "info@stellenberg.org.za" },
    { name: "Bellville High School", location: "Bellville", principalEmail: "admin@hsb.co.za" },
    { name: "DF Malan High School", location: "Bellville", principalEmail: "admin@dfmalan.com" },
    { name: "Tygerberg High School", location: "Parow", principalEmail: "admin@hstygerberg.co.za" },
    { name: "President High School", location: "Vrijzee", principalEmail: "admin@hspresident.co.za" },
    { name: "Settlers High School", location: "Bellville", principalEmail: "info@settlers.org.za" },
    { name: "Brackenfell High School", location: "Brackenfell", principalEmail: "info@hsbrackenfell.co.za" },
    { name: "Monument Park High", location: "Kraaifontein", principalEmail: "admin@mphs.co.za" },
    { name: "Eben Donges High", location: "Kraaifontein", principalEmail: "ed@ebendonges.co.za" },
    { name: "Parklands College", location: "Parklands", principalEmail: "director@parklands.co.za" },
    { name: "CBC St John's", location: "Parklands", principalEmail: "info@cbcstjohns.co.za" },
    { name: "Elkanah House", location: "Sunningdale", principalEmail: "info@elkanah.co.za" },
    { name: "Melkbosstrand High", location: "Melkbosstrand", principalEmail: "info@hsmelkbos.co.za" },
    { name: "Bloubergrant High", location: "Blouberg", principalEmail: "info@bghs.co.za" },
    { name: "West Coast Christian", location: "Big Bay", principalEmail: "info@westcoastchristian.co.za" },
    { name: "Cape Town High School", location: "Gardens", principalEmail: "info@capetownhigh.co.za" },
    { name: "Sea Point High School", location: "Sea Point", principalEmail: "admin@seapointhigh.co.za" },
    { name: "Harold Cressy High", location: "District Six", principalEmail: "admin@hchigh.org.za" },
    { name: "Trafalgar High School", location: "District Six", principalEmail: "admin@trafalgarhigh.co.za" },
    { name: "Zonnebloem NEST High", location: "Zonnebloem", principalEmail: "admin@znesths.co.za" },
    { name: "Good Hope Seminary", location: "Gardens", principalEmail: "admin@ghs.co.za" },
    { name: "Alexander Sinton High", location: "Athlone", principalEmail: "admin@sinton.org.za" },
    { name: "Belgravia High School", location: "Athlone", principalEmail: "admin@belgraviahigh.co.za" },
    { name: "Athlone High School", location: "Athlone", principalEmail: "athlone.sec@wcgschools.gov.za" },
    { name: "Cathkin High School", location: "Heideveld", principalEmail: "admin@cathkinhigh.org" },
    { name: "Silverlea Secondary", location: "Athlone", principalEmail: "admin@silverlea.org" },
    { name: "Windsor High School", location: "Lansdowne", principalEmail: "admin@windsorhigh.co.za" },
    { name: "Islamia College", location: "Lansdowne", principalEmail: "info@islamiacollege.co.za" },
    { name: "Portia Primary", location: "Lansdowne", principalEmail: "portia.prim@wcgschools.gov.za" },
    { name: "Muizenberg High School", location: "Muizenberg", principalEmail: "admin@muizenberghigh.org.za" },
    { name: "Lavender Hill High", location: "Steenberg", principalEmail: "admin@lavenderhillhigh.org.za" },
    { name: "Steenberg High School", location: "Steenberg", principalEmail: "admin@steenberg-high.org" },
    { name: "Sibelius High School", location: "Steenberg", principalEmail: "admin@sibeliushigh.co.za" },
    { name: "Grassdale High School", location: "Grassy Park", principalEmail: "admin@grassdalehigh.org" },
    { name: "Plumstead High School", location: "Plumstead", principalEmail: "admin@plumsteadhigh.co.za" },
    { name: "Norman Henshilwood", location: "Constantia", principalEmail: "admin@normanhenshilwoodhigh.co.za" },
    { name: "Voortrekker High", location: "Kenilworth", principalEmail: "admin@hsvoortrekker.co.za" },
    { name: "Oude Molen Tech", location: "Pinelands", principalEmail: "info@oudemolen.org.za" },
    { name: "Maitland High School", location: "Maitland", principalEmail: "admin@maitlandhigh.co.za" },
    { name: "Kensington High", location: "Kensington", principalEmail: "admin@kensingtonhigh.org" },
    { name: "Windermere High", location: "Factreton", principalEmail: "admin@windermerehigh.org" },
    { name: "Edgemead High School", location: "Edgemead", principalEmail: "admin@edgemeadhigh.org.za" },
    { name: "Bosmansdam High", location: "Bothasig", principalEmail: "info@bosmansdam.co.za" },
    { name: "De Kuilen High School", location: "Kuils River", principalEmail: "admin@dkkuilen.co.za" },
    { name: "Kuils River Tech", location: "Kuils River", principalEmail: "admin@krts.co.za" },
    { name: "Labori High School", location: "Paarl", principalEmail: "admin@laborihs.co.za" },
    { name: "Boland Agricultural", location: "Paarl", principalEmail: "admin@bolandlandbou.co.za" },
    { name: "Hugenote High School", location: "Wellington", principalEmail: "admin@hugenote.com" },
    { name: "Wellington High", location: "Wellington", principalEmail: "admin@wellingtonhigh.co.za" },
    { name: "Worcester Gymnasium", location: "Worcester", principalEmail: "admin@worcestergym.co.za" },
    { name: "Montana High School", location: "Worcester", principalEmail: "admin@hsmontana.co.za" },
    { name: "Hermanus High School", location: "Hermanus", principalEmail: "admin@hermanushigh.co.za" },
    { name: "Overberg High School", location: "Caledon", principalEmail: "admin@hsoverberg.co.za" },
    { name: "Swartland High School", location: "Malmesbury", principalEmail: "admin@hsswartland.co.za" },
    { name: "Malmesbury High", location: "Malmesbury", principalEmail: "admin@malmesburyhigh.org" }
  ];

  try {
    console.log("➕ Adding 100 new schools (keeping existing schools)...");
    const schoolsCollection = collection(db, "schools");
    let addedCount = 0;
    
    for (const school of schoolsData) {
      await addDoc(schoolsCollection, {
        name: school.name,
        location: school.location,
        principalEmail: school.principalEmail,
        principalName: "",
        secretaryEmail: "",
        studentCount: null,
        stage: "Cold Lead",
        salesRepId: "",
        salesRepName: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: "",
        contacts: []
      });
      addedCount++;
      if (addedCount % 10 === 0) {
        console.log(`  ➕ ${addedCount}/100 schools added...`);
      }
    }

    console.log(`\n✨ SUCCESS! Added 100 new schools to database!`);
  } catch (error) {
    console.error("❌ Error adding schools:", error);
    throw error;
  }
}

/**
 * INCENTIVES FUNCTIONS
 */
export async function addIncentive(incentive: Omit<Incentive, 'id'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'incentives'), {
      ...incentive,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding incentive:', error);
    return null;
  }
}

export async function getIncentives(): Promise<Incentive[]> {
  try {
    const q = query(collection(db, 'incentives'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data() as Incentive, id: doc.id }));
  } catch (error) {
    console.error('Error fetching incentives:', error);
    return [];
  }
}

export async function deleteIncentive(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'incentives', id));
    return true;
  } catch (error) {
    console.error('Error deleting incentive:', error);
    return false;
  }
}

/**
 * DIRECT MESSAGE FUNCTIONS
 */
export async function getOrCreateDirectMessage(userId1: string, userId2: string): Promise<string> {
  try {
    const dmId = [userId1, userId2].sort().join('_');
    const dmRef = doc(db, 'directMessages', dmId);
    const dmSnap = await getDoc(dmRef);

    if (!dmSnap.exists()) {
      await setDoc(dmRef, {
        participantIds: [userId1, userId2],
        createdAt: new Date().toISOString()
      });
    }

    return dmId;
  } catch (error) {
    console.error('Error getting/creating DM:', error);
    throw error;
  }
}

export async function addDirectMessage(dmId: string, message: Omit<Message, 'id'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, `directMessages/${dmId}/messages`), {
      ...message,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error sending DM:', error);
    return null;
  }
}

export async function getDirectMessages(dmId: string): Promise<Message[]> {
  try {
    const q = query(
      collection(db, `directMessages/${dmId}/messages`),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data() as Message, id: doc.id }));
  } catch (error) {
    console.error('Error fetching DM messages:', error);
    return [];
  }
}

// Real-time listener for direct messages
export function subscribeToDirectMessages(dmId: string, callback: (messages: Message[]) => void) {
  try {
    const q = query(
      collection(db, `directMessages/${dmId}/messages`),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ ...doc.data() as Message, id: doc.id }));
      callback(messages);
    }, (error) => {
      console.error('Error listening to DM messages:', error);
    });
  } catch (error) {
    console.error('Error setting up DM listener:', error);
    return () => {};
  }
}

/**
 * Alias for getAllReps for convenience
 */
export const getSalesReps = getAllReps;

/**
 * Adds an attempt record to a school's attempts array
 */
export async function addAttemptToSchool(schoolId: string, attempt: any) {
  try {
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const schoolSnap = await getDoc(schoolRef);
    
    if (!schoolSnap.exists()) {
      console.error('School not found');
      return false;
    }

    const currentAttempts = schoolSnap.data().attempts || [];
    const updatedAttempts = [...currentAttempts, attempt];

    await updateDoc(schoolRef, {
      attempts: updatedAttempts
    });

    return true;
  } catch (error) {
    console.error('Error adding attempt to school:', error);
    return false;
  }
}

export async function resetSchoolProgress(schoolId: string) {
  try {
    console.log('🔄 Admin: Resetting progress for school:', schoolId);
    const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const schoolSnap = await getDoc(schoolRef);
    
    if (!schoolSnap.exists()) {
      console.error('❌ School not found');
      return false;
    }

    // Reset: Set stage to AVAILABLE, clear attempts, and clear any date fields
    await updateDoc(schoolRef, {
      stage: 'AVAILABLE',
      attempts: [],
      lastContactDate: null,
      letterDistributedDate: null,
      salesRepId: null,
      salesRepName: null
    });

    console.log('✅ Admin: School progress reset successfully');
    return true;
  } catch (error) {
    console.error('❌ Error resetting school progress:', error);
    return false;
  }
}

// ============ TEAM MANAGEMENT ============

export async function suggestTeamMember(suggestion: any) {
  try {
    console.log('👤 Suggesting new team member:', suggestion.firstName, suggestion.surname);
    
    const suggestionsRef = collection(db, 'teamSuggestions');
    const newSuggestion = {
      ...suggestion,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(suggestionsRef, newSuggestion);
    console.log('✅ Suggestion created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error suggesting team member:', error);
    return false;
  }
}

export async function getTeamSuggestions() {
  try {
    const suggestionsRef = collection(db, 'teamSuggestions');
    const q = query(suggestionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const suggestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📋 Team suggestions:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('❌ Error fetching team suggestions:', error);
    return [];
  }
}

export async function approveTeamMember(suggestionId: string, adminId: string, adminName: string) {
  try {
    console.log('✅ Approving team member suggestion:', suggestionId);
    
    // Get the suggestion
    const suggestionRef = doc(db, 'teamSuggestions', suggestionId);
    const suggestionSnap = await getDoc(suggestionRef);
    
    if (!suggestionSnap.exists()) {
      console.error('❌ Suggestion not found');
      return false;
    }
    
    const suggestion = suggestionSnap.data();
    
    // Create username: firstname@educater.co.za
    const username = `${suggestion.firstName.toLowerCase()}@educater.co.za`;
    // Create password: firstname123
    const password = `${suggestion.firstName.toLowerCase()}123`;
    
    // Create new SalesRep (team member)
    const newRepRef = doc(collection(db, 'salesReps'));
    const newRepData = {
      name: suggestion.firstName,
      surname: suggestion.surname,
      email: username,
      password: password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${suggestion.firstName}`,
      totalSchools: 0,
      activeCommissions: 0,
      role: 'rep',
      teamLeadId: suggestion.suggestedBy,
      teamLeadName: suggestion.suggestedByName,
      telephoneNumber: suggestion.telephoneNumber,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(newRepRef, newRepData);
    console.log('✅ New team member profile created:', newRepRef.id);
    
    // Add to TeamMembers collection
    const teamMembersRef = collection(db, 'teamMembers');
    const teamMemberData = {
      id: newRepRef.id,
      firstName: suggestion.firstName,
      surname: suggestion.surname,
      email: username,
      telephoneNumber: suggestion.telephoneNumber,
      teamLeadId: suggestion.suggestedBy,
      teamLeadName: suggestion.suggestedByName,
      username: username,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: adminId
    };
    
    await addDoc(teamMembersRef, teamMemberData);
    console.log('✅ Team member record created');
    
    // Add to team leader's team
    const teamRef = doc(db, 'teams', suggestion.suggestedBy);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      // Update existing team
      const currentMembers = teamSnap.data().members || [];
      await updateDoc(teamRef, {
        members: [...currentMembers, newRepRef.id],
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Added member to team');
    } else {
      // Create new team
      const teamData = {
        leadId: suggestion.suggestedBy,
        leadName: suggestion.suggestedByName,
        members: [newRepRef.id],
        schoolIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(teamRef, teamData);
      console.log('✅ Team created');
    }
    
    // Update suggestion status
    await updateDoc(suggestionRef, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: adminId
    });
    
    console.log('✅ Suggestion marked as approved');
    return {
      success: true,
      memberId: newRepRef.id,
      username: username,
      password: password
    };
  } catch (error) {
    console.error('❌ Error approving team member:', error);
    return false;
  }
}

export async function rejectTeamMember(suggestionId: string, adminId: string, rejectionReason: string) {
  try {
    console.log('❌ Rejecting team member suggestion:', suggestionId);
    
    const suggestionRef = doc(db, 'teamSuggestions', suggestionId);
    
    await updateDoc(suggestionRef, {
      status: 'rejected',
      rejectionReason: rejectionReason
    });
    
    console.log('✅ Suggestion marked as rejected');
    return true;
  } catch (error) {
    console.error('❌ Error rejecting team member:', error);
    return false;
  }
}

export async function getTeamMembers(teamLeadId: string) {
  try {
    console.log('👥 Fetching team members for:', teamLeadId);
    
    // Get the team document which has the members array
    const teamRef = doc(db, 'teams', teamLeadId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      console.log('📭 Team not found');
      return [];
    }
    
    const teamData = teamSnap.data();
    const memberIds = teamData.members || [];
    const memberRoles = teamData.memberRoles || {};
    
    console.log('📋 Member IDs:', memberIds);
    
    if (memberIds.length === 0) {
      console.log('📭 No members in team');
      return [];
    }
    
    // Fetch details for each member from educater_salesman collection
    const members = [];
    
    for (const memberId of memberIds) {
      try {
        const repRef = doc(db, 'educater_salesman', memberId);
        const repSnap = await getDoc(repRef);
        
        if (repSnap.exists()) {
          const repData = repSnap.data();
          members.push({
            id: memberId,
            firstName: repData.name || '',
            surname: repData.surname || '',
            email: repData.email || '',
            telephoneNumber: repData.telephoneNumber || '',
            profilePicUrl: repData.profilePicUrl || '',
            role: memberRoles[memberId] || 'digital-scout',
            ...repData
          });
          console.log('✅ Added member:', repData.name, 'with role:', memberRoles[memberId]);
        } else {
          console.warn('⚠️ Member not found in educater_salesman:', memberId);
        }
      } catch (err) {
        console.error('Error fetching member:', memberId, err);
      }
    }
    
    console.log('✅ Total members fetched:', members.length);
    return members;
  } catch (error) {
    console.error('❌ Error fetching team members:', error);
    return [];
  }
}

export async function getUserTeam(userId: string) {
  try {
    const teamRef = doc(db, 'teams', userId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      console.log('📭 No team found for user:', userId);
      return null;
    }
    
    return {
      id: teamSnap.id,
      ...teamSnap.data()
    };
  } catch (error) {
    console.error('❌ Error getting user team:', error);
    return null;
  }
}

// Get team info for a rep who is a MEMBER (not the lead)
export async function getMyTeamAsMember(repId: string) {
  try {
    console.log('👥 Fetching team info for member:', repId);
    
    // Find this rep in teamMembers collection to get their team lead
    const teamMembersRef = collection(db, 'teamMembers');
    const q = query(teamMembersRef, where('id', '==', repId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('📭 Rep not found in any team');
      return null;
    }
    
    const memberRecord = snapshot.docs[0].data();
    const teamLeadId = memberRecord.teamLeadId;
    
    console.log('🔍 Found team lead:', teamLeadId);
    
    // Get the team document
    const teamRef = doc(db, 'teams', teamLeadId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      console.log('📭 Team not found');
      return null;
    }
    
    const teamData = teamSnap.data();
    
    // Get all team members
    const members = await getTeamMembers(teamLeadId);
    
    return {
      id: teamSnap.id,
      ...teamData,
      members: members,
      teamLeadId: teamLeadId
    };
  } catch (error) {
    console.error('❌ Error getting team as member:', error);
    return null;
  }
}

export async function createTeam(
  leadId: string,
  leadName: string,
  leadEmail: string,
  teamName: string,
  teamProfilePictureUrl?: string,
  leadProfilePictureUrl?: string
) {
  try {
    console.log('🔨 Creating team:', teamName, 'for lead:', leadName);
    
    // Build team data object, only including defined values (Firestore rejects undefined)
    const teamData: any = {
      leadId: leadId,
      leadName: leadName,
      leadEmail: leadEmail,
      teamName: teamName,
      members: [],
      schoolIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Only add optional fields if they're defined
    if (leadProfilePictureUrl) {
      teamData.leadProfilePictureUrl = leadProfilePictureUrl;
    }
    if (teamProfilePictureUrl) {
      teamData.teamProfilePictureUrl = teamProfilePictureUrl;
    }
    
    const teamRef = doc(db, 'teams', leadId);
    await setDoc(teamRef, teamData);
    
    console.log('✅ Team created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating team:', error);
    return false;
  }
}

export async function deleteTeam(teamLeadId: string) {
  try {
    console.log('🗑️ Deleting team for lead:', teamLeadId);
    
    const teamRef = doc(db, 'teams', teamLeadId);
    await deleteDoc(teamRef);
    
    console.log('✅ Team deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting team:', error);
    return false;
  }
}

export async function updateTeamProfilePicture(teamLeadId: string, profilePictureUrl: string) {
  try {
    console.log('🖼️ Updating team profile picture for:', teamLeadId);
    
    const teamRef = doc(db, 'teams', teamLeadId);
    await updateDoc(teamRef, {
      teamProfilePictureUrl: profilePictureUrl,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Team profile picture updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating team profile picture:', error);
    return false;
  }
}

export async function checkIfRepIsTeamLead(repId: string) {
  try {
    const teamRef = doc(db, 'teams', repId);
    const teamSnap = await getDoc(teamRef);
    
    return teamSnap.exists();
  } catch (error) {
    console.error('❌ Error checking team lead:', error);
    return false;
  }
}

export async function checkIfRepInTeam(repId: string) {
  try {
    console.log('🔍 Checking if rep is in any team:', repId);
    
    const teamMembersRef = collection(db, 'teamMembers');
    const q = query(teamMembersRef, where('id', '==', repId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.length > 0;
  } catch (error) {
    console.error('❌ Error checking rep in team:', error);
    return false;
  }
}

export async function addExistingRepToTeam(teamLeadId: string, repId: string) {
  try {
    console.log('➕ Adding existing rep to team:', repId);
    
    // Get the rep details
    const repsRef = collection(db, 'salesReps');
    const repSnap = await getDocs(query(repsRef, where('id', '==', repId)));
    
    if (repSnap.empty) {
      console.error('❌ Rep not found');
      return false;
    }
    
    const repData = repSnap.docs[0].data();
    
    // Create team member record
    const teamMembersRef = collection(db, 'teamMembers');
    const teamMemberData = {
      id: repId,
      firstName: repData.name,
      surname: repData.surname || '',
      email: repData.email,
      telephoneNumber: repData.telephoneNumber || '',
      teamLeadId: teamLeadId,
      teamLeadName: '', // Will be fetched from team
      username: repData.email,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'manual_add'
    };
    
    await addDoc(teamMembersRef, teamMemberData);
    
    // Add to team
    const teamRef = doc(db, 'teams', teamLeadId);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      const currentMembers = teamSnap.data().members || [];
      await updateDoc(teamRef, {
        members: [...currentMembers, repId],
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log('✅ Rep added to team');
    return true;
  } catch (error) {
    console.error('❌ Error adding rep to team:', error);
    return false;
  }
}

export async function getAvailableRepsForTeam(currentTeamLeadId?: string) {
  try {
    console.log('🔍 Fetching available reps for team');
    
    // Get all reps from educater_salesman
    const repsRef = collection(db, 'educater_salesman');
    const repsSnapshot = await getDocs(repsRef);
    
    console.log('📊 Total reps in database:', repsSnapshot.size);
    
    const allReps = repsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      surname: doc.data().surname,
      email: doc.data().email,
      role: doc.data().role,
      ...doc.data()
    }));
    
    console.log('📋 All reps fetched:', allReps.length, allReps.map(r => ({ id: r.id, name: r.name, role: r.role })));
    
    // Get the current team's members
    if (!currentTeamLeadId) {
      console.log('⚠️ No team lead ID provided, returning empty');
      return [];
    }
    
    const teamRef = doc(db, 'teams', currentTeamLeadId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      console.log('⚠️ Team not found for:', currentTeamLeadId);
      return [];
    }
    
    const teamData = teamSnap.data();
    const currentTeamMembers = Array.isArray(teamData.members) ? new Set(teamData.members) : new Set();
    
    console.log('👥 Current team members:', Array.from(currentTeamMembers));
    
    // Filter reps: exclude admins, team members, and self
    const availableReps = allReps.filter(rep => {
      const isAdmin = rep.role === 'admin' || rep.email?.includes('admin');
      const isAlreadyInTeam = currentTeamMembers.has(rep.id);
      const isSelf = rep.id === currentTeamLeadId;
      
      const isAvailable = !isAdmin && !isAlreadyInTeam && !isSelf;
      
      if (!isAvailable) {
        console.log(`❌ Excluding ${rep.name}: admin=${isAdmin}, inTeam=${isAlreadyInTeam}, self=${isSelf}`);
      }
      
      return isAvailable;
    });
    
    console.log(`✅ Available reps: ${availableReps.length}`);
    availableReps.forEach(rep => console.log('  ✓', rep.name, rep.email));
    
    return availableReps;
  } catch (error) {
    console.error('❌ Error fetching available reps:', error);
    return [];
  }
}

// Send team invitation to a rep
export async function sendTeamInvitation(teamLeadId: string, repId: string, role: string = 'digital-scout') {
  try {
    console.log('📧 [sendTeamInvitation] START - teamLeadId:', teamLeadId, 'repId:', repId, 'role:', role);
    
    // Get team lead info
    console.log('📧 [sendTeamInvitation] Getting team document...');
    const teamRef = doc(db, 'teams', teamLeadId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      console.error('❌ [sendTeamInvitation] Team not found with ID:', teamLeadId);
      return false;
    }
    
    const teamData = teamSnap.data();
    console.log('📧 [sendTeamInvitation] Team found:', teamData?.teamName);
    
    // Get rep info from educater_salesman collection
    console.log('📧 [sendTeamInvitation] Getting rep document...');
    const repRef = doc(db, 'educater_salesman', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) {
      console.error('❌ [sendTeamInvitation] Rep not found with ID:', repId);
      return false;
    }
    
    const repData = repSnap.data();
    console.log('📧 [sendTeamInvitation] Rep found:', repData?.name);
    
    // Create invitation record
    const invitationsRef = collection(db, 'teamInvitations');
    const invitationData = {
      teamId: teamLeadId,
      teamLeadId: teamLeadId,
      teamLeadName: teamData.leadName,
      teamName: teamData.teamName,
      repId: repId,
      repName: repData.name,
      repEmail: repData.email,
      role: role,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    console.log('📧 [sendTeamInvitation] Creating invitation document with data:', invitationData);
    const docRef = await addDoc(invitationsRef, invitationData);
    console.log('✅ [sendTeamInvitation] Invitation created with ID:', docRef.id);
    
    console.log('✅ [sendTeamInvitation] SUCCESS - Invitation sent');
    return true;
  } catch (error) {
    console.error('❌ [sendTeamInvitation] ERROR:', error);
    if (error instanceof Error) {
      console.error('❌ [sendTeamInvitation] Error message:', error.message);
      console.error('❌ [sendTeamInvitation] Error stack:', error.stack);
    }
    return false;
  }
}

// Get pending invitations for a rep
export async function getMyPendingInvitations(repId: string) {
  try {
    console.log('📬 Fetching pending invitations for:', repId);
    
    const invitationsRef = collection(db, 'teamInvitations');
    const q = query(
      invitationsRef,
      where('repId', '==', repId),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    
    const invitations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    console.log('✅ Found', invitations.length, 'pending invitations');
    return invitations;
  } catch (error) {
    console.error('❌ Error fetching invitations:', error);
    return [];
  }
}

// Accept team invitation
export async function acceptTeamInvitation(invitationId: string, repId: string) {
  try {
    console.log('✅ Accepting invitation:', invitationId);
    
    // Get invitation details
    const invitationRef = doc(db, 'teamInvitations', invitationId);
    const invitationSnap = await getDoc(invitationRef);
    
    if (!invitationSnap.exists()) {
      console.error('❌ Invitation not found');
      return false;
    }
    
    const invitationData = invitationSnap.data();
    const teamLeadId = invitationData.teamId;
    const role = invitationData.role || 'digital-scout';
    
    // Get rep info from educater_salesman
    const repRef = doc(db, 'educater_salesman', repId);
    const repSnap = await getDoc(repRef);
    
    if (!repSnap.exists()) {
      console.error('❌ Rep not found');
      return false;
    }
    
    const repData = repSnap.data();
    
    // Create team member record with role
    const teamMembersRef = collection(db, 'teamMembers');
    const teamMemberData = {
      id: repId,
      firstName: repData.name,
      surname: repData.surname || '',
      email: repData.email,
      telephoneNumber: repData.telephoneNumber || '',
      teamLeadId: teamLeadId,
      teamLeadName: invitationData.teamLeadName,
      role: role,
      username: repData.email,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'invitation_accepted'
    };
    
    await addDoc(teamMembersRef, teamMemberData);
    
    // Add to team members array and store role
    const teamRef = doc(db, 'teams', teamLeadId);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      const currentMembers = teamSnap.data().members || [];
      const memberRoles = teamSnap.data().memberRoles || {};
      
      if (!currentMembers.includes(repId)) {
        memberRoles[repId] = role;
        await updateDoc(teamRef, {
          members: [...currentMembers, repId],
          memberRoles: memberRoles,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    // Update invitation status
    await updateDoc(invitationRef, {
      status: 'accepted',
      respondedAt: new Date().toISOString()
    });
    
    console.log('✅ Invitation accepted with role:', role);
    return true;
  } catch (error) {
    console.error('❌ Error accepting invitation:', error);
    return false;
  }
}

// Reject team invitation
export async function rejectTeamInvitation(invitationId: string) {
  try {
    console.log('❌ Rejecting invitation:', invitationId);
    
    const invitationRef = doc(db, 'teamInvitations', invitationId);
    
    await updateDoc(invitationRef, {
      status: 'rejected',
      respondedAt: new Date().toISOString()
    });
    
    console.log('✅ Invitation rejected');
    return true;
  } catch (error) {
    console.error('❌ Error rejecting invitation:', error);
    return false;
  }
}

// Leave team
export async function leaveTeam(repId: string) {
  try {
    console.log('👋 Rep leaving team:', repId);
    
    // Find and remove from team member record
    const teamMembersRef = collection(db, 'teamMembers');
    const q = query(teamMembersRef, where('id', '==', repId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.error('❌ Team member record not found');
      return false;
    }
    
    const teamLeadId = snapshot.docs[0].data().teamLeadId;
    
    // Delete team member record
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, 'teamMembers', docSnap.id));
    }
    
    // Remove from team members array
    const teamRef = doc(db, 'teams', teamLeadId);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      const currentMembers = teamSnap.data().members || [];
      await updateDoc(teamRef, {
        members: currentMembers.filter((id: string) => id !== repId),
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log('✅ Rep left team');
    return true;
  } catch (error) {
    console.error('❌ Error leaving team:', error);
    return false;
  }
}


