import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import PolaroidCard from './PolaroidCard';

// Small helper component to animate the number counter using Framer Motion spring values
const AnimatedCounter = ({ value }) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 45, damping: 12 });
  const displayValue = useTransform(springValue, (latest) => Math.round(latest));
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return displayValue.on("change", (latest) => {
      setCurrent(latest);
    });
  }, [displayValue]);

  return <>{current}</>;
};

const GaleriaMemorias = ({ memorias, currentStudentNif, onDelete, onReport }) => {
  const [filter, setFilter] = useState('todas'); // 'todas' | 'minhas'
  const [filteredMemorias, setFilteredMemorias] = useState([]);

  useEffect(() => {
    if (filter === 'minhas') {
      setFilteredMemorias(memorias.filter(m => m.nif === currentStudentNif));
    } else {
      setFilteredMemorias(memorias);
    }
  }, [memorias, filter, currentStudentNif]);

  return (
    <div className="galeria-memorias-container">
      {/* Title & Stats Header */}
      <div className="galeria-header">
        <motion.h2 
          className="galeria-title text-gold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          📸 Memórias do Vosso Baile
        </motion.h2>

        <motion.p 
          className="galeria-counter"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          🎉 <strong className="text-rose-500"><AnimatedCounter value={filteredMemorias.length} /></strong>{' '}
          {filteredMemorias.length === 1 ? 'momento partilhado!' : 'momentos partilhados pelo vosso grupo!'}
        </motion.p>

        {/* Filter Tabs */}
        <div className="galeria-filters">
          <button 
            className={`filter-tab-btn ${filter === 'todas' ? 'active' : ''}`}
            onClick={() => setFilter('todas')}
          >
            Todas
          </button>
          <button 
            className={`filter-tab-btn ${filter === 'minhas' ? 'active' : ''}`}
            onClick={() => setFilter('minhas')}
          >
            As Minhas
          </button>
        </div>
      </div>

      {/* Polaroid Grid Layout */}
      {filteredMemorias.length === 0 ? (
        <motion.div 
          className="galeria-empty-state"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <p>Ainda não há polaroids neste mural. Sê o primeiro a partilhar um momento!</p>
        </motion.div>
      ) : (
        <div className="polaroid-masonry-grid">
          <AnimatePresence mode="popLayout">
            {filteredMemorias.map((memoria, index) => (
              <PolaroidCard 
                key={memoria.id}
                memory={memoria}
                index={index}
                currentStudentNif={currentStudentNif}
                onDelete={onDelete}
                onReport={onReport}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default GaleriaMemorias;
