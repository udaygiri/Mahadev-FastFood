import React, { useState } from 'react';
import { X, MapPin, CreditCard, Banknote, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, cartItems, customerDetails, onConfirmOrder }) {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate bill breakdown
  const itemTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = itemTotal > 299 ? 0 : 25; // Free delivery above ₹299
  const platformCharge = 5;
  const grandTotal = itemTotal + deliveryFee + platformCharge;

  const handlePlaceOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const orderPayload = {
        orderId: `MHF-${Math.floor(100000 + Math.random() * 900000)}`,
        items: cartItems,
        customer: customerDetails,
        paymentMethod,
        billBreakdown: { itemTotal, deliveryFee, platformCharge, grandTotal },
        orderTime: new Date().toISOString(),
        status: 'Placed',
      };

      setIsSubmitting(false);
      onConfirmOrder(orderPayload);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 transition-opacity">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-primary" />
            <h2 className="font-heading font-bold text-lg text-dark-slate">Checkout Summary</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-5">
          
          {/* Delivery Address Card */}
          <div className="bg-slate-50 border border-brand-accent/20 rounded-xl p-3.5 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-brand-accent rounded-lg mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-heading font-semibold text-sm text-dark-slate">
                    {customerDetails?.name || 'Valued Customer'}
                  </p>
                  <span className="text-xs text-muted-gray font-mono">({customerDetails?.phone})</span>
                </div>
                <p className="text-xs text-muted-gray mt-1 line-clamp-2">
                  {customerDetails?.address || 'No address specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div>
            <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-2">Order Items</h3>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl px-3 bg-white">
              {cartItems.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-accent inline-block" title="100% Pure Veg"></span>
                    <span className="font-medium text-dark-slate">{item.name}</span>
                    <span className="text-xs font-bold text-muted-gray">× {item.quantity}</span>
                  </div>
                  <span className="font-semibold text-dark-slate">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-2">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-brand-primary bg-red-50/50 text-brand-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-bold">Cash on Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'border-brand-primary bg-red-50/50 text-brand-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">UPI / QR Code</span>
              </button>
            </div>
          </div>

          {/* Bill Breakdown */}
          <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 border border-gray-100 text-sm">
            <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-1">Bill Details</h3>
            <div className="flex justify-between text-muted-gray">
              <span>Item Total</span>
              <span>₹{itemTotal}</span>
            </div>
            <div className="flex justify-between text-muted-gray">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? <span className="text-brand-accent font-bold">FREE</span> : `₹${deliveryFee}`}</span>
            </div>
            <div className="flex justify-between text-muted-gray">
              <span>Platform Charge</span>
              <span>₹{platformCharge}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-dark-slate">
              <span>To Pay</span>
              <span className="text-brand-primary">₹{grandTotal}</span>
            </div>
          </div>

          {/* Pure Veg Trust Badge */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-brand-accent font-medium bg-emerald-50 py-2 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Pure Veg Kitchen • Prepared Fresh</span>
          </div>

        </div>

        {/* Footer Action Button */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || cartItems.length === 0}
            className="w-full py-3.5 bg-brand-primary hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <span>Place Order • ₹{grandTotal}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
