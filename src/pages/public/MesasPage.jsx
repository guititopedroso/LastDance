import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../api/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import mesasData from '../../data/mesas.json';
import { 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  Check, 
  Tv,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import './MesasPage.css';

// Helper to normalize names for comparison
const normalizeName = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\(.*\)/g, "") // Remove content in parentheses
    .replace(/12º\s*[a-z0-9]+/gi, "") // Remove 12º class tags (with masculine ordinal indicator)
    .replace(/12°\s*[a-z0-9]+/gi, "") // Remove 12º class tags (with degree symbol)
    .replace(/12\s*[a-z0-9]+/gi, "") // Remove 12 class tags
    .replace(/[^a-z]/g, ""); // Keep only alphabetic characters
};

const PAGE_CYCLE_TIME = 15; // seconds per page

export default function MesasPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(PAGE_CYCLE_TIME);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tablesPerPage, setTablesPerPage] = useState(6);

  // Live Firebase connection for school code '39GK8FU7' (Escola Secundária de Alcochete)
  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      where("schoolCode", "==", "39GK8FU7")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs = [];
      snapshot.forEach((doc) => {
        regs.push({ id: doc.id, ...doc.data() });
      });
      setRegistrations(regs);
      setLoading(false);
    }, (error) => {
      console.error("Error loading real-time registrations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Map for fast O(1) name lookup
  const registrationMap = useMemo(() => {
    const map = new Map();
    registrations.forEach(reg => {
      const fullName = `${reg.firstName || ''} ${reg.lastName || ''}`.trim();
      const norm = normalizeName(fullName);
      if (norm) {
        map.set(norm, reg);
      }
    });
    return map;
  }, [registrations]);

  // Check if a guest from PDF is checkedIn in Firestore
  const isGuestCheckedIn = (guestName, guestDetail) => {
    const norm = normalizeName(guestName + ' ' + (guestDetail || ''));
    if (!norm) return false;

    // Exact check on normalized name
    if (registrationMap.has(norm)) {
      return !!registrationMap.get(norm).checkedIn;
    }

    // Fuzzy lookups (includes check)
    for (const [key, value] of registrationMap.entries()) {
      if (key === norm || key.includes(norm) || norm.includes(key)) {
        return !!value.checkedIn;
      }
    }
    return false;
  };

  // Stats calculation
  const totalRegistrations = registrations.length;
  const checkedInCount = useMemo(() => {
    return registrations.filter(r => r.checkedIn).length;
  }, [registrations]);

  const checkInPercentage = totalRegistrations > 0 
    ? Math.round((checkedInCount / totalRegistrations) * 100) 
    : 0;

  // Carousel layout partitioning
  const totalPages = Math.ceil(mesasData.length / tablesPerPage);
  const currentTables = useMemo(() => {
    const start = currentPage * tablesPerPage;
    return mesasData.slice(start, start + tablesPerPage);
  }, [currentPage, tablesPerPage]);

  // Auto-slide effect
  useEffect(() => {
    if (!isPlaying) return;

    setSecondsRemaining(PAGE_CYCLE_TIME);
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          setCurrentPage(current => (current + 1) % totalPages);
          return PAGE_CYCLE_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, totalPages, currentPage]);

  // Live Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen listener and action
  const toggleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Error entering fullscreen:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePrevPage = () => {
    setCurrentPage(prev => (prev === 0 ? totalPages - 1 : prev - 1));
    setSecondsRemaining(PAGE_CYCLE_TIME);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
    setSecondsRemaining(PAGE_CYCLE_TIME);
  };

  // Formatter for Live Clock
  const formattedTime = currentTime.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className={`mesas-tv-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      {/* Top Header */}
      <header className="mesas-tv-header">
        <div className="header-left">
          <div className="school-badge">ESAC</div>
          <div>
            <h1>Escola Secundária de Alcochete</h1>
            <p className="subtitle">
              <Calendar size={14} style={{ marginRight: 6, display: 'inline' }} />
              Baile de Gala 2026 • Disposição das Mesas
            </p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="header-center">
          <div className="live-clock">
            <span className="clock-time">{formattedTime}</span>
            <span className="clock-date">{formattedDate}</span>
          </div>
        </div>

        {/* Control Center */}
        <div className="header-right">
          <div className="tv-controls glass-panel">
            {/* Auto-Slide Play/Pause */}
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className={`control-btn ${isPlaying ? 'active' : ''}`}
              title={isPlaying ? "Pausar Rotação" : "Iniciar Rotação"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span className="btn-label">{isPlaying ? `Pausar (${secondsRemaining}s)` : "Iniciar"}</span>
            </button>

            {/* Manual Navigation */}
            <div className="pagination-group">
              <button onClick={handlePrevPage} className="control-btn-icon" title="Página Anterior">
                <ChevronLeft size={16} />
              </button>
              <span className="page-indicator">
                {currentPage + 1} / {totalPages}
              </span>
              <button onClick={handleNextPage} className="control-btn-icon" title="Próxima Página">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Layout Customizer */}
            <div className="layout-select">
              <select 
                value={tablesPerPage} 
                onChange={(e) => {
                  setTablesPerPage(Number(e.target.value));
                  setCurrentPage(0);
                  setSecondsRemaining(PAGE_CYCLE_TIME);
                }}
                className="select-dropdown"
                title="Mesas por Página"
              >
                <option value={4}>4 Mesas</option>
                <option value={6}>6 Mesas</option>
                <option value={8}>8 Mesas</option>
                <option value={9}>9 Mesas</option>
              </select>
            </div>

            {/* Fullscreen Trigger */}
            <button 
              onClick={toggleFullscreen} 
              className="control-btn-icon fullscreen-btn"
              title={isFullscreen ? "Sair de Ecrã Inteiro" : "Ecrã Inteiro"}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid showing current page's tables */}
      <main className="mesas-tv-main">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>A sincronizar disposição de mesas em tempo real...</p>
          </div>
        ) : (
          <div className={`tables-grid cols-${tablesPerPage}`}>
            {currentTables.map((table) => {
              // Calculate checked in guests at this table
              const tableCheckedInCount = table.guests.filter(g => isGuestCheckedIn(g.name, g.detail)).length;
              const tableTotalCount = table.guests.length;
              const isTableComplete = tableCheckedInCount === tableTotalCount && tableTotalCount > 0;

              return (
                <div 
                  key={table.id} 
                  className={`table-card glass-panel ${isTableComplete ? 'table-completed' : ''}`}
                >
                  <div className="table-card-header">
                    <div>
                      <h2>{table.name}</h2>
                      <span className="table-desc">{table.description}</span>
                    </div>
                    <div className={`table-fill-badge ${isTableComplete ? 'completed' : ''}`}>
                      <Users size={12} style={{ marginRight: 4 }} />
                      <span>{tableCheckedInCount}/{tableTotalCount}</span>
                    </div>
                  </div>

                  <div className="table-guests-list">
                    {table.guests.map((guest, idx) => {
                      const isPresent = isGuestCheckedIn(guest.name, guest.detail);
                      
                      return (
                        <div 
                          key={idx} 
                          className={`guest-row ${isPresent ? 'present' : 'absent'}`}
                        >
                          <div className="guest-status-indicator">
                            {isPresent ? (
                              <div className="status-dot present">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="status-dot absent"></div>
                            )}
                          </div>
                          
                          <div className="guest-info">
                            <span className="guest-name">{guest.name}</span>
                            {guest.detail && (
                              <span className="guest-detail">{guest.detail}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Check-in Progress Bar */}
      <footer className="mesas-tv-footer glass-panel">
        <div className="progress-info">
          <div className="progress-label">
            <CheckCircle2 size={16} className="pulse-icon" />
            <span>Fluxo de Entradas no Baile:</span>
          </div>
          <div className="progress-numbers">
            <span className="current-present">{checkedInCount}</span>
            <span className="separator">/</span>
            <span className="total-expected">{totalRegistrations}</span>
            <span className="unit">Pessoas Presentes</span>
          </div>
        </div>

        <div className="progress-bar-wrapper">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${checkInPercentage}%` }}
          >
            <div className="progress-bar-glow"></div>
            <div className="progress-percentage-bubble">{checkInPercentage}%</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
