/**
 * ============================================================
 * LUMIÈRE Bistro — storage.js
 * localStorage wrapper: JSON serialization, namespace, aur
 * try/catch resilience (private browsing / quota errors par crash nahi hoga).
 * ============================================================
 */

// Saari keys isi namespace ke sath save hoti hain taake doosri sites/demos se takrar na ho
const NAMESPACE = "lumiere";

// Agar localStorage available nahi (private mode), to memory me hi rakhenge —
// page refresh par data jayega, lekin app crash nahi hogi. Graceful fallback.
const memoryStore = new Map();

function localStorageAvailable() {
  try {
    const testKey = "__lumiere_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

class Store {
  #available;
  #prefix;

  constructor(prefix = NAMESPACE) {
    this.#prefix = prefix;
    this.#available = localStorageAvailable();
    if (!this.#available) {
      console.warn(
        "[storage] localStorage blocked hai — memory fallback use ho raha hai.",
      );
    }
  }

  #fullKey(key) {
    return `${this.#prefix}:${key}`;
  }

  /** Value parho. Missing ho to fallback wapas do. JSON parse fail ho to bhi fallback. */
  get(key, fallback = null) {
    const fullKey = this.#fullKey(key);
    try {
      const raw = this.#available
        ? localStorage.getItem(fullKey)
        : memoryStore.get(fullKey);
      if (raw == null) return fallback; // null (localStorage) ya undefined (Map) dono cover
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`[storage] "${key}" parhne me masla:`, error);
      return fallback;
    }
  }

  /** Value likho — JSON.stringify fail (circular data) ho to false, crash nahi. */
  set(key, value) {
    const fullKey = this.#fullKey(key);
    try {
      const raw = JSON.stringify(value);
      if (this.#available) localStorage.setItem(fullKey, raw);
      else memoryStore.set(fullKey, raw);
      return true;
    } catch (error) {
      console.warn(`[storage] "${key}" likhne me masla:`, error);
      return false;
    }
  }

  remove(key) {
    const fullKey = this.#fullKey(key);
    if (this.#available) localStorage.removeItem(fullKey);
    memoryStore.delete(fullKey);
  }
}

export const storage = new Store();

/** App-wide storage keys — magic strings kahin aur na likhne parein */
export const STORAGE_KEYS = Object.freeze({
  CART: "cart",
  WISHLIST: "wishlist",
  USER: "user",
  ORDERS: "orders",
  LAST_ORDER: "lastOrder",
  RESERVATIONS: "reservations",
  SAVED_OFFERS: "savedOffers",
});
