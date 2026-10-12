/**
 * ============================================================
 * LUMIÈRE Bistro — menu.js
 * Menu toolbar (search/filter/sort) menu.html + order-online.html par,
 * dietary filters (dietary-menu.html), aur dish-detail dynamic render
 * (menu-item.html?id=...). Dish cards DOM me pehle se hain — hum
 * unhe filter/sort karte hain, zero se render nahi karte.
 * ============================================================
 */

import { $, $$, getQueryParam, debounce } from "./utils.js";
import { api, dishImage, buildTagListHTML } from "./api.js";
import { FilterableGrid, wireFilterButtons, toast } from "./components.js";

/* ---------- Sort comparators ---------- */
const dishPrice = (card) =>
  Number(card.querySelector("[data-add-to-cart]")?.dataset.dishPrice ?? 0);
const dishName = (card) =>
  (card.querySelector(".dish-card-title")?.textContent ?? "").trim();

const SORT_COMPARATORS = {
  featured: null, // default DOM order hi "featured" hai
  "price-asc": (a, b) => dishPrice(a) - dishPrice(b),
  "price-desc": (a, b) => dishPrice(b) - dishPrice(a),
  "name-asc": (a, b) => dishName(a).localeCompare(dishName(b)),
  "name-desc": (a, b) => dishName(b).localeCompare(dishName(a)),
};

/* ============================================================
   1. Menu toolbar — search + category chips + sort
   (menu.html aur order-online.html dono par same hooks hain)
   ============================================================ */
function initMenuGrid() {
  const grid = $("[data-menu-grid]");
  if (!grid) return;

  const filterable = new FilterableGrid({
    grid,
    countEl: $("[data-menu-results-count]"),
    emptyEl: $("[data-menu-empty]"),
    unit: "dishes",
  });

  const search = $("[data-menu-search]");
  if (search) {
    // Debounce: har keystroke par filtering mehngi hai — 200ms ruk kar chalao
    search.addEventListener(
      "input",
      debounce(() => filterable.setSearch(search.value), 200),
    );
  }

  wireFilterButtons("data-category-filter", (value) =>
    filterable.setFilter("dishCategory", value),
  );

  const sortSelect = $("[data-sort]");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      filterable.setSort(SORT_COMPARATORS[sortSelect.value] ?? null);
    });
  }

  filterable.apply(); // initial count/empty-state sync
}

/* ============================================================
   2. Dietary page — tags ke sath filter (veg/vegan/gf/df)
   ============================================================ */
function initDietaryGrid() {
  const grid = $("[data-dietary-grid]");
  if (!grid) return;

  const filterable = new FilterableGrid({
    grid,
    countEl: $("[data-dietary-results-count]"),
    emptyEl: $("[data-dietary-empty]"),
    unit: "dishes",
  });

  wireFilterButtons("data-dietary-filter", (value) =>
    filterable.setFilter("dishTags", value),
  );
  filterable.apply();
}

/* ============================================================
   3. Dish detail — ?id= param se dish load karke page populate
   ============================================================ */
function applyDishToDetail(article, dish) {
  document.title = `${dish.name} — LUMIÈRE Bistro`;

  const title = $("[data-menu-item-title]");
  if (title) title.textContent = dish.name;

  const crumb = $("[data-menu-item-breadcrumb]");
  if (crumb) crumb.textContent = dish.name;

  const price = $("[data-menu-item-price]");
  if (price) price.textContent = dish.price.toFixed(2);

  const desc = $("[data-menu-item-desc]");
  if (desc) desc.textContent = dish.details || dish.desc;

  const image = $("[data-menu-item-image]");
  if (image) {
    image.src = dishImage(dish, 1200, 900);
    image.alt = dish.name;
  }

  const tagsEl = $("[data-menu-item-tags]");
  if (tagsEl) {
    const tags = [...dish.tags];
    if (dish.featured) tags.push("__chef"); // sentinel tag → Chef's pick chip
    tagsEl.innerHTML =
      buildTagListHTML(tags.filter((t) => t !== "__chef")) +
      (dish.featured ? '<li class="tag tag--chef">Chef\u2019s pick</li>' : "");
  }

  // Add-to-cart / wishlist buttons ko naye dish ke data se sync karo
  article.dataset.dishId = dish.id;
  $$("[data-add-to-cart]", article).forEach((button) => {
    button.dataset.addToCart = dish.id;
    button.dataset.dishName = dish.name;
    button.dataset.dishPrice = dish.price.toFixed(2);
  });
  $$("[data-add-to-wishlist]", article).forEach((button) => {
    button.dataset.addToWishlist = dish.id;
    button.dataset.dishName = dish.name;
  });

  // Related grid: current dish ki category ke ilawa cards chhupao
  const related = $("[data-related-dishes]");
  if (related) {
    const cards = $$(".dish-card", related);
    cards.forEach((card) => {
      card.hidden = card.dataset.dishCategory !== dish.category;
    });
    // Agar koi related card match na kare to sab wapis dikha do
    if (!cards.some((card) => !card.hidden))
      cards.forEach((card) => {
        card.hidden = false;
      });
  }
}

function initDishDetail() {
  const article = $("[data-menu-item]");
  if (!article) return;

  const requestedId = getQueryParam("id") || article.dataset.menuItemId;

  // Async load — fail hone par static default dish (HTML me already rendered) rehta hai
  api
    .fetchDishById(requestedId)
    .then((dish) => applyDishToDetail(article, dish))
    .catch(() => {
      toast("Showing the default dish — the requested dish was not found.", {
        type: "info",
      });
    });
}

/* ---------- Init ---------- */
export function init() {
  initMenuGrid();
  initDietaryGrid();
  initDishDetail();
}
