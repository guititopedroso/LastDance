import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Preloader.css';

const Preloader = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Give some time for the exit animation before calling completion callback
      setTimeout(() => {
        if (onLoadingComplete) onLoadingComplete();
      }, 1000);
    }, 2500); // Animation duration

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="preloader"
          initial={{ opacity: 1 }}
          exit={{ 
            y: '-100%',
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
          }}
        >
          <div className="preloader-content">
            <motion.div 
              className="preloader-logo-container"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img src="/logo.jpg" alt="Last Dance Logo" className="preloader-img" />
            </motion.div>

            <div className="preloader-line">
              <motion.div 
                className="preloader-progress"
                animate={{ 
                  translateX: ['-100%', '100%'] 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>

            <motion.p 
              className="preloader-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              Carregando Experiência
            </motion.p>
          </div>

          {/* Decorative background elements */}
          <motion.div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at center, rgba(255, 140, 0, 0.05) 0%, transparent 70%)',
              zIndex: -1
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
