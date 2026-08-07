import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Sparkles, ArrowRight, PhoneCall, Phone, ArrowLeft, Truck, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../services/supabaseClient';

// Custom Leaflet Markers
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const homeIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const bikeIcon = L.divIcon({
  className: 'custom-bike-marker',
  html: `<div style="background-color:#9333ea; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 4px 6px rgba(0,0,0,0.3); font-size:18px;">🛵</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Exact Shop Coordinates (Mahadev Fast Food)
const KITCHEN_LOCATION = { lat: 20.92044479, lng: 70.3604289 };

export default function OrderSuccess({ orderDetails, onUpdateOrderStatus, onBackToMenu, onGoToMenu }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Placed, 2: Preparing, 3: Out for Delivery, 4: Delivered
  const [progressPercent, setProgressPercent] = useState(25);
  const [liveOrder, setLiveOrder] = useState(orderDetails);
  const [driverLocation, setDriverLocation] = useState(null);

  const updateOrderStatusInStorage = (updatedOrder) => {
    if (!updatedOrder?.orderId) return;
    try {
      const savedOrders = localStorage.getItem('mahadev_orders_list');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        const updatedList = parsedOrders.map((o) =>
          o.orderId === updatedOrder.orderId ? { ...o, ...updatedOrder } : o
        );
        localStorage.setItem('mahadev_orders_list', JSON.stringify(updatedList));
      }
      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(updatedOrder.orderId, updatedOrder.status);
      }
    } catch (err) {
      console.error('Error updating order status in storage:', err);
    }
  };

  // ⚡ Supabase Realtime WebSocket listener for status & driver updates on active order
  useEffect(() => {
    if (!orderDetails?.orderId) return;

    const channel = supabase
      .channel(`order-tracker-${orderDetails.orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_id=eq.${orderDetails.orderId}`
        },
        (payload) => {
          if (payload.new) {
            console.log('⚡ Live Order Payload Changed:', payload.new);
            const updated = {
              ...liveOrder,
              status: payload.new.status,
              driver_name: payload.new.driver_name,
              driver_phone: payload.new.driver_phone
            };
            setLiveOrder(updated);
            updateOrderStatusInStorage(updated);
          }
        }
      )
      .subscribe();

    // 🛵 Subscribe to Live Broadcast channel for Driver Location
    const trackingChannel = supabase
      .channel(`order-tracking-${orderDetails.orderId}`)
      .on('broadcast', { event: 'driver-location' }, (payload) => {
        if (payload.payload?.lat && payload.payload?.lng) {
          console.log('⚡ Driver Live GPS Ping Received:', payload.payload);
          setDriverLocation({
            lat: payload.payload.lat,
            lng: payload.payload.lng,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(trackingChannel);
    };
  }, [orderDetails?.orderId]);

  useEffect(() => {
    // Determine step based on live order status
    const statusToUse = liveOrder?.status || orderDetails?.status;
    let initialStep = 1;
    let initialPercent = 25;

    if (statusToUse === 'Preparing') {
      initialStep = 2;
      initialPercent = 50;
    } else if (statusToUse === 'Out for Delivery') {
      initialStep = 3;
      initialPercent = 75;
    } else if (statusToUse === 'Delivered') {
      initialStep = 4;
      initialPercent = 100;
    }

    setCurrentStep(initialStep);
    setProgressPercent(initialPercent);
  }, [liveOrder, orderDetails]);

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-dark-slate">No active order found</h2>
        <button
          onClick={onGoToMenu || onBackToMenu}
          className="mt-4 bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
      </div>
    );
  }

  const activeOrder = liveOrder || orderDetails;

  // Customer Coordinates (Strict read - NO fake defaults)
  const savedCustomer = JSON.parse(localStorage.getItem('mahadev_customer_details') || '{}');
  const customerLat = activeOrder.customer?.lat || savedCustomer.lat;
  const customerLng = activeOrder.customer?.lng || savedCustomer.lng;
  const hasValidCustomerLocation = Boolean(customerLat && customerLng);

  // OSRM Road Route state for customer view
  const [routePolyline, setRoutePolyline] = useState([]);

  // Fetch actual OSRM road route
  useEffect(() => {
    if (!customerLat || !customerLng) return;

    const startLat = driverLocation ? driverLocation.lat : KITCHEN_LOCATION.lat;
    const startLng = driverLocation ? driverLocation.lng : KITCHEN_LOCATION.lng;

    const fetchRoadRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${customerLng},${customerLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRoutePolyline(coords);
        }
      } catch (err) {
        console.error('Failed to fetch customer route:', err);
        setRoutePolyline([
          [startLat, startLng],
          [customerLat, customerLng],
        ]);
      }
    };

    fetchRoadRoute();
  }, [customerLat, customerLng, driverLocation]);

  const trackingSteps = [
    { step: 1, title: 'Order Placed', desc: 'Received by kitchen', time: 'Just now' },
    { step: 2, title: 'Preparing Food', desc: 'Fresh & hot in kitchen', time: 'In progress' },
    { step: 3, title: 'Out for Delivery', desc: activeOrder.driver_name ? `Picked up by ${activeOrder.driver_name}` : 'Driver on the way', time: 'Approx 15 mins' },
    { step: 4, title: 'Delivered', desc: 'Enjoy your food!', time: 'Completed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-dark-slate flex flex-col justify-between pb-28">
      
      {/* Top Header Bar */}
      <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between z-40 border-b border-emerald-500">
        <button
          onClick={onGoToMenu || onBackToMenu}
          className="p-1 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-xs font-extrabold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span>Home</span>
        </button>

        <span className="text-xs font-bold text-emerald-100 font-mono">
          #{activeOrder.orderId}
        </span>
      </div>

      {/* Hero Header */}
      <header className="bg-gradient-to-b from-emerald-500 to-emerald-600 text-white p-6 pt-6 text-center space-y-3 relative shadow-md">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-xs animate-bounce shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight leading-tight">
          Order Status
        </h1>
        <p className="text-xs text-emerald-100 font-medium">Thank you for ordering from Mahadev Fast Food</p>
        
        <div className="inline-flex items-center gap-1.5 bg-black/20 text-white text-xs font-mono px-3 py-1 rounded-full backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>ORDER #{activeOrder.orderId}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto w-full px-4 pt-5 space-y-4 flex-1">
        
        {/* Estimated Arrival Card with Progress Bar */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-brand-accent rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-gray uppercase tracking-wider">ESTIMATED DELIVERY</p>
                <p className="font-heading font-extrabold text-lg sm:text-xl text-dark-slate">
                  {currentStep === 4 ? 'Arrived!' : currentStep === 3 ? '10 - 15 Mins' : '20 - 25 Mins'}
                </p>
              </div>
            </div>
            
            <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full border transition-all ${
              currentStep === 4 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-emerald-50 text-brand-accent border-emerald-200 animate-pulse'
            }`}>
              {currentStep === 4 ? '✓ Delivered' : 'Live Tracking'}
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="pt-1">
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-gray-200/60">
              <div
                className="bg-brand-accent h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* ASSIGNED DRIVER CONTACT CARD (When Driver Picks Up Order) */}
        {activeOrder.driver_name && (
          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Assigned Delivery Driver</p>
                <p className="font-heading font-extrabold text-sm text-dark-slate">{activeOrder.driver_name}</p>
                <p className="text-[11px] text-gray-500 font-medium">On the way with your food</p>
              </div>
            </div>

            {activeOrder.driver_phone && (
              <a
                href={`tel:${activeOrder.driver_phone}`}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver</span>
              </a>
            )}
          </div>
        )}

        {/* EMBEDDED LIVE DELIVERY TRACKING MAP */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs space-y-2">
          <div className="px-4 pt-3 flex items-center justify-between">
            <span className="font-bold text-xs text-dark-slate flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-primary" /> Live Delivery Route Map
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Kitchen ➔ Your House
            </span>
          </div>

          {!hasValidCustomerLocation ? (
            <div className="p-6 text-center space-y-2 bg-amber-50/70 border-t border-amber-100">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                ⚠️
              </div>
              <h4 className="text-xs font-extrabold text-amber-900">Map Coordinates Missing for Order</h4>
              <p className="text-[11px] text-amber-700 max-w-xs mx-auto">
                No GPS map coordinates (`lat` / `lng`) were selected for this delivery address.
              </p>
            </div>
          ) : (
            <div className="h-56 w-full relative z-0">
              <MapContainer
                center={[(KITCHEN_LOCATION.lat + customerLat) / 2, (KITCHEN_LOCATION.lng + customerLng) / 2]}
                zoom={13}
                scrollWheelZoom={false}
                dragging={false}
                touchZoom={false}
                doubleClickZoom={false}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Kitchen Marker */}
                <Marker position={[KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng]} icon={homeIcon}>
                  <Popup>
                    <div className="text-xs font-bold text-center">
                      🍔 Mahadev Fast Food Kitchen
                    </div>
                  </Popup>
                </Marker>

                {/* Customer House Marker */}
                <Marker position={[customerLat, customerLng]} icon={homeIcon}>
                  <Popup>
                    <div className="text-xs font-bold text-center">
                      🏡 Your Delivery Destination
                    </div>
                  </Popup>
                </Marker>

                {/* Driver Live Moving Bike Marker */}
                {driverLocation && (
                  <Marker position={[driverLocation.lat, driverLocation.lng]} icon={bikeIcon}>
                    <Popup>
                      <div className="text-xs font-bold text-center">
                        🛵 Driver Live Location
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Delivery Road Route Polyline Path */}
                {routePolyline.length > 0 && (
                  <Polyline positions={routePolyline} color="#7e22ce" weight={3} opacity={0.9} />
                )}
              </MapContainer>
            </div>
          )}
        </div>

        {/* Live Timeline Tracker */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-muted-gray uppercase tracking-wider border-b border-gray-100 pb-2.5 flex items-center justify-between">
            <span>Live Order Status</span>
            <span className="text-brand-accent font-extrabold text-[11px]">Mahadev Kitchen</span>
          </h2>

          <div className="space-y-5 relative pl-3 pt-1 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
            {trackingSteps.map((s) => {
              const isActive = currentStep >= s.step;
              const isCurrent = currentStep === s.step;
              return (
                <div key={s.step} className="flex items-start gap-4 relative z-10">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isActive 
                      ? 'bg-brand-accent text-white ring-4 ring-emerald-100 shadow-xs' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isActive ? '✓' : s.step}
                  </div>

                  <div className="flex-1 -mt-0.5">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs sm:text-sm font-bold ${isCurrent ? 'text-brand-accent font-extrabold' : isActive ? 'text-dark-slate' : 'text-gray-400'}`}>
                        {s.title}
                      </p>
                      {isCurrent && (
                        <span className="text-[9px] font-extrabold bg-emerald-100 text-brand-accent px-2 py-0.5 rounded-full uppercase">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-gray mt-0.5">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Mahadev Kitchen Card */}
        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-accent text-white rounded-xl shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-sm text-dark-slate">Need Help with Order?</p>
              <p className="text-xs text-muted-gray">Call Mahadev Fast Food directly</p>
            </div>
          </div>

          <a
            href="tel:+919876543210"
            className="bg-brand-accent hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Shop</span>
          </a>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-dark-slate border-b border-gray-100 pb-2">
            <MapPin className="w-4 h-4 text-brand-primary" /> Delivery Destination
          </div>
          <p className="text-gray-800 font-bold">{orderDetails.customer?.name} <span className="font-normal text-muted-gray">({orderDetails.customer?.phone})</span></p>
          <p className="text-muted-gray leading-relaxed">{orderDetails.customer?.address}</p>
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs text-xs space-y-2.5">
          <h2 className="font-bold text-dark-slate border-b border-gray-100 pb-2 flex justify-between">
            <span>Ordered Items</span>
            <span className="text-brand-primary">Total: ₹{orderDetails.billBreakdown?.grandTotal}</span>
          </h2>
          <div className="divide-y divide-gray-100">
            {orderDetails.items?.map((item) => (
              <div key={item.id} className="py-2 flex justify-between">
                <span className="text-gray-700 font-medium">{item.name} × {item.quantity}</span>
                <span className="font-bold text-dark-slate">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Special Cooking Instructions Card */}
          {orderDetails.cookingInstructions && (
            <div className="mt-3 pt-2.5 border-t border-gray-100 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
              <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider mb-0.5">
                📝 Kitchen Note:
              </span>
              <p className="text-amber-800 italic font-medium">"{orderDetails.cookingInstructions}"</p>
            </div>
          )}
        </div>

        {/* Back to Home Menu Action Button */}
        <div className="pt-3 pb-6">
          <button
            onClick={onGoToMenu || onBackToMenu}
            className="w-full py-3.5 bg-brand-primary hover:bg-red-700 text-white rounded-xl font-extrabold text-sm shadow-md shadow-red-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home Menu</span>
          </button>
        </div>

      </main>

    </div>
  );
}
