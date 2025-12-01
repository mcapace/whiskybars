'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Bar } from '@/types';

interface MapProps {
  bars: Bar[];
  selectedBar: Bar | null;
  hoveredBar: Bar | null;
  onBarSelect: (bar: Bar | null) => void;
  onBarHover: (bar: Bar | null) => void;
  selectedState: string | null;
  userLocation: { lat: number; lng: number } | null;
  showHeatmap?: boolean;
  barCrawlBars?: Bar[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Custom map style with whisky-themed colors
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

export default function Map({
  bars,
  selectedBar,
  hoveredBar,
  onBarSelect,
  onBarHover,
  selectedState,
  userLocation,
  showHeatmap = false,
  barCrawlBars = [],
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<globalThis.Map<number, mapboxgl.Marker>>(new globalThis.Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Create custom marker element
  const createMarkerElement = useCallback((bar: Bar, index: number, isSelected: boolean, isHovered: boolean, isInCrawl: boolean) => {
    const el = document.createElement('div');
    el.className = 'map-marker-container';

    const marker = document.createElement('div');
    marker.className = `map-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isInCrawl ? 'in-crawl' : ''}`;

    // Inner content
    if (isInCrawl) {
      const crawlIndex = barCrawlBars.findIndex(b => b.id === bar.id) + 1;
      marker.innerHTML = `<span class="crawl-number">${crawlIndex}</span>`;
    } else {
      marker.innerHTML = `<span class="marker-dot"></span>`;
    }

    el.appendChild(marker);
    el.setAttribute('data-bar-id', bar.id.toString());

    return el;
  }, [barCrawlBars]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false,
    });

    // Add controls
    newMap.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
    newMap.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    }), 'top-right');
    newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    newMap.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left');
    newMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    newMap.on('load', () => {
      setMapLoaded(true);

      // Add heatmap source
      newMap.addSource('bars-heat', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Add heatmap layer
      newMap.addLayer({
        id: 'bars-heat',
        type: 'heatmap',
        source: 'bars-heat',
        maxzoom: 12,
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 12, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(254,229,217,0.5)',
            0.4, 'rgba(252,174,145,0.6)',
            0.6, 'rgba(251,106,74,0.7)',
            0.8, 'rgba(222,45,38,0.8)',
            1, 'rgba(165,15,21,0.9)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 12, 20],
          'heatmap-opacity': 0.6,
        },
        layout: {
          visibility: 'none',
        },
      });

      // Add bar crawl route source and layer
      newMap.addSource('bar-crawl-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      newMap.addLayer({
        id: 'bar-crawl-route',
        type: 'line',
        source: 'bar-crawl-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#c41230',
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });
    });

    map.current = newMap;

    return () => {
      newMap.remove();
      map.current = null;
    };
  }, []);

  // Update heatmap data
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const features = bars
      .filter(bar => bar.coordinates.lat && bar.coordinates.lng)
      .map(bar => ({
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Point' as const,
          coordinates: [bar.coordinates.lng, bar.coordinates.lat],
        },
      }));

    const source = map.current.getSource('bars-heat') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({ type: 'FeatureCollection', features });
    }

    // Toggle heatmap visibility
    map.current.setLayoutProperty('bars-heat', 'visibility', showHeatmap ? 'visible' : 'none');
  }, [bars, mapLoaded, showHeatmap]);

  // Update bar crawl route
  useEffect(() => {
    if (!map.current || !mapLoaded || barCrawlBars.length < 2) {
      if (map.current && mapLoaded) {
        const source = map.current.getSource('bar-crawl-route') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({ type: 'FeatureCollection', features: [] });
        }
      }
      return;
    }

    const coordinates = barCrawlBars
      .filter(bar => bar.coordinates.lat && bar.coordinates.lng)
      .map(bar => [bar.coordinates.lng, bar.coordinates.lat]);

    if (coordinates.length >= 2) {
      const source = map.current.getSource('bar-crawl-route') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          }],
        });
      }
    }
  }, [barCrawlBars, mapLoaded]);

  // Update markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Filter bars
    const filteredBars = selectedState
      ? bars.filter(bar => bar.state === selectedState)
      : bars;

    // Remove markers that are no longer in the list
    markersRef.current.forEach((marker, id) => {
      if (!filteredBars.find(bar => bar.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    filteredBars.forEach((bar, index) => {
      if (!bar.coordinates.lat || !bar.coordinates.lng) return;

      const isSelected = selectedBar?.id === bar.id;
      const isHovered = hoveredBar?.id === bar.id;
      const isInCrawl = barCrawlBars.some(b => b.id === bar.id);

      const existingMarker = markersRef.current.get(bar.id);

      if (existingMarker) {
        // Update existing marker
        const el = existingMarker.getElement();
        const markerDiv = el.querySelector('.map-marker');
        if (markerDiv) {
          markerDiv.className = `map-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isInCrawl ? 'in-crawl' : ''}`;
          if (isInCrawl) {
            const crawlIndex = barCrawlBars.findIndex(b => b.id === bar.id) + 1;
            markerDiv.innerHTML = `<span class="crawl-number">${crawlIndex}</span>`;
          } else {
            markerDiv.innerHTML = `<span class="marker-dot"></span>`;
          }
        }
      } else {
        // Create new marker
        const el = createMarkerElement(bar, index, isSelected, isHovered, isInCrawl);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onBarSelect(bar);
        });

        el.addEventListener('mouseenter', () => {
          onBarHover(bar);
        });

        el.addEventListener('mouseleave', () => {
          onBarHover(null);
        });

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          maxWidth: '350px',
          className: 'bar-popup',
        }).setHTML(`
          <div class="bar-popup-content">
            <h3 class="bar-popup-title">${bar.name}</h3>
            <p class="bar-popup-address">${bar.address}</p>
            <p class="bar-popup-description">${bar.description}</p>
            <div class="bar-popup-actions">
              ${bar.website ? `<a href="https://${bar.website}" target="_blank" rel="noopener" class="bar-popup-link">Website</a>` : ''}
              ${bar.whiskyList ? `<a href="${bar.whiskyList}" target="_blank" rel="noopener" class="bar-popup-link">Whisky Menu</a>` : ''}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([bar.coordinates.lng, bar.coordinates.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.set(bar.id, marker);
      }
    });

    // Fit bounds
    if (filteredBars.length > 0 && !selectedBar) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredBars.forEach(bar => {
        if (bar.coordinates.lat && bar.coordinates.lng) {
          bounds.extend([bar.coordinates.lng, bar.coordinates.lat]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 12,
        duration: 1000,
      });
    }
  }, [bars, selectedState, selectedBar, hoveredBar, barCrawlBars, mapLoaded, createMarkerElement, onBarSelect, onBarHover]);

  // Fly to selected bar
  useEffect(() => {
    if (!map.current || !selectedBar || !mapLoaded) return;

    map.current.flyTo({
      center: [selectedBar.coordinates.lng, selectedBar.coordinates.lat],
      zoom: 15,
      duration: 1500,
      essential: true,
    });

    // Open popup
    const marker = markersRef.current.get(selectedBar.id);
    if (marker) {
      marker.togglePopup();
    }
  }, [selectedBar, mapLoaded]);

  // Add user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = `
        <div class="user-marker-pulse"></div>
        <div class="user-marker-dot"></div>
      `;

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    }
  }, [userLocation, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map controls overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => {
            if (map.current) {
              map.current.flyTo({
                center: [-98.5795, 39.8283],
                zoom: 3.5,
                duration: 1500,
              });
            }
          }}
          className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Legend */}
      {barCrawlBars.length > 0 && (
        <div className="absolute bottom-12 left-4 bg-white shadow-lg rounded-lg p-3 z-10">
          <p className="text-xs font-semibold text-gray-700 mb-2">Bar Crawl Route</p>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-wa-red" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #c41230, #c41230 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-xs text-gray-600">{barCrawlBars.length} stops</span>
          </div>
        </div>
      )}
    </div>
  );
}
