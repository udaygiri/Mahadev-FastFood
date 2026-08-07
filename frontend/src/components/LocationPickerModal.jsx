import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Navigation, X, Check } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default Leaflet marker icon issue in Vite React
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const customIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Default fallback center coordinates: Mahadev Fast Food
const DEFAULT_CENTER = { lat: 20.92044479, lng: 70.3604289 };

// Helper component to auto-pan/recenter Leaflet view smoothly
function MapRecenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position.lat && position.lng) {
      map.setView([position.lat, position.lng], 16, { animate: true });
    }
  }, [position, map]);
  return null;
}

// Component to capture map clicks and update marker position
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPickerModal({ isOpen, onClose, initialLocation, onSaveLocation }) {
  const [position, setPosition] = useState(initialLocation?.lat ? initialLocation : DEFAULT_CENTER);
  const [address, setAddress] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reverse geocoding: Convert lat/lng to street address via OpenStreetMap
  const fetchAddressFromCoords = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (position.lat && position.lng) {
      fetchAddressFromCoords(position.lat, position.lng);
    }
  }, [position.lat, position.lng]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);
        setIsDetecting(false);
      },
      (err) => {
        alert("Failed to detect location. Please select manually on the map.");
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirmSave = (e) => {
    e.preventDefault();
    if (!address.trim()) {
      alert("Please select or enter a valid delivery address.");
      return;
    }
    onSaveLocation({
      lat: position.lat,
      lng: position.lng,
      address: address.trim()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-primary" />
            <h2 className="text-base font-extrabold text-dark-slate">Select Delivery Location on Map</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-dark-slate rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative h-64 sm:h-72 w-full bg-gray-100">
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[position.lat, position.lng]} icon={customIcon} />
            <MapRecenter position={position} />
            <MapClickHandler onLocationSelect={setPosition} />
          </MapContainer>

          {/* Floating "Use My Current Location" Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isDetecting}
            className="absolute bottom-3 right-3 z-[1000] bg-white text-dark-slate hover:bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Navigation className={`w-3.5 h-3.5 text-brand-accent ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Locating...' : 'Use My Current Location'}</span>
          </button>
        </div>

        {/* Selected Address Form */}
        <form onSubmit={handleConfirmSave} className="p-4 space-y-3 bg-white text-xs border-t border-gray-100">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Delivery Address * {isGeocoding && <span className="text-brand-primary animate-pulse font-normal">(Fetching address...)</span>}
            </label>
            <textarea
              rows="2"
              required
              placeholder="House/Flat No, Street, Landmark..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-primary hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
