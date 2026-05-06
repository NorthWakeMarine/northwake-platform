declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(...args);
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  gtag("event", name, params);
}

// ── Navigation ────────────────────────────────────────────────
export function trackNavClick(linkText: string, linkUrl: string, location: "header" | "footer" | "mobile_menu") {
  trackEvent("nav_click", { link_text: linkText, link_url: linkUrl, nav_location: location });
}

// ── CTAs ─────────────────────────────────────────────────────
export function trackCtaClick(ctaText: string, location: string) {
  trackEvent("cta_click", { cta_text: ctaText, cta_location: location });
}

// ── Contact ──────────────────────────────────────────────────
export function trackPhoneClick(location: string) {
  trackEvent("phone_click", { click_location: location });
}

export function trackEmailClick(location: string) {
  trackEvent("email_click", { click_location: location });
}

// ── Forms ────────────────────────────────────────────────────
export function trackFormStart(formId: string) {
  trackEvent("quote_form_start", { form_id: formId });
}

export function trackFormSubmit(formId: string, service?: string) {
  trackEvent("quote_form_submit", { form_id: formId, ...(service ? { service_selected: service } : {}) });
}

export function trackFormSuccess(formId: string, service?: string) {
  trackEvent("quote_form_success", { form_id: formId, ...(service ? { service_selected: service } : {}) });
}

export function trackFormError(formId: string, errorMessage: string) {
  trackEvent("quote_form_error", { form_id: formId, error_message: errorMessage });
}

// ── Carousel ─────────────────────────────────────────────────
export function trackCarouselNavigate(direction: "prev" | "next") {
  trackEvent("carousel_navigate", { direction });
}

// ── Scroll depth ─────────────────────────────────────────────
export function trackScrollDepth(depthPercent: 25 | 50 | 75 | 100, pagePath: string) {
  trackEvent("scroll_depth", { depth_percent: depthPercent, page_path: pagePath });
}
