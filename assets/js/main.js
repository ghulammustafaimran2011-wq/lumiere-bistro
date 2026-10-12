/**
 * ============================================================
 * LUMIÈRE Bistro — main.js  (ENTRY POINT)
 *
 * HTML me sirf ye ek line chahiye (</body> se pehle, har page par):
 *   <script type="module" src="assets/js/main.js"></script>
 *
 * Har module apne hooks ko feature-detect karta hai — is liye
 * ye combination 38 pages me se kisi par bhi safely chal jata hai:
 * jis page par kisi module ke elements nahi hain, wo module
 * chup-chaap skip ho jata hai (koi error nahi).
 *
 * NOTE: ES modules http(s) par serve karne par load hote hain,
 * file:// par nahi — Live Server ya http.server use karein.
 * ============================================================
 */

import * as components from "./components.js";
import * as cart from "./cart.js";
import * as wishlist from "./wishlist.js";
import * as menu from "./menu.js";
import * as gallery from "./gallery.js";
import * as reservations from "./reservations.js";
import * as forms from "./forms.js";

function boot() {
  // Order matters: components pehle (toasts + badges ready hon),
  // phir state modules, phir page-specific logic.
  components.init();
  cart.init();
  wishlist.init();
  menu.init();
  gallery.init();
  reservations.init();
  forms.init();

  // Future CSS hooks ke liye marker (abhi CSS isay use nahi karti)
  document.documentElement.classList.add("js-enabled");
}

// DOM ready hone tak wait — script defer jaisa behaviour, module ke sath safe
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
