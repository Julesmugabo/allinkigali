/**
 * PropertyMap.web.js — Leaflet map for the web build (auto-selected by Metro
 * over PropertyMap.js on web). Loads Leaflet 1.9.4 from cdnjs at runtime so
 * no npm install is needed.
 *
 * Props:
 *   listings    – array of listing objects that each have { id, lat, lng,
 *                 price, title, listingType? }
 *   onSelect    – (id) => void, called when a marker is tapped
 *   style       – RN style object applied to the container View
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';

const RWANDA_CENTER = [-1.94, 29.87];
const DEFAULT_ZOOM  = 8;
// Tight bounding box — prevents panning outside Rwanda
const RWANDA_BOUNDS = [[-2.84, 28.86], [-1.05, 30.90]];

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const LEAFLET_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';

function priceBubble(price, isRent) {
  const m = price >= 1_000_000;
  const k = price >= 1_000;
  const label = m
    ? `${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`
    : k
    ? `${Math.round(price / 1_000)}K`
    : String(price);
  return label + (isRent ? '/mo' : '');
}

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }

    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // JS
    if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      // already loading — poll
      const poll = setInterval(() => {
        if (window.L) { clearInterval(poll); resolve(window.L); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload  = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function PropertyMap({ listings = [], onSelect, style }) {
  const divRef     = useRef(null);
  const mapRef     = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);

  // Boot Leaflet once
  useEffect(() => {
    loadLeaflet().then(() => setReady(true)).catch(console.error);
  }, []);

  // Keep onSelect in a ref so marker click handlers always see the latest version
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Build / rebuild markers whenever listings or readiness changes
  useEffect(() => {
    if (!ready || !divRef.current) return;

    const L = window.L;

    // Initialise map once
    if (!mapRef.current) {
      mapRef.current = L.map(divRef.current, {
        center: RWANDA_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 7,
        maxZoom: 16,
        maxBounds: RWANDA_BOUNDS,
        maxBoundsViscosity: 1.0,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 18 }
      ).addTo(mapRef.current);

      L.control.attribution({ prefix: '© OSM' }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    listings.forEach((item) => {
      if (item.lat == null || item.lng == null) return;

      const isRent = item.listingType === 'rent';
      const label  = priceBubble(item.price, isRent);

      const icon = L.divIcon({
        html: `<div class="price-bubble" data-id="${item.id}"
          style="
            background:${isRent ? '#0d5c8a' : '#1a5c2a'};
            color:#ffffff;
            padding:4px 9px;
            border-radius:10px;
            font-size:11px;
            font-weight:800;
            white-space:nowrap;
            box-shadow:0 2px 6px rgba(0,0,0,0.55);
            border:1.5px solid rgba(133,183,235,0.7);
            cursor:pointer;
            user-select:none;
            line-height:1.5;
            transition:transform .1s;
          "
          onmouseover="this.style.transform='scale(1.12)'"
          onmouseout="this.style.transform='scale(1)'"
        >${label}</div>`,
        className: '',
        iconSize: null,
        iconAnchor: [0, 0],
      });

      // Single click → navigate directly to the listing detail
      const marker = L.marker([item.lat, item.lng], { icon })
        .addTo(map)
        .on('click', () => {
          onSelectRef.current?.(item.id);
        });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [ready, listings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Leaflet container — needs an actual DOM div, not a View */}
      <div
        ref={divRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#0a2340',
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 320,
    position: 'relative',
    overflow: 'hidden',
  },
});
