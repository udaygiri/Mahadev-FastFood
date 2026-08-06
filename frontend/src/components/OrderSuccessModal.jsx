import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Phone, ShoppingBag, ArrowRight, Motorbike, Sparkles, ChefHat } from 'lucide-react';

export default function OrderSuccessModal({ isOpen, orderDetails, onClose }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Placed, 2: Preparing, 3: Out for Delivery, 4: Delivered

  useEffect(() => {
    if (!isOpen) return;

    // Reset to step 1 whenever modal opens
    setCurrentStep(1);

    // Simulate real-time order status updates for demo
    const timer1 = setTimeout(() => setCurrentStep(2), 4000);  // 4s -> Preparing
    const timer2 = setTimeout(() => setCurrentStep(3), 10000); // 10s -> Out for Delivery

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  if (!isOpen || !orderDetails) return null;

  const trackingSteps = [
    { step: 1, title: 'Order Placed', desc: 'Received by kitchen' },
    { step: 2, title: 'Preparing Food', desc: 'Fresh & hot in kitchen' },
    { step: 3, title: 'Out for Delivery', desc: 'Driver on the way' },
    { step: 4, title: 'Delivered', desc: 'Enjoy your food!' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 transition-opacity">
      
      {/* Mobile-First Sheet Container */}
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col">
        
        {/* Mobile Swipe Handle Indicator */}
        <div className="sm:hidden bg-emerald-500 pt-2.5 pb-1 flex justify-center">
          <div className="w-12 h-1 bg-white/40 rounded-full"></div>
        </div>

        {/* Hero Success Banner */}
        <div className="bg-gradient-to-b from-emerald-500 to-emerald-600 text-white p-6 text-center space-y-2 relative overflow-hidden">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-1 backdrop-blur-xs animate-bounce shadow-md">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="font-heading font-extrabold text-2xl tracking-tight leading-tight">Order Confirmed!</h2>
          
          <div className="inline-flex items-center gap-1.5 bg-black/20 text-white text-xs font-mono px-3 py-1 rounded-full backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>ID: {orderDetails.orderId}</span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 bg-gray-50/50">
          
          {/* Estimated Delivery Time Card */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-brand-accent rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-gray uppercase tracking-wider">ESTIMATED ARRIVAL</p>
                <p className="font-heading font-extrabold text-lg text-dark-slate">25 - 30 Mins</p>
              </div>
            </div>
            
            <span className="text-[11px] font-extrabold bg-emerald-50 text-brand-accent px-3 py-1 rounded-full border border-emerald-200 animate-pulse">
              Live
            </span>
          </div>

          {/* Real-time Tracking Progress Timeline */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-muted-gray uppercase tracking-wider border-b border-gray-100 pb-2">
              Live Tracking Status
            </h3>

            <div className="space-y-4 relative pl-3 pt-1 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
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
                        <p className={`text-xs font-bold ${isCurrent ? 'text-brand-accent font-extrabold' : isActive ? 'text-dark-slate' : 'text-gray-400'}`}>
                          {s.title}
                        </p>
                        {isCurrent && (
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-brand-accent px-2 py-0.5 rounded-full uppercase">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-gray">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address Summary */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-dark-slate">
              <MapPin className="w-4 h-4 text-brand-primary" /> Delivery Destination:
            </div>
            <p className="text-gray-800 font-bold pl-5.5">{orderDetails.customer?.name} <span className="font-normal text-muted-gray">({orderDetails.customer?.phone})</span></p>
            <p className="text-muted-gray pl-5.5 line-clamp-2 leading-relaxed">{orderDetails.customer?.address}</p>
          </div>

          {/* Total Bill Summary Card */}
          <div className="flex justify-between items-center bg-dark-slate text-white p-4 rounded-2xl text-xs font-bold shadow-xs">
            <span className="opacity-90">Payment Method: {orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Paid'}</span>
            <span className="text-brand-primary font-extrabold text-base bg-white/10 px-3 py-1 rounded-xl">₹{orderDetails.billBreakdown?.grandTotal}</span>
          </div>

        </div>

        {/* Mobile Sticky Bottom Action Button */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-brand-primary hover:bg-red-700 text-white rounded-xl font-extrabold text-sm shadow-md shadow-red-200 transition-all cursor-pointer active:scale-98"
          >
            Back to Home Menu
          </button>
        </div>

      </div>
    </div>
  );
}
