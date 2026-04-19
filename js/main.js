/* ============================================
   STUDIO ROOS — JavaScript Functionaliteit
   Winkelwagen, filters, animaties & interactie
   ============================================ */

// ==========================================
// WINKELWAGEN (Cart) — LocalStorage-based
// ==========================================
class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('studioRoosCart')) || [];
    this.init();
  }

  init() {
    this.updateUI();
    this.bindEvents();
  }

  bindEvents() {
    // Cart toggle
    const cartToggle = document.getElementById('cartToggle');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartToggle) {
      cartToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSidebar(true);
      });
    }

    if (cartClose) {
      cartClose.addEventListener('click', () => this.toggleSidebar(false));
    }

    if (cartOverlay) {
      cartOverlay.addEventListener('click', () => this.toggleSidebar(false));
    }

    // Add to cart buttons (delegated)
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-to-cart-btn');
      if (addBtn) {
        e.preventDefault();
        const item = {
          id: addBtn.dataset.id,
          name: addBtn.dataset.name,
          price: parseFloat(addBtn.dataset.price),
          image: addBtn.dataset.image,
          quantity: 1
        };
        this.addItem(item);
      }
    });
  }

  addItem(item) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push(item);
    }
    this.save();
    this.updateUI();
    showToast(`"${item.name}" toegevoegd aan winkelwagen`);
    
    // Kleine animatie op cart icon
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      cartCount.style.transform = 'scale(1.4)';
      setTimeout(() => cartCount.style.transform = 'scale(1)', 300);
    }
  }

  removeItem(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.updateUI();
  }

  updateQuantity(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.removeItem(id);
        return;
      }
    }
    this.save();
    this.updateUI();
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTotalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  save() {
    localStorage.setItem('studioRoosCart', JSON.stringify(this.items));
  }

  toggleSidebar(open) {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.toggle('active', open);
    if (overlay) overlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  updateUI() {
    // Update cart count
    const countEl = document.getElementById('cartCount');
    if (countEl) {
      const total = this.getTotalItems();
      countEl.textContent = total;
      countEl.style.display = total > 0 ? 'flex' : 'none';
    }

    // Update cart items list
    const cartItemsEl = document.getElementById('cartItems');
    const cartEmptyEl = document.getElementById('cartEmpty');
    const cartFooterEl = document.getElementById('cartFooter');
    const cartTotalEl = document.getElementById('cartTotal');

    if (!cartItemsEl) return;

    if (this.items.length === 0) {
      if (cartEmptyEl) cartEmptyEl.style.display = 'block';
      if (cartFooterEl) cartFooterEl.style.display = 'none';
      // Remove all cart-item elements
      cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
      return;
    }

    if (cartEmptyEl) cartEmptyEl.style.display = 'none';
    if (cartFooterEl) cartFooterEl.style.display = 'block';

    // Rebuild items
    const existingItems = cartItemsEl.querySelectorAll('.cart-item');
    existingItems.forEach(el => el.remove());

    this.items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p class="price">€${item.price.toFixed(2).replace('.', ',')}</p>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.25rem;">
            <button class="cart-qty-btn" data-id="${item.id}" data-delta="-1" 
                    style="width:24px;height:24px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;">−</button>
            <span style="font-size:0.9rem;min-width:20px;text-align:center;">${item.quantity}</span>
            <button class="cart-qty-btn" data-id="${item.id}" data-delta="1" 
                    style="width:24px;height:24px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${item.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      cartItemsEl.appendChild(itemEl);
    });

    // Bind quantity buttons
    cartItemsEl.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateQuantity(btn.dataset.id, parseInt(btn.dataset.delta));
      });
    });

    // Bind remove buttons
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeItem(btn.dataset.id);
      });
    });

    // Update total
    if (cartTotalEl) {
      cartTotalEl.textContent = `€${this.getTotal().toFixed(2).replace('.', ',')}`;
    }
  }
}


// ==========================================
// TOAST NOTIFICATIE
// ==========================================
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  clearTimeout(toastTimeout);
  toastMsg.textContent = message;
  toast.classList.add('show');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Make globally available
window.showToast = showToast;


// ==========================================
// NAVBAR — Scroll effect
// ==========================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    navbar.classList.toggle('scrolled', currentScroll > 50);
    lastScroll = currentScroll;
  }, { passive: true });

  // Mobile toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }
}


// ==========================================
// SCROLL ANIMATIES (Intersection Observer)
// ==========================================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve — keep it simple, one-time trigger
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  });

  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .scale-in').forEach(el => {
    observer.observe(el);
  });
}


// ==========================================
// LIGHTBOX
// ==========================================
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxInfo = document.getElementById('lightboxInfo');
  const lightboxClose = document.getElementById('lightboxClose');

  if (!lightbox || !lightboxImg) return;

  // Quick view buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-view-btn');
    if (!btn) return;

    const card = btn.closest('.artwork-card');
    if (!card) return;

    const img = card.querySelector('.artwork-card-image img');
    const title = card.querySelector('.artwork-card-info h4');
    const dims = card.querySelector('.artwork-card-info .dimensions');
    const price = card.querySelector('.artwork-card-info .price');

    if (img) {
      // Get high-res version
      lightboxImg.src = img.src.replace(/w=\d+/, 'w=1200').replace(/h=\d+/, 'h=1500');
      lightboxImg.alt = img.alt;
    }

    if (lightboxInfo) {
      lightboxInfo.innerHTML = `
        <h3 style="margin-bottom:0.25rem;">${title ? title.textContent : ''}</h3>
        <p style="margin:0;">${dims ? dims.textContent : ''}</p>
        <p style="margin:0.5rem 0 0;font-size:1.2rem;font-weight:700;color:var(--terracotta-light);">${price ? price.textContent : ''}</p>
      `;
    }

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  // Close
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}


// ==========================================
// WINKEL FILTERS & SORTERING
// ==========================================
function initShopFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const shopGrid = document.getElementById('shopGrid');
  const resultCount = document.getElementById('resultCount');
  const sortSelect = document.getElementById('sortSelect');

  if (!filterBtns.length || !shopGrid) return;

  let currentFilter = 'alle';

  // Check URL params for initial filter
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('categorie');
  if (categoryParam) {
    currentFilter = categoryParam;
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === currentFilter);
    });
  }

  function filterAndSort() {
    const cards = Array.from(shopGrid.querySelectorAll('.artwork-card'));
    let visible = 0;

    cards.forEach(card => {
      const category = card.dataset.category;
      const show = currentFilter === 'alle' || category === currentFilter;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // Sort
    if (sortSelect) {
      const sortValue = sortSelect.value;
      const visibleCards = cards.filter(c => c.style.display !== 'none');

      visibleCards.sort((a, b) => {
        switch (sortValue) {
          case 'prijs-laag':
            return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
          case 'prijs-hoog':
            return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
          case 'naam':
            return a.dataset.name.localeCompare(b.dataset.name);
          case 'nieuwste':
          default:
            return (b.dataset.date || '').localeCompare(a.dataset.date || '');
        }
      });

      visibleCards.forEach(card => shopGrid.appendChild(card));
    }

    if (resultCount) {
      resultCount.textContent = visible;
    }
  }

  // Bind filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      filterAndSort();
    });
  });

  // Bind sort
  if (sortSelect) {
    sortSelect.addEventListener('change', filterAndSort);
  }

  // Initial filter/sort
  filterAndSort();
}


// ==========================================
// PARALLAX-ACHTIGE BLOB BEWEGING
// ==========================================
function initParallaxBlobs() {
  const blobs = document.querySelectorAll('.organic-blob');
  if (!blobs.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        blobs.forEach((blob, i) => {
          const speed = 0.05 + (i * 0.02);
          blob.style.transform = `translateY(${scrollY * speed}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}


// ==========================================
// SMOOTH REVEAL voor stagger items
// ==========================================
function initStaggerReveal() {
  const grids = document.querySelectorAll('.featured-grid, .shop-grid, .categories-grid, .process-steps');
  
  grids.forEach(grid => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const children = entry.target.children;
          Array.from(children).forEach((child, i) => {
            child.style.transitionDelay = `${i * 0.1}s`;
            child.classList.add('visible');
          });
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    observer.observe(grid);
  });
}


// ==========================================
// INITIALISATIE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Core functionaliteit
  const cart = new Cart();
  initNavbar();
  initScrollAnimations();
  initLightbox();
  initShopFilters();
  initParallaxBlobs();
  initStaggerReveal();

  // Keyboard nav voor Escape (sluit cart)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cart.toggleSidebar(false);
    }
  });
});
