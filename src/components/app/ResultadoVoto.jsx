import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../api/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import './ResultadoVoto.css';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_LABELS = ['1.º Lugar', '2.º Lugar', '3.º Lugar'];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (nif) => {
  const n = parseInt(nif, 10);
  const hue = isNaN(n) ? 0 : n % 360;
  return `hsl(${hue}, 60%, 42%)`;
};

const ResultadoVoto = ({ categoriaId, codigoEscola }) => {
  const [resultados, setResultados] = React.useState([]);
  const confettiLaunched = useRef(false);

  useEffect(() => {
    if (!categoriaId || !codigoEscola) return;

    const colRef = collection(db, 'votacao', codigoEscola, 'votos', categoriaId, 'respostas');
    const unsub = onSnapshot(colRef, (snap) => {
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
  }, [categoriaId, codigoEscola]);

  // Launch confetti on first render (winner reveal)
  useEffect(() => {
    if (resultados.length > 0 && !confettiLaunched.current) {
      confettiLaunched.current = true;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#fb7185', '#ffd700', '#fff']
      });
    }
  }, [resultados]);

  if (resultados.length === 0) {
    return (
      <div className="resultado-empty">
        <span>Sem votos ainda...</span>
      </div>
    );
  }

  const top3 = resultados.slice(0, 3);
  const winner = top3[0];
  const maxVotos = winner?.votos || 1;

  return (
    <div className="resultado-wrapper">
      <h4 className="resultado-title">🏅 Pódio</h4>

      {/* Podium */}
      <div className="podium">
        {top3.map((r, i) => {
          const isWinner = i === 0;
          const barHeight = Math.max(40, (r.votos / maxVotos) * 100);
          return (
            <motion.div
              key={r.nifVotado}
              className={`podium-slot ${isWinner ? 'podium-slot--winner' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, type: 'spring', stiffness: 180 }}
            >
              {/* Avatar */}
              <div
                className="podium-avatar"
                style={{
                  backgroundColor: getAvatarColor(r.nifVotado),
                  width: isWinner ? 56 : 44,
                  height: isWinner ? 56 : 44,
                  fontSize: isWinner ? '1.1rem' : '0.85rem',
                  boxShadow: isWinner ? '0 0 20px rgba(225, 29, 72, 0.5)' : 'none',
                }}
              >
                {getInitials(r.nomeVotado)}
              </div>
              <div className="podium-medal">{MEDALS[i]}</div>
              <div className="podium-name">{r.nomeVotado?.split(' ')[0]}</div>
              <div className="podium-votes">{r.votos} {r.votos === 1 ? 'voto' : 'votos'}</div>

              {/* Bar */}
              <motion.div
                className="podium-bar"
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.6, ease: 'easeOut' }}
                style={{
                  background: isWinner
                    ? 'linear-gradient(to top, var(--rose-700), var(--rose-500))'
                    : 'var(--bg-card-2)',
                  minHeight: 24,
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Full ranking if more than 3 */}
      {resultados.length > 3 && (
        <div className="resultado-rest">
          {resultados.slice(3).map((r, i) => (
            <div key={r.nifVotado} className="resultado-rest-item">
              <span className="resultado-rest-pos">{i + 4}.</span>
              <div
                className="avatar avatar-sm"
                style={{ backgroundColor: getAvatarColor(r.nifVotado) }}
              >
                {getInitials(r.nomeVotado)}
              </div>
              <span className="resultado-rest-name">{r.nomeVotado}</span>
              <span className="resultado-rest-votes">{r.votos}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultadoVoto;
