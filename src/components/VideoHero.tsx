'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoHeroProps {
  videoSrc?: string;
  loopEndTime?: number; // Time in seconds to loop back (default 67 = 1:07)
  children?: React.ReactNode;
}

export default function VideoHero({
  videoSrc = '/videos/hero/NLXDcpbG-31875404.mp4',
  loopEndTime = 67, // Loop at 1:07
  children
}: VideoHeroProps) {
  const [videoError, setVideoError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video loading and playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video source is set
    if (video.src !== videoSrc && !videoError) {
      video.src = videoSrc;
    }

    const startPlayback = () => {
      setIsLoaded(true);
      video.play().catch((err) => {
        console.error('Video autoplay failed:', err);
        // Video is already muted, so this should work
        setVideoError(true);
      });
    };

    const handleCanPlay = () => {
      startPlayback();
    };

    const handleLoadedData = () => {
      // Video has loaded enough data to start playing
      if (!isLoaded) {
        startPlayback();
      }
    };

    const handleTimeUpdate = () => {
      // Loop back to start when reaching the loop point
      if (video.currentTime >= loopEndTime) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };

    const handleError = (e: Event) => {
      const error = e.target as HTMLVideoElement;
      console.error('Video failed to load:', videoSrc);
      console.error('Video error details:', {
        error: error.error,
        networkState: error.networkState,
        readyState: error.readyState,
        src: error.src,
      });
      setVideoError(true);
    };

    const handleEnded = () => {
      // Restart video if it ends before loop point
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    // Check if video is already ready
    if (video.readyState >= 2 && !isLoaded) {
      // Video has loaded enough data
      startPlayback();
    }

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    // Start loading
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoSrc, loopEndTime]);

  return (
    <div className="video-hero relative w-full h-[95vh] min-h-[700px] max-h-[1000px] overflow-hidden bg-black">
      {/* Fallback animated gradient background (shows if video fails or while loading) */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          videoError || !isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `
            linear-gradient(135deg,
              #1a0a00 0%,
              #2d1810 25%,
              #4a2c1a 50%,
              #2d1810 75%,
              #1a0a00 100%
            )
          `,
          backgroundSize: '400% 400%',
          animation: 'heroGradient 15s ease infinite',
        }}
      >
        {/* Whisky glass pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L25 25 L20 55 L40 55 L35 25 L30 5' fill='none' stroke='%23f9bd13' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Video element */}
      {!videoError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-0 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          src={videoSrc}
          muted
          autoPlay
          playsInline
          preload="auto"
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      <div className="absolute inset-0 bg-[#1a0a00]/20 mix-blend-overlay" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {children}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
}
