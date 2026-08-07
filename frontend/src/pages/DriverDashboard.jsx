import React, { useState, useEffect, useRef } from 'react';
import { Truck, CheckCircle2, CookingPot, Phone, MapPin, Navigation, User, LogOut, RefreshCw, AlertCircle, X, Play } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../services/api';
import { supabase } from '../services/supabaseClient';
import DriverNavigationMap from '../components/DriverNavigationMap';

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

  // Navigation & GPS Tracking state
  const [navigatingOrder, setNavigatingOrder] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
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
        () => {
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
      if (navigatingOrder?.orderId === orderId) {
        handleStopDriving();
      }
      await loadOrders();
    } catch (err) {
      alert('Failed to mark order as delivered.');
    } finally {
      setUpdatingId(null);
    }
  };

  // 🗺️ Navigation Handlers
  const handleOpenNavigationMap = (order) => {
    setNavigatingOrder(order);
    setIsNavigating(false);
  };

  const handleStartDriving = () => {
    if (!navigatingOrder) return;
    setIsNavigating(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    // Set up Supabase Realtime broadcast channel
    const channel = supabase.channel(`order-tracking-${navigatingOrder.orderId}`);
    channelRef.current = channel;

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverPos(coords);

        // Broadcast GPS location to customer's OrderSuccess screen
        channel.send({
          type: 'broadcast',
          event: 'driver-location',
          payload: { orderId: navigatingOrder.orderId, ...coords },
        });
      },
      (err) => console.error('GPS Watch error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = watchId;
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
    setNavigatingOrder(null);
    setDriverPos(null);
    setIsNavigating(false);
  };

  // Filter orders: Ready for pickup vs Picked up by driver
  const availableOrders = orders.filter((o) => o.status === 'Preparing' || o.status === 'Placed');
  const myActiveDeliveries = orders.filter(
    (o) =>
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
                        {/* 🛵 START DRIVING & ROUTE MAP BUTTON */}
                        <button
                          onClick={() => handleOpenNavigationMap(order)}
                          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Navigation className="w-4 h-4 fill-white" />
                          <span>Start Driving (Live In-App Route Map)</span>
                        </button>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer?.address || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-dark-slate rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-blue-600" />
                          <span>Open in External Google Maps</span>
                        </a>

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

      {/* 🗺️ IN-APP LIVE NAVIGATION MODAL */}
      {navigatingOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col backdrop-blur-xs">
          {/* Modal Top Navigation Bar */}
          <div className="bg-dark-slate text-white px-4 py-3.5 flex items-center justify-between shadow-md border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center font-bold">
                🛵
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Live Delivery Route</span>
                  <span className="font-mono text-purple-400">#{navigatingOrder.orderId}</span>
                </h3>
                <p className="text-xs text-gray-300 font-medium">
                  Deliver to: <span className="font-bold text-white">{navigatingOrder.customer?.name}</span> ({navigatingOrder.customer?.address})
                </p>
              </div>
            </div>

            <button
              onClick={handleStopDriving}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Action Banner */}
          <div className="bg-purple-900/90 text-white px-4 py-2.5 flex items-center justify-between border-b border-purple-800 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isNavigating ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="font-bold">
                {isNavigating
                  ? 'Navigation Active - Broadcasting GPS coordinates live'
                  : 'Route plotted from Shop to Customer address'}
              </span>
            </div>

            {!isNavigating ? (
              <button
                onClick={handleStartDriving}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Live GPS Navigation</span>
              </button>
            ) : (
              <button
                onClick={() => setIsNavigating(false)}
                className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white font-bold text-[11px] rounded-lg"
              >
                Pause GPS
              </button>
            )}
          </div>

          {/* Leaflet Map Area */}
          <div className="flex-1 relative z-0">
            {(() => {
              const effectiveLat = navigatingOrder.customer?.lat || navigatingOrder.lat;
              const effectiveLng = navigatingOrder.customer?.lng || navigatingOrder.lng;

              if (!effectiveLat || !effectiveLng) {
                return (
                  <div className="h-full bg-red-950/90 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-14 h-14 bg-red-800 text-red-100 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg border border-red-700">
                      ⚠️
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h4 className="text-lg font-extrabold text-red-200">Customer Location Coordinates Missing</h4>
                      <p className="text-xs text-red-300 font-medium leading-relaxed">
                        This customer did not provide map pin coordinates (`lat` / `lng`). Cannot plot live turn-by-turn road route without exact GPS coordinates.
                      </p>
                    </div>
                    <div className="bg-red-900/60 p-3 rounded-xl border border-red-800 text-xs font-mono text-red-200 w-full max-w-md text-left space-y-1">
                      <p><span className="text-red-400 font-bold">Address Text:</span> {navigatingOrder.customer?.address || 'N/A'}</p>
                      <p><span className="text-red-400 font-bold">Customer Name:</span> {navigatingOrder.customer?.name || 'N/A'}</p>
                      <p><span className="text-red-400 font-bold">Phone:</span> {navigatingOrder.customer?.phone || 'N/A'}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navigatingOrder.customer?.address || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Search Address in External Google Maps</span>
                    </a>
                  </div>
                );
              }

              return (
                <DriverNavigationMap
                  customerLat={effectiveLat}
                  customerLng={effectiveLng}
                  driverPos={driverPos}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
