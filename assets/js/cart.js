/**
 * ============================================================
 * LUMIÈRE Bistro — cart.js
 * Cart state + orders: add/remove/qty, cart page render, mini-cart
 * (order-online), checkout summary, promo codes, place order,
 * confirmation render, tracking, aur defensive order-history hook.
 * State localStorage me persist hoti hai — refresh par bachi rehti hai.
 * ============================================================
 */

import {
  $, $$, bus, EVENTS, formatCurrency, formatDate, clamp,
  generateOrderRef, getFormData, escapeHTML, clone,
} from './utils.js';
import { storage, STORAGE_KEYS } from './storage.js';
import { api, findDishSync, dishImage } from './api.js';
import { toast } from './components.js';
import { validateForm, setFormMessage } from './forms.js';

/* ---------- Business rules (HTML ke static numbers se match) ---------- */
const TAX_RATE = 0.08;
const DELIVERY_FEE = 6;
const FREE_DELIVERY_THRESHOLD = 60;
const MAX_QTY = 20;

/* ---------- State ---------- */
let items = [];   // [{ id, name, price, qty }]
let promo = null; // { code, type, value, label }

const totalCount = () => items.reduce((sum, item) => sum + item.qty, 0);
const findItem = (id) => items.find((item) => item.id === id);
const getCartItemSelector = (id) => {
  const value = String(id);
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/(["\\])/g, '\\$1');
};

const persist = () => {
  storage.set(STORAGE_KEYS.CART, items);
  bus.emit(EVENTS.CART_CHANGED, { count: totalCount(), items: clone(items) });
};

/* ============================================================
   Mutations
   ============================================================ */
function addItem({ id, name, price, qty = 1 }) {
  const existing = findItem(id);
  if (existing) existing.qty = clamp(existing.qty + qty, 1, MAX_QTY);
  else items.push({ id, name, price, qty: clamp(qty, 1, MAX_QTY) });
  persist();
  renderAll();
}

function setQty(id, qty) {
  const item = findItem(id);
  if (!item) return;
  item.qty = clamp(qty, 1, MAX_QTY);
  persist();
  renderAll();
}

function changeQty(id, delta) {
  const item = findItem(id);
  if (!item) return;
  if (item.qty + delta <= 0) { removeItem(id, true); return; } // qty 1 par minus → item hat jata hai
  setQty(id, item.qty + delta);
}

function removeItem(id, notify = false) {
  const item = findItem(id);
  items = items.filter((entry) => entry.id !== id);
  persist();
  renderAll();
  if (notify && item) toast(`${item.name} removed from cart.`, { type: 'info' });
}

function clearCart() {
  items = [];
  promo = null;
  persist();
  renderAll();
  toast('Cart cleared.', { type: 'info' });
}

/* ============================================================
   Totals — promo, delivery (free over $60 / pickup par 0), 8% tax
   ============================================================ */
function getCurrentMode() {
  const checked = document.querySelector('input[name="fulfilment"]:checked, input[name="order-mode"]:checked');
  return checked?.value === 'pickup' ? 'pickup' : 'delivery';
}

function getTotals() {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = promo
    ? (promo.type === 'percent' ? (subtotal * promo.value) / 100 : Math.min(promo.value, subtotal))
    : 0;
  const net = Math.max(0, subtotal - discount);
  const delivery = items.length === 0 || getCurrentMode() === 'pickup' || net >= FREE_DELIVERY_THRESHOLD
    ? 0
    : DELIVERY_FEE;
  const tax = net * TAX_RATE;
  return { subtotal, discount, delivery, tax, total: net + delivery + tax, count: totalCount() };
}

function updateTotalsDOM() {
  const totals = getTotals();
  $$('[data-cart-subtotal]').forEach((el) => { el.textContent = formatCurrency(totals.subtotal); });
  $$('[data-cart-delivery]').forEach((el) => {
    el.textContent = totals.delivery === 0 && totals.count > 0 ? 'Free' : formatCurrency(totals.delivery);
  });
  $$('[data-cart-tax]').forEach((el) => { el.textContent = formatCurrency(totals.tax); });
  $$('[data-cart-total]').forEach((el) => { el.textContent = formatCurrency(totals.total); });

  // Cart page ki har row ka line-total aur qty input sync karo.
  // CSS.escape: IDs me special characters hon to bhi selector safe rahe.
  items.forEach((item) => {
    const row = document.querySelector(`[data-cart-item="${getCartItemSelector(item.id)}"]`);
    if (!row) return;
    const line = row.querySelector('[data-cart-line-total]');
    if (line) line.textContent = formatCurrency(item.price * item.qty);
    const input = row.querySelector('[data-quantity-input]');
    if (input && Number(input.value) !== item.qty) input.value = String(item.qty);
  });
}

/* ============================================================
   Renders
   ============================================================ */
function cartRowHTML(item) {
  const dish = findDishSync(item.id);
  const image = dish ? dishImage(dish, 200, 200) : 'https://picsum.photos/seed/lumiere-dish/200/200.jpg';
  const name = escapeHTML(item.name);
  const id = escapeHTML(item.id);
  return `
    <li class="cart-item" data-cart-item="${id}">
      <img class="cart-item-image" src="${image}" alt="" width="200" height="200" loading="lazy">
      <div class="cart-item-info">
        <h3 class="cart-item-name"><a href="menu-item.html?id=${encodeURIComponent(item.id)}">${name}</a></h3>
        <p class="cart-item-price">${formatCurrency(item.price)} each</p>
      </div>
      <div class="quantity" data-quantity-selector>
        <button class="quantity-btn" type="button" data-cart-decrease="${id}" aria-label="Decrease quantity of ${name}">−</button>
        <input class="quantity-input" type="number" data-quantity-input value="${item.qty}" min="1" max="${MAX_QTY}" inputmode="numeric" aria-label="Quantity of ${name}">
        <button class="quantity-btn" type="button" data-cart-increase="${id}" aria-label="Increase quantity of ${name}">+</button>
      </div>
      <p class="cart-item-total" data-cart-line-total>${formatCurrency(item.price * item.qty)}</p>
      <button class="cart-remove" type="button" data-cart-remove="${id}" aria-label="Remove ${name} from cart">✕<span class="visually-hidden"> Remove</span></button>
    </li>`;
}

function renderCartPage() {
  const list = $('[data-cart-items]');
  if (!list) return;
  const emptyEl = $('[data-cart-empty]');
  if (items.length === 0) {
    list.innerHTML = '';
    list.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
  } else {
    list.hidden = false;
    if (emptyEl) emptyEl.hidden = true;
    list.innerHTML = items.map(cartRowHTML).join('');
  }
  updateTotalsDOM();
}

/** order-online.html ka sticky mini-cart */
function renderMiniCart() {
  const list = $('[data-cart-summary-items]');
  if (!list) return;
  list.innerHTML = items.length === 0
    ? '<li class="order-cart-empty-note" data-cart-empty-note>Your cart is empty — add dishes to get started.</li>'
    : items.map((item) => `
        <li>
          <span>${escapeHTML(item.name)} × ${item.qty}</span>
          <span>${formatCurrency(item.price * item.qty)}</span>
        </li>`).join('');
  updateTotalsDOM();
}

/** checkout.html ka order summary */
function renderCheckoutSummary() {
  const list = $('[data-order-summary-items]');
  if (!list) return;
  list.innerHTML = items.length === 0
    ? '<li class="summary-item"><span>Your cart is empty</span><span>—</span></li>'
    : items.map((item) => `
        <li class="summary-item">
          <span>${escapeHTML(item.name)} × ${item.qty}</span>
          <span>${formatCurrency(item.price * item.qty)}</span>
        </li>`).join('');
  updateTotalsDOM();
}

function renderAll() {
  renderCartPage();
  renderMiniCart();
  renderCheckoutSummary();
  updateTotalsDOM();
}

/** Pehli dafa cart.html khula ho to static demo rows ko real state bana lo */
function hydrateFromDOM() {
  const container = $('[data-cart-container]');
  if (!container) return false;
  const rows = $$('[data-cart-item]', container);
  if (rows.length === 0) return false;
  items = rows.map((row) => {
    const id = row.dataset.cartItem;
    const dish = findDishSync(id);
    const name = row.querySelector('.cart-item-name')?.textContent.trim() || dish?.name || id;
    const priceText = row.querySelector('.cart-item-price')?.textContent ?? '';
    const price = (dish?.price ?? Number(priceText.replace(/[^0-9.]/g, ''))) || 0;
    const qty = clamp(parseInt(row.querySelector('[data-quantity-input]')?.value ?? '1', 10) || 1, 1, MAX_QTY);
    return { id, name, price, qty };
  }).filter((item) => item.price > 0);
  return items.length > 0;
}

/* ============================================================
   Add-to-cart (global delegation — har page par kaam karta hai)
   ============================================================ */
function handleAddToCart(button) {
  const id = button.dataset.addToCart;
  const dish = findDishSync(id);
  const name = button.dataset.dishName || dish?.name || id;
  const price = Number(button.dataset.dishPrice ?? dish?.price ?? 0);
  if (!id || price <= 0) {
    toast('Sorry — dish details load nahi ho sakein.', { type: 'error' });
    return;
  }
  let qty = 1;
  // Detail page par quantity stepper ka input bhi parhna hai
  if (button.hasAttribute('data-uses-quantity-input')) {
    const input = button.closest('[data-menu-item]')?.querySelector('[data-quantity-input]');
    qty = clamp(parseInt(input?.value ?? '1', 10) || 1, 1, MAX_QTY);
  }
  addItem({ id, name, price, qty });
  toast(`${name} added to cart — ${formatCurrency(price * qty)}`, { type: 'success' });
}

/* ============================================================
   Promo codes (cart + checkout dono pages par form hai)
   ============================================================ */
function initPromoForms() {
  $$('[data-promo-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const input = form.querySelector('[data-promo-input]');
      const message = form.querySelector('[data-promo-message]');
      const code = input?.value.trim() ?? '';
      if (!code) {
        setFormMessage(message, 'Please enter a promo code.', true);
        return;
      }
      try {
        promo = await api.validatePromo(code);
        setFormMessage(message, `Code applied — ${promo.label}.`, false);
        toast(`Promo ${promo.code} applied!`, { type: 'success' });
      } catch (error) {
        promo = null;
        setFormMessage(message, error.message, true);
      }
      renderAll();
    });
  });
}

/* ============================================================
   Checkout submit → order save → confirmation page
   ============================================================ */
function initCheckout() {
  const form = $('[data-checkout-form]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm(form)) {
      toast('Please check the highlighted fields.', { type: 'error' });
      return;
    }
    if (items.length === 0) {
      toast('Your cart is empty.', { type: 'error' });
      return;
    }

    const submitBtn = form.querySelector('[data-place-order]');
    submitBtn?.classList.add('is-loading');

    try {
      const data = getFormData(form);
      const order = {
        ref: generateOrderRef(),
        placedAt: new Date().toISOString(),
        mode: getCurrentMode(),
        slot: data.timeslot ?? '',
        customer: { name: data.name, email: data.email, phone: data.phone },
        items: clone(items),
        totals: getTotals(),
      };

      await api.placeOrder(order);

      // Orders history + lastOrder (confirmation page isi se render hota hai)
      const orders = storage.get(STORAGE_KEYS.ORDERS, []);
      orders.unshift(order);
      storage.set(STORAGE_KEYS.ORDERS, orders);
      storage.set(STORAGE_KEYS.LAST_ORDER, order);

      items = [];
      promo = null;
      persist();
      window.location.assign('order-confirmation.html');
    } catch (error) {
      submitBtn?.classList.remove('is-loading');
      setFormMessage(form.querySelector('[data-checkout-message]'), error.message, true);
      toast(error.message, { type: 'error' });
    }
  });
}

/* ============================================================
   Order confirmation render (LAST_ORDER se)
   ============================================================ */
function renderConfirmation() {
  if (!$('[data-order-confirmation-summary]')) return;
  const order = storage.get(STORAGE_KEYS.LAST_ORDER, null);
  if (!order) return; // koi placed order nahi → static demo content as-is rahega

  $$('[data-order-reference], [data-order-reference-echo]').forEach((el) => {
    el.textContent = order.ref;
  });

  const listEl = $('[data-order-confirmation-summary] .summary-items');
  if (listEl) {
    listEl.innerHTML = order.items.map((item) => `
      <li class="summary-item">
        <span>${escapeHTML(item.name)} × ${item.qty}</span>
        <span>${formatCurrency(item.price * item.qty)}</span>
      </li>`).join('');
  }

  // Totals rows (subtotal, delivery, tax, total) order se update karo
  const values = [order.totals?.subtotal, order.totals?.delivery, order.totals?.tax, order.totals?.total];
  $$('[data-order-confirmation-summary] .cart-total-row dd').forEach((dd, index) => {
    if (values[index] !== undefined) dd.textContent = formatCurrency(values[index]);
  });
}

/* ============================================================
   Order tracking (order-tracking.html)
   ============================================================ */
function applyTrackingResult({ stage, eta }) {
  const steps = $$('[data-tracking-steps] .tracking-step');
  steps.forEach((step, index) => {
    step.classList.toggle('tracking-step--done', index < stage);
    step.classList.toggle('tracking-step--current', index === stage);
    if (index === stage) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
  const etaEl = $('[data-tracking-eta]');
  if (etaEl && eta) etaEl.textContent = eta;
}

function initTracking() {
  const form = $('[data-tracking-form]');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageEl = $('[data-tracking-message]');
    if (!validateForm(form)) return;
    const data = getFormData(form);
    setFormMessage(messageEl, 'Checking your order…', false);
    try {
      const result = await api.trackOrder(String(data.reference ?? '').trim(), data.email);
      applyTrackingResult(result);
      setFormMessage(messageEl, `Order ${result.ref} found — status updated below.`, false);
    } catch (error) {
      setFormMessage(messageEl, error.message, true);
    }
  });
}

/* ============================================================
   Defensive hook: future order-history.html (page 29)
   ============================================================ */
function renderOrderHistory() {
  const container = $('[data-order-history-container]');
  if (!container) return;
  const orders = storage.get(STORAGE_KEYS.ORDERS, []);
  if (orders.length === 0) {
    container.innerHTML = '<p class="menu-empty">No demo orders yet — place one from the checkout page.</p>';
    return;
  }
  container.innerHTML = orders.map((order) => `
    <article class="info-card">
      <h3 class="info-card-title">Order ${escapeHTML(order.ref)}</h3>
      <p>${formatDate(order.placedAt)} · ${escapeHTML(order.mode ?? 'delivery')} ·
         <strong>${formatCurrency(order.totals?.total ?? 0)}</strong></p>
      <ul class="summary-items">
        ${(order.items ?? []).map((item) => `
          <li class="summary-item">
            <span>${escapeHTML(item.name)} × ${item.qty}</span>
            <span>${formatCurrency(item.price * item.qty)}</span>
          </li>`).join('')}
      </ul>
      <p><a class="btn btn--outline btn--small" href="order-tracking.html">Track order</a></p>
    </article>`).join('');
}

/* ============================================================
   Global event delegation — ek hi listener, saare cart buttons
   ============================================================ */
function bindGlobalEvents() {
  document.addEventListener('click', (event) => {
    const addBtn = event.target.closest('[data-add-to-cart]');
    if (addBtn) { handleAddToCart(addBtn); return; }

    const stepBtn = event.target.closest('[data-quantity-step]');
    if (stepBtn) {
      // Detail page ka − / + stepper: sirf input ki value badalta hai
      const input = stepBtn.closest('[data-quantity-selector]')?.querySelector('[data-quantity-input]');
      if (input) {
        const current = parseInt(input.value, 10) || 1;
        const next = stepBtn.dataset.quantityStep === 'plus' ? current + 1 : current - 1;
        input.value = String(clamp(next, 1, MAX_QTY));
      }
      return;
    }

    const inc = event.target.closest('[data-cart-increase]');
    if (inc) { changeQty(inc.dataset.cartIncrease, +1); return; }

    const dec = event.target.closest('[data-cart-decrease]');
    if (dec) { changeQty(dec.dataset.cartDecrease, -1); return; }

    const remove = event.target.closest('[data-cart-remove]');
    if (remove) { removeItem(remove.dataset.cartRemove, true); return; }

    if (event.target.closest('[data-cart-clear]')) clearCart();
  });

  // Cart rows ke number inputs (user seedha type kare)
  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-quantity-input]');
    if (!input) return;
    const row = input.closest('[data-cart-item]');
    if (!row) return; // detail page ka stepper input — wo click handler dekh leta hai
    setQty(row.dataset.cartItem, parseInt(input.value, 10) || 1);
  });

  // Delivery/pickup badalne par totals turant update (pickup = free)
  $$('input[name="order-mode"], input[name="fulfilment"]').forEach((radio) => {
    radio.addEventListener('change', updateTotalsDOM);
  });
}

/* ---------- Init ---------- */
export function init() {
  const stored = storage.get(STORAGE_KEYS.CART, null);
  if (Array.isArray(stored)) {
    items = stored; // pehle se saved cart (ya intentionally khali cart)
  } else if ($('[data-cart-container]') && hydrateFromDOM()) {
    persist(); // pehli visit: static demo rows ko real, persisted state bana do
  }

  bindGlobalEvents();
  initPromoForms();
  initCheckout();
  initTracking();
  renderAll();
  renderConfirmation();
  renderOrderHistory();
  bus.emit(EVENTS.CART_CHANGED, { count: totalCount(), items: clone(items) });
}