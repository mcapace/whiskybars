'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoHeroProps {
  videos: string[];
  interval?: number; // Time per video in ms (default 15000 = 15 seconds)
  children?: React.ReactNode;
}

export default function VideoHero({
  videos = ['/videos/hero/hero-1.mp4', '/videos/hero/hero-2.mp4', '/videos/hero/hero-3.mp4'],
  interval = 15000,
  children
}: VideoHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    // Preload all videos
    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.load();
        if (index === 0) {
          video.play().catch(() => {});
        }
      }
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % videos.length;

          // Pause current video, play next
          if (videoRefs.current[prev]) {
            videoRefs.current[prev]!.pause();
            videoRefs.current[prev]!.currentTime = 0;
          }
          if (videoRefs.current[nextIndex]) {
            videoRefs.current[nextIndex]!.play().catch(() => {});
          }

          return nextIndex;
        });
        setIsTransitioning(false);
      }, 1000); // Crossfade duration
    }, interval);

    return () => clearInterval(timer);
  }, [videos.length, interval]);

  return (
    <div className="video-hero relative w-full h-[95vh] min-h-[700px] max-h-[1000px] overflow-hidden bg-black">
      {/* Video layers with Ken Burns effect */}
      {videos.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <video
            ref={(el) => { videoRefs.current[index] = el; }}
            className="absolute inset-0 w-full h-full object-cover ken-burns-zoom"
            src={src}
            muted
            playsInline
            loop={false}
            preload="auto"
          />
        </div>
      ))}

      {/* Film grain overlay */}
      <div className="absolute inset-0 film-grain opacity-30 pointer-events-none z-10" />

      {/* Vignette effect */}
      <div className="absolute inset-0 vignette pointer-events-none z-10" />

      {/* Overlay gradient with stronger filter */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-0" />
      <div className="absolute inset-0 bg-[#e04720]/20 mix-blend-overlay z-0" />
      <div className="absolute inset-0 bg-black/30 z-0" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>

      {/* Video indicator dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {videos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (videoRefs.current[currentIndex]) {
                videoRefs.current[currentIndex]!.pause();
              }
              setCurrentIndex(index);
              if (videoRefs.current[index]) {
                videoRefs.current[index]!.currentTime = 0;
                videoRefs.current[index]!.play().catch(() => {});
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to video ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
