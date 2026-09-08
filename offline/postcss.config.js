// Deliberately empty. Without this, Vite walks up the tree and finds the
// website's PostCSS config at the repo root, then fails looking for Tailwind —
// which this program does not use. Plain CSS, no build-time dependencies.
module.exports = { plugins: {} }
