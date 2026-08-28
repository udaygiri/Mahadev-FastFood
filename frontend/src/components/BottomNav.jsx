import React from 'react';
import { Home as HomeIcon, ShoppingBag } from 'lucide-react';

export default function BottomNav({ activeTab, onChangeTab, hasActiveOrder }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-2 py-1.5 px-6 gap-3">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home' || activeTab === 'menu' ? 'text-brand-primary font-extrabold bg-red-50/70' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[11px]">Home</span>
        </button>

        {/* Tab 2: Orders */}
        <button
          onClick={() => onChangeTab('orders')}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'orders' ? 'text-brand-primary font-extrabold bg-red-50/70' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {hasActiveOrder && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </div>
          <span className="text-[11px]">Orders</span>
        </button>

      </div>
    </div>
  );
}

