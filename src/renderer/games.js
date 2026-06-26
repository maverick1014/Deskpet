// 玩耍 mini-games — in-window, penguin-driven, 100% hand-drawn PIXEL ART.
//
// HARD RULES (see CLAUDE.md / TODO.md §2): no emoji, no separate modal board.
// Every game is acted out by the REAL penguin in its own window. Pieces are
// pixel sprites drawn with drawSprite() onto a dedicated game canvas overlay
// (sibling to the focus-scene canvas). Clicks hit-test against piece rects.
//
// The engine is a plain controller the App owns: App gives it a 2d context, the
// canvas geometry, and a small host API (reward / setAction / setFace / speak /
// facing). The App render loop calls update(t,dt) + the engine paints each frame.
// stop() clears every piece + timer, mirroring stopScene().
//
//   Games: bubble (吹泡泡·reference) · fish (接小鱼) · rps (猜拳)
//          ball (接球) · simon (跟我拍)

// ---- pixel palette shared by all game sprites (letter -> colour) -----------
// Kept close to the pet's own pal(): navy outline 'K', whites, beak orange.
export const GAME_PAL = {
  '.': null,
  K: '#222a55',          // navy outline / ink
  W: '#ffffff', l: '#dbe7ff', // white / pale-blue highlight
  o: '#ff9d3d', y: '#ffd23d', // beak orange / wand gold
  b: '#4cc3ff', B: '#2f8fd6', // bubble light / deep
  f: '#5bc8ff', F: '#2f7bd6', // fish body / fin
  p: '#ff7eb3', P: '#e85c93', // pink hand / shade
  g: '#3fae4e', G: '#2f8a3b', // green ball / shade
  r: '#ff5a5f', c: '#36c98f', // accent red / green (simon cues)
  s: '#9aa9d0',          // soft grey shadow
};

// ---- sprite grids (authored as letter rows, drawn at px cell size) ---------
export const SPR = {
  // A pixel bubble wand: a gold ring on a short stick (held by the pet's wing).
  wand: [
    '.yyy.',
    'y...y',
    'y...y',
    '.yyy.',
    '..K..',
    '..K..',
    '..K..',
  ],
  // Three bubble sizes (small / medium / big) — pixel circles with a highlight.
  bubbleS: [
    '.bb.',
    'bllb',
    'bbbb',
    '.bb.',
  ],
  bubbleM: [
    '.bbbb.',
    'bllllb',
    'blllBb',
    'bbbbBb',
    'bBBBBb',
    '.bbbb.',
  ],
  bubbleL: [
    '..bbbb..',
    '.bllllb.',
    'bllllllb',
    'blllBBBb',
    'blBBBBBb',
    'bBBBBBBb',
    '.bBBBBb.',
    '..bbbb..',
  ],
  // A little fish (tossed up in 接小鱼) — body + tail fin + eye.
  fish: [
    '..ffff..',
    '.fffffF.',
    'fKffffFF',
    'fffffffF',
    '.fffffF.',
    '..ffff..',
  ],
  // A bouncing ball (接球) — pixel sphere with shade + highlight.
  ball: [
    '.gggg.',
    'glllgg',
    'gllggG',
    'ggggGG',
    'gGGGGG',
    '.GGGG.',
  ],
  // 猜拳 hand shapes (drawn at the pet's feet so you can pick one).
  rock: [
    '.KKKK.',
    'KppppK',
    'KppppK',
    'KppppK',
    '.KKKK.',
  ],
  paper: [
    'K.K.K.',
    'KpKpKp',
    'KppppK',
    'KppppK',
    '.KKKK.',
  ],
  scissors: [
    'Kp..pK',
    'Kp..pK',
    '.KppK.',
    '.KppK.',
    '..KK..',
  ],
};

// Game id -> short Chinese label (used by the compact picker in App).
export const GAME_LIST = [
  { key: 'bubble', name: '吹泡泡' },
  { key: 'fish', name: '接小鱼' },
  { key: 'rps', name: '猜拳' },
  { key: 'ball', name: '接球' },
  { key: 'simon', name: '跟我拍' },
];

const RPS_KINDS = ['rock', 'paper', 'scissors'];
const RPS_BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

export class GameEngine {
  // host: { reward(happy,coins), setAction(name,dur), setFace(name,ms),
  //         speak(text,ms), facing()->(-1|1), facingTo(dir), onScore(game,score) }
  // geom: { W, H, OX, cx, gnd }  (canvas px; cx = penguin centre column, gnd = baseline)
  constructor(ctx, geom, host) {
    this.ctx = ctx;
    this.geom = geom;
    this.host = host;
    this.px = 4;            // sprite cell size on the game canvas
    this.game = null;       // active game id
    this.pieces = [];       // clickable sprites: { id,sprite,x,y,px,... }
    this.timers = [];
    this.score = 0;
    this.state = {};        // per-game scratch
    this._idc = 0;
  }

  // ---- lifecycle ----------------------------------------------------------
  start(game) {
    this.stop();
    this.game = game;
    this.score = 0;
    this.pieces = [];
    this.state = { t0: performance.now() };
    if (game === 'bubble') this._startBubble();
    else if (game === 'fish') this._startFish();
    else if (game === 'rps') this._startRps();
    else if (game === 'ball') this._startBall();
    else if (game === 'simon') this._startSimon();
  }

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.pieces = [];
    this.state = {};
    this.game = null;
    if (this.ctx) this.ctx.clearRect(0, 0, this.geom.W, this.geom.H);
  }

  later(fn, ms) { const id = setTimeout(fn, ms); this.timers.push(id); return id; }

  // A pop/catch milestone: every `step` marks -> happiness + happy reaction.
  bump(step, happy, coins) {
    this.score++;
    if (this.host.onScore) this.host.onScore(this.game, this.score);
    if (this.score % step === 0) {
      this.host.reward(happy, coins || 0);
      this.host.setFace && this.host.setFace('happy', 1100);
      this.host.setAction && this.host.setAction('play', 700);
    }
  }

  // ---- click hit-testing (called by App on a pointerdown over the canvas) --
  // gx,gy are canvas-pixel coords. Returns true if a piece was hit.
  click(gx, gy) {
    if (!this.game) return false;
    if (this.game === 'rps') return this._clickRps(gx, gy);
    if (this.game === 'ball') return this._clickBall(gx, gy);
    if (this.game === 'simon') return this._clickSimon(gx, gy);
    // bubble / fish: topmost piece whose bounding box contains the point.
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      const w = SPR[p.sprite][0].length * p.px, h = SPR[p.sprite].length * p.px;
      if (gx >= p.x && gx <= p.x + w && gy >= p.y && gy <= p.y + h) {
        if (this.game === 'bubble') this._popBubble(i, p);
        else if (this.game === 'fish') this._catchFish(i, p);
        return true;
      }
    }
    return false;
  }

  // ---- per-frame update + paint -------------------------------------------
  update(t, dt) {
    if (!this.game || !this.ctx) return;
    const f = Math.min(2.4, dt / 16.7); // frame-normalised step (60fps = 1)
    this.ctx.clearRect(0, 0, this.geom.W, this.geom.H);
    if (this.game === 'bubble') this._stepBubble(t, f);
    else if (this.game === 'fish') this._stepFish(t, f);
    else if (this.game === 'rps') this._stepRps(t, f);
    else if (this.game === 'ball') this._stepBall(t, f);
    else if (this.game === 'simon') this._stepSimon(t, f);
  }

  sprite(name, x, y, px, flip) {
    const grid = SPR[name];
    const ctx = this.ctx, P = px || this.px, w = grid[0].length;
    for (let yy = 0; yy < grid.length; yy++) {
      const row = grid[yy];
      for (let xx = 0; xx < row.length; xx++) {
        const c = GAME_PAL[row[xx]];
        if (!c) continue;
        ctx.fillStyle = c;
        const dx = flip ? (w - 1 - xx) : xx;
        ctx.fillRect(Math.round(x) + dx * P, Math.round(y) + yy * P, P, P);
      }
    }
  }

  // ========================================================================
  // 吹泡泡 (bubble) — REFERENCE GAME. The pet pulls out a pixel wand and blows
  // random-size pixel bubbles that drift up; click a bubble to pop it (+1);
  // every 10 pops -> +happiness & a happy reaction.
  // ========================================================================
  _startBubble() {
    this.state.spawn = 0;
    this.host.setAction && this.host.setAction('play', 600);
    this.host.speak && this.host.speak('呼——吹泡泡！', 1500);
  }
  _stepBubble(t, f) {
    const st = this.state, g = this.geom;
    // The pet holds the wand near its beak on the facing side; bubbles bud off it.
    const flip = this.host.facing() < 0;
    const wandX = g.cx + (flip ? -28 : 14);
    const wandY = g.gnd - 56;
    this.sprite('wand', wandX, wandY, this.px, flip);

    // Spawn a new bubble at the wand ring, random size + gentle horizontal drift.
    st.spawn -= f;
    if (st.spawn <= 0 && this.pieces.length < 9) {
      const sizes = ['bubbleS', 'bubbleM', 'bubbleL'];
      const sprite = sizes[Math.floor(Math.random() * sizes.length)];
      const px = sprite === 'bubbleL' ? 4 : (sprite === 'bubbleM' ? 4 : 3);
      this.pieces.push({
        id: this._idc++, sprite, px,
        x: wandX + 2, y: wandY - 4,
        vx: (Math.random() * 2 - 1) * 0.5 + (flip ? -0.4 : 0.4),
        vy: -(0.7 + Math.random() * 0.9),
        ph: Math.random() * 6.28,
      });
      st.spawn = 22 + Math.random() * 26;
    }
    // Float bubbles up with a wobble; drop ones that drift off the top/sides.
    for (const b of this.pieces) {
      b.x += (b.vx + Math.sin(t / 360 + b.ph) * 0.4) * f;
      b.y += b.vy * f;
      this.sprite(b.sprite, b.x, b.y, b.px);
    }
    this.pieces = this.pieces.filter((b) => b.y > -28 && b.x > -28 && b.x < g.W + 28);
  }
  _popBubble(i, p) {
    this.pieces.splice(i, 1);
    this.bump(10, 14, 1);            // every 10 pops -> +14 happy, +1 coin
    this.host.setFace && this.host.setFace('happy', 360);
  }

  // ========================================================================
  // 接小鱼 (fish) — pixel fish are tossed up in front of the pet; click a fish
  // to make the pet peck & catch it (+1). Every 8 caught -> +happiness.
  // ========================================================================
  _startFish() {
    this.state.spawn = 10;
    this.host.speak && this.host.speak('小鱼飞起来啦！', 1500);
  }
  _stepFish(t, f) {
    const st = this.state, g = this.geom;
    st.spawn -= f;
    if (st.spawn <= 0 && this.pieces.length < 4) {
      // Toss a fish up in a parabola from near the pet, falling back down.
      const fromLeft = Math.random() < 0.5;
      const x = g.cx + (fromLeft ? -38 : 30);
      this.pieces.push({
        id: this._idc++, sprite: 'fish', px: 4,
        x, y: g.gnd - 8,
        vx: (fromLeft ? 1 : -1) * (0.5 + Math.random() * 0.5),
        vy: -(3.4 + Math.random() * 1.1),
        flip: !fromLeft,
      });
      st.spawn = 36 + Math.random() * 34;
    }
    for (const fi of this.pieces) {
      fi.vy += 0.09 * f;            // gravity
      fi.x += fi.vx * f;
      fi.y += fi.vy * f;
      this.sprite('fish', fi.x, fi.y, fi.px, fi.flip);
    }
    // Fish that fall back below the ground are missed (just removed).
    this.pieces = this.pieces.filter((fi) => fi.y < g.gnd + 30);
  }
  _catchFish(i, p) {
    this.pieces.splice(i, 1);
    // The pet leans/pecks toward the catch and gulps.
    this.host.facingTo && this.host.facingTo(p.x < this.geom.cx ? -1 : 1);
    this.host.setAction && this.host.setAction('eat', 420);
    this.bump(8, 14, 1);
  }

  // ========================================================================
  // 猜拳 (rps) — three pixel hand shapes sit at the pet's feet. Click one; the
  // pet throws a pixel shape with its wing. Win -> happy + coins, draw -> small.
  // ========================================================================
  _startRps() {
    this.state.phase = 'pick';     // pick -> reveal
    this.state.pet = null; this.state.you = null; this.state.res = null;
    this.host.speak && this.host.speak('石头剪刀布~', 1500);
  }
  _handRects() {
    // Three hands laid out below the pet on the ground line.
    const g = this.geom, P = 5;
    const w = SPR.rock[0].length * P, gap = 14;
    const total = w * 3 + gap * 2;
    const x0 = g.cx - total / 2;
    return RPS_KINDS.map((k, i) => ({ k, x: x0 + i * (w + gap), y: g.gnd + 10, w, h: SPR.rock.length * P, P }));
  }
  _stepRps(t, f) {
    const st = this.state, g = this.geom;
    if (st.phase === 'pick') {
      // Three pickable hands at the feet; pulse the row a touch to invite a tap.
      const rects = this._handRects();
      for (const rc of rects) {
        const dy = Math.sin(t / 280 + rc.x) * 1.5;
        this.sprite(rc.k, rc.x, rc.y + dy, rc.P);
      }
    } else if (st.phase === 'reveal') {
      // The pet's throw appears beside it (held up by a wing); your pick mirrors.
      const flip = this.host.facing() < 0;
      this.sprite(st.pet, g.cx + (flip ? -34 : 16), g.gnd - 40, 5, flip);
      this.sprite(st.you, g.cx - 12, g.gnd + 12, 5);
    }
  }
  _clickRps(gx, gy) {
    if (this.state.phase !== 'pick') return false;
    const rects = this._handRects();
    for (const rc of rects) {
      if (gx >= rc.x && gx <= rc.x + rc.w && gy >= rc.y - 6 && gy <= rc.y + rc.h + 6) {
        const pet = RPS_KINDS[Math.floor(Math.random() * 3)];
        const result = rc.k === pet ? 'draw' : (RPS_BEATS[rc.k] === pet ? 'win' : 'lose');
        this.state.you = rc.k; this.state.pet = pet; this.state.res = result; this.state.phase = 'reveal';
        this.host.setAction && this.host.setAction('play', 600);
        if (result === 'win') { this.host.reward(10, 3); this.host.setFace && this.host.setFace('happy', 1300); this.host.speak && this.host.speak('我赢啦！', 1400); }
        else if (result === 'draw') { this.host.reward(3, 0); this.host.speak && this.host.speak('平局~', 1300); }
        else { this.host.reward(1, 0); this.host.speak && this.host.speak('再来一局！', 1300); }
        // Auto-rematch so the game keeps going in-window.
        this.later(() => { if (this.game === 'rps') this._startRps(); }, 1500);
        return true;
      }
    }
    return false;
  }

  // ========================================================================
  // 接球 (ball) — a pixel ball bounces around the window. Click when it's near
  // the pet to time a bat; a good bat -> +1 & the pet swats (play). Every 6 -> happy.
  // ========================================================================
  _startBall() {
    const g = this.geom;
    this.state.ball = { x: g.cx, y: 30, vx: 2.2, vy: 1.6 };
    this.state.near = false;
    this.host.speak && this.host.speak('接球喽！', 1400);
  }
  _stepBall(t, f) {
    const g = this.geom, bl = this.state.ball;
    if (!bl) return;
    bl.x += bl.vx * f; bl.y += bl.vy * f;
    const bw = SPR.ball[0].length * 5, bh = SPR.ball.length * 5;
    if (bl.x <= 0) { bl.x = 0; bl.vx = Math.abs(bl.vx); }
    if (bl.x + bw >= g.W) { bl.x = g.W - bw; bl.vx = -Math.abs(bl.vx); }
    if (bl.y <= 0) { bl.y = 0; bl.vy = Math.abs(bl.vy); }
    if (bl.y + bh >= g.H) { bl.y = g.H - bh; bl.vy = -Math.abs(bl.vy); }
    // Highlight the ball when it's in the pet's "hit zone" (near its body).
    const near = Math.abs(bl.x + bw / 2 - g.cx) < 44 && Math.abs(bl.y + bh / 2 - (g.gnd - 30)) < 50;
    this.state.near = near;
    if (near && Math.floor(t / 120) % 2) {
      this.ctx.fillStyle = 'rgba(255,210,61,.5)';
      this.ctx.fillRect(bl.x - 4, bl.y - 4, bw + 8, bh + 8);
    }
    this.sprite('ball', bl.x, bl.y, 5);
  }
  _clickBall() {
    const bl = this.state.ball, g = this.geom;
    if (!bl) return false;
    if (this.state.near) {
      // Good timing: bat the ball away the other direction, score.
      bl.vx = (bl.x + 15 < g.cx ? 1 : -1) * (2.4 + Math.random());
      bl.vy = -Math.abs(bl.vy) - 0.6;
      this.host.facingTo && this.host.facingTo(bl.vx < 0 ? -1 : 1);
      this.host.setAction && this.host.setAction('play', 500);
      this.bump(6, 14, 1);
    } else {
      this.host.setFace && this.host.setFace('sad', 400);
    }
    return true;
  }

  // ========================================================================
  // 跟我拍 (simon) — the pet flashes a growing gesture sequence (left / top /
  // right cue squares around it). Repeat by clicking the same cues in order.
  // Finishing a round of 5 -> +happiness.
  // ========================================================================
  _startSimon() {
    this.state.seq = [];
    this.state.ui = 0;
    this.state.phase = 'show';
    this.state.lit = -1;
    this._simonNext();
  }
  // Three cue zones around the pet: 0=left, 1=top, 2=right (the pet's gestures).
  _simonZones() {
    const g = this.geom;
    return [
      { i: 0, x: g.cx - 56, y: g.gnd - 34, w: 30, h: 30, col: 'r' },
      { i: 1, x: g.cx - 15, y: g.gnd - 78, w: 30, h: 30, col: 'c' },
      { i: 2, x: g.cx + 26, y: g.gnd - 34, w: 30, h: 30, col: 'b' },
    ];
  }
  _simonNext() {
    this.state.seq.push(Math.floor(Math.random() * 3));
    this.state.ui = 0;
    this.state.phase = 'show';
    this.host.speak && this.host.speak('看我拍~', 1200);
    const seq = this.state.seq;
    seq.forEach((z, i) => {
      this.later(() => { this.state.lit = z; this.host.setAction && this.host.setAction('play', 320); }, 560 * i + 350);
      this.later(() => { this.state.lit = -1; }, 560 * i + 690);
    });
    this.later(() => { this.state.phase = 'input'; this.state.lit = -1; }, 560 * seq.length + 450);
  }
  _stepSimon(t, f) {
    const zones = this._simonZones();
    for (const z of zones) {
      const on = this.state.lit === z.i;
      const col = GAME_PAL[z.col];
      this.ctx.fillStyle = on ? col : 'rgba(154,169,208,.30)';
      // a chunky rounded pixel cue square (in-style)
      this.ctx.fillRect(z.x + 4, z.y, z.w - 8, z.h);
      this.ctx.fillRect(z.x, z.y + 4, z.w, z.h - 8);
      if (on) {
        this.ctx.fillStyle = 'rgba(255,255,255,.55)';
        this.ctx.fillRect(z.x + 6, z.y + 6, 6, 6);
      }
    }
  }
  // Advance the player's repeat. zoneIdx is 0..2.
  tapSimon(zoneIdx) {
    if (this.game !== 'simon' || this.state.phase !== 'input') return;
    this.state.lit = zoneIdx;
    this.later(() => { if (this.state.phase === 'input') this.state.lit = -1; }, 180);
    if (this.state.seq[this.state.ui] === zoneIdx) {
      this.state.ui++;
      if (this.state.ui === this.state.seq.length) {
        if (this.state.seq.length >= 5) {
          this.host.reward(20, 4);
          this.host.setFace && this.host.setFace('happy', 1300);
          this.host.speak && this.host.speak('全记住啦！', 1500);
          this.state.seq = [];
          this.later(() => { if (this.game === 'simon') this._simonNext(); }, 900);
        } else {
          this.host.reward(4, 0);
          this.state.phase = 'show';
          this.later(() => { if (this.game === 'simon') this._simonNext(); }, 800);
        }
      }
    } else {
      // Wrong: small consolation, restart the sequence.
      this.host.setFace && this.host.setFace('sad', 500);
      this.host.speak && this.host.speak('哎呀，重来~', 1300);
      this.state.seq = [];
      this.state.phase = 'show';
      this.later(() => { if (this.game === 'simon') this._simonNext(); }, 900);
    }
  }
  _clickSimon(gx, gy) {
    if (this.state.phase !== 'input') return false;
    const zones = this._simonZones();
    for (const z of zones) {
      if (gx >= z.x - 6 && gx <= z.x + z.w + 6 && gy >= z.y - 6 && gy <= z.y + z.h + 6) {
        this.tapSimon(z.i);
        return true;
      }
    }
    return false;
  }
}
