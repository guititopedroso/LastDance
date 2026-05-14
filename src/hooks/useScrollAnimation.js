import { useEffect, useRef } from 'react';

export const useScrollAnimation = (threshold = 0) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('animate-in');
          observer.unobserve(element);
        }
      },
      {
        threshold,
        // Começa a animar 100px ANTES do elemento entrar no ecrã
        rootMargin: '0px 0px -50px 0px',
      }
    );

    // Se o elemento já está visível no momento do carregamento,
    // anima imediatamente sem esperar pelo scroll
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      element.classList.add('animate-in');
    } else {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
};
