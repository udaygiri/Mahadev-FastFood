import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Kitchen Shop Location (Mahadev Fast Food)
const SHOP_LOCATION = { lat: 20.92044479, lng: 70.3604289 };

// Custom Leaflet DivIcons
const bikeIcon = L.divIcon({
  className: 'custom-bike-marker',
  html: `<div style="background-color:#9333ea; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:20px;">🛵</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const shopIcon = L.divIcon({
  className: 'custom-shop-marker',
  html: `<div style="background-color:#e11d48; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:20px;">🍔</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const homeIcon = L.divIcon({
  className: 'custom-home-marker',
  html: `<div style="background-color:#16a34a; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:20px;">🏡</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// Helper component to recenter map smoothly on driver location
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo([position.lat, position.lng], { animate: true });
    }
  }, [position, map]);
  return null;
}

export default function DriverNavigationMap({ customerLat, customerLng, driverPos }) {
  const [routePolyline, setRoutePolyline] = useState([]);

  // Determine starting point for OSRM route fetch:
  // If driver navigation is active and driver has moving GPS, use driverPos as start; otherwise use Shop Location.
  const startLat = driverPos ? driverPos.lat : SHOP_LOCATION.lat;
  const startLng = driverPos ? driverPos.lng : SHOP_LOCATION.lng;

  // Fetch road route dynamically from OSRM
  useEffect(() => {
    if (!customerLat || !customerLng) return;

    const fetchRoadRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${customerLng},${customerLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          // OSRM returns coordinates in [lng, lat], convert to Leaflet's [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRoutePolyline(coords);
        }
      } catch (err) {
        console.error('Failed to fetch OSRM route:', err);
        // Fallback straight line
        setRoutePolyline([
          [startLat, startLng],
          [customerLat, customerLng],
        ]);
      }
    };

    fetchRoadRoute();
  }, [startLat, startLng, customerLat, customerLng]);

  const mapCenter = driverPos
    ? [driverPos.lat, driverPos.lng]
    : [(SHOP_LOCATION.lat + customerLat) / 2, (SHOP_LOCATION.lng + customerLng) / 2];

  return (
    <MapContainer
      center={mapCenter}
      zoom={15}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Recenter helper */}
      {driverPos && <RecenterMap position={driverPos} />}

      {/* Shop Marker */}
      <Marker position={[SHOP_LOCATION.lat, SHOP_LOCATION.lng]} icon={shopIcon}>
        <Popup>🍔 Mahadev Fast Food Kitchen</Popup>
      </Marker>

      {/* Customer House Marker */}
      {customerLat && customerLng && (
        <Marker position={[customerLat, customerLng]} icon={homeIcon}>
          <Popup>🏡 Customer Delivery Address</Popup>
        </Marker>
      )}

      {/* Driver Moving Bike Marker */}
      {driverPos && (
        <Marker position={[driverPos.lat, driverPos.lng]} icon={bikeIcon}>
          <Popup>🛵 Driver Live Location</Popup>
        </Marker>
      )}

      {/* Road Route Path Polyline */}
      {routePolyline.length > 0 && (
        <Polyline positions={routePolyline} color="#7e22ce" weight={3} opacity={0.9} />
      )}
    </MapContainer>
  );
}
