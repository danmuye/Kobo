import { useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { useAuthContext } from "@/contexts/auth-context";
import {
  signIn as fbSignIn,
  signUp as fbSignUp,
  signOutUser as fbSignOut,
  resetPassword as fbResetPassword,
  sendEmailVerification as fbSendEmailVerification,
  signInWithGoogle as fbSignInWithGoogle,
  updateUserProfile as fbUpdateUserProfile,
  changeUserPassword as fbChangeUserPassword,
  changeUserEmail as fbChangeUserEmail,
  deleteUserAccount as fbDeleteUserAccount,
  reauthenticateUser as fbReauthenticateUser,
} from "@/services/firebase/auth";
import {
  createUserDocuments,
  createUserDocumentsIfNeeded,
  updateUserProfileDocument,
  deleteUserDocuments,
} from "@/services/firebase/user-service";
import { toFirebaseServiceError } from "@/services/firebase/errors";
import type { ProfileUpdate } from "@/types/auth";

function extractErrorMessage(err: unknown): string {
  const fbErr = toFirebaseServiceError(err);
  return fbErr.message;
}

export function useAuth() {
  const ctx = useAuthContext();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setError = useAuthStore((s) => s.setError);
  const clearError = useAuthStore((s) => s.clearError);
  const setLoading = useAuthStore((s) => s.setLoading);

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      clearError();
      setLoading(true);
      try {
        await fbSignIn(email, password);
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<void> => {
      clearError();
      setLoading(true);
      try {
        const userCred = await fbSignUp(email, password);
        await createUserDocuments(userCred.uid, userCred.email ?? email);
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading],
  );

  const signOut = useCallback(async (): Promise<void> => {
    clearError();
    setLoading(true);
    try {
      await fbSignOut();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, setError, setLoading]);

  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      clearError();
      setLoading(true);
      try {
        await fbResetPassword(email);
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading],
  );

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    clearError();
    setLoading(true);
    try {
      const userCred = await fbSignInWithGoogle();
      await createUserDocumentsIfNeeded(userCred.uid, userCred.email ?? "");
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, setError, setLoading]);

  const sendEmailVerification = useCallback(async (): Promise<void> => {
    clearError();
    setLoading(true);
    try {
      await fbSendEmailVerification();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, setError, setLoading]);

  const updateProfile = useCallback(
    async (data: ProfileUpdate): Promise<void> => {
      clearError();
      setLoading(true);
      try {
        await fbUpdateUserProfile(data);
        if (user) {
          const updated = { ...user };
          if (data.displayName !== undefined) updated.displayName = data.displayName;
          if (data.photoURL !== undefined) updated.photoURL = data.photoURL;
          setUser(updated);
        }
        if (user) {
          await updateUserProfileDocument(user.uid, data);
        }
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading, user, setUser],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      clearError();
      setLoading(true);
      try {
        await fbChangeUserPassword(currentPassword, newPassword);
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading],
  );

  const changeEmail = useCallback(
    async (currentPassword: string, newEmail: string): Promise<void> => {
      clearError();
      setLoading(true);
      try {
        await fbChangeUserEmail(currentPassword, newEmail);
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading],
  );

  const deleteAccount = useCallback(
    async (currentPassword: string): Promise<void> => {
      clearError();
      setLoading(true);
      try {
        if (user) {
          await deleteUserDocuments(user.uid);
        }
        await fbDeleteUserAccount(currentPassword);
      } catch (err) {
        const msg = extractErrorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading, user],
  );

  return {
    ...ctx,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendEmailVerification,
    signInWithGoogle,
    updateProfile,
    changePassword,
    changeEmail,
    deleteAccount,
  };
}
