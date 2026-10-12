/**
 * ============================================================
 * LUMIÈRE Bistro — forms.js
 * Generic validation engine + page forms (newsletter, contact,
 * private dining, future auth). Checkout/reservation forms apne
 * apne modules me handle hote hain magar validation yahan se aata hai.
 * ============================================================
 */

import { $, $$ } from "./utils.js";
import { api } from "./api.js";
import { toast } from "./components.js";

/* ============================================================
   1. Validation rules — har rule ya true deta hai ya error message
   ============================================================ */
const VALIDATORS = {
  required: (field) =>
    (field.type === "checkbox" ? field.checked : field.value.trim() !== "") ||
    "This field is required.",
  email: (field) =>
    field.value === "" ||
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim()) ||
    "Please enter a valid email address.",
  tel: (field) =>
    field.value === "" ||
    /^[0-9+()\-\s]{7,}$/.test(field.value.trim()) ||
    "Please enter a valid phone number.",
  number: (field) => {
    if (field.value === "") return true;
    const value = Number(field.value);
    if (Number.isNaN(value)) return "Please enter a number.";
    if (field.min !== "" && value < Number(field.min))
      return `Minimum value is ${field.min}.`;
    if (field.max !== "" && value > Number(field.max))
      return `Maximum value is ${field.max}.`;
    return true;
  },
};

function rulesFor(field) {
  const rules = [];
  if (field.required) rules.push(VALIDATORS.required);
  if (field.type === "email") rules.push(VALIDATORS.email);
  if (field.type === "tel") rules.push(VALIDATORS.tel);
  if (field.type === "number") rules.push(VALIDATORS.number);
  return rules;
}

/* ============================================================
   2. Error UI — inline message + aria-invalid (CSS me ring styled hai)
   ============================================================ */
function showError(field, message) {
  field.setAttribute("aria-invalid", "true");
  const host = field.closest(".form-group, .form-check") ?? field.parentElement;
  let errorEl = host?.querySelector(".field-error");
  if (!errorEl && host) {
    errorEl = document.createElement("p");
    errorEl.className = "form-hint field-error";
    errorEl.setAttribute("role", "alert");
    errorEl.style.color = "var(--color-error)";
    host.append(errorEl);
  }
  if (errorEl) errorEl.textContent = message;
}

function clearError(field) {
  field.removeAttribute("aria-invalid");
  field
    .closest(".form-group, .form-check")
    ?.querySelector(".field-error")
    ?.remove();
}

export function validateField(field) {
  for (const rule of rulesFor(field)) {
    const result = rule(field);
    if (result !== true) {
      showError(field, result);
      return false;
    }
  }
  clearError(field);
  return true;
}

// Hidden sections (checkout me pickup/delivery toggle) ko skip karne ke liye
const isVisible = (el) => el.offsetParent !== null;

/** Poori form validate karo; pehla invalid field focus karo. */
export function validateForm(form) {
  const fields = $$("input, select, textarea", form).filter(
    (f) =>
      !f.disabled && isVisible(f) && f.type !== "radio" && f.type !== "hidden",
  );
  let firstInvalid = null;
  fields.forEach((field) => {
    if (!validateField(field) && !firstInvalid) firstInvalid = field;
  });
  firstInvalid?.focus();
  return !firstInvalid;
}

/** Form ke neeche wale status/message element ko update karo */
export function setFormMessage(el, text, isError = false) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("is-error", Boolean(isError && text));
  el.classList.toggle("is-success", Boolean(!isError && text));
}

/* ============================================================
   3. Live validation — blur par check, typing par error clear.
   Note: 'blur' bubble NAHI karta — capture phase me pakarna zaroori hai.
   ============================================================ */
function attachLiveValidation(form) {
  form.addEventListener(
    "blur",
    (event) => {
      const field = event.target;
      if (field.matches?.("input, select, textarea") && field.type !== "radio")
        validateField(field);
    },
    true,
  );

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (
      field.matches?.("input, select, textarea") &&
      field.getAttribute("aria-invalid") === "true"
    ) {
      validateField(field);
    }
  });
}

/* ============================================================
   4. Checkout ke conditional sections (delivery/pickup, card fields)
   ============================================================ */
function initConditionalSections() {
  const syncFulfilment = () => {
    const mode =
      document.querySelector('input[name="fulfilment"]:checked')?.value ??
      "delivery";
    const address = $("[data-checkout-address]");
    const pickup = $("[data-checkout-pickup]");
    if (address) address.hidden = mode !== "delivery";
    if (pickup) pickup.hidden = mode !== "pickup";
  };
  $$('input[name="fulfilment"]').forEach((radio) =>
    radio.addEventListener("change", syncFulfilment),
  );
  syncFulfilment();

  const syncPayment = () => {
    const method =
      document.querySelector('input[name="payment"]:checked')?.value ?? "card";
    const cardFields = $("[data-checkout-card-fields]");
    if (cardFields) cardFields.hidden = method !== "card";
  };
  $$('input[name="payment"]').forEach((radio) =>
    radio.addEventListener("change", syncPayment),
  );
  syncPayment();
}

/* ============================================================
   5. Generic form handlers — config-driven (naya form = ek line)
   ============================================================ */
const FORM_CONFIGS = [
  {
    attr: "data-newsletter-form",
    messageAttr: "data-newsletter-message",
    endpoint: (data) => api.subscribeNewsletter(data),
    success: "You are on the list — see you in the next Lumière Letter.",
  },
  {
    attr: "data-contact-form",
    messageAttr: "data-contact-message",
    endpoint: (data) => api.submitContact(data),
    success: "Message sent — we reply within one service day.",
  },
  {
    attr: "data-private-dining-form",
    messageAttr: "data-pd-message",
    endpoint: (data) => api.submitPrivateDining(data),
    success:
      "Enquiry sent — our events host will reply within one service day.",
  },
];

/** Future login/register/forgot pages ke liye defensive hooks */
function initAuthForms() {
  $$("form[data-auth-form]").forEach((form) => {
    attachLiveValidation(form);
    const mode = form.dataset.authForm;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(form)) return;
      const data = Object.fromEntries(new FormData(form));
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn?.classList.add("is-loading");
      try {
        if (mode === "login") await api.login(data);
        else if (mode === "register") await api.register(data);
        else await api.requestPasswordReset(data);
        toast(
          mode === "forgot"
            ? "Reset link sent (demo)."
            : `Welcome, ${data.name ?? data.email}!`,
          { type: "success" },
        );
        if (mode !== "forgot") window.location.assign("profile.html");
      } catch (error) {
        toast(error.message, { type: "error" });
      } finally {
        submitBtn?.classList.remove("is-loading");
      }
    });
  });
}

/* ---------- Single init ---------- */
export function init() {
  initConditionalSections();

  FORM_CONFIGS.forEach(({ attr, messageAttr, endpoint, success }) => {
    $$(`[${attr}]`).forEach((form) => {
      attachLiveValidation(form);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const messageEl = form.querySelector(`[${messageAttr}]`);
        const data = Object.fromEntries(new FormData(form));

        if (!validateForm(form)) {
          setFormMessage(messageEl, "Please fix the highlighted fields.", true);
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn?.classList.add("is-loading");
        setFormMessage(messageEl, "Sending…", false);

        try {
          await endpoint(data);
          setFormMessage(messageEl, success, false);
          toast(success, { type: "success" });
          form.reset();
        } catch (error) {
          setFormMessage(messageEl, error.message, true);
          toast(error.message, { type: "error" });
        } finally {
          submitBtn?.classList.remove("is-loading");
        }
      });
    });
  });

  initAuthForms();
}
