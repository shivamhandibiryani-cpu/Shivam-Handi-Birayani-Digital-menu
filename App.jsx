
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerView from './views/CustomerView';
import OwnerDashboard from './views/OwnerDashboard';
import { deServices } from './deServices';

const BrewingMessages = [
  "Heating the handi...",
  "Marinating the chicken...",
  "Frying the onions...",
  "Adding spices...",
  "Cooking the rice...",
  "Mixing the biryani...",
  "Serving hot biryani..."
];

const ChefLoading = ({ progress }) => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % BrewingMessages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF5E6] relative overflow-hidden">
      {/* Background Floating Spices */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="spice-particle top-[20%] left-[10%] animate-float-slow">🍃</div>
        <div className="spice-particle top-[40%] right-[15%] animate-float-mid text-xl">✨</div>
        <div className="spice-particle bottom-[30%] left-[25%] animate-float-fast">🌿</div>
        <div className="spice-particle top-[15%] right-[30%] animate-float-slow text-2xl">☕</div>
        <div className="spice-particle bottom-[15%] right-[10%] animate-float-mid">🧂</div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-10">
        {/* Animated Tea Cup */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-10">
          {/* Steam */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-3">
            <div className="w-1.5 h-8 bg-[#4B3621]/15 rounded-full animate-steam-1"></div>
            <div className="w-1.5 h-10 bg-[#4B3621]/25 rounded-full animate-steam-2"></div>
            <div className="w-1.5 h-6 bg-[#4B3621]/15 rounded-full animate-steam-3"></div>
          </div>
          
          {/* Cup Silhouette */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-20 sm:w-28 sm:h-24 bg-[#4B3621] rounded-b-[2.5rem] rounded-t-lg shadow-2xl relative">
            <div className="absolute -right-6 top-4 w-10 h-12 border-[6px] border-[#4B3621] rounded-full"></div>
            <div className="absolute  inset-0 flex items-center justify-center opacity-90">
               <img src="https://res.cloudinary.com/doqq0vdxn/image/upload/v1770897018/logo.jpg" alt="Shivam Handi Biryani Logo" className="w-22 h-12 rounded-full object-cover" />
            </div>
          </div>
          
          {/* Saucer */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-3 bg-[#4B3621]/10 rounded-full"></div>
        </div>

        {/* Brand & Progress Bar */}
        <div className="text-center w-full space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#4B3621] tracking-tight">Shivam Handi Biryani</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4B3621]/40">Best Biryani in Janakpur</p>
          </div>

          {/* Literal Loading Bar */}
          <div className="relative w-full h-1.5 bg-[#4B3621]/5 rounded-full overflow-hidden border border-[#4B3621]/5 shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full bg-[#4F7942] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,121,66,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="h-6 overflow-hidden">
            <p className="text-xs sm:text-sm font-serif italic text-[#D4A373] animate-message-swap">
              {BrewingMessages[msgIdx]}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(15px, -20px) rotate(10deg); }
          66% { transform: translate(-10px, -40px) rotate(-10deg); }
        }
        @keyframes steam {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          50% { opacity: 0.6; transform: translateY(-20px) scaleX(1.2); }
          100% { transform: translateY(-40px) scaleX(1.5); opacity: 0; }
        }
        @keyframes message-swap {
          0%, 100% { transform: translateY(20px); opacity: 0; }
          15%, 85% { transform: translateY(0); opacity: 1; }
        }
        .spice-particle { position: absolute; will-change: transform; }
        .animate-float-slow { animation: float-slow 12s infinite ease-in-out; }
        .animate-float-mid { animation: float-slow 8s infinite ease-in-out reverse; }
        .animate-float-fast { animation: float-slow 6s infinite ease-in-out; }
        .animate-steam-1 { animation: steam 3s infinite ease-out; }
        .animate-steam-2 { animation: steam 3s infinite 1s ease-out; }
        .animate-steam-3 { animation: steam 3s infinite 2s ease-out; }
        .animate-message-swap { animation: message-swap 1.8s infinite; }
      `}</style>
    </div>
  );
};

const App = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    const initApp = async () => {
      // Progress incrementer for the visual bar
      const progressTimer = setInterval(() => {
        setLoadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + 1;
        });
      }, 22); // Reaches 100% in ~2.2 seconds

      try {
        const [m, o, h] = await Promise.all([
          deServices.getMenu(),
          deServices.getOrders(),
          deServices.getHistory()
        ]);
        setMenuItems(m);
        setOrders(o);
        setHistory(h);
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        // Ensure the bar finishes before we stop loading
        setTimeout(() => {
          setLoading(false);
          clearInterval(progressTimer);
        }, 2500);
      }
    };
    initApp();
  }, []);

  const handleUpdateMenu = async (newMenu) => {
    setMenuItems(newMenu);
    // Menu updates are handled individually in OwnerDashboard
  };

  const handleAddOrder = async (order) => {
    try {
      const newOrder = await deServices.addOrder(order);
      setOrders(prev => [newOrder, ...prev]);
    } catch (err) {
      console.error("Failed to add order:", err);
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await deServices.updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleArchiveOrder = async (id) => {
    const target = orders.find(o => o.id === id);
    if (target) {
      try {
        await deServices.archiveOrder(target);
        setOrders(prev => prev.filter(o => o.id !== id));
        setHistory(prev => [target, ...prev]);
      } catch (err) {
        console.error("Failed to archive order:", err);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      const [o, h] = await Promise.all([
        deServices.getOrders(),
        deServices.getHistory()
      ]);
      setOrders(o);
      setHistory(h);
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  };

  if (loading) {
    return <ChefLoading progress={loadProgress} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/" 
          element={<CustomerView menuItems={menuItems} onOrder={handleAddOrder} />} 
        />
        <Route
          path="/owner"
          element={
            <OwnerDashboard
              menuItems={menuItems}
              orders={orders}
              history={history}
              onUpdateMenu={handleUpdateMenu}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onArchiveOrder={handleArchiveOrder}
              onRefresh={handleRefresh}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
