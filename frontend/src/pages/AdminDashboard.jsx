import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle2, CookingPot, Truck, DollarSign, RefreshCw, Phone, MapPin, AlertCircle, Trash2, LogOut } from 'lucide-react';
import { fetchOrders, updateOrderStatus, deleteOrder } from '../services/api';

export default function AdminDashboard({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'Placed' | 'Preparing' | 'Out for Delivery' | 'Delivered'

  const loadAllOrders = async () => {
    try {
      const data = await fetchOrders(); // No phone passed -> gets all orders
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOrders();
    const interval = setInterval(loadAllOrders, 4000); // Auto-refresh admin order feed every 4s
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

  // Analytics Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.billBreakdown?.grandTotal || 0), 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;

  // Filtered Orders List
  const displayedOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter((o) => o.status === filterStatus);

  if (loading) {
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
    <div className="min-h-screen bg-gray-100 font-sans text-dark-slate pb-12">
      {/* Admin Top Header */}
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
              onClick={loadAllOrders}
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
        {/* Analytics Cards Header */}
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

        {/* Orders Grid */}
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
                    {/* Header */}
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

                    {/* Customer Info */}
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

                    {/* Items List */}
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

                    {/* Kitchen Instructions */}
                    {order.cookingInstructions && (
                      <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-[11px]">
                        <span className="font-bold text-amber-900">Note: </span>
                        <span className="text-amber-800 font-medium">"{order.cookingInstructions}"</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Bill Footer */}
                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400">Total Bill ({order.paymentMethod?.toUpperCase()}):</span>
                      <span className="text-brand-primary font-extrabold text-sm">₹{order.billBreakdown?.grandTotal}</span>
                    </div>

                    {/* Status Advance Buttons */}
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
      </main>
    </div>
  );
}
