import React, { useState, useEffect } from 'react';
import { getMenuItems } from '../services/api';
import { Search, ShoppingBag, Plus, Minus, Star, MapPin, ShieldCheck, Utensils, X, Leaf, LogOut, RefreshCw, AlertCircle } from 'lucide-react';

export default function Home({ user, activeOrder, onTrackOrder, onLogout, onGoToCheckout }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // Fetch live menu items on mount
  useEffect(() => {
    const fetchLiveMenu = async () => {
      try {
        const data = await getMenuItems(true); // true = fetch only available items
        setMenuItems(data);
      } catch (err) {
        console.error('Failed to load menu items:', err);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchLiveMenu();
  }, []);

  // Compute unique categories dynamically from database items
  const categoriesList = ['All', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemoveFromCart = (id) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id] > 1) {
        updated[id] -= 1;
      } else {
        delete updated[id];
      }
      return updated;
    });
  };

  const totalItemsCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  
  const totalPrice = Object.entries(cart).reduce((sum, [id, count]) => {
    const item = menuItems.find(m => String(m.id) === String(id));
    return sum + (item ? item.price * count : 0);
  }, 0);

  const cartItemsList = Object.entries(cart).map(([id, count]) => {
    const item = menuItems.find(m => String(m.id) === String(id));
    return {
      id: String(item?.id || id),
      name: item?.name || 'Item',
      price: item?.price || 0,
      quantity: count
    };
  });

  const handleCheckoutClick = () => {
    if (onGoToCheckout) {
      onGoToCheckout(cartItemsList);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-dark-slate overflow-x-hidden">
      {/* Top Header Navigation */}
      <header className="sticky top-0 bg-white z-40 border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          
          {/* Brand Info & Saved Address Bar */}
          <div className="flex items-center justify-between md:justify-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-extrabold text-brand-primary tracking-tight whitespace-nowrap">
                  Mahadev Fast Food
                </h1>
                <span className="bg-emerald-50 text-brand-accent text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shrink-0">
                  <Leaf className="w-3 h-3 fill-brand-accent text-brand-accent" /> 100% PURE VEG
                </span>
              </div>

              {/* Delivery Address Pill */}
              <div className="flex items-center gap-1.5 mt-1 max-w-full">
                <p className="text-xs text-muted-gray flex items-center gap-1 truncate max-w-[240px] sm:max-w-md">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" /> 
                  <span className="font-bold text-dark-slate shrink-0">Deliver:</span>
                  <span className="truncate">{user ? `${user.name} • ${user.address}` : 'Station Road, Junagadh'}</span>
                </p>
                {onLogout && (
                  <button 
                    onClick={onLogout}
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-0.5 shrink-0"
                    title="Change Delivery Details"
                  >
                    <LogOut className="w-3 h-3" /> Change
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Search Box with Clear Button */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search pizza, burger, vada pav..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-100 rounded-xl text-sm border border-transparent focus:border-brand-primary focus:bg-white transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark-slate p-1 rounded-full cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="bg-emerald-50 text-brand-accent font-bold text-xs px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span> Kitchen Accepting Orders
            </span>
          </div>

        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left / Center Column: Menu Browsing */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Desktop Category Bar */}
            <div className="hidden lg:flex bg-white p-4 rounded-2xl shadow-xs border border-gray-200/80 items-center justify-between gap-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 max-w-full">
                {categoriesList.map(cat => (
                  <button 
                    key={cat}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-brand-primary text-white shadow-sm' 
                        : 'bg-gray-100 text-muted-gray hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid Container */}
            <div className="bg-white p-3.5 sm:p-6 rounded-2xl shadow-xs border border-gray-200/80 pb-24 lg:pb-6">
              <h2 className="text-base sm:text-xl font-extrabold text-dark-slate mb-4 sm:mb-6 flex items-center justify-between">
                <span>{selectedCategory === 'All' ? 'Full Menu' : selectedCategory}</span>
                <span className="text-xs font-normal text-muted-gray">{filteredMenu.length} items available</span>
              </h2>
              
              {/* Loading State */}
              {loadingMenu ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mx-auto" />
                  <p className="text-xs font-bold text-gray-500">Fetching live menu from kitchen...</p>
                </div>
              ) : filteredMenu.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 bg-red-50 text-brand-primary rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-base text-dark-slate">No available items found</h3>
                  <p className="text-xs text-muted-gray">
                    {searchQuery ? `No dishes match your search "${searchQuery}"` : 'The kitchen menu is currently being updated. Please check back shortly.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-red-700 transition-all cursor-pointer"
                    >
                      Clear Search & Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {filteredMenu.map(item => {
                    const qty = cart[item.id] || 0;
                    return (
                      <div key={item.id} className="p-3.5 sm:p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all flex justify-between gap-3 bg-white">
                        {/* Dish Text Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="w-3.5 h-3.5 rounded-sm border border-brand-accent flex items-center justify-center p-[1px] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                {item.category}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-dark-slate leading-snug truncate">{item.name}</h3>
                            <div className="text-xs sm:text-sm font-extrabold text-dark-slate mt-0.5">₹{item.price}</div>
                            {item.description && (
                              <p className="text-xs text-muted-gray mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Dish Image & Add Button */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'} 
                            alt={item.name} 
                            className="w-full h-18 sm:h-20 object-cover rounded-xl shadow-xs" 
                          />
                          
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                            {qty === 0 ? (
                              <button 
                                className="bg-white text-brand-accent font-extrabold text-xs px-4 py-1.5 rounded-lg border border-gray-200 shadow-md hover:bg-emerald-50 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                                onClick={() => handleAddToCart(item.id)}
                              >
                                ADD
                              </button>
                            ) : (
                              <div className="flex items-center bg-brand-accent text-white rounded-lg shadow-md overflow-hidden text-xs font-bold">
                                <button onClick={() => handleRemoveFromCart(item.id)} className="px-2 py-1 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-1">{qty}</span>
                                <button onClick={() => handleAddToCart(item.id)} className="px-2 py-1 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Permanent Desktop Cart Sidebar */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 space-y-4">
              <h3 className="text-lg font-bold text-dark-slate border-b border-gray-100 pb-3 flex items-center justify-between">
                <span>Your Cart</span>
                <ShoppingBag className="w-5 h-5 text-brand-primary" />
              </h3>

              {totalItemsCount === 0 ? (
                <div className="py-12 text-center text-muted-gray space-y-2">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="font-semibold text-sm">Your cart is empty</p>
                  <p className="text-xs text-gray-400">Add delicious items from the menu to start ordering</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Item List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {cartItemsList.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex-1 truncate flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-xs border border-brand-accent flex items-center justify-center p-[1px] shrink-0">
                            <span className="w-1 h-1 rounded-full bg-brand-accent"></span>
                          </span>
                          <span className="font-semibold text-dark-slate truncate">{item.name}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-gray-100 text-dark-slate rounded-lg overflow-hidden text-xs font-bold border border-gray-200">
                            <button onClick={() => handleRemoveFromCart(item.id)} className="px-2 py-1 hover:bg-gray-200">
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <span className="px-1.5">{item.quantity}</span>
                            <button onClick={() => handleAddToCart(item.id)} className="px-2 py-1 hover:bg-gray-200">
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                          <span className="font-bold text-dark-slate w-12 text-right">₹{item.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Info Card in Cart */}
                  {user && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-dark-slate">Delivering To:</span>
                        <button onClick={onLogout} className="text-[11px] font-bold text-brand-primary hover:underline">Change</button>
                      </div>
                      <p className="font-semibold text-gray-700">{user.name} ({user.phone})</p>
                      <p className="text-muted-gray truncate">{user.address}</p>
                    </div>
                  )}

                  {/* Bill Details */}
                  <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-muted-gray">
                    <div className="flex justify-between">
                      <span>Item Total</span>
                      <span className="font-semibold text-dark-slate">₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee (Distance based)</span>
                      <span className="font-semibold text-brand-accent">Calculated at Checkout</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-extrabold text-dark-slate">
                      <span>To Pay</span>
                      <span className="text-brand-primary">₹{totalPrice}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button 
                    className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                    onClick={handleCheckoutClick}
                  >
                    Proceed to Checkout ➔
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" /> 100% Safe & Hygienic Delivery
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Bottom Left "MENU" Button (Mobile & Tablet) */}
      <div className={`lg:hidden fixed left-4 z-40 transition-all duration-300 ${
        totalItemsCount > 0 ? 'bottom-36' : 'bottom-20'
      }`}>
        <button 
          onClick={() => setIsCategoryMenuOpen(true)}
          className="bg-[#1E2022] text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 border border-gray-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Utensils className="w-4 h-4 text-brand-primary shrink-0" />
          <span>MENU</span>
        </button>
      </div>

      {/* Mobile/Tablet Category Popup Sheet */}
      {isCategoryMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-start p-4 bg-black/40 backdrop-blur-xs transition-opacity">
          <div className={`bg-white rounded-2xl p-4 shadow-2xl border border-gray-200 w-60 space-y-3 ml-1 transform transition-all ${
            totalItemsCount > 0 ? 'mb-24' : 'mb-12'
          }`}>
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-extrabold text-xs tracking-wider text-muted-gray uppercase flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-brand-primary" /> Food Categories
              </span>
              <button 
                onClick={() => setIsCategoryMenuOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-dark-slate hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {categoriesList.map(cat => {
                const count = cat === 'All' 
                  ? menuItems.length 
                  : menuItems.filter(m => m.category === cat).length;
                return (
                  <button 
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsCategoryMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-brand-primary text-white shadow-sm' 
                        : 'text-dark-slate hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-muted-gray'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar (Mobile & Tablet) */}
      {totalItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-18 right-4 left-4 bg-brand-accent text-white p-3 px-4 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-600/30 z-40 transition-all animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-2 -right-2 bg-brand-primary text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-accent shadow-xs">
                {totalItemsCount}
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold tracking-wider opacity-90 uppercase">
                {totalItemsCount} {totalItemsCount === 1 ? 'ITEM' : 'ITEMS'}
              </span>
              <span className="text-sm font-extrabold truncate">₹{totalPrice}</span>
            </div>
          </div>

          <button 
            className="flex items-center gap-1.5 text-xs font-bold bg-white text-brand-accent px-3 py-2 rounded-lg shadow-xs hover:bg-emerald-50 transition-all active:scale-95 cursor-pointer shrink-0"
            onClick={handleCheckoutClick}
          >
            View Cart ➔
          </button>
        </div>
      )}
    </div>
  );
}
