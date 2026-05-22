import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_MEMORIAS_URL || '/api/memorias.php';

export const useAppMemorias = (user) => {
  const [memorias, setMemorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const codigoEscola = user?.codigoEscola;
  const nif = user?.nif;
  const nomeAluno = user?.nomeAluno;

  const fetchMemorias = useCallback(async (isPolling = false) => {
    if (!codigoEscola) {
      setMemorias([]);
      setLoading(false);
      return;
    }

    if (!isPolling) {
      setLoading(true);
    } else {
      console.log('[Memórias App] A verificar novas fotos em segundo plano...');
    }
    try {
      const response = await fetch(`${API_URL}?codigoEscola=${encodeURIComponent(codigoEscola)}&t=${Date.now()}`);
      
      const contentType = response.headers.get('content-type');
      const isHtml = contentType && contentType.includes('text/html');
      
      if (!response.ok || isHtml) {
        if (import.meta.env.DEV) {
          console.warn("PHP API not reached. Falling back to local storage mock data for development.");
          const mockDataStr = localStorage.getItem(`mock_memorias_${codigoEscola}`);
          setMemorias(mockDataStr ? JSON.parse(mockDataStr) : []);
          if (!isPolling) setError(null);
          return;
        }
        throw new Error('Erro ao obter memórias do servidor.');
      }

      const data = await response.json();
      setMemorias(data);
      if (!isPolling) setError(null);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Connection to PHP API failed. Using local storage mock data instead.", err);
        const mockDataStr = localStorage.getItem(`mock_memorias_${codigoEscola}`);
        setMemorias(mockDataStr ? JSON.parse(mockDataStr) : []);
        if (!isPolling) setError(null);
        return;
      }
      console.error("Error fetching memories:", err);
      if (!isPolling) setError(err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [codigoEscola]);

  useEffect(() => {
    fetchMemorias(false);

    const interval = setInterval(() => {
      fetchMemorias(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [codigoEscola, fetchMemorias]);

  // Upload photo to MySQL API (via PHP)
  const uploadMemoria = useCallback((file, legenda, emoji, onProgress) => {
    if (!codigoEscola || !nif) {
      return Promise.reject(new Error('Sessão inválida. Inicia sessão novamente.'));
    }

    // In development mode, simulate upload and save in localStorage
    if (import.meta.env.DEV) {
      return new Promise((resolve) => {
        let percent = 0;
        const interval = setInterval(() => {
          percent += 20;
          if (onProgress) onProgress(percent);
          
          if (percent >= 100) {
            clearInterval(interval);
            
            const reader = new FileReader();
            reader.onloadend = () => {
              const newMock = {
                id: Date.now(),
                codigoEscola,
                nif,
                nomeAluno,
                fotoURL: reader.result,
                legenda: legenda || '',
                emoji: emoji || '',
                timestamp: { seconds: Math.floor(Date.now() / 1000) },
                reportada: false
              };
              
              const mockDataStr = localStorage.getItem(`mock_memorias_${codigoEscola}`);
              const mockData = mockDataStr ? JSON.parse(mockDataStr) : [];
              mockData.unshift(newMock);
              localStorage.setItem(`mock_memorias_${codigoEscola}`, JSON.stringify(mockData));
              
              setMemorias(mockData);
              resolve(newMock.fotoURL);
            };
            reader.readAsDataURL(file);
          }
        }, 150);
      });
    }

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('foto', file);
      formData.append('codigoEscola', codigoEscola);
      formData.append('nif', nif);
      formData.append('nomeAluno', nomeAluno || "Aluno");
      formData.append('legenda', legenda || '');
      formData.append('emoji', emoji || '');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}?action=add`);

      if (xhr.upload && onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success) {
              fetchMemorias();
              resolve(res.fotoURL);
            } else {
              reject(new Error(res.error || 'Falha ao processar upload'));
            }
          } catch (e) {
            reject(new Error('Resposta inválida do servidor'));
          }
        } else {
          reject(new Error('Falha no upload com código ' + xhr.status));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Erro de ligação ao servidor'));
      };

      xhr.send(formData);
    });
  }, [codigoEscola, nif, nomeAluno, fetchMemorias]);

  // Delete own memory
  const deleteMemoria = useCallback(async (memoriaId) => {
    if (import.meta.env.DEV) {
      const mockDataStr = localStorage.getItem(`mock_memorias_${codigoEscola}`);
      if (mockDataStr) {
        const mockData = JSON.parse(mockDataStr);
        const updated = mockData.filter(m => String(m.id) !== String(memoriaId));
        localStorage.setItem(`mock_memorias_${codigoEscola}`, JSON.stringify(updated));
        setMemorias(updated);
      }
      return;
    }

    try {
      const response = await fetch(`${API_URL}?action=delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: memoriaId })
      });
      if (!response.ok) {
        throw new Error('Falha ao eliminar memória no servidor.');
      }
      const res = await response.json();
      if (res.success) {
        setMemorias(prev => prev.filter(m => String(m.id) !== String(memoriaId)));
      } else {
        throw new Error(res.error || 'Erro ao eliminar');
      }
    } catch (err) {
      console.error("Error deleting memory:", err);
      throw err;
    }
  }, [codigoEscola]);

  // Report a memory
  const reportMemoria = useCallback(async (memoriaId) => {
    if (import.meta.env.DEV) {
      const mockDataStr = localStorage.getItem(`mock_memorias_${codigoEscola}`);
      if (mockDataStr) {
        const mockData = JSON.parse(mockDataStr);
        const updated = mockData.filter(m => String(m.id) !== String(memoriaId));
        localStorage.setItem(`mock_memorias_${codigoEscola}`, JSON.stringify(updated));
        setMemorias(updated);
      }
      return;
    }

    try {
      const response = await fetch(`${API_URL}?action=report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: memoriaId })
      });
      if (!response.ok) {
        throw new Error('Falha ao reportar memória no servidor.');
      }
      const res = await response.json();
      if (res.success) {
        setMemorias(prev => prev.filter(m => String(m.id) !== String(memoriaId)));
      } else {
        throw new Error(res.error || 'Erro ao reportar');
      }
    } catch (err) {
      console.error("Error reporting memory:", err);
      throw err;
    }
  }, [codigoEscola]);

  return { memorias, loading, error, uploadMemoria, deleteMemoria, reportMemoria };
};
