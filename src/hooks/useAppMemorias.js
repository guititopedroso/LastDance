import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../api/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

export const useAppMemorias = (user) => {
  const [memorias, setMemorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const codigoEscola = user?.codigoEscola;
  const nif = user?.nif;
  const nomeAluno = user?.nomeAluno;

  useEffect(() => {
    if (!codigoEscola) {
      setMemorias([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'memorias'),
      where('codigoEscola', '==', codigoEscola),
      where('reportada', '==', false),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMemorias(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Memorias snapshot error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [codigoEscola]);

  // Upload photo to Firebase Storage + create Firestore doc
  const uploadMemoria = useCallback((file, legenda, emoji, onProgress) => {
    if (!codigoEscola || !nif) {
      return Promise.reject(new Error('Sessão inválida. Inicia sessão novamente.'));
    }

    return new Promise((resolve, reject) => {
      const ext = file.name.split('.').pop();
      const fileName = `memorias/${codigoEscola}/${Date.now()}_${nif}.${ext}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (err) => reject(err),
        async () => {
          try {
            const fotoURL = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'memorias'), {
              codigoEscola,
              nif,
              nomeAluno,
              fotoURL,
              storagePath: fileName,
              legenda: legenda || '',
              emoji: emoji || '',
              timestamp: serverTimestamp(),
              reportada: false,
            });
            resolve(fotoURL);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }, [codigoEscola, nif, nomeAluno]);

  // Delete own memory
  const deleteMemoria = useCallback(async (memoriaId, storagePath) => {
    try {
      await deleteDoc(doc(db, 'memorias', memoriaId));
      if (storagePath) {
        try {
          await deleteObject(ref(storage, storagePath));
        } catch (_) { /* silent */ }
      }
    } catch (err) {
      console.error('Delete error:', err);
      throw err;
    }
  }, []);

  // Report a memory (flag as reportada)
  const reportMemoria = useCallback(async (memoriaId) => {
    try {
      await updateDoc(doc(db, 'memorias', memoriaId), { reportada: true });
    } catch (err) {
      console.error('Report error:', err);
      throw err;
    }
  }, []);

  return { memorias, loading, error, uploadMemoria, deleteMemoria, reportMemoria };
};
