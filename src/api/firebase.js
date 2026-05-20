import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBoDymedQurHM3IZzDCxSt22MdiKXlLEkA",
  authDomain: "lastdance-fa460.firebaseapp.com",
  projectId: "lastdance-fa460",
  storageBucket: "lastdance-fa460.firebasestorage.app",
  messagingSenderId: "396913633548",
  appId: "1:396913633548:web:3cfdd47c47ff88912c4129",
  measurementId: "G-GSVV82N6HP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };

// Public Helpers
export const validateSchoolCode = async (code) => {
  try {
    const q = query(collection(db, "codes"), where("code", "==", code.toUpperCase()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } catch (error) {
    console.error("Error validating code:", error);
    return null;
  }
};

export const registerStudent = async (studentData) => {
  try {
    const docRef = await addDoc(collection(db, "registrations"), {
      ...studentData,
      status: "pending_payment", // Initial status for all new registrations
      paidInstallments: 0,
      createdAt: new Date().toISOString(),
      paymentEntity: "21054",
      paymentReference: Math.floor(Math.random() * 900000000 + 100000000).toString(),
      paymentMethod: studentData.paymentMethod || "multibanco",
      mbwayPhone: studentData.mbwayPhone || null
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding registration:", error);
    throw error;
  }
};

export const getStudentByNIF = async (nif) => {
  try {
    const q = query(collection(db, "registrations"), where("nif", "==", nif));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } catch (error) {
    console.error("Error fetching student:", error);
    return null;
  }
};

// Admin Helpers - Codes
export const getAllCodes = async () => {
  const querySnapshot = await getDocs(collection(db, "codes"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addSchoolCode = async (code, schoolName, location, ballDate) => {
  await addDoc(collection(db, "codes"), {
    code: code.toUpperCase(),
    schoolName,
    location,
    ballDate: ballDate || null,
    createdAt: new Date().toISOString()
  });
};

export const deleteCode = async (id) => {
  await deleteDoc(doc(db, "codes", id));
};

// Admin Helpers - Registrations
export const getAllRegistrations = async () => {
  const querySnapshot = await getDocs(collection(db, "registrations"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteRegistration = async (id) => {
  try {
    const docRef = doc(db, "registrations", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Firebase Delete Error:", error);
    throw error;
  }
};
