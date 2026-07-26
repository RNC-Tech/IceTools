// Applies the theme synchronously before React mounts, avoiding a flash of
// the wrong theme. Kept as an external same-origin file (not an inline
// <script>) because the app's CSP is script-src 'self' with no
// 'unsafe-inline' - inline scripts would simply be blocked.
(function () {
  var stored = localStorage.getItem("icetools-theme");
  var theme =
    stored === "rnclabs" || stored === "rnclabsdark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "rnclabsdark"
        : "rnclabs";
  document.documentElement.setAttribute("data-theme", theme);
})();
