// Persistence layer. Primary: SQLite via better-sqlite3 (spec section 3.5).
// Fallback: a plain JSON file in userData, used if the native module is
// unavailable on this machine. Both paths expose the same load()/save() API.
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { DEFAULTS, SCHEMA } = require('./constants');

let Database = null;
try {
  Database = require('better-sqlite3');
} catch (e) {
  Database = null;
}

let db = null;
let storeMode = 'json';
let jsonPath = '';

function num(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function safeParse(s) {
  try { return s ? JSON.parse(s) : null; } catch (e) { return null; }
}

function init() {
  const dir = app.getPath('userData');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* ignore */ }
  jsonPath = path.join(dir, 'pengu-save.json');

  if (Database) {
    try {
      db = new Database(path.join(dir, 'pengu.db'));
      db.pragma('journal_mode = WAL');
      db.exec(SCHEMA);
      const row = db.prepare('SELECT id FROM pets WHERE id = 1').get();
      if (!row) {
        db.prepare('INSERT INTO pets (id, name, last_active) VALUES (1, ?, ?)')
          .run(DEFAULTS.name, new Date().toISOString());
        db.prepare(
          'INSERT INTO pet_state (pet_id, hunger, energy, mood, cleanliness, position_x, position_y) VALUES (1, ?, ?, ?, ?, ?, ?)'
        ).run(100 - DEFAULTS.fullness, DEFAULTS.energy, DEFAULTS.mood, DEFAULTS.cleanliness, null, null);
      }
      storeMode = 'sqlite';
      return storeMode;
    } catch (e) {
      console.warn('[db] SQLite unavailable (' + e.message + '); using JSON store.');
      db = null;
    }
  }
  storeMode = 'json';
  return storeMode;
}

function loadSqlite() {
  const p = db.prepare('SELECT name FROM pets WHERE id = 1').get() || {};
  const s = db.prepare(
    'SELECT hunger, energy, mood, cleanliness, position_x, position_y FROM pet_state WHERE pet_id = 1'
  ).get() || {};
  const prefs = {};
  for (const r of db.prepare('SELECT key, value FROM preferences').all()) prefs[r.key] = r.value;
  // fullness/happiness live in preferences; for pre-migration DBs derive
  // fullness from the legacy inverted `hunger` column (0=full → fullness=100).
  const fullness = prefs.fullness != null
    ? num(prefs.fullness, DEFAULTS.fullness)
    : (s.hunger == null ? DEFAULTS.fullness : Math.max(0, Math.min(100, 100 - num(s.hunger, 30))));
  return {
    name: p.name != null ? p.name : DEFAULTS.name,
    fullness,
    happiness: num(prefs.happiness, DEFAULTS.happiness),
    health: num(prefs.health, DEFAULTS.health),
    education: num(prefs.education, DEFAULTS.education),
    study: num(prefs.study, DEFAULTS.study),
    sick: prefs.sick ? prefs.sick : null,
    dead: prefs.dead === '1',
    gender: prefs.gender ? prefs.gender : null,
    playTime: num(prefs.playTime, DEFAULTS.playTime),
    money: num(prefs.money, DEFAULTS.money),
    energy: num(s.energy, DEFAULTS.energy),
    cleanliness: num(s.cleanliness, DEFAULTS.cleanliness),
    mood: s.mood || DEFAULTS.mood,
    x: s.position_x == null ? null : num(s.position_x, null),
    y: s.position_y == null ? null : num(s.position_y, null),
    volume: num(prefs.volume, DEFAULTS.volume),
    speed: num(prefs.speed, DEFAULTS.speed),
    opacity: num(prefs.opacity, DEFAULTS.opacity),
    personality: safeParse(prefs.personality),
    ts: prefs.ts ? num(prefs.ts, null) : null,
  };
}

function load() {
  if (storeMode === 'sqlite' && db) {
    try { return loadSqlite(); } catch (e) { /* fall through */ }
  }
  try {
    if (fs.existsSync(jsonPath)) return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) { /* ignore */ }
  return null;
}

function saveSqlite(d) {
  db.prepare('UPDATE pets SET name = ?, last_active = ? WHERE id = 1')
    .run(d.name != null ? d.name : DEFAULTS.name, new Date().toISOString());
  const fullness = Math.round(num(d.fullness, DEFAULTS.fullness));
  const happiness = Math.round(num(d.happiness, DEFAULTS.happiness));
  db.prepare(
    'UPDATE pet_state SET hunger = ?, energy = ?, mood = ?, cleanliness = ?, position_x = ?, position_y = ?, updated_at = CURRENT_TIMESTAMP WHERE pet_id = 1'
  ).run(
    100 - fullness, // legacy `hunger` column kept as the inverse of fullness
    Math.round(num(d.energy, DEFAULTS.energy)),
    d.mood || DEFAULTS.mood,
    Math.round(num(d.cleanliness, DEFAULTS.cleanliness)),
    d.x == null ? null : Math.round(d.x),
    d.y == null ? null : Math.round(d.y)
  );
  const up = db.prepare(
    'INSERT INTO preferences (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ' +
    'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP'
  );
  up.run('volume', String(num(d.volume, DEFAULTS.volume)));
  up.run('speed', String(num(d.speed, DEFAULTS.speed)));
  up.run('opacity', String(num(d.opacity, DEFAULTS.opacity)));
  up.run('personality', JSON.stringify(d.personality || null));
  up.run('fullness', String(fullness));
  up.run('happiness', String(happiness));
  up.run('health', String(Math.round(num(d.health, DEFAULTS.health))));
  up.run('education', String(Math.round(num(d.education, DEFAULTS.education))));
  up.run('study', String(Math.round(num(d.study, DEFAULTS.study))));
  up.run('sick', d.sick ? String(d.sick) : '');
  up.run('dead', d.dead ? '1' : '');
  up.run('gender', d.gender ? String(d.gender) : '');
  up.run('playTime', String(Math.round(num(d.playTime, DEFAULTS.playTime))));
  up.run('money', String(Math.round(num(d.money, DEFAULTS.money))));
  up.run('ts', String(d.ts || Date.now()));
}

function save(d) {
  if (!d) return false;
  if (storeMode === 'sqlite' && db) {
    try { saveSqlite(d); return true; } catch (e) { /* fall through */ }
  }
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(Object.assign({ ts: Date.now() }, d)));
    return true;
  } catch (e) {
    return false;
  }
}

function close() {
  if (db) {
    try { db.close(); } catch (e) { /* ignore */ }
    db = null;
  }
}

function mode() { return storeMode; }

module.exports = { init, load, save, close, mode };
