/**
 * ============================================================
 * LUMIÈRE Bistro — wishlist.js
 * Saved dishes: header heart buttons se toggle, badge event emit,
 * aur wishlist page par dish-card markup render (existing CSS reuse).
 * ============================================================
 */

import { $, $$, bus, EVENTS, escapeHTML } from "./utils.js";
import { storage, STORAGE_KEYS } from "./storage.js";
import { findDishSync, dishImage, buildTagListHTML } from "./api.js";
import { toast } from "./components.js";

let ids = []; // sirf dish IDs save hoti hain — details catalog se aati hain

const has = (id) => ids.includes(id);

function persist() {
  storage.set(STORAGE_KEYS.WISHLIST, ids);
  bus.emit(EVENTS.WISHLIST_CHANGED, { count: ids.length });
}

function toggle(id, name) {
  if (has(id)) {
    ids = ids.filter((entry) => entry !== id);
    toast(`${name} removed from saved dishes.`, { type: "info" });
  } else {
    ids = [...ids, id]; // spread se nayi array — state mutation avoid
    toast(`${name} saved to your wishlist.`, { type: "success" });
  }
  persist();
  renderContainer();
  syncButtonStates();
}

/** Saare heart buttons ka pressed state sync karo (detail page ke "Save for later" bhi) */
function syncButtonStates() {
  $$("[data-add-to-wishlist]").forEach((button) => {
    const saved = has(button.dataset.addToWishlist);
    button.classList.toggle("is-saved", saved);
    button.setAttribute("aria-pressed", String(saved));
  });
}

/* ---------- Wishlist page render ---------- */
function wishlistCardHTML(dish) {
  const name = escapeHTML(dish.name);
  const id = escapeHTML(dish.id);
  return `
    <article class="dish-card" data-dish-id="${id}" data-dish-category="${dish.category}">
      <div class="dish-card-media">
        <img src="${dishImage(dish)}" alt="${name}" width="800" height="600" loading="lazy">
      </div>
      <div class="dish-card-body">
        <div class="dish-card-head">
          <h3 class="dish-card-title"><a href="menu-item.html?id=${encodeURIComponent(dish.id)}">${name}</a></h3>
          <p class="dish-card-price">$${dish.price.toFixed(0)}</p>
        </div>
        <p class="dish-card-desc">${escapeHTML(dish.desc)}</p>
        <ul class="dish-card-tags" aria-label="Dietary tags">${buildTagListHTML(dish.tags)}</ul>
        <div class="dish-card-actions">
          <button class="btn btn--primary btn--small" type="button"
                  data-add-to-cart="${id}" data-dish-name="${name}" data-dish-price="${dish.price.toFixed(2)}">
            Add to cart
          </button>
          <button class="btn btn--icon" type="button"
                  data-remove-from-wishlist="${id}" data-dish-name="${name}"
                  aria-label="Remove ${name} from wishlist">✕</button>
        </div>
      </div>
    </article>`;
}

function renderContainer() {
  const container = $("[data-wishlist-container]");
  if (!container) return; // wishlist page nahi hai — kuch nahi karna

  const dishes = ids.map((id) => findDishSync(id)).filter(Boolean);
  if (dishes.length === 0) {
    // Reusable empty state — .cart-empty classes CSS me already styled hain
    container.innerHTML = `
      <div class="cart-empty">
        <h2 class="section-title">Your wishlist is empty</h2>
        <p>Tap the heart on any dish and it will wait for you here.</p>
        <div class="hero-actions">
          <a class="btn btn--primary" href="menu.html">Browse the menu</a>
        </div>
      </div>`;
    return;
  }
  container.innerHTML = `<div class="grid grid--3 dish-grid">${dishes.map(wishlistCardHTML).join("")}</div>`;
}

/* ---------- Global delegation ---------- */
function bindGlobalEvents() {
  document.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-add-to-wishlist]");
    if (addBtn) {
      const id = addBtn.dataset.addToWishlist;
      const name = addBtn.dataset.dishName || findDishSync(id)?.name || id;
      if (id) toggle(id, name);
      return;
    }

    const removeBtn = event.target.closest("[data-remove-from-wishlist]");
    if (removeBtn) {
      ids = ids.filter(
        (entry) => entry !== removeBtn.dataset.removeFromWishlist,
      );
      persist();
      renderContainer();
      toast("Removed from wishlist.", { type: "info" });
    }
  });
}

/* ---------- Init ---------- */
export function init() {
  const stored = storage.get(STORAGE_KEYS.WISHLIST, []);
  ids = Array.isArray(stored) ? stored : [];
  bindGlobalEvents();
  renderContainer();
  syncButtonStates();
  bus.emit(EVENTS.WISHLIST_CHANGED, { count: ids.length });
}
