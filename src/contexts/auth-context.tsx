
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updatePassword, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  Timestamp,
  addDoc,
  updateDoc as firestoreUpdateDoc, 
  deleteDoc,
  orderBy,
} from 'firebase/firestore';

import type { LoginFormValues, RegisterExecutiveFormValues, CensusEntry, CensusEntryFormValues, UserProfile, Executive, UpdateProfileFormValues } from '@/lib/schemas';


export interface AppUser extends UserProfile {}

interface AuthContextType {
  user: AppUser | null;
  login: (values: LoginFormValues) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registerExecutive: (values: RegisterExecutiveFormValues) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (values: UpdateProfileFormValues) => Promise<{ success: boolean; error?: string }>;
  updateUserPasswordInFirebase: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  executives: Executive[];
  censusData: CensusEntry[];
  addCensusEntry: (values: CensusEntryFormValues) => Promise<{ success: boolean; error?: string; errorMessage?: string; anomalyExplanation?: string | null }>;
  updateCensusEntry: (id: string, values: CensusEntryFormValues) => Promise<{ success: boolean; error?: string; errorMessage?: string; anomalyExplanation?: string | null }>;
  deleteCensusEntry: (id: string) => Promise<{ success: boolean; error?: string }>;
  getCensusEntryById: (id: string) => CensusEntry | undefined;
  authLoading: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockAdminUser: AppUser = {
  uid: "mock-admin-uid", 
  email: "mockadmin@example.com",
  name: "Mock Admin User",
  role: "admin",
  createdAt: new Timestamp(0, 0), 
  region: "N/A" 
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [censusData, setCensusData] = useState<CensusEntry[]>([]);
  const [authLoading, setAuthLoading] = useState(true); 
  const router = useRouter();

  const fetchExecutives = async (currentAdminUser: AppUser | null) => {
    if (!currentAdminUser || currentAdminUser.role !== 'admin') {
      console.log("AuthContext: fetchExecutives - Not an admin or no admin user. Clearing executives list.", currentAdminUser?.email);
      setExecutives([]);
      return;
    }
    console.log("AuthContext: Fetching executives for admin:", currentAdminUser.email);
    try {
      const q = query(collection(db, "users"), where("role", "==", "executive"));
      const querySnapshot = await getDocs(q);
      const execsData = querySnapshot.docs
        .map(docSnap => {
          const data = docSnap.data() as UserProfile;
          return {
            id: docSnap.id, 
            uid: docSnap.id, 
            name: data.name,
            email: data.email,
            region: data.region || "N/A", 
          } as Executive; 
      });
      setExecutives(execsData);
      console.log("AuthContext: Executives fetched:", execsData.length);
    } catch (error) {
      console.error("AuthContext: Error fetching executives:", error);
      setExecutives([]); 
    }
  };

  const fetchCensusData = async (currentUser: AppUser | null) => {
    if (!currentUser) {
      setCensusData([]);
      console.log("AuthContext: No current user, clearing census data.");
      return;
    }
    
    console.log(`AuthContext: Fetching census data for user: ${currentUser.email}, role: ${currentUser.role}`);
    try {
      let q;
      if (currentUser.role === 'admin') {
        q = query(collection(db, "censusEntries"), orderBy("submissionDate", "desc"));
      } else if (currentUser.role === 'executive') {
          q = query(collection(db, "censusEntries"), where("submittedByUid", "==", currentUser.uid), orderBy("submissionDate", "desc"));
      } else {
        console.log("AuthContext: User is not admin or executive, clearing census data.");
        setCensusData([]);
        return;
      }

      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          submissionDate: (data.submissionDate as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          lastModifiedDate: (data.lastModifiedDate as Timestamp)?.toDate().toISOString(),
        } as CensusEntry;
      });
      setCensusData(entries);
      console.log("AuthContext: Census data fetched/refreshed:", entries.length, "entries.");
    } catch (error: any) {
      console.error("AuthContext: Error fetching census data:", error.code, error.message, error);
      setCensusData([]);
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("AuthContext: Auth state changed. Firebase user UID:", firebaseUser?.uid || "null");
      setAuthLoading(true);
  
      if (firebaseUser) {
        console.log("AuthContext: Firebase user detected. Processing Firebase user.");
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const userProfile = userDocSnap.data() as UserProfile;
          const appUserInstance: AppUser = { ...userProfile, uid: firebaseUser.uid };
          setUser(appUserInstance); 
          console.log("AuthContext: User profile loaded:", appUserInstance.email, "Role:", appUserInstance.role);
          
          const dataFetchPromises = [];
          if (appUserInstance.role === 'admin') {
            dataFetchPromises.push(fetchExecutives(appUserInstance));
          }
          dataFetchPromises.push(fetchCensusData(appUserInstance));
  
          try {
            await Promise.all(dataFetchPromises);
            console.log("AuthContext: Parallel data fetching complete for real user.");
          } catch (error) {
            console.error("AuthContext: Error during parallel data fetching for real user:", error);
          }
  
        } else {
          const errorMsg = `User profile not found in Firestore for UID: "${firebaseUser.uid}". This user will be signed out. Ensure a corresponding document exists in the 'users' collection with the correct role and other profile data. Instructions: 1. Go to Firebase Console > Authentication, find user by UID. 2. Go to Firestore Database > users collection. 3. Ensure a document with this UID exists and has 'uid', 'email', 'name', 'role', and 'createdAt' fields.`;
          console.error("AuthContext:", errorMsg);
          setUser(null); 
          setExecutives([]);
          setCensusData([]);
          await firebaseSignOut(auth);
        }
      } else {

        if (user && user.uid === mockAdminUser.uid) {
          console.log("AuthContext: No Firebase user, but mock admin is active. Preserving mock admin session.");

        } else {
          console.log("AuthContext: No Firebase user and no active mock admin. Clearing user data.");
          setUser(null);
          setExecutives([]);
          setCensusData([]);
        }
      }
      setAuthLoading(false);
    });
    return () => {
      console.log("AuthContext: Unsubscribing from auth state changes.");
      unsubscribe();
    }

  }, []); 


  const login = async (values: LoginFormValues): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    if (
      values.email === mockAdminUser.email &&
      values.password === "password123" && 
      values.role === "admin"
    ) {
      console.log("AuthContext: Mock admin login successful for:", values.email);
      
      try {
        const mockAdminFirestoreData: UserProfile = {
          uid: mockAdminUser.uid,
          email: mockAdminUser.email,
          name: mockAdminUser.name,
          role: mockAdminUser.role,
          region: mockAdminUser.region,
          createdAt: serverTimestamp() as Timestamp, 
        };

        await setDoc(doc(db, 'users', mockAdminUser.uid), mockAdminFirestoreData, { merge: true }); 
        console.log("AuthContext: Ensured mock admin profile in Firestore for UID:", mockAdminUser.uid);
      } catch (firestoreError: any) {
        console.error("AuthContext: Error ensuring mock admin profile in Firestore:", firestoreError.message, firestoreError);

      }
      
      setUser(mockAdminUser);
      const dataFetchPromises = [
        fetchExecutives(mockAdminUser),
        fetchCensusData(mockAdminUser)
      ];
      try {
        await Promise.all(dataFetchPromises);
        console.log("AuthContext: Parallel data fetching complete for mock admin.");
      } catch (error) {
        console.error("AuthContext: Error during parallel data fetching for mock admin:", error);
      }
      setAuthLoading(false); 
      return { success: true };
    }

    console.log("AuthContext: Firebase login attempt for:", values.email, "as", values.role);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const firebaseAuthUser = userCredential.user; 

      const userDocRef = doc(db, 'users', firebaseAuthUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await firebaseSignOut(auth); 
        setAuthLoading(false);
        return { success: false, error: 'profile_not_found' };
      }

      const userProfile = userDocSnap.data() as UserProfile;
      if (userProfile.role !== values.role) {
        await firebaseSignOut(auth); 
        setAuthLoading(false);
        return { success: false, error: 'role_mismatch' };
      }

      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Login error -", error.code, error.message);
      let errorCode = error.code || "login_failed";
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email'].includes(errorCode)) {
        errorCode = 'auth/invalid-credential'; 
      }
      setAuthLoading(false);
      return { success: false, error: errorCode };
    }
  };

  const logout = async () => {
    console.log("AuthContext: Logout attempt for user:", user?.email);
    if (user && user.uid === mockAdminUser.uid) {
      console.log("AuthContext: Logging out mock admin.");
      setAuthLoading(true);
      setUser(null);
      setExecutives([]);
      setCensusData([]);
      setAuthLoading(false);
      router.push('/'); 
      return;
    }

    setAuthLoading(true);
    try {
      await firebaseSignOut(auth);
      console.log("AuthContext: Firebase sign out successful.");

    } catch (error) {
      console.error("AuthContext: Logout error:", error);
      setAuthLoading(false); 
    }
  };

  const registerExecutive = async (values: RegisterExecutiveFormValues): Promise<{ success: boolean; error?: string }> => {
    if (!user || user.role !== 'admin') {
        const errorMsg = "Only admins can register new executives.";
        console.error("AuthContext: registerExecutive attempt blocked -", errorMsg);
        setAuthLoading(false); 
        return { success: false, error: errorMsg };
    }

   
    setAuthLoading(true);
    console.log("AuthContext: Registering executive:", values.email, "by admin:", user.email);
    try {

      const q = query(collection(db, "users"), where("email", "==", values.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          const errorMsg = "Email already exists for a user in Firestore.";
          console.error("AuthContext: registerExecutive -", errorMsg);
          setAuthLoading(false);
          return { success: false, error: errorMsg };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newFirebaseUser = userCredential.user;
      console.log("AuthContext: Executive created in Firebase Auth:", newFirebaseUser.uid);


      const newUserProfile: UserProfile = {
        uid: newFirebaseUser.uid,
        email: values.email,
        name: values.name,
        role: 'executive',
        region: values.region, 
        createdAt: serverTimestamp() as Timestamp, 
      };

      await setDoc(doc(db, 'users', newFirebaseUser.uid), newUserProfile);
      console.log("AuthContext: Executive profile created in Firestore.");
      

      if (user && user.role === 'admin') { 
        await fetchExecutives(user); 
      }
      setAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Error registering executive:", error.code, error.message);
      let errorMsg = "An unknown error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = "This email is already registered with Firebase Authentication.";
      } else if (error.message) {
        errorMsg = error.message;
      }
      setAuthLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const updateUserProfile = async (values: UpdateProfileFormValues): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "User not authenticated." };
    }
    setAuthLoading(true);
    console.log("AuthContext: Updating user profile for UID:", user.uid, "with values:", values);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const dataToUpdate: Partial<UserProfile> = {
        name: values.name,
      };

      if (user.role === 'executive' && values.region) {
        dataToUpdate.region = values.region;
      }

      await firestoreUpdateDoc(userDocRef, dataToUpdate);
      
      setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, ...dataToUpdate };
        console.log("AuthContext: Local user state updated:", updatedUser);
        return updatedUser;
      });

      if (user.role === 'admin') {
         await fetchExecutives(user);
      }
      if (user.role === 'executive' && executives.find(e => e.uid === user.uid)) {
          setExecutives(prevExecutives => 
            prevExecutives.map(exec => 
              exec.uid === user.uid ? { ...exec, name: dataToUpdate.name || exec.name, region: dataToUpdate.region || exec.region } : exec
            )
          );
      }

      console.log("AuthContext: User profile updated successfully in Firestore.");
      setAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Error updating user profile:", error.message, error);
      setAuthLoading(false);
      return { success: false, error: error.message || "Failed to update profile." };
    }
  };

  const updateUserPasswordInFirebase = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const currentFirebaseUser = auth.currentUser;
    
    if (!currentFirebaseUser) {
      const noUserError = "No user is currently signed in to Firebase to update the password for. This often happens in 'forgot password' flows if you're not recently logged in or the session has expired.";
      console.warn("AuthContext: updateUserPasswordInFirebase -", noUserError);
      return { success: false, error: noUserError };
    }

    console.log(`AuthContext: Attempting to update password in Firebase for user: ${currentFirebaseUser.email} (UID: ${currentFirebaseUser.uid})`);

    try {
      await updatePassword(currentFirebaseUser, newPassword);
      console.log("AuthContext: Password updated successfully in Firebase for user:", currentFirebaseUser.email);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        console.warn("AuthContext: Firebase password update failed - Code:", error.code, "Message:", error.message, "(This is an expected security measure from Firebase for client-side password updates without recent login).");
      } else {
        console.error("AuthContext: Firebase password update failed - Code:", error.code, "Message:", error.message);
      }
      let friendlyMessage = error.message || "Firebase password update failed.";
      if (error.code === 'auth/requires-recent-login') {
        friendlyMessage = "This operation is sensitive and requires recent authentication. Please log in again before retrying to change your password.";
      }
      return { success: false, error: friendlyMessage };
    }
  };


  const addCensusEntry = async (formValues: CensusEntryFormValues): Promise<{ success: boolean; error?: string; errorMessage?: string; anomalyExplanation?: string | null }> => {
    console.log("AuthContext: addCensusEntry called. User:", user ? {email: user.email, role: user.role, uid: user.uid} : "null", "FormValues:", formValues);
    if (!user || !user.uid || user.role !== 'executive') {
      const errorMsg = "User not properly authenticated or not an executive.";
      console.error("AuthContext: Error in addCensusEntry precondition -", errorMsg, "Current user:", JSON.stringify(user));
      return { success: false, error: "AUTH_ERROR", errorMessage: errorMsg, anomalyExplanation: null };
    }
    setAuthLoading(true);
    try {
      const q = query(collection(db, "censusEntries"), 
        where("idNumber", "==", formValues.idNumber), 
        where("idProofType", "==", formValues.idProofType)
      );
      console.log("AuthContext: Checking for duplicate entry with ID Number:", formValues.idNumber, "and ID Proof Type:", formValues.idProofType);
      const duplicateCheckSnapshot = await getDocs(q);
      if (!duplicateCheckSnapshot.empty) {
        const errorMsg = "A census entry with this ID Number and ID Proof Type already exists. Data not saved.";
        console.warn("AuthContext: addCensusEntry - Duplicate found:", errorMsg);
        setAuthLoading(false);
        return { 
          success: false, 
          error: "DUPLICATE_ENTRY", 
          errorMessage: errorMsg, 
          anomalyExplanation: null 
        };
      }
      console.log("AuthContext: No duplicate entry found. Proceeding with add.");

      console.log("AuthContext: (Bypassed) AI Anomaly detection for form values:", formValues);
      const anomalyResult = { hasAnomalies: false, anomalyExplanation: null }; 

      console.log("AuthContext: (Bypassed) AI Anomaly detection result:", anomalyResult);

      console.log("AuthContext: Proceeding to save data to Firestore.");

      const newEntryData = {
        ...formValues,
        submittedByUid: user.uid, 
        submittedByEmail: user.email, 
        submissionDate: serverTimestamp(),
        lastModifiedDate: serverTimestamp(), 
      };
      console.log("AuthContext: Data to be added to Firestore 'censusEntries' collection:", JSON.stringify(newEntryData, (key, value) => (key === 'submissionDate' || key === 'lastModifiedDate') ? 'Firestore.ServerTimestamp' : value, 2));
      const docRef = await addDoc(collection(db, "censusEntries"), newEntryData);
      console.log("AuthContext: Census entry ADDED successfully to Firestore. Document ID:", docRef.id);
      
      await fetchCensusData(user); 
      setAuthLoading(false);
      return { success: true, anomalyExplanation: anomalyResult.hasAnomalies ? anomalyResult.anomalyExplanation : null };
    } catch (error: any) {
      console.error("AuthContext: Error in addCensusEntry - Message:", error.message, "Code:", error.code, "Stack:", error.stack, "Full Error:", error);
      setAuthLoading(false);
      return { success: false, error: "FIRESTORE_ERROR", errorMessage: `Operation error: ${error.message || "Could not save entry. Check console."}`, anomalyExplanation: null };
    } finally {
      console.log("AuthContext: addCensusEntry finished.");
      setAuthLoading(false);
    }
  };

  const updateCensusEntry = async (id: string, formValues: CensusEntryFormValues): Promise<{ success: boolean; error?: string; errorMessage?: string; anomalyExplanation?: string | null }> => {
    console.log("AuthContext: updateCensusEntry called. User:", user ? {email: user.email, role: user.role, uid: user.uid} : "null", "ID:", id, "FormValues:", formValues);
    if (!user || !user.uid || user.role !== 'executive') {
      const errorMsg = "User not properly authenticated or not an executive.";
      console.error("AuthContext: Error in updateCensusEntry precondition -", errorMsg, "Current user:", JSON.stringify(user));
      return { success: false, error: "AUTH_ERROR", errorMessage: errorMsg, anomalyExplanation: null };
    }
    setAuthLoading(true);
    try {
      const entryRef = doc(db, "censusEntries", id);
      const entrySnap = await getDoc(entryRef);
      if (!entrySnap.exists() || entrySnap.data()?.submittedByUid !== user.uid) {
        const errorMsg = "Entry not found or permission denied for update.";
        console.error("AuthContext: Error in updateCensusEntry -", errorMsg);
        setAuthLoading(false);
        return { success: false, error: "PERMISSION_ERROR", errorMessage: errorMsg, anomalyExplanation: null };
      }

      const oldData = entrySnap.data();
      if (oldData && (oldData.idNumber !== formValues.idNumber || oldData.idProofType !== formValues.idProofType)) {
        const q = query(collection(db, "censusEntries"), 
          where("idNumber", "==", formValues.idNumber), 
          where("idProofType", "==", formValues.idProofType)
        );
        console.log("AuthContext: (Update) Checking for duplicate entry with ID Number:", formValues.idNumber, "and ID Proof Type:", formValues.idProofType);
        const duplicateCheckSnapshot = await getDocs(q);
        const foundOtherDuplicate = duplicateCheckSnapshot.docs.some(docSnap => docSnap.id !== id);
        if (foundOtherDuplicate) {
             const errorMsg = "Updating this entry would create a duplicate with another existing entry (same ID Number and ID Proof Type). Data not saved.";
             console.warn("AuthContext: updateCensusEntry - Duplicate found:", errorMsg);
             setAuthLoading(false);
             return { 
               success: false, 
               error: "DUPLICATE_ENTRY", 
               errorMessage: errorMsg, 
               anomalyExplanation: null 
             };
        }
        console.log("AuthContext: (Update) No duplicate entry found that conflicts. Proceeding with update.");
      }
      
      console.log("AuthContext: (Bypassed) AI Anomaly detection for form values (update):", formValues);
      const anomalyResult = { hasAnomalies: false, anomalyExplanation: null }; 

      console.log("AuthContext: (Bypassed) AI Anomaly detection result (update):", anomalyResult);

      console.log("AuthContext: Proceeding to update data in Firestore for ID:", id);

      const updatedData = {
        ...formValues,
        lastModifiedDate: serverTimestamp(), 
      };
      console.log("AuthContext: Data to be updated in Firestore 'censusEntries' collection (ID: "+id+"):", JSON.stringify(updatedData, (key, value) => (key === 'submissionDate' || key === 'lastModifiedDate') ? 'Firestore.ServerTimestamp' : value, 2));
      await firestoreUpdateDoc(entryRef, updatedData);
      console.log("AuthContext: Census entry UPDATED successfully in Firestore.");
      
      await fetchCensusData(user);
      setAuthLoading(false);
      return { success: true, anomalyExplanation: anomalyResult.hasAnomalies ? anomalyResult.anomalyExplanation : null };
    } catch (error: any) {
      console.error("AuthContext: Error in updateCensusEntry - Message:", error.message, "Code:", error.code, "Stack:", error.stack, "Full Error:", error);
      setAuthLoading(false);
      return { success: false, error: "FIRESTORE_ERROR", errorMessage: `Operation error: ${error.message || "Could not update entry. Check console."}`, anomalyExplanation: null };
    } finally {
      console.log("AuthContext: updateCensusEntry finished.");
      setAuthLoading(false);
    }
  };

  const deleteCensusEntry = async (id: string): Promise<{ success: boolean; error?: string }> => {
    console.log("AuthContext: deleteCensusEntry called. User:", user ? {email: user.email, role: user.role, uid: user.uid} : "null", "ID:", id);
    if (!user || !user.uid || user.role !== 'executive') {
      const errorMsg = "User not properly authenticated or not an executive.";
      console.error("AuthContext: Error in deleteCensusEntry precondition -", errorMsg, "Current user:", JSON.stringify(user));
      return { success: false, error: errorMsg };
    }
    setAuthLoading(true);
    try {
      const entryRef = doc(db, "censusEntries", id);
      const entrySnap = await getDoc(entryRef);
      if (!entrySnap.exists() || entrySnap.data()?.submittedByUid !== user.uid) {
        const errorMsg = "Entry not found or permission denied for delete.";
        console.error("AuthContext: Error in deleteCensusEntry -", errorMsg);
        setAuthLoading(false);
        return { success: false, error: errorMsg };
      }
      console.log("AuthContext: Attempting to delete document ID:", id, "from 'censusEntries' collection.");
      await deleteDoc(entryRef);
      console.log("AuthContext: Census entry DELETED successfully from Firestore.");
      await fetchCensusData(user); 
      setAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Error in deleteCensusEntry - Message:", error.message, "Code:", error.code, "Stack:", error.stack, "Full Error:", error);
      setAuthLoading(false);
      return { success: false, error: `Operation error: ${error.message || "Could not delete entry. Check console."}` };
    } finally {
      console.log("AuthContext: deleteCensusEntry finished.");
      setAuthLoading(false);
    }
  };

  const getCensusEntryById = (id: string): CensusEntry | undefined => {
    const entry = censusData.find(e => e.id === id);
    console.log("AuthContext: getCensusEntryById called for ID:", id, ". Current User:", user?.email, "Found entry:", !!entry);
    
    if (user && user.role === 'executive' && user.uid !== mockAdminUser.uid && entry && entry.submittedByUid !== user.uid) {
      console.warn(`AuthContext: Executive ${user.email} attempted to access entry ${id} not belonging to them. Denying access.`);
      return undefined; 
    }
    return entry;
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        registerExecutive,
        updateUserProfile,
        updateUserPasswordInFirebase,
        executives,
        censusData,
        addCensusEntry,
        updateCensusEntry,
        deleteCensusEntry,
        getCensusEntryById,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


