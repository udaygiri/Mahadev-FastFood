import React, { useState } from 'react';
import { MapPin, Phone, User, Utensils, ArrowRight, Leaf, Map, Navigation, CheckCircle2, Loader2 } from 'lucide-react';
import LocationPickerModal from '../components/LocationPickerModal';

export default function Login({ onLoginSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isLocationCaptured, setIsLocationCaptured] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please use "Select on Map".');
      return;
    }

    setIsDetectingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = { lat, lng };

        setGpsLocation(coords);
        setIsLocationCaptured(true);

        // Reverse geocode to get human-readable street address
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.error("Location error:", err);
        setIsDetectingLocation(false);
        setError('Unable to detect location automatically. Please enable location permissions or click "Select on Map".');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveLocationFromMap = ({ lat, lng, address: fetchedAddress }) => {
    setGpsLocation({ lat, lng });
    setAddress(fetchedAddress);
    setIsLocationCaptured(true);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const phoneRegex = /^\d{10}$/;

    if (!name.trim()) return setError('Please enter your full name.');
    if (!phone.trim()) return setError('Please enter your mobile phone number.');
    if (!phoneRegex.test(phone.trim())) return setError('Please enter a valid 10-digit mobile number.');
    
    // STRICT GPS LOCATION REQUIREMENT
    if (!gpsLocation || !isLocationCaptured) {
      return setError('Location Required: Please click "Use My Current Location" or "Select on Map" to capture your exact coordinates.');
    }

    if (!address.trim()) return setError('Please enter or verify your delivery address.');

    setError('');

    const userDetails = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
    };

    localStorage.setItem('mahadev_customer_details', JSON.stringify(userDetails));
    onLoginSuccess(userDetails);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-dark-slate">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg border border-gray-100 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-red-50 text-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Utensils className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">
            Mahadev Fast Food
          </h1>
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-brand-accent text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            <Leaf className="w-3 h-3 fill-brand-accent text-brand-accent" /> 100% PURE VEG
          </span>
          <p className="text-xs sm:text-sm text-muted-gray pt-1">
            Enter your details to start ordering fresh pizzas, burgers & snacks!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-dark-slate flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-primary" /> Full Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Rahul Sharma" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:border-brand-primary focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-dark-slate flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-primary" /> Mobile Phone Number
            </label>
            <div className="flex gap-2">
              <span className="bg-gray-100 border border-gray-200 px-3 py-3 rounded-xl text-sm font-bold text-gray-500 flex items-center">
                +91
              </span>
              <input 
                type="tel" 
                maxLength="10"
                placeholder="9876543210" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:border-brand-primary focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-dark-slate flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Delivery Address *
              </label>
              
              {isLocationCaptured ? (
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Location Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                  Required
                </span>
              )}
            </div>

            {/* Quick Action Location Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isDetectingLocation}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  isLocationCaptured 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                    : 'bg-red-50 border-red-200 text-brand-primary hover:bg-red-100 animate-pulse'
                }`}
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                    <span>{isLocationCaptured ? 'Update My Location' : 'Use Current Location'}</span>
                  </>
                )}
              </button>

              <button 
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="py-2 px-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-dark-slate flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Map className="w-3.5 h-3.5 text-brand-primary" />
                <span>Select on Map</span>
              </button>
            </div>

            <textarea 
              rows="2"
              required
              placeholder="Click 'Use Current Location' or 'Select on Map' above..." 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:border-brand-primary focus:bg-white outline-none transition-all resize-none"
            />
          </div>

          {error && (
            <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-red-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Menu & Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* Map Location Picker Modal */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLocation={gpsLocation}
        onSaveLocation={handleSaveLocationFromMap}
      />
    </div>
  );
}


