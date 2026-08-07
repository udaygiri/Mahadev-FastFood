import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle2, CookingPot, Truck, DollarSign, RefreshCw, Phone, MapPin, AlertCircle, Trash2, LogOut, UtensilsCrossed, Plus, ToggleLeft, ToggleRight, X, ChevronDown, ChevronUp, Edit3, Upload, Link } from 'lucide-react';
import { fetchOrders, updateOrderStatus, deleteOrder, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/api';
import { supabase } from '../services/supabaseClient';

const CATEGORIES = [
  'Vada Pav',
  'Dabeli',
  'Pizza',
  'Burger',
  'Sandwich',
  'Fries & Snacks',
  'Beverages',
  'Desserts',
  'Combos'
];

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu'
  
  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  // Menu Management State
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [submittingDish, setSubmittingDish] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  
  // Dual Image Mode State: 'url' | 'file'
  const [imageInputMode, setImageInputMode] = useState('url');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Collapsible Categories State
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const [dishForm, setDishForm] = useState({
    name: '',
    category: 'Vada Pav',
    price: '',
    image: '',
    description: '',
    is_available: true
  });

  const loadAllOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadMenu = async () => {
    setLoadingMenu(true);
    try {
      const data = await getMenuItems(false);
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    loadAllOrders();
    loadMenu();
    const interval = setInterval(loadAllOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadAllOrders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete order #${orderId}?`)) return;
    setUpdatingId(orderId);
    try {
      await deleteOrder(orderId);
      await loadAllOrders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete order');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Supabase Storage Direct File Upload (Approach A)
  const handleFileUploadToSupabase = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setUploadingImage(true);
    try {
      // Unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `dishes/${fileName}`;

      // Upload file to Supabase bucket 'menu-images'
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) {
        throw error;
      }

      // Get public URL from Supabase
      const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      // Auto-set generated Cloud URL into dishForm image attribute
      setDishForm(prev => ({
        ...prev,
        image: publicUrlData.publicUrl
      }));
    } catch (err) {
      console.error('Supabase upload error:', err);
      alert(`Upload failed: ${err.message || 'Ensure "menu-images" public bucket exists in Supabase Storage.'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreateModal = () => {
    setEditingDish(null);
    setImageInputMode('url');
    setDishForm({
      name: '',
      category: 'Vada Pav',
      price: '',
      image: '',
      description: '',
      is_available: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (dish) => {
    setEditingDish(dish);
    setImageInputMode(dish.image?.includes('supabase.co') ? 'file' : 'url');
    setDishForm({
      name: dish.name || '',
      category: dish.category || 'Vada Pav',
      price: dish.price || '',
      image: dish.image || '',
      description: dish.description || '',
      is_available: dish.is_available ?? true
    });
    setIsModalOpen(true);
  };

  const handleDishFormSubmit = async (e) => {
    e.preventDefault();
    if (!dishForm.name || !dishForm.price) {
      alert('Please provide at least Name and Price for the dish.');
      return;
    }
    setSubmittingDish(true);
    try {
      const payload = {
        ...dishForm,
        price: parseFloat(dishForm.price)
      };

      if (editingDish) {
        await updateMenuItem(editingDish.id, payload);
      } else {
        await createMenuItem(payload);
      }

      setIsModalOpen(false);
      await loadMenu();
    } catch (err) {
      alert(editingDish ? 'Failed to update dish' : 'Failed to create new dish');
    } finally {
      setSubmittingDish(false);
    }
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      await updateMenuItem(id, { is_available: !currentStatus });
      await loadMenu();
    } catch (err) {
      alert('Failed to update dish availability');
    }
  };

  const handleDeleteDish = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;
    try {
      await deleteMenuItem(id);
      await loadMenu();
    } catch (err) {
      alert('Failed to delete menu item');
    }
  };

  const toggleCategoryAccordion = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Analytics Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.billBreakdown?.grandTotal || 0), 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;

  const displayedOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter((o) => o.status === filterStatus);

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loadingOrders && loadingMenu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-brand-primary font-bold">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading Kitchen Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-dark-slate pb-20 relative">
      {/* Admin Header */}
      <header className="bg-dark-slate text-white border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-primary text-white rounded-xl flex items-center justify-center font-black">
              M
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-base sm:text-lg leading-none text-white">
                Mahadev Fast Food
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                Kitchen Admin Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { loadAllOrders(); loadMenu(); }}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-primary" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* Navigation Tabs (Live Orders vs Manage Menu) */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-dark-slate text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-brand-primary" />
              <span>Live Kitchen Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-dark-slate text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
              <span>Manage Menu ({menuItems.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LIVE KITCHEN ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-dark-slate">₹{totalRevenue}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-600">{activeOrdersCount}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Delivered</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-600">{deliveredOrdersCount}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-brand-primary" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-dark-slate">{orders.length}</p>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Placed', 'Preparing', 'Out for Delivery', 'Delivered'].map((status) => {
                const count = status === 'All' 
                  ? orders.length 
                  : orders.filter((o) => o.status === status).length;

                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filterStatus === status
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>

            {/* Orders Feed */}
            {displayedOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-2">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-dark-slate">No {filterStatus} orders found</h3>
                <p className="text-xs text-gray-400">New orders will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedOrders.map((order) => {
                  const isUpdating = updatingId === order.orderId;

                  return (
                    <div
                      key={order.orderId}
                      className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                        order.status === 'Placed' 
                          ? 'border-amber-400 ring-2 ring-amber-100' 
                          : order.status === 'Preparing'
                          ? 'border-blue-400'
                          : order.status === 'Out for Delivery'
                          ? 'border-purple-400'
                          : 'border-gray-200 opacity-80'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                          <div>
                            <span className="font-mono font-extrabold text-sm text-dark-slate">#{order.orderId}</span>
                            <p className="text-[10px] text-gray-400">
                              {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                              order.status === 'Placed'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : order.status === 'Preparing'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : order.status === 'Out for Delivery'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {order.status}
                            </span>

                            <button
                              disabled={isUpdating}
                              onClick={() => handleDeleteOrder(order.orderId)}
                              title="Delete Order"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <p className="font-bold text-dark-slate flex items-center justify-between">
                            <span>{order.customer?.name}</span>
                            <a href={`tel:${order.customer?.phone}`} className="text-brand-primary flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {order.customer?.phone}
                            </a>
                          </p>
                          <p className="text-gray-500 text-[11px] flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{order.customer?.address}</span>
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Order Items</p>
                          <div className="divide-y divide-gray-100">
                            {order.items?.map((item, i) => (
                              <div key={i} className="py-1 flex items-center justify-between">
                                <span className="font-bold text-dark-slate">{item.name} × {item.quantity}</span>
                                <span className="text-gray-600">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.cookingInstructions && (
                          <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-[11px]">
                            <span className="font-bold text-amber-900">Note: </span>
                            <span className="text-amber-800 font-medium">"{order.cookingInstructions}"</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-400">Total Bill ({order.paymentMethod?.toUpperCase()}):</span>
                          <span className="text-brand-primary font-extrabold text-sm">₹{order.billBreakdown?.grandTotal}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            disabled={isUpdating || order.status === 'Preparing'}
                            onClick={() => handleStatusChange(order.orderId, 'Preparing')}
                            className="py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <CookingPot className="w-3 h-3" />
                            <span>Preparing</span>
                          </button>

                          <button
                            disabled={isUpdating || order.status === 'Out for Delivery'}
                            onClick={() => handleStatusChange(order.orderId, 'Out for Delivery')}
                            className="py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>

                          <button
                            disabled={isUpdating || order.status === 'Delivered'}
                            onClick={() => handleStatusChange(order.orderId, 'Delivered')}
                            className="py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Delivered</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAGE MENU */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-dark-slate">Kitchen Menu Items ({menuItems.length})</h2>
                <p className="text-xs text-gray-500">Toggle dish availability, edit details, or add new items dynamically.</p>
              </div>
              {loadingMenu && <span className="text-xs text-brand-primary font-bold animate-pulse">Refreshing menu...</span>}
            </div>

            {menuItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
                <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-dark-slate">No Menu Items Found</h3>
                <p className="text-xs text-gray-400">Click the floating "+ Add Dish" button in the bottom right corner to create your first dish.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(groupedMenuItems).map((categoryName) => {
                  const categoryDishes = groupedMenuItems[categoryName];
                  const isCollapsed = collapsedCategories[categoryName];

                  return (
                    <div key={categoryName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                      <button
                        onClick={() => toggleCategoryAccordion(categoryName)}
                        className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/80 flex items-center justify-between transition-colors cursor-pointer border-b border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-dark-slate">{categoryName}</span>
                          <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-0.5 rounded-full">
                            {categoryDishes.length} {categoryDishes.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                          <span>{isCollapsed ? 'Expand' : 'Shrink'}</span>
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {categoryDishes.map((item) => (
                            <div
                              key={item.id}
                              className={`bg-white rounded-2xl border p-3.5 shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                                item.is_available ? 'border-gray-200 hover:border-gray-300' : 'border-red-200 bg-red-50/20'
                              }`}
                            >
                              <div className="flex gap-3">
                                <img
                                  src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'}
                                  alt={item.name}
                                  className="w-20 h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                                />
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1">
                                    <h3 className="font-bold text-xs sm:text-sm text-dark-slate leading-tight truncate" title={item.name}>
                                      {item.name}
                                    </h3>
                                    
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      <button
                                        onClick={() => openEditModal(item)}
                                        className="text-gray-400 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                                        title="Edit Dish"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDish(item.id, item.name)}
                                        className="text-gray-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                                        title="Delete Dish"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-brand-primary text-xs">₹{item.price}</span>
                                  </div>

                                  {item.description && (
                                    <p className="text-[11px] text-gray-500 line-clamp-2">{item.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                <span className={`text-[10px] font-bold ${item.is_available ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {item.is_available ? '● Available' : '○ Out of Stock'}
                                </span>

                                <button
                                  onClick={() => handleToggleAvailability(item.id, item.is_available)}
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    item.is_available
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                                >
                                  {item.is_available ? (
                                    <>
                                      <ToggleLeft className="w-3.5 h-3.5 text-red-500" />
                                      <span>Mark Out of Stock</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Mark Available</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={openCreateModal}
              className="fixed bottom-6 right-6 bg-brand-primary hover:bg-red-700 text-white font-extrabold px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer z-50 ring-4 ring-red-100"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Dish</span>
            </button>
          </div>
        )}
      </main>

      {/* POPUP MODAL FOR ADD / EDIT DISH FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                {editingDish ? <Edit3 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-brand-primary" />}
                <h2 className="text-base font-extrabold text-dark-slate">
                  {editingDish ? `Edit Dish: ${editingDish.name}` : 'Add New Fast Food Item'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDishFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cheese Garlic Vada Pav"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={dishForm.category}
                    onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none bg-white font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 50"
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>
              </div>

              {/* DUAL IMAGE INPUT TAB SELECTION (URL vs FILE UPLOAD) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700">Dish Image Option</label>
                  <div className="flex bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        imageInputMode === 'url' ? 'bg-white text-dark-slate shadow-xs' : 'text-gray-500'
                      }`}
                    >
                      <Link className="w-3 h-3" /> Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('file')}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        imageInputMode === 'file' ? 'bg-white text-dark-slate shadow-xs' : 'text-gray-500'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Upload File
                    </button>
                  </div>
                </div>

                {imageInputMode === 'url' ? (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={dishForm.image}
                    onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadToSupabase}
                      disabled={uploadingImage}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
                    />
                    {uploadingImage && <p className="text-[10px] text-brand-primary font-bold animate-pulse">Uploading to Supabase Cloud Storage...</p>}
                    {dishForm.image && !uploadingImage && (
                      <p className="text-[10px] text-emerald-600 font-bold truncate">Uploaded: {dishForm.image}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Short description of ingredients..."
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_available_modal_check"
                  checked={dishForm.is_available}
                  onChange={(e) => setDishForm({ ...dishForm, is_available: e.target.checked })}
                  className="w-4 h-4 text-brand-primary rounded-md accent-brand-primary cursor-pointer"
                />
                <label htmlFor="is_available_modal_check" className="font-bold text-gray-700 cursor-pointer">
                  Available immediately for ordering
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDish || uploadingImage}
                  className={`px-5 py-2.5 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                    editingDish ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-primary hover:bg-red-700'
                  }`}
                >
                  {editingDish ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{submittingDish ? (editingDish ? 'Updating...' : 'Adding...') : (editingDish ? 'Save Changes' : 'Add Dish')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




