# FPV Wind

Wind forecast for FPV drone pilots. For a selected hour it shows a fly / caution / no-fly verdict based on the wind at altitude and the gusts, using the median of several weather models.

Live demo: https://dymex.pl/pogoda

Plain JavaScript, no build step. The only third-party code is Leaflet, loaded only when the map is opened. The UI is available in English and Polish.

## Features

- Verdict card for the selected hour: FLY / CAUTION / NO FLY with the reason, a compass (arrow = where the wind blows to), wind at 10 m, the strongest wind up to the chosen altitude, gusts, weather, and model agreement (model spread at the peak altitude above 12 km/h is shown as "models disagree").
- Hours of the selected day (max wind, gusts, direction), wind profile table for 10-180 m, 7-day overview (bar for 06:00-22:00, longest FLY window, max wind and gusts, dominant direction).
- Wind map (OpenTopoMap tiles): 9x9 grid about 3 km apart, arrows for 10 m, 80 m, 120 m and the selected hour.
- "Higher: up to 2 km" (button in the profile, data loaded only when enabled): wind at 500 m, 1 km, 1.5 km and 2 km above ground from pressure levels 950-600 hPa of each model (height = geopotential minus terrain elevation, interpolated, median across models). It does not change the verdict.
- Place from GPS, place search (Nominatim) or a link: `?lat=52.23&lon=21.01&n=Name`. Saved places and settings are kept in localStorage. The last forecast is cached in localStorage and shown offline with its timestamp (service worker).
- English and Polish UI.

## How the verdict is computed

All numbers come from `app/app.js`.

Data: one request to the forecast endpoint with five models: `icon_seamless` (ICON), `ecmwf_ifs025` (ECMWF), `gfs_seamless` (GFS), `gem_seamless` (GEM), `meteofrance_seamless` (Météo-France). The model `best_match` is not used for the main forecast. Each value is the median over the models; missing values (`null`) are skipped.

Models return wind at 10, 80, 120 and 180 m. The rows in between (30, 50, 100, 150 m) are linearly interpolated. Above 120 m some models have no data. When a level has fewer than 3 models and fewer than the level below it, its median, minimum and maximum are raised to at least the values of the lower level, so wind does not appear to drop with height only because of missing data.

Verdict, for the settings "wind limit", "gust limit" and "fly up to altitude":

1. `peak` = the highest median wind among the profile rows up to the chosen altitude.
2. `ratio` = max(`peak` / wind limit, median gusts at 10 m / gust limit).
3. `ratio` < 0.8: FLY; < 1: CAUTION; otherwise NO FLY.
4. If the result is FLY but the windiest model at the peak altitude is at or above the wind limit, or the highest gust of any model is at or above the gust limit, the result becomes CAUTION and the reason names it.

Presets (wind limit, gust limit, altitude): Whoop 18 / 25 km/h up to 50 m, 5" freestyle 25 / 35 km/h up to 120 m, Long range 35 / 45 km/h up to 180 m. The defaults are the 5" values. The three values can be adjusted with sliders (wind 10-50, gusts 15-70, altitude 30-180 m).

The tool is indicative. The decision to fly belongs to the pilot.

## Data sources and terms

- Weather data: [Open-Meteo](https://open-meteo.com/), licensed CC BY 4.0. Open-Meteo API documentation: https://open-meteo.com/en/docs. The nginx example is written for the free quota; the comments in `nginx/fpv-wind-cache.conf` quote the limits (600 requests/min, 5000/hour, 10000/day) at the time of writing. Check the current Open-Meteo terms, including conditions for commercial use, before deploying publicly.
- Place search and reverse geocoding: Nominatim (OpenStreetMap), called directly from the browser. See the Nominatim usage policy before running a busy deployment.
- Map tiles: OpenTopoMap (CC-BY-SA), data from OpenStreetMap and SRTM, loaded from `tile.opentopomap.org`.

The map makes 3 requests of 27 points each, for the selected day only. Each URL is kept under 1024 characters because a WAF rule on my server rejected longer ones.

## Run locally

The app is static. Serve the `app/` directory with any static server (a service worker needs `http://localhost` or HTTPS):

```sh
cd app
python3 -m http.server 8000
# open http://localhost:8000/
```

The app requests `api/forecast` relative to the page, so on a plain static server the forecast request fails. Options:

- Run the nginx example from `nginx/` locally, which proxies `api/forecast` to Open-Meteo.
- Or set `apiUrl` in `app/config.js` to `https://api.open-meteo.com/v1/forecast`. Open-Meteo allows cross-origin requests, so this works without a proxy, but every visitor then counts against the public rate limit and nothing is cached.

## Deploy

1. Copy the files: `DEPLOY_TARGET=user@example.com:/var/www/fpv-wind/ ./deploy.sh` (runs `node --check` when node is installed, checks that the `?v=` values match, then `rsync -a --delete app/`). `DRY_RUN=1` shows the transfer without doing it.
2. Include `nginx/fpv-wind-cache.conf` in the `http{}` context and `nginx/fpv-wind.conf` in your `server{}` block. Create the cache directory and make it writable by the nginx user. The example serves the app under `/fpv-wind/` from `/var/www/fpv-wind/` and proxies `/fpv-wind/api/forecast` to `https://api.open-meteo.com/v1/forecast` with a 30-minute cache, a 10 requests/s per client limit and stale-on-error. Edit the paths as needed.
3. After changing `app.js` or `app.css`, bump the `?v=` value in `index.html` and in the asset list in `sw.js`, and `CACHE_VERSION` in `sw.js`.

Open the app with a trailing slash (`/fpv-wind/`); the nginx example redirects `/fpv-wind` to `/fpv-wind/`. All URLs in the app are relative to the page.

## Configuration

- Base path: nothing to configure for a subpath or the root. All URLs (assets, manifest, `vendor/`, service worker) are relative; the service worker scope is the directory containing `sw.js`; `manifest.json` uses `./` for `id`, `start_url` and `scope`.
- Forecast endpoint: `apiUrl` in `app/config.js` (default `api/forecast`, resolved against the page URL, and against the service worker scope in `sw.js`). It may be an absolute path or a full URL. The service worker does not cache requests to this URL.
- Language: chosen from `navigator.language` (Polish for `pl*`, English otherwise). `?lang=en` or `?lang=pl` overrides it and is remembered in localStorage (`fpvwind.lang`). Texts are in the `I18N` dictionary at the top of `app/app.js`; to add a language, add a dictionary and extend `detectLang()`.
- `index.html` contains `<meta name="robots" content="noindex">`; remove it to allow indexing.

localStorage keys: `fpvwind.lang`, `fpvwind.settings`, `fpvwind.place`, `fpvwind.favorites`, `fpvwind.forecast`.

## Repository layout

```
app/                static site (deploy this directory)
  index.html, app.js, app.css, config.js, sw.js, manifest.json, openapi.json
  icons/            PWA icons
  vendor/           Leaflet 1.9.4 and its license (LEAFLET-LICENSE)
nginx/              example nginx configuration (caching proxy + static files)
deploy.sh           rsync deploy script
```

`app/openapi.json` describes the proxy endpoint (a read-only pass-through of the Open-Meteo Forecast API).

## Credits

- [Open-Meteo](https://open-meteo.com/) for the weather data (CC BY 4.0).
- [Leaflet](https://leafletjs.com/) 1.9.4, BSD 2-Clause License, see `app/vendor/LEAFLET-LICENSE`.
- [OpenTopoMap](https://opentopomap.org) and [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors for map tiles and place search.
- Verdict logic is based on [Drone Blast](https://github.com/szkocot/drone-blast) (MIT).

## License

MIT, see `LICENSE`. Leaflet is distributed under its own license.
