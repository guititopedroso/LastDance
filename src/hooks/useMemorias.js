import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { db, storage } from "../api/firebase";

export const useMemorias = (studentSession) => {
  const [memorias, setMemorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const schoolCode = studentSession?.schoolCode;
  const studentNif = studentSession?.nif;
  const studentName = studentSession?.name || "Aluno";

  useEffect(() => {
    if (!schoolCode) {
      setMemorias([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Query memories for the student's school
    const q = query(
      collection(db, "memorias"),
      where("codigoEscola", "==", schoolCode)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in memory by timestamp descending (newest first)
        fetched.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
        });

        // Filter out reported memories in client side to avoid needing composite indexes in Firestore
        setMemorias(fetched.filter(m => !m.reportada));
        setLoading(false);
      }, 
      (err) => {
        console.error("Error fetching memories:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [schoolCode]);

  // Upload memory (photo to Storage, metadata to Firestore)
  const uploadMemoria = (file, legenda, emoji, onProgress) => {
    return new Promise((resolve, reject) => {
      if (!schoolCode || !studentNif) {
        return reject(new Error("Sessão inválida. Inicia sessão novamente."));
      }

      const timestampMs = Date.now();
      // Safe file name structure: memorias/{schoolCode}/{nif}_{timestamp}.jpg
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storagePath = `memorias/${schoolCode}/${studentNif}_${timestampMs}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.error("Storage upload error:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Add metadata document in Firestore
            const docRef = await addDoc(collection(db, "memorias"), {
              codigoEscola: schoolCode,
              nif: studentNif,
              nomeAluno: studentName,
              fotoURL: downloadURL,
              legenda: legenda ? legenda.trim().substring(0, 150) : "",
              emoji: emoji || "",
              timestamp: serverTimestamp(),
              reportada: false
            });

            resolve(docRef.id);
          } catch (err) {
            console.error("Firestore document creation error:", err);
            reject(err);
          }
        }
      );
    });
  };

  // Delete memory (from Firestore and Storage)
  const deleteMemoria = async (memoriaId, fotoURL) => {
    try {
      // 1. Delete document from Firestore
      await deleteDoc(doc(db, "memorias", memoriaId));

      // 2. Delete file from Storage
      if (fotoURL) {
        try {
          const fileRef = ref(storage, fotoURL);
          await deleteObject(fileRef);
        } catch (storageErr) {
          // If the file does not exist or fails, log it but don't crash
          console.warn("Could not delete photo from Storage, might not exist:", storageErr);
        }
      }
    } catch (err) {
      console.error("Error deleting memory:", err);
      throw err;
    }
  };

  // Report/Flag memory
  const reportMemoria = async (memoriaId) => {
    try {
      await updateDoc(doc(db, "memorias", memoriaId), {
        reportada: true
      });
    } catch (err) {
      console.error("Error reporting memory:", err);
      throw err;
    }
  };

  return {
    memorias,
    loading,
    error,
    uploadMemoria,
    deleteMemoria,
    reportMemoria
  };
};
