// FPV Wind: wind forecast for FPV pilots. Plain JS, no libraries (except Leaflet, loaded only when the map is opened).
// Data: Open-Meteo (directly or through a caching proxy, see config.js): ONE request with 5 models.
// Verdict: strongest wind (median of the models) up to the selected altitude + gusts at 10 m; when the windiest model
// exceeds the limit, FLY becomes CAUTION. Missing data (null) is skipped, not counted as 0.
'use strict';

// ---------------------------------------------------------------- i18n
const I18N = {
  en: {
    appTitle: 'FPV Wind',
    locating: 'Locating…',
    changePlace: 'Change location',
    settings: 'Settings',
    windDirection: 'Wind direction',
    max: 'max',
    gusts: 'gusts',
    weather: 'weather',
    today: 'Today',
    todayLower: 'today',
    now: 'Now',
    hoursHint: 'max wind · <small>gusts</small>',
    hours: 'Hours',
    windAloft: 'Wind at altitude',
    extendedBtn: '⛰ Higher: up to 2 km',
    profileNote: 'Median of the models in km/h. Colour: green &lt; 80% of the limit, yellow up to the limit, red above. ' +
      'Extended altitude: wind above ground level from pressure levels (950-600 hPa), arrow: where the wind blows to.',
    windMap: 'Wind map',
    mapAltitude: 'Map altitude',
    showMap: 'Show wind direction map',
    mapNote: 'Arrows show where the wind blows to (~3 km grid, ICON/best model for the region), for the selected hour.',
    sevenDays: '7 days',
    footer: 'Data: <a href="https://open-meteo.com/" rel="noopener">Open-Meteo</a> (ICON, ECMWF, GFS, GEM, Météo-France) · ' +
      'map © <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>, <a href="https://opentopomap.org" rel="noopener">OpenTopoMap</a> · ' +
      'logic based on <a href="https://github.com/szkocot/drone-blast" rel="noopener">Drone Blast</a> (MIT). The forecast is indicative; the decision to fly is the pilot\'s.',
    place: 'Location',
    close: 'Close',
    myLocation: '📍 My location',
    searchPlaceholder: 'Search for a place…',
    saved: 'Saved',
    savePlace: '☆ Save current location',
    droneProfile: 'Drone profile',
    presetWhoop: 'Whoop',
    preset5: '5″ freestyle',
    presetLr: 'Long range',
    windLimit: 'Wind limit',
    gustLimit: 'Gust limit',
    flyUpTo: 'Fly up to altitude',
    verdictNote: 'Verdict: strongest wind up to the selected altitude and gusts at 10 m. When the models disagree ' +
      'and the windiest one exceeds the limit, CAUTION instead of FLY.',
    // dynamic texts
    verdictFly: 'FLY',
    verdictCaution: 'CAUTION',
    verdictStop: 'NO FLY',
    verdictNone: 'no data',
    reasonGusts: 'gusts {v} km/h',
    reasonWind: '{v} km/h at {h} m',
    reasonModelsWind: ' · some models: wind up to {v} km/h',
    reasonModelsGusts: ' · some models: gusts up to {v} km/h',
    oneModel: '1 model',
    noModels: 'no models',
    modelsDiverge: 'models disagree: {a}-{b} km/h',
    modelsAgreeMany: '{n} models agree (±{x})',
    modelsAgreeFew: '{n} models agree (±{x})',
    modelsTitle: '{n} models',
    windFrom: 'Wind {dir} ({deg}°) at the surface',
    higherFrom: ' · higher up {dir} ({deg}°)',
    higherSimilar: ' · similar higher up',
    aboveGround: ' (above ground)',
    noData: 'no data',
    dirs: ['from the north', 'from the north-east', 'from the east', 'from the south-east', 'from the south', 'from the south-west', 'from the west', 'from the north-west'],
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    decimalSep: '.',
    windowFly: 'FLY {a}-{b}',
    windowCaution: 'caution at best',
    windowNone: 'no window',
    gustsShort: 'gusts {v}',
    fetching: 'Fetching forecast…',
    rateLimit: 'API rate limit - try again in a minute',
    refreshFailed: 'Could not refresh ({e}) - forecast from {time}.',
    fetchFailed: 'Could not fetch the forecast: {e}. Check your connection and reload.',
    forecastFrom: 'Forecast from {time}',
    terrain: ' · terrain elevation {h} m a.s.l.',
    extendedFailed: 'Extended altitude: could not fetch ({e}).',
    mapFailed: 'Wind map: could not fetch ({e}).',
    mapLoadFailed: 'Could not load the map.',
    noGeolocation: 'This browser does not provide geolocation - search for a place.',
    geolocationDenied: 'Location access denied - pick a place from the list.',
    myLocationName: 'My location',
    placeDefault: 'Place',
    nothingFound: 'Nothing found',
    searchUnavailable: 'Search unavailable',
    noFavorites: 'None yet - save the places where you fly.',
    remove: 'Remove',
  },
  pl: {
    appTitle: 'Wiatr FPV',
    locating: 'Ustalam lokalizację…',
    changePlace: 'Zmień miejsce',
    settings: 'Ustawienia',
    windDirection: 'Kierunek wiatru',
    max: 'maks.',
    gusts: 'porywy',
    weather: 'pogoda',
    today: 'Dziś',
    todayLower: 'dziś',
    now: 'Teraz',
    hoursHint: 'wiatr maks. · <small>porywy</small>',
    hours: 'Godziny',
    windAloft: 'Wiatr na wysokościach',
    extendedBtn: '⛰ Wyżej: do 2 km',
    profileNote: 'Mediana modeli w km/h. Kolor: zielony &lt; 80% limitu, żółty do limitu, czerwony powyżej. ' +
      'Wysokość rozszerzona: wiatr nad terenem z poziomów ciśnienia (950–600 hPa), strzałka – dokąd wieje.',
    windMap: 'Mapa wiatru',
    mapAltitude: 'Wysokość na mapie',
    showMap: 'Pokaż mapę z kierunkiem wiatru',
    mapNote: 'Strzałki pokazują, dokąd wieje wiatr (siatka ~3 km, model ICON/najlepszy dla regionu), dla wybranej godziny.',
    sevenDays: '7 dni',
    footer: 'Dane: <a href="https://open-meteo.com/" rel="noopener">Open-Meteo</a> (ICON, ECMWF, GFS, GEM, Météo-France) · ' +
      'mapa © <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>, <a href="https://opentopomap.org" rel="noopener">OpenTopoMap</a> · ' +
      'logika na podstawie <a href="https://github.com/szkocot/drone-blast" rel="noopener">Drone Blast</a> (MIT). Prognoza orientacyjna – decyzja o locie należy do pilota.',
    place: 'Miejsce',
    close: 'Zamknij',
    myLocation: '📍 Moja lokalizacja',
    searchPlaceholder: 'Szukaj miejscowości…',
    saved: 'Zapisane',
    savePlace: '☆ Zapisz bieżące miejsce',
    droneProfile: 'Profil drona',
    presetWhoop: 'Whoop',
    preset5: '5″ freestyle',
    presetLr: 'Long range',
    windLimit: 'Limit wiatru',
    gustLimit: 'Limit porywów',
    flyUpTo: 'Latam do wysokości',
    verdictNote: 'Werdykt: najsilniejszy wiatr do wybranej wysokości i porywy przy 10 m. Gdy modele się nie zgadzają, ' +
      'a najbardziej wietrzny przekracza limit – „OSTROŻNIE” zamiast „LEĆ”.',
    verdictFly: 'LEĆ',
    verdictCaution: 'OSTROŻNIE',
    verdictStop: 'NIE LEĆ',
    verdictNone: 'brak danych',
    reasonGusts: 'porywy {v} km/h',
    reasonWind: '{v} km/h na {h} m',
    reasonModelsWind: ' · część modeli: wiatr do {v} km/h',
    reasonModelsGusts: ' · część modeli: porywy do {v} km/h',
    oneModel: '1 model',
    noModels: 'brak modeli',
    modelsDiverge: 'modele rozbieżne: {a}–{b} km/h',
    modelsAgreeMany: '{n} modeli zgodnych (±{x})',
    modelsAgreeFew: '{n} modele zgodne (±{x})',
    modelsTitle: '{n} modeli',
    windFrom: 'Wieje {dir} ({deg}°) przy ziemi',
    higherFrom: ' · wyżej {dir} ({deg}°)',
    higherSimilar: ' · wyżej podobnie',
    aboveGround: ' (nad terenem)',
    noData: 'brak danych',
    dirs: ['z północy', 'z północnego wschodu', 'z wschodu', 'z południowego wschodu', 'z południa', 'z południowego zachodu', 'z zachodu', 'z północnego zachodu'],
    days: ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'],
    decimalSep: ',',
    windowFly: 'LEĆ {a}–{b}',
    windowCaution: 'najwyżej ostrożnie',
    windowNone: 'brak okna',
    gustsShort: 'porywy {v}',
    fetching: 'Pobieram prognozę…',
    rateLimit: 'limit zapytań API – spróbuj za minutę',
    refreshFailed: 'Nie udało się odświeżyć ({e}) – prognoza z {time}.',
    fetchFailed: 'Nie udało się pobrać prognozy: {e}. Sprawdź połączenie i odśwież.',
    forecastFrom: 'Prognoza z {time}',
    terrain: ' · wysokość terenu {h} m n.p.m.',
    extendedFailed: 'Wysokość rozszerzona: nie udało się pobrać ({e}).',
    mapFailed: 'Mapa wiatru: nie udało się pobrać ({e}).',
    mapLoadFailed: 'Nie udało się wczytać mapy.',
    noGeolocation: 'Ta przeglądarka nie udostępnia lokalizacji – wyszukaj miejsce.',
    geolocationDenied: 'Brak dostępu do lokalizacji – wybierz miejsce z listy.',
    myLocationName: 'Moja lokalizacja',
    placeDefault: 'Miejsce',
    nothingFound: 'Nic nie znaleziono',
    searchUnavailable: 'Wyszukiwanie niedostępne',
    noFavorites: 'Brak – zapisz miejsca, w których latasz.',
    remove: 'Usuń',
  },
};

// storage helpers (storage may be unavailable, e.g. private mode)
const storeGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const storeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

// language: ?lang=en|pl (remembered), else the stored choice, else navigator.language (Polish for pl*, English otherwise)
function detectLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'pl') { storeSet('fpvwind.lang', q); return q; }
  const saved = storeGet('fpvwind.lang', null);
  if (saved === 'en' || saved === 'pl') return saved;
  return /^pl\b/i.test(navigator.language || '') ? 'pl' : 'en';
}
const LANG = detectLang();
const LOCALE = LANG === 'pl' ? 'pl-PL' : 'en-GB';
function t(key, params) {
  const s = I18N[LANG][key] ?? I18N.en[key] ?? key;
  return typeof s === 'string' && params ? s.replace(/\{(\w+)\}/g, (m, k) => (params[k] ?? m)) : s;
}
function applyStaticTexts() {
  document.documentElement.lang = LANG;
  document.title = t('appTitle');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });   // own dictionary only
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)));
}
applyStaticTexts();

// ---------------------------------------------------------------- configuration
const CONFIG = Object.assign({ apiUrl: 'api/forecast' }, globalThis.FPV_WIND_CONFIG);
const API_URL = new URL(CONFIG.apiUrl, document.baseURI).href;   // relative values resolve against the page directory

const MODELS = [['icon_seamless', 'ICON'], ['ecmwf_ifs025', 'ECMWF'], ['gfs_seamless', 'GFS'],
                ['gem_seamless', 'GEM'], ['meteofrance_seamless', 'Météo-France']];
const LEVELS = [10, 80, 120, 180];                          // heights computed by the models
const ALTITUDES = [10, 30, 50, 80, 100, 120, 150, 180];     // profile rows (in-between values: linear interpolation)
const PRESETS = { whoop: [18, 25, 50], '5': [25, 35, 120], lr: [35, 45, 180] };   // wind limit, gust limit, altitude
const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const REFRESH_MS = 30 * 60 * 1000;
const PRESSURE_LEVELS = [950, 925, 900, 850, 800, 750, 700, 650, 600];   // hPa, about 0.5-4.2 km above sea level
const EXTENDED_ALTITUDES = [500, 1000, 1500, 2000];                      // m above ground (extended altitude)
const altLabel = (h) => (h >= 1000 ? `${String(h / 1000).replace('.', t('decimalSep'))} km` : `${h} m`);

const $ = (id) => document.getElementById(id);

const state = {
  settings: Object.assign({ limit: 25, gust: 35, alt: 120, preset: '5', extended: false }, storeGet('fpvwind.settings', {})),
  place: storeGet('fpvwind.place', null),
  favorites: storeGet('fpvwind.favorites', []),
  data: null, day: null, hourIndex: null, fetchedAt: 0, extended: null, extendedKey: null,
  map: null, mapAlt: 10, mapLayer: null, mapData: {},
};

// ---------------------------------------------------------------- data
function numbers(a) { return a.filter((v) => typeof v === 'number' && Number.isFinite(v)); }
function median(a) {
  const s = numbers(a).sort((x, y) => x - y);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function meanDirection(speeds, directions) {   // vector mean of the "wind from" direction, weighted by speed
  let x = 0, y = 0, n = 0;
  directions.forEach((d, i) => {
    const s = speeds[i];
    if (typeof d !== 'number' || typeof s !== 'number') return;
    const r = d * Math.PI / 180, w = Math.max(s, 0.1);
    x += w * Math.sin(r); y += w * Math.cos(r); n++;
  });
  if (!n) return null;
  return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
}
function interpolate(positions, values, h) {   // positions: [10,80,120,180], values (null = missing) -> value at h
  const pairs = positions.map((p, i) => [p, values[i]]).filter(([, v]) => v != null);
  if (!pairs.length) return null;
  if (h <= pairs[0][0]) return pairs[0][1];
  for (let i = 1; i < pairs.length; i++) {
    const [p0, v0] = pairs[i - 1], [p1, v1] = pairs[i];
    if (h <= p1) return v0 + (v1 - v0) * (h - p0) / (p1 - p0);
  }
  return pairs[pairs.length - 1][1];             // above the highest available level: last value
}

function processForecast(json) {
  const H = json.hourly, n = H.time.length;
  const field = (name, model) => H[`${name}_${model}`] || [];
  const hours = [];
  for (let i = 0; i < n; i++) {
    const atLevel = LEVELS.map((lv) => {
      const s = MODELS.map(([m]) => field(`wind_speed_${lv}m`, m)[i]);
      const d = MODELS.map(([m]) => field(`wind_direction_${lv}m`, m)[i]);
      const l = numbers(s);
      return { med: median(s), min: l.length ? Math.min(...l) : null, max: l.length ? Math.max(...l) : null,
               dir: meanDirection(s, d), models: l.length };
    });
    // above 120 m some models do not compute wind (at 180 m usually only ICON and Météo-France). With < 3 models we do
    // not let the wind "decrease" with height just because of missing data: at least the value from the lower level (cautious)
    for (let k = 1; k < atLevel.length; k++) {
      const a = atLevel[k], b = atLevel[k - 1];
      if (a.models < 3 && a.models < b.models && b.med != null) {
        a.med = Math.max(a.med ?? 0, b.med); a.max = Math.max(a.max ?? 0, b.max ?? 0); a.min = Math.max(a.min ?? 0, b.min ?? 0);
        if (a.dir == null) a.dir = b.dir;
        a.filled = true;
      }
    }
    const alt = {};
    for (const h of ALTITUDES) {
      alt[h] = { med: interpolate(LEVELS, atLevel.map((x) => x.med), h), min: interpolate(LEVELS, atLevel.map((x) => x.min), h),
                 max: interpolate(LEVELS, atLevel.map((x) => x.max), h) };
    }
    const gusts = MODELS.map(([m]) => field('wind_gusts_10m', m)[i]);
    const codes = numbers(MODELS.map(([m]) => field('weather_code', m)[i]));
    hours.push({
      t: H.time[i], day: H.time[i].slice(0, 10), h: +H.time[i].slice(11, 13), alt,
      dir: Object.fromEntries(LEVELS.map((lv, k) => [lv, atLevel[k].dir])),
      gust: median(gusts), gustMax: numbers(gusts).length ? Math.max(...numbers(gusts)) : null,
      temp: median(MODELS.map(([m]) => field('temperature_2m', m)[i])),
      code: codes.length ? codes[0] : null,          // ICON is first in the list: best for Central Europe
      models: atLevel[0].models,
    });
  }
  return { hours, offset: json.utc_offset_seconds || 0, terrainElevation: json.elevation };
}

// Extended altitude: for each model, points (height above ground = geopotential - terrain elevation, speed, direction)
// from pressure levels -> interpolation to 500 m ... 2 km; then median/min/max across models. Outside a model's range: no value.
function processExtended(json) {
  const H = json.hourly, terrain = json.elevation ?? 0, result = {};
  H.time.forEach((time, i) => {
    const atH = {};
    for (const target of EXTENDED_ALTITUDES) {
      const s = [], d = [];
      for (const [m] of MODELS) {
        const pts = PRESSURE_LEVELS.map((p) => [H[`geopotential_height_${p}hPa_${m}`]?.[i], H[`wind_speed_${p}hPa_${m}`]?.[i], H[`wind_direction_${p}hPa_${m}`]?.[i]])
          .filter(([z, v, k]) => z != null && v != null && k != null).map(([z, v, k]) => [z - terrain, v, k]).sort((a, b) => a[0] - b[0]);
        for (let k = 1; k < pts.length; k++) {
          const [z0, v0, d0] = pts[k - 1], [z1, v1, d1] = pts[k];
          if (z0 <= target && target <= z1) {
            const f = (target - z0) / (z1 - z0 || 1);
            s.push(v0 + (v1 - v0) * f); d.push(f < 0.5 ? d0 : d1); break;
          }
        }
      }
      const l = numbers(s);
      atH[target] = { med: median(s), min: l.length ? Math.min(...l) : null, max: l.length ? Math.max(...l) : null, dir: meanDirection(s, d), models: l.length };
    }
    result[time] = atH;
  });
  return result;
}
async function fetchExtended() {
  const m = state.place;
  if (!m || !state.settings.extended) return;
  const key = `${m.lat.toFixed(2)},${m.lon.toFixed(2)}|${Math.floor(Date.now() / REFRESH_MS)}`;
  if (state.extendedKey === key) return;
  state.extendedKey = key;
  const p = new URLSearchParams({
    latitude: m.lat.toFixed(2), longitude: m.lon.toFixed(2), wind_speed_unit: 'kmh', forecast_days: '7', timezone: 'auto',
    models: MODELS.map(([x]) => x).join(','),
    hourly: PRESSURE_LEVELS.flatMap((c) => [`wind_speed_${c}hPa`, `wind_direction_${c}hPa`, `geopotential_height_${c}hPa`]).join(','),
  });
  try {
    const r = await fetch(`${API_URL}?${p}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    state.extended = processExtended(await r.json());
    render();
  } catch (e) { state.extendedKey = null; showStatus(t('extendedFailed', { e: e.message })); }
}

function verdict(g, settings = state.settings) {
  let peak = -1, peakH = 10, peakMax = 0, peakMin = 0;
  for (const h of ALTITUDES) {
    if (h > settings.alt) break;
    const w = g.alt[h];
    if (w.med != null && w.med > peak) { peak = w.med; peakH = h; peakMax = w.max; peakMin = w.min; }
  }
  if (peak < 0) return { v: 'none', text: t('verdictNone'), reason: '', peak: null };
  const rW = peak / settings.limit, rG = (g.gust ?? 0) / settings.gust;
  const r = Math.max(rW, rG);
  let v = r < 0.8 ? 'fly' : r < 1 ? 'caution' : 'stop';
  let reason = rG > rW ? t('reasonGusts', { v: round(g.gust) }) : t('reasonWind', { v: round(peak), h: peakH });
  if (v === 'fly') {                              // median OK, but the windiest model exceeds the limit
    if ((peakMax ?? 0) >= settings.limit) { v = 'caution'; reason += t('reasonModelsWind', { v: round(peakMax) }); }
    else if ((g.gustMax ?? 0) >= settings.gust) { v = 'caution'; reason += t('reasonModelsGusts', { v: round(g.gustMax) }); }
  }
  const spread = (peakMax ?? 0) - (peakMin ?? 0);
  const text = { fly: t('verdictFly'), caution: t('verdictCaution'), stop: t('verdictStop') }[v];
  return { v, text, reason, peak, peakH, spread };
}

const round = (x) => (x == null ? '–' : Math.round(x));
const levelClass = (kmh, limit) => (kmh == null ? '' : kmh / limit < 0.8 ? 'fly' : kmh / limit < 1 ? 'caution' : 'stop');
const dirShort = (d) => (d == null ? '–' : COMPASS_POINTS[Math.round(d / 45) % 8]);
const dirText = (d) => (d == null ? '' : t('dirs')[Math.round(d / 45) % 8]);
function weatherIcon(code, h) {
  if (code == null) return '';
  const night = h < 6 || h >= 20;
  if (code === 0) return night ? '🌙' : '☀️';
  if (code <= 2) return night ? '☁️' : '⛅';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67 || (code >= 80 && code <= 82)) return '🌧️';
  if (code <= 77 || code === 85 || code === 86) return '🌨️';
  return '⛈️';
}
function dayName(d) {
  const dt = new Date(d + 'T12:00:00Z');
  return t('days')[dt.getUTCDay()];
}
function nowKey() {                              // "now" in the forecast location's time zone, as 'YYYY-MM-DDTHH'
  return new Date(Date.now() + (state.data?.offset || 0) * 1000).toISOString().slice(0, 13);
}
function arrowSvg(d, color = 'currentColor') {   // "where the wind blows to" arrow (meteorological direction + 180°)
  if (d == null) return '';
  return `<svg viewBox="0 0 24 24" class="h-arrow" style="transform:rotate(${(d + 180) % 360}deg)"><path d="M12 2 L18 20 L12 16 L6 20 Z" fill="${color}"/></svg>`;
}

// ---------------------------------------------------------------- fetching
async function fetchForecast(force = false) {
  const m = state.place;
  if (!m) return;
  const key = `${m.lat.toFixed(2)},${m.lon.toFixed(2)}`;
  const cached = storeGet('fpvwind.forecast', null);
  if (!force && cached && cached.key === key && Date.now() - cached.ts < REFRESH_MS) {
    showForecast(cached.json, cached.ts); return;
  }
  const p = new URLSearchParams({
    latitude: m.lat.toFixed(2), longitude: m.lon.toFixed(2), wind_speed_unit: 'kmh', forecast_days: '7', timezone: 'auto',
    models: MODELS.map(([x]) => x).join(','),
    hourly: ['wind_speed', 'wind_direction'].flatMap((v) => LEVELS.map((h) => `${v}_${h}m`))
      .concat(['wind_gusts_10m', 'temperature_2m', 'weather_code']).join(','),
  });
  try {
    showStatus(cached && cached.key === key ? '' : t('fetching'));
    const r = await fetch(`${API_URL}?${p}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status === 429 ? t('rateLimit') : `HTTP ${r.status}`);
    const json = await r.json();
    storeSet('fpvwind.forecast', { key, ts: Date.now(), json });
    showStatus('');
    showForecast(json, Date.now());
  } catch (e) {
    if (cached && cached.key === key) {
      showForecast(cached.json, cached.ts);
      showStatus(t('refreshFailed', { e: e.message, time: new Date(cached.ts).toLocaleString(LOCALE, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) }));
    } else {
      showStatus(t('fetchFailed', { e: e.message }));
    }
  }
}
function showStatus(text) { const s = $('status'); s.textContent = text; s.hidden = !text; }

function showForecast(json, ts) {
  const isNew = !state.data || state.fetchedAt !== ts;
  state.data = processForecast(json); state.fetchedAt = ts;
  const nk = nowKey();
  const nowIndex = Math.max(0, state.data.hours.findIndex((g) => g.t.slice(0, 13) === nk));
  if (isNew || state.hourIndex == null || state.hourIndex >= state.data.hours.length) { state.hourIndex = nowIndex; state.day = state.data.hours[nowIndex].day; }
  $('updated').textContent = t('forecastFrom', { time: new Date(ts).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }) }) +
    (state.data.terrainElevation != null ? t('terrain', { h: Math.round(state.data.terrainElevation) }) : '');
  render();
}

// ---------------------------------------------------------------- views
function render() {
  if (!state.data) return;
  renderCard(); renderHours(); renderProfile(); renderDays(); renderMap(); renderExtendedButton();
  if (state.settings.extended) fetchExtended();
}

function renderCard() {
  const g = state.data.hours[state.hourIndex], w = verdict(g);
  const k = $('card');
  k.className = `card ${w.v === 'fly' ? 'fly' : w.v === 'caution' ? 'caution' : w.v === 'stop' ? 'stop' : ''}`;
  const nk = nowKey();
  const isToday = g.day === nk.slice(0, 10);
  $('card-time').textContent = (g.t.slice(0, 13) === nk ? `${t('now')} · ` : '') +
    `${isToday ? t('todayLower') : dayName(g.day) + ' ' + g.day.slice(8, 10) + '.' + g.day.slice(5, 7)} ${String(g.h).padStart(2, '0')}:00`;
  $('verdict').textContent = w.text;
  $('reason').textContent = w.reason;
  const z = $('card-agreement');
  if (w.spread == null || g.models < 2) { z.textContent = g.models ? t('oneModel') : t('noModels'); z.className = 'chip'; }
  else {
    const bad = w.spread > 12;
    z.textContent = bad ? t('modelsDiverge', { a: round(g.alt[w.peakH].min), b: round(g.alt[w.peakH].max) })
      : t(g.models >= 5 ? 'modelsAgreeMany' : 'modelsAgreeFew', { n: g.models, x: round(w.spread / 2) });
    z.className = bad ? 'chip bad' : 'chip';
  }
  $('n-10').textContent = `${round(g.alt[10].med)} km/h`;
  $('n-max-label').textContent = w.peakH ? `↑ ${w.peakH} m` : t('max');
  $('n-max').textContent = `${round(w.peak)} km/h`;
  $('n-gust').textContent = `${round(g.gust)} km/h`;
  $('n-weather-label').textContent = weatherIcon(g.code, g.h) || t('weather');
  $('n-temp').textContent = g.temp == null ? '–' : `${Math.round(g.temp)}°C`;
  const d10 = g.dir[10], dHigh = g.dir[state.settings.alt >= 120 ? 120 : 80];
  $('compass-arrow').style.transform = `rotate(${((d10 ?? 0) + 180) % 360}deg)`;
  $('compass-arrow').style.opacity = d10 == null ? 0 : 1;
  $('direction-text').textContent = d10 == null ? '' :
    t('windFrom', { dir: dirText(d10), deg: Math.round(d10) }) +
    (dHigh != null && Math.abs(((dHigh - d10 + 540) % 360) - 180) >= 25 ? t('higherFrom', { dir: dirText(dHigh), deg: Math.round(dHigh) }) : t('higherSimilar'));
  const ext = $('extended-text'), r = state.settings.extended && state.extended?.[g.t];
  ext.hidden = !r;
  if (r) ext.textContent = [1000, 2000].map((h) => r[h].med == null ? `${altLabel(h)}: ${t('noData')}`
    : `${altLabel(h)}: ${round(r[h].med)} km/h ${dirText(r[h].dir)}`).join(' · ') + t('aboveGround');
}

function hoursOfDay(d) { return state.data.hours.map((g, i) => [g, i]).filter(([g]) => g.day === d); }

function renderHours() {
  const box = $('hours'), nk = nowKey();
  const list = hoursOfDay(state.day);
  const g0 = list[0]?.[0];
  $('day-title').textContent = g0 ? (g0.day === nk.slice(0, 10) ? t('today') : `${dayName(g0.day)} ${g0.day.slice(8, 10)}.${g0.day.slice(5, 7)}`) : '';
  box.innerHTML = list.map(([g, i]) => {
    const w = verdict(g);
    return `<button class="hour${i === state.hourIndex ? ' selected' : ''}${g.t.slice(0, 13) === nk ? ' now' : ''}" data-index="${i}" role="option" aria-selected="${i === state.hourIndex}">
      <div class="h-hour">${String(g.h).padStart(2, '0')}</div><div class="h-icon">${weatherIcon(g.code, g.h)}</div>
      ${arrowSvg(g.dir[10])}
      <div class="h-wind ${w.v}-bg">${round(w.peak)}</div><div class="h-gust">${round(g.gust)}</div></button>`;
  }).join('');
  const sel = box.querySelector('.selected');
  if (sel) box.scrollLeft = Math.max(0, sel.offsetLeft - box.clientWidth / 2 + sel.clientWidth / 2);
}

function renderProfile() {
  const list = hoursOfDay(state.day), u = state.settings;
  let html = '<tr><th class="alt"></th>' + list.map(([g, i]) => `<th class="${i === state.hourIndex ? 'sel' : ''}">${String(g.h).padStart(2, '0')}</th>`).join('') + '</tr>';
  if (u.extended && state.extended) {
    [...EXTENDED_ALTITUDES].reverse().forEach((h, k) => {
      html += `<tr class="ext${k === EXTENDED_ALTITUDES.length - 1 ? ' ext-last' : ''}"><th class="alt">${altLabel(h)}</th>` + list.map(([g, i]) => {
        const w = state.extended[g.t]?.[h];
        const arrow = w?.dir == null ? '' : `<svg viewBox="0 0 24 24" style="transform:rotate(${(w.dir + 180) % 360}deg)"><path d="M12 2 L18 20 L12 16 L6 20 Z" fill="currentColor"/></svg>`;
        return `<td data-index="${i}" class="${levelClass(w?.med, u.limit)}-bg${i === state.hourIndex ? ' sel' : ''}" title="${t('modelsTitle', { n: w?.models ?? 0 })}">${arrow}${round(w?.med)}</td>`;
      }).join('') + '</tr>';
    });
  }
  for (const h of [...ALTITUDES].reverse()) {
    html += `<tr><th class="alt">${h} m</th>` + list.map(([g, i]) => {
      const v = g.alt[h].med;
      return `<td data-index="${i}" class="${levelClass(v, u.limit)}-bg${h > u.alt ? ' above' : ''}${i === state.hourIndex ? ' sel' : ''}">${round(v)}</td>`;
    }).join('') + '</tr>';
  }
  html += `<tr><th class="alt">${t('gusts')}</th>` + list.map(([g, i]) =>
    `<td data-index="${i}" class="${levelClass(g.gust, u.gust)}-bg${i === state.hourIndex ? ' sel' : ''}">${round(g.gust)}</td>`).join('') + '</tr>';
  $('profile').innerHTML = html;
  const sel = $('profile').querySelector('th.sel');
  const wrap = $('profile').parentElement;
  if (sel) wrap.scrollLeft = Math.max(0, sel.offsetLeft - wrap.clientWidth / 2);
}

function renderDays() {
  const days = [...new Set(state.data.hours.map((g) => g.day))].slice(0, 7), nk = nowKey();
  $('days').innerHTML = days.map((d) => {
    const daytime = hoursOfDay(d).filter(([g]) => g.h >= 6 && g.h <= 21);
    const ww = daytime.map(([g]) => [g, verdict(g)]);
    let best = null, cur = null;
    for (const [g, w] of ww) {
      if (w.v === 'fly') { cur = cur ? { ...cur, to: g.h } : { from: g.h, to: g.h }; if (!best || cur.to - cur.from > best.to - best.from) best = cur; }
      else cur = null;
    }
    const maxW = Math.max(...ww.map(([, w]) => w.peak ?? 0)), maxG = Math.max(...ww.map(([g]) => g.gust ?? 0));
    const slot = best ? t('windowFly', { a: best.from, b: best.to + 1 }) : ww.some(([, w]) => w.v === 'caution') ? t('windowCaution') : t('windowNone');
    const dir = meanDirection(daytime.map(([g]) => g.alt[10].med), daytime.map(([g]) => g.dir[10]));
    return `<button class="day${d === state.day ? ' selected-day' : ''}" data-day="${d}">
      <div><div class="d-name">${d === nk.slice(0, 10) ? t('todayLower') : dayName(d)}</div><div class="d-date">${d.slice(8, 10)}.${d.slice(5, 7)}</div></div>
      <div><div class="d-bar" title="6:00–22:00">${ww.map(([, w]) => `<i class="${w.v}"></i>`).join('')}</div>
        <div class="d-window">${slot} · ${dirShort(dir)}</div></div>
      <div class="d-max"><b>${round(maxW)}</b> km/h<small>${t('gustsShort', { v: round(maxG) })}</small></div></button>`;
  }).join('');
}

// ---------------------------------------------------------------- map (Leaflet loaded on demand)
const GRID_STEP_LAT = 0.03, GRID_STEP_LON = 0.045, GRID_RADIUS = 4;   // 9x9 grid, about 3 km, +-13 km
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  return new Promise((ok, err) => {
    const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'vendor/leaflet.css'; document.head.append(c);
    const s = document.createElement('script'); s.src = 'vendor/leaflet.js'; s.onload = ok; s.onerror = err; document.head.append(s);
  });
}
async function startMap() {
  const el = $('map');
  el.innerHTML = '';
  await loadLeaflet();
  state.map = L.map(el, { zoomControl: true, attributionControl: true }).setView([state.place.lat, state.place.lon], 11);
  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 16, subdomains: 'abc',
    attribution: '© OpenStreetMap, SRTM, © OpenTopoMap (CC-BY-SA)' }).addTo(state.map);
  state.mapLayer = L.layerGroup().addTo(state.map);
  renderMap();
}
function grid() {
  const la0 = Math.round(state.place.lat / GRID_STEP_LAT) * GRID_STEP_LAT, lo0 = Math.round(state.place.lon / GRID_STEP_LON) * GRID_STEP_LON;
  const rows = [];
  for (let i = -GRID_RADIUS; i <= GRID_RADIUS; i++) {
    const row = [];
    for (let j = -GRID_RADIUS; j <= GRID_RADIUS; j++) row.push([+(la0 + i * GRID_STEP_LAT).toFixed(2), +(lo0 + j * GRID_STEP_LON).toFixed(3)]);
    rows.push(row);
  }
  return rows;
}
async function fetchMapData(day) {
  const pts = grid(), key = `${day}|${pts[0][0].join()}`;
  if (state.mapData[key]) return state.mapData[key];
  const batches = [pts.slice(0, 3), pts.slice(3, 6), pts.slice(6, 9)].map((rows) => rows.flat());   // 3 requests x 27 points; URL < 1024 characters (a WAF on my server rejected longer ones)
  const hourly = [10, 80, 120].flatMap((h) => [`wind_speed_${h}m`, `wind_direction_${h}m`]).join(',');
  const results = await Promise.all(batches.map(async (b) => {
    const p = new URLSearchParams({ latitude: b.map((x) => x[0]).join(','), longitude: b.map((x) => x[1]).join(','), hourly,
      wind_speed_unit: 'kmh', timezone: 'auto', models: 'best_match', start_date: day, end_date: day });
    const r = await fetch(`${API_URL}?${p}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return Array.isArray(j) ? j : [j];
  }));
  return (state.mapData[key] = results.flat());
}
async function renderMap() {
  if (!state.map || !state.data) return;
  const g = state.data.hours[state.hourIndex];
  let points;
  try { points = await fetchMapData(g.day); } catch (e) { showStatus(t('mapFailed', { e: e.message })); return; }
  if (state.data.hours[state.hourIndex] !== g) return;     // another hour was selected in the meantime
  state.mapLayer.clearLayers();
  const h = state.mapAlt, limit = state.settings.limit;
  const color = (v) => ({ fly: '#3fb950', caution: '#e3b341', stop: '#f85149' })[levelClass(v, limit)] || '#888';
  for (const p of points) {
    const H = p.hourly, i = H.time.findIndex((tm) => +tm.slice(11, 13) === g.h);
    const s = H[`wind_speed_${h}m`]?.[i], d = H[`wind_direction_${h}m`]?.[i];
    if (s == null || d == null) continue;
    L.marker([p.latitude, p.longitude], { interactive: false, icon: L.divIcon({ className: '', iconSize: [30, 34], iconAnchor: [15, 17],
      html: `<div class="map-arrow"><svg viewBox="0 0 24 24" style="transform:rotate(${(d + 180) % 360}deg)"><path d="M12 2 L18 20 L12 16 L6 20 Z" fill="${color(s)}" stroke="#000" stroke-width=".8"/></svg><span>${Math.round(s)}</span></div>` }) })
      .addTo(state.mapLayer);
  }
  L.circleMarker([state.place.lat, state.place.lon], { radius: 7, color: '#fff', weight: 2, fillColor: '#4493f8', fillOpacity: 1 })
    .addTo(state.mapLayer);
}

// ---------------------------------------------------------------- place
function setPlace(m) {
  state.place = m; storeSet('fpvwind.place', m);
  $('place-name').textContent = m.name || `${m.lat.toFixed(2)}, ${m.lon.toFixed(2)}`;
  state.mapData = {}; state.extended = null; state.extendedKey = null;
  if (state.map) state.map.setView([m.lat, m.lon], 11);
  fetchForecast();
}
async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=${LANG}&lat=${lat}&lon=${lon}`);
    const j = await r.json(), a = j.address || {};
    return a.village || a.town || a.city || a.hamlet || a.suburb || a.municipality || j.name || null;
  } catch { return null; }
}
function locate() {
  if (!navigator.geolocation) { showStatus(t('noGeolocation')); return; }
  showStatus(t('locating'));
  navigator.geolocation.getCurrentPosition(async (p) => {
    const lat = p.coords.latitude, lon = p.coords.longitude;
    setPlace({ lat, lon, name: t('myLocationName'), gps: true });
    const n = await reverseGeocode(lat, lon);
    if (n && state.place.lat === lat) { state.place.name = n; storeSet('fpvwind.place', state.place); $('place-name').textContent = `📍 ${n}`; }
  }, () => {
    showStatus(t('geolocationDenied'));
    if (!state.place) $('dlg-place').showModal();
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 });
}
let searchTimer = null;
function search(q) {
  clearTimeout(searchTimer);
  if (q.trim().length < 3) { $('results').innerHTML = ''; return; }
  searchTimer = setTimeout(async () => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=${LANG}&q=${encodeURIComponent(q)}`);
      const j = await r.json();
      $('results').innerHTML = j.map((x, i) => `<li><button class="pick" data-result="${i}">${escapeHtml(x.name || x.display_name.split(',')[0])}
        <small>${escapeHtml(x.display_name)}</small></button></li>`).join('') || `<li>${t('nothingFound')}</li>`;
      $('results').onclick = (e) => {
        const b = e.target.closest('[data-result]'); if (!b) return;
        const x = j[+b.dataset.result];
        setPlace({ lat: +x.lat, lon: +x.lon, name: x.name || x.display_name.split(',')[0] });
        $('dlg-place').close();
      };
    } catch { $('results').innerHTML = `<li>${t('searchUnavailable')}</li>`; }
  }, 450);
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function renderFavorites() {
  $('favorites').innerHTML = state.favorites.map((m, i) => `<li><button class="pick" data-favorite="${i}">${escapeHtml(m.name)}
    <small>${m.lat.toFixed(3)}, ${m.lon.toFixed(3)}</small></button><button class="remove" data-remove="${i}" aria-label="${t('remove')}">✕</button></li>`).join('')
    || `<li class="fineprint">${t('noFavorites')}</li>`;
}

// ---------------------------------------------------------------- settings
function renderSettings() {
  const u = state.settings;
  $('s-limit').value = u.limit; $('s-limit-value').textContent = `${u.limit} km/h`;
  $('s-gust').value = u.gust; $('s-gust-value').textContent = `${u.gust} km/h`;
  $('s-alt').value = u.alt; $('s-alt-value').textContent = `${u.alt} m`;
  document.querySelectorAll('#presets button').forEach((b) => b.classList.toggle('active', b.dataset.preset === u.preset));
}
function changeSettings(change) { Object.assign(state.settings, change); storeSet('fpvwind.settings', state.settings); renderSettings(); render(); }
function renderExtendedButton() { $('extended-btn').setAttribute('aria-pressed', String(!!state.settings.extended)); }

// ---------------------------------------------------------------- events
function selectHour(i) { state.hourIndex = i; state.day = state.data.hours[i].day; render(); }
$('hours').addEventListener('click', (e) => { const b = e.target.closest('[data-index]'); if (b) selectHour(+b.dataset.index); });
$('profile').addEventListener('click', (e) => { const c = e.target.closest('[data-index]'); if (c) selectHour(+c.dataset.index); });
$('days').addEventListener('click', (e) => {
  const b = e.target.closest('[data-day]'); if (!b) return;
  const d = b.dataset.day, nk = nowKey(), list = hoursOfDay(d);
  const target = d === nk.slice(0, 10) ? list.find(([g]) => g.t.slice(0, 13) === nk) : null;
  const good = list.find(([g]) => g.h >= 8 && g.h <= 18 && verdict(g).v === 'fly');
  selectHour((target || good || list.find(([g]) => g.h === 12) || list[0])[1]);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
$('extended-btn').addEventListener('click', () => {
  changeSettings({ extended: !state.settings.extended });
  if (state.settings.extended) fetchExtended();
});
$('map-start').addEventListener('click', () => startMap().catch(() => showStatus(t('mapLoadFailed'))));
$('map-height').addEventListener('click', (e) => {
  const b = e.target.closest('[data-height]'); if (!b) return;
  state.mapAlt = +b.dataset.height;
  document.querySelectorAll('#map-height button').forEach((x) => x.classList.toggle('active', x === b));
  renderMap();
});
$('place').addEventListener('click', () => { renderFavorites(); $('dlg-place').showModal(); });
$('gps').addEventListener('click', () => { $('dlg-place').close(); locate(); });
$('search').addEventListener('input', (e) => search(e.target.value));
$('save-place').addEventListener('click', () => {
  const m = state.place; if (!m) return;
  if (!state.favorites.some((u) => Math.abs(u.lat - m.lat) < 0.005 && Math.abs(u.lon - m.lon) < 0.005)) {
    state.favorites.push({ lat: m.lat, lon: m.lon, name: (m.name || t('placeDefault')).replace(/^📍 /, '') }); storeSet('fpvwind.favorites', state.favorites);
  }
  renderFavorites();
});
$('favorites').addEventListener('click', (e) => {
  const x = e.target.closest('[data-remove]'), u = e.target.closest('[data-favorite]');
  if (x) { state.favorites.splice(+x.dataset.remove, 1); storeSet('fpvwind.favorites', state.favorites); renderFavorites(); }
  else if (u) { setPlace({ ...state.favorites[+u.dataset.favorite] }); $('dlg-place').close(); }
});
$('settings-btn').addEventListener('click', () => { renderSettings(); $('dlg-settings').showModal(); });
$('presets').addEventListener('click', (e) => {
  const b = e.target.closest('[data-preset]'); if (!b) return;
  const [limit, gust, alt] = PRESETS[b.dataset.preset];
  changeSettings({ preset: b.dataset.preset, limit, gust, alt });
});
$('s-limit').addEventListener('input', (e) => changeSettings({ limit: +e.target.value, preset: null }));
$('s-gust').addEventListener('input', (e) => changeSettings({ gust: +e.target.value, preset: null }));
$('s-alt').addEventListener('input', (e) => changeSettings({ alt: +e.target.value, preset: null }));
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - state.fetchedAt > REFRESH_MS) fetchForecast(); });

// ---------------------------------------------------------------- start
// Link with a place: ?lat=52.23&lon=21.01&n=Name (no GPS needed; e.g. to share a flying spot)
const qs = new URLSearchParams(location.search);
if (qs.has('lat') && qs.has('lon') && Number.isFinite(+qs.get('lat')) && Number.isFinite(+qs.get('lon'))) {
  state.place = { lat: +qs.get('lat'), lon: +qs.get('lon'), name: (qs.get('n') || '').slice(0, 60) || null };
  storeSet('fpvwind.place', state.place);
  history.replaceState(null, '', location.pathname);
}
if (state.place) { $('place-name').textContent = state.place.gps ? `📍 ${state.place.name}` : (state.place.name || `${state.place.lat.toFixed(2)}, ${state.place.lon.toFixed(2)}`); fetchForecast(); }
if (!state.place || state.place.gps) locate();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});   // scope = directory of sw.js
