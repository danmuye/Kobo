import { getFirestoreDb, isConfigured, initializeFirebase, whenReady } from "./config";
import { sanitizeFirestoreData } from "./sanitize";

const transactionCategories = [
  "Food & Dining", "Transportation", "Rent", "Utilities", "Entertainment",
  "Shopping", "Healthcare", "Education", "Salary", "Freelance", "Investment", "Family Support",
];

export async function userDocumentExists(uid: string): Promise<boolean> {
  if (!isConfigured()) return false;

  await initializeFirebase();
  await whenReady();
  const db = getFirestoreDb();
  const fs = await import("firebase/firestore");

  const userRef = fs.doc(db, "users", uid);
  const snap = await fs.getDoc(userRef);
  return snap.exists();
}

export async function createUserDocumentsIfNeeded(
  uid: string,
  email: string,
): Promise<void> {
  const exists = await userDocumentExists(uid);
  if (!exists) {
    await createUserDocuments(uid, email);
  }
}

export async function createUserDocuments(
  uid: string,
  email: string,
): Promise<void> {
  if (!isConfigured()) return;

  await initializeFirebase();
  await whenReady();
  const db = getFirestoreDb();
  const fs = await import("firebase/firestore");

  const now = new Date().toISOString();

  const userRef = fs.doc(db, "users", uid);

  const userData = {
    email,
    displayName: null,
    createdAt: now,
    updatedAt: now,
  };

  const profileRef = fs.doc(db, "users", uid, "profile", "default");
  const profileData = {
    displayName: null,
    photoURL: null,
    currency: "NGN",
    locale: "en-NG",
    updatedAt: now,
  };

  const settingsRef = fs.doc(db, "users", uid, "settings", "default");
  const settingsData = {
    appearance: { theme: "light" },
    localization: {
      currency: "NGN",
      locale: "en-NG",
      dateFormat: "MM/dd/yyyy",
      numberFormat: "1,234.56",
      timeFormat: "12h",
    },
    updatedAt: now,
  };

  const categoriesRef = fs.doc(db, "users", uid, "categories", "default");
  const categoriesData = {
    categories: transactionCategories,
    updatedAt: now,
  };

  await Promise.all([
    fs.setDoc(userRef, sanitizeFirestoreData(userData)),
    fs.setDoc(profileRef, sanitizeFirestoreData(profileData)),
    fs.setDoc(settingsRef, sanitizeFirestoreData(settingsData)),
    fs.setDoc(categoriesRef, sanitizeFirestoreData(categoriesData)),
  ]);
}

export async function updateUserProfileDocument(
  uid: string,
  data: { displayName?: string | null; photoURL?: string | null },
): Promise<void> {
  if (!isConfigured()) return;

  await initializeFirebase();
  await whenReady();
  const db = getFirestoreDb();
  const fs = await import("firebase/firestore");

  const now = new Date().toISOString();
  const userRef = fs.doc(db, "users", uid);
  const profileRef = fs.doc(db, "users", uid, "profile", "default");

  await Promise.all([
    fs.updateDoc(userRef, sanitizeFirestoreData({ ...data, updatedAt: now })),
    fs.updateDoc(profileRef, sanitizeFirestoreData({ ...data, updatedAt: now })),
  ]);
}

export async function deleteUserDocuments(uid: string): Promise<void> {
  if (!isConfigured()) return;

  await initializeFirebase();
  await whenReady();
  const db = getFirestoreDb();
  const fs = await import("firebase/firestore");

  const collections = ["profile", "settings", "categories"];
  const batch = fs.writeBatch(db);

  for (const sub of collections) {
    const subRef = fs.collection(db, "users", uid, sub);
    const snap = await fs.getDocs(subRef);
    snap.docs.forEach((doc) => batch.delete(doc.ref));
  }

  batch.delete(fs.doc(db, "users", uid));
  await batch.commit();
}
