import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, Package, Clock, ArrowLeft, RotateCcw } from 'lucide-react';

export default function OrdersList({ orders, onSelectOrder, onReorder, onGoToMenu }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center pb-28">
        <div className="w-16 h-16 bg-red-50 text-brand-primary rounded-full flex items-center justify-center mb-3">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-dark-slate">No orders placed yet</h2>
        <p className="text-xs text-muted-gray mt-1 mb-6">Explore our menu and place your first delicious order!</p>
        <button
          onClick={onGoToMenu}
          className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-all cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onGoToMenu}
            className="p-1.5 -ml-1.5 rounded-xl text-gray-600 hover:text-dark-slate hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-xs font-extrabold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-primary" />
            <span>Home</span>
          </button>

          <h1 className="font-heading font-extrabold text-base text-dark-slate flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-brand-primary" />
            <span>My Orders ({orders.length})</span>
          </h1>

          <div className="w-12"></div>
        </div>
      </header>

      {/* Orders Cards List */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {orders.map((order, idx) => {
          const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const isLatest = idx === 0;

          return (
            <div
              key={order.orderId}
              className={`bg-white rounded-2xl p-4 border transition-all hover:shadow-md space-y-3 ${
                isLatest ? 'border-brand-primary/40 shadow-xs ring-1 ring-brand-primary/10' : 'border-gray-100'
              }`}
            >
              {/* Top Row: Order ID & Status Badge */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-dark-slate">#{order.orderId}</span>
                  {isLatest && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Latest Order
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-extrabold text-brand-accent bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {order.status || 'Active'}
                </span>
              </div>

              {/* Items Summary & Total */}
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5 max-w-[70%]">
                  <p className="font-bold text-dark-slate truncate">
                    {order.items?.map(i => i.name).join(', ')}
                  </p>
                  <p className="text-muted-gray text-[11px]">
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • {new Date(order.orderTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-sm text-brand-primary">₹{order.billBreakdown?.grandTotal}</p>
                  <span className="text-[10px] text-muted-gray uppercase font-bold">{order.paymentMethod?.toUpperCase()}</span>
                </div>
              </div>

              {/* Bottom Actions: View Status + Reorder */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => onSelectOrder(order)}
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-dark-slate rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>View Status</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onReorder && onReorder(order.items)}
                  className="flex-1 py-2 px-3 bg-brand-primary hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reorder</span>
                </button>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
