// ============================================================
// DOM Utilities & Helpers
// ============================================================

export const $ = (id) => document.getElementById(id);

export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

export function on(element, event, handler, options) {
  if (!element) return;
  element.addEventListener(event, handler, options);
}

export function debounce(fn, delay = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
