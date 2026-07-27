// Tiny pub-sub so the plain (non-React) `call()` helper in api.js can notify
// a single globally-mounted modal when an action fails for lack of admin
// rights, without every page needing its own admin-specific error handling.
let listener = null;

export function setAdminPromptHandler(fn) {
  listener = fn;
}

export function notifyAdminRequired(message) {
  if (listener) listener(message);
}

const ADMIN_ERROR_PATTERNS = [
  "access is denied",
  "access denied",
  "requires elevation",
  "requested registry access is not allowed",
  "administrator",
  "administrative",
];

export function isAdminError(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return ADMIN_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}
