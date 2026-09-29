import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfileData, AuthActivity } from '../types';

interface AuthContextType {
  user: User | null;
  profileData: UserProfileData | null;
  loading: boolean;
  profileLoading: boolean;
  resendCooldown: number;
  activityLogs: AuthActivity[];
  refreshUser: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<{ success: boolean; message: string }>;
  updateUserProfileData: (updates: Partial<UserProfileData>) => Promise<{ success: boolean; message: string }>;
  sendUserPasswordReset: (email?: string) => Promise<{ success: boolean; message: string }>;
  updateUserPassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  deleteUserAccount: (password: string) => Promise<{ success: boolean; message: string }>;
  addActivityLog: (action: string, type: AuthActivity['type'], details?: string) => void;
  clearActivityLogs: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COOLDOWN_KEY = 'firebase_auth_resend_cooldown_expiry';
const ACTIVITY_LOGS_KEY = 'firebase_auth_activity_logs';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [activityLogs, setActivityLogs] = useState<AuthActivity[]>(() => {
    try {
      const saved = localStorage.getItem(ACTIVITY_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Helper to append activity log
  const addActivityLog = useCallback((action: string, type: AuthActivity['type'], details?: string) => {
    const newEntry: AuthActivity = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      action,
      type,
      details,
    };
    setActivityLogs((prev) => {
      const updated = [newEntry, ...prev.slice(0, 49)];
      try {
        localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save activity log', e);
      }
      return updated;
    });
  }, []);

  const clearActivityLogs = useCallback(() => {
    setActivityLogs([]);
    try {
      localStorage.removeItem(ACTIVITY_LOGS_KEY);
    } catch {}
  }, []);

  // Cooldown countdown management
  useEffect(() => {
    const checkCooldown = () => {
      try {
        const expiryStr = localStorage.getItem(COOLDOWN_KEY);
        if (expiryStr) {
          const expiry = parseInt(expiryStr, 10);
          const now = Date.now();
          if (expiry > now) {
            setResendCooldown(Math.ceil((expiry - now) / 1000));
          } else {
            setResendCooldown(0);
            localStorage.removeItem(COOLDOWN_KEY);
          }
        }
      } catch {
        setResendCooldown(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start cooldown timer (e.g. 60s)
  const startCooldown = (seconds = 60) => {
    const expiry = Date.now() + seconds * 1000;
    try {
      localStorage.setItem(COOLDOWN_KEY, expiry.toString());
    } catch {}
    setResendCooldown(seconds);
  };

  // Fetch or initialize Firestore user profile
  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfileData;
        setProfileData({
          ...data,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        // Create initial profile record
        const initialProfile: UserProfileData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Agri User',
          photoURL: firebaseUser.photoURL || '',
          organization: 'Smart Agriculture Project',
          role: 'farmer',
          bio: 'Agricultural user management portal member.',
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await setDoc(userDocRef, initialProfile);
          setProfileData(initialProfile);
        } catch (writeErr) {
          console.warn('Firestore initial profile creation failed, using local profile state:', writeErr);
          setProfileData(initialProfile);
        }
      }
    } catch (err) {
      console.warn('Firestore profile fetch error (falling back to Auth record):', err);
      // Fallback directly to Firebase Auth object
      setProfileData({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Agri User',
        photoURL: firebaseUser.photoURL || '',
        organization: 'Smart Agriculture Project',
        role: 'farmer',
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setProfileData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Refresh user object (e.g. to detect if emailVerified became true)
  const refreshUser = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser({ ...updatedUser } as User);
      
      if (updatedUser) {
        setProfileData((prev) => prev ? {
          ...prev,
          emailVerified: updatedUser.emailVerified,
          displayName: updatedUser.displayName || prev.displayName,
          photoURL: updatedUser.photoURL || prev.photoURL,
        } : null);

        // If email was verified, update Firestore record if accessible
        if (updatedUser.emailVerified) {
          try {
            await setDoc(doc(db, 'users', updatedUser.uid), {
              emailVerified: true,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            // Ignore if firestore rules or network delay
          }
        }
      }
      return updatedUser.emailVerified;
    } catch (error) {
      console.error('Failed to reload user:', error);
      return false;
    }
  }, []);

  // Resend email verification
  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) {
      return { success: false, message: 'No authenticated user found.' };
    }
    if (auth.currentUser.emailVerified) {
      return { success: true, message: 'Your email is already verified!' };
    }
    if (resendCooldown > 0) {
      return { success: false, message: `Please wait ${resendCooldown} seconds before requesting another email.` };
    }

    try {
      await sendEmailVerification(auth.currentUser);
      startCooldown(60);
      addActivityLog('Sent email verification link', 'verification', `To: ${auth.currentUser.email}`);
      return {
        success: true,
        message: `Verification email dispatched to ${auth.currentUser.email}. Check your inbox and spam folder.`,
      };
    } catch (error: any) {
      console.error('Failed to send verification email:', error);
      if (error.code === 'auth/too-many-requests') {
        startCooldown(120);
        return {
          success: false,
          message: 'Too many requests. Please wait a couple of minutes before retrying.',
        };
      }
      return {
        success: false,
        message: error.message || 'Failed to dispatch verification email.',
      };
    }
  }, [resendCooldown, addActivityLog]);

  // Update profile data in Auth and Firestore
  const updateUserProfileData = useCallback(async (updates: Partial<UserProfileData>) => {
    if (!auth.currentUser) {
      return { success: false, message: 'No active session.' };
    }

    try {
      // 1. Update Firebase Auth Profile (Display Name & PhotoURL)
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
      if (updates.photoURL !== undefined) authUpdates.photoURL = updates.photoURL;

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(auth.currentUser, authUpdates);
      }

      // 2. Update Firestore document
      const docUpdates = {
        ...updates,
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), docUpdates, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore write failed, updating local state only:', fsErr);
      }

      // 3. Update local state
      setProfileData((prev) => (prev ? { ...prev, ...docUpdates } : (docUpdates as UserProfileData)));
      addActivityLog('Updated user profile details', 'profile', updates.displayName ? `Name: ${updates.displayName}` : undefined);

      return { success: true, message: 'Profile updated successfully.' };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message || 'Failed to update profile.' };
    }
  }, [addActivityLog]);

  // Send password reset
  const sendUserPasswordReset = useCallback(async (targetEmail?: string) => {
    const emailToUse = targetEmail || auth.currentUser?.email;
    if (!emailToUse) {
      return { success: false, message: 'No email address specified.' };
    }

    try {
      await sendPasswordResetEmail(auth, emailToUse);
      addActivityLog('Requested password reset email', 'security', `To: ${emailToUse}`);
      return {
        success: true,
        message: `Password reset instructions sent to ${emailToUse}.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Could not send password reset email.',
      };
    }
  }, [addActivityLog]);

  // Update password with re-authentication
  const updateUserPassword = useCallback(async (currentPass: string, newPass: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      return { success: false, message: 'No active session.' };
    }

    try {
      // Re-authenticate first to satisfy auth/requires-recent-login
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPass);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Now update password
      await updatePassword(auth.currentUser, newPass);
      addActivityLog('Changed account password', 'security');
      return { success: true, message: 'Password updated successfully!' };
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, message: 'Current password incorrect. Please verify and try again.' };
      }
      if (error.code === 'auth/weak-password') {
        return { success: false, message: 'New password is too weak. Please use at least 6 characters.' };
      }
      return { success: false, message: error.message || 'Failed to update password.' };
    }
  }, [addActivityLog]);

  // Google sign in
  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    addActivityLog('Signed in with Google', 'auth', `Account: ${result.user.email}`);
  }, [addActivityLog]);

  // Sign out
  const logOut = useCallback(async () => {
    if (auth.currentUser) {
      addActivityLog('Signed out', 'auth');
    }
    await signOut(auth);
    setProfileData(null);
  }, [addActivityLog]);

  // Delete user account
  const deleteUserAccount = useCallback(async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      return { success: false, message: 'No active session.' };
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await deleteUser(auth.currentUser);
      addActivityLog('Deleted account', 'security');
      setProfileData(null);
      return { success: true, message: 'Account permanently removed.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to delete account. Ensure credentials are valid.' };
    }
  }, [addActivityLog]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profileData,
        loading,
        profileLoading,
        resendCooldown,
        activityLogs,
        refreshUser,
        resendVerificationEmail,
        updateUserProfileData,
        sendUserPasswordReset,
        updateUserPassword,
        signInWithGoogle,
        logOut,
        deleteUserAccount,
        addActivityLog,
        clearActivityLogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
