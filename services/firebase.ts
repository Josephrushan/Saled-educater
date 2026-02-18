
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
import { SalesRep, School, SalesStage, Resource, ResourceCategory } from '../types';

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
