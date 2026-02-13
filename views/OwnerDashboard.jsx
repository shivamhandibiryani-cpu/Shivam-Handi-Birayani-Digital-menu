import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { gemini } from '../services/geminiService';
import { deServices } from '../deServices';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const Icons = {
  Catalog: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Orders: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Stats: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Sparkle: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" /></svg>,
  Refresh: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
};

const OwnerDashboard = ({
  menuItems, orders, history, onUpdateMenu, onUpdateOrderStatus, onArchiveOrder, onRefresh
}) => {
  const [tab, setTab] = useState('catalog');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', price: 0, category: 'Biryani', description: '', prepTime: 12 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [orderDetailsModal, setOrderDetailsModal] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [ordersRefSearch, setOrdersRefSearch] = useState('');
  const [ordersNameSearch, setOrdersNameSearch] = useState('');
  const [ordersContactSearch, setOrdersContactSearch] = useState('');
  const [ordersTableSearch, setOrdersTableSearch] = useState('');
  const [historyRefSearch, setHistoryRefSearch] = useState('');
  const [historyNameSearch, setHistoryNameSearch] = useState('');
  const [historyContactSearch, setHistoryContactSearch] = useState('');
  const [historyTableSearch, setHistoryTableSearch] = useState('');
  const [historyTimeSearch, setHistoryTimeSearch] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef(false);
  const printButtonRef = useRef(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrinting(false);
      printRef.current = false;
      setOrderDetailsModal(null); // Close the modal after printing
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Aggregated Stats
  const stats = CATEGORIES.filter(c => c !== 'All').map(cat => ({
    name: cat,
    total: [...orders, ...history]
      .reduce((acc, o) => {
        const catTotal = o.items
          .filter(i => i.category === cat)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return acc + catTotal;
      }, 0)
  }));

  const totalRevenue = [...orders, ...history].reduce((sum, o) => sum + o.total, 0);

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    (ordersRefSearch === '' || o.id.toLowerCase().includes(ordersRefSearch.toLowerCase())) &&
    (ordersNameSearch === '' || o.customerName?.toLowerCase().includes(ordersNameSearch.toLowerCase())) &&
    (ordersContactSearch === '' || o.contactNumber?.includes(ordersContactSearch)) &&
    (ordersTableSearch === '' || o.tableNumber?.includes(ordersTableSearch))
  );

  const filteredHistory = history.filter(o =>
    (historyRefSearch === '' || o.id.toLowerCase().includes(historyRefSearch.toLowerCase())) &&
    (historyNameSearch === '' || o.customerName?.toLowerCase().includes(historyNameSearch.toLowerCase())) &&
    (historyContactSearch === '' || o.contactNumber?.includes(historyContactSearch)) &&
    (historyTableSearch === '' || o.tableNumber?.includes(historyTableSearch)) &&
    (historyTimeSearch === '' || new Date(o.createdAt).toLocaleDateString().toLowerCase().includes(historyTimeSearch.toLowerCase()) ||
     new Date(o.createdAt).toLocaleTimeString().toLowerCase().includes(historyTimeSearch.toLowerCase()))
  );

  const handleDelete = async (id) => {
    if (confirm("Permanently remove this item from the menu?")) {
      try {
        await deServices.deleteMenuItem(id);
        onUpdateMenu(menuItems.filter(i => i.id !== id));
      } catch (err) {
        console.error("Failed to delete item:", err);
        alert("Failed to delete item. Please try again.");
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingItemId(item.id);
    setNewItem(item);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (newItem.name && newItem.price) {
      try {
        if (editingItemId) {
          const updatedItem = await deServices.updateMenuItem(editingItemId, newItem);
          onUpdateMenu(menuItems.map(m => m.id === editingItemId ? updatedItem : m));
        } else {
          const item = {
            name: newItem.name,
            price: newItem.price,
            category: newItem.category,
            description: newItem.description || '',
            rating: newItem.rating,
            prepTime: newItem.prepTime,
            image: newItem.image || `https://images.unsplash.com/photo-1544787210-282bbd37701e?auto=format&fit=crop&q=80&w=400`
          };
          const newItemFromAPI = await deServices.addMenuItem(item);
          onUpdateMenu([...menuItems, newItemFromAPI]);
        }
        closeModal();
      } catch (err) {
        console.error("Failed to save item:", err);
        alert("Failed to save item. Please try again.");
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItemId(null);
    setNewItem({ name: '', price: 0, category: 'Biryani', description: '', rating: 5.0, prepTime: 12 });
  };

  const generateAI = async () => {
    if (!newItem.name) return;
    setAiLoading(true);
    const d = await gemini.generateDescription(newItem.name, newItem.category || 'Biryani');
    setNewItem(prev => ({ ...prev, description: d }));
    setAiLoading(false);
  };

  const menuButtons = [
    { id: 'catalog', label: 'Catalog', icon: Icons.Catalog },
    { id: 'active', label: 'Orders', icon: Icons.Orders },
    { id: 'archive', label: 'History', icon: Icons.History },
    { id: 'stats', label: 'Stats', icon: Icons.Stats }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-slate-900 font-sans pb-24 lg:pb-0">
      {/* Sidebar for Desktop */}
      <aside className="w-80 bg-[#4B3621] text-white p-10 hidden lg:flex flex-col border-r border-white/10 shrink-0">
        <div className="mb-16">
          <div className="w-12 h-12 bg-[#D4A373] text-[#4B3621] rounded-2xl flex items-center justify-center font-serif font-black text-2xl shadow-lg mb-4">S</div>
          <h2 className="text-xl font-bold tracking-tight">SHB Station</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">Management Core</p>
        </div>

        <nav className="space-y-2 flex-1">
          {menuButtons.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                tab === t.id ? 'bg-[#D4A373] text-[#4B3621] shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10 border-t border-white/5 space-y-6">
          <button 
            onClick={() => deServices.resetAll()}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-200 flex items-center gap-2 transition-colors"
          >
            Purge Data
          </button>
          <Link to="/" className="flex items-center gap-3 text-white/20 hover:text-white font-bold text-sm transition-colors">
            ← Switch to Customer View
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#4B3621] text-white flex lg:hidden z-50 border-t border-white/10 px-2 py-3 shadow-2xl">
        {menuButtons.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${
              tab === t.id ? 'text-[#D4A373]' : 'text-white/40'
            }`}
          >
            <t.icon />
            <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Surface */}
      <main className="flex-1 min-w-0 p-6 sm:p-10 lg:p-16">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 sm:mb-16">
          <div>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#4B3621] capitalize">{tab}</h1>
            <p className="text-slate-400 font-medium mt-2">Managing the soul of Shivam Handi Biryani.</p>
          </div>
          <div className="flex gap-4">
            {(tab === 'active' || tab === 'archive' || tab === 'catalog') && (
              <button
                onClick={onRefresh}
                className="w-full sm:w-auto bg-slate-100 text-slate-700 px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-2"
              >
                <Icons.Refresh />
                Refresh
              </button>
            )}
            {tab === 'catalog' && (
              <button
                onClick={() => { setEditingItemId(null); setModalOpen(true); }}
                className="w-full sm:w-auto bg-[#4B3621] text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-[#4B3621]/20 active:scale-95 transition-all"
              >
                + Create New Item
              </button>
            )}
          </div>
        </header>

        {/* Catalog Tab */}
        {tab === 'catalog' && (
          <>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search catalog by name or category..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {filteredMenuItems.map(item => (
              <div key={item.id} className="bg-white rounded-[2rem] p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
                <div className="h-40 sm:h-48 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-slate-50 mb-4 sm:mb-6 relative">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#4B3621]">
                    {item.category}
                  </div>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">{item.name}</h3>
                  <span className="font-bold text-[#4CAF50] text-sm sm:text-base">Rs.{item.price}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-6 sm:mb-8 italic font-medium">"{item.description}"</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
                  >
                    Edit Item
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
            </div>
          </>
        )}

        {/* Live Orders Tab */}
        {tab === 'active' && (
          <>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Reference ID"
                value={ordersRefSearch}
                onChange={(e) => setOrdersRefSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
              <input
                type="text"
                placeholder="Customer Name"
                value={ordersNameSearch}
                onChange={(e) => setOrdersNameSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
              <input
                type="text"
                placeholder="Contact Number"
                value={ordersContactSearch}
                onChange={(e) => setOrdersContactSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
              <input
                type="text"
                placeholder="Table Number"
                value={ordersTableSearch}
                onChange={(e) => setOrdersTableSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
            </div>
            <div className="space-y-4 sm:space-y-6">
              {orders.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300 opacity-50">
                <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="font-serif text-2xl italic">All quiet in the kitchen...</p>
              </div>
              ) : (
                filteredOrders.map(o => (
                <div key={o.id} className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center gap-6 sm:gap-10 hover:border-[#D4A373]/30 transition-colors">
                  <div className="w-full lg:w-40 lg:border-r lg:border-slate-100 pr-0 lg:pr-6 relative">
                    {o.status === 'Pending' && <div className="absolute -top-2 -left-2 w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>}
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">REFERENCE</p>
                    <p className="font-mono font-bold text-[#4B3621]">#{o.id}</p>
                    <p className="text-xs font-bold mt-3 bg-[#FDF5E6] text-[#4B3621] inline-block px-3 py-1 rounded-lg uppercase tracking-wider">TABLE {o.tableNumber}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">ITEMS ORDERED</p>
                    <div className="space-y-1.5">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs sm:text-sm font-bold">
                          <span className="text-slate-700">{i.quantity}x {i.name}</span>
                          <span className="text-slate-400 font-medium">Rs.{i.price * i.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">REVENUE</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#4CAF50]">Rs.{o.total}</p>
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto items-center">
                    <select 
                      value={o.status}
                      onChange={(e) => onUpdateOrderStatus(o.id, e.target.value)}
                      className={`flex-1 lg:flex-none border-none rounded-xl px-4 py-3 font-bold text-xs sm:text-sm outline-none shadow-sm ${
                        o.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                        o.status === 'Preparing' ? 'bg-blue-50 text-blue-700' :
                        o.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    {(o.status === 'Completed' || o.status === 'Cancelled') && (
                      <button
                        onClick={() => onArchiveOrder(o.id)}
                        className="bg-[#4B3621] text-white px-6 py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="space-y-8 sm:space-y-12 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Lifetime Revenue</p>
                  <p className="text-4xl font-serif font-bold text-[#4CAF50]">Rs. {totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-2">Combined Active & Historical</p>
               </div>
               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Total Sales</p>
                  <p className="text-4xl font-serif font-bold text-[#4B3621]">{orders.length + history.length}</p>
                  <p className="text-xs text-slate-400 mt-2">Transactions processed</p>
               </div>
               <div className="bg-[#4B3621] p-8 rounded-[2rem] shadow-2xl text-white">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Busiest Hour</p>
                  <p className="text-4xl font-serif font-bold">04:30 PM</p>
                  <p className="text-xs text-white/30 mt-2">Peak Biryani Time</p>
               </div>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-slate-50 min-h-[450px]">
              <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-[#D4A373] rounded-full"></span>
                Revenue Distribution by Category
              </h3>
              <div className="h-72 sm:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} 
                    />
                    <Tooltip 
                      cursor={{fill: '#FDF5E6', radius: 10}} 
                      contentStyle={{borderRadius: '20px', border: 'none', fontSize: '12px', padding: '15px', fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} 
                    />
                    <Bar dataKey="total" radius={[12, 12, 0, 0]} barSize={40}>
                       {stats.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4B3621' : '#D4A373'} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === 'archive' && (
          <div>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Reference ID"
                value={historyRefSearch}
                onChange={(e) => setHistoryRefSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
              <input
                type="text"
                placeholder="Customer Name"
                value={historyNameSearch}
                onChange={(e) => setHistoryNameSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
              <input
                type="text"
                placeholder="Contact Number"
                value={historyContactSearch}
                onChange={(e) => setHistoryContactSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
              <input
                type="text"
                placeholder="Table Number"
                value={historyTableSearch}
                onChange={(e) => setHistoryTableSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
              <input
                type="text"
                placeholder="Time (Date/Time)"
                value={historyTimeSearch}
                onChange={(e) => setHistoryTimeSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
              />
            </div>
            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-50/50 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 sm:px-10 py-5 sm:py-6">Reference ID</th>
                      <th className="px-6 sm:px-10 py-5 sm:py-6">Table</th>
                      <th className="px-6 sm:px-10 py-5 sm:py-6">Total Amount</th>
                      <th className="px-6 sm:px-10 py-5 sm:py-6">Order Date</th>
                      <th className="px-6 sm:px-10 py-5 sm:py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs sm:text-sm">
                    {history.length === 0 ? (
                      <tr><td colSpan={5} className="py-24 text-center text-slate-300 italic font-serif text-xl">No historical orders found.</td></tr>
                    ) : (
                      filteredHistory.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-6 sm:px-10 py-6 sm:py-8 font-mono font-bold text-slate-500 group-hover:text-[#4B3621] transition-colors">#{o.id}</td>
                          <td className="px-6 sm:px-10 py-6 sm:py-8 font-bold text-[#4B3621]">{o.tableNumber}</td>
                          <td className="px-6 sm:px-10 py-6 sm:py-8 font-bold text-[#4CAF50]">Rs.{o.total}</td>
                          <td className="px-6 sm:px-10 py-6 sm:py-8 text-slate-400 font-medium">{new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-6 sm:px-10 py-6 sm:py-8 text-right">
                             <button
                              onClick={() => setOrderDetailsModal(o)}
                              className="bg-slate-50 text-slate-400 hover:text-[#4B3621] hover:bg-[#FDF5E6] w-10 h-10 rounded-full inline-flex items-center justify-center transition-all"
                             >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Catalog Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl animate-scale-in my-auto">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4B3621]">
                    {editingItemId ? 'Edit Masterpiece' : 'Craft New Item'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black">Catalog Management</p>
               </div>
               <button onClick={closeModal} className="text-slate-300 hover:text-slate-600 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Item Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="E.g. Chicken Handi Biryani"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Price (Rs.)</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Rating (Stars)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={newItem.rating}
                    onChange={(e) => setNewItem({...newItem, rating: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.prepTime}
                    onChange={(e) => setNewItem({...newItem, prepTime: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                  <select 
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm appearance-none cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Image URL</label>
                  <input 
                    type="text" 
                    value={newItem.image}
                    onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                    placeholder="Unsplash or Image Link" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 font-bold outline-none text-sm focus:border-[#4B3621]/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Menu Description</label>
                  <button 
                    onClick={generateAI}
                    disabled={aiLoading || !newItem.name}
                    className="text-[9px] font-black text-[#D4A373] hover:text-[#4B3621] disabled:opacity-30 flex items-center gap-1.5 transition-all"
                  >
                    <Icons.Sparkle />
                    <span>{aiLoading ? 'BREWING POETRY...' : 'REWRITE WITH AI'}</span>
                  </button>
                </div>
                <textarea 
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-5 font-medium text-sm outline-none resize-none focus:border-[#4B3621]/20 transition-all"
                  placeholder="Tell the story of this dish..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <button 
                onClick={handleSave}
                className="order-1 sm:order-2 flex-[2] bg-[#4B3621] text-white py-5 rounded-2xl font-black shadow-xl shadow-[#4B3621]/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                {editingItemId ? 'Update Catalog' : 'Add to Menu'}
              </button>
              <button 
                onClick={closeModal}
                className="order-2 sm:order-1 flex-1 bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px] py-5 rounded-2xl hover:bg-slate-100 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-[#2D1B10]/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedOrder(null)} />
           <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-scale-in">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-[#FDF5E6] rounded-full flex items-center justify-center mx-auto mb-4 text-[#4B3621]">
                   <Icons.History />
                 </div>
                 <h3 className="text-2xl font-serif font-bold text-[#4B3621]">Order Summary</h3>
                 <p className="text-[10px] font-black text-slate-300 uppercase mt-1 tracking-widest">#{selectedOrder.id}</p>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar mb-8">
                 {selectedOrder.items.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <div>
                         <p className="font-bold text-slate-800">{item.name}</p>
                         <p className="text-[10px] text-slate-400 uppercase font-black">{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</p>
                      </div>
                      <p className="font-bold text-slate-600">Rs. {item.price * item.quantity}</p>
                   </div>
                 ))}
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl mb-8 flex justify-between items-end">
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Amount</p>
                    <p className="text-3xl font-serif font-bold text-[#4CAF50]">Rs. {selectedOrder.total}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Table No.</p>
                    <p className="text-lg font-bold text-[#4B3621]">{selectedOrder.tableNumber}</p>
                 </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-[#4B3621] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#4B3621]/20"
              >
                Close Record
              </button>
           </div>
        </div>
      )}

      {/* Order Details Modal */}
      {orderDetailsModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#2D1B10]/80 backdrop-blur-md animate-fade-in screen-only" onClick={() => setOrderDetailsModal(null)} />
          <div className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-[2.5rem] p-8 shadow-2xl animate-scale-in print-bill overflow-y-auto">
            <div className="bill-header print-only">
              <h1>Shivam Handi Biryani</h1>
              <p>Janakpur, Nepal</p>
              <p>Phone: +977-1234567890</p>
              <p>Order #{orderDetailsModal.id}</p>
              <p>{new Date(orderDetailsModal.createdAt).toLocaleDateString()} {new Date(orderDetailsModal.createdAt).toLocaleTimeString()}</p>
            </div>

            <div className="text-center mb-8 screen-only">
              <div className="w-16 h-16 bg-[#FDF5E6] rounded-full flex items-center justify-center mx-auto mb-4 text-[#4B3621]">
                <Icons.Orders />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#4B3621]">Order Details</h3>
              <p className="text-[10px] font-black text-slate-300 uppercase mt-1 tracking-widest">#{orderDetailsModal.id}</p>
            </div>

            <div className="bill-details print-only">
              <p>Customer: {orderDetailsModal.customerName || 'N/A'}</p>
              <p>Contact: {orderDetailsModal.contactNumber || 'N/A'}</p>
              <p>Table: {orderDetailsModal.tableNumber}</p>
              <p>Status: {orderDetailsModal.status}</p>
              {orderDetailsModal.extraToppings && <p>Extra: {orderDetailsModal.extraToppings}</p>}
            </div>

            <div className="space-y-6 mb-8 screen-only">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Name</p>
                  <p className="font-bold text-slate-800">{orderDetailsModal.customerName || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Number</p>
                  <p className="font-bold text-slate-800">{orderDetailsModal.contactNumber || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Table Number</p>
                  <p className="font-bold text-slate-800">{orderDetailsModal.tableNumber}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className={`font-bold ${orderDetailsModal.status === 'Pending' ? 'text-amber-600' : orderDetailsModal.status === 'Preparing' ? 'text-blue-600' : 'text-green-600'}`}>{orderDetailsModal.status}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Extra Toppings</p>
                <p className="font-medium text-slate-700">{orderDetailsModal.extraToppings || 'None'}</p>
              </div>

              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Items Ordered</p>
                {orderDetailsModal.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black">{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-bold text-slate-600">Rs. {item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bill-items print-only">
              {orderDetailsModal.items.map((item, idx) => (
                <div key={idx} className="item">
                  <span>{item.quantity}x {item.name}</span>
                  <span>Rs. {item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#4CAF50] p-6 rounded-2xl mb-6 flex justify-between items-end text-white screen-only">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest">Total Amount</p>
                <p className="text-3xl font-serif font-bold">Rs. {orderDetailsModal.total}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest">Order Time</p>
                <p className="text-sm font-bold">{new Date(orderDetailsModal.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="bill-total print-only">
              <p>Total: Rs. {orderDetailsModal.total}</p>
            </div>

            <div className="bill-footer print-only">
              <p>Thank you for dining with us!</p>
              <p>Visit again soon.</p>
            </div>

            <div className="flex gap-3 screen-only">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to cancel this order?")) {
                    onUpdateOrderStatus(orderDetailsModal.id, 'Cancelled');
                    setOrderDetailsModal(null);
                  }
                }}
                className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-red-100 transition-colors"
              >
                Cancel Order
              </button>
              <button
                ref={printButtonRef}
                onClick={(e) => {
                  e.preventDefault(); // Stop any default behavior
                  e.stopPropagation(); // Stop bubbling to parent elements

                  if (isPrinting) return;

                  setIsPrinting(true);

                  // Use a small timeout to let React finish state updates
                  // before opening the print dialog
                  setTimeout(() => {
                    window.print();
                    setIsPrinting(false);
                    setOrderDetailsModal(null);
                  }, 100);
                }}
                disabled={isPrinting}
                className="flex-1 bg-[#4B3621] text-white py-3 rounded-xl font-black uppercase tracking-widest text-sm disabled:opacity-50"
              >
                {isPrinting ? 'Printing...' : 'Print Bill'}
              </button>
            </div>

            <button
              onClick={() => setOrderDetailsModal(null)}
              className="w-full mt-3 bg-slate-50 text-slate-400 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-colors screen-only"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }

        .print-bill .print-only { display: none; }

        @media print {
          @page { size: 120mm auto; margin: 0; }
          body * { visibility: hidden; }
          .print-bill, .print-bill * { visibility: visible; }
          .print-bill { position: absolute; left: 0; top: 0; width: 120mm; margin: 0; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; color: #000; background: #fff; padding: 8px; border: none; box-shadow: none; page-break-inside: avoid; }
          .print-bill .bill-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .print-bill .bill-header h1 { font-size: 16px; font-weight: bold; margin: 0; }
          .print-bill .bill-header p { margin: 2px 0; font-size: 11px; }
          .print-bill .bill-details { margin-bottom: 8px; }
          .print-bill .bill-details p { margin: 2px 0; font-size: 11px; }
          .print-bill .bill-items { margin-bottom: 8px; }
          .print-bill .bill-items .item { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
          .print-bill .bill-total { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; text-align: right; font-size: 12px; }
          .print-bill .bill-footer { text-align: center; margin-top: 8px; font-size: 10px; }
          .print-bill .screen-only { display: none !important; }
          .print-bill .print-only { display: block !important; }
          .print-bill button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboard;
