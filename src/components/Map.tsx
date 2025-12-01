'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Bar } from '@/types';

interface MapProps {
  bars: Bar[];
  selectedBar: Bar | null;
  onBarSelect: (bar: Bar | null) => void;
  selectedState: string | null;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Map({ bars, selectedBar, onBarSelect, selectedState }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const createMarkerElement = useCallback((bar: Bar, index: number, isActive: boolean) => {
    const el = document.createElement('div');
    el.className = `marker ${isActive ? 'active' : ''}`;
    el.innerHTML = `${index + 1}`;
    el.setAttribute('data-bar-id', bar.id.toString());
    return el;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 3.5,
      maxBounds: [[-180, -90], [180, 90]],
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers when bars change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter bars by state if selected
    const filteredBars = selectedState
      ? bars.filter(bar => bar.state === selectedState)
      : bars;

    // Add new markers
    filteredBars.forEach((bar, index) => {
      if (!bar.coordinates.lat || !bar.coordinates.lng) return;

      const isActive = selectedBar?.id === bar.id;
      const el = createMarkerElement(bar, index, isActive);

      el.addEventListener('click', () => {
        onBarSelect(bar);
      });

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        maxWidth: '320px',
      }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold text-lg mb-1">${bar.name}</h3>
          <p class="text-gray-600 text-sm mb-2">${bar.address}</p>
          <p class="text-gray-700 text-sm mb-3">${bar.description}</p>
          <div class="flex gap-2">
            ${bar.website ? `<a href="https://${bar.website}" target="_blank" rel="noopener" class="text-whisky-red text-sm font-semibold hover:underline">Visit Website</a>` : ''}
            ${bar.whiskyList ? `<a href="${bar.whiskyList}" target="_blank" rel="noopener" class="text-whisky-red text-sm font-semibold hover:underline">Whisky Menu</a>` : ''}
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([bar.coordinates.lng, bar.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (filteredBars.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredBars.forEach(bar => {
        if (bar.coordinates.lat && bar.coordinates.lng) {
          bounds.extend([bar.coordinates.lng, bar.coordinates.lat]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12,
        duration: 1000,
      });
    }
  }, [bars, selectedState, selectedBar, onBarSelect, createMarkerElement]);

  // Fly to selected bar
  useEffect(() => {
    if (!map.current || !selectedBar) return;

    map.current.flyTo({
      center: [selectedBar.coordinates.lng, selectedBar.coordinates.lat],
      zoom: 14,
      duration: 1500,
      essential: true,
    });

    // Update marker styles
    markers.current.forEach(marker => {
      const el = marker.getElement();
      const barId = el.getAttribute('data-bar-id');
      if (barId === selectedBar.id.toString()) {
        el.classList.add('active');
        marker.togglePopup();
      } else {
        el.classList.remove('active');
      }
    });
  }, [selectedBar]);

  return (
    <div ref={mapContainer} className="w-full h-full min-h-[400px] rounded-lg overflow-hidden" />
  );
}
