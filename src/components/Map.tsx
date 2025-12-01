'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
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
  darkMode?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Map styles
const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

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
  darkMode = false,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<globalThis.Map<number, mapboxgl.Marker>>(new globalThis.Map());
  const clusterMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const superclusterRef = useRef<Supercluster | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(3.5);

  // Filter bars by state
  const filteredBars = selectedState
    ? bars.filter(bar => bar.state === selectedState)
    : bars;

  // Create GeoJSON points for clustering
  const getGeoJSONPoints = useCallback(() => {
    return filteredBars
      .filter(bar => bar.coordinates.lat && bar.coordinates.lng)
      .map(bar => ({
        type: 'Feature' as const,
        properties: { barId: bar.id },
        geometry: {
          type: 'Point' as const,
          coordinates: [bar.coordinates.lng, bar.coordinates.lat],
        },
      }));
  }, [filteredBars]);

  // Create custom marker element with Glencairn glass icon
  const createMarkerElement = useCallback((bar: Bar, isSelected: boolean, isHovered: boolean, isInCrawl: boolean) => {
    const el = document.createElement('div');
    el.className = 'map-marker-container';
    el.style.background = 'transparent';
    el.style.border = 'none';
    el.style.padding = '0';
    el.style.margin = '0';

    const marker = document.createElement('div');
    marker.className = `map-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isInCrawl ? 'in-crawl' : ''}`;
    marker.style.background = 'transparent';
    marker.style.border = 'none';
    marker.style.padding = '0';
    marker.style.margin = '0';

    if (isInCrawl) {
      const crawlIndex = barCrawlBars.findIndex(b => b.id === bar.id) + 1;
      marker.innerHTML = `<span class="crawl-number">${crawlIndex}</span>`;
    } else {
      // Glencairn glass icon
      const img = document.createElement('img');
      img.src = '/map-logos/glass.png';
      img.alt = '';
      img.className = 'glass-icon';
      img.style.background = 'transparent';
      img.style.border = 'none';
      img.style.padding = '0';
      img.style.margin = '0';
      img.style.display = 'block';
      img.onerror = () => {
        console.error('Failed to load glass icon:', img.src);
        // Fallback to marker dot if image fails to load
        marker.innerHTML = `<span class="marker-dot"></span>`;
      };
      marker.appendChild(img);
    }

    el.appendChild(marker);
    el.setAttribute('data-bar-id', bar.id.toString());

    return el;
  }, [barCrawlBars]);

  // Create cluster marker element
  const createClusterMarker = useCallback((count: number, coordinates: [number, number]) => {
    const el = document.createElement('div');
    el.className = 'cluster-marker';

    // Size based on count
    const size = count < 10 ? 40 : count < 50 ? 50 : count < 100 ? 60 : 70;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    el.innerHTML = `
      <div class="cluster-inner">
        <span class="cluster-count">${count}</span>
        <span class="cluster-label">bars</span>
      </div>
    `;

    return el;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: darkMode ? MAP_STYLES.dark : MAP_STYLES.light,
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 18,
      pitch: 0,
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

      // Add 3D buildings layer
      const layers = newMap.getStyle().layers;
      const labelLayerId = layers?.find(
        layer => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      newMap.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': darkMode ? '#1a1a2e' : '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6,
          },
        },
        labelLayerId
      );

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
          'line-width': 4,
          'line-dasharray': [2, 2],
        },
      });
    });

    // Track zoom level for clustering decisions
    newMap.on('zoom', () => {
      setCurrentZoom(newMap.getZoom());
    });

    // Enable pitch on high zoom for 3D effect
    newMap.on('zoomend', () => {
      const zoom = newMap.getZoom();
      if (zoom >= 15) {
        newMap.easeTo({ pitch: 45, duration: 500 });
      } else if (zoom < 14) {
        newMap.easeTo({ pitch: 0, duration: 500 });
      }
    });

    map.current = newMap;

    return () => {
      newMap.remove();
      map.current = null;
    };
  }, [darkMode]);

  // Update map style when dark mode changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    map.current.setStyle(darkMode ? MAP_STYLES.dark : MAP_STYLES.light);
  }, [darkMode, mapLoaded]);

  // Initialize supercluster
  useEffect(() => {
    superclusterRef.current = new Supercluster({
      radius: 60,
      maxZoom: 14,
    });
  }, []);

  // Update heatmap data
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const features = filteredBars
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

    map.current.setLayoutProperty('bars-heat', 'visibility', showHeatmap ? 'visible' : 'none');
  }, [filteredBars, mapLoaded, showHeatmap]);

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

  // Update markers with clustering
  useEffect(() => {
    if (!map.current || !mapLoaded || !superclusterRef.current) return;

    // Clear existing cluster markers
    clusterMarkersRef.current.forEach(marker => marker.remove());
    clusterMarkersRef.current = [];

    // Load points into supercluster
    const points = getGeoJSONPoints();
    superclusterRef.current.load(points);

    // Get clusters for current viewport
    const bounds = map.current.getBounds();
    const zoom = Math.floor(map.current.getZoom());

    if (!bounds) return;

    const clusters = superclusterRef.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    // Track which bar IDs are visible (not in clusters)
    const visibleBarIds = new Set<number>();

    // Process clusters and individual points
    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;

      if (cluster.properties.cluster) {
        // It's a cluster
        const count = cluster.properties.point_count;
        const el = createClusterMarker(count, [lng, lat]);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        // Click to zoom into cluster
        el.addEventListener('click', () => {
          const expansionZoom = superclusterRef.current!.getClusterExpansionZoom(cluster.id as number);
          map.current!.flyTo({
            center: [lng, lat],
            zoom: Math.min(expansionZoom, 14),
            duration: 1000,
          });
        });

        clusterMarkersRef.current.push(marker);
      } else {
        // It's an individual point
        const barId = cluster.properties.barId;
        visibleBarIds.add(barId);
      }
    });

    // Remove markers that are now in clusters
    markersRef.current.forEach((marker, id) => {
      if (!visibleBarIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update individual markers
    filteredBars.forEach((bar) => {
      if (!bar.coordinates.lat || !bar.coordinates.lng) return;
      if (!visibleBarIds.has(bar.id)) return;

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
            // Clear and add glass icon
            markerDiv.innerHTML = '';
            const img = document.createElement('img');
            img.src = '/map-logos/glass.png';
            img.alt = '';
            img.className = 'glass-icon';
            img.style.background = 'transparent';
            img.style.border = 'none';
            img.style.padding = '0';
            img.style.margin = '0';
            img.style.display = 'block';
            img.onerror = () => {
              console.error('Failed to load glass icon:', img.src);
              // Fallback to marker dot if image fails to load
              markerDiv.innerHTML = `<span class="marker-dot"></span>`;
            };
            markerDiv.appendChild(img);
          }
        }
      } else {
        // Create new marker
        const el = createMarkerElement(bar, isSelected, isHovered, isInCrawl);

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
              <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(bar.address)}" target="_blank" rel="noopener" class="bar-popup-link bar-popup-directions">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                Directions
              </a>
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([bar.coordinates.lng, bar.coordinates.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.set(bar.id, marker);
      }
    });

    // Fit bounds if not zoomed in on a selected bar
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
  }, [filteredBars, selectedBar, hoveredBar, barCrawlBars, mapLoaded, currentZoom, createMarkerElement, createClusterMarker, getGeoJSONPoints, onBarSelect, onBarHover]);

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
                pitch: 0,
                duration: 1500,
              });
            }
          }}
          className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Cluster legend */}
      {currentZoom < 10 && filteredBars.length > 20 && (
        <div className="absolute bottom-12 left-4 bg-white shadow-lg rounded-lg p-3 z-10">
          <p className="text-xs font-semibold text-gray-700 mb-2">Clusters</p>
          <p className="text-xs text-gray-500">Click to zoom in</p>
        </div>
      )}

      {/* Bar crawl legend */}
      {barCrawlBars.length > 0 && (
        <div className="absolute bottom-12 left-4 bg-white shadow-lg rounded-lg p-3 z-10">
          <p className="text-xs font-semibold text-gray-700 mb-2">Bar Crawl Route</p>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-wa-red" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #c41230, #c41230 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-xs text-gray-600">{barCrawlBars.length} stops</span>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute top-4 right-16 bg-white/90 backdrop-blur-sm shadow rounded px-2 py-1 text-xs text-gray-600 z-10">
        {currentZoom.toFixed(1)}x
      </div>
    </div>
  );
}
