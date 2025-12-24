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
  onMapClick?: (lng: number, lat: number) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Map styles - using streets for more color
const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/streets-v12',
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
  onMapClick,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<globalThis.Map<number, mapboxgl.Marker>>(new globalThis.Map());
  const clusterMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const superclusterRef = useRef<Supercluster | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(3.5);
  const hasUserInteractedRef = useRef(false);
  const hasProcessedInitialSelectionRef = useRef(false);

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
      img.src = '/map-logos/Glencairn-Edit.png';
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
      renderWorldCopies: true,
      antialias: true,
      preserveDrawingBuffer: false,
    });

    // Disable pitch/tilt interaction
    newMap.dragRotate.disable();
    newMap.touchZoomRotate.disableRotation();

    // Add controls (without compass to avoid tilt controls)
    newMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    newMap.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    }), 'top-right');
    newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    // Add scale control with imperial units (miles)
    const scaleControl = new mapboxgl.ScaleControl({ 
      maxWidth: 100,
      unit: 'imperial' // This will show miles instead of kilometers
    });
    newMap.addControl(scaleControl, 'bottom-left');
    // Attribution control removed - Mapbox branding hidden via CSS

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

    // Track user interaction to know when they've moved away from default view
    const handleUserInteraction = () => {
      hasUserInteractedRef.current = true;
    };
    newMap.on('dragstart', handleUserInteraction);
    newMap.on('zoomstart', handleUserInteraction);

    // Enable pitch on high zoom for 3D effect
    newMap.on('zoomend', () => {
      const zoom = newMap.getZoom();
      if (zoom >= 15) {
        newMap.easeTo({ pitch: 45, duration: 300 });
      } else if (zoom < 14) {
        newMap.easeTo({ pitch: 0, duration: 300 });
      }
    });

    map.current = newMap;

    return () => {
      newMap.off('dragstart', handleUserInteraction);
      newMap.off('zoomstart', handleUserInteraction);
      newMap.remove();
      map.current = null;
    };
  }, [darkMode]);

  // Update map style when dark mode changes - need to re-add layers after style change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const addLayers = () => {
      // Add 3D buildings layer
      const layers = map.current!.getStyle().layers;
      const labelLayerId = layers?.find(
        layer => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      if (!map.current!.getLayer('3d-buildings')) {
        map.current!.addLayer(
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
      }

      // Add heatmap source and layer
      if (!map.current!.getSource('bars-heat')) {
        map.current!.addSource('bars-heat', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.current!.addLayer({
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
            visibility: showHeatmap ? 'visible' : 'none',
          },
        });
      }

      // Add bar crawl route source and layer
      if (!map.current!.getSource('bar-crawl-route')) {
        map.current!.addSource('bar-crawl-route', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.current!.addLayer({
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
      }
    };

    map.current.setStyle(darkMode ? MAP_STYLES.dark : MAP_STYLES.light);

    // Re-add layers once the new style loads
    map.current.once('style.load', addLayers);
  }, [darkMode, mapLoaded, showHeatmap]);

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

  // Update markers with clustering - only on viewport changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !superclusterRef.current) return;

    const updateMarkers = () => {
      if (!superclusterRef.current || !map.current) return;
      
      const supercluster = superclusterRef.current;
      
      // Clear existing cluster markers
      clusterMarkersRef.current.forEach(marker => marker.remove());
      clusterMarkersRef.current = [];

      // Load points into supercluster
      const points = getGeoJSONPoints();
      supercluster.load(points);

      // Get clusters for current viewport
      const bounds = map.current.getBounds();
      const zoom = Math.floor(map.current.getZoom());

      if (!bounds) return;

      const clusters = supercluster.getClusters(
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
          if (!superclusterRef.current || !map.current) return;
          const expansionZoom = superclusterRef.current.getClusterExpansionZoom(cluster.id as number);
          map.current.flyTo({
            center: [lng, lat],
            zoom: Math.min(expansionZoom, 14),
            duration: 600,
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

    // Hide markers when heatmap is shown
    if (showHeatmap) {
      markersRef.current.forEach((marker) => {
        marker.getElement().style.display = 'none';
      });
      clusterMarkersRef.current.forEach((marker) => {
        marker.getElement().style.display = 'none';
      });
      return;
    } else {
      // Show markers when heatmap is off
      markersRef.current.forEach((marker) => {
        marker.getElement().style.display = 'block';
      });
      clusterMarkersRef.current.forEach((marker) => {
        marker.getElement().style.display = 'block';
      });
    }

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
            img.src = '/map-logos/Glencairn-Edit.png';
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

    // Don't auto-fit bounds - let user control the map
    };

    // Initial update
    updateMarkers();

    // Update markers on map move/zoom
    const handleMoveEnd = () => updateMarkers();
    map.current.on('moveend', handleMoveEnd);
    map.current.on('zoomend', handleMoveEnd);

    return () => {
      if (map.current) {
        map.current.off('moveend', handleMoveEnd);
        map.current.off('zoomend', handleMoveEnd);
      }
    };
  }, [filteredBars, mapLoaded, showHeatmap, createMarkerElement, createClusterMarker, getGeoJSONPoints]);

  // Update marker states (selected/hovered) without recreating markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    markersRef.current.forEach((marker, barId) => {
      const bar = filteredBars.find(b => b.id === barId);
      if (!bar) return;

      const isSelected = selectedBar?.id === bar.id;
      const isHovered = hoveredBar?.id === bar.id;
      const isInCrawl = barCrawlBars.some(b => b.id === bar.id);

      const el = marker.getElement();
      const markerDiv = el.querySelector('.map-marker');
      if (markerDiv) {
        markerDiv.className = `map-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isInCrawl ? 'in-crawl' : ''}`;
        if (isInCrawl) {
          const crawlIndex = barCrawlBars.findIndex(b => b.id === bar.id) + 1;
          markerDiv.innerHTML = `<span class="crawl-number">${crawlIndex}</span>`;
        } else if (!markerDiv.querySelector('.glass-icon')) {
          // Only add glass icon if it doesn't exist
          markerDiv.innerHTML = '';
          const img = document.createElement('img');
          img.src = '/map-logos/Glencairn-Edit.png';
          img.alt = '';
          img.className = 'glass-icon';
          img.style.background = 'transparent';
          img.style.border = 'none';
          img.style.padding = '0';
          img.style.margin = '0';
          img.style.display = 'block';
          markerDiv.appendChild(img);
        }
      }
    });
  }, [selectedBar, hoveredBar, barCrawlBars, filteredBars, mapLoaded]);

  // Fly to selected bar with smooth animation
  useEffect(() => {
    if (!map.current || !selectedBar || !mapLoaded) return;

    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();

    // Skip auto-fly on the very first selection after map load
    // This allows the map to default to showing the entire US instead of flying to #1
    if (!hasProcessedInitialSelectionRef.current) {
      hasProcessedInitialSelectionRef.current = true;
      // Only skip if map is still at default US view (not if user has already interacted)
      const isAtDefaultView = 
        Math.abs(currentCenter.lng - (-98.5795)) < 0.1 &&
        Math.abs(currentCenter.lat - 39.8283) < 0.1 &&
        Math.abs(currentZoom - 3.5) < 0.1 &&
        !hasUserInteractedRef.current;

      if (isAtDefaultView) {
        // Keep default US view, don't fly to the bar
        return;
      }
    }

    const targetLng = selectedBar.coordinates.lng;
    const targetLat = selectedBar.coordinates.lat;

    // Calculate distance to determine animation style
    const distance = Math.sqrt(
      Math.pow(currentCenter.lng - targetLng, 2) +
      Math.pow(currentCenter.lat - targetLat, 2)
    );

    // Dynamic duration based on distance (longer for farther destinations)
    const baseDuration = 1200;
    const maxDuration = 2500;
    const duration = Math.min(baseDuration + distance * 100, maxDuration);

    // Dynamic zoom based on current zoom and distance
    const targetZoom = 15;

    // For long distances, zoom out first then zoom in (creates dramatic fly effect)
    if (distance > 5 && currentZoom > 8) {
      // Two-stage animation: zoom out, then fly to destination
      map.current.flyTo({
        center: [targetLng, targetLat],
        zoom: targetZoom,
        duration: duration,
        essential: true,
        curve: 1.42, // Smooth curve (default is 1.42, higher = more dramatic)
        speed: 1.2, // Animation speed multiplier
        easing: (t) => {
          // Custom easing: ease-out-cubic for smooth deceleration
          return 1 - Math.pow(1 - t, 3);
        },
        padding: { top: 100, bottom: 100, left: 50, right: 50 },
      });
    } else {
      // Short distance: simple smooth fly
      map.current.flyTo({
        center: [targetLng, targetLat],
        zoom: targetZoom,
        duration: Math.max(800, duration * 0.6),
        essential: true,
        easing: (t) => {
          // Ease-in-out for smooth acceleration and deceleration
          return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },
        padding: { top: 80, bottom: 80, left: 40, right: 40 },
      });
    }

    // Open popup after animation completes
    setTimeout(() => {
      const marker = markersRef.current.get(selectedBar.id);
      if (marker) {
        marker.togglePopup();
      }
    }, duration * 0.8);
  }, [selectedBar, mapLoaded]);

  // Zoom to selected state with smooth animation
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedState) return;

    const stateBars = bars.filter(bar => bar.state === selectedState);
    if (stateBars.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    stateBars.forEach(bar => {
      if (bar.coordinates.lat && bar.coordinates.lng) {
        bounds.extend([bar.coordinates.lng, bar.coordinates.lat]);
      }
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 120, bottom: 120, left: 120, right: 120 },
        maxZoom: 11,
        duration: 1500,
        easing: (t) => {
          // Smooth ease-out-quart for elegant state zoom
          return 1 - Math.pow(1 - t, 4);
        },
      });
    }
  }, [selectedState, bars, mapLoaded]);

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
                duration: 800,
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
