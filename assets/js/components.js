/**
 * ============================================================
 * LUMIÈRE Bistro — components.js
 * Global UI jo HAR page par chalta hai: toasts, mobile nav,
 * header badges, footer year, open/closed status, accordions,
 * offer/event buttons, aur reusable FilterableGrid + chip wiring.
 * ============================================================
 */

import { $, $$, bus, EVENTS } from "./utils.js";
import { storage, STORAGE_KEYS } from "./storage.js";
import { api } from "./api.js";

/* ============================================================
   1. Toast notifications
   ============================================================ */
const TOAST_TYPES = new Set(["info", "success", "error"]);

class ToastManager {
  #container = null;

  init() {
    // Har page ke body ke aakhir me [data-toast-container] mojood hai;
    // agar kisi page par missing ho to khud bana lete hain (defensive).
    this.#container = $("[data-toast-container]");
    if (!this.#container) {
      this.#container = document.createElement("div");
      this.#container.className = "toast-container";
      this.#container.setAttribute("data-toast-container", "");
      this.#container.setAttribute("role", "status");
      this.#container.setAttribute("aria-live", "polite");
      document.body.appendChild(this.#container);
    }
  }

  show(message, { type = "info", duration = 3500 } = {}) {
    if (!this.#container || !message) return;
    const kind = TOAST_TYPES.has(type) ? type : "info";

    const element = document.createElement("div");
    element.className = `toast toast--${kind}`;
    element.setAttribute("role", "status");
    element.innerHTML = `
      <span class="toast-message"></span>
      <button class="toast-close" type="button" aria-label="Dismiss notification">×</button>
    `;
    // Message textContent se set karte hain — HTML injection safe
    element.querySelector(".toast-message").textContent = message;

    const remove = () => {
      element.classList.add("is-leaving");
      element.addEventListener("transitionend", () => element.remove(), {
        once: true,
      });
      // transitionend kabhi fire na ho to safety timeout
      setTimeout(() => element.remove(), 600);
    };

    element.querySelector(".toast-close").addEventListener("click", remove);
    this.#container.appendChild(element);
    setTimeout(remove, duration);
  }
}

export const toastManager = new ToastManager();

/** Kahin se bhi 1-line toast: toast('Saved!', { type: 'success' }) */
export const toast = (message, options) => toastManager.show(message, options);

/* ============================================================
   2. Navigation (mobile toggle + "More" dropdown)
   ============================================================ */
function initNavigation() {
  const header = $(".site-header");
  const toggle = $("[data-nav-toggle]");

  if (header && toggle) {
    // CSS me hamburger tab dikhta hai jab .nav-ready ho — JS hone par enable karo
    header.classList.add("nav-ready");

    toggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Kisi nav link par click → mobile menu band kar do
    header.addEventListener("click", (event) => {
      if (!event.target.closest(".site-nav a")) return;
      if (header.classList.contains("nav-open")) {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && header.classList.contains("nav-open")) {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    // Desktop size par aate hi mobile classes saaf kar do
    const desktopQuery = window.matchMedia("(min-width: 880px)");
    const handleDesktop = (mq) => {
      if (mq.matches) {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    };
    desktopQuery.addEventListener("change", handleDesktop);
  }

  // "More" dropdown (native <details>) — bahar click ya Escape par band
  const moreMenu = $(".nav-details");
  if (moreMenu) {
    document.addEventListener("click", (event) => {
      if (moreMenu.open && !moreMenu.contains(event.target))
        moreMenu.open = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && moreMenu.open) moreMenu.open = false;
    });
  }
}

/* ============================================================
   3. Cart / wishlist count badges (header)
   ============================================================ */
function initBadges() {
  const setCount = (selector, count) => {
    $$(selector).forEach((el) => {
      el.textContent = String(count);
    });
  };
  const refresh = () => {
    const cartItems = storage.get(STORAGE_KEYS.CART, []);
    const cartCount = cartItems.reduce(
      (sum, item) => sum + (Number(item?.qty) || 0),
      0,
    );
    const wishCount = storage.get(STORAGE_KEYS.WISHLIST, []).length;
    setCount("[data-cart-count]", cartCount);
    setCount("[data-wishlist-count]", wishCount);
  };
  refresh();
  // cart.js / wishlist.js sirf events emit karte hain — badge yahan update hota hai
  bus.on(EVENTS.CART_CHANGED, refresh);
  bus.on(EVENTS.WISHLIST_CHANGED, refresh);
}

/* ============================================================
   4. Account link — demo login ke baad "Sign in" → "Hi, Name"
   ============================================================ */
function initAccountLink() {
  const link = $("[data-nav-account]");
  const apply = (user) => {
    if (link && user?.name) {
      link.textContent = `Hi, ${user.name.split(" ")[0]}`;
      link.href = "profile.html";
    }
  };
  apply(storage.get(STORAGE_KEYS.USER, null));
  bus.on(EVENTS.USER_CHANGED, (event) => apply(event.detail?.user));
}

/* ============================================================
   5. Footer year + open/closed status
   ============================================================ */
function initYear() {
  const year = String(new Date().getFullYear());
  $$("[data-year]").forEach((el) => {
    el.textContent = year;
  });
}

// Minutes me opening hours — index = getDay() (0 = Sunday ... 6 = Saturday)
const OPENING_HOURS = {
  0: [[11 * 60, 15 * 60]], // Sun brunch
  1: [], // Mon closed
  2: [
    [12 * 60, 14 * 60 + 30],
    [18 * 60, 22 * 60 + 30],
  ], // Tue
  3: [
    [12 * 60, 14 * 60 + 30],
    [18 * 60, 22 * 60 + 30],
  ], // Wed
  4: [
    [12 * 60, 14 * 60 + 30],
    [18 * 60, 22 * 60 + 30],
  ], // Thu
  5: [
    [12 * 60, 14 * 60 + 30],
    [18 * 60, 22 * 60 + 30],
  ], // Fri
  6: [[18 * 60, 22 * 60 + 30]], // Sat
};

function initOpenStatus() {
  const el = $("[data-open-status]");
  if (!el) return;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const windows = OPENING_HOURS[now.getDay()] ?? [];
  const isOpen = windows.some(([from, to]) => minutes >= from && minutes < to);
  el.textContent = isOpen ? "Open now" : "Closed now";
  el.style.color = isOpen ? "var(--color-success)" : "var(--color-error)";
}

/* ============================================================
   6. Accordions — ek group me ek dafa ek hi khula rahe
   ============================================================ */
function initAccordions() {
  $$(".accordion").forEach((details) => {
    // Note: 'toggle' event bubble nahi hota — is liye har element par lagate hain
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      const parent = details.parentElement;
      if (!parent) return;
      $$(".accordion", parent)
        .filter((sibling) => sibling !== details)
        .forEach((sibling) => {
          sibling.open = false;
        });
    });
  });
}

/* ============================================================
   7. Offer claim + event RSVP buttons
   ============================================================ */
function initOfferClaims() {
  $$("[data-offer-claim]").forEach((button) => {
    button.addEventListener("click", async () => {
      const offerId = button.dataset.offerClaim;
      try {
        await api.claimOffer(offerId);
        const saved = storage.get(STORAGE_KEYS.SAVED_OFFERS, []);
        if (!saved.includes(offerId)) saved.push(offerId);
        storage.set(STORAGE_KEYS.SAVED_OFFERS, saved);
        toast(
          `${button.dataset.offerName ?? "Offer"} saved — mention it when you book.`,
          { type: "success" },
        );
      } catch (error) {
        toast(error.message, { type: "error" });
      }
    });
  });
}

function initEventRsvp() {
  $$("[data-event-rsvp]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api.rsvpEvent(button.dataset.eventRsvp);
        toast(
          `RSVP received for ${button.dataset.eventName ?? "the event"} — details are on their way.`,
          { type: "success" },
        );
      } catch (error) {
        toast(error.message, { type: "error" });
      }
    });
  });
}

/* ============================================================
   8. Reusable FilterableGrid — menu, dietary aur gallery pages
   sab isi class se filter/search/sort hote hain (ek hi logic, teen pages).
   ============================================================ */
export class FilterableGrid {
  #items;
  #active;
  #term;
  #sortFn;

  constructor({ grid, countEl = null, emptyEl = null, unit = "dishes" }) {
    this.grid = grid;
    this.countEl = countEl;
    this.emptyEl = emptyEl;
    this.unit = unit;
    this.#items = grid ? Array.from(grid.children) : [];
    this.#active = new Map(); // filterKey -> value (Map concept)
    this.#term = "";
    this.#sortFn = null;
  }

  setFilter(key, value) {
    this.#active.set(key, value);
    this.apply();
  }
  setSearch(term) {
    this.#term = String(term ?? "");
    this.apply();
  }
  setSort(comparator) {
    this.#sortFn = typeof comparator === "function" ? comparator : null;
    this.apply();
  }

  /** key = dataset key (e.g. 'dishCategory'); 'dishTags' special: comma-list me value dhundta hai */
  #matches(item, key, value) {
    if (!value || value === "all") return true;
    if (key === "dishTags") {
      const tags = String(item.dataset.dishTags ?? "")
        .split(",")
        .map((t) => t.trim().toLowerCase());
      return tags.includes(String(value).toLowerCase());
    }
    return item.dataset[key] === value;
  }

  apply() {
    if (!this.grid) return 0;
    const term = this.#term.trim().toLowerCase();
    let visible = 0;

    for (const item of this.#items) {
      const matchesFilters = [...this.#active].every(([key, value]) =>
        this.#matches(item, key, value),
      );
      const matchesSearch =
        !term ||
        item.textContent.toLowerCase().includes(term) ||
        String(item.dataset.dishTags ?? "")
          .toLowerCase()
          .includes(term);
      const show = matchesFilters && matchesSearch;
      item.hidden = !show;
      if (show) visible += 1;
    }

    // Sort: sirf visible items DOM me reorder karte hain (appendChild move karta hai, copy nahi)
    if (this.#sortFn) {
      this.#items
        .filter((item) => !item.hidden)
        .sort(this.#sortFn)
        .forEach((item) => this.grid.appendChild(item));
    }

    if (this.countEl) {
      const singular = this.unit.replace(/s$/, "");
      this.countEl.textContent = `Showing ${visible} ${visible === 1 ? singular : this.unit}`;
    }
    if (this.emptyEl) this.emptyEl.hidden = visible !== 0;
    return visible;
  }
}

/** Filter chips ka common wiring — active state + aria-pressed sync */
export function wireFilterButtons(attrName, onPick) {
  const buttons = $$(`[${attrName}]`);
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((chip) => {
        const isActive = chip === button;
        chip.classList.toggle("chip--active", isActive);
        chip.setAttribute("aria-pressed", String(isActive));
      });
      onPick(button.getAttribute(attrName));
    });
  });
}

/* ---------- Single init for all global components ---------- */
export function init() {
  toastManager.init();
  initNavigation();
  initYear();
  initOpenStatus();
  initBadges();
  initAccountLink();
  initAccordions();
  initOfferClaims();
  initEventRsvp();
}
