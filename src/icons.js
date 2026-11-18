// 24x24 stroke icons (original line drawings). Each value is the inner SVG markup.
export const ICONS = {
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.9-3.3 3.2-4.9 6-4.9s5.1 1.6 6 4.9"/><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.9c1.8.6 3 2 3.5 4.6"/>',
  server: '<rect x="4" y="3.5" width="16" height="7" rx="1.6"/><rect x="4" y="13.5" width="16" height="7" rx="1.6"/><path d="M8 7h.01M8 17h.01M12 7h4M12 17h4"/>',
  db: '<ellipse cx="12" cy="5.5" rx="7" ry="2.6"/><path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',
  box: '<path d="M12 3 20 7.5v9L12 21 4 16.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  class: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h16M4 15h16"/>',
  iface: '<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 2.5"/><path d="M9 12h6"/>',
  code: '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>',
  test: '<path d="M9 3.5h6M10 3.5v5.2L5 18a2 2 0 0 0 1.8 2.8h10.4A2 2 0 0 0 19 18l-5-9.3V3.5"/><path d="M7.4 14.5h9.2"/>',
  check: '<path d="m5 12.5 4.2 4.2L19 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"/>',
  queue: '<rect x="3" y="7" width="4.5" height="10" rx="1"/><rect x="9.75" y="7" width="4.5" height="10" rx="1"/><rect x="16.5" y="7" width="4.5" height="10" rx="1"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5"/>',
  unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.8M12 14.5v2.5"/>',
  thread: '<path d="M4 6c4 0 4 4 8 4s4-4 8-4M4 14c4 0 4 4 8 4s4-4 8-4"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9a4.2 4.2 0 0 1-.5 9.5z"/>',
  git: '<circle cx="6.5" cy="5.5" r="2.2"/><circle cx="6.5" cy="18.5" r="2.2"/><circle cx="17.5" cy="9" r="2.2"/><path d="M6.5 7.7v8.6M17.5 11.2c0 3.5-4.5 3.4-9.4 5.6"/>',
  pkg: '<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M8 5.8 16.5 10.3v4"/>',
  flag: '<path d="M5 21V4M5 4.5h11.5l-2 4 2 4H5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  card: '<rect x="3" y="6" width="18" height="12.5" rx="2"/><path d="M3 10h18M7 15h3"/>',
  file: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12.5h6M9 16h6"/>',
  layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  plug: '<path d="M9 3.5v4.5M15 3.5v4.5M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0zM12 17v3.5"/>',
  shield: '<path d="M12 3 19 6v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6z"/>',
  rocket: '<path d="M12.5 15.5 8.5 11.5C10 6.5 14 3.5 20.5 3.5c0 6.5-3 10.5-8 12z"/><path d="M8.5 11.5 5 11l2.5-3.5h4M12.5 15.5 13 19l3.5-2.5v-4M6 18c-1 .5-2 2.5-2 2.5s2-1 2.5-2"/>',
  arrows: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  wrench: '<path d="M14.5 4a5 5 0 0 0 5.4 6.6L11 19.5a2.1 2.1 0 0 1-3-3l8.9-8.9A5 5 0 0 1 14.5 4z"/>',
  chart: '<path d="M4 20h16M7 16v-4M11.5 16V8M16 16v-6.5"/>',
  sparkle: '<path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>',
  printer: '<path d="M7 9V3.5h10V9M7 17H4.5V10a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v7H17"/><rect x="7" y="14" width="10" height="6.5"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  // UI icons
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  replay: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4v5h5"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  play: '<path d="M7 5v14l12-7z"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  shrink: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  home: '<path d="M4 11 12 4l8 7M6.5 9.5V20h11V9.5"/>',
  bulb: '<path d="M9 17.5h6M10 21h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.7-1 1.5-1 3h-5c0-1.5-.2-2.3-1-3z"/>',
  warn: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17.2h.01"/>',
};

export const icon = (name, size = 18, cls = '') =>
  `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.box}</svg>`;

// Static SVG used by the lesson player (play/pause paths, a tick, the mini pyramid mark).
export const PLAY = '<path d="M7 4.5v15l13-7.5z"/>';
export const PAUSE = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
export const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
export const MINI_PYRAMID = '<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><rect x="2" y="22" width="28" height="7" rx="2" class="pm-1"/><rect x="6" y="14" width="20" height="7" rx="2" class="pm-2"/><rect x="10" y="6" width="12" height="7" rx="2" class="pm-3"/></svg>';
