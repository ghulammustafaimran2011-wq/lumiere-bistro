/**
 * ============================================================
 * LUMIÈRE Bistro — utils.js
 * Foundation layer: chhote helper functions jo har module use karta hai.
 * Is file par kisi aur module ki dependency NAHI hai — sab isay import karte hain.
 * ============================================================
 */

/* ---------- 1. DOM selectors (shorthand) ---------- */
// QuerySelector ki typing bachane ke liye do chhote helpers
export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) =>
  Array.from(scope.querySelectorAll(selector));

/* ---------- 2. Higher-order functions ---------- */
// Debounce: search input par har keystroke par filter chalane ki bajaye
// last keystroke ke baad thora ruk kar ek dafa chalate hain (performance).
export function debounce(fn, wait = 250) {
  let timerId = null;
  return function debounced(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* ---------- 3. Formatting helpers ---------- */
// Paisa hamesha "dollars 2 decimals" me dikhana hai — $55.00
export function formatCurrency(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

export function formatDate(value, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/* ---------- 4. Numbers & strings ---------- */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// User-generated text ko HTML me daalne se pehle escape karna zaroori hai (XSS safety)
const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
export const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

/* ---------- 5. URL helpers ---------- */
// menu-item.html?id=truffle-risotto — query param parhne ke liye
export const getQueryParam = (key) =>
  new URLSearchParams(window.location.search).get(key);

/* ---------- 6. ID generators ---------- */
export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
export const generateOrderRef = () => `LB-${String(randomInt(1000, 9999))}`;
export const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- 7. Async helpers ---------- */
// API latency simulate karne ke liye (api.js use karta hai)
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Modern deep-clone — agar browser me structuredClone na ho to JSON fallback
export const clone = (value) =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

/* ---------- 8. Form data ---------- */
// FormData ko plain object me convert — spread ke sath poster me aasan
export const getFormData = (form) => Object.fromEntries(new FormData(form));

/* ---------- 9. Event bus (pub/sub via CustomEvent) ---------- */
// Modules aapas me directly call nahi karte — bus par events emit/sunte hain.
// Faida: cart.js ko pata nahi hota kitne badges page par hain, wo bas event chhorrta hai.
export const bus = {
  emit(type, detail = {}) {
    document.dispatchEvent(new CustomEvent(type, { detail }));
  },
  on(type, handler) {
    document.addEventListener(type, handler);
  },
  off(type, handler) {
    document.removeEventListener(type, handler);
  },
};

/** App-wide event names — typos se bachne ke liye constants use karo */
export const EVENTS = Object.freeze({
  CART_CHANGED: "cart:changed",
  WISHLIST_CHANGED: "wishlist:changed",
  USER_CHANGED: "user:changed",
});
