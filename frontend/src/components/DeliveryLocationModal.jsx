import React, { useState } from 'react';
import { MapPin, Phone, User, Utensils, ArrowRight } from 'lucide-react';

export default function DeliveryLocationModal({ onSaveDetails }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [error, setError] = useState('');

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLocation({ lat: latitude, lng: longitude });
        setAddress(prev => prev || `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setIsDetectingLocation(false);
      },
      (err) => {
        setIsDetectingLocation(false);
        setError('Could not detect location. Please type your address manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    onSaveDetails({
      name,
      phone,
      address,
      lat: gpsLocation?.lat || 0,
      lng: gpsLocation?.lng || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-6">
        
        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-red-50 text-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Utensils className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-dark-slate">Welcome to Mahadev Fast Food</h2>
          <p className="text-xs sm:text-sm text-muted-gray">
            Please enter your delivery details to browse food items & order fast!
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Customer Name */}
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

          {/* Phone Number */}
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

          {/* Delivery Address & GPS */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-dark-slate flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Delivery Address
              </label>
              <button 
                type="button"
                onClick={handleDetectGPS}
                className="text-[11px] font-bold text-brand-accent hover:underline flex items-center gap-1"
              >
                {isDetectingLocation ? '📍 Detecting...' : '📍 Auto-detect GPS'}
              </button>
            </div>
            <textarea 
              rows="2"
              placeholder="House/Flat No, Building, Street, Area Name..." 
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

          {/* Submit Button */}
          <button 
            type="submit"
            className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-red-700 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Start Ordering Food</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
