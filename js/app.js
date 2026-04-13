// ===== DATA STORE =====
const STORAGE_KEY = 'afrae_cart';
const ORDERS_KEY = 'afrae_orders';
const PRODUCTS_KEY = 'afrae_products';

// Default products (can be overridden by admin)
const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: 'Vase Arabesque',
    price: 280,
    category: 'Vases',
    description: 'Un vase artisanal sculpté à la main en gypse pur, orné de motifs arabesques traditionnels. Chaque détail est réalisé avec une précision remarquable, faisant de cette pièce un objet d\'art unique.',
    image: '/assets/product-1.jpg',
    inStock: true,
    stock: 5
  },
  {
    id: '2',
    name: 'Bougeoir Floral',
    price: 195,
    category: 'Bougeoirs',
    description: 'Bougeoir en gypse aux formes florales délicates. Idéal pour créer une atmosphère chaleureuse et raffinée dans votre intérieur. Dimensions : 12 cm de hauteur.',
    image: '/assets/product-2.jpg',
    inStock: true,
    stock: 8
  },
  {
    id: '3',
    name: 'Miroir Baroque',
    price: 450,
    category: 'Miroirs',
    description: 'Cadre de miroir baroque sculpté en gypse blanc. Un chef-d\'œuvre artisanal qui transforme n\'importe quel mur en une véritable œuvre d\'art. Dimensions : 60x80 cm.',
    image: '/assets/product-3.jpg',
    inStock: true,
    stock: 3
  },
  {
    id: '4',
    name: 'Plateau Géométrique',
    price: 320,
    category: 'Plateaux',
    description: 'Plateau décoratif en gypse aux motifs géométriques inspirés de la tradition marocaine. Parfait pour présenter vos bijoux ou comme centre de table.',
    image: '/assets/product-4.jpg',
    inStock: true,
    stock: 6
  },
  {
    id: '5',
    name: 'Sculpture Murale',
    price: 580,
    category: 'Sculptures',
    description: 'Sculpture murale en relief, travail artisanal minutieux représentant des motifs floraux et géométriques. Pièce unique, faite à la main par nos artisans.',
    image: '/assets/product-1.jpg',
    inStock: true,
    stock: 2
  },
  {
    id: '6',
    name: 'Coupe Décorative',
    price: 240,
    category: 'Coupes',
    description: 'Coupe décorative en gypse blanc, aux lignes épurées et élégantes. Peut servir comme vide-poche ou simplement comme objet décoratif.',
    image: '/assets/product-2.jpg',
    inStock: false,
    stock: 0
  }
];

// ===== PRODUCTS STORAGE =====
function getProducts() {
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PRODUCTS;
  } catch { return DEFAULT_PRODUCTS; }
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// ===== CART STORAGE =====
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }
  saveCart(cart);
  showToast(`${product.name} ajouté au panier`, 'success');
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

function updateQty(id, qty) {
  if (qty <= 0) return removeFromCart(id);
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) { item.quantity = qty; saveCart(cart); }
}

function clearCart() {
  saveCart([]);
}

function getCartTotal() {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
}

function getCartCount() {
  return getCart().reduce((s, i) => s + i.quantity, 0);
}

function updateCartUI() {
  const count = getCartCount();
  const el = document.getElementById('cart-count');
  if (!el) return;
  el.textContent = count;
  el.classList.toggle('visible', count > 0);
}

// ===== ORDERS STORAGE =====
function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch { return []; }
}

function saveOrder(orderData) {
  const orders = getOrders();
  const order = {
    id: 'ORD-' + Date.now(),
    createdAt: new Date().toISOString(),
    deliveryStatus: 'en_attente',
    paymentStatus: 'non_payee',
    ...orderData
  };
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return order;
}

function updateOrder(id, updates) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updates };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

function deleteOrder(id) {
  const orders = getOrders().filter(o => o.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', '': 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== ROUTER =====
const routes = {
  '/': renderHome,
  '/boutique': renderShop,
  '/panier': renderCart,
  '/commander': renderCheckout,
  '/comment-commander': renderHowToOrder,
  '/livraison': renderDelivery,
  '/contact': renderContact,
  '/faq': renderFaq,
};

let currentProductId = null;

function navigate(path, data = null) {
  if (data) currentProductId = data;
  window.history.pushState({}, '', path);
  render(path);
  window.scrollTo(0, 0);
  updateActiveNav(path);
  closeMobileMenu();
}

function render(path = window.location.pathname) {
  const main = document.getElementById('main-content');
  if (path.startsWith('/produit/')) {
    const id = path.split('/produit/')[1];
    currentProductId = id;
    renderProductDetail(main, id);
    return;
  }
  const renderer = routes[path] || renderNotFound;
  renderer(main);
}

function updateActiveNav(path) {
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

// Handle browser back/forward
window.addEventListener('popstate', () => render());

// ===== ICON HELPERS =====
const icons = {
  shoppingBag: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  arrowRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  arrowLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
  check: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  phone: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`,
  mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  mapPin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  pkg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  clock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><triangle points="10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  menu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  x: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

// ===== PAGES =====
function renderHome(main) {
  const products = getProducts().filter(p => p.inStock).slice(0, 4);
  main.innerHTML = `
    <section class="hero">
      <img src="/assets/hero-bg.jpg" alt="Afrae Décor" class="hero-bg">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>Afrae Décor</h1>
        <p>Pièces décoratives artisanales en gypse —<br>chaque création est unique</p>
        <button class="btn btn-primary btn-lg" onclick="navigate('/boutique')">
          Découvrir la collection ${icons.arrowRight}
        </button>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Nos Créations</h2>
          <p>Des pièces uniques faites à la main, conçues pour sublimer votre intérieur</p>
        </div>
        <div class="products-grid">
          ${products.map(p => productCardHTML(p)).join('')}
        </div>
        <div class="text-center" style="margin-top:44px">
          <button class="btn btn-outline btn-lg" onclick="navigate('/boutique')">
            Voir toute la boutique
          </button>
        </div>
      </div>
    </section>

    <section class="section section-bg">
      <div class="container">
        <div class="section-header">
          <h2>Comment ça marche ?</h2>
        </div>
        <div class="steps-grid">
          <div class="step-item">
            <div class="step-num">1</div>
            <h3>Choisissez</h3>
            <p>Parcourez notre collection et ajoutez vos coups de cœur au panier</p>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <h3>Commandez</h3>
            <p>Remplissez le formulaire avec votre adresse et numéro de téléphone</p>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <h3>Recevez</h3>
            <p>Payez à la livraison en espèces ou par carte</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function productCardHTML(p) {
  return `
    <div class="product-card" onclick="navigate('/produit/${p.id}')">
      <div class="product-card-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-card-body">
        <div class="product-card-cat">${p.category}</div>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">${p.price} MAD</div>
        ${!p.inStock ? '<div class="out-of-stock-badge">Rupture de stock</div>' : ''}
      </div>
    </div>
  `;
}

function renderShop(main) {
  const products = getProducts();
  main.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1>Boutique</h1>
        <p>Toutes nos créations artisanales en gypse</p>
      </div>
      <div class="products-grid">
        ${products.map(p => productCardHTML(p)).join('')}
      </div>
      <div style="height:60px"></div>
    </div>
  `;
}

function renderProductDetail(main, id) {
  const products = getProducts();
  const p = products.find(x => x.id === id);
  if (!p) { renderNotFound(main); return; }

  main.innerHTML = `
    <div class="container" style="padding-top:32px; padding-bottom:60px">
      <a href="#" class="back-link" onclick="event.preventDefault(); navigate('/boutique')">
        ${icons.arrowLeft} Retour à la boutique
      </a>
      <div class="product-detail-grid">
        <div class="product-detail-img">
          <img src="${p.image}" alt="${p.name}">
        </div>
        <div class="product-detail-info">
          <p class="product-cat">${p.category}</p>
          <h1 class="product-title">${p.name}</h1>
          <div class="product-price">${p.price} MAD</div>
          <p class="product-desc">${p.description}</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <button class="btn btn-primary btn-lg" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})" ${!p.inStock ? 'disabled' : ''}>
              ${icons.shoppingBag} ${p.inStock ? 'Ajouter au panier' : 'Rupture de stock'}
            </button>
            <p style="font-size:0.78rem;color:var(--muted);text-align:center">Paiement à la livraison · Espèces ou carte</p>
          </div>
          <div class="product-info-box">
            <div>🏺 Matière : Gypse artisanal</div>
            <div>✨ Pièce unique</div>
            <div>📦 Emballage soigné (produit fragile)</div>
            <div>↩️ Pas de retour sauf casse à la livraison</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCart(main) {
  const cart = getCart();
  if (cart.length === 0) {
    main.innerHTML = `
      <div class="empty-state">
        ${icons.shoppingBag.replace('width="20"', 'width="52"').replace('height="20"', 'height="52"')}
        <h2>Votre panier est vide</h2>
        <p>Découvrez nos créations artisanales</p>
        <button class="btn btn-primary" onclick="navigate('/boutique')">Voir la boutique</button>
      </div>`;
    return;
  }

  main.innerHTML = `
    <div class="container" style="padding-top:40px;padding-bottom:60px;max-width:820px">
      <h1 style="font-family:var(--font-heading);font-size:2rem;font-weight:300;margin-bottom:28px">Panier</h1>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-summary">
        <div class="cart-total">
          <span class="cart-total-label">Total</span>
          <span class="cart-total-amount" id="cart-total">${getCartTotal()} MAD</span>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%" onclick="navigate('/commander')">
          Passer la commande ${icons.arrowRight}
        </button>
        <p style="font-size:0.78rem;color:var(--muted);text-align:center;margin-top:10px">Paiement à la livraison uniquement</p>
      </div>
    </div>
  `;
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  if (!container) return;
  const cart = getCart();
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img"><img src="${item.image}" alt="${item.name}"></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price} MAD</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeQty('${item.id}', ${item.quantity - 1})">−</button>
        <span class="qty-val">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', ${item.quantity + 1})">+</button>
      </div>
      <button class="remove-btn" onclick="removeItem('${item.id}')">${icons.trash}</button>
    </div>
  `).join('');
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = getCartTotal() + ' MAD';
}

function changeQty(id, qty) {
  updateQty(id, qty);
  renderCartItems();
  if (getCart().length === 0) renderCart(document.getElementById('main-content'));
}

function removeItem(id) {
  removeFromCart(id);
  renderCartItems();
  if (getCart().length === 0) renderCart(document.getElementById('main-content'));
}

function renderCheckout(main) {
  if (getCart().length === 0) {
    main.innerHTML = `<div class="empty-state"><h2>Panier vide</h2><button class="btn btn-primary" onclick="navigate('/boutique')">Voir la boutique</button></div>`;
    return;
  }
  const cart = getCart();
  main.innerHTML = `
    <div class="container" style="padding-top:40px;padding-bottom:60px;max-width:900px">
      <h1 style="font-family:var(--font-heading);font-size:2rem;font-weight:300;margin-bottom:36px">Passer la commande</h1>
      <div class="checkout-grid">
        <div>
          <div class="form-group">
            <label for="co-name">Nom complet *</label>
            <input type="text" id="co-name" placeholder="Votre nom complet" required>
          </div>
          <div class="form-group">
            <label for="co-phone">Téléphone *</label>
            <input type="tel" id="co-phone" placeholder="06 XX XX XX XX" required>
          </div>
          <div class="form-group">
            <label for="co-address">Adresse complète *</label>
            <textarea id="co-address" placeholder="Rue, immeuble, étage..." required></textarea>
          </div>
          <div class="form-group">
            <label for="co-city">Ville *</label>
            <input type="text" id="co-city" placeholder="Votre ville" required>
          </div>
          <div class="form-group">
            <label for="co-notes">Notes (optionnel)</label>
            <textarea id="co-notes" placeholder="Instructions spéciales..."></textarea>
          </div>
          <div class="payment-box">
            <strong>💰 Mode de paiement</strong>
            <span style="color:var(--muted);font-size:0.875rem">Paiement à la livraison (espèces ou carte)</span>
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%" onclick="submitOrder()" id="submit-btn">
            Confirmer la commande
          </button>
        </div>
        <div>
          <div class="order-summary-box">
            <h3>Résumé</h3>
            ${cart.map(item => `
              <div class="summary-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>${item.price * item.quantity} MAD</span>
              </div>
            `).join('')}
            <div class="summary-total">
              <span>Total</span>
              <span>${getCartTotal()} MAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function submitOrder() {
  const name = document.getElementById('co-name')?.value.trim();
  const phone = document.getElementById('co-phone')?.value.trim();
  const address = document.getElementById('co-address')?.value.trim();
  const city = document.getElementById('co-city')?.value.trim();
  const notes = document.getElementById('co-notes')?.value.trim();

  if (!name || !phone || !address || !city) {
    showToast('Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }

  const cart = getCart();
  saveOrder({ customerName: name, customerPhone: phone, customerAddress: address, customerCity: city, notes, items: cart, total: getCartTotal() });
  clearCart();

  document.getElementById('main-content').innerHTML = `
    <div class="success-page">
      <div class="success-icon">${icons.check}</div>
      <h1 style="font-family:var(--font-heading);font-size:2.5rem;font-weight:300;margin-bottom:14px">Commande confirmée !</h1>
      <p style="color:var(--muted);margin-bottom:8px">Merci pour votre commande. Nous vous contacterons bientôt pour confirmer la livraison.</p>
      <p style="font-size:0.875rem;color:var(--muted);margin-bottom:36px">Paiement à la livraison (espèces ou carte)</p>
      <button class="btn btn-primary btn-lg" onclick="navigate('/')">Retour à l'accueil</button>
    </div>
  `;
}

function renderHowToOrder(main) {
  main.innerHTML = `
    <div class="container" style="padding-top:40px;padding-bottom:60px;max-width:720px">
      <div class="page-header">
        <h1>Comment commander</h1>
        <p>Simple, rapide et sécurisé</p>
      </div>
      <div class="steps-v">
        ${[
          ['1','Parcourez la boutique','Explorez notre collection et découvrez nos pièces artisanales en gypse. Chaque produit est unique.'],
          ['2','Ajoutez au panier','Cliquez sur "Ajouter au panier" pour les articles qui vous plaisent. Vous pouvez modifier les quantités dans votre panier.'],
          ['3','Remplissez le formulaire','Indiquez votre nom, votre numéro de téléphone et votre adresse complète de livraison.'],
          ['4','Confirmez la commande','Validez votre commande. Nous vous contacterons par téléphone pour confirmer les détails et le délai de livraison.'],
          ['5','Payez à la livraison','Payez en espèces ou par carte au moment de la réception. Pas de paiement en ligne requis.'],
        ].map(([n, t, d]) => `
          <div class="step-v">
            <div class="step-v-num">${n}</div>
            <div>
              <h3>${t}</h3>
              <p>${d}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDelivery(main) {
  main.innerHTML = `
    <div class="container" style="padding-top:40px;padding-bottom:60px;max-width:720px">
      <div class="page-header">
        <h1>Livraison</h1>
        <p>Livraison dans tout le Maroc</p>
      </div>
      <div>
        ${[
          [icons.pkg,'Emballage soigné','Nos produits en gypse sont fragiles. Chaque pièce est emballée avec le plus grand soin pour garantir une livraison en parfait état.'],
          [icons.clock,'Délais de livraison','La livraison est effectuée sous 3 à 7 jours ouvrables selon votre localisation. Nous vous contacterons pour confirmer la date de livraison.'],
          [icons.shield,'Paiement à la livraison','Payez uniquement à la réception de votre commande. Espèces et carte bancaire acceptées.'],
          [icons.alert,'Politique de retour','En raison de la nature fragile du gypse, les retours ne sont acceptés qu\'en cas de casse constatée à la livraison. Veuillez vérifier votre colis en présence du livreur.'],
        ].map(([ic, t, d]) => `
          <div class="info-card">
            <div class="info-card-icon">${ic}</div>
            <div><h3>${t}</h3><p>${d}</p></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderContact(main) {
  main.innerHTML = `
    <div class="container" style="padding-top:40px;padding-bottom:60px;max-width:860px">
      <div class="page-header">
        <h1>Contact</h1>
        <p>Une question ? N'hésitez pas à nous écrire</p>
      </div>
      <div class="contact-grid">
        <div>
          <p style="color:var(--muted);margin-bottom:28px;font-size:0.95rem;line-height:1.75">
            Une question sur nos produits ou votre commande ? N'hésitez pas à nous contacter. Nous vous répondrons dans les plus brefs délais.
          </p>
          ${[
            [icons.phone,'Téléphone','+212 6XX XX XX XX'],
            [icons.mail,'Email','contact@afraedecor.ma'],
            [icons.mapPin,'Localisation','Maroc — Livraison nationale'],
          ].map(([ic, label, val]) => `
            <div class="contact-info-item">
              <div class="contact-icon">${ic}</div>
              <div>
                <div class="contact-info-label">${label}</div>
                <div class="contact-info-val">${val}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div>
          <div class="form-group">
            <label>Nom</label>
            <input type="text" id="ct-name" placeholder="Votre nom">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="ct-email" placeholder="votre@email.com">
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea id="ct-msg" rows="5" placeholder="Votre message..."></textarea>
          </div>
          <button class="btn btn-primary" style="width:100%" onclick="sendContact()">Envoyer le message</button>
        </div>
      </div>
    </div>
  `;
}

function sendContact() {
  const name = document.getElementById('ct-name')?.value.trim();
  const email = document.getElementById('ct-email')?.value.trim();
  const msg = document.getElementById('ct-msg')?.value.trim();
  if (!name || !email || !msg) { showToast('Veuillez remplir tous les champs', 'error'); return; }
  showToast('Message envoyé ! Nous vous répondrons rapidement.', 'success');
  document.getElementById('ct-name').value = '';
  document.getElementById('ct-email').value = '';
  document.getElementById('ct-msg').value = '';
}

function renderFaq(main) {
  const faqs = [
    ["Qu'est-ce que le gypse ?","Le gypse est un matériau naturel utilisé depuis l'antiquité pour créer des objets décoratifs. Il permet de réaliser des pièces uniques aux formes organiques et élégantes."],
    ["Les produits sont-ils fragiles ?","Oui, le gypse est un matériau délicat. Chaque pièce est emballée avec soin pour le transport. Nous recommandons de manipuler les produits avec précaution."],
    ["Comment puis-je payer ?","Nous acceptons uniquement le paiement à la livraison, en espèces ou par carte bancaire. Aucun paiement en ligne n'est requis."],
    ["Quels sont les délais de livraison ?","La livraison est effectuée sous 3 à 7 jours ouvrables. Nous vous contacterons par téléphone pour confirmer la date de livraison."],
    ["Puis-je retourner un produit ?","Les retours sont acceptés uniquement en cas de casse constatée à la livraison. Veuillez vérifier votre colis en présence du livreur."],
    ["Les pièces sont-elles uniques ?","Oui ! Chaque pièce est faite à la main, ce qui signifie que de légères variations de forme et de couleur sont normales et font partie du charme artisanal."],
    ["Livrez-vous dans tout le Maroc ?","Oui, nous livrons dans toutes les villes du Maroc. Les frais de livraison peuvent varier selon votre localisation."],
  ];
  main.innerHTML = `
    <div class="container" style="padding-top:40px;padding-bottom:60px">
      <div class="page-header">
        <h1>Questions Fréquentes</h1>
        <p>Tout ce que vous devez savoir</p>
      </div>
      <div class="faq-list">
        ${faqs.map((f, i) => `
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFaq(${i})">
              ${f[0]}
              <span class="faq-arrow">▼</span>
            </button>
            <div class="faq-answer" id="faq-${i}">${f[1]}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function toggleFaq(i) {
  const answer = document.getElementById(`faq-${i}`);
  const question = answer?.previousElementSibling;
  const isOpen = answer?.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('open'));
  if (!isOpen) {
    answer?.classList.add('open');
    question?.classList.add('open');
  }
}

function renderNotFound(main) {
  main.innerHTML = `
    <div class="empty-state">
      <h1 style="font-size:5rem;font-family:var(--font-heading);color:var(--muted)">404</h1>
      <h2>Page introuvable</h2>
      <p>La page que vous cherchez n'existe pas.</p>
      <button class="btn btn-primary" onclick="navigate('/')">Retour à l'accueil</button>
    </div>
  `;
}

// ===== NAVBAR =====
let mobileOpen = false;
function toggleMobileMenu() {
  mobileOpen = !mobileOpen;
  document.getElementById('mobile-menu').classList.toggle('open', mobileOpen);
  document.getElementById('hamburger-btn').innerHTML = mobileOpen ? icons.x : icons.menu;
}
function closeMobileMenu() {
  mobileOpen = false;
  const mm = document.getElementById('mobile-menu');
  if (mm) mm.classList.remove('open');
  const hb = document.getElementById('hamburger-btn');
  if (hb) hb.innerHTML = icons.menu;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  render(window.location.pathname);
  updateActiveNav(window.location.pathname);

  // Intercept all link clicks
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      navigate(href);
    }
  });
});
