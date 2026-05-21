import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_MEMORIAS_URL || '/api/memorias.php';

export const useMemorias = (studentSession) => {
  const [memorias, setMemorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const schoolCode = studentSession?.schoolCode;
  const studentNif = studentSession?.nif;
  const studentName = studentSession?.name || "Aluno";

  const fetchMemorias = async () => {
    if (!schoolCode) {
      setMemorias([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?codigoEscola=${encodeURIComponent(schoolCode)}`);
      
      // If we are in dev mode and the response is not ok or is HTML (like index.html redirect from Vite),
      // we fall back to localStorage mock data.
      const contentType = response.headers.get('content-type');
      const isHtml = contentType && contentType.includes('text/html');
      
      if (!response.ok || isHtml) {
        if (import.meta.env.DEV) {
          console.warn("PHP API not reached. Falling back to local storage mock data for development.");
          const mockDataStr = localStorage.getItem(`mock_memorias_${schoolCode}`);
          setMemorias(mockDataStr ? JSON.parse(mockDataStr) : []);
          setError(null);
          return;
        }
        throw new Error('Erro ao obter memórias do servidor.');
      }

      const data = await response.json();
      setMemorias(data);
      setError(null);
    } catch (err) {
      // In development mode, network failures fall back to local storage
      if (import.meta.env.DEV) {
        console.warn("Connection to PHP API failed. Using local storage mock data instead.", err);
        const mockDataStr = localStorage.getItem(`mock_memorias_${schoolCode}`);
        setMemorias(mockDataStr ? JSON.parse(mockDataStr) : []);
        setError(null);
        return;
      }
      console.error("Error fetching memories:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemorias();
  }, [schoolCode]);

  // Upload memory (photo to server directory, metadata to MySQL)
  const uploadMemoria = (file, legenda, emoji, onProgress) => {
    if (!schoolCode || !studentNif) {
      return Promise.reject(new Error("Sessão inválida. Inicia sessão novamente."));
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
            
            // Read file as Base64 to show preview in gallery
            const reader = new FileReader();
            reader.onloadend = () => {
              const newMock = {
                id: Date.now(),
                codigoEscola: schoolCode,
                nif: studentNif,
                nomeAluno: studentName,
                fotoURL: reader.result,
                legenda: legenda || '',
                emoji: emoji || '',
                timestamp: { seconds: Math.floor(Date.now() / 1000) },
                reportada: false
              };
              
              const mockDataStr = localStorage.getItem(`mock_memorias_${schoolCode}`);
              const mockData = mockDataStr ? JSON.parse(mockDataStr) : [];
              mockData.unshift(newMock);
              localStorage.setItem(`mock_memorias_${schoolCode}`, JSON.stringify(mockData));
              
              setMemorias(mockData);
              resolve(newMock.id);
            };
            reader.readAsDataURL(file);
          }
        }, 150);
      });
    }

    // Production code calling the PHP API
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('foto', file);
      formData.append('codigoEscola', schoolCode);
      formData.append('nif', studentNif);
      formData.append('nomeAluno', studentName);
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
              resolve(res.id);
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
  };

  // Delete memory (from MySQL and filesystem)
  const deleteMemoria = async (memoriaId, fotoURL) => {
    if (import.meta.env.DEV) {
      const mockDataStr = localStorage.getItem(`mock_memorias_${schoolCode}`);
      if (mockDataStr) {
        const mockData = JSON.parse(mockDataStr);
        const updated = mockData.filter(m => String(m.id) !== String(memoriaId));
        localStorage.setItem(`mock_memorias_${schoolCode}`, JSON.stringify(updated));
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
  };

  // Report/Flag memory
  const reportMemoria = async (memoriaId) => {
    if (import.meta.env.DEV) {
      const mockDataStr = localStorage.getItem(`mock_memorias_${schoolCode}`);
      if (mockDataStr) {
        const mockData = JSON.parse(mockDataStr);
        const updated = mockData.filter(m => String(m.id) !== String(memoriaId));
        localStorage.setItem(`mock_memorias_${schoolCode}`, JSON.stringify(updated));
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
