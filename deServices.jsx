
const API_BASE = `http://192.168.1.64:3001/api`;

export const deServices = {
  /**
   * Fetches the menu from the API
   */
  getMenu: async () => {
    try {
      const response = await fetch(`${API_BASE}/menu`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch menu:", err);
      return [];
    }
  },

  getOrders: async () => {
    try {
      const response = await fetch(`${API_BASE}/orders`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      return [];
    }
  },

  getHistory: async () => {
    try {
      const response = await fetch(`${API_BASE}/history`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch history:", err);
      return [];
    }
  },

  // Menu CRUD operations
  addMenuItem: async (item) => {
    const response = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to add menu item');
    return await response.json();
  },

  updateMenuItem: async (id, item) => {
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to update menu item');
    return await response.json();
  },

  deleteMenuItem: async (id) => {
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete menu item');
    return await response.json();
  },

  // Order operations
  addOrder: async (order) => {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!response.ok) throw new Error('Failed to add order');
    return await response.json();
  },

  updateOrderStatus: async (id, status) => {
    const response = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update order status');
    return await response.json();
  },

  archiveOrder: async (order) => {
    // First add to history
    await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    // Then delete from orders
    await fetch(`${API_BASE}/orders/${order.id}`, {
      method: 'DELETE'
    });
  },

  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      return { totalRevenue: 0, totalSales: 0, stats: [] };
    }
  },

  resetAll: () => {
    // For now, just reload - in production you'd have a reset endpoint
    window.location.reload();
  }
};
