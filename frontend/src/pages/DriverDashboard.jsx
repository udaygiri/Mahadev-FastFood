import React, { useState, useEffect, useRef } from 'react';
import { Truck, CheckCircle2, CookingPot, Phone, MapPin, Navigation, LogOut, AlertCircle, Play, Square } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { playOrderNotificationSound } from '../utils/audioNotification';

export default function DriverDashboard() {
  const [driverInfo, setDriverInfo] = useState(() => {
    const saved = localStorage.getItem('mahadev_driver_info');
    return saved ? JSON.parse(saved) : { name: '', phone: '' };
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!driverInfo.name && !!driverInfo.phone);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'my_deliveries'

  // Active tracking state
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);
  const watchIdRef = useRef(null);
  const channelRef = useRef(null);

  // Input states for Login
  const [inputName, setInputName] = useState(driverInfo.name || '');
  const [inputPhone, setInputPhone] = useState(driverInfo.phone || '');

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load driver orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    loadOrders();

    // ⚡ Supabase Realtime Subscription for instantaneous order updates
    const subscription = supabase
      .channel('driver-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.new?.status === 'Preparing') {
            playOrderNotificationSound();
          }
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isLoggedIn]);

  const handleDriverLogin = (e) => {
    e.preventDefault();
    if (!inputName.trim() || !inputPhone.trim()) {
      alert('Please enter your name and phone number');
      return;
    }
    const info = { name: inputName.trim(), phone: inputPhone.trim() };
    localStorage.setItem('mahadev_driver_info', JSON.stringify(info));
    setDriverInfo(info);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('mahadev_driver_info');
    setDriverInfo({ name: '', phone: '' });
    setIsLoggedIn(false);
  };

  // Self-Pickup Action: Driver picks up order from Kitchen
  const handlePickupOrder = async (orderId) => {
    setUpdatingId(orderId);
    try {
      // Updates status to 'Out for Delivery' and binds driver details
      await updateOrderStatus(orderId, 'Out for Delivery', {
        driver_name: driverInfo.name,
        driver_phone: driverInfo.phone
      });
      await loadOrders();
      // Auto-switch tab to My Active Deliveries so driver sees the picked up order immediately!
      setActiveTab('my_deliveries');
    } catch (err) {
      alert('Failed to pick up order.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Mark Delivery Completed Action
  const handleCompleteDelivery = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, 'Delivered');
      if (activeTrackingOrderId === orderId) {
        handleStopDriving();
      }
      await loadOrders();
    } catch (err) {
      alert('Failed to mark order as delivered.');
    } finally {
      setUpdatingId(null);
    }
  };

  // 🛵 Start Google Maps + Live Location Streaming
  const handleStartDriving = (order) => {
    if (!order) return;
    
    // Stop any existing tracking session first
    if (activeTrackingOrderId) {
      handleStopDriving();
    }

    setActiveTrackingOrderId(order.orderId);

    const effectiveLat = order.customer?.lat || order.lat;
    const effectiveLng = order.customer?.lng || order.lng;

    // 1. Subscribe to Supabase Broadcast channel
    const channel = supabase.channel(`order-tracking-${order.orderId}`);
    channelRef.current = channel;

    // 2. Start GPS Watcher
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Broadcast live location to Customer & Admin
          channel.send({
            type: 'broadcast',
            event: 'driver-location',
            payload: { orderId: order.orderId, ...coords },
          });
        },
        (err) => console.error('GPS Watch error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
      watchIdRef.current = watchId;
    }

    // 3. Launch native Google Maps app turn-by-turn driving mode
    if (effectiveLat && effectiveLng) {
      const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${effectiveLat},${effectiveLng}&travelmode=driving`;
      window.open(gmapsUrl, '_system') || (window.location.href = gmapsUrl);
    } else {
      // Fallback: search by address text if lat/lng is missing
      const addressUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer?.address || '')}`;
      window.open(addressUrl, '_system') || (window.location.href = addressUrl);
    }
  };

  const handleStopDriving = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setActiveTrackingOrderId(null);
  };

  // Filter orders: Ready for pickup vs Picked up by driver (Excludes Cancelled orders)
  const availableOrders = orders.filter(
    (o) => o.status !== 'Cancelled' && (o.status === 'Preparing' || o.status === 'Placed')
  );
  const myActiveDeliveries = orders.filter(
    (o) =>
      o.status !== 'Cancelled' &&
      o.status === 'Out for Delivery' &&
      (!o.driver_phone || o.driver_phone === driverInfo.phone || o.driver_name === driverInfo.name)
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans text-dark-slate">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg border border-gray-200 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-dark-slate">Delivery Driver Portal</h1>
            <p className="text-xs text-gray-500">Mahadev Fast Food - Driver Self-Pickup App</p>
          </div>

          <form onSubmit={handleDriverLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Driver Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Start Delivery Shift</span>
              <Truck className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-dark-slate pb-20">
      {/* Header */}
      <header className="bg-dark-slate text-white border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-base leading-none text-white">
                Driver Portal
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                Driver: {driverInfo.name} ({driverInfo.phone})
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'available'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <CookingPot className="w-4 h-4" />
            <span>Ready for Pickup ({availableOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my_deliveries')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'my_deliveries'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>My Active Deliveries ({myActiveDeliveries.length})</span>
          </button>
        </div>

        {/* TAB 1: READY FOR PICKUP ORDERS */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {availableOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-2">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-dark-slate">No orders ready for pickup</h3>
                <p className="text-xs text-gray-400">New orders from the kitchen will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableOrders.map((order) => {
                  const isUpdating = updatingId === order.orderId;

                  return (
                    <div
                      key={order.orderId}
                      className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="font-mono font-extrabold text-sm text-dark-slate">#{order.orderId}</span>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {order.status}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <p className="font-bold text-dark-slate flex items-center justify-between">
                            <span>{order.customer?.name}</span>
                            <a href={`tel:${order.customer?.phone}`} className="text-purple-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {order.customer?.phone}
                            </a>
                          </p>
                          <p className="text-gray-500 text-[11px] flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span>{order.customer?.address}</span>
                          </p>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Order Items</p>
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-gray-700 font-medium">
                              <span>{item.name} × {item.quantity}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={isUpdating}
                        onClick={() => handlePickupOrder(order.orderId)}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Truck className="w-4 h-4" />
                        <span>{isUpdating ? 'Picking up...' : 'Pick Up Order for Delivery'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ACTIVE DELIVERIES */}
        {activeTab === 'my_deliveries' && (
          <div className="space-y-4">
            {myActiveDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto" />
                <h3 className="text-base font-bold text-dark-slate">No active deliveries</h3>
                <p className="text-xs text-gray-400">Go to "Ready for Pickup" tab to pick up new food orders.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myActiveDeliveries.map((order) => {
                  const isUpdating = updatingId === order.orderId;

                  return (
                    <div
                      key={order.orderId}
                      className="bg-white rounded-2xl border-2 border-purple-400 p-4 shadow-md space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="font-mono font-extrabold text-sm text-dark-slate">#{order.orderId}</span>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            🛵 Out for Delivery
                          </span>
                        </div>

                        <div className="text-xs space-y-1 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                          <p className="font-bold text-dark-slate flex items-center justify-between">
                            <span>{order.customer?.name}</span>
                            <a href={`tel:${order.customer?.phone}`} className="text-purple-700 font-extrabold flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-purple-200">
                              <Phone className="w-3.5 h-3.5" /> Call Customer
                            </a>
                          </p>
                          <p className="text-gray-700 font-medium text-xs flex items-start gap-1 pt-1">
                            <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                            <span>{order.customer?.address}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        {/* 🗺️ GOOGLE MAPS & LIVE TRACKING BUTTON */}
                        {activeTrackingOrderId === order.orderId ? (
                          <button
                            onClick={handleStopDriving}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer animate-pulse"
                          >
                            <Square className="w-4 h-4 fill-white" />
                            <span>Stop GPS Tracking (Active Now)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartDriving(order)}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                          >
                            <Navigation className="w-4 h-4 fill-white" />
                            <span>Start Google Maps Navigation & Live GPS</span>
                          </button>
                        )}

                        <button
                          disabled={isUpdating}
                          onClick={() => handleCompleteDelivery(order.orderId)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isUpdating ? 'Updating...' : 'Mark as Delivered (Complete)'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

