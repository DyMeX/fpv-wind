// Deployment configuration. Loaded by index.html and by the service worker (importScripts).
// This is the only place that needs editing when the app is served from a different location.
globalThis.FPV_WIND_CONFIG = {
  // Forecast endpoint: an Open-Meteo compatible /v1/forecast URL or a caching proxy in front of it.
  // A relative value is resolved against the directory the app is served from (the page URL, or the
  // service worker scope), so the default works under any subpath and at the web root.
  // Other examples: '/api/forecast' (absolute path on the same host), 'https://proxy.example.com/forecast'.
  apiUrl: 'api/forecast',
};
