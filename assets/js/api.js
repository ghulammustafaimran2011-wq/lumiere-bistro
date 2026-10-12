/**
 * ============================================================
 * LUMIÈRE Bistro — api.js
 * Simulated backend: real fetch nahi hota, lekin poora async/await
 * flow, latency, aur error handling real API jaisa hi hai.
 *
 * Phase 4 me jab real backend lagao, sirf is file ke andar
 * implementations badlo — baaki modules ko chhedna nahi parega.
 *
 * DEMO TRICKS:
 *  - Kisi bhi form field me "fail" likh kar bhejo → ApiError milega
 *    (error states test karne ke liye).
 *  - Promo codes: LUMIERE10 (10% off), HARVEST15 (15% off).
 *  - Tracking: koi bhi LB-XXXX reference chalega.
 * ============================================================
 */

import { sleep, randomInt, uid, bus, EVENTS, clone } from "./utils.js";
import { storage, STORAGE_KEYS } from "./storage.js";

/* ---------- Custom Error class (inheritance concept) ---------- */
export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* ---------- Simulated latency ---------- */
const LATENCY = { min: 350, max: 750 };
const latency = () => sleep(randomInt(LATENCY.min, LATENCY.max));

/** Payload me "fail" likha ho to demo error uthao */
function assertNoFailSignal(payload) {
  if (
    JSON.stringify(payload ?? {})
      .toLowerCase()
      .includes("fail")
  ) {
    throw new ApiError(
      'Demo error: request me "fail" detect hua — yeh test ke liye hai.',
    );
  }
}

/* ============================================================
   Dish catalog — Phase 1 HTML ke saare dish IDs, prices, tags
   aur picsum seeds bilkul match karte hain.
   ============================================================ */
const DISHES = [
  {
    id: "burrata-peach",
    name: "Charred Peach & Burrata",
    price: 16,
    category: "starters",
    tags: ["vegetarian", "gluten-free"],
    seed: "lumiere-burrata-peach",
    featured: false,
    desc: "Fire-kissed peach, torn burrata, basil oil, toasted hazelnut.",
    details:
      "Peaches charred over embers and served at room temperature with burrata from Two Sisters Dairy, basil oil pressed in-house, and toasted hazelnuts.",
  },
  {
    id: "tuna-tartare",
    name: "Citrus Tuna Tartare",
    price: 19,
    category: "starters",
    tags: ["gluten-free", "dairy-free"],
    seed: "lumiere-tuna-tartare",
    featured: true,
    desc: "Hand-cut yellowfin, yuzu kosho, avocado, sesame tuile.",
    details:
      "Hand-cut yellowfin from the morning dayboats, dressed with yuzu kosho and citrus, layered over avocado with a crisp sesame tuile.",
  },
  {
    id: "wild-mushroom-toast",
    name: "Wild Mushroom Toast",
    price: 14,
    category: "starters",
    tags: ["vegetarian"],
    seed: "lumiere-wild-mushroom-toast",
    featured: false,
    desc: "Woodland mushrooms on grilled sourdough, garlic butter, chives.",
    details:
      "Woodland mushrooms from Windrow Farm on grilled sourdough with garlic butter and chives. The vegan version swaps in olive oil confit — just ask.",
  },
  {
    id: "smoked-beet-carpaccio",
    name: "Smoked Beet Carpaccio",
    price: 13,
    category: "starters",
    tags: ["vegan", "gluten-free"],
    seed: "lumiere-smoked-beet-carpaccio",
    featured: false,
    desc: "Ember-smoked beets, horseradish cream, dill, rye crisp.",
    details:
      "Beets smoked over embers, shaved thin, with horseradish cream, dill and a rye crisp. Fully plant-based on request.",
  },
  {
    id: "truffle-risotto",
    name: "Black Truffle Risotto",
    price: 27,
    category: "mains",
    tags: ["vegetarian", "gluten-free"],
    seed: "lumiere-truffle-risotto",
    featured: true,
    desc: "Carnaroli rice, porcini butter, aged parmesan, shaved black truffle.",
    details:
      "Carnaroli rice stirred to order with porcini butter and aged parmesan, finished at the pass with shaved black truffle. A plant-based version is always available.",
  },
  {
    id: "cedar-plank-salmon",
    name: "Cedar-Plank Salmon",
    price: 32,
    category: "mains",
    tags: ["gluten-free", "dairy-free"],
    seed: "lumiere-cedar-plank-salmon",
    featured: true,
    desc: "Day-boat salmon over cedar embers, charred lemon, fennel salad.",
    details:
      "Day-boat salmon roasted on cedar planks over embers, with charred lemon and a fennel salad. Travels beautifully for delivery.",
  },
  {
    id: "duck-breast",
    name: "Honey-Lacquered Duck Breast",
    price: 36,
    category: "mains",
    tags: ["dairy-free"],
    seed: "lumiere-duck-breast",
    featured: true,
    desc: "Alder honey glaze, charred parsnip, blackberry jus.",
    details:
      "Duck breast lacquered with Alder honey from Northgate Apiary, charred parsnip and a blackberry jus. Élise\u2019s favourite plate on the current card.",
  },
  {
    id: "shortrib",
    name: "12-Hour Braised Short Rib",
    price: 34,
    category: "mains",
    tags: ["dairy-free"],
    seed: "lumiere-shortrib",
    featured: false,
    desc: "Red wine braise, celeriac purée, gremolata.",
    details:
      "Short rib braised twelve hours in red wine — the recipe has not changed since 2019. Served over celeriac purée with a bright gremolata.",
  },
  {
    id: "saffron-linguine",
    name: "Saffron & Squash Linguine",
    price: 24,
    category: "mains",
    tags: ["vegetarian"],
    seed: "lumiere-saffron-linguine",
    featured: false,
    desc: "Hand-cut linguine, roasted squash, saffron cream, crispy sage.",
    details:
      "Hand-cut linguine with roasted squash and saffron cream, finished with crispy sage. Gluten-free pasta available for any pasta dish.",
  },
  {
    id: "valrhona-tart",
    name: "Valrhona Chocolate Tart",
    price: 13,
    category: "desserts",
    tags: ["vegetarian"],
    seed: "lumiere-valrhona-tart",
    featured: false,
    desc: "70% dark ganache, buckwheat shell, sea salt, crème fraîche.",
    details:
      "70% Valrhona ganache in a buckwheat shell with sea salt and crème fraîche. Some weeks the pastry section swaps in a hazelnut shell.",
  },
  {
    id: "lavender-creme-brulee",
    name: "Lavender Crème Brûlée",
    price: 11,
    category: "desserts",
    tags: ["vegetarian", "gluten-free"],
    seed: "lumiere-lavender-creme-brulee",
    featured: false,
    desc: "Tonka custard, lavender sugar, burnt-honey shortbread.",
    details:
      "Tonka custard under a lavender-sugar lid, cracked to order, with burnt-honey shortbread on the side.",
  },
  {
    id: "poached-pear",
    name: "Poached Pear & Almond",
    price: 12,
    category: "desserts",
    tags: ["vegan", "gluten-free"],
    seed: "lumiere-poached-pear",
    featured: false,
    desc: "Orchard pears poached in spiced verjus, almond cream, caramel.",
    details:
      "Orchard pears poached in spiced verjus with almond cream and orchard caramel — naturally vegan and gluten-free.",
  },
  {
    id: "smoked-pear-cocktail",
    name: "Smoked Pear Negroni",
    price: 16,
    category: "drinks",
    tags: [],
    seed: "lumiere-smoked-pear-cocktail",
    featured: false,
    desc: "Pear-washed gin, campari, smoked vermouth, orange oil.",
    details:
      "Pear-washed gin, campari and vermouth smoked over the same pear wood as the kitchen fire. Bottled for travel on delivery orders.",
  },
  {
    id: "elderflower-spritz",
    name: "Elderflower Spritz",
    price: 14,
    category: "drinks",
    tags: ["vegan", "gluten-free"],
    seed: "lumiere-elderflower-spritz",
    featured: false,
    desc: "Elderflower cordial, dry vermouth, soda, lemon twist.",
    details:
      "Elderflower cordial, dry vermouth and soda with a lemon twist. Zero-proof version available on request.",
  },
];

export const findDishSync = (id) =>
  DISHES.find((dish) => dish.id === id) ?? null;
export const dishImage = (dish, width = 800, height = 600) =>
  `https://picsum.photos/seed/${dish.seed}/${width}/${height}.jpg`;

/** Tag → CSS class mapping (menu.js aur wishlist.js dono use karte hain) */
export const TAG_META = Object.freeze({
  vegetarian: { label: "Vegetarian", className: "tag--veg" },
  vegan: { label: "Vegan", className: "tag--vegan" },
  "gluten-free": { label: "Gluten-free", className: "tag--gf" },
  "dairy-free": { label: "Dairy-free", className: "tag--df" },
  nuts: { label: "Contains nuts", className: "tag--nuts" },
});

export const buildTagListHTML = (tags = []) =>
  tags
    .map((tag) => {
      const meta = TAG_META[tag];
      return meta ? `<li class="tag ${meta.className}">${meta.label}</li>` : "";
    })
    .join("");

/* ---------- Promo codes ---------- */
const PROMO_CODES = {
  LUMIERE10: {
    code: "LUMIERE10",
    type: "percent",
    value: 10,
    label: "10% off",
  },
  HARVEST15: {
    code: "HARVEST15",
    type: "percent",
    value: 15,
    label: "15% off",
  },
};

/* ============================================================
   API surface — har method async hai, real network jaisa behave karta hai
   ============================================================ */
export const api = {
  /** Poori dish list — menu rendering ke liye */
  async fetchDishes() {
    await latency();
    return clone(DISHES);
  },

  /** Ek dish by ID — menu-item.html query param se yahan aata hai */
  async fetchDishById(id) {
    await latency();
    const dish = findDishSync(id);
    if (!dish) throw new ApiError(`Dish "${id}" menu me nahi mili.`, 404);
    return clone(dish);
  },

  async validatePromo(code) {
    await latency();
    const normalized = String(code ?? "")
      .trim()
      .toUpperCase();
    const promo = PROMO_CODES[normalized];
    if (!promo)
      throw new ApiError(
        `Code "${normalized}" valid nahi hai. Try LUMIERE10.`,
        404,
      );
    return clone(promo);
  },

  async submitReservation(payload) {
    assertNoFailSignal(payload);
    await latency();
    const record = {
      id: uid(),
      ref: `RSV-${randomInt(1000, 9999)}`,
      status: "pending",
      placedAt: new Date().toISOString(),
      ...payload,
    };
    const all = storage.get(STORAGE_KEYS.RESERVATIONS, []);
    all.unshift(record);
    storage.set(STORAGE_KEYS.RESERVATIONS, all);
    return clone(record);
  },

  async submitContact(payload) {
    assertNoFailSignal(payload);
    await latency();
    return { ok: true, ticket: `MSG-${randomInt(1000, 9999)}` };
  },

  async submitPrivateDining(payload) {
    assertNoFailSignal(payload);
    await latency();
    return { ok: true, enquiry: `PD-${randomInt(1000, 9999)}` };
  },

  async subscribeNewsletter(payload) {
    assertNoFailSignal(payload);
    await latency();
    return { ok: true };
  },

  /** Order place karna — cart.js poora order object bhejta hai */
  async placeOrder(payload) {
    assertNoFailSignal(payload);
    await latency();
    return { ok: true, ref: payload.ref };
  },

  async trackOrder(reference, email) {
    assertNoFailSignal({ reference, email });
    await latency();
    if (!/^LB-\d{4}$/i.test(String(reference ?? "").trim())) {
      throw new ApiError(
        "Reference LB-XXXX format me hona chahiye — e.g. LB-2481.",
        404,
      );
    }
    // Demo: har valid reference par "on the way" stage wapas milti hai
    return {
      ref: String(reference).trim().toUpperCase(),
      stage: 2,
      eta: "in ~15 minutes",
      courier: "Amine",
    };
  },

  /* ----- Demo auth (login/register pages ke liye defensive hooks) ----- */
  async login({ email }) {
    assertNoFailSignal({ email });
    await latency();
    const user = {
      name: String(email).split("@")[0] || "Guest",
      email: String(email),
    };
    storage.set(STORAGE_KEYS.USER, user);
    bus.emit(EVENTS.USER_CHANGED, { user });
    return user;
  },

  async register(payload) {
    assertNoFailSignal(payload);
    await latency();
    const user = {
      name: payload.name || "Guest",
      email: String(payload.email),
    };
    storage.set(STORAGE_KEYS.USER, user);
    bus.emit(EVENTS.USER_CHANGED, { user });
    return user;
  },

  async requestPasswordReset({ email }) {
    assertNoFailSignal({ email });
    await latency();
    return { ok: true };
  },

  async claimOffer(offerId) {
    await latency();
    return { ok: true, offerId };
  },

  async rsvpEvent(eventId) {
    assertNoFailSignal({ eventId });
    await latency();
    return { ok: true, eventId, seatsHeld: true };
  },
};
