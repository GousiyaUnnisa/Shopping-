const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60s (lightweight)

async function fetchJson(url) {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > now) return cached.value;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`FakeStore fetch failed: ${res.status} ${res.statusText} ${text}`);
  }
  const value = await res.json();
  cache.set(url, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

app.get('/api/products', async (req, res) => {
  try {
    const { limit } = req.query;
    const url = `https://fakestoreapi.com/products${limit ? `?limit=${encodeURIComponent(limit)}` : ''}`;
    const data = await fetchJson(url);
    // fakestoreapi supports limit via query, but if it doesn't, this still returns full list.
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://fakestoreapi.com/products/${encodeURIComponent(id)}`;
    const data = await fetchJson(url);
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load product' });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const url = 'https://fakestoreapi.com/products/categories';
    const data = await fetchJson(url);
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load categories' });
  }
});

app.get('/api/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const url = `https://fakestoreapi.com/products/category/${encodeURIComponent(category)}`;
    const data = await fetchJson(url);
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load category products' });
  }
});

app.post('/api/checkout', async (req, res) => {
  // Fake checkout simulation
  // In real world: create order, payment intent, etc.
  const { name, email, address, cart, total } = req.body || {};

  if (!Array.isArray(cart)) {
    return res.status(400).json({ message: 'Invalid cart' });
  }

  const orderId = `FS-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

  return res.json({
    orderId,
    status: 'success',
    received: {
      name: name || '',
      email: email || '',
      address: address || '',
      total: typeof total === 'number' ? total : 0
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'shopping-server', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

