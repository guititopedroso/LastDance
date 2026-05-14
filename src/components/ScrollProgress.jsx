import { useEffect, useState } from 'react';

const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      height: '3px',
      width: `${progress}%`,
      background: 'linear-gradient(90deg, #ff8c00, #ffb347, #ff8c00)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s linear infinite',
      zIndex: 99998,
      boxShadow: '0 0 10px rgba(255,140,0,0.8)',
      transition: 'width 0.05s linear',
      pointerEvents: 'none',
    }} />
  );
};

export default ScrollProgress;
