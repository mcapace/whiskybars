'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoHeroProps {
  videoSrc?: string;
  loopEndTime?: number; // Time in seconds to loop back (default 67 = 1:07)
  children?: React.ReactNode;
}

export default function VideoHero({
  videoSrc = '/videos/odevideo.mp4',
  loopEndTime = 67, // Loop at 1:07
  children
}: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is muted
    video.muted = true;
    video.volume = 0;

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded');
    };

    const handleLoadedData = () => {
      console.log('Video data loaded, readyState:', video.readyState);
      setIsLoaded(true);
      // Try to play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playing successfully');
          })
          .catch((err) => {
            console.error('Video play error:', err);
            setHasError(true);
          });
      }
    };

    const handleCanPlay = () => {
      console.log('Video can play');
      if (!isLoaded) {
        setIsLoaded(true);
        video.play().catch((err) => {
          console.error('Video play error in canplay:', err);
          setHasError(true);
        });
      }
    };

    const handleTimeUpdate = () => {
      // Loop back to start when reaching the loop point (1:07)
      if (video.currentTime >= loopEndTime) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };

    const handleError = (e: Event) => {
      const errorElement = e.target as HTMLVideoElement;
      const mediaError = errorElement.error;
      
      console.error('=== VIDEO ERROR ===');
      console.error('Error code:', mediaError?.code);
      console.error('Error message:', mediaError?.message);
      console.error('Network state:', errorElement.networkState);
      console.error('Ready state:', errorElement.readyState);
      console.error('Video src:', errorElement.src);
      console.error('Video currentSrc:', errorElement.currentSrc);
      console.error('Expected src:', videoSrc);
      console.error('==================');
      
      setHasError(true);
      
      // Log specific error codes
      if (mediaError) {
        switch (mediaError.code) {
          case 1: // MEDIA_ERR_ABORTED
            console.error('MEDIA_ERR_ABORTED: Video loading aborted');
            break;
          case 2: // MEDIA_ERR_NETWORK
            console.error('MEDIA_ERR_NETWORK: Network error - file may not exist or be accessible');
            console.error('Try checking:', window.location.origin + videoSrc);
            break;
          case 3: // MEDIA_ERR_DECODE
            console.error('MEDIA_ERR_DECODE: Video decode error - file may be corrupted');
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            console.error('MEDIA_ERR_SRC_NOT_SUPPORTED: Video source not supported');
            break;
        }
      }
    };

    const handleLoadStart = () => {
      console.log('Video load started');
    };

    // Set up event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    // Set source and load
    if (video.src !== videoSrc) {
      video.src = videoSrc;
    }
    video.load();

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
    };
  }, [videoSrc, loopEndTime]);

  return (
    <div className="video-hero relative w-full h-[95vh] min-h-[700px] max-h-[1000px] overflow-hidden bg-black">
      {/* Video element - always render it */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-0 ${
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
        }`}
        src={videoSrc}
        muted
        autoPlay
        playsInline
        preload="auto"
        loop={false}
      />

      {/* Fallback background (shows while loading or on error) */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 transition-opacity duration-1000 ${
          isLoaded && !hasError ? 'opacity-0' : 'opacity-100'
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
        <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L25 25 L20 55 L40 55 L35 25 L30 5' fill='none' stroke='%23f9bd13' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }} 
        />
      </div>

      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 z-0" />
      <div className="absolute inset-0 bg-[#1a0a00]/20 mix-blend-overlay z-0" />

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
