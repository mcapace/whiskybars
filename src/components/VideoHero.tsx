'use client';

import { useEffect, useRef } from 'react';

interface VideoHeroProps {
  video: string;
  children?: React.ReactNode;
}

export default function VideoHero({
  video = '/videos/hero/NLXDcpbG-31875404.mp4',
  children
}: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const LOOP_END_TIME = 67; // 1:07 in seconds

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Ensure video is muted
    videoElement.muted = true;
    
    // Load and play video
    videoElement.load();
    videoElement.play().catch(() => {});

    // Handle time update to loop at 1:07
    const handleTimeUpdate = () => {
      if (videoElement.currentTime >= LOOP_END_TIME) {
        videoElement.currentTime = 0;
        videoElement.play().catch(() => {});
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    // Ensure video loops by restarting if it reaches the end
    const handleEnded = () => {
      videoElement.currentTime = 0;
      videoElement.play().catch(() => {});
    };

    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="video-hero relative w-full h-[95vh] min-h-[700px] max-h-[1000px] overflow-hidden bg-black">
      {/* Single video with Ken Burns effect */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover ken-burns-zoom"
          src={video}
          muted
          playsInline
          loop={false}
          preload="auto"
        />
      </div>

      {/* Film grain overlay */}
      <div className="absolute inset-0 film-grain opacity-30 pointer-events-none z-10" />

      {/* Vignette effect */}
      <div className="absolute inset-0 vignette pointer-events-none z-10" />

      {/* Overlay gradient with lighter filter */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/50 z-0" />
      <div className="absolute inset-0 bg-[#e04720]/10 mix-blend-overlay z-0" />
      <div className="absolute inset-0 bg-black/15 z-0" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
