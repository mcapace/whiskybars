'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
import { Bar } from '@/types';
import { coordinatesInState } from '@/utils/stateBounds';

interface MapProps {
  bars: Bar[];
  selectedBar: Bar | null;
  hoveredBar: Bar | null;
  onBarSelect: (bar: Bar | null) => void;
  onBarHover: (bar: Bar | null) => void;
  selectedState: string | null;
  userLocation: { lat: number; lng: number } | null;
  showHeatmap?: boolean;
  darkMode?: boolean;
  onMapClick?: (lng: number, lat: number) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Map styles - v11 works with globe, fog, terrain, and extrusions
const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

const TERRAIN_SOURCE_ID = 'mapbox-terrain-dem';

/** Globe + fog + terrain; falls back to plain Mercator if anything throws (WebGL / style / token limits). */
function applyGlobeAndAtmosphere(m: mapboxgl.Map, isDark: boolean) {
  try {
    m.setProjection({ name: 'globe' });

    if (!m.getSource(TERRAIN_SOURCE_ID)) {
      m.addSource(TERRAIN_SOURCE_ID, {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
    m.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.08 });

    if (isDark) {
      m.setFog({
        range: [4, 7.5],
        color: '#121420',
        'high-color': '#1e2236',
        'space-color': '#06060c',
        'horizon-blend': 0.06,
        'star-intensity': 0.18,
      });
    } else {
      m.setFog({
        range: [2.5, 6],
        color: '#b8cce8',
        'high-color': '#eef2fb',
        'space-color': '#dce6f5',
        'horizon-blend': 0.1,
        'star-intensity': 0,
      });
    }
  } catch (err) {
    console.warn('[Map] Globe/terrain/fog unavailable, using standard map.', err);
    try {
      m.setTerrain(null);
    } catch {
      /* ignore */
    }
    try {
      m.setProjection({ name: 'mercator' });
    } catch {
      /* ignore */
    }
  }
}

export default function Map({
  bars,
  selectedBar,
  hoveredBar,
  onBarSelect,
  onBarHover,
  selectedState,
  userLocation,
  showHeatmap = false,
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
  const createMarkerElement = useCallback((bar: Bar, isSelected: boolean, isHovered: boolean) => {
    const el = document.createElement('div');
    el.className = 'map-marker-container';
    el.style.background = 'transparent';
    el.style.border = 'none';
    el.style.padding = '0';
    el.style.margin = '0';

    const marker = document.createElement('div');
    marker.className = `map-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`;
    marker.setAttribute('data-map-marker-id', bar.id.toString());
    marker.style.background = 'transparent';
    marker.style.border = 'none';
    marker.style.padding = '0';
    marker.style.margin = '0';

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
      marker.innerHTML = `<span class="marker-dot"></span>`;
    };
    marker.appendChild(img);

    el.appendChild(marker);
    el.setAttribute('data-bar-id', bar.id.toString());
    el.setAttribute('data-map-marker-id', bar.id.toString());
    el.setAttribute('data-lat', bar.coordinates.lat.toString());
    el.setAttribute('data-lng', bar.coordinates.lng.toString());

    return el;
  }, []);

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

  // Initialize map (deferred 2 frames so parent layout isn’t display:none / 0×0 during first paint)
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    let cancelled = false;
    let raf0 = 0;
    let raf1 = 0;

    raf0 = requestAnimationFrame(() => {
      raf1 = requestAnimationFrame(() => {
        if (cancelled || !mapContainer.current || map.current) return;

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
          projection: { name: 'globe' },
        });

        // Disable pitch/tilt interaction
        newMap.dragRotate.disable();
        newMap.touchZoomRotate.disableRotation();

        newMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        newMap.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true,
          }),
          'top-right'
        );
        newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        const scaleControl = new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'imperial',
        });
        newMap.addControl(scaleControl, 'bottom-left');

        const handleUserInteraction = () => {
          hasUserInteractedRef.current = true;
        };

        newMap.on('load', () => {
          setMapLoaded(true);

          applyGlobeAndAtmosphere(newMap, darkMode);

          try {
            const layers = newMap.getStyle().layers;
            const labelLayerId = layers?.find(
              (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
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
                  'fill-extrusion-color': darkMode ? '#1b2540' : '#c5c0b8',
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': ['get', 'min_height'],
                  'fill-extrusion-opacity': darkMode ? 0.72 : 0.55,
                },
              },
              labelLayerId
            );
          } catch (e) {
            console.warn('[Map] 3D buildings layer skipped', e);
          }

          newMap.addSource('bars-heat', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

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
                0,
                'rgba(0,0,0,0)',
                0.2,
                'rgba(45,212,191,0.35)',
                0.45,
                'rgba(124,108,240,0.45)',
                0.65,
                'rgba(224,71,32,0.55)',
                0.85,
                'rgba(199,61,26,0.72)',
                1,
                'rgba(165,15,21,0.85)',
              ],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 12, 20],
              'heatmap-opacity': 0.62,
            },
            layout: {
              visibility: 'none',
            },
          });

          requestAnimationFrame(() => {
            newMap.resize();
          });
        });

        newMap.on('error', (e) => {
          console.error('[Map]', e);
        });

        newMap.on('zoom', () => {
          setCurrentZoom(newMap.getZoom());
        });

        newMap.on('dragstart', handleUserInteraction);
        newMap.on('zoomstart', handleUserInteraction);

        newMap.on('zoomend', () => {
          const zoom = newMap.getZoom();
          if (zoom >= 15) {
            newMap.easeTo({ pitch: 45, duration: 300 });
          } else if (zoom < 14) {
            newMap.easeTo({ pitch: 0, duration: 300 });
          }
        });

        map.current = newMap;
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf0);
      cancelAnimationFrame(raf1);
      setMapLoaded(false);
      const m = map.current;
      if (m) {
        m.remove();
        map.current = null;
      }
    };
  }, [darkMode]);

  // Map canvas is often 0×0 if the container was hidden (e.g. lg:block) — resize when layout changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !mapContainer.current) return;
    const m = map.current;
    const el = mapContainer.current;
    const ro = new ResizeObserver(() => {
      m.resize();
    });
    ro.observe(el);
    const onWin = () => m.resize();
    window.addEventListener('resize', onWin);
    requestAnimationFrame(() => m.resize());
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
    };
  }, [mapLoaded]);

  // Zoom level below which we only show clusters; at this zoom and above, individual bar markers appear (so zooming into cities shows pins, not disappearing counts)
  const MIN_ZOOM_FOR_BAR_MARKERS = 6;

  // Initialize supercluster - break clusters earlier (maxZoom 11) so bar markers appear when zooming into cities
  useEffect(() => {
    superclusterRef.current = new Supercluster({
      radius: 60,
      maxZoom: 11,
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
            zoom: Math.min(expansionZoom, 11),
            duration: 600,
          });
        });

        clusterMarkersRef.current.push(marker);
      } else {
        // It's an individual point — only show if bar's coords are in its state
        const barId = cluster.properties.barId;
        if (zoom >= MIN_ZOOM_FOR_BAR_MARKERS) {
          const bar = filteredBars.find((b) => b.id === barId);
          if (bar?.coordinates?.lat != null && bar?.coordinates?.lng != null &&
              coordinatesInState(bar.coordinates.lat, bar.coordinates.lng, bar.state)) {
            visibleBarIds.add(barId);
          }
        }
      }
    });

    // When zoomed in, show bar markers in the viewport only if coords match the bar's state (hide wrong-place markers e.g. Phoenix bar in Detroit)
    if (zoom >= MIN_ZOOM_FOR_BAR_MARKERS) {
      const west = bounds.getWest();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const north = bounds.getNorth();
      filteredBars.forEach((bar) => {
        if (!bar.coordinates.lat || !bar.coordinates.lng) return;
        const { lat, lng } = bar.coordinates;
        if (!coordinatesInState(lat, lng, bar.state)) return; // skip bars with wrong-state coords
        if (lng >= west && lng <= east && lat >= south && lat <= north) {
          visibleBarIds.add(bar.id);
        }
      });
    }

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

    // Group visible bars by position so we can offset stacked markers (same coords = wrong bar on click)
    const positionKey = (b: Bar) => `${Number(b.coordinates.lat).toFixed(5)}_${Number(b.coordinates.lng).toFixed(5)}`;
    const positionGroups = new globalThis.Map<string, Bar[]>();
    filteredBars.forEach((b) => {
      if (!b.coordinates.lat || !b.coordinates.lng || !visibleBarIds.has(b.id)) return;
      const key = positionKey(b);
      if (!positionGroups.has(key)) positionGroups.set(key, []);
      positionGroups.get(key)!.push(b);
    });

    // Add or update individual markers (only if bar's coordinates are in its state — don't draw e.g. Phoenix bar in Detroit)
    filteredBars.forEach((bar) => {
      if (!bar.coordinates.lat || !bar.coordinates.lng) return;
      if (!visibleBarIds.has(bar.id)) return;
      if (!coordinatesInState(bar.coordinates.lat, bar.coordinates.lng, bar.state)) return;

      const isSelected = selectedBar?.id === bar.id;
      const isHovered = hoveredBar?.id === bar.id;

      // Offset stacked markers so each is clickable and shows the correct bar
      const key = positionKey(bar);
      const group = positionGroups.get(key) ?? [];
      const stackIndex = group.findIndex((b: Bar) => b.id === bar.id);
      const stackSize = group.length;
      const offsetDeg = 0.00035; // ~35m so markers don't overlap
      const angle = stackSize <= 1 ? 0 : (stackIndex / stackSize) * 2 * Math.PI;
      const offsetLng = stackSize <= 1 ? 0 : offsetDeg * Math.cos(angle);
      const offsetLat = stackSize <= 1 ? 0 : offsetDeg * Math.sin(angle);
      const displayLng = bar.coordinates.lng + offsetLng;
      const displayLat = bar.coordinates.lat + offsetLat;

      const existingMarker = markersRef.current.get(bar.id);

      if (existingMarker) {
        // Update existing marker position (in case stack changed) and style
        existingMarker.setLngLat([displayLng, displayLat]);
        const el = existingMarker.getElement();
        el.setAttribute('data-map-marker-id', bar.id.toString());
        el.setAttribute('data-lat', bar.coordinates.lat.toString());
        el.setAttribute('data-lng', bar.coordinates.lng.toString());
        const markerDiv = el.querySelector('.map-marker');
        if (markerDiv) {
          markerDiv.setAttribute('data-map-marker-id', bar.id.toString());
          markerDiv.className = `map-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`;
          if (!markerDiv.querySelector('.glass-icon')) {
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
              markerDiv.innerHTML = `<span class="marker-dot"></span>`;
            };
            markerDiv.appendChild(img);
          }
        }
      } else {
        const el = createMarkerElement(bar, isSelected, isHovered);

        el.addEventListener('mouseenter', () => {
          const resolved = bars.find((b) => b.id === bar.id);
          if (resolved) onBarHover(resolved);
        });

        el.addEventListener('mouseleave', () => {
          onBarHover(null);
        });

        const popup = new mapboxgl.Popup({
          offset: [0, -45],
          closeButton: true,
          maxWidth: '450px',
          className: 'bar-popup',
        }).setHTML(`
          <div class="bar-popup-content">
            <h3 class="bar-popup-title">${bar.name}</h3>
            <p class="bar-popup-address">${bar.address}</p>
            <p class="bar-popup-description">${bar.description}</p>
            <div class="bar-popup-actions">
              ${bar.website ? `<a href="${bar.website.replace(/"/g, '&quot;')}" target="_blank" rel="noopener" class="bar-popup-link">Website</a>` : ''}
              ${bar.whiskyList ? `<a href="${bar.whiskyList}" target="_blank" rel="noopener" class="bar-popup-link">Whisky Menu</a>` : ''}
              <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(bar.address)}" target="_blank" rel="noopener" class="bar-popup-link bar-popup-directions">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                Directions
              </a>
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([displayLng, displayLat])
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
  }, [filteredBars, bars, mapLoaded, showHeatmap, createMarkerElement, createClusterMarker, getGeoJSONPoints]);

  // Update marker states (selected/hovered) without recreating markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    markersRef.current.forEach((marker, barId) => {
      const bar = filteredBars.find(b => b.id === barId);
      if (!bar) return;

      const isSelected = selectedBar?.id === bar.id;
      const isHovered = hoveredBar?.id === bar.id;

      const el = marker.getElement();
      const markerDiv = el.querySelector('.map-marker');
      if (markerDiv) {
        markerDiv.setAttribute('data-map-marker-id', bar.id.toString());
        markerDiv.className = `map-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`;
        if (!markerDiv.querySelector('.glass-icon')) {
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
  }, [selectedBar, hoveredBar, filteredBars, mapLoaded]);

  // Single map-container click: resolve bar from clicked marker element (data-map-marker-id) or nearest marker by position
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const container = map.current.getContainer();
    const handleMapClick = (e: MouseEvent) => {
      // Ignore clicks on cluster markers (they zoom)
      let node: Element | null = (e.target as Element);
      while (node && node !== document.body) {
        if (node.classList?.contains('cluster-marker')) return;
        const barIdAttr = node.getAttribute?.('data-map-marker-id');
        if (barIdAttr != null) {
          const barId = parseInt(barIdAttr, 10);
          if (!Number.isNaN(barId)) {
            const resolved = bars.find((b) => b.id === barId);
            if (resolved) onBarSelect(resolved);
            return;
          }
        }
        node = node.parentElement;
      }
      // Fallback: click was on map background — find nearest marker within range
      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const MARKER_VISUAL_CENTER_OFFSET_Y = 35;
      const MAX_CLICK_DISTANCE_PX = 50;
      let bestBarId: number | null = null;
      let bestPixelDist = MAX_CLICK_DISTANCE_PX;
      markersRef.current.forEach((marker, barId) => {
        const pos = marker.getLngLat();
        const point = map.current!.project([pos.lng, pos.lat]);
        const centerX = point.x;
        const centerY = point.y - MARKER_VISUAL_CENTER_OFFSET_Y;
        const d = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
        if (d < bestPixelDist) {
          bestPixelDist = d;
          bestBarId = barId;
        }
      });
      if (bestBarId != null) {
        const resolved = bars.find((b) => b.id === bestBarId);
        if (resolved) onBarSelect(resolved);
      }
    };
    container.addEventListener('click', handleMapClick);
    return () => container.removeEventListener('click', handleMapClick);
  }, [mapLoaded, bars, onBarSelect]);

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

    // If bar is already in view (e.g. user clicked its marker), don't fly — just open popup
    if (distance < 0.08 && currentZoom >= 10) {
      const marker = markersRef.current.get(selectedBar.id);
      if (marker) marker.togglePopup();
      return;
    }

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

  // Zoom to selected state with smooth animation; close any open popup so only markers show
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedState) return;

    // Close all popups when state filter changes so user sees only markers, not a wall of popups
    markersRef.current.forEach((marker) => {
      const popup = marker.getPopup();
      if (popup) popup.remove();
    });

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

  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-full min-h-[400px] flex items-center justify-center rounded-2xl border border-dashed border-[var(--apex-line)] bg-[var(--apex-elevated)] px-6 text-center">
        <div>
          <p className="font-semibold text-[var(--apex-ink)]">Map needs a Mapbox token</p>
          <p className="text-sm text-[var(--apex-muted)] mt-2 max-w-md">
            Add <code className="font-mono text-xs bg-[var(--apex-line)] px-1.5 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to{' '}
            <code className="font-mono text-xs">.env.local</code>, restart <code className="font-mono text-xs">npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[200px]">
      <div ref={mapContainer} className="w-full h-full min-h-[200px]" />

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
          className="bg-white/85 backdrop-blur-xl shadow-lg rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-white hover:text-wa-red transition-all border border-white/60 uppercase tracking-wider"
        >
          Reset View
        </button>
      </div>

      {/* Cluster legend - at low zoom only clusters show; zoom in to see bars at their locations */}
      {currentZoom < MIN_ZOOM_FOR_BAR_MARKERS && filteredBars.length > 5 && (
        <div className="absolute bottom-12 left-4 bg-[var(--apex-surface)]/92 backdrop-blur-xl shadow-lg rounded-xl p-3.5 z-10 border border-[var(--apex-line)] max-w-[200px]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-teal-600/90 mb-1">3D globe · terrain</p>
          <p className="text-xs font-medium text-[var(--apex-ink)] mb-0.5">Clusters by region</p>
          <p className="text-[11px] text-[var(--apex-muted)]">Zoom in for exact locations</p>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute top-4 right-16 bg-[var(--apex-surface)]/90 backdrop-blur-md shadow-sm rounded-lg px-2.5 py-1 text-[10px] font-mono font-medium text-[var(--apex-muted)] z-10 border border-[var(--apex-line)] tabular-nums">
        z {currentZoom.toFixed(1)}
      </div>
    </div>
  );
}
