
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, THEME, DEFAULT_FOOD_IMAGE } from '../constants';
import { gemini } from '../services/geminiService';
import { deServices } from '../deServices';

const Icons = {
  Star: ({ filled }) => (
    <svg className={`w-3 h-3 sm:w-4 h-4 ${filled ? 'text-[#D4A373]' : 'text-[#4B3621]/10'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  Sparkle: () => (
    <svg className="w-4 h-4 text-[#D4A373]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-24 h-24 sm:w-32 sm:h-32 text-[#4F7942]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  )
};

const getOptimizedUrl = (url, width) => {
  if (!url) return DEFAULT_FOOD_IMAGE;
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&q=80&w=${width}`;
  }
  return url;
};

const OptimizedImage = ({ src, alt, className, width = 600 }) => {
  const [imgSrc, setImgSrc] = useState(getOptimizedUrl(src, width));
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(DEFAULT_FOOD_IMAGE);
    }
  };


  return (
    <div className={`relative overflow-hidden bg-[#F5E6D3] ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-8 h-8 border-2 border-[#4B3621]/10 border-t-[#4B3621] rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

const CustomerView = ({ menuItems, onOrder }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [search, setSearch] = useState('');
  const [badgePop, setBadgePop] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecBanner, setShowRecBanner] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [extraToppings, setExtraToppings] = useState('');
  const [lastTableNumber, setLastTableNumber] = useState('T-04');
  const [myOrdersModal, setMyOrdersModal] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [aiHelperOpen, setAiHelperOpen] = useState(false);
  const [aiHelperLoading, setAiHelperLoading] = useState(false);
  const [aiHelperResponse, setAiHelperResponse] = useState('');
  const [aiPreferences, setAiPreferences] = useState('');
  const [aiBudget, setAiBudget] = useState('');
  const [aiOccasion, setAiOccasion] = useState('casual dinner');

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    if (cartCount > 0) {
      setBadgePop(true);
      const timer = setTimeout(() => setBadgePop(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                           item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, search]);

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const itemNames = cart.map(item => item.name);
    const newOrder = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      items: [...cart],
      total: cartTotal,
      status: 'Pending',
      tableNumber: tableNumber,
      customerName: customerName,
      contactNumber: contactNumber,
      extraToppings: extraToppings,
      createdAt: new Date().toISOString()
    };
    onOrder(newOrder);
    // Store order ID in local storage
    const storedOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
    storedOrders.push(newOrder.id);
    localStorage.setItem('myOrders', JSON.stringify(storedOrders));
    setCart([]);
    setIsCartOpen(false);
    setShowConfirmModal(false);
    setOrderComplete(true);
    setCustomerName('');
    setContactNumber('');
    setTableNumber('');
    setExtraToppings('');
    try {
      const suggestions = await gemini.getSmartRecommendations(itemNames);
      if (suggestions && suggestions.length > 0) setRecommendations(suggestions);
    } catch (err) { console.error("AI Recommendation Error:", err); }
  };

  const handleDismissOrderOverlay = () => {
    setOrderComplete(false);
    if (recommendations.length > 0) setShowRecBanner(true);
  };

  const loadMyOrders = async () => {
    try {
      const storedOrderIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
      if (storedOrderIds.length === 0) {
        setMyOrders([]);
        return;
      }
      const [activeOrders, historyOrders] = await Promise.all([
        deServices.getOrders(),
        deServices.getHistory()
      ]);
      const allOrders = [...activeOrders, ...historyOrders];
      const myOrdersFiltered = allOrders.filter(order => storedOrderIds.includes(order.id));
      setMyOrders(myOrdersFiltered);
    } catch (err) {
      console.error("Failed to load my orders:", err);
      setMyOrders([]);
    }
  };

const openMyOrders = () => {
    loadMyOrders();
    setMyOrdersModal(true);
  };

  const handleAiHelperSubmit = async () => {
    if (!aiPreferences.trim()) return;
    setAiHelperLoading(true);
    try {
      const response = await gemini.getMenuRecommendation(aiPreferences, aiBudget, aiOccasion);
      setAiHelperResponse(response);
    } catch (error) {
      console.error("AI Helper Error:", error);
      setAiHelperResponse("Sorry, I'm having trouble helping right now. Please try again!");
    } finally {
      setAiHelperLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF5E6] text-[#4B3621] font-sans pb-20 sm:pb-0">
      <header className="sticky top-0 z-50 bg-[#FDF5E6]/90 backdrop-blur-xl border-b border-[#4B3621]/10 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#4B3621] leading-none tracking-tight">Shivam Handi Biryani</h1>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#4F7942] mt-1.5 opacity-80">Best Biryani in Janakpur</p>
          </div>
<div className="flex items-center gap-2 sm:gap-3">
          {/* Future feature buttons - currently hidden
            <Link to="/owner" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#4B3621]/40 hover:text-[#4B3621] transition-all ">
               Dashboard
             </Link> */}
             <button
              onClick={() => setAiHelperOpen(true)}
              className="relative bg-gradient-to-br from-[#D4A373] to-[#4F7942] text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-[#4F7942]/30 transition-all active:scale-95 hover:scale-105"
              title="Ask for recommendations"
              hidden
            >
              <svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse"></span>
            </button>
             <button
              onClick={openMyOrders}
              className="bg-[#4B3621] text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-[#4B3621]/20 transition-all active:scale-95"
              hidden
            >
              <svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
             <button
              onClick={() => setIsCartOpen(true)}
              className={`relative bg-[#4B3621] text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl shadow-[#4B3621]/20 transition-all active:scale-95 ${badgePop ? 'scale-110' : 'scale-100'}`}
              hidden
            >
              <svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-[#4F7942] text-white text-[10px] font-black w-5 h-5 sm:w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#FDF5E6] transition-all duration-300 ${badgePop ? 'scale-125 bg-green-500' : 'scale-100'}`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="px-4 sm:px-6 py-6 sm:py-10 max-w-7xl mx-auto animate-fade-in">
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-white/60 shadow-inner flex flex-col md:flex-row items-center gap-8 sm:gap-10">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-[#4B3621] rounded-full flex items-center justify-center text-[#FDF5E6] shadow-2xl relative z-10 transform group-hover:rotate-12 transition-transform duration-500">
            <img src="https://res.cloudinary.com/doqq0vdxn/image/upload/v1770897018/logo.jpg" alt="Shivam Handi Biryani Logo" className="w-full h-full object-contain rounded-full" />
              <div className="absolute -inset-2 border-2 border-dashed border-[#4B3621]/20 rounded-full animate-spin-slow"></div>
            </div>
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-xl sm:text-2xl animate-pulse text-[#D4A373]">
              <Icons.Sparkle />
            </div>
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4F7942]/10 rounded-full text-[#4F7942] text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-[#4F7942]/20 mb-1">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#4F7942] animate-pulse"></span>
              Himalayan Spring Flush
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#4B3621] leading-tight">
              Authentic <span className="italic text-[#D4A373]">Handi Biryani</span> <br className="hidden sm:block"/>
              from Janakpur.
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-[#4B3621]/60 max-w-lg leading-relaxed italic font-medium">
               We bring the authentic flavors of Janakpur to your plate. Every spice is hand-selected, every biryani is freshly made.
             </p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        <div className="relative group max-w-3xl">
          <input 
            type="text" 
            placeholder="Search our menu items here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-[#4B3621]/5 rounded-[1.5rem] sm:rounded-[2rem] px-6 sm:px-10 py-4 sm:py-6 text-lg sm:text-xl font-medium outline-none focus:border-[#4B3621]/20 focus:ring-8 focus:ring-[#4B3621]/5 transition-all shadow-sm"
          />
          <div className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 text-[#4B3621]/20 group-focus-within:text-[#4B3621] transition-colors">
            <svg className="w-6 h-6 sm:w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </section>

      <nav className="sticky top-[92px] sm:top-[96px] z-40 bg-[#FDF5E6]/80 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-5 border-b border-[#4B3621]/5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex gap-3 sm:gap-4 scroll-smooth">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-black tracking-tight transition-all duration-300 ${
                activeCategory === cat ? 'bg-[#4B3621] text-white shadow-xl shadow-[#4B3621]/20 scale-105' : 'bg-white text-[#4B3621]/50 hover:text-[#4B3621] border border-[#4B3621]/10 hover:border-[#4B3621]/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-4 sm:px-6 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-10">
          {filteredItems.map(item => (
            <div key={item.id} className="group bg-white rounded-[1.7rem] sm:rounded-[2rem] p-1 sm:p-5 border border-[#4B3621]/5 hover:border-[#D4A373]/30 shadow-sm hover:shadow-2xl hover:shadow-[#4B3621]/20 transition-all duration-500 flex flex-col h-full relative overflow-hidden hover:scale-[1.02] transform-gpu">
              <button 
                onClick={() => setSelectedDetailItem(item)}
                className="relative aspect-[4/5] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-gray-50 mb-4 sm:mb-6 w-full cursor-pointer focus:outline-none"
              >
                <OptimizedImage src={item.image} alt={item.name} width={600} className="w-full h-full group-hover:scale-110 transition-transform duration-1000 ease-out" />
                <div className="absolute top-2 left-2 sm:top-5 left-5 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black text-[#4B3621] flex items-center gap-1 sm:gap-1.5 shadow-sm">
                  <Icons.Star filled /> {item.rating}
                </div>
                <div className="absolute bottom-2 right-2
                 sm:bottom-5 sm:right-5 bg-[#4F7942] text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                  Rs.{item.price}
                </div>
              </button>
              <div className="flex flex-col flex-1 px-1 sm:px-2">
                <h3 onClick={() => setSelectedDetailItem(item)} className="text-xs sm:text-2xl font-serif font-bold text-[#4B3621] mb-1 sm:mb-2 group-hover:text-[#D4A373] transition-colors cursor-pointer">{item.name}</h3>
                <p className="text-[11px] sm:text-sm text-[#4B3621]/60 leading-relaxed flex-1 italic line-clamp-2 mb-2 sm:mb-6">{item.description}</p>
                <button onClick={() => addToCart(item)} className="w-full bg-[#4B3621] text-white py-2 sm:py-5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm uppercase tracking-widest flex justify-center items-center gap-2 mb-1 sm:gap-3 shadow-lg shadow-[#4B3621]/10 hidden"><span>+</span> Add to Tray</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {selectedDetailItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto">
           <div className="fixed inset-0 bg-[#2D1B10]/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedDetailItem(null)} />
           <div className="relative bg-[#FDF5E6] w-full max-w-5xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in my-auto">
              <div className="h-64 sm:h-80 md:h-auto md:w-1/2 relative bg-[#4B3621] shrink-0">
                 <OptimizedImage src={selectedDetailItem.image} alt={selectedDetailItem.name} width={1200} className="w-full h-full opacity-90" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B10]/60 to-transparent"></div>
                 <button onClick={() => setSelectedDetailItem(null)} className="absolute top-4 left-4 sm:top-8 sm:left-8 p-3 sm:p-4 bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-xl sm:rounded-2xl z-20"><svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
                 <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 text-white z-10 pr-6">
                    <span className="bg-[#4F7942] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3 inline-block">{selectedDetailItem.category}</span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold leading-tight">{selectedDetailItem.name}</h2>
                 </div>
              </div>
              <div className="flex-1 p-6 sm:p-10 md:p-16 flex flex-col justify-center">
                 <div className="flex justify-between items-start mb-6 sm:mb-8">
                    <div className="flex items-center gap-1.5 sm:gap-1">
                       {[...Array(5)].map((_, i) => <Icons.Star key={i} filled={i < Math.floor(selectedDetailItem.rating)} />)}
                       <span className="text-xs sm:text-sm font-black text-[#4B3621]/40 ml-2">({selectedDetailItem.rating})</span>
                    </div>
                 </div>
                 <div className="space-y-6 sm:space-y-8 flex-1">
                    <p className="text-lg sm:text-xl lg:text-2xl text-[#4B3621]/80 leading-relaxed italic font-medium">"{selectedDetailItem.description}"</p>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4">
                       <div className="bg-white/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white">
                          <span className="text-[8px] sm:text-[10px] font-black text-[#4B3621]/30 uppercase tracking-widest block mb-1 sm:mb-2">Artisan Price</span>
                          <span className="text-xl sm:text-3xl font-serif font-bold text-[#4F7942]">Rs. {selectedDetailItem.price}</span>
                       </div>
                       <div className="bg-white/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white">
                          <span className="text-[8px] sm:text-[10px] font-black text-[#4B3621]/30 uppercase tracking-widest block mb-1 sm:mb-2">Prep Time</span>
                          <span className="text-xl sm:text-3xl font-serif font-bold text-[#4B3621]">{selectedDetailItem.prepTime || 12} min</span>
                       </div>
                    </div>
                 </div>
                 <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button onClick={() => { addToCart(selectedDetailItem); setSelectedDetailItem(null); }} className="flex-1 bg-[#4B3621] text-white py-5 sm:py-6 rounded-xl sm:rounded-[2rem] text-lg sm:text-xl font-black shadow-2xl shadow-[#4B3621]/30" hidden>Add to Tray</button>
                    <button onClick={() => setSelectedDetailItem(null)} className="px-8 sm:px-10 py-5 sm:py-6 border-2 border-[#4B3621]/10 rounded-xl sm:rounded-[2rem] font-black text-[#4B3621]/50">Close</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-[#2D1B10]/70 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full sm:max-w-lg bg-[#FDF5E6] h-full shadow-2xl animate-slide-left p-6 sm:p-10 flex flex-col border-l border-[#4B3621]/10">
            <div className="flex justify-between items-center mb-8 sm:mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4B3621]">Your Tray</h2>
                <div className="flex items-center gap-2 mt-1 sm:mt-2 opacity-50">
                  <span className="w-2 h-2 rounded-full bg-[#4F7942] animate-pulse"></span>
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Table {lastTableNumber} Order</p>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-[#4B3621]/10 text-[#4B3621] shadow-sm"><svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 no-scrollbar pr-2 pb-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-dashed border-[#4B3621] flex items-center justify-center"><svg className="w-12 h-12 sm:w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
                  <p className="font-serif italic text-xl sm:text-2xl text-center">Your tray is empty.</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={item.id} className="bg-white rounded-[1.8rem] p-4 sm:p-5 border border-[#4B3621]/5 flex gap-4 sm:gap-5 items-center shadow-md animate-tray-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="relative overflow-hidden w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shrink-0 shadow-inner"><OptimizedImage src={item.image} alt={item.name} width={200} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 flex flex-col justify-between h-full min-h-[5rem] sm:min-h-[6rem]">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-black text-[#4B3621] text-sm sm:text-base leading-tight flex-1 line-clamp-1">{item.name}</h4>
                          <p className="text-[9px] sm:text-[10px] font-black text-[#4F7942] shrink-0">Rs.{item.price * item.quantity}</p>
                        </div>
                        <p className="text-[8px] sm:text-[9px] font-bold text-[#4B3621]/40 uppercase tracking-widest mt-0.5">{item.category}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                         <div className="flex items-center bg-[#FDF5E6] rounded-xl border border-[#4B3621]/5 shadow-inner">
                            <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-black text-red-400">-</button>
                            <span className="w-8 sm:w-9 text-center font-black text-[#4B3621] text-xs sm:text-sm">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-black text-green-400">+</button>
                         </div>
                         <button onClick={() => updateQty(item.id, -item.quantity)} className="text-[9px] sm:text-[10px] font-black text-red-200 hover:text-red-500 uppercase tracking-widest transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-6 sm:pt-10 border-t-2 border-dashed border-[#4B3621]/10 mt-4 sm:mt-6 space-y-6 sm:space-y-8">
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <span className="text-[9px] sm:text-[10px] font-black text-[#4B3621]/40 uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="text-2xl sm:text-4xl font-serif font-bold text-[#4B3621]">Rs. {cartTotal}</span>
                </div>
              </div>
              <button onClick={() => setShowConfirmModal(true)} disabled={cart.length === 0} className="w-full bg-[#4B3621] text-white py-5 sm:py-6 rounded-2xl sm:rounded-[2.5rem] font-black text-lg sm:text-xl shadow-2xl active:scale-95 transition-all">Confirm Tray & Brew</button>
            </div>
          </div>
        </div>
      )}

      {orderComplete && (
        <div className="fixed inset-0 z-[200] bg-[#FDF5E6] flex flex-col items-center justify-center p-8 sm:p-12 text-center animate-fade-in">
          <div className="w-40 h-40 sm:w-56 sm:h-56 bg-[#4F7942]/10 rounded-full flex items-center justify-center mb-8 sm:mb-10 relative">
            <div className="absolute inset-0 rounded-full border-4 border-[#4F7942]/20 animate-ping"></div>
            <Icons.Check />
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#4B3621] mb-4 sm:mb-6">Order Brewing!</h2>
          <p className="text-sm sm:text-lg text-[#4B3621]/60 max-w-md leading-relaxed mb-10 sm:mb-12">Handcrafted with love. We'll bring it straight to <span className="text-[#4B3621] font-black underline decoration-wavy underline-offset-8">Table {lastTableNumber}</span>.</p>
          <button onClick={handleDismissOrderOverlay} className="bg-[#4B3621] text-white px-12 sm:px-16 py-4 sm:py-5 rounded-full font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-[#4B3621]/20">Wonderful</button>
        </div>
      )}

      {showRecBanner && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-[150] animate-slide-up">
           <div className="bg-[#4B3621] text-[#FDF5E6] p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-[#D4A373]/20 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FDF5E6]/10 rounded-full flex items-center justify-center text-xl sm:text-2xl text-[#D4A373]"><Icons.Sparkle /></div>
                 <div><h5 className="font-serif font-bold text-base sm:text-lg text-center md:text-left">You might also love...</h5><div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">{recommendations.map((rec, i) => <span key={i} className="bg-[#FDF5E6]/10 px-2.5 py-1 rounded-full text-[9px] sm:text-xs font-bold border border-[#FDF5E6]/5 whitespace-nowrap">{rec}</span>)}</div></div>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
                 <button onClick={() => setShowRecBanner(false)} className="bg-[#FDF5E6]/10 hover:bg-[#FDF5E6]/20 px-5 sm:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex-1">Dismiss</button>
                 <button onClick={() => { setSearch(recommendations[0]); setShowRecBanner(false); }} className="bg-[#D4A373] text-[#4B3621] hover:bg-[#E5B484] px-6 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex-1">See More</button>
              </div>
           </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#2D1B10]/80 backdrop-blur-md animate-fade-in" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-[#FDF5E6] w-full max-w-md rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-scale-in">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#4B3621] mb-6 text-center">Confirm Your Order</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-white border-2 border-[#4B3621]/10 rounded-xl px-4 py-3 text-[#4B3621] font-medium outline-none focus:border-[#4B3621]/30"
              />
              <input
                type="number"
                placeholder="Contact Number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full bg-white border-2 border-[#4B3621]/10 rounded-xl px-4 py-3 text-[#4B3621] font-medium outline-none focus:border-[#4B3621]/30"
              />
              <input
                type="number"
                placeholder="Table Number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full bg-white border-2 border-[#4B3621]/10 rounded-xl px-4 py-3 text-[#4B3621] font-medium outline-none focus:border-[#4B3621]/30"
              />
              <textarea
                placeholder="Extra Toppings (optional)"
                value={extraToppings}
                onChange={(e) => setExtraToppings(e.target.value)}
                className="w-full bg-white border-2 border-[#4B3621]/10 rounded-xl px-4 py-3 text-[#4B3621] font-medium outline-none focus:border-[#4B3621]/30 resize-none"
                rows="3"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-[#4B3621]/10 text-[#4B3621] py-3 rounded-xl font-black uppercase tracking-widest text-sm"
              >
                Cancel
              </button>
              <button
                onClick={placeOrder}
                disabled={!customerName || !contactNumber || !tableNumber}
                className="flex-1 bg-[#4B3621] text-white py-3 rounded-xl font-black uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {myOrdersModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#2D1B10]/80 backdrop-blur-md animate-fade-in" onClick={() => setMyOrdersModal(false)} />
          <div className="relative bg-[#FDF5E6] w-full max-w-2xl rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-scale-in max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#4B3621]">My Orders</h3>
              <button onClick={() => setMyOrdersModal(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {myOrders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-[#4B3621]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-lg font-serif italic text-[#4B3621]/60">No orders found.</p>
                <p className="text-sm text-[#4B3621]/40 mt-2">Place your first order to see it here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-[1.5rem] p-6 border border-[#4B3621]/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Order #{order.id}</p>
                        <p className="text-sm font-bold text-[#4B3621]">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          order.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                          order.status === 'Preparing' ? 'bg-blue-50 text-blue-700' :
                          order.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-lg font-bold text-[#4F7942] mt-2">Rs. {order.total}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-[#4B3621]">{item.quantity}x {item.name}</span>
                          <span className="text-[#4B3621]/60">Rs. {item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#4B3621]/5 flex justify-between text-xs text-[#4B3621]/60">
                      <span>Table: {order.tableNumber}</span>
                      <span>{order.customerName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {aiHelperOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#2D1B10]/80 backdrop-blur-md animate-fade-in" onClick={() => { setAiHelperOpen(false); setAiHelperResponse(''); }} />
          <div className="relative bg-[#FDF5E6] w-full max-w-lg rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D4A373] to-[#4F7942] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#4B3621]">Menu Assistant</h3>
                  <p className="text-[10px] text-[#4B3621]/50 font-medium">Get personalized recommendations</p>
                </div>
              </div>
              <button onClick={() => { setAiHelperOpen(false); setAiHelperResponse(''); }} className="text-[#4B3621]/30 hover:text-[#4B3621] transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#4B3621]/40 uppercase tracking-widest block mb-2">What do you like?</label>
                <input type="text" placeholder="e.g., spicy food, chicken, vegetarian..." value={aiPreferences} onChange={(e) => setAiPreferences(e.target.value)} className="w-full bg-white border-2 border-[#4B3621]/10 rounded-xl px-4 py-3 text-[#4B3621] font-medium outline-none focus:border-[#4B3621]/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#4B3621]/40 uppercase tracking-widest block mb-2">Budget</label>
                  <input type="text" placeholder="e.g., 500 rupees" value={aiBudget} onChange={(e) => setAiBudget(e.target.value)} className="w-full bg-white border-2 border-[#4B3621]/10 rounded-xl px-4 py-3 text-[#4B3621] font-medium outline-none focus:border-[#4B3621]/30" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#4B3621]/40 uppercase tracking-widest block mb-2">Occasion</label>
                  <select value={aiOccasion} onChange={(e) => setAiOccasion(e.target.value)} className="w-full bg-white border-2 border-[#4B3621]/10 rounded-xl px-4 py-3 text-[#4B3621] font-medium outline-none focus:border-[#4B3621]/30">
                    <option value="casual dinner">Casual Dinner</option>
                    <option value="family gathering">Family Gathering</option>
                    <option value="date night">Date Night</option>
                    <option value="party">Party</option>
                    <option value="quick lunch">Quick Lunch</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAiHelperSubmit} disabled={!aiPreferences.trim() || aiHelperLoading} className="w-full bg-gradient-to-r from-[#D4A373] to-[#4F7942] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {aiHelperLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Getting Recommendation...</>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Get Recommendation</>)}
              </button>
              {aiHelperResponse && (
                <div className="bg-white rounded-[1.5rem] p-5 border border-[#4B3621]/10 shadow-inner mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-[#4F7942]/10 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#4F7942]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </div>
                    <span className="text-[10px] font-black text-[#4F7942] uppercase tracking-widest">Chef's Recommendation</span>
                  </div>
                  <p className="text-[#4B3621] font-medium leading-relaxed italic">"{aiHelperResponse}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-left { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slide-up { from { transform: translateY(150%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes tray-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-tray-in { animation: tray-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-left { animation: slide-left 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
      {/* Footer Section */}
      <footer className="bg-[#4B3621] text-[#FDF5E6] mt-16 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {/* Restaurant Info */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#D4A373]">Shivam Handi Biryani</h3>
              <p className="text-sm text-[#FDF5E6]/60 italic leading-relaxed">
                Authentic Handi Biryani from Janakpur. Bringing traditional flavors to your plate since 2010.
              </p>
              <div className="flex items-center gap-2 text-sm text-[#FDF5E6]/80">
                <svg className="w-4 h-4 text-[#D4A373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Janakpur, Nepal</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#FDF5E6]/80">
                <svg className="w-4 h-4 text-[#D4A373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+977 982-2039382</span>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#D4A373]">Operating Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#FDF5E6]/60">Monday - Thursday</span>
                  <span className="text-[#FDF5E6]/80">10:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FDF5E6]/60">Friday - Saturday</span>
                  <span className="text-[#FDF5E6]/80">10:00 AM - 11:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FDF5E6]/60">Sunday</span>
                  <span className="text-[#FDF5E6]/80">11:00 AM - 10:00 PM</span>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4F7942] animate-pulse"></span>
                  <span className="text-sm text-[#4F7942] font-medium">Currently Open</span>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#D4A373]">Follow Us</h3>
              <p className="text-sm text-[#FDF5E6]/60">
                Stay connected for updates, special offers, and mouth-watering recipes!
              </p>
              <div className="flex gap-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#FDF5E6]/10 rounded-full flex items-center justify-center text-[#FDF5E6] hover:bg-[#D4A373] hover:text-[#4B3621] transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/shivam_handi_biryani2023" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#FDF5E6]/10 rounded-full flex items-center justify-center text-[#FDF5E6] hover:bg-[#D4A373] hover:text-[#4B3621] transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@shivamhandibiryani" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#FDF5E6]/10 rounded-full flex items-center justify-center text-[#FDF5E6] hover:bg-[#D4A373] hover:text-[#4B3621] transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
                <a href="https://wa.me/9779822039382" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#FDF5E6]/10 rounded-full flex items-center justify-center text-[#FDF5E6] hover:bg-[#4F7942] hover:text-white transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-[#FDF5E6]/10 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-[#FDF5E6]/60">
                &copy; {new Date().getFullYear()} Shivam Handi Biryani. All rights reserved.
              </p>
              <p className="text-sm text-[#FDF5E6]/60">
                Digital Menu Made By <i><a href="https://taigra-nexus-lab.onrender.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4A373] transition-colors">Taigra Nexus Labs Pvt. Ltd.</a></i>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerView;
