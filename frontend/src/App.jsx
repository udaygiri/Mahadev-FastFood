import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrdersList from './pages/OrdersList';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'checkout' | 'orders_list' | 'order_details' | 'profile'
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders' | 'profile'
  const [activeCartItems, setActiveCartItems] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('mahadev_customer_details');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedOrders = localStorage.getItem('mahadev_orders_list');
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders);
      setOrdersList(parsedOrders);
      if (parsedOrders.length > 0) {
        setSelectedOrder(parsedOrders[0]);
      }
    }

    setLoading(false);
  }, []);

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
    const updatedOrders = [newOrder, ...ordersList];
    setOrdersList(updatedOrders);
    localStorage.setItem('mahadev_orders_list', JSON.stringify(updatedOrders));
    
    setActiveCartItems([]);
    setSelectedOrder(newOrder);
    setCurrentView('order_details');
    setActiveTab('orders');
    window.scrollTo(0, 0);
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
              localStorage.removeItem('mahadev_orders_list');
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
              localStorage.removeItem('mahadev_orders_list');
              setOrdersList([]);
              setSelectedOrder(null);
              setUser(null);
            }} 
            onGoToCheckout={handleGoToCheckout}
          />
        )}
      </div>

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
