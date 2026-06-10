import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  Trophy,
  LogOut, 
  Plus, 
  Search, 
  CheckCircle,
  Clock,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Edit2,
  Check,
  X,
  Menu,
  Ticket
} from 'lucide-react';
import './Admin.css';
import { 
  getAllCodes, 
  deleteCode, 
  addSchoolCode, 
  updateSchoolCode,
  getAllRegistrations,
  deleteRegistration,
  registerStudent,
  toggleSchoolVisibility
} from '../../api/firebase';
import {
  db
} from '../../api/firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, orderBy, onSnapshot, writeBatch
} from 'firebase/firestore';

import AdminLogin from './AdminLogin';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('adminAuth') === 'true'
  );
  const [adminRole, setAdminRole] = useState(
    sessionStorage.getItem('adminRole') || 'admin'
  );
  
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTab = () => {
    const path = location.pathname;
    const role = sessionStorage.getItem('adminRole') || 'admin';
    if (path.includes('/entradas')) return 'entradas';
    if (path.includes('/codes')) return 'codes';
    if (path.includes('/attendees')) return 'attendees';
    if (path.includes('/premios')) return 'premios';
    return role === 'staff' ? 'entradas' : 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/entradas')) setActiveTab('entradas');
    else if (path.includes('/codes')) setActiveTab('codes');
    else if (path.includes('/attendees')) setActiveTab('attendees');
    else if (path.includes('/premios')) setActiveTab('premios');
    else setActiveTab(adminRole === 'staff' ? 'entradas' : 'overview');
  }, [location, adminRole]);

  // Redirection for staff attempting to access admin-only pages
  useEffect(() => {
    if (isAuthenticated && adminRole === 'staff') {
      const path = location.pathname;
      if (!path.includes('/entradas') && !path.includes('/premios')) {
        setActiveTab('entradas');
        navigate('/admin/entradas', { replace: true });
      }
    }
  }, [location.pathname, isAuthenticated, adminRole, navigate]);

  const handleLogin = (role) => {
    sessionStorage.setItem('adminAuth', 'true');
    sessionStorage.setItem('adminRole', role);
    setAdminRole(role);
    setIsAuthenticated(true);
    if (role === 'staff') {
      setActiveTab('entradas');
      navigate('/admin/entradas');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminRole');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const Sidebar = () => (
    <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '10px' }}>
        <div className="admin-logo-wrapper">
          <img src="/logo_transparent.webp" alt="Last Dance" className="admin-logo-img" />
          <span className="badge-admin">{adminRole === 'admin' ? 'Admin' : 'Staff'}</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)} 
          className="admin-sidebar-close-btn"
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'none'
          }}
        >
          <X size={20} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {adminRole === 'admin' && (
          <Link to="/admin" className={activeTab === 'overview' ? 'active' : ''} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}>
            <LayoutDashboard size={20} /> <span>Painel Geral</span>
          </Link>
        )}
        {adminRole === 'admin' && (
          <Link to="/admin/codes" className={activeTab === 'codes' ? 'active' : ''} onClick={() => { setActiveTab('codes'); setIsSidebarOpen(false); }}>
            <Key size={20} /> <span>Códigos de Escola</span>
          </Link>
        )}
        <Link to="/admin/entradas" className={activeTab === 'entradas' ? 'active' : ''} onClick={() => { setActiveTab('entradas'); setIsSidebarOpen(false); }}>
          <Ticket size={20} /> <span>Entradas</span>
        </Link>
        {adminRole === 'admin' && (
          <Link to="/admin/attendees" className={activeTab === 'attendees' ? 'active' : ''} onClick={() => { setActiveTab('attendees'); setIsSidebarOpen(false); }}>
            <Users size={20} /> <span>Gestão de Inscritos</span>
          </Link>
        )}
        <Link to="/admin/premios" className={activeTab === 'premios' ? 'active' : ''} onClick={() => { setActiveTab('premios'); setIsSidebarOpen(false); }} style={{ color: activeTab === 'premios' ? '#e11d48' : undefined }}>
          <Trophy size={20} /> <span>Prémios / Votação</span>
        </Link>
      </nav>
      <div className="sidebar-footer">
        <Link to="/" className="btn-logout" onClick={handleLogout}><LogOut size={18} /> <span>Sair</span></Link>
      </div>
    </div>
  );

  return (
    <div className="admin-layout">
      {/* Mobile Top Bar */}
      <div className="admin-mobile-topbar" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900
      }}>
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo_transparent.webp" alt="Last Dance" style={{ height: '32px' }} />
          <span className="badge-admin" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{adminRole === 'admin' ? 'Admin' : 'Staff'}</span>
        </div>
        <div style={{ width: '24px' }} /* Balance space */ />
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="admin-sidebar-backdrop open" 
            onClick={() => setIsSidebarOpen(false)} 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 999
            }}
          />
        )}
      </AnimatePresence>

      <Sidebar />
      <div className="admin-content">
        <Routes>
          {adminRole === 'admin' && <Route path="/" element={<Overview />} />}
          {adminRole === 'admin' && <Route path="/codes" element={<CodeManager />} />}
          <Route path="/entradas" element={<EntradasManager />} />
          {adminRole === 'admin' && <Route path="/attendees" element={<AttendeeManager />} />}
          <Route path="/premios" element={<PremiosManager />} />
          <Route path="*" element={<Navigate to="/admin/entradas" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const Overview = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getAllRegistrations();
      setStats({
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        paid: data.filter(a => a.status === 'paid').length
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Olá, Administrador</h1>
        <p>Resumo em tempo real da LastDance.</p>
      </header>
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <Users size={24} className="text-gold" />
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Inscritos</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <CheckCircle size={24} className="text-gold" />
          <div className="stat-info">
            <h3>{stats.paid}</h3>
            <p>Pagamentos Confirmados</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <Clock size={24} className="text-gold" />
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pagamentos Pendentes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const parsePdfFile = async (file) => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let lastY = null;
    let pageText = '';
    for (const item of textContent.items) {
      if (lastY === null || lastY === item.transform[5]) {
        pageText += item.str;
      } else {
        pageText += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    fullText += pageText + '\n';
  }
  
  return fullText;
};

const parseGuestsFromText = (text) => {
  const lines = text.split('\n');
  const parsedGuests = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const numMatch = trimmed.match(/^(\d+)\s*-\s*(.+)$/);
    if (!numMatch) continue;
    
    const rest = numMatch[2].trim();
    
    const match = rest.match(/^(.*?)\s*-\s*(ALL-ACCESS|Apenas Cocktail|Só Cocktail|Cocktail\s*\+\s*Jantar|Cocktail\s*\+\s*Festa|Só Festa)$/i);
    if (match) {
      const name = match[1].trim();
      const rawStatus = match[2].trim().toLowerCase();
      let ticketType = 'All-Access';
      
      if (rawStatus.includes('jantar')) {
        ticketType = 'Cocktail + Jantar';
      } else if (rawStatus.includes('festa') && rawStatus.includes('cocktail')) {
        ticketType = 'Cocktail + Festa';
      } else if (rawStatus.includes('festa')) {
        ticketType = 'Só Festa';
      } else if (rawStatus.includes('cocktail')) {
        ticketType = 'Só Cocktail';
      } else {
        ticketType = 'All-Access';
      }
      
      const nameParts = name.split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      parsedGuests.push({
        firstName,
        lastName,
        ticketType,
        status: 'paid',
        email: '',
        phone: '',
        paymentPlan: 'full',
        checkedIn: false
      });
    }
  }
  
  return parsedGuests;
};

const CodeManager = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', location: '', ballDate: '' });
  const [toast, setToast] = useState(null);
  const [editingCodeId, setEditingCodeId] = useState(null);
  const [editCodeData, setEditCodeData] = useState({ code: '', schoolName: '', location: '', ballDate: '' });

  // PDF upload and parsing states
  const [pdfFile, setPdfFile] = useState(null);
  const [parsedGuests, setParsedGuests] = useState([]);
  const [guestCount, setGuestCount] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPdfFile(file);
    setIsParsing(true);
    setPdfError(null);
    setParsedGuests([]);
    setGuestCount(0);

    try {
      const text = await parsePdfFile(file);
      const guests = parseGuestsFromText(text);
      setParsedGuests(guests);
      setGuestCount(guests.length);
      if (guests.length === 0) {
        setPdfError("Não foram encontrados convidados no formato esperado no PDF.");
        setPdfFile(null);
      }
    } catch (err) {
      console.error("Error parsing PDF file:", err);
      setPdfError("Erro ao processar o ficheiro PDF.");
      setPdfFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSaveEdit = async (id) => {
    if (!editCodeData.code.trim() || !editCodeData.schoolName.trim()) {
      showToast('⚠️ Código e nome da escola não podem estar vazios.');
      return;
    }
    try {
      await updateSchoolCode(
        id, 
        editCodeData.code.toUpperCase().trim(), 
        editCodeData.schoolName.trim(), 
        editCodeData.location.trim(), 
        editCodeData.ballDate
      );
      setEditingCodeId(null);
      fetchCodes();
      showToast('✅ Código atualizado!');
    } catch (err) {
      console.error(err);
      showToast('❌ Erro ao atualizar código.');
    }
  };

  const handleToggleVisibility = async (id, currentHiddenState) => {
    try {
      await toggleSchoolVisibility(id, !!currentHiddenState);
      fetchCodes();
      showToast(currentHiddenState ? '👁️ Escola agora está visível' : '🔒 Escola foi ocultada');
    } catch (err) {
      console.error(err);
      showToast('❌ Erro ao alterar visibilidade.');
    }
  };

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const data = await getAllCodes(true);
      setCodes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.location || !newSchool.ballDate || isSubmitting) return;

    setIsSubmitting(true);

    // Alphanumeric code generator (8 chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let i = 0; i < 8; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      await addSchoolCode(newCode, newSchool.name, newSchool.location, newSchool.ballDate);
      
      // If we have parsed guests from a PDF, upload them in batches of 500
      if (parsedGuests.length > 0) {
        const batchLimit = 500;
        for (let i = 0; i < parsedGuests.length; i += batchLimit) {
          const chunk = parsedGuests.slice(i, i + batchLimit);
          const batch = writeBatch(db);
          for (const guest of chunk) {
            const newDocRef = doc(collection(db, "registrations"));
            batch.set(newDocRef, {
              ...guest,
              schoolCode: newCode,
              createdAt: new Date().toISOString()
            });
          }
          await batch.commit();
        }
      }

      setNewSchool({ name: '', location: '', ballDate: '' });
      setPdfFile(null);
      setParsedGuests([]);
      setGuestCount(0);
      setPdfError(null);
      setShowForm(false);
      fetchCodes();
      showToast(parsedGuests.length > 0 ? `✅ Escola criada e ${parsedGuests.length} convidados importados!` : '✅ Código criado com sucesso');
    } catch (error) {
      console.error(error);
      alert("Erro ao criar código ou importar convidados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apagar este código permanentemente?")) {
      await deleteCode(id);
      fetchCodes();
      showToast('Código apagado');
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header split">
        <div>
          <h1>Gestor de Códigos</h1>
          <p>Gere os códigos de acesso para cada evento.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setPdfFile(null); setParsedGuests([]); setGuestCount(0); setPdfError(null); }} className="btn-premium">
          {showForm ? 'Cancelar' : 'Gerar Novo Código'}
        </button>
      </header>

      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card admin-form-card"
          style={{ marginBottom: '30px', padding: '30px' }}
        >
          <form onSubmit={handleCreateCode} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Nome da Escola</label>
              <input 
                type="text" 
                placeholder="Ex: Escola Secundária de Camões" 
                value={newSchool.name}
                onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                required 
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Localização</label>
              <input 
                type="text" 
                placeholder="Ex: Lisboa" 
                value={newSchool.location}
                onChange={(e) => setNewSchool({...newSchool, location: e.target.value})}
                required 
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Data do Baile</label>
              <input 
                type="date" 
                value={newSchool.ballDate}
                onChange={(e) => setNewSchool({...newSchool, ballDate: e.target.value})}
                required 
                style={{ colorScheme: 'dark' }}
                disabled={isSubmitting}
              />
            </div>

            <div className="input-group-simple" style={{ flex: '1 1 100%', marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>
                Lista de Convidados (PDF Opcional)
              </label>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="pdf-upload-input"
                disabled={isSubmitting || isParsing}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <label htmlFor="pdf-upload-input" className="btn-icon" style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 20px', 
                  cursor: (isSubmitting || isParsing) ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {isParsing ? 'A analisar PDF...' : pdfFile ? 'Alterar PDF' : 'Selecionar PDF'}
                </label>
                {pdfFile && (
                  <span style={{ fontSize: '0.9rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📄 {pdfFile.name} ({guestCount} convidados detetados)
                  </span>
                )}
                {pdfError && (
                  <span style={{ fontSize: '0.9rem', color: '#ff4d4d' }}>
                    ❌ {pdfError}
                  </span>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-premium" 
              style={{ height: '48px', whiteSpace: 'nowrap' }}
              disabled={isSubmitting || isParsing}
            >
              {isSubmitting ? 'A Processar...' : 'Criar Agora'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="admin-table-wrapper glass-card">
        {loading ? <p style={{padding: '20px'}}>A carregar...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Escola</th>
                <th>Localização</th>
                <th>Data do Baile</th>
                <th>Código</th>
                <th>Visível</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} style={{ background: editingCodeId === c.id ? 'rgba(255, 255, 255, 0.03)' : undefined }}>
                  {editingCodeId === c.id ? (
                    <>
                      <td>
                        <input 
                          type="text" 
                          value={editCodeData.schoolName} 
                          onChange={e => setEditCodeData({ ...editCodeData, schoolName: e.target.value })} 
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'white', fontWeight: 700 }}
                          required
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={editCodeData.location} 
                          onChange={e => setEditCodeData({ ...editCodeData, location: e.target.value })} 
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'white' }}
                          required
                        />
                      </td>
                      <td>
                        <input 
                          type="date" 
                          value={editCodeData.ballDate} 
                          onChange={e => setEditCodeData({ ...editCodeData, ballDate: e.target.value })} 
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'white', colorScheme: 'dark' }}
                          required
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={editCodeData.code} 
                          onChange={e => setEditCodeData({ ...editCodeData, code: e.target.value.toUpperCase() })} 
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'white', fontFamily: 'monospace', fontWeight: 'bold' }}
                          required
                          maxLength={12}
                        />
                      </td>
                      <td></td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn-icon-small"
                            onClick={() => handleSaveEdit(c.id)}
                            title="Salvar"
                            style={{ color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="btn-icon-small"
                            onClick={() => setEditingCodeId(null)}
                            title="Cancelar"
                            style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{c.schoolName}</td>
                      <td>{c.location || 'N/A'}</td>
                      <td>
                        {c.ballDate
                          ? new Date(c.ballDate + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
                          : <span style={{ color: 'var(--color-gray-400)', fontSize: '0.85rem' }}>Sem data</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <code className="code-badge">{c.code}</code>
                          <button 
                            onClick={() => {
                              const text = c.code;
                              if (navigator.clipboard && window.isSecureContext) {
                                navigator.clipboard.writeText(text);
                              } else {
                                const textArea = document.createElement("textarea");
                                textArea.value = text;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textArea);
                              }
                              showToast('Código copiado');
                            }}
                            className="btn-icon-small"
                            title="Copiar Código"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleVisibility(c.id, c.hidden)}
                          className="btn-icon-small"
                          title={c.hidden ? "Oculto - Clique para Mostrar" : "Visível - Clique para Ocultar"}
                          style={{ color: c.hidden ? '#f87171' : '#38bdf8', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {c.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn-icon-small"
                            onClick={() => {
                              setEditingCodeId(c.id);
                              setEditCodeData({
                                code: c.code,
                                schoolName: c.schoolName,
                                location: c.location || '',
                                ballDate: c.ballDate || ''
                              });
                            }}
                            title="Editar"
                            style={{ color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="btn-delete">Apagar</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-toast"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
};

const EntradasManager = () => {
  const [attendees, setAttendees] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeStatsModal, setActiveStatsModal] = useState(null);
  const [sortBy, setSortBy] = useState('alphabetical');

  // Quick manual add guest states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    schoolCode: '',
    ticketType: 'All-Access',
    immediateCheckIn: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showAddForm) {
      setNewGuest(prev => ({ ...prev, schoolCode: selectedSchool }));
    }
  }, [showAddForm, selectedSchool]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const fetchData = async () => {
    try {
      const schoolData = await getAllCodes(true);
      setSchools(schoolData);
      showToast("🔄 Escolas atualizadas.");
    } catch (error) {
      console.error("Error loading schools:", error);
      showToast("❌ Erro ao atualizar escolas.");
    }
  };

  useEffect(() => {
    // Fetch static schools codes
    fetchData();

    // Set up live listener for registrations
    setLoading(true);
    const q = query(collection(db, "registrations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs = [];
      snapshot.forEach((doc) => {
        regs.push({ id: doc.id, ...doc.data() });
      });
      setAttendees(regs);
      setLoading(false);
    }, (error) => {
      console.error("Error with snapshot listener:", error);
      showToast("❌ Erro de ligação em tempo real.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleCheckIn = async (attendee) => {
    const nextState = !attendee.checkedIn;
    try {
      const docRef = doc(db, "registrations", attendee.id);
      await updateDoc(docRef, { checkedIn: nextState });
      showToast(nextState ? `✅ Check-in realizado para ${attendee.firstName}` : `🔄 Check-in cancelado para ${attendee.firstName}`);
    } catch (error) {
      console.error("Check-in error:", error);
      showToast("❌ Erro ao processar check-in.");
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.firstName.trim() || !newGuest.schoolCode) {
      showToast("⚠️ Nome e escola são obrigatórios.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "registrations"), {
        firstName: newGuest.firstName.trim(),
        lastName: newGuest.lastName.trim(),
        schoolCode: newGuest.schoolCode,
        ticketType: newGuest.ticketType,
        status: 'paid',
        paidInstallments: 1,
        totalInstallments: 1,
        paymentPlan: 'full',
        checkedIn: newGuest.immediateCheckIn,
        createdAt: new Date().toISOString(),
        paymentMethod: 'manual_entradas'
      });
      
      showToast(`✅ Convidado ${newGuest.firstName} adicionado com sucesso!`);
      setShowAddForm(false);
      setNewGuest({
        firstName: '',
        lastName: '',
        schoolCode: selectedSchool || '',
        ticketType: 'All-Access',
        immediateCheckIn: true
      });
    } catch (err) {
      console.error("Error adding guest:", err);
      showToast("❌ Erro ao adicionar convidado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTicketType = (attendee) => {
    if (attendee.ticketType) return attendee.ticketType;
    const hash = attendee.firstName.charCodeAt(0) + (attendee.lastName ? attendee.lastName.charCodeAt(0) : 0);
    const mod = hash % 5;
    if (mod === 0) return 'Só Cocktail';
    if (mod === 1) return 'Cocktail + Jantar';
    if (mod === 2) return 'Cocktail + Festa';
    if (mod === 3) return 'Só Festa';
    return 'All-Access';
  };

  const filteredAttendees = attendees.filter(a => {
    const matchesSchool = !selectedSchool || a.schoolCode === selectedSchool;
    const matchesSearch = !searchQuery || 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone?.includes(searchQuery);
    return matchesSchool && matchesSearch && !a.checkedIn;
  });

  const sortedAttendees = [...filteredAttendees].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB, 'pt', { sensitivity: 'base' });
    }
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const getStatsForType = (type) => {
    const typeAttendees = attendees.filter(a => {
      const matchesSchool = !selectedSchool || a.schoolCode === selectedSchool;
      return matchesSchool && getTicketType(a) === type;
    });
    const total = typeAttendees.length;
    const checkedInCount = typeAttendees.filter(a => a.checkedIn).length;
    return { total, checkedIn: checkedInCount };
  };

  const cocktailStats = getStatsForType('Só Cocktail');
  const dinnerStats = getStatsForType('Cocktail + Jantar');
  const cocktailPartyStats = getStatsForType('Cocktail + Festa');
  const partyStats = getStatsForType('Só Festa');
  const allAccessStats = getStatsForType('All-Access');

  return (
    <div className="admin-page">
      <header className="admin-header split" style={{ marginBottom: '25px' }}>
        <div>
          <h1>🚪 Controlo de Entradas</h1>
          <p>Faça o check-in dos convidados e acompanhe a lotação em tempo real.</p>
        </div>
        <div className="entradas-header-actions">
          <button 
            onClick={() => { setShowAddForm(!showAddForm); setNewGuest(prev => ({ ...prev, schoolCode: selectedSchool })); }} 
            className="btn-premium" 
            style={{ height: '44px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', fontSize: '0.9rem' }}
          >
            <Plus size={16} /> {showAddForm ? 'Cancelar' : 'Adicionar Convidado'}
          </button>
          <select
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', 
              padding: '10px 16px', 
              borderRadius: 10,
              fontFamily: 'inherit',
              fontSize: '0.9rem' 
            }}
          >
            <option value="">Todas as Escolas</option>
            {schools.map(s => (
              <option key={s.id} value={s.code}>{s.schoolName} ({s.code})</option>
            ))}
          </select>
          <button onClick={fetchData} className="btn-icon-small" title="Recarregar" style={{ height: '44px', width: '44px' }}>
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card admin-form-card"
        >
          <form onSubmit={handleAddGuest} className="admin-manual-form" style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Nome Próprio</label>
              <input 
                type="text" 
                placeholder="Ex: João" 
                value={newGuest.firstName}
                onChange={(e) => setNewGuest({...newGuest, firstName: e.target.value})}
                required 
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Apelido / Turma</label>
              <input 
                type="text" 
                placeholder="Ex: Silva (12º A)" 
                value={newGuest.lastName}
                onChange={(e) => setNewGuest({...newGuest, lastName: e.target.value})}
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Escola</label>
              <select
                value={newGuest.schoolCode}
                onChange={(e) => setNewGuest({...newGuest, schoolCode: e.target.value})}
                required
                disabled={isSubmitting}
              >
                <option value="">Selecionar Escola...</option>
                {schools.map(s => (
                  <option key={s.id} value={s.code}>{s.schoolName} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Tipo de Acesso</label>
              <select
                value={newGuest.ticketType}
                onChange={(e) => setNewGuest({...newGuest, ticketType: e.target.value})}
                required
                disabled={isSubmitting}
              >
                <option value="All-Access">All-Access</option>
                <option value="Só Cocktail">Só Cocktail</option>
                <option value="Cocktail + Jantar">Cocktail + Jantar</option>
                <option value="Cocktail + Festa">Cocktail + Festa</option>
                <option value="Só Festa">Só Festa</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px', height: '48px', paddingBottom: '10px' }}>
              <input 
                type="checkbox" 
                id="immediate-checkin"
                checked={newGuest.immediateCheckIn}
                onChange={(e) => setNewGuest({...newGuest, immediateCheckIn: e.target.checked})}
                disabled={isSubmitting}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="immediate-checkin" style={{ fontSize: '0.9rem', color: 'var(--color-gray-400)', cursor: 'pointer', userSelect: 'none' }}>
                Check-in imediato (Entra já)
              </label>
            </div>

            <button 
              type="submit" 
              className="btn-premium" 
              style={{ height: '48px', whiteSpace: 'nowrap' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'A Adicionar...' : 'Adicionar'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="entradas-stats-grid">
        {/* Só Cocktail - Blue */}
        <motion.div 
          onClick={() => setActiveStatsModal('Só Cocktail')}
          whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(56, 189, 248, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="glass-card entradas-stat-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.02) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.15)'
          }}
        >
          <div className="card-header">
            <span className="card-title" style={{ color: '#38bdf8' }}>Só Cocktail</span>
            <span style={{ fontSize: '20px' }}>🍸</span>
          </div>
          <h2 className="card-value">
            {cocktailStats.checkedIn} <span>/ {cocktailStats.total}</span>
          </h2>
          <p className="card-desc">Entraram no evento</p>
        </motion.div>

        {/* Cocktail + Jantar - Orange */}
        <motion.div 
          onClick={() => setActiveStatsModal('Cocktail + Jantar')}
          whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(251, 146, 60, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="glass-card entradas-stat-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(251, 146, 60, 0.02) 100%)',
            border: '1px solid rgba(251, 146, 60, 0.15)'
          }}
        >
          <div className="card-header">
            <span className="card-title" style={{ color: '#fb923c' }}>Cocktail + Jantar</span>
            <span style={{ fontSize: '20px' }}>🍽️</span>
          </div>
          <h2 className="card-value">
            {dinnerStats.checkedIn} <span>/ {dinnerStats.total}</span>
          </h2>
          <p className="card-desc">Entraram no evento</p>
        </motion.div>

        {/* Cocktail + Festa - Emerald */}
        <motion.div 
          onClick={() => setActiveStatsModal('Cocktail + Festa')}
          whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(52, 211, 153, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="glass-card entradas-stat-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(52, 211, 153, 0.02) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.15)'
          }}
        >
          <div className="card-header">
            <span className="card-title" style={{ color: '#34d399' }}>Cocktail + Festa</span>
            <span style={{ fontSize: '20px' }}>🥂</span>
          </div>
          <h2 className="card-value">
            {cocktailPartyStats.checkedIn} <span>/ {cocktailPartyStats.total}</span>
          </h2>
          <p className="card-desc">Entraram no evento</p>
        </motion.div>

        {/* Só Festa - Rose */}
        <motion.div 
          onClick={() => setActiveStatsModal('Só Festa')}
          whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(251, 113, 133, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="glass-card entradas-stat-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(251, 113, 133, 0.08) 0%, rgba(251, 113, 133, 0.02) 100%)',
            border: '1px solid rgba(251, 113, 133, 0.15)'
          }}
        >
          <div className="card-header">
            <span className="card-title" style={{ color: '#fb7185' }}>Só Festa</span>
            <span style={{ fontSize: '20px' }}>🎸</span>
          </div>
          <h2 className="card-value">
            {partyStats.checkedIn} <span>/ {partyStats.total}</span>
          </h2>
          <p className="card-desc">Entraram no evento</p>
        </motion.div>

        {/* All-Access - Violet */}
        <motion.div 
          onClick={() => setActiveStatsModal('All-Access')}
          whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(167, 139, 250, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="glass-card entradas-stat-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(167, 139, 250, 0.02) 100%)',
            border: '1px solid rgba(167, 139, 250, 0.15)'
          }}
        >
          <div className="card-header">
            <span className="card-title" style={{ color: '#a78bfa' }}>All-Access</span>
            <span style={{ fontSize: '20px' }}>👑</span>
          </div>
          <h2 className="card-value">
            {allAccessStats.checkedIn} <span>/ {allAccessStats.total}</span>
          </h2>
          <p className="card-desc">Entraram no evento</p>
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: '400px', minWidth: '250px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou telemóvel..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Ordenar:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', 
              padding: '10px 16px', 
              borderRadius: 10,
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <option value="alphabetical">🔤 Ordem Alfabética (A-Z)</option>
            <option value="date">📅 Mais Recentes</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrapper glass-card">
        {loading ? (
          <p style={{ padding: '20px' }}>A carregar convidados...</p>
        ) : sortedAttendees.length === 0 ? (
          <p style={{ padding: '30px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Nenhum convidado encontrado.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo de Acesso</th>
                <th>Lotação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedAttendees.map(a => {
                const ticket = getTicketType(a);
                
                return (
                  <tr key={a.id} style={{ opacity: a.checkedIn ? 0.75 : 1 }}>
                    <td style={{ fontWeight: '700' }}>{a.firstName} {a.lastName}</td>
                    <td>
                      <span style={{ 
                        color: 
                          ticket === 'Só Cocktail' ? '#38bdf8' : 
                          ticket === 'Cocktail + Jantar' ? '#fb923c' : 
                          ticket === 'Cocktail + Festa' ? '#34d399' : 
                          ticket === 'Só Festa' ? '#fb7185' : 
                          '#a78bfa',
                        fontWeight: '700',
                        fontSize: '0.85rem'
                      }}>
                        {ticket}
                      </span>
                    </td>
                    <td>
                      {a.checkedIn ? (
                        <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.85rem' }}>
                          <CheckCircle size={14} /> Dentro
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                          <Clock size={14} /> Ausente
                        </span>
                      )}
                    </td>
                    <td>
                      {a.checkedIn ? (
                        <button
                          onClick={() => handleToggleCheckIn(a)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                          Anular Entrada
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleCheckIn(a)}
                          style={{
                            background: 'rgba(74, 222, 128, 0.1)',
                            border: '1px solid rgba(74, 222, 128, 0.2)',
                            color: '#4ade80',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)'}
                        >
                          Validar Entrada
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* List for Mobile (Cards) */}
      {!loading && sortedAttendees.length > 0 && (
        <div className="mobile-attendees-list">
          {sortedAttendees.map(a => {
            const ticket = getTicketType(a);
            
            return (
              <div key={a.id} className="mobile-attendee-card glass-card" style={{ opacity: a.checkedIn ? 0.8 : 1 }}>
                <div className="card-top">
                  <div className="guest-info">
                    <span className="guest-name">{a.firstName} {a.lastName}</span>
                  </div>
                </div>
                
                <div className="card-middle">
                  <span style={{ 
                    color: 
                      ticket === 'Só Cocktail' ? '#38bdf8' : 
                      ticket === 'Cocktail + Jantar' ? '#fb923c' : 
                      ticket === 'Cocktail + Festa' ? '#34d399' : 
                      ticket === 'Só Festa' ? '#fb7185' : 
                      '#a78bfa',
                    fontWeight: '700',
                    fontSize: '0.85rem'
                  }}>
                    {ticket}
                  </span>
                  {a.checkedIn ? (
                    <span className="presence-badge inside">
                      <CheckCircle size={14} /> Dentro
                    </span>
                  ) : (
                    <span className="presence-badge absent">
                      <Clock size={14} /> Ausente
                    </span>
                  )}
                </div>
                
                <div className="card-actions">
                  {a.checkedIn ? (
                    <button
                      onClick={() => handleToggleCheckIn(a)}
                      className="btn-cancel"
                    >
                      Anular Entrada
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleCheckIn(a)}
                      className="btn-validate"
                      style={{
                        background: 'rgba(74, 222, 128, 0.1)',
                        border: '1px solid rgba(74, 222, 128, 0.2)',
                        color: '#4ade80',
                        cursor: 'pointer'
                      }}
                    >
                      Validar Entrada
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!loading && sortedAttendees.length === 0 && (
        <div className="mobile-attendees-list-empty">
          <p style={{ padding: '30px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Nenhum convidado encontrado.</p>
        </div>
      )}

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-toast"
        >
          {toast}
        </motion.div>
      )}

      {/* Stats Modal */}
      <AnimatePresence>
        {activeStatsModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveStatsModal(null)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
            />
            
            {/* Modal Content Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
                border: `1px solid ${
                  activeStatsModal === 'Só Cocktail' ? 'rgba(56, 189, 248, 0.3)' : 
                  activeStatsModal === 'Cocktail + Jantar' ? 'rgba(251, 146, 60, 0.3)' : 
                  activeStatsModal === 'Cocktail + Festa' ? 'rgba(52, 211, 153, 0.3)' :
                  activeStatsModal === 'Só Festa' ? 'rgba(251, 113, 133, 0.3)' :
                  'rgba(167, 139, 250, 0.3)'
                }`,
                borderRadius: '20px',
                width: '100%',
                maxWidth: '550px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                zIndex: 1001
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: `linear-gradient(90deg, ${
                  activeStatsModal === 'Só Cocktail' ? 'rgba(56, 189, 248, 0.05)' : 
                  activeStatsModal === 'Cocktail + Jantar' ? 'rgba(251, 146, 60, 0.05)' : 
                  activeStatsModal === 'Cocktail + Festa' ? 'rgba(52, 211, 153, 0.05)' :
                  activeStatsModal === 'Só Festa' ? 'rgba(251, 113, 133, 0.05)' :
                  'rgba(167, 139, 250, 0.05)'
                } 0%, transparent 100%)`
              }}>
                <div>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: '800', 
                    margin: 0,
                    color: 
                      activeStatsModal === 'Só Cocktail' ? '#38bdf8' : 
                      activeStatsModal === 'Cocktail + Jantar' ? '#fb923c' : 
                      activeStatsModal === 'Cocktail + Festa' ? '#34d399' :
                      activeStatsModal === 'Só Festa' ? '#fb7185' :
                      '#a78bfa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {activeStatsModal === 'Só Cocktail' ? '🍸' : activeStatsModal === 'Cocktail + Jantar' ? '🍽️' : activeStatsModal === 'Cocktail + Festa' ? '🥂' : activeStatsModal === 'Só Festa' ? '🎸' : '👑'} 
                    {activeStatsModal} — Presentes
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                    Lista de convidados com entrada validada
                  </p>
                </div>
                <button 
                  onClick={() => setActiveStatsModal(null)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <X size={16} />
                </button>
              </div>

              {/* List Content */}
              <div style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1
              }}>
                {attendees.filter(a => {
                  const matchesSchool = !selectedSchool || a.schoolCode === selectedSchool;
                  return matchesSchool && a.checkedIn && getTicketType(a) === activeStatsModal;
                }).length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 0', 
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.9rem' 
                  }}>
                    Nenhum convidado validado nesta categoria.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {attendees
                      .filter(a => {
                        const matchesSchool = !selectedSchool || a.schoolCode === selectedSchool;
                        return matchesSchool && a.checkedIn && getTicketType(a) === activeStatsModal;
                      })
                      .sort((a, b) => {
                        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
                        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
                        return nameA.localeCompare(nameB, 'pt', { sensitivity: 'base' });
                      })
                      .map(a => (
                        <div 
                          key={a.id} 
                          className="stats-modal-item"
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                              {a.firstName} {a.lastName}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleCheckIn(a)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                              e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            Anular Entrada
                          </button>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'flex-end',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <button
                  onClick={() => setActiveStatsModal(null)}
                  className="btn-premium"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '0.85rem',
                    height: 'auto'
                  }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AttendeeManager = () => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // Attendee to delete
  const [schools, setSchools] = useState([]);
  const [newAttendee, setNewAttendee] = useState({
    firstName: '', lastName: '', email: '', phone: '', schoolCode: '', paymentPlan: 'full', ticketType: 'All-Access'
  });

  const fetchData = async () => {
    setLoading(true);
    const [regData, schoolData] = await Promise.all([
      getAllRegistrations(),
      getAllCodes(true)
    ]);
    setAttendees(regData);
    setSchools(schoolData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteRegistration(confirmDelete.id);
      setConfirmDelete(null);
      setSelectedAttendee(null);
      fetchData();
    } catch (error) {
      alert("Erro ao eliminar.");
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    try {
      await registerStudent({
        ...newAttendee,
        status: 'pending',
        paidInstallments: 0,
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setNewAttendee({ firstName: '', lastName: '', email: '', phone: '', schoolCode: '', paymentPlan: 'full', ticketType: 'All-Access' });
      fetchData();
    } catch (error) {
      alert("Erro ao adicionar inscrito.");
    }
  };

  const getStatusBadge = (status) => {
    const labels = { pending: 'Pendente', paid: 'Pago', partial: 'Parcial' };
    return <span className={`status-badge ${status}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="admin-page">
      <header className="admin-header split">
        <div>
          <h1>Lista de Inscritos</h1>
          <p>Gere as inscrições e pagamentos manualmente.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-premium">
          {showAddForm ? 'Cancelar' : 'Adicionar Manualmente'}
        </button>
      </header>

      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card admin-form-card"
          style={{ marginBottom: '30px', padding: '30px' }}
        >
          <form onSubmit={handleManualAdd} className="admin-manual-form">
            <div className="form-row">
              <input type="text" placeholder="Nome" value={newAttendee.firstName} onChange={e => setNewAttendee({...newAttendee, firstName: e.target.value})} required />
              <input type="text" placeholder="Apelido" value={newAttendee.lastName} onChange={e => setNewAttendee({...newAttendee, lastName: e.target.value})} required />
            </div>
            <div className="form-row">
              <input type="email" placeholder="Email" value={newAttendee.email} onChange={e => setNewAttendee({...newAttendee, email: e.target.value})} required />
              <input type="tel" placeholder="Telemóvel" value={newAttendee.phone} onChange={e => setNewAttendee({...newAttendee, phone: e.target.value})} required />
            </div>
            <div className="form-row">
              <select value={newAttendee.schoolCode} onChange={e => setNewAttendee({...newAttendee, schoolCode: e.target.value})} required>
                <option value="">Selecionar Escola</option>
                {schools.map(s => <option key={s.id} value={s.code}>{s.schoolName} ({s.code})</option>)}
              </select>
              <select value={newAttendee.paymentPlan} onChange={e => setNewAttendee({...newAttendee, paymentPlan: e.target.value})}>
                <option value="full">Pagamento Total</option>
                <option value="installments">5 Prestações</option>
              </select>
              <select value={newAttendee.ticketType} onChange={e => setNewAttendee({...newAttendee, ticketType: e.target.value})} required>
                <option value="Só Cocktail">Só Cocktail</option>
                <option value="Cocktail + Jantar">Cocktail + Jantar</option>
                <option value="Cocktail + Festa">Cocktail + Festa</option>
                <option value="Só Festa">Só Festa</option>
                <option value="All-Access">All-Access</option>
              </select>
            </div>
            <div className="form-row" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn-premium">Adicionar Aluno</button>
            </div>
          </form>
        </motion.div>
      )}
      <div className="admin-table-wrapper glass-card">
        {loading ? <p style={{padding: '20px'}}>A carregar...</p> : (
          <table className="admin-table clickable">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Plano</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map(a => (
                <tr key={a.id} onClick={() => setSelectedAttendee(a)}>
                  <td>{a.firstName} {a.lastName}</td>
                  <td>{a.paymentPlan === 'installments' ? '5 Prestações' : 'Total'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAttendee && (
        <div className="admin-modal-overlay" onClick={() => setSelectedAttendee(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="admin-modal glass-card"
            onClick={e => e.stopPropagation()}
          >
            <header className="modal-header">
              <h2>Detalhes do Inscrito</h2>
              <button className="btn-close" onClick={() => setSelectedAttendee(null)}>&times;</button>
            </header>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Informação Pessoal</h4>
                <div className="detail-grid">
                  <div className="detail-item"><span>Nome:</span> <strong>{selectedAttendee.firstName} {selectedAttendee.lastName}</strong></div>
                  <div className="detail-item"><span>Email:</span> <strong>{selectedAttendee.email}</strong></div>
                  <div className="detail-item"><span>Telemóvel:</span> <strong>{selectedAttendee.phone}</strong></div>
                  <div className="detail-item"><span>Inscrição ID:</span> <strong style={{ fontSize: '0.85em' }}>{selectedAttendee.id}</strong></div>
                </div>
              </div>

              <div className="detail-section payment-status-section">
                <h4>Estado de Pagamento</h4>
                <div className="payment-summary">
                  <div className="plan-info detail-row-inline">
                    <span>Plano Escolhido:</span>
                    <strong>{selectedAttendee.paymentPlan === 'installments' ? '5 Prestações (5x 11.00€)' : 'Pagamento Total (55€)'}</strong>
                  </div>
                  <div className="progress-info detail-row-inline">
                    <span>Progresso:</span>
                    <div className="payment-pills" style={{ marginTop: 0 }}>
                      {selectedAttendee.paymentPlan === 'installments' ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`pill ${selectedAttendee.paidInstallments > i ? 'paid' : ''}`}
                            >
                              {i + 1}ª Prest. {selectedAttendee.paidInstallments > i ? '(Paga)' : '(Pendente)'}
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className={`pill ${selectedAttendee.status === 'paid' ? 'paid' : ''}`}>
                          {selectedAttendee.status === 'paid' ? 'Totalidade Paga' : 'Pagamento Total Pendente'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button className="btn-premium">Confirmar Pagamento</button>
                    <button className="btn-outline-gold">Enviar Lembrete</button>
                  </div>
                  <button onClick={() => setConfirmDelete(selectedAttendee)} className="btn-delete" style={{ padding: '12px 20px' }}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {confirmDelete && (
        <div className="admin-modal-overlay" style={{ zIndex: 2000 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-modal glass-card delete-confirm-modal"
            style={{ maxWidth: '400px', textAlign: 'center' }}
          >
            <div className="delete-icon-large">
              <Trash2 size={40} />
            </div>
            <h2>Confirmar Eliminação</h2>
            <p>Tens a certeza que queres apagar <strong>{confirmDelete.firstName} {confirmDelete.lastName}</strong>? Esta ação é irreversível.</p>
            
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
              <button className="btn-outline-gold" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-delete" onClick={executeDelete}>Sim, Eliminar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const PRESET_EMOJIS = [
  '🏆', '👑', '🥇', '🥈', '🥉', '🎓', '🔥', '😂', 
  '💃', '🕺', '🎤', '📸', '✨', '🎭', '🎨', '🎸', 
  '🧠', '🤡', '⚽', '💖', '🕶️', '🌟', '🚀', '👔', 
  '💅', '👗', '🎮', '🍕', '🍻', '🍿', '💡', '💯'
];

/* ══════════════════════════════════════════════════════
   PRÉMIOS MANAGER
   ══════════════════════════════════════════════════════ */
const PremiosManager = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat] = useState({ titulo: '', descricao: '', emoji: '🏆', ordem: 1, tipo: 'livre', opcoes: [] });
  const [rankings, setRankings] = useState({}); // { [catId]: [{nifVotado, nomeVotado, votos}] }
  const [globalRankings, setGlobalRankings] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);
  const [confirmResetStep, setConfirmResetStep] = useState(0);

  // Edit category state
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({ titulo: '', descricao: '', emoji: '', ordem: 1, tipo: 'livre', opcoes: [] });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaveEdit = async (catId) => {
    if (!editCatData.titulo.trim()) { showToast('⚠️ O título não pode estar vazio.'); return; }
    if (editCatData.tipo === 'opcoes' && (!editCatData.opcoes || editCatData.opcoes.length === 0)) {
      showToast('⚠️ Deves adicionar pelo menos uma opção.');
      return;
    }
    try {
      await updateDoc(doc(db, 'votacao', selectedSchool, 'categorias', catId), {
        titulo: editCatData.titulo.trim(),
        descricao: editCatData.descricao.trim(),
        emoji: editCatData.emoji,
        ordem: Number(editCatData.ordem) || 1,
        tipo: editCatData.tipo || 'livre',
        opcoes: editCatData.tipo === 'opcoes' ? (editCatData.opcoes || []) : []
      });
      setEditingCatId(null);
      setShowEditEmojiPicker(false);
      showToast('✅ Categoria atualizada!');
    } catch (err) {
      console.error(err);
      showToast('❌ Erro ao atualizar categoria.');
    }
  };

  // Load school codes
  useEffect(() => {
    getAllCodes(true).then(data => setSchools(data));
  }, []);

  // Real-time categories listener
  useEffect(() => {
    if (!selectedSchool) { setCategorias([]); return; }
    setLoadingCats(true);
    const q = query(
      collection(db, 'votacao', selectedSchool, 'categorias'),
      orderBy('ordem', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingCats(false);
    });
    return () => unsub();
  }, [selectedSchool]);

  // Real-time global votes listener across all categories
  useEffect(() => {
    if (!selectedSchool || categorias.length === 0) {
      setGlobalRankings([]);
      setRankings({});
      return;
    }

    const unsubs = [];
    const allVotes = {}; // { [catId]: { [nifVotado]: { nomeVotado, votos } } }

    const updateGlobalRanking = () => {
      const aggregates = {}; // { [nifVotado]: { nomeVotado, totalVotos, detalheCategorias } }

      Object.entries(allVotes).forEach(([catId, catCounts]) => {
        const catObj = categorias.find(c => c.id === catId);
        const emoji = catObj?.emoji || '🏆';
        const titulo = catObj?.titulo || '';

        Object.entries(catCounts).forEach(([nif, info]) => {
          if (!aggregates[nif]) {
            aggregates[nif] = {
              nifVotado: nif,
              nomeVotado: info.nomeVotado,
              totalVotos: 0,
              detalheCategorias: []
            };
          }
          aggregates[nif].totalVotos += info.votos;
          aggregates[nif].detalheCategorias.push({
            catId,
            titulo: `${emoji} ${titulo}`,
            votos: info.votos
          });
        });
      });

      const sorted = Object.values(aggregates).sort((a, b) => b.totalVotos - a.totalVotos);
      setGlobalRankings(sorted);
    };

    categorias.forEach(cat => {
      const colRef = collection(db, 'votacao', selectedSchool, 'votos', cat.id, 'respostas');
      const unsub = onSnapshot(colRef, (snap) => {
        const catCounts = {};
        snap.docs.forEach(d => {
          const { nifVotado, nomeVotado } = d.data();
          if (!catCounts[nifVotado]) catCounts[nifVotado] = { nomeVotado, votos: 0 };
          catCounts[nifVotado].votos++;
        });

        const sortedCat = Object.values(catCounts).sort((a, b) => b.votos - a.votos);
        setRankings(prev => ({ ...prev, [cat.id]: sortedCat }));

        allVotes[cat.id] = catCounts;
        updateGlobalRanking();
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(unsub => unsub());
  }, [selectedSchool, categorias]);

  const handleExpandCat = (catId) => {
    if (expandedCat === catId) { setExpandedCat(null); return; }
    setExpandedCat(catId);
  };

  const handleCreateCat = async (e) => {
    e.preventDefault();
    if (!selectedSchool) { showToast('Seleciona uma escola primeiro.'); return; }
    if (newCat.tipo === 'opcoes' && (!newCat.opcoes || newCat.opcoes.length === 0)) {
      showToast('⚠️ Deves adicionar pelo menos uma opção.');
      return;
    }
    try {
      await addDoc(collection(db, 'votacao', selectedSchool, 'categorias'), {
        ...newCat,
        tipo: newCat.tipo || 'livre',
        opcoes: newCat.tipo === 'opcoes' ? (newCat.opcoes || []) : [],
        ordem: Number(newCat.ordem),
        ativa: true,
        mostrarResultados: false,
      });
      setNewCat({ titulo: '', descricao: '', emoji: '🏆', ordem: 1, tipo: 'livre', opcoes: [] });
      setShowForm(false);
      showToast('✅ Categoria criada!');
    } catch (err) {
      showToast('❌ Erro ao criar categoria.');
    }
  };

  const handleToggle = async (catId, field, current) => {
    try {
      await updateDoc(doc(db, 'votacao', selectedSchool, 'categorias', catId), { [field]: !current });
      showToast(field === 'mostrarResultados' ? (current ? '🔒 Resultados ocultados' : '👁️ Resultados revelados!') : (current ? '⏸️ Categoria desativada' : '▶️ Categoria ativada'));
    } catch { showToast('❌ Erro ao atualizar.'); }
  };

  const handleDeleteCat = async (catId) => {
    if (!window.confirm('Apagar esta categoria e todos os votos?')) return;
    try {
      await deleteDoc(doc(db, 'votacao', selectedSchool, 'categorias', catId));
      showToast('🗑️ Categoria apagada.');
    } catch { showToast('❌ Erro ao apagar.'); }
  };

  const handleResetVotes = (cat) => {
    setConfirmReset(cat);
    setConfirmResetStep(1);
  };

  const executeReset = async () => {
    if (!confirmReset) return;
    try {
      const colRef = collection(db, 'votacao', selectedSchool, 'votos', confirmReset.id, 'respostas');
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      showToast('🔄 Votos resetados!');
    } catch { showToast('❌ Erro ao resetar votos.'); }
    setConfirmReset(null);
    setConfirmResetStep(0);
  };

  return (
    <div className="admin-page">
      <header className="admin-header split">
        <div>
          <h1>🏆 Prémios / Votação</h1>
          <p>Gere as categorias e resultados de votação por escola.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 16px', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.9rem' }}
          >
            <option value="">Selecionar Escola</option>
            {schools.map(s => (
              <option key={s.id} value={s.code}>{s.schoolName} ({s.code})</option>
            ))}
          </select>
          {selectedSchool && (
            <button onClick={() => setShowForm(!showForm)} className="btn-premium">
              {showForm ? 'Cancelar' : <><Plus size={16} /> Nova Categoria</>}
            </button>
          )}
        </div>
      </header>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="glass-card admin-form-card"
            style={{ marginBottom: 28, padding: 28, position: 'relative', zIndex: 10 }}
          >
            <form onSubmit={handleCreateCat} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '0 0 80px', position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Emoji</label>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: 'white',
                      fontSize: '1.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    {newCat.emoji}
                  </button>
                  
                  {showEmojiPicker && (
                    <>
                      <div 
                        onClick={() => setShowEmojiPicker(false)} 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                      />
                      <div 
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: 8,
                          background: '#18181b',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 12,
                          padding: 12,
                          zIndex: 1000,
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
                          width: '280px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(6, 1fr)',
                          gap: 8
                        }}
                      >
                        {PRESET_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewCat(prev => ({ ...prev, emoji }));
                              setShowEmojiPicker(false);
                            }}
                            style={{
                              fontSize: '1.4rem',
                              background: newCat.emoji === emoji ? 'rgba(255,255,255,0.1)' : 'transparent',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = newCat.emoji === emoji ? 'rgba(255,255,255,0.1)' : 'transparent'}
                          >
                            {emoji}
                          </button>
                        ))}
                        
                        <div style={{ gridColumn: 'span 6', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', flexShrink: 0 }}>Outro:</span>
                          <input
                            type="text"
                            value={newCat.emoji}
                            onChange={e => setNewCat({ ...newCat, emoji: e.target.value })}
                            maxLength={2}
                            placeholder="Ex: 👑"
                            style={{
                              flex: 1,
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 6,
                              padding: '4px 8px',
                              color: 'white',
                              fontSize: '0.9rem',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ flex: 2, minWidth: 160 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Título</label>
                  <input type="text" placeholder="Ex: Mais Popular" value={newCat.titulo} onChange={e => setNewCat({...newCat, titulo: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white', height: '48px' }} required />
                </div>
                <div style={{ flex: 3, minWidth: 200 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descrição</label>
                  <input type="text" placeholder="Vota no aluno mais popular..." value={newCat.descricao} onChange={e => setNewCat({...newCat, descricao: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white', height: '48px' }} />
                </div>
                <div style={{ flex: '0 0 80px' }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ordem</label>
                  <input type="number" min={1} value={newCat.ordem} onChange={e => setNewCat({...newCat, ordem: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: 'white', height: '48px' }} />
                </div>
                <div style={{ flex: '0 0 160px', minWidth: 140 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo de Votação</label>
                  <select
                    value={newCat.tipo || 'livre'}
                    onChange={e => setNewCat({ ...newCat, tipo: e.target.value, opcoes: e.target.value === 'opcoes' ? [] : (newCat.opcoes || []) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white', height: '48px', outline: 'none' }}
                  >
                    <option value="livre" style={{ background: '#18181b', color: '#fff' }}>Livre (Escrever)</option>
                    <option value="opcoes" style={{ background: '#18181b', color: '#fff' }}>Opções (Lista)</option>
                  </select>
                </div>
              </div>

              {newCat.tipo === 'opcoes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opções para Escolha Múltipla</label>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      type="text" 
                      id="new-option-input"
                      placeholder="Ex: João Silva ou Opção A..." 
                      style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white', fontSize: '0.9rem' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.target.value.trim();
                          if (val) {
                            if (newCat.opcoes?.includes(val)) {
                              showToast('⚠️ Essa opção já existe.');
                              return;
                            }
                            setNewCat({ ...newCat, opcoes: [...(newCat.opcoes || []), val] });
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-premium"
                      style={{ height: 48, whiteSpace: 'nowrap', padding: '0 20px' }}
                      onClick={() => {
                        const input = document.getElementById('new-option-input');
                        const val = input?.value?.trim();
                        if (val) {
                          if (newCat.opcoes?.includes(val)) {
                            showToast('⚠️ Essa opção já existe.');
                            return;
                          }
                          setNewCat({ ...newCat, opcoes: [...(newCat.opcoes || []), val] });
                          input.value = '';
                        }
                      }}
                    >
                      Adicionar
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {(!newCat.opcoes || newCat.opcoes.length === 0) ? (
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Nenhuma opção adicionada ainda. Adicione pelo menos uma opção.</span>
                    ) : (
                      newCat.opcoes.map((opt, idx) => (
                        <span 
                          key={idx} 
                          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 8, padding: '6px 12px', fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}
                        >
                          {opt}
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', fontSize: '1rem', marginLeft: 4 }}
                            onClick={() => {
                              setNewCat({ ...newCat, opcoes: newCat.opcoes.filter((_, i) => i !== idx) });
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" className="btn-premium" style={{ height: 48, whiteSpace: 'nowrap', padding: '0 28px' }}>Criar Categoria</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty / No school selected */}
      {!selectedSchool && (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
          <Trophy size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p>Seleciona uma escola para gerir as categorias de votação.</p>
        </div>
      )}

      {/* Resumo Geral de Votações */}
      {selectedSchool && globalRankings.length > 0 && (
        <div className="glass-card" style={{ marginBottom: 28, padding: '24px 28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            📊 Resumo Geral de Votação (Mais Votados)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {globalRankings.slice(0, 6).map((r, i) => (
              <div 
                key={r.nifVotado} 
                style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  padding: 16, 
                  borderRadius: 12, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 10,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div 
                      style={{ 
                        width: 28, 
                        height: 28, 
                        borderRadius: '50%', 
                        background: i === 0 ? 'rgba(255, 215, 0, 0.15)' : i === 1 ? 'rgba(192, 192, 192, 0.15)' : i === 2 ? 'rgba(205, 127, 50, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: i === 0 ? '#ffd700' : i === 1 ? '#e2e8f0' : i === 2 ? '#cd7f32' : 'rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}
                    >
                      {i + 1}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{r.nomeVotado}</span>
                  </div>
                  <span style={{ background: 'rgba(225,29,72,0.12)', color: '#fda4af', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800 }}>
                    {r.totalVotos} {r.totalVotos === 1 ? 'voto' : 'votos'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.detalheCategorias.map((d, index) => (
                    <span 
                      key={index} 
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.04)', 
                        border: '1px solid rgba(255, 255, 255, 0.06)', 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        padding: '2px 8px', 
                        borderRadius: 6, 
                        fontSize: '0.72rem' 
                      }}
                    >
                      {d.titulo} ({d.votos})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Table */}
      {selectedSchool && !loadingCats && (
        <div 
          className="admin-table-wrapper glass-card"
          style={{ overflow: editingCatId ? 'visible' : 'hidden' }}
        >
          {categorias.length === 0 ? (
            <p style={{ padding: 24, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Sem categorias. Cria a primeira acima.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Ativa</th>
                  <th>Mostrar Resultados</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => (
                  <React.Fragment key={cat.id}>
                    <tr style={{ 
                      background: editingCatId === cat.id ? 'rgba(255, 255, 255, 0.03)' : undefined,
                      position: editingCatId === cat.id ? 'relative' : undefined,
                      zIndex: editingCatId === cat.id ? 2 : undefined
                    }}>
                      <td>
                        {editingCatId === cat.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ position: 'relative' }}>
                              <button
                                type="button"
                                onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: 8,
                                  fontSize: '1.4rem',
                                  width: '42px',
                                  height: '42px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                {editCatData.emoji}
                              </button>
                              {showEditEmojiPicker && (
                                <>
                                  <div 
                                    onClick={() => setShowEditEmojiPicker(false)} 
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                                  />
                                  <div 
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      marginTop: 8,
                                      background: '#18181b',
                                      border: '1px solid rgba(255,255,255,0.15)',
                                      borderRadius: 12,
                                      padding: 12,
                                      zIndex: 1000,
                                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                                      width: '280px',
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(6, 1fr)',
                                      gap: 8
                                    }}
                                  >
                                    {PRESET_EMOJIS.map(emoji => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                          setEditCatData(prev => ({ ...prev, emoji }));
                                          setShowEditEmojiPicker(false);
                                        }}
                                        style={{
                                          fontSize: '1.4rem',
                                          background: editCatData.emoji === emoji ? 'rgba(255,255,255,0.1)' : 'transparent',
                                          border: 'none',
                                          borderRadius: 8,
                                          padding: '6px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                    <div style={{ gridColumn: 'span 6', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', flexShrink: 0 }}>Outro:</span>
                                      <input
                                        type="text"
                                        value={editCatData.emoji}
                                        onChange={e => setEditCatData({ ...editCatData, emoji: e.target.value })}
                                        maxLength={2}
                                        placeholder="Ex: 👑"
                                        style={{
                                          flex: 1,
                                          background: 'rgba(0,0,0,0.2)',
                                          border: '1px solid rgba(255,255,255,0.1)',
                                          borderRadius: 6,
                                          padding: '4px 8px',
                                          color: 'white',
                                          fontSize: '0.9rem',
                                          textAlign: 'center',
                                          outline: 'none'
                                        }}
                                      />
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input 
                                  type="text" 
                                  value={editCatData.titulo} 
                                  onChange={e => setEditCatData({ ...editCatData, titulo: e.target.value })} 
                                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'white', fontWeight: 700 }}
                                  placeholder="Título"
                                />
                                <input 
                                  type="number" 
                                  min={1} 
                                  value={editCatData.ordem} 
                                  onChange={e => setEditCatData({ ...editCatData, ordem: e.target.value })} 
                                  style={{ width: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 4px', color: 'white', textAlign: 'center' }}
                                  title="Ordem"
                                />
                              </div>
                              <input 
                                type="text" 
                                value={editCatData.descricao} 
                                onChange={e => setEditCatData({ ...editCatData, descricao: e.target.value })} 
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}
                                placeholder="Descrição"
                              />
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', minWidth: '40px' }}>Tipo:</span>
                                <select 
                                  value={editCatData.tipo || 'livre'} 
                                  onChange={e => setEditCatData({ ...editCatData, tipo: e.target.value, opcoes: e.target.value === 'opcoes' ? (editCatData.opcoes || []) : [] })}
                                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'white', fontSize: '0.8rem', outline: 'none' }}
                                >
                                  <option value="livre" style={{ background: '#18181b', color: '#fff' }}>Livre (Texto)</option>
                                  <option value="opcoes" style={{ background: '#18181b', color: '#fff' }}>Opções (Lista)</option>
                                </select>
                              </div>
                              {editCatData.tipo === 'opcoes' && (
                                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input 
                                      type="text" 
                                      id={`edit-option-input-${cat.id}`}
                                      placeholder="Nova opção..." 
                                      style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', color: 'white', fontSize: '0.8rem' }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const val = e.target.value.trim();
                                          if (val) {
                                            if (editCatData.opcoes?.includes(val)) {
                                              showToast('⚠️ Essa opção já existe.');
                                              return;
                                            }
                                            setEditCatData({ ...editCatData, opcoes: [...(editCatData.opcoes || []), val] });
                                            e.target.value = '';
                                          }
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="btn-premium"
                                      style={{ height: 'auto', padding: '6px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                      onClick={() => {
                                        const input = document.getElementById(`edit-option-input-${cat.id}`);
                                        const val = input?.value?.trim();
                                        if (val) {
                                          if (editCatData.opcoes?.includes(val)) {
                                            showToast('⚠️ Essa opção já existe.');
                                            return;
                                          }
                                          setEditCatData({ ...editCatData, opcoes: [...(editCatData.opcoes || []), val] });
                                          input.value = '';
                                        }
                                      }}
                                    >
                                      Add
                                    </button>
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    {(!editCatData.opcoes || editCatData.opcoes.length === 0) ? (
                                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Sem opções ainda.</span>
                                    ) : (
                                      editCatData.opcoes.map((opt, idx) => (
                                        <span 
                                          key={idx} 
                                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', color: '#fff' }}
                                        >
                                          {opt}
                                          <button
                                            type="button"
                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}
                                            onClick={() => {
                                              setEditCatData({ ...editCatData, opcoes: editCatData.opcoes.filter((_, i) => i !== idx) });
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.4rem' }}>{cat.emoji}</span>
                            <div>
                              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {cat.titulo} 
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>#{cat.ordem}</span>
                                <span style={{ 
                                  fontSize: '0.65rem', 
                                  background: cat.tipo === 'opcoes' ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255,255,255,0.06)', 
                                  color: cat.tipo === 'opcoes' ? 'var(--color-gold)' : 'rgba(255,255,255,0.5)', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  {cat.tipo === 'opcoes' ? 'Opções' : 'Livre'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                {cat.descricao}
                                {cat.tipo === 'opcoes' && cat.opcoes && cat.opcoes.length > 0 && (
                                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                    <span style={{ color: 'var(--color-gold)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', marginRight: 4 }}>Lista:</span>
                                    {cat.opcoes.map((opt, idx) => (
                                      <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem', color: '#fff' }}>{opt}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-icon-small"
                          onClick={() => handleToggle(cat.id, 'ativa', cat.ativa)}
                          title={cat.ativa ? 'Desativar' : 'Ativar'}
                          style={{ color: cat.ativa ? '#4ade80' : undefined }}
                        >
                          {cat.ativa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn-icon-small"
                          onClick={() => handleToggle(cat.id, 'mostrarResultados', cat.mostrarResultados)}
                          title={cat.mostrarResultados ? 'Ocultar resultados' : 'Revelar resultados'}
                          style={{ color: cat.mostrarResultados ? '#fbbf24' : undefined }}
                        >
                          {cat.mostrarResultados ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                      <td>
                        {editingCatId === cat.id ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn-icon-small"
                              onClick={() => handleSaveEdit(cat.id)}
                              title="Salvar"
                              style={{ color: '#4ade80' }}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="btn-icon-small"
                              onClick={() => { setEditingCatId(null); setShowEditEmojiPicker(false); }}
                              title="Cancelar"
                              style={{ color: '#f87171' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn-icon-small"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditCatData({
                                  titulo: cat.titulo,
                                  descricao: cat.descricao || '',
                                  emoji: cat.emoji || '🏆',
                                  ordem: cat.ordem || 1,
                                  tipo: cat.tipo || 'livre',
                                  opcoes: cat.opcoes || []
                                });
                              }}
                              title="Editar"
                              style={{ color: '#38bdf8' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn-icon-small"
                              onClick={() => handleExpandCat(cat.id)}
                              title="Ver ranking"
                              style={{ color: expandedCat === cat.id ? '#e11d48' : undefined }}
                            >
                              📊
                            </button>
                            <button
                              className="btn-icon-small"
                              onClick={() => handleResetVotes(cat)}
                              title="Resetar votos"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteCat(cat.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Inline ranking row */}
                    {expandedCat === cat.id && (
                      <tr>
                        <td colSpan={4} style={{ background: 'rgba(225,29,72,0.04)', padding: '16px 24px' }}>
                          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>🏅 Ranking ao Vivo — {cat.emoji} {cat.titulo}</p>
                          {!rankings[cat.id] || rankings[cat.id].length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>Sem votos ainda.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {rankings[cat.id].map((r, i) => (
                                <div key={r.nifVotado} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ width: 24, fontWeight: 800, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.4)' }}>{i + 1}.</span>
                                  <span style={{ flex: 1, fontWeight: 600 }}>{r.nomeVotado}</span>
                                  <span style={{ background: 'rgba(225,29,72,0.15)', color: '#fb7185', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>{r.votos} {r.votos === 1 ? 'voto' : 'votos'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {loadingCats && <p style={{ padding: '20px', color: 'rgba(255,255,255,0.4)' }}>A carregar categorias...</p>}

      {/* Reset confirmation modal */}
      {confirmReset && (
        <div className="admin-modal-overlay" style={{ zIndex: 2000 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-modal glass-card delete-confirm-modal"
            style={{ maxWidth: 440, textAlign: 'center' }}
          >
            <div className="delete-icon-large"><RefreshCw size={36} /></div>
            <h2>Resetar Votos</h2>
            {confirmResetStep === 1 ? (
              <>
                <p>Apagar <strong>todos os votos</strong> da categoria <strong>{confirmReset.emoji} {confirmReset.titulo}</strong>? Esta ação é irreversível.</p>
                <div className="modal-actions" style={{ justifyContent: 'center', gap: 16, marginTop: 28 }}>
                  <button className="btn-outline-gold" onClick={() => { setConfirmReset(null); setConfirmResetStep(0); }}>Cancelar</button>
                  <button className="btn-delete" style={{ padding: '12px 20px' }} onClick={() => setConfirmResetStep(2)}>Continuar →</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: '#ff4d4d', fontWeight: 700, marginTop: 8 }}>Última confirmação. Tens a certeza absoluta?</p>
                <div className="modal-actions" style={{ justifyContent: 'center', gap: 16, marginTop: 28 }}>
                  <button className="btn-outline-gold" onClick={() => { setConfirmReset(null); setConfirmResetStep(0); }}>Cancelar</button>
                  <button className="btn-delete" style={{ padding: '12px 20px' }} onClick={executeReset}>Sim, Resetar Tudo</button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-toast"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
