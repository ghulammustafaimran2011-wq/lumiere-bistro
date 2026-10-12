# LUMIÈRE Bistro

> A premium, fictional fine-dining restaurant website — seasonal menus, online ordering, table reservations, and an interactive gallery — built entirely with semantic HTML, modern CSS, and vanilla JavaScript. No frameworks, no libraries, no backend.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Pages](#pages)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation and Usage](#installation-and-usage)
- [Menu Data](#menu-data)
- [JavaScript Concepts](#javascript-concepts)
- [Browser Compatibility](#browser-compatibility)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Learning Purpose](#learning-purpose)
- [Author](#author)
- [License](#license)

---

## Project Overview

LUMIÈRE Bistro is a multi-page restaurant website for a (fictional) seasonal fine-dining restaurant in the Harborfront Quarter of Alder Bay. The site presents the full visitor journey of a modern restaurant: browsing the menu, filtering dishes by diet, ordering online with a persistent cart, booking a table, exploring the gallery, and tracking a demo order.

The project is a deliberate exercise in building a complete, polished front-end **without any frameworks**: the design system lives in CSS custom properties, all interactivity is hand-written ES6+ JavaScript organised into ES modules, and state (cart, wishlist, orders, reservations) persists in the browser via `localStorage`.

All business details on the site — the address, phone numbers, staff names, and reviews — are fictional demo content created for this project.

## Screenshots

> **Placeholder — screenshots have not been added yet.**
>
> No screenshot files exist in this repository, so no image paths are referenced here. When screenshots are captured, store them locally (for example in `docs/screenshots/`) and embed them in this section, e.g.:
>
> `![Homepage](docs/screenshots/homepage.png)`

## Features

Status key: **Implemented** — working in the current code. **Partially implemented** — the logic works, but part of the experience is missing. **Prepared** — JavaScript hooks exist and wait for future pages.

| Feature                             | Status                | Details                                                                                                                                                                                       |
| ----------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-page restaurant website       | Implemented           | 20 pages sharing one header, navigation, footer, and design system                                                                                                                            |
| Menu with categories & dietary tags | Implemented           | Dish cards with category chips (starters, mains, desserts, drinks) and dietary tags                                                                                                           |
| Menu search, filtering & sorting    | Implemented           | Client-side search (debounced), category filters, and sorting by price/name on the menu and order pages                                                                                       |
| Dietary filtering                   | Implemented           | Vegetarian / vegan / gluten-free / dairy-free filters plus an allergen table                                                                                                                  |
| Dynamic dish detail pages           | Implemented           | `menu-item.html?id=…` reads the query string and renders dish data, allergens, and pairings                                                                                                   |
| Shopping cart                       | Implemented           | Add / quantity / remove / clear, persisted in `localStorage`, sticky mini-cart on the order page, promo codes (`LUMIERE10`, `HARVEST15`), delivery fee with free-over-threshold rule, and tax |
| Demo checkout & order flow          | Implemented           | Checkout form → generated order reference (`LB-XXXX`) → confirmation page → simulated tracking timeline                                                                                       |
| Wishlist                            | Partially implemented | Saving/toggling dishes works (persisted, header badge, toasts), but the wishlist viewing page was not generated — see Known Limitations                                                       |
| Table reservations                  | Implemented           | Validated form with a Monday-closed business rule, quick-reserve prefill from the homepage, and a confirmation panel; requests persist locally                                                |
| Image gallery & lightbox            | Implemented           | Category filters plus an accessible lightbox with arrow-key navigation, Escape to close, and a focus trap                                                                                     |
| Forms & validation                  | Implemented           | Newsletter, contact, and private-dining forms with inline errors, `aria-invalid` states, loading indicators, and toasts                                                                       |
| Simulated API layer                 | Implemented           | `api.js` emulates a backend with realistic latency, custom `ApiError` handling, and a built-in demo failure trigger                                                                           |
| Local storage persistence           | Implemented           | Cart, wishlist, orders, reservations, saved offers, and demo user survive page refreshes (`lumiere:*` keys)                                                                                   |
| Toast notifications                 | Implemented           | Global `aria-live` toast system with success/error/info variants                                                                                                                              |
| Responsive design                   | Implemented           | Mobile-first breakpoints from small phones to large desktops; mobile navigation enhanced by JS with a working no-JS fallback                                                                  |
| Accessibility                       | Implemented           | Skip links, semantic landmarks, ARIA state syncing, visible focus styles, keyboard support, and `prefers-reduced-motion` support                                                              |
| Demo account features               | Prepared              | `login` / `register` / `forgot-password` form handlers and order-history rendering are wired in JS, but those pages do not exist yet                                                          |

## Pages

The repository currently contains **20 HTML pages**:

| Page                      | Purpose                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `index.html`              | Homepage: hero, featured dishes, quick reservation, story, testimonials, CTAs                                 |
| `about.html`              | Restaurant story, principles, chef profile, milestone timeline                                                |
| `menu.html`               | Full menu grid with search, category filters, and sorting                                                     |
| `menu-item.html`          | Dynamic dish detail page driven by the `?id=` query parameter                                                 |
| `reservations.html`       | Reservation form with date/time/guests and confirmation panel                                                 |
| `contact.html`            | Contact details, message form, and a map placeholder                                                          |
| `location.html`           | Address, travel directions, and opening hours                                                                 |
| `gallery.html`            | Filterable photo grid with lightbox                                                                           |
| `order-online.html`       | Delivery/pickup mode, menu with add-to-cart, sticky mini-cart                                                 |
| `cart.html`               | Cart items, quantity controls, promo code, totals, empty state                                                |
| `checkout.html`           | Demo checkout: contact, delivery/pickup, demo payment fields                                                  |
| `order-confirmation.html` | Order reference and summary after checkout                                                                    |
| `order-tracking.html`     | Simulated order-tracking timeline with an ETA                                                                 |
| `special-offers.html`     | Current offers with claim buttons                                                                             |
| `seasonal-menu.html`      | Tasting menu and dotted-price à la carte highlights                                                           |
| `dietary-menu.html`       | Diet filters and the allergen table                                                                           |
| `chef-specials.html`      | Weekly chef specials and a retired-dishes archive                                                             |
| `private-dining.html`     | Private rooms and an enquiry form                                                                             |
| `events.html`             | Upcoming events with RSVP buttons                                                                             |
| `catering.html`           | Catering packages — **incomplete**: the file was generated truncated and needs its closing sections completed |

## Technologies Used

| Layer          | Technology                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Markup         | HTML5 — semantic landmarks, ARIA attributes, `data-*` integration hooks                                                                                |
| Styling        | CSS3 — custom properties (design tokens), Grid & Flexbox, `clamp()` fluid typography, `aspect-ratio`, `backdrop-filter`, `prefers-reduced-motion`      |
| Behaviour      | Vanilla JavaScript (ES6+) — ES modules, classes, `async/await`; no frameworks or external libraries                                                    |
| Data           | JSON (`assets/data/menu.json`), Web Storage API (`localStorage`) with JSON serialisation                                                               |
| Browser APIs   | `CustomEvent` (pub/sub bus), `URLSearchParams`, `matchMedia`, `FormData`, `structuredClone` (with JSON fallback), `CSS.escape`                         |
| Fetch API      | **Not used at runtime yet** — `api.js` currently simulates all responses; fetching `menu.json` is a documented next step (see [Menu Data](#menu-data)) |
| Fonts & images | Google Fonts (Cormorant Garamond, Inter) and seeded `picsum.photos` placeholder images — both loaded remotely                                          |

## Project Structure

```text
lumiere-bistro/
├── index.html
├── about.html
├── menu.html
├── menu-item.html
├── reservations.html
├── contact.html
├── location.html
├── gallery.html
├── order-online.html
├── cart.html
├── checkout.html
├── order-confirmation.html
├── order-tracking.html
├── special-offers.html
├── seasonal-menu.html
├── dietary-menu.html
├── chef-specials.html
├── private-dining.html
├── events.html
├── catering.html            (incomplete — see Known Limitations)
├── README.md
└── assets/
    ├── css/
    │   ├── style.css         (design tokens, reset, typography, layout)
    │   ├── components.css    (reusable UI components)
    │   └── responsive.css    (mobile-first breakpoint layer)
    ├── js/
    │   ├── main.js           (entry point — the only script pages load)
    │   ├── utils.js          (DOM, formatting, event bus helpers)
    │   ├── storage.js        (localStorage wrapper with fallbacks)
    │   ├── api.js            (simulated backend + dish catalog)
    │   ├── components.js     (toasts, nav, badges, filterable grid)
    │   ├── forms.js          (validation engine + page forms)
    │   ├── cart.js           (cart, checkout, orders, tracking)
    │   ├── wishlist.js       (saved dishes)
    │   ├── menu.js           (menu toolbar + dish detail rendering)
    │   ├── gallery.js        (gallery filters + lightbox)
    │   └── reservations.js   (reservation flow)
    └── data/
        └── menu.json         (33-item menu dataset, PKR pricing)
```

There is no local image directory — every image is a remote seeded placeholder URL.

## Getting Started

The site uses **ES modules**, which browsers refuse to load from `file://` URLs. You must view it through a local web server — the easiest way is Visual Studio Code with the Live Server extension.

1. **Install Visual Studio Code** from <https://code.visualstudio.com/>.
2. **Install the Live Server extension** — open the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`), search for **"Live Server"** (by Ritwick Dey), and click **Install**.
3. **Open the project** — in VS Code, choose **File → Open Folder…** and select the project folder containing `index.html`.
4. **Verify the entry script tag** — each HTML page must include the following line just before `</body>`. If a page only has the placeholder comment, add the tag (do not change anything else):

   ```html
   <script type="module" src="assets/js/main.js"></script>
   ```

5. **Start the server** — right-click `index.html` in the Explorer and choose **"Open with Live Server"**, or click **"Go Live"** in the status bar. The site opens at a local address such as `http://127.0.0.1:5500`.
6. **Browse** — start at the homepage; every page is reachable from the header and footer.

**Alternative (no VS Code):** run `python -m http.server 8000` in the project folder and open `http://localhost:8000`.

**Do not** open the HTML files by double-clicking them — module loading will fail and interactive features will not run.

An internet connection is required while browsing, for the placeholder images and web fonts (see Known Limitations).

## Installation and Usage

There is nothing to build or install — it is a static site. Full beginner walkthrough:

1. Complete the **Getting Started** steps above.
2. **Explore the menu** — open _Menu_ from the header. Type in the search box, click the category chips, and change the sort dropdown; the grid filters and re-sorts instantly.
3. **Order online** — open _Order Online_, switch between Delivery and Pickup, and click **Add to cart** on any dish. The sticky mini-cart on the right updates live, as does the cart badge in the header.
4. **Review the cart** — open _Cart_. Adjust quantities with the − / + controls or by typing, remove items, and apply the demo promo code **`LUMIERE10`** (10% off) or **`HARVEST15`** (15% off). Watch the delivery fee disappear on orders above the free-delivery threshold.
5. **Check out** — fill in the demo checkout (any realistic values work; the card fields are decorative) and place the order. You will land on the confirmation page with a generated reference such as `LB-1234`.
6. **Track the order** — open _Track order_ and enter that reference plus any email; the tracking timeline updates. Any `LB-XXXX` reference is accepted in this demo.
7. **Reserve a table** — use the quick-reserve strip on the homepage to prefill the reservation form. Tip: pick a **Monday** to see the closed-day business rule.
8. **Save dishes** — click the heart button on any dish card; the header badge counts your saved dishes and the choice persists across refreshes.
9. **Gallery** — filter by category and click any photo; navigate the lightbox with the arrow keys and close with Escape.
10. **Try the error handling** — type the word `fail` into any form field and submit: the simulated API returns a deliberate error so you can see the error states.

All demo data lives in your browser's `localStorage` under `lumiere:*` keys. Clearing your browser storage for the site resets the cart, wishlist, orders, and reservations.

## Menu Data

`assets/data/menu.json` is the structured menu dataset for the project — the intended single source of truth for every dish the site displays. It currently holds **33 items** with realistic Pakistani restaurant pricing in **PKR**.

Each item follows this shape:

```json
{
  "id": "truffle-risotto",
  "name": "Black Truffle Risotto",
  "category": "mains",
  "subCategory": "main-course",
  "price": 6750,
  "description": "Carnaroli rice, porcini butter, aged parmesan, shaved black truffle.",
  "desc": "Carnaroli rice, porcini butter, aged parmesan, shaved black truffle.",
  "details": "Carnaroli rice stirred to order with porcini butter…",
  "image": "https://picsum.photos/seed/lumiere-truffle-risotto/800/600.jpg",
  "seed": "lumiere-truffle-risotto",
  "tags": ["vegetarian", "gluten-free"],
  "dietaryTags": ["vegetarian", "gluten-free"],
  "isVegetarian": true,
  "isPopular": true,
  "featured": true,
  "isAvailable": true,
  "ingredients": ["carnaroli rice", "porcini mushrooms", "black truffle"],
  "rating": 4.9,
  "preparationTime": 18
}
```

Notes on the schema:

- `desc`, `tags`, and `featured` mirror `description`, `dietaryTags`, and `isPopular` so the file can drop straight into the existing rendering logic, which reads the short names.
- `category` uses the four slugs the live filter chips understand (`starters`, `mains`, `desserts`, `drinks`); finer groups such as _Pasta_, _Seafood_, _Vegetarian_, and _Chef Specials_ are expressed through `subCategory`, `tags`, and `featured`.
- `tags` values are restricted to the tag set the UI can render: `vegetarian`, `vegan`, `gluten-free`, `dairy-free`, `nuts`.

**Integration status:** the file is **not consumed at runtime yet** — `api.js` still returns its built-in in-memory catalog, and the currency formatter currently displays `$`. Wiring the file in requires one paired change so the data and the currency symbol stay consistent:

```js
// assets/js/api.js — replace the in-memory catalog return with:
const response = await fetch(new URL("../data/menu.json", import.meta.url));
if (!response.ok)
  throw new ApiError("Menu data could not be loaded.", response.status);
return response.json();

// assets/js/utils.js — switch the formatter to PKR:
export const formatCurrency = (value) =>
  `Rs ${Number(value).toLocaleString("en-PK")}`;
```

Changing only one of the two would mislabel the currency, which is why both are documented together.

## JavaScript Concepts

The codebase is written to demonstrate a broad range of modern vanilla JavaScript. Every item below is genuinely used in the shipped code:

| #   | Concept                                | Where it is used                                                                                                                           |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | ES6 modules                            | All 11 files; a single entry point (`main.js`) per page                                                                                    |
| 2   | Classes, private fields & inheritance  | `Store` (#-prefixed fields), `ToastManager`, `FilterableGrid`; `ApiError extends Error`                                                    |
| 3   | Closures & higher-order functions      | `debounce()` on the menu search                                                                                                            |
| 4   | Promises & `async/await`               | The whole simulated API layer, form submissions, order placement                                                                           |
| 5   | Event delegation                       | Single global click/change listeners for cart, wishlist, and lightbox triggers                                                             |
| 6   | Publish/subscribe with `CustomEvent`   | `utils.js` event bus; cart and wishlist state broadcast to header badges                                                                   |
| 7   | Array/object transformations           | `map` / `filter` / `reduce` / `find`, `Object.fromEntries` for form data and totals                                                        |
| 8   | `Map`                                  | Storage memory fallback; active filter registry in `FilterableGrid`                                                                        |
| 9   | Destructuring, spread & rest           | State updates, options objects, payload spreads throughout                                                                                 |
| 10  | Template literals                      | Dynamic rendering of cart rows, dish cards, and summaries                                                                                  |
| 11  | Optional chaining & nullish coalescing | Defensive DOM reads so every module safely no-ops on pages without its hooks                                                               |
| 12  | Web Storage API & JSON                 | `storage.js` — namespaced keys, serialisation, quota/private-mode fallbacks                                                                |
| 13  | `URLSearchParams` & Location API       | `menu-item.html?id=…` rendering; reservation prefill from the quick-reserve strip                                                          |
| 14  | Custom error classes                   | `ApiError` with an HTTP-style status, surfaced in UI error states                                                                          |
| 15  | Accessibility APIs                     | `matchMedia` for the mobile nav, focus management and focus trapping, ARIA state syncing (`aria-pressed`, `aria-expanded`, `aria-current`) |

## Browser Compatibility

The site targets **modern evergreen browsers** — recent versions of Chrome, Edge, Firefox, and Safari. It relies on widely supported platform features (ES modules, CSS custom properties, Grid/Flexbox, `:focus-visible`, `aspect-ratio`, `backdrop-filter`) and has **not** been tested on legacy browsers such as Internet Explorer, which do not support ES modules.

Practical requirements:

- JavaScript must be enabled — without it, pages render as static content and interactive features do not run.
- The site must be served over HTTP(S) (see Getting Started).
- localStorage must be available for state persistence; if it is blocked, the app falls back to in-memory storage for the session instead of crashing.
- An internet connection is needed for the remote placeholder images and web fonts; layout and content degrade gracefully without them.

## Known Limitations

Documented honestly, so nothing here is overstated:

1. **No backend.** `api.js` simulates every server call with artificial latency. Reservations, orders, and demo accounts live only in the browser's `localStorage`.
2. **No payment gateway.** Checkout card fields are decorative and never validated or transmitted; the page labels them "Demo".
3. **`menu.json` is not wired in.** The live site uses the in-memory catalog, and prices currently display with a `$` prefix while the JSON uses PKR — see [Menu Data](#menu-data) for the paired change required.
4. **Only 20 of the planned 38 pages exist.** Navigation (footer sitemap, "More" dropdown, some CTAs) links to pages such as `wishlist.html`, `faq.html`, `login.html`, `gift-cards.html`, and `404.html` that were never generated; those links currently lead to missing pages.
5. **No wishlist viewing page.** Saving dishes works (persistence, header badge, toasts), and the renderer exists in JS — but `wishlist.html` itself does not exist, so saved dishes cannot be browsed yet. The cart page's "View saved dishes" link points to the missing page.
6. **`catering.html` is incomplete.** The file was generated truncated mid-document and needs its remaining sections and closing tags completed.
7. **Account pages are absent.** Login, register, forgot-password, profile, and order-history pages do not exist; the JavaScript contains ready-made hooks (`data-auth-form`, `data-order-history-container`) awaiting them.
8. **Entry script tag must be present manually.** The HTML was generated with a placeholder comment instead of the script tag; each page needs the one-line tag from Getting Started for interactivity.
9. **Remote placeholder assets.** All food/restaurant photography uses seeded `picsum.photos` URLs and fonts load from Google Fonts — an internet connection is required, and the imagery is generic, not real restaurant photography.
10. **No real map.** Location pages use styled map placeholders rather than an embedded map service.
11. **Tracking is a fixed demo.** Order tracking accepts any `LB-XXXX` reference and always shows the same simulated progress state.
12. **No FAQ page.** Accordion components used elsewhere are native `<details>` elements and work without JavaScript, but the planned FAQ page was not generated.
13. **No tests, build step, or linter configuration.** The project is plain static files with no tooling.

## Future Improvements

Practical next steps, roughly in order of impact:

- Generate the remaining 18 pages so every existing link resolves, starting with `wishlist.html` (the JS renderer is already waiting for it), the account pages, and `404.html`.
- Wire `assets/data/menu.json` into `api.js` together with the PKR currency formatter (see [Menu Data](#menu-data)).
- Replace the simulated `api.js` with a real backend (e.g., Node/Express or a serverless API) behind the same interface — no other module would need to change.
- Introduce a real payment flow in test mode (e.g., Stripe test keys) behind the existing demo checkout.
- Embed a real map on the location pages and add structured data (`Restaurant` schema.org markup) for SEO.
- Add local, optimised image assets with `srcset`/lazy loading to replace the remote placeholders.
- Add automated end-to-end tests (e.g., Playwright) for the cart → checkout → tracking flow and the reservation rules.
- Publish the site on a static host (GitHub Pages or Netlify) once the page set is complete.
- Consider a small PWA layer (manifest + service worker) for offline menu browsing.

## Learning Purpose

This project exists to demonstrate front-end development skills end to end: writing semantic, accessible HTML; designing a token-driven CSS system without a framework; and building real application behaviour — state, persistence, routing by query string, event-driven UI — in dependency-ordered vanilla JavaScript modules. It is intentionally framework-free so that the underlying platform features (modules, storage, events, accessibility APIs) remain visible rather than hidden behind tooling. It is a portfolio and learning project, not production software for an actual restaurant.

## Author

**Ghulam-E-Mustafa**

Designed and developed by Ghulam-E-Mustafa as a front-end portfolio and learning project.

## License

Copyright © 2026 Ghulam-E-Mustafa. All rights reserved.

No open-source license has been specified yet for this project. Until a license file is added, the code should not be redistributed or reused without the author's permission.
