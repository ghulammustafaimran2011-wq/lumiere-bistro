/**
 * ============================================================
 * LUMIÈRE Bistro — gallery.js
 * Gallery filters + full lightbox (open/close, prev/next, keyboard,
 * focus trap, body scroll lock). Lightbox hooks menu-item.html ke
 * thumbs par bhi kaam karte hain — code page-agnostic hai.
 * ============================================================
 */

import { $, $$ } from "./utils.js";
import { FilterableGrid, wireFilterButtons } from "./components.js";

/* ============================================================
   1. Gallery category filters (gallery.html)
   ============================================================ */
function initGalleryFilters() {
  const grid = $("[data-gallery-grid]");
  if (!grid) return;

  const filterable = new FilterableGrid({
    grid,
    emptyEl: $("[data-gallery-empty]"),
    unit: "photos",
  });

  wireFilterButtons("data-gallery-filter", (value) =>
    filterable.setFilter("galleryCategory", value),
  );
  filterable.apply();
}

/* ============================================================
   2. Lightbox
   ============================================================ */
function initLightbox() {
  const lightbox = $("[data-lightbox]");
  if (!lightbox) return;

  const imageEl = $("[data-lightbox-image]");
  const captionEl = $("[data-lightbox-caption]");
  const closeButton = $(".lightbox-close", lightbox);

  let triggers = [];
  let index = 0;
  let lastFocused = null;

  /** Sirf wo triggers jo abhi page par visible hain (filtered-out nahi) */
  const visibleTriggers = () =>
    $$("[data-lightbox-trigger]").filter((t) => !t.closest("[hidden]"));

  function render() {
    const trigger = triggers[index];
    if (!trigger || !imageEl) return;
    imageEl.src = trigger.dataset.lightboxSrc ?? "";
    imageEl.alt =
      trigger.dataset.lightboxCaption ||
      trigger.querySelector("img")?.alt ||
      "Gallery image";
    if (captionEl)
      captionEl.textContent = trigger.dataset.lightboxCaption ?? "";
  }

  function open(trigger) {
    triggers = visibleTriggers();
    index = Math.max(0, triggers.indexOf(trigger));
    lastFocused = document.activeElement; // band hone par wapis yahan focus karenge
    render();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden"; // background page scroll rok do
    closeButton?.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  // Wrap-around navigation — last se first, first se last
  const move = (step) => {
    if (triggers.length === 0) return;
    index = (index + step + triggers.length) % triggers.length;
    render();
  };

  /** Tab key ko lightbox ke andar hi circle karna (focus trap) */
  function trapFocus(event) {
    const focusables = $$("button, [href]", lightbox).filter(
      (el) => !el.hidden,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Trigger clicks globally — gallery + dish-detail thumbs dono cover
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox-trigger]");
    if (trigger) {
      open(trigger);
      return;
    }
    // Backdrop div aur close button dono par data-lightbox-close hai
    if (!lightbox.hidden && event.target.closest("[data-lightbox-close]"))
      close();
  });

  $("[data-lightbox-prev]", lightbox)?.addEventListener("click", () =>
    move(-1),
  );
  $("[data-lightbox-next]", lightbox)?.addEventListener("click", () => move(1));

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") move(-1);
    else if (event.key === "ArrowRight") move(1);
    else if (event.key === "Tab") trapFocus(event);
  });
}

/* ---------- Init ---------- */
export function init() {
  initGalleryFilters();
  initLightbox();
}
