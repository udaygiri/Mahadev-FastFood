import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrdersList from './pages/OrdersList';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import DriverDashboard from './pages/DriverDashboard';
import BottomNav from './components/BottomNav';
import InstallPwaBanner from './components/InstallPwaBanner';
import { fetchOrders } from './services/api';
import { supabase } from './services/supabaseClient';

export default function App() {
  const isAdminRoute = window.location.pathname === '/admin';
  const isDriverRoute = window.location.pathname === '/driver';

  const [adminSession, setAdminSession] = useState(null);
  const [checkingAdminAuth, setCheckingAdminAuth] = useState(isAdminRoute);

  useEffect(() => {
    if (!isAdminRoute) return;

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminSession(session);
      setCheckingAdminAuth(false);
    });

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdminSession(session);
    });

    return () => subscription.unsubscribe();
  }, [isAdminRoute]);

  if (isDriverRoute) {
    return <DriverDashboard />;
  }

  if (isAdminRoute) {
    if (checkingAdminAuth) return null;
    if (!adminSession) {
      return <AdminLogin onLoginSuccess={(session) => setAdminSession(session)} />;
    }
    return <AdminDashboard onLogout={() => supabase.auth.signOut()} />;
  }

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'checkout' | 'orders_list' | 'order_details' | 'profile'
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders' | 'profile'
  const [activeCartItems, setActiveCartItems] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('mahadev_customer_details');
    if (savedUser && !user) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.phone) return;

    const loadOrders = () => {
      fetchOrders(user.phone)
        .then((data) => {
          setOrdersList(data);
          if (data.length > 0) {
            setSelectedOrder((prev) => {
              if (!prev) return data[0];
              const updated = data.find((o) => o.orderId === prev.orderId);
              return updated || data[0];
            });
          }
        })
        .catch((err) => console.error('Failed to fetch orders:', err));
    };

    loadOrders();
    const intervalId = setInterval(loadOrders, 3000);

    return () => clearInterval(intervalId);
  }, [user?.phone]);

  const handleGoToCheckout = (cartItems) => {
    setActiveCartItems(cartItems);
    setCurrentView('checkout');
    window.scrollTo(0, 0);
  };

  const handleBackToMenu = () => {
    setCurrentView('home');
    setActiveTab('menu');
    window.scrollTo(0, 0);
  };

  const handleOrderSuccess = (newOrder) => {
    console.log('Order Placed Successfully:', newOrder);
    setOrdersList((prevOrders) => [newOrder, ...prevOrders]);
    
    setActiveCartItems([]);
    setSelectedOrder(newOrder);
    setCurrentView('order_details');
    setActiveTab('orders');
    window.scrollTo(0, 0);
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrdersList((prevOrders) =>
      prevOrders.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleUpdateUser = (updatedDetails) => {
    setUser(updatedDetails);
    localStorage.setItem('mahadev_customer_details', JSON.stringify(updatedDetails));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'home' || tab === 'menu') {
      setCurrentView('home');
    } else if (tab === 'orders') {
      setCurrentView('orders_list');
    } else if (tab === 'profile') {
      setCurrentView('profile');
    }
    window.scrollTo(0, 0);
  };

  if (loading) return null;

  if (!user) {
    return <Login onLoginSuccess={(userDetails) => setUser(userDetails)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div className="flex-1 pb-20">
        {currentView === 'checkout' && (
          <Checkout
            user={user}
            cartItems={activeCartItems}
            onBackToMenu={handleBackToMenu}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentView === 'orders_list' && (
          <OrdersList
            orders={ordersList}
            onSelectOrder={(order) => {
              setSelectedOrder(order);
              setCurrentView('order_details');
              window.scrollTo(0, 0);
            }}
            onReorder={(previousItems) => {
              setActiveCartItems(previousItems);
              setCurrentView('checkout');
              window.scrollTo(0, 0);
            }}
            onGoToMenu={handleBackToMenu}
          />
        )}

        {currentView === 'order_details' && (
          <OrderSuccess
            orderDetails={selectedOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onGoToMenu={handleBackToMenu}
            onBackToMenu={() => {
              setCurrentView('orders_list');
              window.scrollTo(0, 0);
            }}
          />
        )}

        {currentView === 'profile' && (
          <Profile
            user={user}
            onUpdateUser={handleUpdateUser}
            onLogout={() => {
              localStorage.removeItem('mahadev_customer_details');
              setOrdersList([]);
              setSelectedOrder(null);
              setUser(null);
            }}
            onBackToMenu={handleBackToMenu}
          />
        )}

        {currentView === 'home' && (
          <Home 
            user={user} 
            activeOrder={ordersList[0]}
            onLogout={() => {
              localStorage.removeItem('mahadev_customer_details');
              setOrdersList([]);
              setSelectedOrder(null);
              setUser(null);
            }} 
            onGoToCheckout={handleGoToCheckout}
          />
        )}
      </div>

      {/* PWA Floating Install Prompt */}
      <InstallPwaBanner />

      {/* Global 2-Tab Bottom Navigation Bar */}
      {currentView !== 'checkout' && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          hasActiveOrder={ordersList.length > 0}
        />
      )}
    </div>
  );
}
