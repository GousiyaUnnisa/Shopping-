import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from './api';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);
}

function StarRating({ rating }) {
  const rounded = Math.round((rating || 0) * 10) / 10;
  return <span className="stars">★ {rounded}</span>;
}

function useCart() {
  const [items, setItems] = useState([]); // {id, qty}

  function addToCart(product) {
    setItems((prev) => {
      const id = String(product.id);
      const idx = prev.findIndex((x) => String(x.id) === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { id: product.id, qty: 1 }];
    });
  }

  function removeFromCart(id) {
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  function setQty(id, qty) {
    const q = Math.max(0, Number(qty) || 0);
    setItems((prev) => {
      const idx = prev.findIndex((x) => String(x.id) === String(id));
      if (idx === -1) {
        if (q === 0) return prev;
        return [...prev, { id, qty: q }];
      }
      if (q === 0) return prev.filter((x) => String(x.id) !== String(id));
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty: q };
      return copy;
    });
  }

  function clear() {
    setItems([]);
  }

  return { items, addToCart, removeFromCart, setQty, clear };
}

export default function App() {
  const [route, setRoute] = useState('welcome'); // welcome | home

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');

  const [selectedId, setSelectedId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cart = useCart();

  const [checkoutState, setCheckoutState] = useState('cart'); // cart | checkout | success
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', address: '' });
  const [checkoutError, setCheckoutError] = useState('');
  const [order, setOrder] = useState(null);

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      if (activeCategory) {
        const data = await apiGet(`/api/products/category/${encodeURIComponent(activeCategory)}`);
        setProducts(data);
      } else {
        const data = await apiGet('/api/products');
        setProducts(data);
      }
    } catch (e) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const cats = await apiGet('/api/categories');
        setCategories(cats);
      } catch (e) {
        setError(e.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const selectedProduct = useMemo(() => {
    if (!selectedId) return null;
    return products.find((p) => String(p.id) === String(selectedId)) || null;
  }, [products, selectedId]);

  const cartDetailed = useMemo(() => {
    return cart.items
      .map((it) => {
        const product = products.find((p) => String(p.id) === String(it.id)) || null;
        return product ? { product, qty: it.qty } : null;
      })
      .filter(Boolean);
  }, [cart.items, products]);

  const subtotal = useMemo(() => {
    return cartDetailed.reduce((sum, { product, qty }) => sum + (product.price || 0) * qty, 0);
  }, [cartDetailed]);

  const total = useMemo(() => {
    const shipping = cartDetailed.length ? 5 : 0;
    return subtotal + shipping;
  }, [subtotal, cartDetailed.length]);

  function goWelcome() {
    setRoute('welcome');
  }

  function goHome() {
    setRoute('home');
    setSelectedId(null);
    setCheckoutState('cart');
  }

  function scrollToContact() {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }

  function scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  }

  function openProduct(id) {
    setSelectedId(id);
    setCheckoutState('cart');
  }

  async function submitCheckout() {
    setCheckoutError('');
    setLoading(true);
    try {
      const payload = {
        ...checkoutForm,
        cart: cartDetailed.map(({ product, qty }) => ({
          id: product.id,
          title: product.title,
          qty,
          price: product.price
        })),
        total
      };
      const res = await apiPost('/api/checkout', payload);
      setOrder(res);
      cart.clear();
      setCheckoutState('success');
    } catch (e) {
      setCheckoutError(e.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  const cartCount = cart.items.reduce((a, b) => a + b.qty, 0);

  return (
    <div className="app">
      <header className="header">
        <div className="brand">🛍️ Online Shopping Portal</div>

        <nav className="nav">
          <button className="tab" onClick={goWelcome}>
            Welcome
          </button>
          <button className={route === 'home' ? 'tab active' : 'tab'} onClick={goHome}>
            Home
          </button>
          <button
            className="tab"
            onClick={() => {
              goHome();
              setTimeout(scrollToProducts, 0);
            }}
          >
            About Products
          </button>
          <button
            className="tab"
            onClick={() => {
              goHome();
              setTimeout(scrollToContact, 0);
            }}
          >
            Contact
          </button>

          <div className="divider" />

          <button
            className={checkoutState === 'cart' ? 'tab active' : 'tab'}
            onClick={() => {
              goHome();
              setCheckoutState('cart');
            }}
          >
            Cart ({cartCount})
          </button>
          <button
            className={checkoutState === 'checkout' ? 'tab active' : 'tab'}
            onClick={() => {
              goHome();
              setCheckoutState('checkout');
            }}
            disabled={cart.items.length === 0}
          >
            Checkout
          </button>
        </nav>
      </header>

      {route === 'welcome' ? (
        <main className="welcomeMain">
          <section className="welcomeCard">
            <h1>Welcome to Online Shopping Portal</h1>
            <p className="muted">
              Browse products, add items to cart, and complete a simulated checkout.
              Products are fetched from the free <b>Fake Store API</b>.
            </p>
            <div className="welcomeActions">
              <button className="button" onClick={goHome}>Start Shopping</button>
              <button className="button secondary" onClick={() => { goHome(); setTimeout(scrollToProducts, 0); }}>
                View Products
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="main">
          <section className="catalog">
            <div id="products" />

            <div className="toolbar">
              <select className="select" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button className="button" onClick={loadProducts} disabled={loading}>
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            {error ? <div className="error">{error}</div> : null}

            <div className="grid">
              {products.map((p) => (
                <div key={p.id} className="card">
                  <button className="cardInner" onClick={() => openProduct(p.id)} aria-label={`View ${p.title}`}>
                    <div className="imgWrap">
                      <img className="img" src={p.image} alt={p.title} />
                    </div>
                    <div className="cardTitle">{p.title}</div>
                  </button>
                  <div className="cardFooter">
                    <div className="price">{formatPrice(p.price)}</div>
                    <StarRating rating={p.rating?.rate} />
                    <button className="button" onClick={() => cart.addToCart(p)}>Add to cart</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="sidebar">
            <div className="panel">
              <h3>Product</h3>
              {selectedProduct ? (
                <div className="productDetail">
                  <img className="detailImg" src={selectedProduct.image} alt={selectedProduct.title} />
                  <div className="detailName">{selectedProduct.title}</div>
                  <div className="detailPrice">{formatPrice(selectedProduct.price)}</div>
                  <div className="detailRating">
                    <StarRating rating={selectedProduct.rating?.rate} />
                    <span className="muted">({selectedProduct.rating?.count} reviews)</span>
                  </div>
                  <div className="detailDesc">{selectedProduct.description}</div>
                  <div className="detailActions">
                    <button className="button" onClick={() => cart.addToCart(selectedProduct)}>Add to cart</button>
                    <button className="button secondary" onClick={() => setSelectedId(null)}>Close</button>
                  </div>
                </div>
              ) : (
                <div className="muted">Select a product to see details.</div>
              )}
            </div>

            <div className="panel">
              <h3>Cart</h3>

              {checkoutState === 'success' && order ? (
                <div className="success">
                  <div className="successTitle">Order placed ✅</div>
                  <div className="successText">Order ID: <b>{order.orderId}</b></div>
                  <div className="successText">Total: <b>{formatPrice(order.received.total)}</b></div>
                </div>
              ) : (
                <>
                  {cartDetailed.length === 0 ? (
                    <div className="muted">Your cart is empty.</div>
                  ) : (
                    <div className="cartList">
                      {cartDetailed.map(({ product, qty }) => (
                        <div className="cartItem" key={product.id}>
                          <img className="cartImg" src={product.image} alt={product.title} />
                          <div className="cartMeta">
                            <div className="cartTitle" title={product.title}>{product.title}</div>
                            <div className="cartRow">
                              <span>{formatPrice(product.price)}</span>
                              <span className="dot">•</span>
                              <span>Qty: {qty}</span>
                            </div>
                            <input
                              className="qty"
                              type="number"
                              min={0}
                              value={qty}
                              onChange={(e) => cart.setQty(product.id, e.target.value)}
                            />
                          </div>
                          <div className="cartRight">
                            <div className="cartTotal">{formatPrice((product.price || 0) * qty)}</div>
                            <button className="link" onClick={() => cart.removeFromCart(product.id)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="summary">
                    <div className="summaryRow">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="summaryRow">
                      <span>Shipping</span>
                      <span>{cartDetailed.length ? formatPrice(5) : formatPrice(0)}</span>
                    </div>
                    <div className="summaryRow total">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  {checkoutState === 'checkout' ? (
                    <div className="checkout">
                      <h4>Checkout (demo)</h4>
                      {checkoutError ? <div className="error">{checkoutError}</div> : null}
                      <div className="form">
                        <label>
                          Name
                          <input value={checkoutForm.name} onChange={(e) => setCheckoutForm((s) => ({ ...s, name: e.target.value }))} />
                        </label>
                        <label>
                          Email
                          <input value={checkoutForm.email} onChange={(e) => setCheckoutForm((s) => ({ ...s, email: e.target.value }))} />
                        </label>
                        <label>
                          Address
                          <textarea value={checkoutForm.address} onChange={(e) => setCheckoutForm((s) => ({ ...s, address: e.target.value }))} />
                        </label>
                        <button className="button" onClick={submitCheckout} disabled={cart.items.length === 0 || loading}>
                          {loading ? 'Processing…' : `Pay ${formatPrice(total)}`}
                        </button>
                      </div>
                      <div className="muted">This checkout is simulated using the backend endpoint.</div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="panel" id="contact">
              <h3>Contact</h3>
              <div className="muted">Email: ughousiya@gmail.com</div>
              <div className="muted">Phone: 6363656649</div>
              <div className="muted">Hours: Mon–Fri, 9AM–5PM</div>
            </div>
          </aside>
        </main>
      )}

      <footer className="footer">
        All Rights Reserved 2025-26.
      </footer>
    </div>
  );
}

