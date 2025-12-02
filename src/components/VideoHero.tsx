'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoHeroProps {
  videos: string[];
  interval?: number; // Time per video in ms (default 15000 = 15 seconds)
  children?: React.ReactNode;
  fallbackImage?: string;
}

export default function VideoHero({
  videos = ['/videos/hero/hero-1.mp4', '/videos/hero/hero-2.mp4', '/videos/hero/hero-3.mp4'],
  interval = 15000,
  children,
  fallbackImage = '/images/hero-fallback.jpg'
}: VideoHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isSingleVideo = videos.length === 1;
  const loopTime = 67; // 1:07 in seconds

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
  }, [videos]);

  // Handle single video loop at 1:07
  useEffect(() => {
    if (!isSingleVideo) return;

    const video = videoRefs.current[0];
    if (!video) {
      // Wait for video to be ready
      const checkVideo = setInterval(() => {
        const v = videoRefs.current[0];
        if (v) {
          clearInterval(checkVideo);
          v.play().catch(() => {});
        }
      }, 100);
      return () => clearInterval(checkVideo);
    }

    const handleTimeUpdate = () => {
      if (video.currentTime >= loopTime) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isSingleVideo, videos]);

  // Handle multiple videos rotation
  useEffect(() => {
    if (isSingleVideo) return;

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
  }, [videos.length, interval, isSingleVideo]);

  return (
    <div className="video-hero relative w-full h-[95vh] min-h-[700px] max-h-[1000px] overflow-hidden bg-black">
      {/* Fallback animated gradient background (shows if video fails) */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          videoError ? 'opacity-100' : 'opacity-0'
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

      {/* Video layers */}
      {!videoError && videos.map((src, index) => (
        <video
          key={src}
          ref={(el) => { 
            if (el) {
              videoRefs.current[index] = el;
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-0 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          src={src}
          muted
          autoPlay
          playsInline
          loop={false} // Custom loop handled by JS for single video
          preload="auto"
          onError={() => {
            console.error('Video failed to load:', src);
            setVideoError(true);
          }}
        />
      ))}

      {/* Overlay gradient with stronger filter */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      <div className="absolute inset-0 bg-[#e04720]/20 mix-blend-overlay" />
      <div className="absolute inset-0 bg-black/30" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>

      {/* Video indicator dots - only show for multiple videos */}
      {!isSingleVideo && (
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
      )}
    </div>
  );
}
