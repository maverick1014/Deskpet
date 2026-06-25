import React from 'react';
import StatusBar from './components/StatusBar.jsx';
import ContextMenu from './components/ContextMenu.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import {
  loadState, saveState, getStage, moveWindow, onStageUpdate, setInteractive, quitApp,
} from './store.js';
import { genPersonality, normPersonality, traitLabel } from './personality.js';
import { DIA, pick, greetingPool } from './dialogue.js';

const BODY = '#222a55';
const BEAK = '#ff9d3d';
const SCARF = '#ff4d6d';

// School → work loop. Education 0..3; STUDY_NEED[edu] = study sessions to reach
// the next level; WORK_PAY/WORK_JOB are indexed by current education tier.
const EDU = ['未入学', '小学', '中学', '大学'];
const STUDY_NEED = [4, 8, 16];           // 未→小学, 小学→中学, 中学→大学
const WORK_PAY = [8, 16, 28, 50];        // pay per shift by education tier
const WORK_JOB = ['打零工', '清洁工', '店员', '程序员'];
const SICK_TIER = { mild: 1, medium: 2, severe: 3 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default class App extends React.Component {
  state = {
    fullness: 70, energy: 80, cleanliness: 100, happiness: 80, mood: 'happy',
    health: 100, sick: null, education: 0, study: 0,
    name: 'Pengu', volume: 60, speed: 1, opacity: 100,
    money: 200, shopCat: null,
    menu: null, settingsOpen: false, emote: null, say: null, hint: true, hover: false, hoverStat: null, loaded: false,
    entering: true, traits: '',
  };

  // Penguin box inside the (larger) window. The penguin is centered, so the
  // window has equal transparent margin all around; the renderer clamps the
  // penguin to the work area, letting the window overflow off-screen at edges.
  PEN_W = 112;
  PEN_H = 130;

  rootRef = React.createRef();
  penRef = React.createRef();
  hoverRef = React.createRef();
  spriteRef = React.createRef();
  shadowRef = React.createRef();
  canvasRef = React.createRef();
  partRef = React.createRef();

  // Stable character (Phase 1). Set synchronously so behavior works before the
  // async load resolves; load() may overwrite it with the saved personality.
  personality = genPersonality();

  // Imperative runtime fields. p.x / p.y are the WINDOW's screen position;
  // walking is achieved by moving the whole (small) window across the desktop.
  p = {
    x: 0, y: 0, facing: 1, action: 'idle', busy: false,
    blink: 2200, blinkOn: false, blinkT: 0,
    tx: 0, speed: 56, walkTimer: 7, aStart: 0, aDur: 0,
    dragging: false, ds: null, emoteUntil: 0, clickCD: 0, playfulUntil: 0,
  };

  componentDidMount() {
    this._mounted = true;
    this._lastInteract = Date.now();
    this.setupGrids();
    this.ensureCtx();
    this.paintStatic();
    this.boot();

    // Entrance: the pet hops out of Doraemon's "Anywhere Door" on launch.
    this.p.action = 'enter';
    this.p.busy = true;
    this.p.aStart = performance.now();
    this.p.aDur = 1000;
    setTimeout(() => { if (this._mounted) { this.sfx('play'); this.spawn('play'); } }, 220);
    this._enterT = setTimeout(() => {
      if (this.p.action === 'enter') { this.p.action = 'idle'; this.p.busy = false; }
      if (this._mounted) this.setState({ entering: false });
    }, 1050);

    this._last = performance.now();
    this._raf = requestAnimationFrame(this.loop);
    this._tick = setInterval(this.tick, 1000);

    this._onMove = (e) => this.onMove(e);
    this._onUp = (e) => this.onUp(e);
    this._onHover = (e) => this.onHover(e);
    this._onUnload = () => this.save();
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('mousemove', this._onHover);
    window.addEventListener('beforeunload', this._onUnload);
    this._offStage = onStageUpdate((st) => this.applyStage(st));

    this._hintTimer = setTimeout(() => { if (this._mounted) this.setState({ hint: false }); }, 7000);
    this.refreshInteractive();
  }

  componentWillUnmount() {
    this._mounted = false;
    cancelAnimationFrame(this._raf);
    clearInterval(this._tick);
    clearTimeout(this._hintTimer);
    clearTimeout(this._sayT);
    clearTimeout(this._sitT);
    clearTimeout(this._greetT);
    clearTimeout(this._enterT);
    clearTimeout(this._hideHoverT);
    clearInterval(this._bathBub);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('mousemove', this._onHover);
    window.removeEventListener('beforeunload', this._onUnload);
    if (this._offStage) this._offStage();
  }

  componentDidUpdate() { this.refreshInteractive(); }

  async boot() {
    const st = await getStage();
    this.applyStage(st);
    await this.load();
    this.setState({ traits: traitLabel(this.personality) });
    // Greet once on launch, by time of day.
    this._greetT = setTimeout(() => {
      if (this._mounted) this.speak(pick(greetingPool(new Date().getHours())), 2800, true);
    }, 1200);
  }

  touch() { this._lastInteract = Date.now(); }

  // Stand up from a sit (and cancel its timer). Cheap no-op otherwise.
  stand() {
    if (this.p.action === 'sit') {
      clearTimeout(this._sitT);
      this.p.action = 'idle';
      this.p.busy = false;
    }
  }
  // A deliberate action may interrupt a sit, but not a real busy animation
  // (eat / play / sleep mid-run). Returns true if the caller should bail.
  busyBlocked() {
    if (this.p.action === 'sit') { this.stand(); return false; }
    return this.p.busy;
  }

  // Apply a set of stat deltas at once (each clamped 0–100).
  applyDeltas(d) {
    this.setState((s) => ({
      fullness: clamp(s.fullness + (d.full || 0), 0, 100),
      cleanliness: clamp(s.cleanliness + (d.clean || 0), 0, 100),
      happiness: clamp(s.happiness + (d.happy || 0), 0, 100),
      energy: clamp(s.energy + (d.energy || 0), 0, 100),
    }));
  }

  // ---- shop / economy ------------------------------------------------------
  openCat = (cat) => { if (this.p.action === 'walk') this.endWalk(); this.setState({ shopCat: cat, hover: true }); };
  backShop = () => this.setState({ shopCat: null });
  buyItem = (cat, item) => {
    if (cat === 'medicine') return this.useMedicine(item);
    if (this.busyBlocked()) return;            // mid-action: ignore (and don't charge)
    if (this.state.money < item.cost) {
      this.speak('钱不够啦…💸', 1800, true);
      this.setState({ shopCat: null });
      return;
    }
    this.setState((s) => ({ money: s.money - item.cost, shopCat: null, hover: false, hoverStat: null }), () => this.save());
    if (cat === 'food') this.feed({ full: item.full, happy: item.happy || 0 });
    else if (cat === 'bath') this.bathAct({ clean: item.clean, happy: item.happy || 0 });
  };

  // Free mini-game: the owner plays with the pet. No cost; raises happiness
  // (and, like any play, uses a little energy and gets the pet a bit dirty).
  playFree = () => {
    if (this.busyBlocked()) return;
    if (this.state.hover || this.state.shopCat) this.setState({ hover: false, hoverStat: null, shopCat: null });
    const r = Math.random();
    if (r < 0.34) this.ballAct();
    else if (r < 0.6) this.badmintonAct();
    else if (r < 0.8) this.dance();
    else this.playAct();
  };

  // ---- school / work / medicine -------------------------------------------
  openMedicine = () => { this.closeMenu(); this.setState({ shopCat: 'medicine', hover: true }); };
  useMedicine = (item) => {
    if (!this.state.sick) { this.speak('我没生病呀~ 😊', 2000, true); this.setState({ shopCat: null }); return; }
    if (this.state.money < item.cost) { this.speak('钱不够啦…💸', 1800, true); this.setState({ shopCat: null }); return; }
    // A medicine ≥ the illness tier cures outright; a weaker one still helps,
    // downgrading the illness one stage (so you're never hard-stuck).
    const cur = SICK_TIER[this.state.sick];
    const cured = item.tier >= cur;
    const newSick = cured ? null : ['mild', 'medium', 'severe'][cur - 2];
    this.setState((s) => ({
      money: s.money - item.cost, sick: newSick,
      health: clamp(s.health + item.heal, 0, 100),
      shopCat: null, hover: false, hoverStat: null,
    }), () => this.save());
    this._sickDur = 0;
    this.setEmote('💊', 1600);
    this.speak(cured ? '好多了，谢谢你~ 😊' : '感觉好一点了…还得再吃药 💊', 2600, true);
  };

  studyAct = () => {
    if (this.busyBlocked()) return;
    this.closeMenu();
    if (this.state.education >= 3) { this.speak('已经大学毕业啦！🎓', 2200, true); return; }
    if (this.state.sick) { this.speak('生病了，先看医生吧…🤒', 2200, true); return; }
    if (this.state.energy < 12) { this.speak('太困了，想睡觉…😴', 2200, true); return; }
    this.touch();
    this.p.busy = true; this.p.action = 'study';
    this.floatEmoji('📖', 3000); this.speak(pick(DIA.study), 2600, true);
    setTimeout(() => {
      const need = STUDY_NEED[this.state.education] || 99;
      let study = this.state.study + 1;
      let education = this.state.education;
      let leveled = false;
      if (study >= need) { study = 0; education += 1; leveled = true; }
      this.setState((s) => ({ study, education, energy: Math.max(0, s.energy - 8), happiness: Math.min(100, s.happiness + 3) }));
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
      this.speak(leveled ? `升学啦！🎓 现在是${EDU[education]}生` : '又学到一点知识~ 📚', 2800, true);
    }, 3000);
  };

  workAct = () => {
    if (this.busyBlocked()) return;
    this.closeMenu();
    if (this.state.sick) { this.speak('生病了不能上班…🤒', 2200, true); return; }
    if (this.state.energy < 18) { this.speak('太累了，先休息…😴', 2200, true); return; }
    this.touch();
    const edu = this.state.education;
    const pay = WORK_PAY[edu];
    this.p.busy = true; this.p.action = 'work';
    this.floatEmoji('💼', 3200); this.speak(`${WORK_JOB[edu]}·${pick(DIA.work)}`, 2600, true);
    setTimeout(() => {
      this.setState((s) => ({
        money: s.money + pay,
        energy: Math.max(0, s.energy - 22),
        cleanliness: Math.max(0, s.cleanliness - 6),
        happiness: Math.max(0, s.happiness - 4),
      }));
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
      this.setEmote('💰', 1500);
      this.speak(`赚到 +${pay} 💰！`, 2600, true);
    }, 3200);
  };

  // A small emoji that floats and bobs above the pet's head (study/work props).
  floatEmoji(emoji, dur) {
    const layer = this.partRef.current;
    if (!layer) return;
    const el = document.createElement('div');
    el.textContent = emoji;
    el.style.cssText = 'position:absolute;left:42px;top:-8px;font-size:24px;line-height:1;animation:hintBob .9s ease-in-out infinite;';
    layer.appendChild(el);
    setTimeout(() => el.remove(), dur + 80);
  }

  // ---- screen geometry / walk bounds --------------------------------------
  // p.x / p.y is the WINDOW's top-left. The penguin is centered in the window,
  // offset by (offX, offY). We clamp so the PENGUIN stays inside the work area
  // while the window itself may overflow the screen — that lets the pet reach
  // every edge instead of being held back by its own transparent margin.
  applyStage(st) {
    if (!st || !st.work) return;
    this.WIN_W = st.winW;
    this.WIN_H = st.winH;
    this.work = st.work;
    this.offX = (this.WIN_W - this.PEN_W) / 2;
    this.offY = (this.WIN_H - this.PEN_H) / 2;
    this.minX = this.work.x - this.offX;
    this.maxX = Math.max(this.minX, this.work.x + this.work.width - this.offX - this.PEN_W);
    this.minY = this.work.y - this.offY;
    this.maxY = Math.max(this.minY, this.work.y + this.work.height - this.offY - this.PEN_H);
    if (this.ground == null) this.ground = this.maxY;
    else this.ground = clamp(this.ground, this.minY, this.maxY);
    if (!this._placed) {
      this.p.x = clamp(this.work.x + this.work.width / 2 - this.WIN_W / 2, this.minX, this.maxX);
      this.p.y = this.ground;
      this.p.tx = this.p.x;
      this._placed = true;
    }
    this.p.x = clamp(this.p.x, this.minX, this.maxX);
    this.p.y = clamp(this.p.y, this.minY, this.maxY);
    this.pushWindow(true);
  }

  pushWindow(force) {
    if (!this._placed) return;
    const xi = Math.round(this.p.x), yi = Math.round(this.p.y);
    if (!force && xi === this._wx && yi === this._wy) return;
    const now = performance.now();
    if (!force && now - (this._wt || 0) < 15) return;
    this._wt = now; this._wx = xi; this._wy = yi;
    moveWindow(xi, yi);
  }

  // ---- window click-through toggle (hit-test bypass) ----------------------
  refreshInteractive() {
    const s = this.state;
    const v = !!(this._overPen || this.p.dragging || s.hover || s.shopCat || s.menu || s.settingsOpen);
    if (v !== this._iv) { this._iv = v; setInteractive(v); }
  }
  // Show the care panel while the cursor is over the penguin OR the open panel
  // (so you can move from pet → buttons without it closing); hide after a beat.
  onHover(e) {
    const pen = this.penRef.current;
    if (!pen) return;
    const pad = 8;
    const inRect = (r) => !!r && e.clientX >= r.left - pad && e.clientX <= r.right + pad &&
      e.clientY >= r.top - pad && e.clientY <= r.bottom + pad;
    let over = inRect(pen.getBoundingClientRect());
    if (!over && (this.state.hover || this.state.shopCat) && this.hoverRef.current) over = inRect(this.hoverRef.current.getBoundingClientRect());
    if (over) {
      if (this._hideHoverT) { clearTimeout(this._hideHoverT); this._hideHoverT = null; }
      if (!this._overPen) { this._overPen = true; this.refreshInteractive(); }
      if (!this.state.hover) { if (this.p.action === 'walk') this.endWalk(); this.setState({ hover: true }); }
    } else {
      if (this._overPen) { this._overPen = false; this.refreshInteractive(); }
      if ((this.state.hover || this.state.shopCat) && !this._hideHoverT) {
        this._hideHoverT = setTimeout(() => {
          this._hideHoverT = null;
          if (this._mounted) this.setState({ hover: false, hoverStat: null, shopCat: null });
        }, 220);
      }
    }
  }
  setHoverStat = (name) => { if (this.state.hoverStat !== name) this.setState({ hoverStat: name }); };
  clearHoverStat = () => { if (this.state.hoverStat) this.setState({ hoverStat: null }); };

  // ---- sprite grids --------------------------------------------------------
  setupGrids() {
    const idle = [
      '......DDDD......', '....DDDDDDDD....', '...DDDDDDDDDD...', '..DDDDDDDDDDDD..',
      '..DDLLLLLLLLDD..', '..DLLLLLLLLLLD..', '..DLLELLLLELLD..', '..DLCLLOOLLCLD..',
      '..DLLLLLLLLLLD..', '..DDLLLLLLLLDD..', '...SSSSSSSSSS...', '..DDLLLLLLLLDD..',
      '..DLLLLLLLLLLD..', '..DDLLLLLLLLDD..', '...DDLLLLLLDD...', '....OO....OO....',
    ];
    const sw = (g, reps) => { const c = g.slice(); for (const r of reps) c[r[0]] = r[1]; return c; };
    this.CLOSED = '..DLEELLLLEELD..';
    this.FEET_A = '...OO......OO...';
    this.FEET_B = '.....OO..OO.....';
    this.G = {
      idle,
      happy: sw(idle, [[5, '..DLLELLLLELLD..'], [6, '..DLELELLELELD..'], [8, '..DLLLLOOLLLLD..']]),
      sad: sw(idle, [[7, '..DLCTLOOLLCLD..'], [8, '..DLLTLLLLLLLD..']]),
      sleepy: sw(idle, [[6, this.CLOSED]]),
      eat: sw(idle, [[5, '..DLLELLLLELLD..'], [6, '..DLELELLELELD..'], [8, '..DLLLLOOLLLLD..']]),
    };
  }
  pal() {
    return { '.': null, D: BODY, L: '#ffffff', O: BEAK, S: SCARF, E: '#1a1f3d', C: '#ff9bbb', T: '#5bc8ff', G: '#9c8a63' };
  }
  swap(g, i, row) { const c = g.slice(); c[i] = row; return c; }
  withClosed(g) { return this.swap(g, 6, this.CLOSED); }
  withFeet(g, which) { return this.swap(g, 15, which ? this.FEET_A : this.FEET_B); }
  // Smudge a few belly pixels with grime when the pet is dirty (low cleanliness).
  withDirt(g) {
    const c = g.slice();
    const smudge = (i, cols) => {
      if (!c[i]) return;
      const row = c[i].split('');
      for (const x of cols) if (row[x] === 'L') row[x] = 'G';
      c[i] = row.join('');
    };
    smudge(8, [5, 10]);
    smudge(11, [6, 9]);
    smudge(12, [4, 8, 11]);
    smudge(13, [7]);
    return c;
  }
  ensureCtx() {
    if (this.ctx) return true;
    const cv = this.canvasRef.current;
    if (!cv) return false;
    this.ctx = cv.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    return true;
  }
  draw(grid) {
    const ctx = this.ctx, P = 7, PAL = this.pal();
    ctx.clearRect(0, 0, 112, 112);
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const c = PAL[row[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * P, y * P, P, P);
      }
    }
  }

  paintStatic() {
    if (this.ensureCtx()) this.draw(this.G.idle);
    if (this.spriteRef.current) this.spriteRef.current.style.transform = `scaleX(${this.p.facing})`;
  }

  // ---- animation loop ------------------------------------------------------
  loop = (t) => {
    const p = this.p;
    const dt = Math.min(50, t - this._last);
    this._last = t;
    const sp = this.state.speed || 1;

    // Blink timing (cheap, every frame).
    if (p.action === 'idle' || p.action === 'walk') {
      p.blink -= dt;
      if (p.blink <= 0 && !p.blinkOn) { p.blinkOn = true; p.blinkT = 140; p.blink = 2400 + Math.random() * 2600; }
      if (p.blinkOn) { p.blinkT -= dt; if (p.blinkT <= 0) p.blinkOn = false; }
    }

    // Horizontal walk = move the window across the screen (every frame).
    if (p.action === 'walk') {
      const dir = Math.sign(p.tx - p.x) || 1;
      p.facing = dir < 0 ? -1 : 1;
      p.x += dir * p.speed * sp * dt / 1000;
      if (Math.abs(p.tx - p.x) < 2 || p.x <= this.minX || p.x >= this.maxX) {
        p.x = clamp(p.x, this.minX, this.maxX);
        this.endWalk();
      }
      this.pushWindow();
    }

    // Idle FPS throttle: only redraw at ~18fps when nothing is animating, full
    // rate while walking/playing/blinking/dragging. Saves CPU on an always-on app.
    const lowKey = p.action === 'idle' || p.action === 'weak' || p.action === 'sit';
    const animating = !lowKey || p.blinkOn || p.dragging;
    if (animating || t - (this._lastDraw || 0) >= 55) {
      this._lastDraw = t;
      this.render2d(t, sp);
    }

    this._raf = requestAnimationFrame(this.loop);
  };

  render2d(t, sp) {
    const p = this.p;
    let face = this.G.idle;
    if (p.action === 'sleep') face = this.G.sleepy;
    else if (p.action === 'play' || p.action === 'dance' || p.action === 'ball' || p.action === 'badminton' || p.action === 'bath') face = this.G.happy;
    else if (p.action === 'sit') face = this.G.happy;
    else if (p.action === 'weak') face = this.G.sad;
    else if (p.action === 'work') face = this.G.happy;
    else if (p.action === 'study') face = this.G.idle;
    else if (p.action === 'enter') face = this.G.happy;
    else if (p.action === 'eat') face = (Math.floor(t / 170) % 2 ? this.G.eat : this.G.idle);
    else {
      const m = this.state.mood;
      if (m === 'sad') face = this.G.sad;
      else if (m === 'tired') face = this.G.sleepy;
      else if (m === 'playful') face = this.G.happy;
      else face = this.G.idle;
    }

    let grid = face;
    if (p.action === 'walk') grid = this.withFeet(face, Math.floor(t / (150 / sp)) % 2);
    if (p.blinkOn && face !== this.G.sleepy && face !== this.G.sad) grid = this.withClosed(grid);
    if (this.state.cleanliness <= 25) grid = this.withDirt(grid);
    if (this.ensureCtx()) this.draw(grid);

    let jy = 0, rot = 0, tilt = 0, sy = 1;
    if (p.action === 'play' || p.action === 'dance' || p.action === 'ball') {
      let pr = (t - p.aStart) / p.aDur; if (pr > 1) pr = 1;
      const hops = p.action === 'dance' ? 2 : 3;
      jy = Math.abs(Math.sin(pr * Math.PI * hops)) * (p.action === 'ball' ? 38 : 42);
      if (p.action === 'dance') rot = pr * 360;
      sy = 1 + Math.sin(pr * Math.PI * hops * 2) * 0.06;
    }
    if (p.action === 'badminton') {
      // short hops while the body swings the racket back and forth
      jy = Math.abs(Math.sin(t / 150)) * 22;
      rot = Math.sin(t / 95) * 17 * p.facing;
    }
    if (p.action === 'bath') { rot = Math.sin(t / 70) * 9; sy = 1 + Math.sin(t / 90) * 0.04; } // shiver while washing
    if (p.action === 'enter') {
      let pr = (t - p.aStart) / p.aDur; if (pr > 1) pr = 1;
      jy = Math.sin(pr * Math.PI) * 58;                 // hop up out of the door and land
      sy = 1 + Math.sin(pr * Math.PI * 2) * 0.1;        // stretch then squash
      rot = Math.sin(pr * Math.PI) * 8 * p.facing;      // a little flourish
    }
    if (p.action === 'study') { jy = Math.sin(t / 300) * 3; tilt = 4; }                         // gentle reading nod
    if (p.action === 'work') { jy = Math.abs(Math.sin(t / 160)) * 8; rot = Math.sin(t / 120) * 6 * p.facing; } // busy bob
    if (p.action === 'sit') { sy = 0.82; jy = -10; }   // squash + lower = sitting
    if (p.action === 'weak') { sy = 0.6; jy = -16 + Math.sin(t / 650) * 1.5; tilt = 5 * p.facing; } // slumped, too hungry
    if (p.action === 'sleep') { tilt = -12; jy = -10; }
    const bob = p.action === 'walk' ? -Math.abs(Math.sin(t / 110)) * 4 : (p.action === 'idle' ? Math.sin(t / 720) * 2 : 0);

    if (this.spriteRef.current) {
      this.spriteRef.current.style.transform =
        `translateY(${(bob - jy).toFixed(1)}px) rotate(${(tilt + rot).toFixed(1)}deg) scaleX(${p.facing}) scaleY(${sy.toFixed(3)})`;
    }
    if (this.shadowRef.current) {
      const k = Math.max(0.4, 1 - jy / 120);
      this.shadowRef.current.style.transform = `scaleX(${k.toFixed(2)})`;
      this.shadowRef.current.style.opacity = String((0.34 * k).toFixed(2));
    }
  }

  // ---- needs / mood --------------------------------------------------------
  calcMood(s) {
    if (this.p.action === 'sleep') return 'tired';
    if (this.state.sick) return 'sad';   // unwell
    if (s.fullness < 25) return 'sad';   // very hungry
    if (s.energy < 30) return 'tired';
    if (this.p.playfulUntil && Date.now() < this.p.playfulUntil) return 'playful';
    if (s.happiness < 30) return 'sad';  // unhappy
    if (this.p.action === 'idle' && this._lastInteract && Date.now() - this._lastInteract > 25000) return 'bored';
    return 'happy';
  }
  recompute() { this.setState((s) => ({ mood: this.calcMood(s) })); }

  tick = () => {
    // This is a 24/7 idle pet, but tuned to be playable: a full pet gets hungry
    // in ~2.5–3h (tick = 1s; rates per-second). Appetite trait nudges the speed.
    // Health/sickness stay slow (below) so faster needs don't make it sick easily.
    const aRate = 0.0075 * (0.75 + this.personality.appetite / 200); // ~2.6h to hungry
    const cleanDrop = 0.0050 + (this.p.action === 'walk' ? 0.003 : 0); // ~4–5h to dirty
    const happyDrop = 0.0045; // ~3h to bored without play
    this.setState((s) => {
      const fullness = Math.max(0, s.fullness - aRate);
      const cleanliness = Math.max(0, s.cleanliness - cleanDrop);
      const happiness = Math.max(0, s.happiness - happyDrop);
      let energy = s.energy;
      if (this.p.action === 'walk') energy = Math.max(0, energy - 0.04); // gentle ambient drain
      // Health: only PROLONGED neglect (a stat low for hours) erodes it; good
      // all-round care slowly heals. Illness keeps draining until treated.
      let hd = 0;
      if (fullness < 25) hd -= 0.004;
      if (cleanliness < 25) hd -= 0.0035;
      if (happiness < 20) hd -= 0.002;
      if (energy < 12) hd -= 0.002;
      if (s.sick) hd -= (s.sick === 'severe' ? 0.006 : s.sick === 'medium' ? 0.004 : 0.002);
      else if (fullness > 55 && cleanliness > 55 && happiness > 45 && energy > 30) hd += 0.003;
      const health = clamp(s.health + hd, 0, 100);
      const mood = this.calcMood({ fullness, energy, cleanliness, happiness });
      return { fullness, cleanliness, happiness, energy, health, mood };
    });

    // Enter / leave the slumped "too hungry to move" state (hysteresis 15/22).
    const projFull = Math.max(0, this.state.fullness - aRate);
    if (!this.p.busy && !this.p.dragging) {
      if (this.p.action === 'weak') {
        if (projFull > 22) this.p.action = 'idle';
      } else if ((this.p.action === 'idle' || this.p.action === 'walk') && projFull <= 15) {
        this.endWalk();
        this.p.action = 'weak';
      }
    }

    // Sickness: low health for a sustained time → fall ill (probabilistic, checked
    // every ~18s); untreated illness worsens over time (初级→中级→晚期).
    if (this.state.sick) {
      this._sickDur = (this._sickDur || 0) + 1;
      if (this._sickDur >= 1800) { // untreated worsens slowly (~30 min per stage)
        this._sickDur = 0;
        const next = { mild: 'medium', medium: 'severe', severe: 'severe' }[this.state.sick];
        if (next !== this.state.sick) { this.setState({ sick: next }); this.speak('好像更严重了…🤒', 2600, true); }
      }
    } else {
      this._sickDur = 0;
      this._sickCtr = (this._sickCtr || 0) + 1;
      if (this._sickCtr >= 25) { // check for illness ~every 25s while health is low
        this._sickCtr = 0;
        if (this.state.health < 50 && !this.p.busy) {
          const chance = clamp((50 - this.state.health) / 100, 0, 0.4);
          if (Math.random() < chance) { this.setState({ sick: 'mild' }); this.speak(pick(DIA.sick), 2600, true); }
        }
      }
    }

    const now = Date.now();
    if (now > this.p.emoteUntil) {
      const s = this.state;
      let e = null;
      if (s.fullness <= 0) e = '😭';
      else if (s.fullness < 30) e = '🍖';
      else if (s.energy < 30 && this.p.action !== 'sleep') e = '😴';
      if (this.state.emote !== e) this.setState({ emote: e });
    }

    if (!this.p.busy && this.p.action === 'idle' && !this.p.dragging && !this.state.hover) {
      if (this.state.energy < 12) {
        this.sleepAct();
      } else {
        this.p.walkTimer -= 1;
        if (this.p.walkTimer <= 0) {
          // Liveliness → how often it gets up to walk; sometimes it instead
          // sits to rest, or (if lively + energetic) plays ball on its own.
          const L = this.personality.liveliness;
          this.p.walkTimer = Math.max(4, Math.round(13 - L / 12)) + Math.floor(Math.random() * 5);
          const roll = Math.random();
          if (this.state.sick) {
            // unwell: mostly rest, only the occasional slow shuffle
            if (roll < 0.18) this.startWalk(); else if (roll > 0.5) this.sitAct();
          } else if (roll < 0.42 + L / 280) this.startWalk();
          else if (L > 55 && this.state.energy > 55 && roll > 0.93) this.ballAct();
          else if (roll > 0.62 && this.state.energy < 92) this.sitAct();
        }
      }
    }

    this.maybeChatter();
    if (this.p.action === 'weak' && Math.random() < 0.14) this.speak(pick(DIA.weak));

    this._saveCtr = (this._saveCtr || 0) + 1;
    if (this._saveCtr >= 5) { this._saveCtr = 0; this.save(); }
  };

  setEmote(ch, ms) { this.p.emoteUntil = Date.now() + ms; this.setState({ emote: ch }); }

  // ---- dialogue ------------------------------------------------------------
  speak(text, ms = 2600, force = false) {
    if (!text || !this._mounted) return;
    const now = Date.now();
    if (!force && now - (this._lastSay || 0) < 9000) return; // anti-spam for proactive lines
    this._lastSay = now;
    this.setState({ say: text });
    clearTimeout(this._sayT);
    this._sayT = setTimeout(() => { if (this._mounted) this.setState({ say: null }); }, ms);
  }
  maybeChatter() {
    const s = this.state;
    if (this.p.busy || this.p.action !== 'idle' || this.p.dragging || s.hover || s.menu || s.settingsOpen) return;
    const since = Date.now() - (this._lastInteract || 0);
    if (since < 18000) return;
    const P = this.personality;
    const chance = 0.1 + P.liveliness / 700 + P.attachment / 1000;
    if (Math.random() > chance) return;
    let pool = DIA.bored;
    if (s.sick) pool = DIA.sick;
    else if (s.fullness < 30) pool = DIA.hungry;
    else if (s.cleanliness <= 25) pool = DIA.dirty;
    else if (s.energy < 30) pool = DIA.sleepy;
    else if (s.happiness < 30) pool = DIA.unhappy;
    else if (P.attachment > 60 && since > 40000) pool = DIA.lonely;
    this.speak(pick(pool));
  }

  // ---- behaviors -----------------------------------------------------------
  startWalk = () => {
    if (this.p.busy || this.p.action !== 'idle' || this.minX == null) return;
    const P = this.personality;
    const span = this.maxX - this.minX;
    const boldness = P.courage / 100;
    let target = this.p.x + (Math.random() * 2 - 1) * span * (0.25 + 0.65 * boldness);
    // Timid pets hug the nearest edge; curious pets sometimes explore far.
    if (boldness < 0.4) {
      const edge = (this.p.x - this.minX) < (this.maxX - this.p.x) ? this.minX : this.maxX;
      target = target * 0.45 + edge * 0.55;
    }
    if (Math.random() < P.curiosity / 450) target = this.minX + Math.random() * span;
    this.p.tx = clamp(target, this.minX, this.maxX);
    this.p.y = this.ground;
    this.p.action = 'walk';
    const slow = this.state.fullness < 30 || this.state.energy < 30;
    this.p.speed = slow ? 26 : (46 + P.liveliness * 0.28);
  };
  endWalk() { if (this.p.action === 'walk') this.p.action = 'idle'; }

  feed = (fx) => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'eat';
    this.sfx('eat'); this.spawn('feed'); this.setEmote('🐟', 1500);
    setTimeout(() => {
      this.applyDeltas(fx || { full: 42, happy: 4 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
      this.speak(pick(DIA.fed), 2200, true);
    }, 1500);
  };
  playAct = (fx) => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'play';
    this.p.aStart = performance.now(); this.p.aDur = 1500 / (this.state.speed || 1);
    this.p.playfulUntil = Date.now() + 10000;
    this.sfx('play'); this.spawn('play'); this.setEmote('🎉', 1700);
    setTimeout(() => {
      this.applyDeltas(fx || { energy: -20, clean: -8, happy: 26 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
      this.speak(pick(DIA.played), 2200, true);
    }, this.p.aDur);
  };
  dance = (fx) => {
    if (this.busyBlocked()) return;
    this.touch();
    this.p.busy = true; this.p.action = 'dance';
    this.p.aStart = performance.now(); this.p.aDur = 1300 / (this.state.speed || 1);
    this.p.playfulUntil = Date.now() + 3000;
    this.sfx('play'); this.spawn('play'); this.setEmote('✨', 1500);
    setTimeout(() => {
      this.applyDeltas(fx || { energy: -5, happy: 12 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
    }, this.p.aDur);
  };
  sleepAct = () => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'sleep';
    this.sfx('sleep'); this.setEmote('💤', 6200);
    setTimeout(() => {
      this.setState({ energy: 80 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
      this.speak(pick(DIA.slept), 2200, true);
    }, 6000);
  };
  // Sit down for a short rest (recovers a little energy). Interruptible.
  sitAct = () => {
    if (this.p.busy) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'sit';
    this.sfx('chirp'); this.speak(pick(DIA.sit), 2400, true);
    clearTimeout(this._sitT);
    this._sitT = setTimeout(() => {
      this.setState((s) => ({ energy: Math.min(100, s.energy + 6) }));
      if (this.p.action === 'sit') { this.p.action = 'idle'; this.p.busy = false; }
      this.recompute();
    }, 5200);
  };
  ballAct = (fx) => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'ball';
    this.p.aStart = performance.now(); this.p.aDur = 2400 / (this.state.speed || 1);
    this.p.playfulUntil = Date.now() + 8000;
    this.sfx('play'); this.prop('ball', this.p.aDur); this.setEmote('⚽', 1800);
    this.speak(pick(DIA.ball), 2000, true);
    setTimeout(() => {
      this.applyDeltas(fx || { energy: -14, clean: -10, happy: 24 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
    }, this.p.aDur);
  };
  badmintonAct = (fx) => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'badminton';
    this.p.aStart = performance.now(); this.p.aDur = 2600 / (this.state.speed || 1);
    this.p.playfulUntil = Date.now() + 8000;
    this.sfx('play'); this.prop('shuttle', this.p.aDur); this.setEmote('🏸', 1800);
    this.speak(pick(DIA.badminton), 2000, true);
    setTimeout(() => {
      this.applyDeltas(fx || { energy: -16, clean: -12, happy: 28 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
    }, this.p.aDur);
  };
  // Bath: scrubs the pet clean with rising bubbles. fx.clean is a delta
  // (e.g. +45 for a quick shower, +100 for a bubble bath).
  bathAct = (fx) => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'bath';
    this.p.aStart = performance.now(); this.p.aDur = 1900 / (this.state.speed || 1);
    this.sfx('bath'); this.bubbles(); this.setEmote('🫧', 1900);
    this.speak(pick(DIA.bath), 2000, true);
    clearInterval(this._bathBub);
    this._bathBub = setInterval(() => this.bubbles(), 480);
    setTimeout(() => {
      clearInterval(this._bathBub);
      this.applyDeltas(fx || { clean: 100, happy: 5 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
    }, this.p.aDur);
  };

  // A small animated play-prop (bouncing ball / arcing shuttlecock) in the
  // effects layer, alongside the penguin's hop/swing animation.
  prop(kind, totalDur) {
    const layer = this.partRef.current;
    if (!layer) return;
    const el = document.createElement('div');
    if (kind === 'ball') {
      el.style.cssText = 'position:absolute;left:46px;top:78px;width:20px;height:20px;border-radius:50%;' +
        'background:radial-gradient(circle at 35% 30%,#fff,#ff4d6d 62%,#c01b3c);' +
        'box-shadow:0 2px 0 rgba(34,42,85,.2);animation:ballPlay .5s ease-in-out infinite;';
    } else {
      el.textContent = '🏸';
      el.style.cssText = 'position:absolute;left:50px;top:60px;font-size:21px;line-height:1;' +
        'animation:shuttle 1.2s ease-in-out infinite;';
    }
    layer.appendChild(el);
    setTimeout(() => el.remove(), totalDur + 80);
  }

  // Soap bubbles rising during a bath (reuses the partPop drift keyframe).
  bubbles() {
    const layer = this.partRef.current;
    if (!layer) return;
    for (let i = 0; i < 7; i++) {
      const el = document.createElement('div');
      const x = 18 + Math.random() * 76, size = 6 + Math.random() * 11;
      const dx = (Math.random() - 0.5) * 26, dy = -42 - Math.random() * 46;
      el.style.cssText = 'position:absolute;left:' + x.toFixed(0) + 'px;top:80px;width:' + size.toFixed(0) + 'px;height:' + size.toFixed(0) + 'px;border-radius:50%;' +
        'background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.95),rgba(120,200,255,.5));border:1px solid rgba(90,150,220,.55);' +
        '--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px;animation:partPop ' + (0.9 + Math.random() * 0.5).toFixed(2) + 's ease-out forwards;';
      layer.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }
  }

  // ---- interactions --------------------------------------------------------
  handlePenClick() {
    if (performance.now() < this.p.clickCD) return;
    this.p.clickCD = performance.now() + 600;
    this.touch();
    this.sfx('chirp');
    this.stand();
    if (this.p.action === 'walk') this.p.action = 'idle';
    // Too hungry to perk up — just plead for food (the care panel shows on hover).
    if (this.p.action === 'weak' || this.state.fullness < 20) { this.speak(pick(DIA.weak), 2200, true); return; }
    const P = this.personality;
    const pool = P.liveliness > 65 ? DIA.clickLively : (P.courage < 35 ? DIA.clickShy : DIA.click);
    this.speak(pick(pool), 2000, true);
  }

  onDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const p = this.p;
    p.ds = { sx: e.screenX, sy: e.screenY, px: p.x, py: p.y, moved: false };
    p.dragging = true;
    this.touch();
    this.stand();
    if (p.action === 'walk') p.action = 'idle';
    if (this.state.hover || this.state.shopCat) this.setState({ hover: false, hoverStat: null, shopCat: null }); // don't drag the panel around
    this.refreshInteractive();
    if (this.penRef.current) this.penRef.current.style.cursor = 'grabbing';
  };
  onMove = (e) => {
    const p = this.p;
    if (!p.dragging || !p.ds) return;
    const dx = e.screenX - p.ds.sx, dy = e.screenY - p.ds.sy;
    if (Math.hypot(dx, dy) > 4) p.ds.moved = true;
    p.x = clamp(p.ds.px + dx, this.minX, this.maxX);
    p.y = clamp(p.ds.py + dy, this.minY, this.maxY);
    this.pushWindow(true);
  };
  onUp = () => {
    const p = this.p;
    if (!p.dragging) return;
    p.dragging = false;
    if (this.penRef.current) this.penRef.current.style.cursor = 'grab';
    const moved = p.ds && p.ds.moved;
    p.ds = null;
    if (!moved) {
      clearTimeout(this._clickT);
      this._clickT = setTimeout(() => this.handlePenClick(), 230);
    } else {
      this.ground = p.y;
      this.save();
    }
    this.refreshInteractive();
  };
  onDouble = (e) => { e.preventDefault(); clearTimeout(this._clickT); this.dance(); };
  onContext = (e) => {
    e.preventDefault();
    const r = this.rootRef.current.getBoundingClientRect();
    const W = this.WIN_W || r.width, H = this.WIN_H || r.height;
    const x = clamp(e.clientX - r.left, 0, Math.max(0, W - 162));
    const y = clamp(e.clientY - r.top, 0, Math.max(0, H - 320));
    this.setState({ menu: { x, y } });
  };
  closeMenu = () => { if (this.state.menu) this.setState({ menu: null }); };
  openSettings = () => { this.closeMenu(); this.setState({ settingsOpen: true, hover: false, hoverStat: null, shopCat: null }); };
  closeSettings = () => { this.setState({ settingsOpen: false }); this.save(); };
  quit = () => { this.closeMenu(); this.save(); quitApp(); };
  stopDown = (e) => { e.stopPropagation(); };

  // ---- settings ------------------------------------------------------------
  setName = (e) => this.setState({ name: e.target.value });
  setVol = (e) => this.setState({ volume: Number(e.target.value) });
  setSpeed = (e) => this.setState({ speed: Number(e.target.value) });
  setOpacity = (e) => this.setState({ opacity: Number(e.target.value) });

  // ---- audio (Web Audio API, procedural) -----------------------------------
  sfx(name) {
    const vol = this.state.volume;
    if (vol <= 0) return;
    try {
      if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)();
      const ac = this.ac;
      if (ac.state === 'suspended') ac.resume();
      const seqs = {
        chirp: [[880, 0, .08], [1240, .07, .1]],
        eat: [[300, 0, .07], [250, .09, .08]],
        sleep: [[520, 0, .18], [330, .16, .24]],
        play: [[660, 0, .09], [880, .08, .09], [1180, .16, .13]],
        bath: [[523, 0, .12], [659, .1, .13], [784, .22, .15], [988, .34, .18]],
      };
      const g0 = vol / 100 * 0.16;
      (seqs[name] || seqs.chirp).forEach(([f, at, du]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = (name === 'sleep' || name === 'bath') ? 'sine' : 'square';
        o.frequency.value = f;
        const t0 = ac.currentTime + at;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(g0, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + du);
        o.connect(g).connect(ac.destination);
        o.start(t0); o.stop(t0 + du + 0.03);
      });
    } catch (err) { /* ignore */ }
  }

  // ---- particle burst on feed/play ----------------------------------------
  spawn(kind) {
    const layer = this.partRef.current;
    if (!layer) return;
    const cols = kind === 'feed'
      ? ['#ff9d3d', '#ffd23d', '#ff7a3d', '#ffffff']
      : ['#ff4d6d', '#ffd23d', '#4cc3ff', '#36c98f', '#ffffff'];
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('div');
      const dx = (Math.random() - .5) * 92, dy = -30 - Math.random() * 55;
      el.style.cssText = `position:absolute;left:52px;top:36px;width:8px;height:8px;border-radius:2px;background:${cols[i % cols.length]};--dx:${dx}px;--dy:${dy}px;animation:partPop .75s ease-out forwards;`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), 780);
    }
  }

  // ---- persistence ---------------------------------------------------------
  async load() {
    let d = null;
    try { d = await loadState(); } catch (e) { /* ignore */ }
    this.personality = normPersonality(d && d.personality);
    if (!d) { this.setState({ loaded: true }); this.save(); return; }
    const st = {};
    ['fullness', 'energy', 'cleanliness', 'happiness', 'health', 'sick', 'education', 'study', 'money', 'mood', 'name', 'volume', 'speed', 'opacity'].forEach((k) => {
      if (d[k] != null) st[k] = d[k];
    });
    // Migrate saves from the old inverted "hunger" stat (0=full) → fullness.
    if (st.fullness == null && d.hunger != null) st.fullness = clamp(100 - Number(d.hunger), 0, 100);
    // Offline decay while the app was closed: only 20% of the live rate, and no
    // health loss / sickness, so the pet never comes back sick — just a little
    // hungrier/dirtier. Capped so a multi-day absence still leaves it cared-for.
    if (d.ts) {
      const sec = (Date.now() - d.ts) / 1000;
      const off = 0.2;
      const aR = 0.0075 * (0.75 + (this.personality.appetite || 50) / 200);
      if (st.fullness != null) st.fullness = Math.max(0, st.fullness - Math.min(65, off * aR * sec));
      if (st.cleanliness != null) st.cleanliness = Math.max(0, st.cleanliness - Math.min(65, off * 0.0050 * sec));
      if (st.happiness != null) st.happiness = Math.max(0, st.happiness - Math.min(50, off * 0.0045 * sec));
    }
    if (d.x != null && this.minX != null) { this.p.x = clamp(d.x, this.minX, this.maxX); this.p.tx = this.p.x; }
    if (d.y != null && this.minY != null) { this.p.y = clamp(d.y, this.minY, this.maxY); this.ground = this.p.y; }
    this.pushWindow(true);
    st.loaded = true;
    this.setState(st, () => { this.recompute(); this.save(); });
  }
  save() {
    const s = this.state;
    saveState({
      fullness: s.fullness, energy: s.energy, cleanliness: s.cleanliness, happiness: s.happiness,
      health: s.health, sick: s.sick, education: s.education, study: s.study,
      money: s.money, mood: s.mood,
      name: s.name, volume: s.volume, speed: s.speed, opacity: s.opacity,
      personality: this.personality,
      x: this.p.x, y: this.p.y, ts: Date.now(),
    });
  }

  // ---- render --------------------------------------------------------------
  render() {
    const s = this.state;
    const fullness = clamp(s.fullness, 0, 100);
    const happiness = clamp(s.happiness, 0, 100);
    const cleanliness = clamp(s.cleanliness, 0, 100);
    const health = clamp(s.health, 0, 100);
    const appOpacity = s.opacity / 100;

    // One bubble slot: spoken text takes priority over the needs emoji.
    // Short lines stay on one line (no awkward 2-line wrap); only long ones wrap.
    const sayLen = s.say ? [...s.say].length : 0;
    const bubble = s.say
      ? { content: s.say, text: true, nowrap: sayLen <= 14 }
      : (s.emote ? { content: s.emote, text: false, nowrap: true } : null);

    const dirty = cleanliness <= 25;
    const panelOpen = !!(s.hover || s.shopCat);
    // Flip the panel / bubble to whichever side has on-screen room, and nudge
    // them horizontally near the left/right edges so nothing goes off-screen
    // (the arrow keeps pointing at the pet via arrowShift).
    let placeBelow = false, shiftPanel = 0, shiftBubble = 0;
    if (this.work && this._placed) {
      placeBelow = (this.p.y + this.offY - this.work.y) < 132;
      const cx = this.p.x + this.WIN_W / 2;
      const clampX = (half) => {
        const lo = this.work.x + half + 4;
        const hi = Math.max(lo, this.work.x + this.work.width - half - 4);
        return clamp(cx, lo, hi) - cx;
      };
      shiftPanel = clampX(88);
      shiftBubble = clampX(105);
    }
    const placement = placeBelow ? 'below' : 'above';

    return (
      <div ref={this.rootRef} className="stage" style={{ opacity: appOpacity }}>
        {/* PENGUIN — centered in the window; the window itself walks. */}
        <div
          ref={this.penRef}
          onPointerDown={this.onDown}
          onContextMenu={this.onContext}
          onDoubleClick={this.onDouble}
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 112, height: 130, cursor: 'grab', touchAction: 'none', zIndex: 30 }}
        >
          {/* Anywhere Door — pops up behind the pet during the launch entrance */}
          {s.entering && (
            <div style={{ position: 'absolute', left: '50%', bottom: 0, marginLeft: -33, width: 66, height: 96, zIndex: 1, transformOrigin: '50% 100%', animation: 'doorInOut 1.05s ease-out forwards', pointerEvents: 'none' }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(#ffa6cf,#ff7eb3)', border: '3px solid #d44e86', borderRadius: '7px 7px 3px 3px', boxShadow: '0 5px 0 rgba(180,60,120,.3)', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 7, border: '2px solid rgba(255,255,255,.5)', borderRadius: 5 }} />
                <div style={{ position: 'absolute', right: 9, top: '52%', width: 8, height: 8, marginTop: -4, borderRadius: '50%', background: '#ffe27a', border: '2px solid #d49a1a' }} />
              </div>
            </div>
          )}
          <div ref={this.shadowRef} style={{ position: 'absolute', left: '50%', top: 104, width: 80, height: 18, marginLeft: -40, background: 'radial-gradient(ellipse at center,rgba(20,24,60,.34),rgba(20,24,60,0) 70%)', borderRadius: '50%' }} />
          <div ref={this.partRef} style={{ position: 'absolute', left: 0, top: 0, width: 112, height: 112, pointerEvents: 'none', zIndex: 5 }} />
          <div ref={this.spriteRef} style={{ position: 'absolute', left: 0, top: 0, width: 112, height: 112, willChange: 'transform', transformOrigin: '50% 92%', zIndex: 3 }}>
            <canvas ref={this.canvasRef} width="112" height="112" style={{ width: 112, height: 112, imageRendering: 'pixelated', display: 'block' }} />
          </div>

          {/* flies buzzing around a dirty pet (low cleanliness) */}
          {dirty && (
            <>
              <div className="fly" style={{ left: 74, top: 26, animation: 'buzz1 1.1s linear infinite' }}>🪰</div>
              <div className="fly" style={{ left: 20, top: 40, animation: 'buzz2 1.35s linear infinite' }}>🪰</div>
              <div className="fly" style={{ left: 48, top: 14, animation: 'buzz3 1.6s linear infinite' }}>🪰</div>
            </>
          )}

          {/* sick indicator — a feverish face bobbing by the head while ill */}
          {s.sick && (
            <div className="fly" style={{ left: 76, top: 6, fontSize: 17, animation: 'buzz3 2.4s ease-in-out infinite' }}>🤒</div>
          )}

          {/* tip pill — above the head, briefly at startup */}
          {s.hint && (
            <div style={{ position: 'absolute', left: '50%', bottom: 134, transform: 'translateX(-50%)', background: '#222a55', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, boxShadow: '0 4px 0 rgba(34,42,85,.3)', zIndex: 25, whiteSpace: 'nowrap', animation: 'hintBob 1.8s ease-in-out infinite', pointerEvents: 'none' }}>单击 · 拖动 · 右键 🐧</div>
          )}

          {bubble && (
            <div style={{ position: 'absolute', left: '50%', ...(placeBelow ? { top: 134 } : { bottom: 118 }), transform: `translateX(-50%) translateX(${shiftBubble}px)`, maxWidth: 206, background: '#fff', border: '2px solid #222a55', borderRadius: 12, padding: bubble.text ? '5px 10px' : '3px 8px', fontSize: bubble.text ? 12.5 : 17, fontWeight: 800, color: '#222a55', lineHeight: 1.3, textAlign: 'center', boxShadow: '0 3px 0 rgba(34,42,85,.18)', animation: 'bubbleIn .25s ease-out', pointerEvents: 'none', zIndex: 12, whiteSpace: bubble.nowrap ? 'nowrap' : 'normal' }}>{bubble.content}</div>
          )}

          {/* hover care panel + shop — flips above/below the pet, nudged on-screen */}
          <div
            ref={this.hoverRef}
            onPointerDown={this.stopDown}
            style={{ position: 'absolute', left: '50%', width: 176, marginLeft: -88, ...(placeBelow ? { top: 138 } : { bottom: 138 }), transform: `translateX(${shiftPanel}px) scale(${panelOpen ? 1 : 0.92})`, transformOrigin: placeBelow ? '50% 0%' : '50% 100%', opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? 'auto' : 'none', transition: 'opacity .14s ease, transform .14s ease', zIndex: 14, cursor: 'default' }}
          >
            <StatusBar
              stat={s.hoverStat}
              shopCat={s.shopCat}
              money={s.money}
              placement={placement}
              arrowShift={shiftPanel}
              fullness={fullness} cleanliness={cleanliness} happiness={happiness} health={health}
              onStat={this.setHoverStat} onLeave={this.clearHoverStat}
              onOpenCat={this.openCat} onBuy={this.buyItem} onBack={this.backShop} onPlay={this.playFree}
            />
          </div>
        </div>

        {/* context menu */}
        {s.menu && (
          <ContextMenu
            x={s.menu.x} y={s.menu.y}
            sick={s.sick}
            onClose={this.closeMenu}
            onFeed={() => { this.closeMenu(); this.openCat('food'); }}
            onBath={() => { this.closeMenu(); this.openCat('bath'); }}
            onPlay={() => { this.closeMenu(); this.playFree(); }}
            onSit={this.sitAct}
            onStudy={this.studyAct} onWork={this.workAct} onMedicine={this.openMedicine}
            onSettings={this.openSettings} onQuit={this.quit}
          />
        )}

        {/* settings */}
        {s.settingsOpen && (
          <SettingsPanel
            name={s.name} volume={s.volume} speed={s.speed} opacity={s.opacity}
            onName={this.setName} onVolume={this.setVol} onSpeed={this.setSpeed} onOpacity={this.setOpacity}
            onClose={this.closeSettings}
          />
        )}
      </div>
    );
  }
}
