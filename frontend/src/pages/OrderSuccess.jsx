import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Sparkles, ArrowRight, PhoneCall, Phone, ArrowLeft } from 'lucide-react';

export default function OrderSuccess({ orderDetails, onBackToMenu, onGoToMenu }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Placed, 2: Preparing, 3: Out for Delivery, 4: Delivered

  useEffect(() => {
    // Reset step
    setCurrentStep(1);

    // Live status updates
    const timer1 = setTimeout(() => setCurrentStep(2), 4000);  // 4s -> Preparing
    const timer2 = setTimeout(() => setCurrentStep(3), 10000); // 10s -> Out for Delivery

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [orderDetails]);

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

  const trackingSteps = [
    { step: 1, title: 'Order Placed', desc: 'Received by kitchen' },
    { step: 2, title: 'Preparing Food', desc: 'Fresh & hot in kitchen' },
    { step: 3, title: 'Out for Delivery', desc: 'Driver on the way' },
    { step: 4, title: 'Delivered', desc: 'Enjoy your food!' },
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
          #{orderDetails.orderId}
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
          <span>ORDER #{orderDetails.orderId}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto w-full px-4 pt-5 space-y-4 flex-1">
        
        {/* Estimated Arrival Card */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-brand-accent rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-gray uppercase tracking-wider">ESTIMATED DELIVERY</p>
              <p className="font-heading font-extrabold text-lg sm:text-xl text-dark-slate">25 - 30 Mins</p>
            </div>
          </div>
          
          <span className="text-xs font-extrabold bg-emerald-50 text-brand-accent px-3 py-1.5 rounded-full border border-emerald-200 animate-pulse">
            Live Track
          </span>
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

      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
        <div className="max-w-xl mx-auto">
          <button
            onClick={onBackToMenu}
            className="w-full py-3.5 bg-brand-primary hover:bg-red-700 text-white rounded-xl font-extrabold text-sm shadow-md shadow-red-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Back to Home Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
