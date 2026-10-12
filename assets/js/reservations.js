/**
 * ============================================================
 * LUMIÈRE Bistro — reservations.html
 * Reservation form: validation, Monday-closed rule, quick-reserve
 * prefill (index → reservations query params), confirmation panel.
 * ============================================================
 */

import { $, getQueryParam } from "./utils.js";
import { api } from "./api.js";
import { validateForm, setFormMessage } from "./forms.js";
import { toast } from "./components.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Quick-reserve strip (index.html) — native GET submission already works,
 *  JS sirf date ki min value set karta hai taake past dates na chunein. */
function initQuickReserve() {
  const quickForm = $("[data-quick-reservation-form]");
  if (!quickForm) return;
  const dateInput = quickForm.querySelector('input[type="date"]');
  if (dateInput) dateInput.min = todayISO();
}

function initReservationForm() {
  const form = $("[data-reservation-form]");
  if (!form) return;

  const dateInput = $("[data-reservation-date]");
  const timeSelect = $("[data-reservation-time]");
  const guestSelect = $("[data-reservation-guests]");
  const messageEl = $("[data-reservation-message]");

  if (dateInput) dateInput.min = todayISO();

  // index.html ke quick-reserve se aaye ?date=&time=&guests= params prefill karo
  const qDate = getQueryParam("date");
  const qTime = getQueryParam("time");
  const qGuests = getQueryParam("guests");
  if (qDate && dateInput) dateInput.value = qDate;
  if (qTime && timeSelect) timeSelect.value = qTime;
  if (qGuests && guestSelect) guestSelect.value = qGuests;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm(form)) {
      setFormMessage(messageEl, "Please fix the highlighted fields.", true);
      return;
    }

    // Business rule: Monday ko restaurant band hota hai — pehle hi bata do
    const dateValue = dateInput?.value ?? "";
    if (dateValue && new Date(`${dateValue}T12:00:00`).getDay() === 1) {
      setFormMessage(
        messageEl,
        "We are closed on Mondays — please pick Tuesday to Sunday.",
        true,
      );
      return;
    }

    const submitBtn = form.querySelector("[data-reservation-submit]");
    submitBtn?.classList.add("is-loading");
    setFormMessage(messageEl, "Sending your request…", false);

    try {
      const data = Object.fromEntries(new FormData(form));
      const reservation = await api.submitReservation(data);

      // Form chhupao, confirmation panel dikhao aur usay focus do (a11y)
      const panel = $("[data-reservation-confirmation]");
      if (panel) {
        const nameEl = $("[data-confirmation-name]");
        const summaryEl = $("[data-confirmation-summary]");
        const emailEl = $("[data-confirmation-email]");
        if (nameEl) nameEl.textContent = data.name || "guest";
        if (summaryEl)
          summaryEl.textContent = `${data.guests ?? "2"} guests · ${data.date || ""} at ${data.time || ""}`;
        if (emailEl) emailEl.textContent = data.email || "";
        form.hidden = true;
        panel.hidden = false;
        panel.focus(); // panel par tabindex="-1" HTML me already hai
      }

      setFormMessage(messageEl, "", false);
      toast(`Reservation request sent — reference ${reservation.ref}.`, {
        type: "success",
      });
    } catch (error) {
      setFormMessage(messageEl, error.message, true);
      toast(error.message, { type: "error" });
    } finally {
      submitBtn?.classList.remove("is-loading");
    }
  });
}

/* ---------- Init ---------- */
export function init() {
  initQuickReserve();
  initReservationForm();
}
