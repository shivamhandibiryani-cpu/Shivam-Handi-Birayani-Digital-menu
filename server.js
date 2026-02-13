import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Supabase client - with validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Menu endpoints
app.get('/api/menu', async (req, res) => {
  try {
    
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
   
    const newItem = { id: 'item_' + Date.now(), ...req.body };
    const { data, error } = await supabase
      .from('menu')
      .insert([newItem])
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    
    const { data, error } = await supabase
      .from('menu')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(data[0]);
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
   
    const { error } = await supabase
      .from('menu')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Orders endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    
    const newOrder = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...req.body };
    const { data, error } = await supabase
      .from('orders')
      .insert([newOrder])
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Error adding order:', err);
    res.status(500).json({ error: 'Failed to add order' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    
    const { data, error } = await supabase
      .from('orders')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(data[0]);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// History endpoints
app.get('/api/history', async (req, res) => {
  try {
    
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
   
    const { data, error } = await supabase
      .from('history')
      .insert([req.body])
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Error adding to history:', err);
    res.status(500).json({ error: 'Failed to add to history' });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    let allOrders = [];
    const { data, error } = await supabase
      .from('orders')
      .select('*');
    if (error) throw error;
    allOrders = data;

    const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);
    const totalSales = allOrders.length;

    const categories = ['Biryani', 'Arabic Food', 'Rice', 'Khana', 'Pizza', 'Burger', 'Curry & Snacks', 'Chicken Item', 'Chowmin', 'Momo', 'Nanglo Sets', 'Pasta'];
    const stats = categories.map(cat => ({
      name: cat,
      total: allOrders.reduce((acc, o) => {
        const catTotal = o.items.reduce((sum, item) => sum + (item.category === cat ? item.price * item.quantity : 0), 0);
        return acc + catTotal;
      }, 0)
    }));

    res.json({ totalRevenue, totalSales, stats });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Serve static files from dist folder (for production)
app.use(express.static(path.join(__dirname, 'dist'), {
  index: 'index.html',
  setHeaders: (res, filePath) => {
    // Set correct MIME types for JavaScript and module files
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.jsx')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    }
  }
}));

// Handle React Router - serve index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    // If file not found, check if we're in development mode
    if (err) {
      console.error('Error serving file:', err.message);
      // In development, redirect to Vite dev server
      if (process.env.NODE_ENV !== 'production') {
        return res.redirect('http://localhost:3000');
      }
      // In production, return 404
      res.status(404).json({ error: 'File not found. Please run npm run build first.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
