import React, { useState } from 'react';
import { MapPin, Phone, User, Utensils, ArrowRight, Leaf, Map } from 'lucide-react';
import LocationPickerModal from '../components/LocationPickerModal';

export default function Login({ onLoginSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleSaveLocationFromMap = ({ lat, lng, address: fetchedAddress }) => {
    setGpsLocation({ lat, lng });
    setAddress(fetchedAddress);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const phoneRegex = /^\d{10}$/;

    if (!name.trim()) return setError('Please enter your full name.');
    if (!phone.trim()) return setError('Please enter your mobile phone number.');
    if (!phoneRegex.test(phone.trim())) return setError('Please enter a valid 10-digit mobile number.');
    if (!address.trim()) return setError('Please select your delivery address from the map or enter manually.');

    setError('');

    const userDetails = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      lat: gpsLocation?.lat || 20.92044479,
      lng: gpsLocation?.lng || 70.3604289,
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

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-dark-slate flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Delivery Address
              </label>
              <button 
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="text-[11px] font-extrabold text-brand-primary hover:underline flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-100 cursor-pointer"
              >
                <Map className="w-3 h-3 text-brand-primary" /> Select on Map
              </button>
            </div>
            <textarea 
              rows="2"
              required
              placeholder="Select on map or enter House/Flat No, Building, Street..." 
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
            className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-red-700 active:scale-98 transition-all flex items-center justify-center gap-2"
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

