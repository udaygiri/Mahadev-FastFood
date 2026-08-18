import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, CreditCard, Banknote, ShieldCheck, ShoppingBag, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { createOrder, getSettings } from '../services/api';

export default function Checkout({ user, cartItems, onBackToMenu, onOrderSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({ platform_charge: 5.0, delivery_fee: 0.0 });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings in Checkout:', err);
      }
    };
    loadSettings();
  }, []);

  // Calculate bill breakdown
  const itemTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = settings.delivery_fee ?? 0.0;
  const platformCharge = settings.platform_charge ?? 5.0;
  const grandTotal = itemTotal + deliveryFee + platformCharge;

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    const generatedOrderId = `MHF-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderPayload = {
      orderId: generatedOrderId,
      customer: {
        name: user?.name,
        phone: user?.phone,
        address: user?.address,
        lat: user?.lat,
        lng: user?.lng,
      },
      items: cartItems.map((item) => ({
        id: String(item.id),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      cookingInstructions: cookingInstructions.trim(),
      paymentMethod: paymentMethod,
      billBreakdown: {
        itemTotal,
        deliveryFee,
        platformCharge,
        grandTotal,
      },
      status: 'Placed',
    };

    try {
      const createdOrder = await createOrder(orderPayload);
      setIsSubmitting(false);
      onOrderSuccess(createdOrder);
    } catch (error) {
      setIsSubmitting(false);
      const detail = error.response?.data?.detail;
      let errorMsg = 'Failed to place order.';

      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((err) => `${err.loc.join('.')}: ${err.msg}`).join('\n');
      } else if (error.message) {
        errorMsg = error.message;
      }

      alert(errorMsg);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-dark-slate">Your cart is empty</h2>
        <p className="text-sm text-muted-gray mt-1 mb-6">Please add items from the menu to proceed to checkout.</p>
        <button
          onClick={onBackToMenu}
          className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-red-700 transition-all cursor-pointer"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-dark-slate flex flex-col justify-between pb-28 md:pb-12">
      
      {/* Top Mobile-First Header */}
      <header className="sticky top-0 bg-white z-40 border-b border-gray-200 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="p-2 -ml-2 rounded-xl text-gray-600 hover:text-dark-slate hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-sm font-bold cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-brand-primary" />
            <span>Menu</span>
          </button>
          
          <h1 className="font-heading font-extrabold text-base sm:text-lg text-dark-slate text-center">
            Checkout Summary
          </h1>

          <div className="w-12"></div> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 space-y-4 flex-1">
        
        {/* Delivery Location Summary Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-gray flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-primary" /> Delivery Address
            </span>
            <button
              onClick={onBackToMenu}
              className="text-xs font-bold text-brand-accent hover:underline"
            >
              Change
            </button>
          </div>
          
          <div className="pt-1">
            <p className="font-heading font-bold text-sm text-dark-slate">
              {user?.name || 'Valued Customer'} <span className="font-normal text-xs text-muted-gray">({user?.phone})</span>
            </p>
            <p className="text-xs text-muted-gray mt-1 leading-relaxed">
              {user?.address || 'Junagadh Local Address'}
            </p>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-gray flex items-center justify-between border-b border-gray-100 pb-2.5">
            <span>Order Items</span>
            <span className="text-dark-slate font-extrabold">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</span>
          </h2>

          <div className="divide-y divide-gray-100">
            {cartItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-accent inline-block flex-shrink-0" title="100% Pure Veg"></span>
                  <div>
                    <p className="font-bold text-dark-slate leading-snug">{item.name}</p>
                    <p className="text-xs text-muted-gray">₹{item.price} × {item.quantity}</p>
                  </div>
                </div>
                <span className="font-extrabold text-dark-slate">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Cooking & Delivery Instructions */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-gray flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
            <MessageSquare className="w-4 h-4 text-brand-primary" /> Cooking & Delivery Instructions
          </h2>

          <div className="pt-1 space-y-2">
            <input
              type="text"
              value={cookingInstructions}
              onChange={(e) => setCookingInstructions(e.target.value)}
              placeholder="e.g. Make it extra spicy, less oil, don't ring bell..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-dark-slate focus:bg-white focus:border-brand-primary outline-none transition-all"
            />
            
            {/* Quick Chips / Badges */}
            <div className="flex gap-1.5 flex-wrap pt-0.5">
              {['Extra Spicy 🌶️', 'Less Oil 🥗', 'No Onions 🧅', 'Ring Bell 🔔'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (!cookingInstructions.includes(tag)) {
                      setCookingInstructions((prev) => (prev ? `${prev}, ${tag}` : tag));
                    }
                  }}
                  className="text-[10px] font-bold bg-gray-100 hover:bg-red-50 hover:text-brand-primary text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200/80 transition-all cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method Options */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-gray border-b border-gray-100 pb-2.5">
            Payment Options
          </h2>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all text-center cursor-pointer ${
                paymentMethod === 'cod'
                  ? 'border-brand-primary bg-red-50/50 text-brand-primary shadow-xs'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Banknote className="w-6 h-6" />
              <div>
                <p className="text-xs font-extrabold">Cash on Delivery</p>
                <p className="text-[10px] opacity-80">Pay cash upon arrival</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all text-center cursor-pointer ${
                paymentMethod === 'upi'
                  ? 'border-brand-primary bg-red-50/50 text-brand-primary shadow-xs'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <div>
                <p className="text-xs font-extrabold">UPI / QR Code</p>
                <p className="text-[10px] opacity-80">GPay, PhonePe, Paytm</p>
              </div>
            </button>
          </div>
        </div>

        {/* Detailed Bill Receipt */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5 text-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-gray border-b border-gray-100 pb-2">
            Bill Details
          </h2>

          <div className="flex justify-between text-muted-gray">
            <span>Item Subtotal</span>
            <span className="font-semibold text-dark-slate">₹{itemTotal}</span>
          </div>

          <div className="flex justify-between text-muted-gray">
            <span>Delivery Partner Fee</span>
            <span>{deliveryFee === 0 ? <span className="text-brand-accent font-bold">FREE</span> : `₹${deliveryFee}`}</span>
          </div>

          <div className="flex justify-between text-muted-gray">
            <span>Platform Fee</span>
            <span className="font-semibold text-dark-slate">₹{platformCharge}</span>
          </div>

          <div className="border-t border-gray-200 pt-3 flex justify-between font-extrabold text-base text-dark-slate">
            <span>To Pay</span>
            <span className="text-brand-primary">₹{grandTotal}</span>
          </div>
        </div>

        {/* Pure Veg Guarantee Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-brand-accent font-bold bg-emerald-50 py-3 rounded-xl border border-emerald-100">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Pure Veg Kitchen • Hygienic & Fresh</span>
        </div>

      </main>

      {/* Floating Bottom Order Action Bar (Mobile & Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-muted-gray uppercase tracking-wider">TOTAL AMOUNT</p>
            <p className="text-lg font-extrabold text-brand-primary">₹{grandTotal}</p>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="flex-1 max-w-xs py-3.5 bg-brand-primary hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-red-200 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <span>Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
