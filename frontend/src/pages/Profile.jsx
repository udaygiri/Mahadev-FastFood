import React, { useState } from 'react';
import { User, Phone, MapPin, Save, LogOut, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Profile({ user, onUpdateUser, onLogout, onBackToMenu }) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) return;

    const updatedUser = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
    };

    onUpdateUser(updatedUser);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="p-1 rounded-xl text-gray-600 hover:text-dark-slate hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-xs font-extrabold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-primary" />
            <span>Home</span>
          </button>

          <h1 className="font-heading font-extrabold text-base text-dark-slate">
            My Profile
          </h1>

          <button
            onClick={onLogout}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Main Profile Card */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        
        {/* User Card Summary */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-brand-primary flex items-center justify-center font-extrabold text-xl border-2 border-brand-primary/20 shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-extrabold text-lg text-dark-slate truncate">{user?.name}</h2>
            <p className="text-xs text-muted-gray">{user?.phone}</p>
            <p className="text-xs text-muted-gray truncate mt-0.5">{user?.address}</p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-sm text-dark-slate uppercase tracking-wider">Edit Delivery Profile</h3>
            <p className="text-xs text-muted-gray mt-0.5">Update your contact details and delivery address</p>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-50 text-brand-accent p-3 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-dark-slate mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-primary" /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-dark-slate focus:bg-white focus:border-brand-primary outline-none transition-all"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark-slate mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-primary" /> Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-dark-slate focus:bg-white focus:border-brand-primary outline-none transition-all"
                placeholder="Enter 10-digit phone number"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark-slate mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Delivery Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-dark-slate focus:bg-white focus:border-brand-primary outline-none transition-all resize-none"
                placeholder="Enter house/flat no., street, area, city"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-primary hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
