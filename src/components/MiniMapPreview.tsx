'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MiniMapPreviewProps {
  lat: number;
  lng: number;
  name: string;
  className?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MiniMapPreview({ lat, lng, name, className = '' }: MiniMapPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!MAPBOX_TOKEN || !lat || !lng) return null;

  // Mapbox Static Images API - creates a static map image centered on the bar location
  // Using streets-v12 style with a custom marker
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+c41230(${lng},${lat})/${lng},${lat},14,0/200x150@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`;

  if (imageError) {
    return (
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-2">
          <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs text-gray-500">Map preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg shadow-inner ${className}`}>
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      )}

      {/* Map image */}
      <Image
        src={mapUrl}
        alt={`Map location of ${name}`}
        fill
        className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        unoptimized // Mapbox URLs don't work with Next.js image optimization
      />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

      {/* Location label */}
      <div className="absolute bottom-1 left-1 right-1">
        <div className="bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5">
          <p className="text-[10px] font-medium text-gray-700 truncate">{name}</p>
        </div>
      </div>
    </div>
  );
}
