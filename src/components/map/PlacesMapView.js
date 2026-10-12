/**
 * PlacesMapView.js — Leaflet map rendered in an iframe for web.
 * Shows colored pins for each place; tapping a pin shows a popup card.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const KIGALI_LAT = -1.9441;
const KIGALI_LNG = 30.0619;

function buildLeafletHTML(places, accentColor) {
  const markers = places
    .filter((p) => p.lat && p.lng)
    .map((p) => {
      const photo = p.photos?.[0]?.url || '';
      const name = (p.name || '').replace(/'/g, "\\'");
      const rating = p.rating ? parseFloat(p.rating).toFixed(1) : '';
      const location = (p.location || '').replace(/'/g, "\\'");
      const id = p.id || '';
      return `
        L.marker([${p.lat}, ${p.lng}], { icon: pinIcon })
          .addTo(map)
          .bindPopup(\`
            <div style="width:200px;font-family:sans-serif;">
              ${photo ? `<img src="${photo}" style="width:100%;height:110px;object-fit:cover;border-radius:6px 6px 0 0;display:block;" />` : ''}
              <div style="padding:10px 10px 8px;">
                <div style="font-weight:700;font-size:13px;color:#0a2540;margin-bottom:2px;">${name}</div>
                ${rating ? `<div style="font-size:11px;color:#888;margin-bottom:4px;">⭐ ${rating} · ${location}</div>` : `<div style="font-size:11px;color:#888;margin-bottom:4px;">${location}</div>`}
                <button onclick="window.parent.postMessage({type:'place_tap',id:'${id}'},'*')"
                  style="width:100%;background:${accentColor};color:#fff;border:none;border-radius:5px;padding:7px 0;font-size:12px;font-weight:700;cursor:pointer;margin-top:2px;">
                  View Details →
                </button>
              </div>
            </div>
          \`, { maxWidth: 220 });
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { height:100%; width:100%; }
    .leaflet-popup-content-wrapper { border-radius: 8px; padding: 0; overflow: hidden; }
    .leaflet-popup-content { margin: 0; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${KIGALI_LAT}, ${KIGALI_LNG}], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18,
  }).addTo(map);

  var pinIcon = L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;background:${accentColor};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });

  ${markers}
</script>
</body>
</html>`;
}

export default function PlacesMapView({ places, accentColor = '#1A7A4A', onPlacePress, style }) {
  const html = useMemo(() => buildLeafletHTML(places, accentColor), [places, accentColor]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.fallback, style]}>
      </View>
    );
  }

  const handleMessage = (e) => {
    try {
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (data?.type === 'place_tap' && data.id) onPlacePress?.(data.id);
    } catch {}
  };

  // Listen for postMessage from the iframe
  if (typeof window !== 'undefined') {
    window.onmessage = handleMessage;
  }

  return (
    <View style={[styles.container, style]}>
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none' }}
        sandbox="allow-scripts allow-same-origin"
        title="Map"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  fallback: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});
