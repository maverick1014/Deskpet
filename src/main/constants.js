// Shared defaults and the SQLite schema (per the project spec, section 3.5).

// The pet lives in a small window that physically walks across the screen
// (QQ宠物 style). It is kept intentionally small so it never blocks your work —
// only the penguin's own pixels are interactive; the rest is click-through.
// The penguin is CENTERED in the window with transparent margin on every side,
// so the window can overflow off-screen while the penguin still reaches every
// screen edge (the renderer clamps the penguin, not the window). The margin also
// gives the care panel / speech bubble room to flip above or below the pet.
const WINDOW = { width: 240, height: 400 };

const DEFAULTS = {
  fullness: 70,   // 0 = starving, 100 = full (stored; legacy `hunger` col = 100 - fullness)
  energy: 80,     // hidden stat — drained by play, restored by sleep
  cleanliness: 100,
  happiness: 80,  // 0 = miserable, 100 = delighted
  health: 100,    // hidden; sustained neglect drops it → sickness when < 50
  education: 0,   // 0 未入学 / 1 小学 / 2 中学 / 3 大学 (gates work pay)
  study: 0,       // study sessions toward the next education level
  money: 200,     // earned by working (gated by education)
  gender: null,   // 'boy' | 'girl', chosen at onboarding (null → show onboarding)
  playTime: 0,    // total online seconds; ≥ 2 days → egg hatches into a penguin
  mood: 'happy',
  name: 'Pengu',
  volume: 60,
  speed: 1,
  opacity: 100,
  x: null,
  y: null,
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS pets (
  id INTEGER PRIMARY KEY,
  name TEXT DEFAULT 'Pengu',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME
);

CREATE TABLE IF NOT EXISTS pet_state (
  pet_id INTEGER PRIMARY KEY,
  hunger INTEGER DEFAULT 30,
  energy INTEGER DEFAULT 80,
  mood TEXT DEFAULT 'happy',
  cleanliness INTEGER DEFAULT 100,
  position_x INTEGER,
  position_y INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id)
);

CREATE TABLE IF NOT EXISTS preferences (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

module.exports = { WINDOW, DEFAULTS, SCHEMA };
