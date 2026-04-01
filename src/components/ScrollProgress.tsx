'use client';

import { useState, useEffect } from 'react';

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (scrollPx / winHeightPx) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', updateScrollProgress);
    updateScrollProgress();

    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[100]">
      <div
        className="h-full bg-gradient-to-r from-teal-400 via-wa-red to-apex-violet transition-all duration-100 ease-out"
        style={{
          width: `${scrollProgress}%`,
          boxShadow:
            scrollProgress > 0 ? '0 0 14px rgba(45, 212, 191, 0.35), 0 0 20px rgba(224, 71, 32, 0.2)' : 'none',
        }}
      />
    </div>
  );
}
