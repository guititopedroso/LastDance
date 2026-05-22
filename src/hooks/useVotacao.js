import { useState, useEffect, useCallback } from 'react';
import { db } from '../api/firebase';
import {
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot, 
  serverTimestamp, 
  Timestamp
} from 'firebase/firestore';

export const useVotacao = (user) => {
  const [categorias, setCategorias] = useState([]);
  const [votos, setVotos] = useState({}); // { [categoriaId]: { nifVotado, nomeVotado } }
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);

  const codigoEscola = user?.codigoEscola;
  const nif = user?.nif;

  // Fetch categorias activas (real-time)
  useEffect(() => {
    if (!codigoEscola) { setLoading(false); return; }

    const q = query(
      collection(db, 'votacao', codigoEscola, 'categorias'),
      where('ativa', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by ordem ascending (client-side)
      docs.sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0));
      setCategorias(docs);
      setLoading(false);
    }, (err) => {
      console.error('Categorias snapshot error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [codigoEscola]);

  // Fetch votos do aluno actual (real-time per category)
  useEffect(() => {
    if (!codigoEscola || !nif || categorias.length === 0) return;

    const unsubs = categorias.map(cat => {
      const votoRef = doc(db, 'votacao', codigoEscola, 'votos', cat.id, 'respostas', nif);
      return onSnapshot(votoRef, (snap) => {
        setVotos(prev => ({
          ...prev,
          [cat.id]: snap.exists() ? snap.data() : null
        }));
      });
    });

    return () => unsubs.forEach(u => u());
  }, [codigoEscola, nif, categorias]);

  // Load all students for modal
  const loadAlunos = useCallback(async () => {
    if (!codigoEscola) return [];
    try {
      const snap = await getDocs(collection(db, 'alunos', codigoEscola, 'lista'));
      const data = snap.docs.map(d => ({ id: d.id, nif: d.id, ...d.data() }));
      setAlunos(data);
      return data;
    } catch (err) {
      console.error('Load alunos error:', err);
      return [];
    }
  }, [codigoEscola]);

  // Cast a vote — document ID = NIF of voter (enforces 1 vote per category)
  const votar = useCallback(async (categoriaId, nifVotado, nomeVotado) => {
    if (!codigoEscola || !nif) throw new Error('Sessão inválida.');
    if (nifVotado === nif) throw new Error('Não podes votar em ti próprio.');

    const votoRef = doc(db, 'votacao', codigoEscola, 'votos', categoriaId, 'respostas', nif);
    await setDoc(votoRef, {
      nifVotado,
      nomeVotado,
      timestamp: serverTimestamp(),
    });
  }, [codigoEscola, nif]);

  // Get live results for a category (real-time)
  const useResultados = (categoriaId) => {
    const [resultados, setResultados] = useState([]);

    useEffect(() => {
      if (!codigoEscola || !categoriaId) return;

      const q = collection(db, 'votacao', codigoEscola, 'votos', categoriaId, 'respostas');
      const unsub = onSnapshot(q, (snap) => {
        // Aggregate votes by nifVotado
        const counts = {};
        snap.docs.forEach(d => {
          const { nifVotado, nomeVotado } = d.data();
          if (!counts[nifVotado]) counts[nifVotado] = { nifVotado, nomeVotado, votos: 0 };
          counts[nifVotado].votos++;
        });
        const sorted = Object.values(counts).sort((a, b) => b.votos - a.votos);
        setResultados(sorted);
      });

      return () => unsub();
    }, [categoriaId]);

    return resultados;
  };

  return {
    categorias,
    votos,
    alunos,
    loading,
    loadAlunos,
    votar,
    useResultados,
  };
};
