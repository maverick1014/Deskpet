import React from 'react';
import StatusBar from './components/StatusBar.jsx';
import ContextMenu from './components/ContextMenu.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import GamePicker from './components/MiniGames.jsx';
import { GameEngine, GAME_LIST } from './games.js';
import {
  loadState, saveState, getStage, moveWindow, onStageUpdate, setInteractive, quitApp, onRecenter,
  buddyStatus, buddyConnect, buddyDisconnect, onBuddyEvent,
  appVersion, checkUpdate, openUrl, stageWindow, onUpdateReady, restartToUpdate,
} from './store.js';
import { genPersonality, normPersonality, traitLabel } from './personality.js';
import { DIA, BUDDY, pick, greetingPool, studyLine, knowledgePool } from './dialogue.js';
import { t, tn, defaultLang, LANGS } from './i18n.js';
import { cloudEnabled, currentUser, currentSession, onAuth, signIn, signUp, signOut, pullCloud, pushCloud } from './cloud.js';

const BODY = '#222a55';
const BEAK = '#ff9d3d';
const SCARF = '#ff4d6d';

// Timed school → work system. School has 4 levels; each level has the same 4
// subjects, and each subject needs `per` focus classes to graduate. Graduating
// all 4 subjects promotes the pet to the next level. A class runs for `min`
// REAL minutes of focused study (the pet keeps studying the whole time).
const SUBJECTS = [
  { key: 'cn', name: { zh: '语文', en: 'Chinese' }, icon: '📖' },
  { key: 'en', name: { zh: '英语', en: 'English' }, icon: '🔤' },
  { key: 'ma', name: { zh: '数学', en: 'Math' }, icon: '➗' },
  { key: 'sc', name: { zh: '科学', en: 'Science' }, icon: '🔬' },
];
const SCHOOL = [
  { name: { zh: '幼儿园', en: 'Kindergarten' }, per: 2,  min: 15 },
  { name: { zh: '小学',   en: 'Primary' },      per: 4,  min: 30 },
  { name: { zh: '中学',   en: 'Secondary' },    per: 8,  min: 60 },
  { name: { zh: '大学',   en: 'University' },    per: 16, min: 120 },
];
// Jobs unlock by school level reached (lvl ≤ schoolLevel). Higher tiers pay
// more. A shift is 30 or 60 real minutes; pay = rate × minutes. `key` drives the
// scene/attire (stable across languages); `name` is display-only.
const JOBS = [
  { key: 'flyer',   name: { zh: '发传单',     en: 'Flyering' },     lvl: 0, rate: 1.2, icon: '📰' },
  { key: 'weed',    name: { zh: '拔草',       en: 'Weeding' },      lvl: 0, rate: 1.6, icon: '🌿' },
  { key: 'dish',    name: { zh: '洗碗',       en: 'Dishwashing' },  lvl: 1, rate: 2.4, icon: '🍽️' },
  { key: 'clean',   name: { zh: '清洁工',     en: 'Cleaner' },      lvl: 1, rate: 3.0, icon: '🧹' },
  { key: 'store',   name: { zh: '便利店店员', en: 'Store clerk' },  lvl: 2, rate: 3.8, icon: '🏪' },
  { key: 'courier', name: { zh: '快递员',     en: 'Courier' },      lvl: 2, rate: 4.4, icon: '📦' },
  { key: 'coder',   name: { zh: '程序员',     en: 'Programmer' },   lvl: 3, rate: 6.5, icon: '💻' },
  { key: 'teacher', name: { zh: '老师',       en: 'Teacher' },      lvl: 3, rate: 5.8, icon: '🧑‍🏫' },
];
const WORK_MINS = [30, 60];
const FRESH_CLASSES = { cn: 0, en: 0, ma: 0, sc: 0 };
const SICK_TIER = { mild: 1, medium: 2, severe: 3 };

// Growth: a freshly hatched pet starts as an egg/baby and becomes a full penguin
// after this much total online time.
const GROW_SECONDS = 2 * 3600; // 2 hours
const GENDER_COLOR = { boy: '#ff4d57', girl: '#ff8fce' }; // ribbon / scarf colour
// Low-stakes idle behaviours that a deliberate action (feed/click/drag) interrupts.
const IDLE_ACTIONS = { sit: 1, tv: 1, read: 1, music: 1, stretch: 1, look: 1, wait: 1, flap: 1, sneeze: 1, peck: 1, yawn: 1, preen: 1, doze: 1, wave: 1 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmtClock = (sec) => { const m = Math.floor(sec / 60); return `${m}:${String(sec % 60).padStart(2, '0')}`; };
// Easing helpers for smoother, less-mechanical motion.
const easeInOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, t) => a + (b - a) * t;

export default class App extends React.Component {
  state = {
    fullness: 70, energy: 80, cleanliness: 100, happiness: 80, mood: 'happy',
    health: 100, sick: null, dead: false, education: 0, study: 0,
    name: 'Pengu', volume: 60, speed: 1, opacity: 100,
    money: 200, gender: null, playTime: 0, onboard: null,
    // Timed school/work: schoolLevel 0..4 (4 = graduated 大学); classDone tracks
    // classes finished per subject at the CURRENT level. session is the active
    // focus block (null when idle); schoolMenu/workMenu open the pickers.
    schoolLevel: 0, classDone: { cn: 0, en: 0, ma: 0, sc: 0 },
    session: null, sessionLeft: 0, schoolMenu: false, workMenu: false,
    playOpen: false, playGame: null, gameScore: 0,
    shopCat: null,
    menu: null, settingsOpen: false, emote: null, say: null, hint: true, hover: false, hoverStat: null, loaded: false,
    entering: false, traits: '',
    // Cloud account (email+password). REQUIRED — `user` is null until signed in.
    user: null, authEmail: '', authPw: '', authBusy: false, authMsg: '', syncedAt: null,
    // Cloud account is REQUIRED: `authChecked` gates the app behind a login until
    // the session is resolved; `online` tracks connectivity for auto-resync.
    authChecked: false, online: (typeof navigator !== 'undefined' ? navigator.onLine : true), authMode: 'in',
    confirmBreak: false, // a "中断专注？" confirm guards focus from stray clicks
    lang: defaultLang(), // 'zh' | 'en' — picked at the login screen, saved with the pet
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
  sceneRef = React.createRef();
  gameRef = React.createRef();
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

    this._last = performance.now();
    this._raf = requestAnimationFrame(this.loop);
    this._tick = setInterval(this.tick, 1000);

    this._onMove = (e) => this.onMove(e);
    this._onUp = (e) => this.onUp(e);
    this._onHover = (e) => this.onHover(e);
    this._onUnload = () => this.save();
    // Auto-resync: when the network comes back, push the latest save so nothing
    // edited offline is lost. Going offline just flips the indicator.
    this._onOnline = () => { if (this._mounted) this.setState({ online: true }); this.flushCloud(); };
    this._onOffline = () => { if (this._mounted) this.setState({ online: false }); };
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('mousemove', this._onHover);
    window.addEventListener('beforeunload', this._onUnload);
    window.addEventListener('online', this._onOnline);
    window.addEventListener('offline', this._onOffline);
    this._offStage = onStageUpdate((st) => this.applyStage(st));
    this._offRecenter = onRecenter(() => this.recenter());
    // Code Buddy: react to the developer's Claude Code session, and load whether
    // we're currently connected (hooks installed) for the Settings switch.
    this._offBuddy = onBuddyEvent((evt) => this.onBuddyEvent(evt));
    buddyStatus().then((r) => { if (this._mounted) this.setState({ buddyOn: !!(r && r.connected) }); }).catch(() => {});

    this._hintTimer = setTimeout(() => { if (this._mounted) this.setState({ hint: false }); }, 7000);
    // Auto-update (Option A): a little while after launch, ask GitHub if a newer
    // release exists; if so, show a dismissible "Update available" banner.
    this._updTimer = setTimeout(() => this.checkForUpdate(), 8000);
    // Auto-update (Option B, Windows): the main process silently downloads new
    // versions; when one is ready, offer a "restart now to update" prompt.
    this._offUpdate = onUpdateReady(() => { if (this._mounted) this.setState({ updateReady: true, update: null }); });
    this.refreshInteractive();
  }

  // Is version string `a` newer than `b`? (accepts "v1.16.0" or "1.16.0")
  _newer(a, b) {
    const p = (x) => String(x).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
    const [a1, a2, a3] = p(a), [b1, b2, b3] = p(b);
    return a1 > b1 || (a1 === b1 && (a2 > b2 || (a2 === b2 && a3 > b3)));
  }
  async checkForUpdate() {
    try {
      const [ver, rel] = await Promise.all([appVersion(), checkUpdate()]);
      if (this._mounted && rel && rel.tag && ver && this._newer(rel.tag, ver)) {
        this.setState({ update: { tag: rel.tag, url: rel.url } });
      }
    } catch (e) { /* offline / rate-limited: silently skip */ }
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
    clearTimeout(this._restT);
    clearTimeout(this._heartT);
    clearTimeout(this._hideHoverT);
    clearInterval(this._bathBub);
    clearInterval(this._musicInt);
    clearTimeout(this._faceArcT);
    clearTimeout(this._gameFaceT); clearTimeout(this._gameActT);
    this.stopScene();
    if (this._engine) this._engine.stop();
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('mousemove', this._onHover);
    window.removeEventListener('beforeunload', this._onUnload);
    window.removeEventListener('online', this._onOnline);
    window.removeEventListener('offline', this._onOffline);
    if (this._offStage) this._offStage();
    if (this._offRecenter) this._offRecenter();
    if (this._offAuth) this._offAuth();
    if (this._offBuddy) this._offBuddy();
    if (this._offUpdate) this._offUpdate();
    this._buddyReact = null;
    clearTimeout(this._buddyEncT);
    clearTimeout(this._updTimer);
    clearTimeout(this._cloudT);
  }

  componentDidUpdate() { this.refreshInteractive(); }

  async boot() {
    const st = await getStage();
    this.applyStage(st);
    this._loaded = await this.load();
    this.setState({ traits: traitLabel(this.personality) });
    // A cloud account is REQUIRED. Resolve the (offline-safe) session first; if
    // nobody is signed in, the render shows the login gate and the pet waits.
    await this.initCloud();
    this.maybeStartPet();
  }

  // Start the pet (entrance / onboarding) once the login gate is satisfied —
  // i.e. a user is signed in, or the cloud client is unavailable (degraded mode).
  maybeStartPet() {
    if (this._petStarted) return;
    if (cloudEnabled() && !this.state.user) return; // gate is up; wait for login
    this._petStarted = true;
    const gender = this.state.gender || (this._loaded && this._loaded.gender);
    const dead = this.state.dead || (this._loaded && this._loaded.dead);
    if (!gender) { this.setState({ onboard: 'gender', entering: false }); return; } // new pet → choose egg + name
    if (dead) { this.setState({ entering: false }); return; } // dead pets show the revive overlay, no entrance

    // Was the pet mid-class/shift when it closed? Resume it (or auto-complete the
    // class if its time already elapsed while away) instead of losing the progress.
    if (this._savedSession) {
      const ses = this._savedSession; this._savedSession = null;
      this.setState({ entering: false });
      if (Date.now() >= ses.endTs) this.finishFocus(ses);   // finished while away → credit the class
      else this.beginFocus(ses, true);                       // still in progress → resume
      return;
    }

    // Entrance: the pet hops out of Doraemon's "Anywhere Door" on launch.
    this.setState({ entering: true });
    this.p.action = 'enter'; this.p.busy = true;
    this.p.aStart = performance.now(); this.p.aDur = 1000;
    setTimeout(() => { if (this._mounted) { this.sfx('play'); this.spawn('play'); } }, 220);
    this._enterT = setTimeout(() => {
      if (this.p.action === 'enter') { this.p.action = 'idle'; this.p.busy = false; }
      if (this._mounted) this.setState({ entering: false });
    }, 1050);
    // Greet once the entrance lands, by time of day.
    this._greetT = setTimeout(() => {
      if (this._mounted) this.speak(pick(greetingPool(new Date().getHours(), this.state.lang)), 2800, true);
    }, 1250);
  }

  touch() { this._lastInteract = Date.now(); }

  // Interrupt a low-stakes idle behaviour (sit / leisure) back to idle. The
  // leisure setTimeouts self-guard on `p.action`, so they no-op after this.
  stand() {
    if (IDLE_ACTIONS[this.p.action]) {
      clearTimeout(this._sitT);
      this.p.action = 'idle';
      this.p.busy = false;
    }
  }
  // A deliberate action may interrupt sit/leisure, but not a real busy animation
  // (eat / play / sleep mid-run). Returns true if the caller should bail.
  busyBlocked() {
    if (IDLE_ACTIONS[this.p.action]) { this.stand(); return false; }
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
    // Consequence memory: a stuffed pet politely declines more food (no charge).
    if (cat === 'food' && this.state.fullness >= 92) {
      this.speak(t(this.state.lang, 'say.full'), 2000, true);
      this.setState({ shopCat: null });
      return;
    }
    if (this.state.money < item.cost) {
      this.speak(t(this.state.lang, 'say.noMoney'), 1800, true);
      this.setState({ shopCat: null });
      return;
    }
    this.setState((s) => ({ money: s.money - item.cost, shopCat: null, hover: false, hoverStat: null }), () => this.save());
    if (cat === 'food') { this.feed({ full: item.full, happy: item.happy || 0 }); this.awardExp(40); }
    else if (cat === 'bath') { this.bathAct({ clean: item.clean, happy: item.happy || 0 }); this.awardExp(25); }
  };

  // 玩耍 opens the mini-game picker (playing breaks focus if a session is on).
  playFree = () => {
    if (this.state.session) { this.requestBreakFocus(); return; }
    this.closeMenu();
    if (this.state.playGame) this.stopGame(); // reopening the picker ends the current game
    this.setState({ playOpen: true, hover: false, hoverStat: null, shopCat: null, schoolMenu: false, workMenu: false });
  };
  closePlay = () => { if (this.state.playGame) this.stopGame(); this.setState({ playOpen: false }); };
  // A finished mini-game round rewards happiness (and sometimes a few coins).
  gameReward = (happy, coins) => {
    this.touch();
    this.setState((s) => ({ happiness: clamp(s.happiness + (happy || 0), 0, 100), money: s.money + (coins || 0) }), () => this.save());
    this.awardExp((happy || 0) * 2 + (coins || 0) * 3); // playing earns experience too
    // Milestone reaction is acted out by the pet itself (no emoji): a happy hop.
    if (happy >= 6 && !this.p.dragging) { this.p.action = 'play'; this.p.aStart = performance.now(); this.p.aDur = 700; }
  };

  // ---- death / revive ------------------------------------------------------
  die = () => {
    if (this.state.dead) return;
    clearTimeout(this._sitT);
    if (this.state.playGame) this.stopGame();
    this.clearProp();
    this.p.action = 'dead'; this.p.busy = true;
    this.setState({ dead: true, sick: this.state.sick || 'severe', hover: false, hoverStat: null, shopCat: null, menu: null, session: null, sessionLeft: 0, schoolMenu: false, workMenu: false });
    this.sfx('sleep');
    this.speak(t(this.state.lang, 'say.collapse'), 4000, true);
    this.save();
  };
  revive = () => {
    if (this.state.money < 400) { this.speak(t(this.state.lang, 'say.noRevive'), 2200, true); return; }
    this._weakUntil = performance.now() + 90000; // ~1 "day" of weakness (-30% work pay)
    this.setState((s) => ({
      money: s.money - 400, dead: false, sick: null, health: 60,
      fullness: Math.max(s.fullness, 45), cleanliness: Math.max(s.cleanliness, 45),
      happiness: Math.max(s.happiness, 45), energy: Math.max(s.energy, 55),
    }), () => this.save());
    this.rebirth(t(this.state.lang, 'say.revived'));
  };
  restart = () => {
    this.personality = genPersonality();
    this._weakUntil = 0;
    this.clearProp();
    this.setState({
      dead: false, sick: null, health: 100,
      fullness: 70, energy: 80, cleanliness: 100, happiness: 80,
      education: 0, study: 0, money: 200, mood: 'happy',
      schoolLevel: 0, classDone: { cn: 0, en: 0, ma: 0, sc: 0 }, session: null, sessionLeft: 0,
      traits: traitLabel(this.personality),
    }, () => this.save());
    this.rebirth(t(this.state.lang, 'say.newHello'));
  };
  // Shared "pop back to life" hop + greeting (reuses the Anywhere-Door entrance).
  rebirth(line) {
    this.p.action = 'enter'; this.p.busy = true;
    this.p.aStart = performance.now(); this.p.aDur = 1000;
    this.touch(); this.sfx('play'); this.spawn('play');
    clearTimeout(this._enterT);
    this._enterT = setTimeout(() => {
      if (this.p.action === 'enter') { this.p.action = 'idle'; this.p.busy = false; }
    }, 1050);
    this.speak(line, 3000, true);
  }

  // ---- onboarding / growth -------------------------------------------------
  chooseGender = (g) => this.setState({ gender: g, onboard: 'name' });
  finishOnboard = () => {
    const name = (this.state.name || '').trim() || 'Pengu';
    this._wasGrown = false;
    this.setState({ name, onboard: null, playTime: 0 }, () => this.save());
    this.rebirth(t(this.state.lang, 'say.hatchHello', name)); // the egg pops out of the Anywhere Door
  };
  hatch = () => {
    this.spawn('play'); this.sfx('play');
    this.p.action = 'enter'; this.p.busy = true;
    this.p.aStart = performance.now(); this.p.aDur = 1000;
    clearTimeout(this._enterT);
    this._enterT = setTimeout(() => { if (this.p.action === 'enter') { this.p.action = 'idle'; this.p.busy = false; } }, 1050);
    this.speak(t(this.state.lang, 'say.grewUp'), 3500, true);
    this.save();
  };

  // ---- school / work / medicine -------------------------------------------
  openMedicine = () => { this.closeMenu(); this.setState({ shopCat: 'medicine', hover: true }); };
  useMedicine = (item) => {
    if (!this.state.sick) { this.speak(t(this.state.lang, 'say.notSick'), 2000, true); this.setState({ shopCat: null }); return; }
    if (this.state.money < item.cost) { this.speak(t(this.state.lang, 'say.noMoney'), 1800, true); this.setState({ shopCat: null }); return; }
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
    this.speak(cured ? t(this.state.lang, 'say.cured') : t(this.state.lang, 'say.partCured'), 2600, true);
    if (cured) {
      // 静养: a short rest after treatment that recovers a little more health.
      this.p.busy = true; this.p.action = 'sleep';
      clearTimeout(this._restT);
      this._restT = setTimeout(() => {
        if (this.p.action === 'sleep' && !this.state.dead) { this.p.action = 'idle'; this.p.busy = false; }
        this.setState((s) => ({ health: Math.min(100, s.health + 12) }));
        this.recompute();
      }, 3200);
    }
  };

  // 上课 / 上班 now open a picker instead of doing an instant action.
  studyAct = () => {
    this.closeMenu();
    if (this.state.session) { this.speak(t(this.state.lang, 'focus.busy'), 1800, true); return; }
    if (this.state.dead || this.state.onboard) return;
    this.setState({ schoolMenu: true, workMenu: false, hover: false, shopCat: null });
  };
  workAct = () => {
    this.closeMenu();
    if (this.state.session) { this.speak(t(this.state.lang, 'focus.busy'), 1800, true); return; }
    if (this.state.dead || this.state.onboard) return;
    this.setState({ workMenu: true, schoolMenu: false, hover: false, shopCat: null });
  };
  closeSchool = () => this.setState({ schoolMenu: false });
  closeWork = () => this.setState({ workMenu: false });

  // Jobs the pet has unlocked at its current school level.
  unlockedJobs() { return JOBS.filter((j) => j.lvl <= this.state.schoolLevel); }

  // ---- focus sessions (timed study / work) --------------------------------
  // Start a class for one subject. Runs SCHOOL[level].min real minutes.
  startClass = (subjKey) => {
    if (this.state.session) return;
    const L = this.state.lang;
    const lvl = this.state.schoolLevel;
    if (lvl >= SCHOOL.length) { this.speak(t(L, 'say.gradAll'), 2200, true); return; }
    if (this.state.sick) { this.speak(t(L, 'say.sickSeeDoc'), 2200, true); return; }
    const sc = SCHOOL[lvl];
    const subj = SUBJECTS.find((s) => s.key === subjKey);
    if ((this.state.classDone[subjKey] || 0) >= sc.per) { this.speak(t(L, 'say.subjDone', tn(subj.name, L)), 2000, true); return; }
    const endTs = Date.now() + sc.min * 60000;
    this.beginFocus({ kind: 'study', subjectKey: subjKey, label: `${tn(subj.name, L)}·${t(L, 'school.title')}`, level: lvl, minutes: sc.min, endTs });
    this.setState({ schoolMenu: false });
  };

  // Start a work shift of `minutes` (30 or 60) for JOBS[jobIdx].
  startWork = (jobIdx, minutes) => {
    if (this.state.session) return;
    const L = this.state.lang;
    const job = JOBS[jobIdx];
    if (!job || job.lvl > this.state.schoolLevel) return;
    if (this.state.sick) { this.speak(t(L, 'say.sickNoWork'), 2200, true); return; }
    const endTs = Date.now() + minutes * 60000;
    this.beginFocus({ kind: 'work', jobIdx, label: `${tn(job.name, L)}·${t(L, 'work.title')}`, minutes, endTs });
    this.setState({ workMenu: false });
  };

  beginFocus(session, resume = false) {
    this.touch();
    if (this.state.playGame) this.stopGame();
    this.stand();
    this.clearProp();
    this.p.busy = true;
    this.p.action = session.kind === 'study' ? 'study' : 'work';
    // Pixel scenes (上课 / 发传单 / 拔草) replace the old book/briefcase props.
    this.startSceneFor(session);
    if (session.kind === 'study') this.classFaceArc();
    else if (this._scene && this._scene.type === 'weed') this.weedBeats();
    else if (!this._scene) this.briefcaseProp(0); // jobs without a scene keep the briefcase (0 = persist)
    this.setState({ session, sessionLeft: Math.max(0, Math.ceil((session.endTs - Date.now()) / 1000)) });
    const L = this.state.lang;
    if (resume) this.speak(t(L, session.kind === 'study' ? 'focus.resumeClass' : 'focus.resumeWork'), 2600, true);
    else this.speak(t(L, session.kind === 'study' ? 'focus.startClass' : 'focus.startWork'), 2600, true);
  }

  clearFocus() {
    this.clearProp();
    this.stopScene(); // tear down the pixel scene + face arc + hat, clear scene canvas
    this.p.busy = false;
    if (this.p.action === 'study' || this.p.action === 'work') this.p.action = 'idle';
    this.setState({ session: null, sessionLeft: 0 });
    this.recompute();
  }

  // Ask before breaking focus so a stray click/tap doesn't wipe the session.
  requestBreakFocus = () => {
    if (!this.state.session) return false;
    this.setState({ confirmBreak: true });
    return true;
  };
  // The owner broke focus (played, quit, or stopped manually): progress is lost.
  breakFocus = () => {
    if (!this.state.session) return false;
    this.clearFocus();
    this.speak(t(this.state.lang, 'focus.distracted'), 3000, true);
    this.save();
    return true;
  };

  // Timer reached zero — grant the reward and play a happy "done" animation.
  finishFocus(ses = this.state.session) {
    if (!ses) return;
    this.clearFocus();
    if (ses.kind === 'study') {
      const sc = SCHOOL[ses.level];
      const done = { ...this.state.classDone, [ses.subjectKey]: Math.min(sc.per, (this.state.classDone[ses.subjectKey] || 0) + 1) };
      const graduated = SUBJECTS.every((s) => (done[s.key] || 0) >= sc.per);
      const subj = SUBJECTS.find((s) => s.key === ses.subjectKey);
      let schoolLevel = this.state.schoolLevel;
      let classDone = done;
      if (graduated) { schoolLevel = Math.min(SCHOOL.length, ses.level + 1); classDone = { ...FRESH_CLASSES }; }
      this.setState((s) => ({ classDone, schoolLevel, happiness: Math.min(100, s.happiness + 5), energy: Math.max(0, s.energy - 10) }), () => this.save());
      this.doneAnim('study');
      this.awardExp(graduated ? 1500 : 600); // finishing a class (or graduating) earns lots of XP
      const next = SCHOOL[schoolLevel];
      const L = this.state.lang;
      this.speak(graduated
        ? (next ? t(L, 'say.promote', tn(sc.name, L), tn(next.name, L)) : t(L, 'say.gradUni'))
        : t(L, 'say.classDone', tn(subj.name, L), done[ses.subjectKey], sc.per), 3400, true);
    } else {
      const job = JOBS[ses.jobIdx];
      const L = this.state.lang;
      const weak = this._weakUntil && performance.now() < this._weakUntil;
      const pay = Math.round(job.rate * ses.minutes * (weak ? 0.7 : 1));
      this.setState((s) => ({ money: s.money + pay, energy: Math.max(0, s.energy - 18), cleanliness: Math.max(0, s.cleanliness - 8), happiness: Math.min(100, s.happiness + 2) }), () => this.save());
      this.doneAnim('work');
      this.awardExp(Math.round(ses.minutes * 12)); // a shift earns XP scaled by its length
      this.speak(t(L, 'say.payday', tn(job.name, L), pay), 3400, true);
    }
  }

  // A cheerful finishing hop with a burst of particles.
  doneAnim(kind) {
    this.spawn('play');
    this.p.action = 'enter'; this.p.busy = true;
    this.p.aStart = performance.now(); this.p.aDur = 900;
    clearTimeout(this._enterT);
    this._enterT = setTimeout(() => { if (this.p.action === 'enter') { this.p.action = 'idle'; this.p.busy = false; } }, 950);
  }

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

  // ---- leisure & idle micro-behaviours (the pet entertains itself) ---------
  // An idle, content pet keeps itself busy: watches TV, reads, listens to music,
  // stretches, or glances around — instead of nagging the owner.
  startLeisure = () => {
    if (this.busyBlocked()) return;
    const kind = ['tv', 'read', 'music'][Math.floor(Math.random() * 3)];
    this.p.busy = true; this.p.action = kind;
    this.p.aStart = performance.now();
    const dur = 6000 + Math.floor(Math.random() * 4000);
    this.p.aDur = dur;
    if (kind === 'tv') { this.p.facing = -1; this.tvProp(dur); }
    else if (kind === 'read') this.bookProp(dur);
    else { this.spawnNote(); clearInterval(this._musicInt); this._musicInt = setInterval(() => this.spawnNote(), 620); }
    setTimeout(() => {
      clearInterval(this._musicInt);
      this.setState((s) => ({ happiness: Math.min(100, s.happiness + 5) })); // entertainment cheers it up
      if (this.p.action === kind) { this.p.action = 'idle'; this.p.busy = false; }
      this.recompute();
    }, dur);
  };
  stretchAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'stretch';
    this.p.aStart = performance.now(); this.p.aDur = 1800;
    setTimeout(() => { if (this.p.action === 'stretch') { this.p.action = 'idle'; this.p.busy = false; } }, 1800);
  };
  lookAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'look';
    this.p.aStart = performance.now(); this.p.aDur = 2000;
    setTimeout(() => { if (this.p.action === 'look') { this.p.action = 'idle'; this.p.busy = false; } }, 2000);
  };
  // Misses the owner but knows they're busy — sits and waits patiently, like a
  // good child, with a little heart drifting up (no nagging).
  waitAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'wait';
    this.p.aStart = performance.now(); this.p.aDur = 6000;
    this.heartProp();
    if (Math.random() < 0.6) this.speak(pick(DIA.miss[this.state.lang]), 3200, true);
    clearTimeout(this._heartT);
    this._heartT = setTimeout(() => { if (this.p.action === 'wait') this.heartProp(); }, 3200);
    setTimeout(() => { if (this.p.action === 'wait') { this.p.action = 'idle'; this.p.busy = false; } }, 6000);
  };

  // ---- drawn props (canvas/CSS, no emoji) ----------------------------------
  // A small TV beside the pet, flickering through channels.
  tvProp(dur) {
    const layer = this.partRef.current;
    if (!layer) return;
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:-30px;top:72px;width:34px;height:33px;z-index:4;pointer-events:none;';
    el.innerHTML =
      '<div style="position:absolute;left:6px;top:-7px;width:2px;height:9px;background:#161b3d;transform:rotate(-28deg);transform-origin:bottom"></div>' +
      '<div style="position:absolute;right:6px;top:-7px;width:2px;height:9px;background:#161b3d;transform:rotate(28deg);transform-origin:bottom"></div>' +
      '<div style="position:absolute;left:0;bottom:0;width:34px;height:26px;border-radius:5px;background:#2a3160;border:2px solid #161b3d;box-shadow:0 3px 0 rgba(34,42,85,.22)">' +
      '<div style="position:absolute;left:3px;top:3px;right:3px;bottom:3px;border-radius:2px;animation:tvFlicker .5s steps(1,end) infinite"></div></div>';
    layer.appendChild(el);
    setTimeout(() => el.remove(), dur + 120);
  }
  // An open book held in front of the pet, one page gently turning.
  bookProp(dur) {
    const layer = this.partRef.current;
    if (!layer) return;
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:34px;top:84px;width:44px;height:26px;z-index:6;pointer-events:none;animation:hintBob 1.4s ease-in-out infinite;';
    el.innerHTML =
      '<div style="position:absolute;left:0;bottom:0;width:22px;height:24px;background:#fff;border:2px solid #222a55;border-radius:4px 1px 1px 4px;transform:perspective(80px) rotateY(20deg);transform-origin:right center"></div>' +
      '<div style="position:absolute;right:0;bottom:0;width:22px;height:24px;background:#fff;border:2px solid #222a55;border-radius:1px 4px 4px 1px;transform-origin:left center;animation:pageTurn 2.4s ease-in-out infinite"></div>' +
      '<div style="position:absolute;left:7px;bottom:14px;width:8px;height:2px;background:#c2c8e0"></div>' +
      '<div style="position:absolute;left:7px;bottom:9px;width:6px;height:2px;background:#c2c8e0"></div>' +
      '<div style="position:absolute;right:7px;bottom:14px;width:8px;height:2px;background:#c2c8e0"></div>' +
      '<div style="position:absolute;right:7px;bottom:9px;width:6px;height:2px;background:#c2c8e0"></div>';
    layer.appendChild(el);
    this._lastProp = el;
    if (!dur) el.dataset.focusprop = '1'; // persistent (focus) prop — tag so clearProp always finds it
    if (dur) setTimeout(() => { if (el.parentNode) el.remove(); if (this._lastProp === el) this._lastProp = null; }, dur + 100);
  }
  // Remove persistent study/work props. Sweeps ALL tagged props (not just the
  // last) so feed/bath particles created mid-session can't orphan the book/case.
  clearProp() {
    if (this._lastProp) { this._lastProp.remove(); this._lastProp = null; }
    const layer = this.partRef.current;
    if (layer) layer.querySelectorAll('[data-focusprop]').forEach((e) => e.remove());
  }
  // A briefcase the pet carries while working.
  briefcaseProp(dur) {
    const layer = this.partRef.current;
    if (!layer) return;
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:16px;top:88px;width:28px;height:22px;z-index:6;pointer-events:none;animation:hintBob 1.1s ease-in-out infinite;';
    el.innerHTML =
      '<div style="position:absolute;left:9px;top:0;width:10px;height:6px;border:2px solid #6b4a2a;border-bottom:none;border-radius:4px 4px 0 0"></div>' +
      '<div style="position:absolute;left:0;bottom:0;width:28px;height:17px;border-radius:3px;background:#b9763f;border:2px solid #6b4a2a;box-shadow:0 2px 0 rgba(34,42,85,.2)">' +
      '<div style="position:absolute;left:50%;top:2px;bottom:2px;width:2px;margin-left:-1px;background:#6b4a2a"></div></div>';
    layer.appendChild(el);
    this._lastProp = el;
    if (!dur) el.dataset.focusprop = '1';
    if (dur) setTimeout(() => { if (el.parentNode) el.remove(); if (this._lastProp === el) this._lastProp = null; }, dur + 100);
  }
  // A single music note drifting up (called repeatedly while listening).
  spawnNote() {
    const layer = this.partRef.current;
    if (!layer) return;
    const el = document.createElement('div');
    const x = 58 + Math.floor(Math.random() * 22 - 8);
    const nx = Math.floor(Math.random() * 16 - 2);
    el.style.cssText = 'position:absolute;left:' + x + 'px;top:28px;width:9px;height:12px;z-index:6;pointer-events:none;--nx:' + nx + 'px;animation:noteRise 1.3s ease-out forwards;';
    el.innerHTML = '<div style="position:absolute;left:0;bottom:0;width:7px;height:7px;border-radius:50%;background:#5a6acf"></div>' +
      '<div style="position:absolute;left:5px;top:0;width:2px;height:9px;background:#5a6acf"></div>';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
  // A heart floating up (miss / love), tinted to the pet's gender colour.
  heartProp() {
    const layer = this.partRef.current;
    if (!layer) return;
    const col = GENDER_COLOR[this.state.gender] || '#ff5a7a';
    const el = document.createElement('div');
    const x = 54 + Math.floor(Math.random() * 16 - 6);
    const hx = Math.floor(Math.random() * 12 - 4);
    el.style.cssText = 'position:absolute;left:' + x + 'px;top:16px;width:16px;height:15px;z-index:7;pointer-events:none;--hx:' + hx + 'px;animation:heartFloat 1.6s ease-out forwards;';
    el.innerHTML = '<div style="position:absolute;left:0;top:0;width:9px;height:9px;border-radius:50%;background:' + col + '"></div>' +
      '<div style="position:absolute;right:0;top:0;width:9px;height:9px;border-radius:50%;background:' + col + '"></div>' +
      '<div style="position:absolute;left:2px;top:3px;width:12px;height:12px;background:' + col + ';transform:rotate(45deg);border-radius:0 0 3px 0"></div>';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }
  // A little puff of air bursting from the beak when it sneezes.
  sneezeProp() {
    const layer = this.partRef.current;
    if (!layer) return;
    const dir = this.p.facing;
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      const dx = dir * (22 + Math.random() * 26);
      const dy = (Math.random() - 0.5) * 24;
      const sz = 4 + Math.random() * 5;
      el.style.cssText = 'position:absolute;left:' + (dir > 0 ? 76 : 32) + 'px;top:46px;width:' + sz.toFixed(0) + 'px;height:' + sz.toFixed(0) + 'px;border-radius:50%;background:rgba(208,224,255,.9);z-index:6;pointer-events:none;--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px;animation:partPop .5s ease-out forwards;';
      layer.appendChild(el);
      setTimeout(() => el.remove(), 520);
    }
  }

  // ---- expressive one-shots (autonomous or on interaction) -----------------
  flapAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'flap';
    this.p.aStart = performance.now(); this.p.aDur = 1500;
    setTimeout(() => { if (this.p.action === 'flap') { this.p.action = 'idle'; this.p.busy = false; } }, 1500);
  };
  sneezeAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'sneeze';
    this.p.aStart = performance.now(); this.p.aDur = 950;
    setTimeout(() => { if (this.p.action === 'sneeze') { this.sneezeProp(); this.sfx('chirp'); } }, 520); // achoo!
    if (Math.random() < 0.4) this.speak(t(this.state.lang, 'say.sneeze'), 1700, true);
    setTimeout(() => { if (this.p.action === 'sneeze') { this.p.action = 'idle'; this.p.busy = false; } }, 950);
  };
  // A weak little cough while sick (reuses the hunch-forward motion, shorter).
  coughAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'sneeze';
    this.p.aStart = performance.now(); this.p.aDur = 800;
    if (Math.random() < 0.6) this.speak(t(this.state.lang, 'say.cough'), 1500, true);
    setTimeout(() => { if (this.p.action === 'sneeze') { this.p.action = 'idle'; this.p.busy = false; } }, 800);
  };
  // Wander over to the farther screen edge and peek out (fires when ignored a
  // while) — just retargets the walk; arrival drops back to idle naturally.
  edgePeek = () => {
    if (this.p.busy || this.p.action !== 'idle' || this.minX == null) return;
    const toMin = Math.abs(this.p.x - this.minX), toMax = Math.abs(this.maxX - this.p.x);
    this.p.tx = toMin > toMax ? this.minX : this.maxX;
    this.p.vel = 0; this.p.action = 'walk';
  };
  // A quick startled jump when the cursor whips across the pet.
  startleAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'enter';         // reuse the single hop arc
    this.p.aStart = performance.now(); this.p.aDur = 520;
    this.sfx('chirp');
    setTimeout(() => { if (this.p.action === 'enter') { this.p.action = 'idle'; this.p.busy = false; } }, 540);
  };
  // Stroking the pet (back-and-forth cursor over it) builds affection: happiness,
  // a persistent bond stat, a little XP, and heart-eyed delight.
  petReact() {
    if (this.busyBlocked() && this.p.action !== 'idle') return;
    this.touch();
    this.setState((s) => ({ happiness: clamp(s.happiness + 6, 0, 100), bond: (s.bond || 0) + 1 }), () => this.save());
    this.loveReact();
    if (this.heartProp) this.heartProp();
    this.speak(t(this.state.lang, 'say.petted'), 1800, true);
    this.awardExp(15);
  }
  loveReact = () => {
    this.p.busy = true; this.p.action = 'love';
    this.p.aStart = performance.now(); this.p.aDur = 1400;
    this.heartProp();
    clearTimeout(this._heartT);
    this._heartT = setTimeout(() => { if (this.p.action === 'love') this.heartProp(); }, 420);
    setTimeout(() => { if (this.p.action === 'love') this.heartProp(); }, 820);
    this.setState((s) => ({ happiness: Math.min(100, s.happiness + 6) }));
    this.sfx('chirp');
    setTimeout(() => { if (this.p.action === 'love') { this.p.action = 'idle'; this.p.busy = false; } }, 1400);
  };
  startSlide = () => {
    if (this.p.busy || this.p.action !== 'idle' || this.minX == null) return;
    const span = this.maxX - this.minX;
    const target = this.p.x + (Math.random() < 0.5 ? -1 : 1) * span * (0.35 + Math.random() * 0.4);
    this.p.tx = clamp(target, this.minX, this.maxX);
    this.p.y = this.ground;
    this.p.action = 'slide';
    this.p.speed = 132; // whee — faster than a waddle
  };
  peckAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'peck';
    this.p.aStart = performance.now(); this.p.aDur = 2200;
    this.crumbProp(2200);
    setTimeout(() => { if (this.p.action === 'peck') { this.p.action = 'idle'; this.p.busy = false; } }, 2200);
  };
  yawnAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'yawn';
    this.p.aStart = performance.now(); this.p.aDur = 1700;
    setTimeout(() => { if (this.p.action === 'yawn') { this.p.action = 'idle'; this.p.busy = false; } }, 1700);
  };
  preenAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'preen';
    this.p.aStart = performance.now(); this.p.aDur = 2400;
    setTimeout(() => this.featherProp(), 700);
    setTimeout(() => { if (this.p.action === 'preen') { this.p.action = 'idle'; this.p.busy = false; } }, 2400);
  };
  dozeAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'doze';
    this.p.aStart = performance.now(); this.p.aDur = 1700;
    setTimeout(() => { if (this.p.action === 'doze') { this.p.action = 'idle'; this.p.busy = false; } }, 1700);
  };
  waveAct = () => {
    if (this.busyBlocked()) return;
    this.p.busy = true; this.p.action = 'wave';
    this.p.aStart = performance.now(); this.p.aDur = 1400;
    setTimeout(() => { if (this.p.action === 'wave') { this.p.action = 'idle'; this.p.busy = false; } }, 1400);
  };
  // A small downy feather drifting down as the pet preens.
  featherProp() {
    const layer = this.partRef.current;
    if (!layer) return;
    const el = document.createElement('div');
    const x = 48 + Math.floor(Math.random() * 18 - 9);
    const fx = Math.floor(Math.random() * 16 - 8);
    el.style.cssText = 'position:absolute;left:' + x + 'px;top:58px;width:5px;height:9px;border-radius:50% 50% 50% 50% / 62% 62% 40% 40%;background:rgba(255,255,255,.92);border:1px solid #cfd5e6;z-index:6;pointer-events:none;--dx:' + fx + 'px;--dy:30px;animation:partPop 1.5s ease-in forwards;';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
  // A tiny crumb on the ground in front of the beak, pecked away by the end.
  crumbProp(dur) {
    const layer = this.partRef.current;
    if (!layer) return;
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:' + (this.p.facing > 0 ? 84 : 23) + 'px;top:97px;width:5px;height:4px;border-radius:2px;background:#a3793f;z-index:6;pointer-events:none;';
    layer.appendChild(el);
    setTimeout(() => el.remove(), Math.max(300, dur - 250));
  }

  // ---- focus scenes (pure pixel art, ZERO emoji) --------------------------
  // Technique (A): a wider <canvas> sibling to the penguin, drawn each frame with
  // little letter-grid sprites via drawSprite(). The penguin's own 112px sprite is
  // centred over column SCENE_OX of this canvas, so props sit around it. Three
  // scenes: 上课 (study), 发传单 / 拔草 (the two lvl-0 jobs). Everything is fillRect
  // pixels — no glyphs, no emoji. Cleared on stopScene / clearFocus / unmount.
  SCENE_W = 240; SCENE_H = 180; SCENE_OX = 64; SCENE_GND = 116; // ground baseline y
  // Game overlay canvas shares the scene canvas geometry so pieces sit around the
  // pet. Game canvas is interactive (click hit-testing); scene canvas is not.
  GAME_W = 240; GAME_H = 300; GAME_OX = 64;

  // Paint a small letter-grid sprite at (ox,oy) with px-sized cells. `flip` mirrors.
  drawSprite(ctx, grid, palette, ox, oy, px, flip) {
    const w = grid[0].length;
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const c = palette[row[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        const dx = flip ? (w - 1 - x) : x;
        ctx.fillRect(ox + dx * px, oy + y * px, px, px);
      }
    }
  }

  // Scene palette (shared letters across scene sprites; transparent = '.').
  scenePal() {
    return {
      '.': null,
      w: '#3a2a18', t: '#6b4a2a',           // desk: wood top / legs
      b: '#2c3a2c', f: '#46603e', c: '#f4f6ef', // blackboard frame / felt / chalk
      g: '#3fae4e', G: '#2f8a3b', d: '#6b4a2a',  // weed bright / dark green / dirt clod
      p: '#ffd9b0', n: '#2a3160', r: '#ff6f7a', u: '#4a7bd0', k: '#3a3f55', // people skin / navy / red / blue / dark
      W: '#ffffff', K: '#222a55', y: '#ffe27a', o: '#ff9d3d', // flyer white / ink / bulb / glow
      // ---- job-scene prop colours ----
      m: '#aebccd', M: '#5f7286', z: '#7fc8ff', e: '#eef7ff', // metal light/dark, water/soap, suds-shine
      x: '#c8995a', X: '#9c6b34', h: '#7a4a24',               // cardboard light/dark, handle brown
      a: '#2b2f3a', i: '#5ad0a0', s: '#cfd8e6', v: '#ff5a5f', // device black, screen green, steel pale, laser red
    };
  }

  // ---- scene sprite grids (authored here, drawn as pixels) ----
  sceneGrids() {
    if (this._scn) return this._scn;
    const S = {};
    // Desk: a wood top with two legs (for 上课).
    S.desk = [
      'wwwwwwwwwwwwwwww',
      'wwwwwwwwwwwwwwww',
      '.t............t.',
      '.t............t.',
      '.t............t.',
      '.t............t.',
    ];
    // Blackboard frame (empty felt); chalk content drawn separately on top.
    S.board = [
      'bbbbbbbbbbbbbbbbbb',
      'bffffffffffffffffb',
      'bffffffffffffffffb',
      'bffffffffffffffffb',
      'bffffffffffffffffb',
      'bffffffffffffffffb',
      'bffffffffffffffffb',
      'bffffffffffffffffb',
      'bbbbbbbbbbbbbbbbbb',
    ];
    // A soft round cushion the pet naps on (a "sleep spot"), drawn under it.
    S.cushion = [
      '..kkkkkkkkkkkkkk..',
      '.kuuuuuuuuuuuuuuk.',
      'kuuWWuuuuuuuuuuuuk',
      'kuuuuuuuuuuuuuuuuk',
      'kuuuuuuuuuuuuuuuuk',
      '.kuuuuuuuuuuuuuuk.',
      '..kkkkkkkkkkkkkk..',
    ];
    // Chalk content per subject (drawn in chalk 'c' over the felt).
    S.chalk_cn = [ // 语文: 十 stroke (a cross)
      '......cc......',
      '......cc......',
      'cccccccccccccc',
      'cccccccccccccc',
      '......cc......',
      '......cc......',
    ];
    S.chalk_en = [ // 英语: blocky A B letterforms
      'cccc....cccc.',
      'c..c....c..c.',
      'cccc....cccc.',
      'c..c....c..c.',
      'c..c....cccc.',
    ];
    S.chalk_ma = [ // 数学: 1+1=2 in blocky digits (1 · + · 1 · = · 2)
      '.c.....c....ccc',
      'cc..c.cc.ccc..c',
      '.c.ccc.c....ccc',
      '.c..c..c.cccc..',
      'ccc...ccc...ccc',
    ];
    S.chalk_sc = [ // 科学: a flask (round bottom + neck)
      '...cc...',
      '...cc...',
      '..cccc..',
      '.cccccc.',
      'cccccccc',
      'cccccccc',
      '.cccccc.',
    ];
    // ---- 上课 lively beats: a raised flipper (举手), a thrown chalk, a sleepy Z ----
    S.handUp = ['.KK.', '.KK.', '.KK.', 'KKKK', '.KK.'];   // a navy flipper raised to answer (K = navy in scenePal)
    S.chalkpiece = ['cc', 'cc'];                            // a flying piece of chalk
    S.zz = ['cccc', '...c', '..c.', '.c..', 'cccc'];        // a little "Z" while dozing
    S.paper = ['WWWWWW', 'WKKKKW', 'WWWWWW', 'WKKKKW', 'WWWWWW'];  // homework sheet
    S.pencil = ['....o', '...y.', '..y..', '.y...', 'k....'];      // a pencil (writing tip = k)
    // ---- 上课 subject props (drawn upper-right of the pet so each course reads) ----
    S.flask = ['.cc.', '.cc.', '.cc.', 'czzc', 'czzc', 'czzc', 'cccc'];   // 科学 beaker + liquid
    S.abacus = ['wwwwww', 'wruruw', 'wururw', 'wruruw', 'wwwwww'];        // 数学 abacus
    S.brush = ['...h', '..h.', '.h..', 'aaa.', 'aaa.', '.a..'];           // 语文 calligraphy brush
    S.inkpot = ['.kk.', 'kkkk', 'kkkk'];                                  // 语文 ink pot
    S.book = ['.cccc.', 'cWWWWc', 'cWKKWc', 'cWKKWc', 'cWWWWc', '.cccc.']; // 英语 open book
    // A pixel lightbulb (for the 恍然大悟 aha! moment) — glass + base + glow.
    S.bulb = [
      '.yyy.',
      'yyyyy',
      'yyyyy',
      'yyyyy',
      '.yyy.',
      '.kkk.',
      '.kkk.',
    ];
    // Passers-by (发传单): three little pixel figures.
    // Passers-by (发传单): full pixel people drawn at the PENGUIN's 7px scale, so
    // they're the same height as the pet (16 rows). Three distinct folks.
    S.walkerA = [ // dark hair, red shirt
      '....kkkk....', '...pppppp...', '...pppppp...', '...pppppp...',
      '....pppp....', '..rrrrrrrr..', '.prrrrrrrrp.', '.prrrrrrrrp.',
      '..rrrrrrrr..', '..rrrrrrrr..', '..nnnnnnnn..', '..nnn..nnn..',
      '..nnn..nnn..', '..nnn..nnn..', '..kk....kk..', '.kkk....kkk.',
    ];
    S.walkerB = [ // navy cap, blue shirt
      '...nnnnnn...', '..nnnnnnnn..', '...pppppp...', '...pppppp...',
      '....pppp....', '..uuuuuuuu..', '.puuuuuuuup.', '.puuuuuuuup.',
      '..uuuuuuuu..', '..uuuuuuuu..', '..kkkkkkkk..', '..kkk..kkk..',
      '..kkk..kkk..', '..kkk..kkk..', '..kk....kk..', '.kkk....kkk.',
    ];
    S.walkerC = [ // dark hair, green shirt
      '....kkkk....', '...pppppp...', '...pppppp...', '...pppppp...',
      '....pppp....', '..gggggggg..', '.pggggggggp.', '.pggggggggp.',
      '..gggggggg..', '..gggggggg..', '..nnnnnnnn..', '..nnn..nnn..',
      '..nnn..nnn..', '..nnn..nnn..', '..kk....kk..', '.kkk....kkk.',
    ];
    // A flyer: white sheet with dark "text" lines (no glyphs), pet-hand sized.
    S.flyer = [
      'WWWWWW',
      'WKKKKW',
      'WWWWWW',
      'WKKKKW',
      'WWWWWW',
    ];
    // Weed clumps (拔草) — TALL tufts at the penguin's scale (drawn at 6px).
    S.weedBig = [
      'g..g...g',
      '.gg.gg.g',
      'g.gGgGg.',
      '.gGgggG.',
      'gGgggggG',
      '.gGgggG.',
      'gGgggggG',
      '..dggd..',
      '..dddd..',
    ];
    S.weedSmall = [
      '.g.g.g',
      'g.gGg.',
      '.gggg.',
      'gGggGg',
      '..dd..',
      '.dddd.',
    ];
    S.dirtpuff = ['.dd.', 'dddd', '.dd.'];               // dirt kicked up when a weed pops
    // A small sweat drop (bright blue) for the 拔草 heat.
    S.drop = ['.u.', 'uuu', 'uuu', '.u.'];
    // ---- 洗碗 (dishwashing): a metal sink with a faucet, plates, suds, a shine ----
    S.sink = [
      '...ssss.....',   // faucet pipe + spout arm
      '...s..s.....',
      '......s.....',   // spout
      'mmmmmmmmmmmm',   // rim
      'mMzzzzzzzzMm',   // basin water
      'mMzzzzzzzzMm',
      'mMzzzzzzzzMm',
      'mMMMMMMMMMMm',   // basin body
      '.M........M.',   // legs
    ];
    S.plate = ['.WWWWWW.', 'WWeeeeWW', 'WeeeeeeW', 'WWeeeeWW', '.WWWWWW.'];
    S.bowl = ['W......W', 'WeeeeeeW', '.WeeeeW.', '.WWWWWW.'];
    S.suds = ['.ee.', 'eeee', 'eeee', '.ee.'];
    S.shine = ['..e..', '..e..', 'eeeee', '..e..', '..e..'];
    // ---- 清洁工 (cleaner): a bigger broom (handle + fanned bristles), dust, pan ----
    S.broom = [
      '..hh..',
      '..hh..',
      '..hh..',
      '..hh..',
      '..hh..',
      '.xxxx.',   // binding
      'xxxxxx',
      'xxxxxx',
      'xxxxxx',
      'x.xx.x',   // fanned bristle tips
    ];
    S.dust = ['.sss.', 'sssss', 'sssss', '.sss.'];
    S.pan = ['s......s', 'sMMMMMMs', 'sMMMMMMs', '.ssssss.'];
    S.trash = ['.k.k.', 'k.k.k'];
    // ---- 便利店店员 (clerk): a counter + register/scanner, items, receipt ----
    S.counter = ['mmmmmmmmmmmm', 'MMMMMMMMMMMM', '.M........M.', '.M........M.'];
    S.scanner = ['.aaaaaa.', 'aiiiiiia', 'aaaaaaaa', '.avvvva.', '.aaaaaa.'];   // register: display + scanner
    S.scanON = ['.aaaaaa.', 'aiiiiiia', 'aaaaaaaa', '.vvvvvv.', '.aaaaaa.'];    // laser flash on scan
    S.itemA = ['.rr.', 'rNNr', 'rNNr', 'rNNr', '.rr.'];     // a red can
    S.itemB = ['.uu.', '.uu.', 'uuuu', 'uuuu', 'uuuu'];     // a blue bottle
    S.itemC = ['xxxx', 'xXXx', 'xxxx'];                     // a small box
    S.receipt = ['WWW', 'WKW', 'WWW', 'WKW', 'WWW', 'WKW', 'WWW'];
    // ---- 快递员 (courier): bigger parcels with a tape cross + a label ----
    S.boxS = ['xxxxxx', 'xxXXxx', 'XXXXXX', 'xxXXxx', 'xWWxxx'];
    S.boxL = ['xxxxxxxx', 'xxxXXxxx', 'xxxXXxxx', 'XXXXXXXX', 'xxxXXxxx', 'xWWxXxxx', 'xxxxxxxx'];
    // ---- 程序员 (programmer): a bigger screen on a stand (code drawn live) ----
    S.screen = [
      'aaaaaaaaaaaa',
      'akkkkkkkkkka',
      'akkkkkkkkkka',
      'akkkkkkkkkka',
      'akkkkkkkkkka',
      'akkkkkkkkkka',
      'aaaaaaaaaaaa',
      '....aaaa....',   // neck
      '...aaaaaa...',   // stand base
    ];
    this._scn = S;
    return S;
  }

  ensureSceneCtx() {
    if (this._sctx) return true;
    const cv = this.sceneRef && this.sceneRef.current;
    if (!cv) return false;
    this._sctx = cv.getContext('2d');
    this._sctx.imageSmoothingEnabled = false;
    return true;
  }

  clearSceneCanvas() { if (this._sctx) this._sctx.clearRect(0, 0, this.SCENE_W, this.SCENE_H); }
  // Draw the nap cushion on the scene canvas (behind the pet) under its feet.
  drawSleepProp() {
    if (!this.ensureSceneCtx()) return;
    const ctx = this._sctx, PAL = this.scenePal(), cush = this.sceneGrids().cushion, P = 4;
    ctx.clearRect(0, 0, this.SCENE_W, this.SCENE_H);
    const w = cush[0].length * P;
    this.drawSprite(ctx, cush, PAL, this.SCENE_OX + 56 - w / 2, this.SCENE_GND - 10, P);
    this._sleepPropOn = true;
  }

  // Start the scene matching the active focus session. Sets up per-scene runtime
  // state (walkers, weeds, face-arc timer) consumed by drawScene() each frame.
  startSceneFor(session) {
    this._scene = null;
    if (!session) return;
    if (session.kind === 'study') {
      const sub = { cn: 'chalk_cn', en: 'chalk_en', ma: 'chalk_ma', sc: 'chalk_sc' };
      this._scene = { type: 'class', subj: session.subjectKey, chalk: sub[session.subjectKey] || 'chalk_cn', t0: performance.now(), beat: 'listen', chalkThrow: null };
      this._faceOverride = 'confused';
      // 英语 class — the pet dresses up as a dapper little gentleman.
      if (session.subjectKey === 'en') this._gear = 'english';
    } else if (session.kind === 'work') {
      const job = JOBS[session.jobIdx];
      const jk = job && job.key;
      if (jk === 'weed') {
        // Beat-driven 拔草: arrive → change clothes → pull weeds L→R → rest/wipe →
        // move to a new patch → repeat. weedBeats() runs the sequence.
        this._scene = { type: 'weed', weeds: [], beat: 'arrive', pull: null, pullT: 0, drops: [], puffs: [] };
        this._hatOn = false; // puts the straw hat on after arriving (换装)
      } else if (jk === 'flyer') {
        this._scene = { type: 'flyer', walkers: [], spawn: 0, took: 0, blow: null };
      } else if (jk === 'dish') {
        this._scene = { type: 'dish', suds: [], shine: 0 };
        this._gear = 'dish';
      } else if (jk === 'clean') {
        this._scene = { type: 'clean', dust: [] };
        this._gear = 'clean';
      } else if (jk === 'store') {
        this._scene = { type: 'store', itemX: 0, scanFlash: 0, receipt: 0, item: 0 };
        this._gear = 'store';
      } else if (jk === 'courier') {
        this._scene = { type: 'courier' };
        this._gear = 'courier';
      } else if (jk === 'coder') {
        this._scene = { type: 'coder', scroll: 0, bulb: 0 };
        this._gear = 'coder';
      } else if (jk === 'teacher') {
        this._scene = { type: 'teach' };
        this._gear = 'teacher';
      }
      // other jobs keep no special scene (briefcase prop handles them)
    }
  }

  // Tear down the scene: stop the face arc, take off the hat, clear the canvas.
  stopScene() {
    this._scene = null;
    this._faceOverride = null;
    this._hatOn = false;
    this._gear = null;
    clearTimeout(this._faceArcT);
    if (this.ensureSceneCtx()) this._sctx.clearRect(0, 0, this.SCENE_W, this.SCENE_H);
  }

  // Class pacing: mostly the pet just CALMLY studies / does homework for a long
  // stretch, with an OCCASIONAL lively beat (思考 / 恍然大悟 / 举手回答 / 打瞌睡→被粉笔
  // 砸醒) — not a constant loop. Re-arms itself for the whole session.
  classFaceArc() {
    const guard = () => this._scene && this._scene.type === 'class';
    const events = [
      ['think', 'think', 2600],   // a quiet ponder
      ['think', 'think', 2600],
      ['aha', 'aha', 2000],       // a small "got it!"
      ['raise', 'happy', 2200],   // raises a hand to answer
      ['doze', 'sleepy', 3000],   // nods off… (→ chalk wake)
    ];
    // Long, calm baseline: head down, doing homework.
    const study = () => {
      if (!guard()) return;
      this._scene.beat = 'study';
      this._faceOverride = 'idle';
      this._scene.bulb = false;
      this._scene.chalkThrow = null;
      this._faceArcT = setTimeout(event, 15000 + Math.random() * 12000); // ~15–27s of quiet study
    };
    // One brief interruption, then straight back to studying.
    const event = () => {
      if (!guard()) return;
      const [beat, face, ms] = events[Math.floor(Math.random() * events.length)];
      this._scene.beat = beat;
      this._faceOverride = face;
      this._scene.bulb = beat === 'aha';
      if (beat === 'raise') { const line = studyLine(this._scene.subj, this.state.lang); if (line) this.speak(line, 2400, true); }
      this._faceArcT = setTimeout(() => {
        if (!guard()) return;
        if (beat === 'doze') {
          // 被粉笔砸醒 — only ever right after actually dozing off.
          this._scene.beat = 'wake'; this._faceOverride = 'aha';
          this._scene.chalkThrow = { x: 8, y: 20 };
          this.spawn('play'); this.speak(t(this.state.lang, 'say.wokeUp'), 1600, true);
          this._faceArcT = setTimeout(study, 1100);
        } else {
          study();
        }
      }, ms);
    };
    study();
  }

  // Run the 拔草 shift as a sequence: arrive at a weedy patch → put on the work
  // hat → pull weeds one by one left-to-right (dirt puffs) → occasionally rest and
  // wipe sweat → when the patch is clear, trudge to a NEW patch and repeat.
  weedBeats() {
    const guard = () => this._scene && this._scene.type === 'weed';
    const GND = this.SCENE_GND;
    const fill = () => {
      const w = [];
      for (let i = 0; i < 6; i++) w.push({ x: 8 + i * 38, big: i % 2 === 0, seed: i, gone: false });
      this._scene.weeds = w;
    };
    const weed = () => {
      if (!guard()) return;
      this._scene.beat = 'weed';
      const next = this._scene.weeds.find((w) => !w.gone);
      if (!next) { // patch cleared → walk to a fresh patch
        this._scene.beat = 'move';
        this.speak(t(this.state.lang, 'say.weedNext'), 1900, true);
        this._faceArcT = setTimeout(() => { if (guard()) { fill(); weed(); } }, 2100);
        return;
      }
      this._scene.pull = next; this._scene.pullT = performance.now();
      this._faceArcT = setTimeout(() => {
        if (!guard()) return;
        next.gone = true;
        this._scene.puffs.push({ x: next.x + 18, y: GND - 10, life: 22 });
        this._scene.pull = null;
        if (Math.random() < 0.3) { // a breather + wipe the brow
          this._scene.beat = 'rest';
          this.speak(t(this.state.lang, 'say.wipeSweat'), 1600, true);
          this._faceArcT = setTimeout(weed, 2300);
        } else {
          this._faceArcT = setTimeout(weed, 800);
        }
      }, 1000);
    };
    this._scene.beat = 'arrive'; this._hatOn = false; fill();
    this.speak(t(this.state.lang, 'say.manyWeeds'), 1700, true);
    this._faceArcT = setTimeout(() => {
      if (!guard()) return;
      this._scene.beat = 'dress'; this._hatOn = true; // 换上工作服 (straw hat)
      this.speak(t(this.state.lang, 'say.hatOn'), 1800, true);
      this._faceArcT = setTimeout(weed, 1500);
    }, 1800);
  }

  // Draw the subject-specific "what am I learning" prop up-right of the pet —
  // 科学 a bubbling flask, 数学 an abacus, 语文 a brush + ink, 英语 an open book.
  drawClassSubject(ctx, PAL, G, t, cx, GND, PB, sc) {
    if (sc.chalk === 'chalk_sc') {
      const fx = cx + 40, fy = GND - 56;
      this.drawSprite(ctx, G.flask, PAL, fx, fy, PB);
      if (!sc.fb) sc.fb = [];
      if (Math.random() < 0.16 && sc.fb.length < 8) sc.fb.push({ x: fx + 6 + Math.random() * 8, y: fy + 12, vy: -(0.4 + Math.random() * 0.5) });
      ctx.fillStyle = '#7fc8ff';
      sc.fb.forEach((b) => { b.y += b.vy; ctx.fillRect(b.x, b.y, 4, 4); });
      sc.fb = sc.fb.filter((b) => b.y > fy - 18);
      if (Math.floor(t / 240) % 5 === 0) { ctx.fillStyle = '#ffe27a'; ctx.fillRect(fx + 14, fy - 4, 4, 4); }
    } else if (sc.chalk === 'chalk_ma') {
      const ax = cx + 36, ay = GND - 44;
      this.drawSprite(ctx, G.abacus, PAL, ax, ay, PB);
      ctx.fillStyle = '#ffd23d';
      ctx.fillRect(ax + 6 + (Math.floor(t / 500) % 4) * 6, ay - 6, 5, 5);
    } else if (sc.chalk === 'chalk_cn') {
      const bxp = cx + 44, byp = GND - 50 + Math.abs(Math.sin(t / 260)) * 8;
      this.drawSprite(ctx, G.inkpot, PAL, cx + 38, GND - 18, PB);
      this.drawSprite(ctx, G.brush, PAL, bxp, byp, PB);
    } else {
      const kx = cx + 40, ky = GND - 50;
      this.drawSprite(ctx, G.book, PAL, kx, ky, PB);
      if (!sc.fb) sc.fb = [];
      if (Math.random() < 0.04 && sc.fb.length < 4) sc.fb.push({ x: kx + 6 + Math.random() * 14, y: ky - 2, vy: -0.5 });
      ctx.fillStyle = '#f4f6ef';
      sc.fb.forEach((b) => { b.y += b.vy; ctx.fillRect(b.x, b.y, 4, 6); });
      sc.fb = sc.fb.filter((b) => b.y > ky - 22);
    }
  }

  // Per-frame scene render (called from the loop). Pure pixel fillRect, no glyphs.
  drawScene(t) {
    if (!this._scene || !this.ensureSceneCtx()) return;
    const ctx = this._sctx, PAL = this.scenePal(), G = this.sceneGrids();
    const OX = this.SCENE_OX, GND = this.SCENE_GND, P = 4;
    ctx.clearRect(0, 0, this.SCENE_W, this.SCENE_H);
    const sc = this._scene;
    const cx = OX + 56; // penguin centre column on the scene canvas

    if (sc.type === 'class') {
      // Mostly a calm student doing homework; the board only shows on the brief
      // "think" beat, and the lively beats are occasional (see classFaceArc).
      const PB = P + 1;
      const beat = sc.beat || 'study';
      if (beat === 'think') {
        const bx = cx - 120, by = 6;
        this.drawSprite(ctx, G.board, PAL, bx, by, P);
        const chalk = G[sc.chalk];
        const cw = chalk[0].length * P, ch = chalk.length * P;
        this.drawSprite(ctx, chalk, PAL, bx + (G.board[0].length * P - cw) / 2, by + (G.board.length * P - ch) / 2, P);
      }
      this.drawSprite(ctx, G.desk, PAL, cx - 60, GND - 24, P); // desk (always)
      if (beat === 'study') {
        // Quietly doing homework: a sheet on the right with a pencil scribbling.
        const px = cx + 44, py = GND - 30;
        this.drawSprite(ctx, G.paper, PAL, px, py, PB);
        const sx = px + 6 + (Math.sin(t / 200) * 0.5 + 0.5) * 14;
        const syy = py + 6 + Math.abs(Math.sin(t / 95)) * 8;
        this.drawSprite(ctx, G.pencil, PAL, sx, syy, PB);
      }
      // The subject prop (the knowledge focus) shows on the active learning beats.
      if (beat === 'think' || beat === 'aha' || beat === 'raise') {
        this.drawClassSubject(ctx, PAL, G, t, cx, GND, PB, sc);
      }
      // Beat flourishes — what the little student is actually doing. These sit in
      // the clear right/left margins (the scene canvas is behind the wide body).
      if (beat === 'raise') {
        // 举手回答: a raised flipper bobs eagerly beside it with a chalk "!".
        const hx = cx + 46, hy = GND - 72 - Math.abs(Math.sin(t / 150)) * 6;
        this.drawSprite(ctx, G.handUp, PAL, hx, hy, PB);
        ctx.fillStyle = '#ffe27a';
        ctx.fillRect(hx + 6, hy - 18, 4, 10); ctx.fillRect(hx + 6, hy - 5, 4, 4);
      } else if (beat === 'doze') {
        // 打瞌睡: Z's drift up the right margin from the dozing head.
        if (!sc.zz) sc.zz = [];
        if (Math.random() < 0.07 && sc.zz.length < 3) sc.zz.push({ x: cx + 44, y: GND - 78 });
        sc.zz.forEach((z) => { z.y -= 0.5; z.x += 0.25; this.drawSprite(ctx, G.zz, PAL, z.x, z.y, z.y < 30 ? 4 : 3); });
        sc.zz = sc.zz.filter((z) => z.y > 6);
      } else if (beat === 'wake' && sc.chalkThrow) {
        // 被粉笔砸醒: a chalk flies in from the teacher's (board) side toward the head.
        const ct = sc.chalkThrow; ct.x += 7; ct.y += 1.2;
        this.drawSprite(ctx, G.chalkpiece, PAL, ct.x, ct.y, 4);
      }
      // 恍然大悟 bulb beside the head (no room above a standing pet).
      if (sc.bulb) {
        const bx2 = cx - 46, byy = 8 + Math.sin(t / 150) * 2;
        ctx.fillStyle = 'rgba(255,226,122,.35)'; ctx.fillRect(bx2 - 6, byy - 2, 36, 36);
        this.drawSprite(ctx, G.bulb, PAL, bx2, byy, PB);
      }
      return;
    }

    if (sc.type === 'flyer') {
      // Passers-by are full pixel people the SAME height as the pet (drawn at 7px).
      const WP = 7, wW = G.walkerA[0].length * WP, wTop = GND - G.walkerA.length * WP;
      sc.spawn -= 1;
      if (sc.spawn <= 0 && sc.walkers.length < 2) {
        const fromLeft = Math.random() < 0.5;
        const kind = ['walkerA', 'walkerB', 'walkerC'][Math.floor(Math.random() * 3)];
        sc.walkers.push({ x: fromLeft ? -wW : this.SCENE_W + wW, dir: fromLeft ? 1 : -1, kind, took: Math.random() < 0.6, gave: false });
        sc.spawn = 150 + Math.floor(Math.random() * 120);
      }
      // The pet holds a flyer out toward its facing side.
      const hold = cx + (this.p.facing > 0 ? 26 : -38);
      this.drawSprite(ctx, G.flyer, PAL, hold, GND - 40 + Math.sin(t / 220) * 2, P);
      for (const w of sc.walkers) {
        w.x += w.dir * 1.1;
        const bob = (Math.floor(t / 170) % 2 ? 0 : -2); // little walk bob
        this.drawSprite(ctx, G[w.kind], PAL, w.x, wTop + bob, WP, w.dir < 0);
        // Hand a flyer over (at the person's hand height) as they pass the pet.
        const near = Math.abs((w.x + wW / 2) - cx) < 40;
        if (near && w.took && !w.gave) { w.gave = true; sc.took++; }
        if (near && w.took) this.drawSprite(ctx, G.flyer, PAL, w.x + (w.dir > 0 ? -10 : wW - 14), GND - 64, P);
      }
      sc.walkers = sc.walkers.filter((w) => w.x > -wW - 10 && w.x < this.SCENE_W + wW + 10);
      // Occasionally a flyer blows away across the top of the scene.
      if (!sc.blow && Math.random() < 0.004) sc.blow = { x: cx, y: GND - 40, vx: 1.4 };
      if (sc.blow) {
        sc.blow.x += sc.blow.vx; sc.blow.y -= 0.9; sc.blow.vx += 0.02;
        this.drawSprite(ctx, G.flyer, PAL, sc.blow.x, sc.blow.y + Math.sin(t / 120) * 4, P, true);
        if (sc.blow.x > this.SCENE_W + 30 || sc.blow.y < -20) sc.blow = null;
      }
      return;
    }

    if (sc.type === 'weed') {
      // Tall weeds across the patch; cleared one-by-one left→right by weedBeats().
      const WP = 6;
      (sc.weeds || []).forEach((wd) => {
        if (wd.gone) return;
        const grid = wd.big ? G.weedBig : G.weedSmall;
        const sway = Math.sin(t / 400 + wd.seed * 6) * 2;
        const pulling = sc.pull === wd;                  // the one being yanked shakes + lifts
        const shake = pulling ? Math.sin(t / 35) * 3 : 0;
        const lift = pulling ? Math.min(10, (performance.now() - (sc.pullT || 0)) / 90) : 0;
        this.drawSprite(ctx, grid, PAL, wd.x + sway + shake, GND - grid.length * WP + lift, WP);
      });
      // Dirt puffs when a weed pops out.
      (sc.puffs || []).forEach((p) => { p.life -= 1; p.y -= 0.4; this.drawSprite(ctx, G.dirtpuff, PAL, p.x, p.y, 4); });
      sc.puffs = (sc.puffs || []).filter((p) => p.life > 0);
      // Sweat drops + a wipe only while resting (catching its breath).
      if (sc.beat === 'rest' && Math.random() < 0.12) sc.drops.push({ x: cx + (Math.random() * 24 - 6), y: 26, vy: 1 });
      sc.drops.forEach((d) => { d.y += d.vy; d.vy += 0.08; this.drawSprite(ctx, G.drop, PAL, d.x, d.y, 3); });
      sc.drops = sc.drops.filter((d) => d.y < GND);
      return;
    }

    if (sc.type === 'dish') {
      // The pet (in its apron) stands at a sink on its facing side and scrubs a
      // plate; suds rise and a "squeaky clean" shine pops when one is finished.
      // The scene canvas sits BEHIND the pet, so the sink goes beside the body.
      const PB = P + 1;                                  // bigger hero props (more detail reads)
      const right = this.p.facing > 0;
      const sinkW = G.sink[0].length * PB;
      const sinkX = right ? cx + 22 : cx - 22 - sinkW, sinkY = GND - G.sink.length * PB + 8;
      this.drawSprite(ctx, G.sink, PAL, sinkX, sinkY, PB);
      const basinTop = sinkY + 3 * PB, mid = sinkX + sinkW / 2;
      // Plate/bowl scrubbed back-and-forth inside the basin (variant rotates).
      const scrub = Math.sin(t / 110) * 6;
      const variant = Math.floor(t / 3600) % 2;
      const dishG = variant ? G.bowl : G.plate;
      const dishX = mid - dishG[0].length * PB / 2 + scrub, dishY = basinTop - 4 + Math.sin(t / 80) * 1.5;
      this.drawSprite(ctx, dishG, PAL, dishX, dishY, PB);
      // Suds bubble up out of the sink.
      if (Math.random() < 0.18 && sc.suds.length < 14) {
        sc.suds.push({ x: sinkX + 10 + Math.random() * (sinkW - 20), y: basinTop, vy: -(0.4 + Math.random() * 0.7), px: Math.random() < 0.5 ? 3 : 4 });
      }
      sc.suds.forEach((b) => { b.y += b.vy; b.x += Math.sin((t + b.y * 8) / 200) * 0.4; this.drawSprite(ctx, G.suds, PAL, b.x, b.y, b.px); });
      sc.suds = sc.suds.filter((b) => b.y > 2);
      // A clean-shine sparkle over the plate now and then.
      if (sc.shine > 0) {
        sc.shine -= 1;
        this.drawSprite(ctx, G.shine, PAL, dishX + 8, dishY - 12, 4);
      } else if (Math.random() < 0.01) {
        sc.shine = 24;
      }
      return;
    }

    if (sc.type === 'clean') {
      // The pet (in its cap) holds a broom to its facing side and sweeps it
      // back and forth; dust puffs kick off the bristles. A dustpan waits on
      // the far side. The broom handle points back toward the pet's flipper.
      const PB = P + 1;
      const right = this.p.facing > 0;
      const sweep = Math.sin(t / 280);                  // -1..1
      const broomX = (right ? cx + 40 : cx - 64) + sweep * 9;
      const broomY = GND - G.broom.length * PB + 6 + Math.sin(t / 140) * 2;
      this.drawSprite(ctx, G.broom, PAL, broomX, broomY, PB);
      const tip = broomX + G.broom[0].length * PB / 2;  // bristle tip x
      // Dust puffs kick off the bristles mid-sweep (fastest part).
      if (Math.abs(Math.cos(t / 280)) > 0.55 && Math.random() < 0.22 && sc.dust.length < 12) {
        sc.dust.push({ x: tip + (Math.random() * 16 - 8), y: GND - 6, vy: -(0.3 + Math.random() * 0.5), life: 22 + Math.random() * 16, px: Math.random() < 0.5 ? 3 : 4 });
      }
      sc.dust.forEach((d) => { d.y += d.vy; d.life -= 1; this.drawSprite(ctx, G.dust, PAL, d.x, d.y, d.px); });
      sc.dust = sc.dust.filter((d) => d.life > 0);
      // A dustpan on the floor on the opposite side; trash bits by it (variant).
      const panX = right ? cx - 92 : cx + 56, panY = GND - 4;
      this.drawSprite(ctx, G.pan, PAL, panX, panY, PB);
      if (Math.floor(t / 4000) % 2) this.drawSprite(ctx, G.trash, PAL, panX + 30, GND - 6, 4);
      return;
    }

    if (sc.type === 'store') {
      // The pet (in its visor + vest) works a counter: items slide along it past
      // a scanner whose laser flashes on each scan, and a receipt prints out.
      const PB = P + 1;
      const right = this.p.facing > 0;
      const cW = G.counter[0].length * PB;
      const counterX = right ? cx + 20 : cx - 20 - cW, counterY = GND - G.counter.length * PB + 4;
      this.drawSprite(ctx, G.counter, PAL, counterX, counterY, PB);
      const scanX = counterX + cW - G.scanner[0].length * PB - 4, scanY = counterY - G.scanner.length * PB + 2;
      // An item slides across the counter toward the register, then a new one.
      sc.itemX += 1.1;
      const span = cW - 24;
      if (sc.itemX > span) { sc.itemX = 0; sc.item = (sc.item + 1) % 3; }
      const itemG = sc.item === 0 ? G.itemA : (sc.item === 1 ? G.itemB : G.itemC);
      const itX = counterX + cW - 20 - sc.itemX, itY = counterY - itemG.length * PB + 2;
      this.drawSprite(ctx, itemG, PAL, itX, itY, PB);
      // Scan when the item crosses the register: flash the laser + grow the receipt.
      if (Math.abs(itX - scanX) < 8 && sc.scanFlash <= 0) { sc.scanFlash = 10; sc.receipt = Math.min(7, sc.receipt + 2); }
      if (sc.scanFlash > 0) sc.scanFlash -= 1;
      this.drawSprite(ctx, sc.scanFlash > 0 ? G.scanON : G.scanner, PAL, scanX, scanY, PB);
      // A receipt prints downward from the register; tears off when long.
      if (sc.receipt > 0) {
        const r = G.receipt.slice(0, sc.receipt);
        this.drawSprite(ctx, r, PAL, scanX + 4, counterY + 4, 4);
        if (sc.receipt >= 7 && Math.random() < 0.02) sc.receipt = 0; // tear off
      }
      return;
    }

    if (sc.type === 'courier') {
      // The pet (in its hi-viz cap + vest) carries a parcel that bobs as it jogs
      // in place, with a stack of parcels waiting to the side.
      const PB = P + 1;
      const right = this.p.facing > 0;
      // A waiting pile of parcels on one side.
      const pileX = right ? cx - 96 : cx + 52;
      this.drawSprite(ctx, G.boxL, PAL, pileX, GND - G.boxL.length * PB, PB);
      this.drawSprite(ctx, G.boxS, PAL, pileX + 6, GND - G.boxL.length * PB - G.boxS.length * PB + 2, PB);
      // The carried parcel (size rotates) held at the pet's side, bobbing.
      const big = Math.floor(t / 3200) % 2 === 0;
      const carriedG = big ? G.boxL : G.boxS;
      const cyBob = Math.abs(Math.sin(t / 130)) * 4;     // jog bob
      const cX = right ? cx + 28 : cx - 28 - carriedG[0].length * PB;
      this.drawSprite(ctx, carriedG, PAL, cX, GND - 62 - cyBob, PB);
      // Little speed/jog dashes behind it now and then.
      if (Math.floor(t / 180) % 2) {
        ctx.fillStyle = '#cfd8e6';
        const dx = right ? cx + 20 : cx + 36;
        ctx.fillRect(dx, GND - 44, 8, 3);
        ctx.fillRect(dx - 5, GND - 34, 10, 3);
      }
      return;
    }

    if (sc.type === 'coder') {
      // The pet (in headphones) types at a screen: code lines scroll with a
      // blinking cursor, the odd error line goes red then green (bug fixed) and
      // a pixel lightbulb pops over its head.
      const PB = P + 1;
      const right = this.p.facing > 0;
      const sw2 = G.screen[0].length * PB;
      const sx = right ? cx + 30 : cx - 30 - sw2, sy = GND - 64;
      this.drawSprite(ctx, G.screen, PAL, sx, sy, PB);
      const ix = sx + PB, iy = sy + PB;                   // screen interior origin
      const lens = [16, 30, 10, 24, 36, 14, 22];
      sc.scroll += 0.35;
      const off = Math.floor(sc.scroll) % lens.length;
      for (let i = 0; i < 5; i++) {
        const k = (off + i) % lens.length;
        const err = sc.bulb <= 0 && k === 2;              // an unfixed error line
        ctx.fillStyle = err ? '#ff5a5f' : '#5ad0a0';
        ctx.fillRect(ix + 3, iy + 2 + i * 8, lens[k], 4);
      }
      if (Math.floor(t / 300) % 2) { ctx.fillStyle = '#eef7ff'; ctx.fillRect(ix + 24, iy + 2 + 4 * 8, 4, 4); }
      // Bug-fixed! a lightbulb pops beside the head (no room above a standing pet).
      if (sc.bulb > 0) {
        sc.bulb -= 1;
        const bx = right ? cx - 48 : cx + 28, byy = 8 + Math.sin(t / 150) * 2;
        ctx.fillStyle = 'rgba(255,226,122,.35)'; ctx.fillRect(bx - 8, byy - 4, 40, 40);
        this.drawSprite(ctx, G.bulb, PAL, bx, byy, P + 1);
      } else if (Math.random() < 0.006) {
        sc.bulb = 32;
      }
      return;
    }

    if (sc.type === 'teach') {
      // The pet (in glasses + bow tie) points a pointer at a chalkboard whose
      // subject rotates; the pointer taps along the lines and chalk marks flash.
      const right = this.p.facing > 0;
      const bw = G.board[0].length * P, bh = G.board.length * P;
      const boardX = right ? cx + 44 : cx - 44 - bw, boardY = 8;
      this.drawSprite(ctx, G.board, PAL, boardX, boardY, P);
      const subs = ['chalk_cn', 'chalk_en', 'chalk_ma', 'chalk_sc'];
      const chalk = G[subs[Math.floor(t / 6000) % subs.length]];
      const cw = chalk[0].length * P, chh = chalk.length * P;
      this.drawSprite(ctx, chalk, PAL, boardX + (bw - cw) / 2, boardY + (bh - chh) / 2, P);
      // The pointer runs from the pet's flipper to a tap point on the board.
      const handX = right ? cx + 28 : cx - 28, handY = GND - 48;
      const tapStep = Math.floor(t / 700) % 3;
      const tapX = right ? boardX + 8 : boardX + bw - 8;
      const tapY = boardY + 12 + tapStep * 9 + Math.sin(t / 120) * 1.5;
      ctx.fillStyle = '#7a4a24';
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        ctx.fillRect(Math.round(handX + (tapX - handX) * u) - 2, Math.round(handY + (tapY - handY) * u) - 2, 4, 4);
      }
      // A chalk-tap mark flashes at the pointer tip.
      if (Math.floor(t / 260) % 2) { ctx.fillStyle = '#f4f6ef'; ctx.fillRect(tapX - 2, Math.round(tapY) - 2, 4, 4); }
      return;
    }
  }

  // ---- 玩耍 mini-games (in-window, penguin-driven, pure pixel art) ----------
  // The GameEngine paints pixel pieces onto the interactive game canvas overlay
  // and acts the penguin out via this host API. Geometry mirrors the scene
  // canvas: the pet's centre column is GAME_OX+56 and its feet sit at the same
  // baseline, so wand/fish/hands land naturally around the real pet.
  ensureGameCtx() {
    if (this._gctx) return true;
    const cv = this.gameRef && this.gameRef.current;
    if (!cv) return false;
    this._gctx = cv.getContext('2d');
    this._gctx.imageSmoothingEnabled = false;
    return true;
  }
  gameHost() {
    return {
      reward: (h, c) => this.gameReward(h, c),
      setAction: (name, dur) => {
        if (this.p.dragging) return;
        this.p.action = name; this.p.aStart = performance.now(); this.p.aDur = dur || 500;
        clearTimeout(this._gameActT);
        this._gameActT = setTimeout(() => { if (this.state.playGame && !this.p.dragging && (this.p.action === name)) this.p.action = 'idle'; }, dur || 500);
      },
      setFace: (face, ms) => { this._gameFace = face; clearTimeout(this._gameFaceT); this._gameFaceT = setTimeout(() => { this._gameFace = null; }, ms || 600); },
      speak: (txt, ms) => this.speak(txt, ms || 1400, true),
      facing: () => this.p.facing,
      facingTo: (dir) => { this.p.facing = dir < 0 ? -1 : 1; },
      onScore: (g, s) => { if (this.state.gameScore !== s) this.setState({ gameScore: s }); },
    };
  }
  // Start a chosen game in-window: hide the picker, spin up the engine. Games
  // flagged `full` grow the window to the whole screen ("stage mode") so pieces
  // (e.g. bubbles) can use the full height instead of the small pet window.
  startGame = (key) => {
    if (this.state.session) { this.requestBreakFocus(); return; }
    this.p.busy = false;
    const g = GAME_LIST.find((x) => x.key === key);
    const full = !!(g && g.full) && this.work;
    if (full) { stageWindow(true); this._stage = true; }
    this.setState({ playOpen: false, playGame: key, gameScore: 0, stage: full, stageW: full ? this.work.width : 0, stageH: full ? this.work.height : 0 }, () => {
      // wait a frame so the canvas re-sizes to the stage before wiring the engine
      setTimeout(() => {
        this._gctx = null; // canvas dims changed → re-grab its context
        if (!this.ensureGameCtx()) { setTimeout(() => this.startGame(key), 60); return; }
        const geom = this.state.stage
          ? { W: this.state.stageW, H: this.state.stageH, OX: 0, cx: Math.round(this.state.stageW / 2), gnd: this.state.stageH - 40 }
          : { W: this.GAME_W, H: this.GAME_H, OX: this.GAME_OX, cx: this.GAME_OX + 56, gnd: this.SCENE_GND };
        if (!this._engine) this._engine = new GameEngine(this._gctx, geom, this.gameHost());
        else { this._engine.ctx = this._gctx; this._engine.geom = geom; this._engine.host = this.gameHost(); }
        this._engine.start(key);
        this.refreshInteractive();
      }, full ? 60 : 0);
    });
  };
  // End the active game: tear down pieces/timers, clear the canvas, idle the pet,
  // and restore the small window if we were in stage mode.
  stopGame = () => {
    if (this._engine) this._engine.stop();
    clearTimeout(this._gameFaceT); clearTimeout(this._gameActT);
    this._gameFace = null;
    if (this.ensureGameCtx()) this._gctx.clearRect(0, 0, this._gctx.canvas.width, this._gctx.canvas.height);
    if (!this.p.dragging && (this.p.action === 'play' || this.p.action === 'eat' || this.p.action === 'swing')) this.p.action = 'idle';
    if (this._stage) { stageWindow(false); this._stage = false; }
    this._gctx = null; // canvas will resize back → re-grab next time
    this.setState({ playGame: null, stage: false }, () => { this.pushWindow(true); this.refreshInteractive(); });
  };
  // A click on the game canvas -> hand local pixel coords to the engine.
  onGameClick = (e) => {
    if (!this._engine || !this.state.playGame) return;
    const cv = this.gameRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const gx = (e.clientX - r.left) * (cv.width / r.width);
    const gy = (e.clientY - r.top) * (cv.height / r.height);
    this._engine.click(gx, gy);
  };

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
      // First-ever spawn: appear in the CENTRE of the screen (not tucked at the
      // bottom). The pet roams along this height until you drag it elsewhere.
      this.p.x = clamp(this.work.x + this.work.width / 2 - this.WIN_W / 2, this.minX, this.maxX);
      this.ground = clamp(this.work.y + this.work.height / 2 - this.PEN_H / 2 - this.offY, this.minY, this.maxY);
      this.p.y = this.ground;
      this.p.tx = this.p.x;
      this._placed = true;
    }
    this.p.x = clamp(this.p.x, this.minX, this.maxX);
    this.p.y = clamp(this.p.y, this.minY, this.maxY);
    this.pushWindow(true);
  }

  // Recall the pet to the centre of the work area. Triggered from the tray icon
  // or the right-click menu — the rescue hatch for when the penguin has wandered
  // (or been dragged) off-screen and can't be reached. Interrupts whatever it's
  // doing, re-clamps, snaps the window back, and persists the new spot.
  recenter() {
    if (!this.work) return;
    this.stand();
    this.p.action = 'idle';
    this.p.busy = false;
    this.p.dragging = false;
    this.p.x = clamp(this.work.x + this.work.width / 2 - this.WIN_W / 2, this.minX, this.maxX);
    this.ground = clamp(this.work.y + this.work.height / 2 - this.PEN_H / 2 - this.offY, this.minY, this.maxY);
    this.p.y = this.ground;
    this.p.tx = this.p.x;
    this._placed = true;
    this.pushWindow(true);
    this.save();
    if (this._mounted) this.speak(t(this.state.lang, 'say.backAgain'), 1800, true);
  }

  pushWindow(force) {
    if (!this._placed) return;
    if (this._stage) return; // window is full-screen for a stage-mode game; don't move it
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
    // The login gate + confirm popup are full-window modals: the window MUST be
    // interactive then, or clicks pass through and the inputs can't be focused.
    const gateUp = cloudEnabled() && s.authChecked && !s.user;
    const v = !!(this._overPen || this.p.dragging || s.hover || s.shopCat || s.menu || s.settingsOpen || s.dead || s.onboard || s.schoolMenu || s.workMenu || s.playOpen || s.playGame || gateUp || s.confirmBreak || s.update || s.updateReady);
    if (v !== this._iv) { this._iv = v; setInteractive(v); }
  }
  // Show the care panel while the cursor is over the penguin OR the open panel
  // (so you can move from pet → buttons without it closing); hide after a beat.
  onHover(e) {
    const pen = this.penRef.current;
    if (!pen) return;
    // An idle pet turns to watch the cursor as it moves around the window.
    const r0 = pen.getBoundingClientRect();
    const cx0 = (r0.left + r0.right) / 2;
    this._cursorDir = e.clientX < cx0 ? -1 : 1; // for the look-toward-cursor lean
    if (this.p.action === 'idle' && !this.p.dragging && this.isGrown()) {
      this.p.facing = this._cursorDir;
    }
    const pad = 8;
    const inRect = (r) => !!r && e.clientX >= r.left - pad && e.clientX <= r.right + pad &&
      e.clientY >= r.top - pad && e.clientY <= r.bottom + pad;
    let over = inRect(pen.getBoundingClientRect());
    if (!over && (this.state.hover || this.state.shopCat) && this.hoverRef.current) over = inRect(this.hoverRef.current.getBoundingClientRect());

    // Pointer dynamics over the pet: a fast whip-past startles it; slow
    // back-and-forth strokes pet it. Both only while it's calmly idle.
    const nowP = performance.now();
    if (this._lastPtr && over && this.isGrown() && !this.p.dragging) {
      const dtp = nowP - this._lastPtr.t;
      if (dtp > 0) {
        const dx = e.clientX - this._lastPtr.x;
        const spd = Math.hypot(dx, e.clientY - this._lastPtr.y) / dtp; // px/ms
        if (spd > 2.4 && this.p.action === 'idle' && nowP > (this._startleCD || 0)) {
          this._startleCD = nowP + 6000; this._strokeCount = 0; this.startleAct();
        } else if (spd < 1.6 && Math.sign(dx)) {
          // count direction reversals as strokes
          if (this._strokeDir && Math.sign(dx) !== this._strokeDir) {
            this._strokeCount = (this._strokeCount || 0) + 1;
            if (this._strokeCount >= 4 && (this.p.action === 'idle' || this.p.action === 'sit') && nowP > (this._petCD || 0)) {
              this._petCD = nowP + 8000; this._strokeCount = 0; this.petReact();
            }
          }
          this._strokeDir = Math.sign(dx);
        }
      }
    }
    this._lastPtr = { x: e.clientX, y: e.clientY, t: nowP };

    if (over) {
      if (this._hideHoverT) { clearTimeout(this._hideHoverT); this._hideHoverT = null; }
      if (!this._overPen) {
        this._overPen = true; this.refreshInteractive();
        // greet when the cursor first comes near (debounced): a warm "welcome
        // back" after a long absence, otherwise just a little wave.
        if (this.p.action === 'idle' && this.isGrown() && performance.now() > (this._waveCD || 0)) {
          this._waveCD = performance.now() + 16000; this.waveAct();
          if (Date.now() - (this._lastInteract || 0) > 300000) this.speak(t(this.state.lang, 'say.welcomeBack'), 2600, true);
        }
      }
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
      '..DLLLLLLLLLLD..', '..DDLLLLLLLLDD..', '...SSSSSSSSSS...', '..DDDLLLLLLDDD..',
      '..DDDLLLLLLDDD..', '..DDDLLLLLLDDD..', '...DDLLLLLLDD...', '....OO....OO....',
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
      love: sw(idle, [[5, '..DLLCCLLCCLLD..'], [6, '..DLLCCLLCCLLD..'], [8, '..DLLLLOOLLLLD..']]), // heart eyes + smile
      yawn: sw(idle, [[6, this.CLOSED], [7, '..DLLLEEEELLLD..'], [8, '..DLLLEEEELLLD..']]), // shut eyes + wide open mouth
      // ---- class-scene expression arc (疑惑 to 思考 to 恍然大悟), all drawn ----
      // 疑惑: slanted little brows + small dot eyes + tiny frown
      confused: sw(idle, [[5, '..DLDLLLLLLDLD..'], [6, '..DLLELLLLELLD..'], [8, '..DLLLOOLLLLLD..']]),
      // 思考: eyes glance up (eye pixels raised a row) + neutral beak
      think: sw(idle, [[5, '..DLLELLLLELLD..'], [6, '..DLLLLLLLLLLD..'], [8, '..DLLLLOOLLLLD..']]),
      // 恍然大悟: wide bright eyes + open beak (the "aha!" moment)
      aha: sw(idle, [[5, '..DLEELLEELLLD..'], [6, '..DLEELLEELLLD..'], [7, '..DLCLLOOLLCLD..'], [8, '..DLLLOOOOLLLD..']]),
      // 坐下: a content smile, a settled wider bottom, and flat feet stuck out
      // FORWARD — a real penguin-sitting silhouette (paired with a squash below).
      sit: sw(idle, [[8, '..DLLLLOOLLLLD..'], [14, '..DDLLLLLLLLDD..'], [15, '..OOOO....OOOO..']]),
      // ---- Code Buddy reactions (transient; the pet returns to idle after) ----
      // panic: worried slanted brows + big startled eyes (paired with a runtime
      // shake + a sweat-drop overlay). Fires on a Claude Code error / test fail.
      panic: sw(idle, [[5, '..DLDLLLLLLDLD..'], [6, '..DLEELLLLEELD..']]),
      // cheer: sparkly eyes + wide open smile (paired with a runtime hop). Fires
      // when Claude finishes a turn or tests pass.
      cheer: sw(idle, [[6, '..DLELELLELELD..'], [7, '..DLCLLEELLCLD..'], [8, '..DLLLOOOOLLLD..']]),
      // notice: raised alert eyes + open beak. Fires to get the dev's attention
      // (session start / needs permission / a fresh prompt).
      notice: sw(idle, [[5, '..DLEELLEELLLD..'], [6, '..DLEELLEELLLD..'], [7, '..DLCLLOOLLCLD..'], [8, '..DLLLOOOOLLLD..']]),
    };
    // Egg / baby stage: a cute baby penguin (big sparkly eyes, tiny beak) sitting
    // in a cracked egg shell with a zigzag rim and a gender-coloured ribbon (R).
    const egg = [
      '......DDDD......', '....DDDDDDDD....', '...DDDDDDDDDD...', '..DDDDDDDDDDDD..',
      '..DDLLLLLLLLDD..', '..DLLLLLLLLLLD..', '..DLLELLLLLELD..', '..DLEELLLLEELD..',
      '..DLLCLOOLCLLD..', '..DDLLLLLLLLDD..', '.K.KK.KK.KK.KK..', 'KKKKKKKKKKKKKKKK',
      'KKKKRRRRRRRRKKKK', 'KKKKKKKKKKKKKKKK', '.KKKKKKKKKKKKKK.', '..KKKKKKKKKKKK..',
    ];
    this.EGG = egg;
    this.EGG_BLINK = sw(egg, [[6, '..DLLLLLLLLLLD..'], [7, '..DLLEELLEELLD..']]); // eyes shut (squint)
  }
  pal() {
    const ribbon = GENDER_COLOR[this.state.gender] || SCARF;
    return { '.': null, D: BODY, L: '#ffffff', O: BEAK, S: ribbon, E: '#1a1f3d', C: '#ff9bbb', T: '#5bc8ff', G: '#9c8a63', K: '#fde7c4', R: ribbon, H: '#e7b85c', J: '#f2cf7e',
      // ---- job attire colours (worn on the penguin during work scenes) ----
      M: '#39507f', N: '#d23b4b', P: '#23262e', W: '#f4f7fc', Y: '#ffc62e', B: '#8a5a2b', I: '#aeb9c8', Q: '#16263f' };
  }
  swap(g, i, row) { const c = g.slice(); c[i] = row; return c; }
  withClosed(g) { return this.swap(g, 6, this.CLOSED); }
  withFeet(g, which) { return this.swap(g, 15, which ? this.FEET_A : this.FEET_B); }
  // Grown once enough online time has accrued; before that it's an egg/baby.
  isGrown() { return (this.state.playTime || 0) >= GROW_SECONDS; }
  // Total experience = online seconds + bonus XP earned from actions (feeding,
  // playing, finishing classes/shifts). 1 bonus point ≈ 1 second of play.
  totalExp() { return (this.state.playTime || 0) + (this.state.bonusXp || 0); }
  // UNLIMITED levelling. Each level needs progressively more XP
  // (need(L) = BASE·L^EXPO), so the bar keeps climbing forever — no cap.
  levelFromExp(e) {
    const BASE = 420, EXPO = 1.25;
    let lvl = 1, acc = 0;
    while (lvl < 9999) {
      const need = Math.round(BASE * Math.pow(lvl, EXPO));
      if (e < acc + need) return { level: lvl, into: e - acc, need };
      acc += need; lvl++;
    }
    return { level: lvl, into: 0, need: 1 };
  }
  // Level + life-stage name + progress to next level. The number is unlimited;
  // the NAME is the life stage (egg→宝宝/幼年 until it hatches, then 成年/adult).
  levelInfo() {
    const lang = this.state.lang;
    const { level, into, need } = this.levelFromExp(this.totalExp());
    const grown = this.isGrown();
    const name = grown ? t(lang, 'lv.adult') : (level <= 2 ? t(lang, 'lv.baby') : t(lang, 'lv.child'));
    return { level, name, pct: Math.max(0, Math.min(100, Math.round((into / need) * 100))) };
  }
  // Award bonus XP, then check for a level-up.
  awardExp(n) {
    if (!n || this.state.dead) return;
    this.setState((s) => ({ bonusXp: (s.bonusXp || 0) + n }), () => this.checkLevelUp());
  }
  // Celebrate when the level number climbs (from actions or passive play). One
  // guarded place so action XP and online time never double-announce.
  checkLevelUp() {
    const lvl = this.levelInfo().level;
    if (this._lastLevel == null) { this._lastLevel = lvl; return; }
    if (lvl > this._lastLevel && this.isGrown() && !this.state.session && !this.state.dead) {
      this.speak(t(this.state.lang, 'say.levelUp', lvl), 2600, true);
    }
    this._lastLevel = lvl;
  }
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
  // A pixel straw hat drawn ON the penguin's head — overlays the top rows of the
  // sprite (brim 'H', crown 'J', band 'R'). Used by the 拔草 (weed) work scene.
  withHat(g) {
    const c = g.slice();
    c[0] = '......JJJJ......'; // crown top
    c[1] = '.....JJJJJJ.....'; // crown
    c[2] = '...HHJJJJJJHH...'; // brim + crown
    c[3] = '..HHHRRRRRRHHH..'; // wide brim with a band
    return c;
  }
  // Job attire worn on the penguin during a work scene (set via this._gear).
  // Each overlay row-swaps the base grid (like withHat) so the pet visibly wears
  // the outfit for its job. Authored + visually checked via the pixel-art skill.
  withGear(g) {
    const c = g.slice();
    const sw = (reps) => { for (const r of reps) c[r[0]] = r[1]; };
    switch (this._gear) {
      case 'dish': // 洗碗 — a blue apron (bib + skirt) over the belly
        sw([[8, '..DLLMMMMMMLLD..'], [9, '..DDMMMMMMMMDD..'],
            [11, '..DDDMMMMMMDDD..'], [12, '..DDMMMMMMMMDD..'],
            [13, '..DDMMMMMMMMDD..'], [14, '...DDMMMMMMDD...']]);
        break;
      case 'clean': // 清洁工 — a blue cap with a small steel brim
        sw([[0, '......MMMM......'], [1, '....MMMMMMMM....'],
            [2, '...MMMMMMMMMM...'], [3, '..MMMMMMMMMMMM..'],
            [4, '.IIDDLLLLLLDDII.']]);
        break;
      case 'store': // 便利店店员 — red uniform cap + a small white name badge
        sw([[0, '......NNNN......'], [1, '....NNNNNNNN....'],
            [2, '...NNNNNNNNNN...'], [3, '..NNNNNNNNNNNN..'],
            [4, '.IIDDLLLLLLDDII.'], [11, '..DDDWWLLLLDDD..']]);
        break;
      case 'courier': // 快递员 — yellow hi-viz cap + vest stripes
        sw([[0, '......YYYY......'], [1, '....YYYYYYYY....'],
            [2, '...YYYYYYYYYY...'], [3, '..YYYYYYYYYYYY..'],
            [4, '.YYDDLLLLLLDDYY.'], [11, '..DDDYLLLLYDDD..'],
            [12, '..DDDYLLLLYDDD..'], [13, '..DDDYLLLLYDDD..']]);
        break;
      case 'coder': // 程序员 — black headphones (band + ear cups)
        sw([[2, '...PDDDDDDDDP...'], [3, '..PDDDDDDDDDDP..'],
            [4, '..PDLLLLLLLLDP..'], [5, '..PLLLLLLLLLLP..']]);
        break;
      case 'teacher': // 老师 — black ring spectacles + a red bow tie
        sw([[5, '..DLPPPLLPPPLD..'], [6, '..DLPEPLLPEPLD..'],
            [10, '...SSNNNNSSSS...']]);
        break;
      case 'english': // 英语 — a dapper black top hat + bow tie (a spirited gentleman)
        sw([[0, '......PPPP......'], [1, '......PPPP......'],
            [2, '.....PPPPPP.....'], [3, '....PPPPPPPP....'],
            [4, '..PPPPPPPPPPPP..'], [10, '...SSSSPPSSSS...']]);
        break;
      default: break;
    }
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
    if (p.action === 'walk' || p.action === 'slide') {
      const dir = Math.sign(p.tx - p.x) || 1;
      p.facing = dir < 0 ? -1 : 1;
      if (p.action === 'walk') {
        // Accelerate up to a cruise pace, then ease to a stop on approach, so
        // walking has weight instead of constant robotic velocity.
        const dist = Math.abs(p.tx - p.x);
        const target = p.speed * (0.28 + 0.72 * easeInOutQuad(Math.min(1, dist / 64)));
        p.vel = lerp(p.vel || 0, target, Math.min(1, dt / 140));
        p.x += dir * p.vel * sp * dt / 1000;
      } else {
        p.x += dir * p.speed * sp * dt / 1000; // belly slide keeps its whee-speed
      }
      if (Math.abs(p.tx - p.x) < 2 || p.x <= this.minX || p.x >= this.maxX) {
        p.x = clamp(p.x, this.minX, this.maxX);
        if (p.action === 'walk') this.endWalk(); else { p.action = 'idle'; }
      }
      this.pushWindow();
    }

    // Idle FPS throttle: only redraw at ~18fps when nothing is animating, full
    // rate while walking/playing/blinking/dragging. Saves CPU on an always-on app.
    const lowKey = p.action === 'idle' || p.action === 'weak' || p.action === 'sit' || p.action === 'dead' || p.action === 'wait';
    const animating = !lowKey || p.blinkOn || p.dragging || !!this.state.playGame || !!this._buddyReact;
    if (animating || t - (this._lastDraw || 0) >= 55) {
      this._lastDraw = t;
      this.render2d(t, sp);
    }
    // Pixel focus scene (上课/发传单/拔草) animates every frame while active.
    if (this._scene) this.drawScene(t);
    // Sleep spot: a little cushion under the pet while it naps (no focus scene).
    else if (p.action === 'sleep' && this.isGrown()) this.drawSleepProp();
    else if (this._sleepPropOn) { this.clearSceneCanvas(); this._sleepPropOn = false; }
    // 玩耍 mini-game pieces animate every frame while a game is active.
    if (this._engine && this.state.playGame && this.ensureGameCtx()) this._engine.update(t, dt);

    this._raf = requestAnimationFrame(this.loop);
  };

  render2d(t, sp) {
    const p = this.p;

    // ---- egg / baby stage: render the egg sprite with its own little poses ----
    if (!this.isGrown()) {
      let g = p.blinkOn ? this.EGG_BLINK : this.EGG;
      if (this.state.cleanliness <= 25) g = this.withDirt(g);
      if (this.ensureCtx()) this.draw(g);
      let jy = 0, rot = 0, sy = 1;
      const dead = p.action === 'dead';
      if (dead) { rot = 78 * p.facing; jy = -22; }
      else if (p.action === 'ball' || p.action === 'play' || p.action === 'enter') {
        let pr = (t - p.aStart) / p.aDur; if (pr > 1) pr = 1;
        jy = p.action === 'enter' ? Math.sin(pr * Math.PI) * 42 : Math.abs(Math.sin(pr * Math.PI * 3)) * 22;
        sy = 1 + Math.sin(pr * Math.PI * 4) * 0.05;
      } else if (p.action === 'eat' || p.action === 'bath') { rot = Math.sin(t / 90) * 6; }
      else if (p.action === 'sleep') { rot = -8; jy = -3; }
      else { rot = Math.sin(t / 520) * 3 + (p.action === 'walk' ? Math.sin(t / 95) * 4 : 0); } // gentle wobble
      if (this.spriteRef.current) {
        this.spriteRef.current.style.transform = `translateY(${(-jy).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scaleX(${p.facing}) scaleY(${sy.toFixed(3)})`;
        this.spriteRef.current.style.filter = dead ? 'grayscale(1) brightness(1.25)' : 'none';
        this.spriteRef.current.style.opacity = dead ? '0.65' : '1';
      }
      if (this.shadowRef.current) { this.shadowRef.current.style.transform = 'scaleX(1)'; this.shadowRef.current.style.opacity = '0.34'; }
      return;
    }

    // ---- Code Buddy reaction: a transient pose+motion over normal pet life ----
    // Driven by Claude Code events (see onBuddyEvent). It briefly overrides the
    // face + body, plays a short motion (hop/shake/tap), then clears back to idle.
    if (this._buddyReact) {
      const b = this._buddyReact;
      if (t >= b.t0 + b.dur) { this._buddyReact = null; }
      else {
        let grid = this.G[b.face] || this.G.idle;
        if (p.blinkOn && b.face !== 'panic') grid = this.withClosed(grid);
        if (this.state.cleanliness <= 25) grid = this.withDirt(grid);
        if (this.ensureCtx()) this.draw(grid);
        const el = t - b.t0;
        let jy = 0, rot = 0, sy = 1;
        if (b.motion === 'hop') { jy = Math.abs(Math.sin(el / 130)) * 22; sy = 1 + Math.sin(el / 130) * 0.05; }       // bounce for joy
        else if (b.motion === 'celebrate') {                                                                          // big win: spin + tall hops + flap
          jy = Math.abs(Math.sin(el / 105)) * 34;
          rot = Math.sin(el / 95) * 24 * p.facing;
          sy = 1 + Math.sin(el / 70) * 0.1;
        }
        else if (b.motion === 'shake') { rot = Math.sin(el / 38) * 8; jy = Math.sin(el / 70) * 2; }                    // worried jitter
        else if (b.motion === 'tap') { rot = Math.sin(el / 90) * 6 * p.facing; jy = Math.abs(Math.sin(el / 180)) * 4; } // lean-tap for attention
        else if (b.motion === 'wave') { rot = Math.sin(el / 150) * 13; jy = Math.abs(Math.sin(el / 300)) * 4; }        // gentle friendly sway
        else { jy = Math.sin(el / 300) * 3; }
        if (this.spriteRef.current) {
          this.spriteRef.current.style.transform = `translateY(${(-jy).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scaleX(${p.facing}) scaleY(${sy.toFixed(3)})`;
          this.spriteRef.current.style.filter = 'none';
          this.spriteRef.current.style.opacity = '1';
        }
        if (this.shadowRef.current) { this.shadowRef.current.style.transform = 'scaleX(1)'; this.shadowRef.current.style.opacity = '0.34'; }
        return;
      }
    }

    // A mini-game can briefly drive the pet's face (happy on a milestone, sad on
    // a miss) — overrides the action face but not the animated transforms below.
    if (this._gameFace && this.G[this._gameFace] && !this._faceOverride) {
      let grid = this.G[this._gameFace];
      if (p.blinkOn) grid = this.withClosed(grid);
      if (this.state.cleanliness <= 25) grid = this.withDirt(grid);
      if (this.ensureCtx()) this.draw(grid);
      const jy = Math.sin(t / 220) * 3;
      if (this.spriteRef.current) {
        this.spriteRef.current.style.transform = `translateY(${(-jy).toFixed(1)}px) rotate(0deg) scaleX(${p.facing}) scaleY(1)`;
        this.spriteRef.current.style.filter = 'none';
        this.spriteRef.current.style.opacity = '1';
      }
      if (this.shadowRef.current) { this.shadowRef.current.style.transform = 'scaleX(1)'; this.shadowRef.current.style.opacity = '0.34'; }
      return;
    }

    // Class scene drives the face through 疑惑 to 思考 to 恍然大悟 via _faceOverride.
    if (this._faceOverride && this.G[this._faceOverride]) {
      let grid = this._faceOverride;
      grid = this.G[grid];
      if (p.blinkOn && this._faceOverride !== 'aha') grid = this.withClosed(grid);
      if (this.state.cleanliness <= 25) grid = this.withDirt(grid);
      if (this._hatOn) grid = this.withHat(grid);
      if (this._gear) grid = this.withGear(grid);
      if (this.ensureCtx()) this.draw(grid);
      // The body moves with the class beat — droops while dozing, jolts on waking,
      // sits up eagerly to answer — so studying reads as a lively little student.
      const beat = this._scene && this._scene.beat;
      let jy = Math.sin(t / 300) * 3, tilt = this._faceOverride === 'think' ? -4 : 3, sy = 1;
      if (beat === 'doze') { tilt = 15 * p.facing; jy = -7 + Math.sin(t / 600) * 1.5; sy = 0.94; }
      else if (beat === 'wake') { tilt = -8 + Math.sin(t / 40) * 4; jy = 7; } // startled jolt + shake
      else if (beat === 'raise') { jy = 4 + Math.abs(Math.sin(t / 150)) * 3; tilt = -2; }
      if (this.spriteRef.current) {
        this.spriteRef.current.style.transform =
          `translateY(${(-jy).toFixed(1)}px) rotate(${tilt}deg) scaleX(${p.facing}) scaleY(${sy})`;
        this.spriteRef.current.style.filter = 'none';
        this.spriteRef.current.style.opacity = '1';
      }
      if (this.shadowRef.current) { this.shadowRef.current.style.transform = 'scaleX(1)'; this.shadowRef.current.style.opacity = '0.34'; }
      return;
    }

    let face = this.G.idle;
    if (p.action === 'dead') face = this.G.sad;
    else if (p.action === 'sleep') face = this.G.sleepy;
    else if (p.action === 'play' || p.action === 'dance' || p.action === 'ball' || p.action === 'badminton' || p.action === 'bath' || p.action === 'swing') face = this.G.happy;
    else if (p.action === 'sit') face = this.G.sit;
    else if (p.action === 'weak') face = this.G.sad;
    else if (p.action === 'work') face = this.G.happy;
    else if (p.action === 'love') face = this.G.love;        // heart eyes
    else if (p.action === 'yawn') face = this.G.yawn;        // shut eyes + open mouth
    else if (p.action === 'doze') face = this.G.sleepy;      // drowsy half-closed eyes
    else if (p.action === 'tv' || p.action === 'music' || p.action === 'stretch' || p.action === 'flap' || p.action === 'slide' || p.action === 'wave') face = this.G.happy;
    else if (p.action === 'study' || p.action === 'read' || p.action === 'look' || p.action === 'wait' || p.action === 'sneeze' || p.action === 'peck' || p.action === 'preen') face = this.G.idle;
    else if (p.action === 'enter') face = this.G.happy;
    else if (p.action === 'eat') face = (Math.floor(t / 170) % 2 ? this.G.eat : this.G.idle);
    else {
      const m = this.state.mood;
      if (m === 'sad') face = this.G.sad;
      else if (m === 'tired') face = this.G.sleepy;
      else if (m === 'playful' || m === 'cheerful') face = this.G.happy; // high happiness → smiley
      else face = this.G.idle;
    }

    let grid = face;
    if (p.action === 'walk') grid = this.withFeet(face, Math.floor(t / (150 / sp)) % 2);
    if (p.blinkOn && face !== this.G.sleepy && face !== this.G.sad) grid = this.withClosed(grid);
    if (this.state.cleanliness <= 25) grid = this.withDirt(grid);
    if (this._hatOn) grid = this.withHat(grid); // straw hat for the 拔草 scene
    if (this._gear) grid = this.withGear(grid); // job attire for the work scenes
    if (this.ensureCtx()) this.draw(grid);

    let jy = 0, rot = 0, tilt = 0, sy = 1;
    if (p.action === 'play' || p.action === 'dance' || p.action === 'ball') {
      let pr = (t - p.aStart) / p.aDur; if (pr > 1) pr = 1;
      const hops = p.action === 'dance' ? 2 : 3;
      const hp = (pr * hops) % 1;                              // phase within the current hop
      jy = Math.sin(hp * Math.PI) * (p.action === 'ball' ? 38 : 42);
      if (p.action === 'dance') rot = pr * 360;
      sy = 1 - Math.cos(hp * 2 * Math.PI) * 0.10;              // squash on contact, stretch at apex
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
    if (p.action === 'work') {
      const ws = this._scene && this._scene.type === 'weed' ? this._scene : null;
      if (ws) {
        if (ws.beat === 'weed' && ws.pull) { tilt = 24 * p.facing; jy = -5; }            // bend down, yanking a weed
        else if (ws.beat === 'rest') { tilt = -6 * p.facing; jy = 3 + Math.sin(t / 280); } // stand up, wipe the brow
        else if (ws.beat === 'move') { jy = -Math.abs(Math.sin(t / 110)) * 5; }            // trudge to the next patch
        else if (ws.beat === 'dress') { sy = 1 + Math.sin(t / 70) * 0.06; }                // a little change-clothes shimmy
        else { tilt = 8 * p.facing; jy = Math.abs(Math.sin(t / 240)) * 3; }                // hunched over the patch
      } else { jy = Math.abs(Math.sin(t / 160)) * 8; rot = Math.sin(t / 120) * 6 * p.facing; } // generic busy bob
    }
    if (p.action === 'swing') { rot = Math.sin(t * 0.0045) * 8 * p.facing; jy = Math.sin(t * 0.009) * 2; } // leans side-to-side, swinging the bubble wand (in phase with games.js)
    if (p.action === 'sit') { sy = 0.86; jy = -8; }   // settle down low — sitting (grid splays feet forward)
    if (p.action === 'weak') { sy = 0.6; jy = -16 + Math.sin(t / 650) * 1.5; tilt = 5 * p.facing; } // slumped, too hungry
    if (p.action === 'sleep') { tilt = -12; jy = -10; }
    if (p.action === 'dead') { tilt = 90 * p.facing; jy = -28; }  // toppled over on the ground
    if (p.action === 'tv') { jy = Math.sin(t / 520) * 2; sy = 0.92; }                              // relaxed, watching
    if (p.action === 'read') { jy = Math.sin(t / 340) * 3; tilt = 4; }                             // reading nod
    if (p.action === 'music') { rot = Math.sin(t / 210) * 5; jy = Math.abs(Math.sin(t / 300)) * 3; } // swaying to the beat
    if (p.action === 'stretch') { let pr = (t - p.aStart) / p.aDur; if (pr > 1) pr = 1; sy = 1 + Math.sin(pr * Math.PI) * 0.24; jy = Math.sin(pr * Math.PI) * 5; } // a big yawny stretch
    if (p.action === 'wait') { sy = 0.88; jy = -7; tilt = -5 + Math.sin(t / 700) * 2; } // sitting, looking up hopefully
    if (p.action === 'flap') { sy = 1 + Math.sin(t / 55) * 0.12; jy = Math.abs(Math.sin(t / 110)) * 7; } // excited wing-flapping
    if (p.action === 'love') { let pr = (t - p.aStart) / p.aDur; if (pr > 1) pr = 1; jy = Math.abs(Math.sin(pr * Math.PI * 2)) * 15; sy = 1 + Math.sin(pr * Math.PI * 4) * 0.06; } // happy adored bounce
    if (p.action === 'slide') { tilt = 70 * p.facing; jy = -22; }  // prone, sliding on its belly
    if (p.action === 'peck') { const ph = Math.abs(Math.sin((t - p.aStart) / 150)); tilt = 20 * ph * p.facing; jy = -ph * 6; } // dipping to peck the ground
    if (p.action === 'yawn') { let pr = (t - p.aStart) / p.aDur; if (pr > 1) pr = 1; tilt = -9 * Math.sin(pr * Math.PI) * p.facing; jy = Math.sin(pr * Math.PI) * 4; } // leans back for a big yawn
    if (p.action === 'preen') { tilt = (10 + Math.sin(t / 90) * 7) * p.facing; jy = -2; } // leans to its side, nibbling its feathers
    if (p.action === 'doze') { const cyc = ((t - p.aStart) / 800) % 1; const droop = cyc < 0.85 ? cyc / 0.85 : 0; tilt = droop * 16 * p.facing; jy = -droop * 8; } // head sinks… then jerks awake
    if (p.action === 'wave') { rot = Math.sin(t / 110) * 16; jy = Math.abs(Math.sin(t / 220)) * 5; } // cheery side-to-side hello
    if (p.action === 'sneeze') {
      let pr = (t - p.aStart) / p.aDur; if (pr > 1) pr = 1;
      tilt = (pr < 0.55 ? -(pr / 0.55) : (1 - (pr - 0.55) / 0.45)) * 15 * p.facing; // lean back… then ACHOO forward
      jy = pr < 0.55 ? -3 : 4;
    }
    let faceX = p.facing;
    const glancing = p.action === 'look';
    if (glancing) { faceX = Math.sin((t - p.aStart) / 170) >= 0 ? 1 : -1; rot = Math.sin((t - p.aStart) / 170) * 4; } // glancing around
    // Mood colours the resting motion: cheerful/playful = livelier bob & breath,
    // sad/tired = slower and droopier.
    const mood = this.state.mood;
    const moodK = (mood === 'cheerful' || mood === 'playful') ? 1.35 : ((mood === 'sad' || mood === 'tired') ? 0.55 : 1);
    const bob = p.action === 'walk' ? -Math.abs(Math.sin(t / 110)) * 4 : (p.action === 'idle' ? Math.sin(t / 720) * 2 * moodK : 0);

    // Always-on "breathing": a tiny scale pulse while at rest so the pet is never
    // perfectly frozen. Skipped for busy/animated actions that set their own sy.
    if (p.action === 'idle' || p.action === 'sit' || p.action === 'wait' || p.action === 'tv') {
      sy *= 1 + Math.sin(t / (900 / moodK)) * 0.02 * moodK;
    }

    // Smooth turning: instead of snapping the mirror, animate |scaleX| through a
    // thin sliver when the facing flips (except while actively glancing, which
    // drives faceX itself). Reads like the pet physically pivots.
    let scaleX = faceX;
    if (glancing) { this._shownFacing = faceX; this._turnStart = null; }
    else {
      if (this._shownFacing == null) this._shownFacing = faceX;
      if (faceX !== this._shownFacing && this._turnTarget !== faceX) { this._turnFrom = this._shownFacing; this._turnTarget = faceX; this._turnStart = t; }
      if (this._turnStart != null) {
        const tp = Math.min(1, (t - this._turnStart) / 170);
        const mag = Math.abs(Math.cos(tp * Math.PI)) * 0.82 + 0.18;    // 1 → sliver → 1
        scaleX = (tp < 0.5 ? this._turnFrom : this._turnTarget) * mag;
        if (tp >= 1) { this._shownFacing = this._turnTarget; this._turnStart = null; this._turnTarget = null; }
      }
    }

    // Subtle look-toward-cursor lean while resting and the pointer is hovering.
    if ((p.action === 'idle' || p.action === 'sit') && this.state.hover && this._cursorDir) {
      rot += this._cursorDir * 3;
    }

    if (this.spriteRef.current) {
      this.spriteRef.current.style.transform =
        `translateY(${(bob - jy).toFixed(1)}px) rotate(${(tilt + rot).toFixed(1)}deg) scaleX(${scaleX.toFixed(3)}) scaleY(${sy.toFixed(3)})`;
      // Dim slightly at night so the pet reads as sleepy/low-light after hours.
      this.spriteRef.current.style.filter = p.action === 'dead' ? 'grayscale(1) brightness(1.25)' : (this._night() ? 'brightness(0.86) saturate(0.9)' : 'none');
      this.spriteRef.current.style.opacity = p.action === 'dead' ? '0.65' : '1';
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
    if (s.happiness < 25) return 'sad';      // genuinely unhappy
    if (s.happiness >= 60) return 'cheerful'; // high happiness → big smile
    // only looks "bored" after being ignored for a good while (it entertains itself)
    if (this.p.action === 'idle' && this._lastInteract && Date.now() - this._lastInteract > 90000) return 'bored';
    return 'happy';
  }
  recompute() { this.setState((s) => ({ mood: this.calcMood(s) })); }

  tick = () => {
    if (this.state.dead || this.state.onboard) return; // no needs while dead or onboarding
    // Online reward: +10 money for every full hour spent online (every 3600 ticks).
    const hourly = (((this.state.playTime || 0) + 1) % 3600 === 0) ? 10 : 0;
    // This is a 24/7 idle pet, but tuned to be playable: a full pet gets hungry
    // in ~2.5–3h (tick = 1s; rates per-second). Appetite trait nudges the speed.
    // Health/sickness stay slow (below) so faster needs don't make it sick easily.
    const aRate = 0.0040 * (0.75 + this.personality.appetite / 200); // ~5h to hungry (slowed)
    const cleanDrop = 0.0026 + (this.p.action === 'walk' ? 0.0015 : 0); // ~8–9h to dirty (slowed)
    const happyDrop = this.state.session ? 0 : 0.0045; // engaged while studying/working → no boredom
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
      return { fullness, cleanliness, happiness, energy, health, mood, playTime: (s.playTime || 0) + 1, money: s.money + hourly };
    }, () => this.checkLevelUp()); // online time also raises the level → celebrate crossings
    if (hourly) { this.save(); } // celebrate the hourly reward

    // Focus session countdown: update the displayed remaining time each second,
    // and grant the reward + done animation when it reaches zero.
    if (this.state.session) {
      const left = Math.max(0, Math.ceil((this.state.session.endTs - Date.now()) / 1000));
      if (left <= 0) this.finishFocus();
      else if (left !== this.state.sessionLeft) this.setState({ sessionLeft: left });
    }



    // Growth: enough total online time → the egg hatches into a penguin (once).
    if (!this._wasGrown && this.state.gender && (this.state.playTime || 0) >= GROW_SECONDS) {
      this._wasGrown = true; this.hatch();
    }

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
        if (next !== this.state.sick) { this.setState({ sick: next }); this.speak(t(this.state.lang, 'say.worseSick'), 2600, true); }
      }
    } else {
      this._sickDur = 0;
      this._sickCtr = (this._sickCtr || 0) + 1;
      if (this._sickCtr >= 25) { // check for illness ~every 25s while health is low
        this._sickCtr = 0;
        if (this.state.health < 50 && !this.p.busy) {
          const chance = clamp((50 - this.state.health) / 100, 0, 0.4);
          if (Math.random() < chance) { this.setState({ sick: 'mild' }); this.speak(pick(DIA.sick[this.state.lang]), 2600, true); }
        }
      }
    }

    // Hunger / tiredness read through the pet's PIXEL FACE (mood), not an emoji
    // emote — keep the emote slot clear.
    if (this.state.emote) this.setState({ emote: null });

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
            // unwell: mostly rest, a slow shuffle, and the occasional cough
            this._pickBehavior([['sit', 20], ['cough', 12], ['walk', 8], ['doze', 10], ['look', 5]]);
          } else if (!this.isGrown()) {
            // baby: toddle / sit / play ball
            if (roll < 0.42) this.startWalk(); else if (roll > 0.78) this.ballAct(); else this.sitAct();
          } else {
            // grown: pick the next little behaviour by WEIGHTED URGES — needs,
            // personality AND time of day nudge the odds — instead of a flat random
            // ladder, and never repeat the last one. Reads as purposeful, not twitchy.
            const P = this.personality, s = this.state;
            const awayLong = Date.now() - (this._lastInteract || 0) > 90000;
            const night = this._night();           // drowsy & calm at night, lively by day
            const dayLively = night ? 0.5 : 1;      // scale energetic behaviours down at night
            const nightRest = night ? 2.2 : 1;      // scale rest behaviours up at night
            this._pickBehavior([
              ['walk',    (22 + P.liveliness * 0.14 + P.curiosity * 0.08) * dayLively],
              ['leisure', 16 * dayLively],
              ['sit',     13 * (night ? 1.4 : 1)],
              ['look',    (10 + P.curiosity * 0.12) * dayLively],
              ['preen',   9],
              ['peck',    (7 + P.curiosity * 0.08) * dayLively],
              ['stretch', 7],
              ['flap',    (6 + P.liveliness * 0.07) * dayLively],
              ['slide',   s.energy > 55 ? (5 + P.liveliness * 0.06) * dayLively : 0],
              ['ball',    s.energy > 60 ? (6 + P.liveliness * 0.08) * dayLively : 0],
              ['yawn',    (s.energy < 60 ? 9 : 2) * nightRest],
              ['doze',    (s.energy < 45 ? 14 : night ? 8 : 0) * nightRest],
              ['wait',    awayLong ? 16 + P.attachment * 0.15 : 0],  // miss the owner
              ['edge',    awayLong ? 8 + P.curiosity * 0.06 : 0],    // wander to an edge and peek out
              ['sneeze',  2],
            ]);
          }
        }
      }
    }

    this.maybeChatter();
    if (this.p.action === 'weak' && Math.random() < 0.14) this.speak(pick(DIA.weak[this.state.lang]));

    // While studying, the pet "learns out loud" — speaks a fact for the subject
    // (English class is spoken in English). Non-intrusive: just a bubble.
    const ses = this.state.session;
    if (ses && ses.kind === 'study' && !this.state.say) {
      this._studyCtr = (this._studyCtr || 0) + 1;
      if (this._studyCtr >= 11 && Math.random() < 0.5) {
        this._studyCtr = 0;
        const line = studyLine(ses.subjectKey, this.state.lang);
        if (line) this.speak(line, 3000, true);
      }
    }

    // Death: total neglect drains health to 0 (you'll have seen the 🤒 warnings).
    if (this.state.health <= 0 && !this.state.dead) this.die();

    this._saveCtr = (this._saveCtr || 0) + 1;
    if (this._saveCtr >= 5) { this._saveCtr = 0; this.save(); }
  };

  // Emoji emotes removed (no-emoji rule): feedback now comes from the pet's
  // pixel face + particle bursts. Kept as a no-op so call sites need no edits.
  setEmote() { /* intentionally empty */ }

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
    if (since < 30000) return;
    // It's an idle companion that mostly keeps to itself, so it only speaks up for
    // a real need (hungry / dirty / tired / sick) — no needy "where'd you go?".
    let pool = null;
    if (s.sick) pool = DIA.sick[s.lang];
    else if (s.fullness < 30) pool = DIA.hungry[s.lang];
    else if (s.cleanliness <= 25) pool = DIA.dirty[s.lang];
    else if (s.energy < 30) pool = DIA.sleepy[s.lang];
    else if (!this.isGrown()) pool = DIA.baby[s.lang]; // a baby still babbles
    if (!pool) {
      // Content & grown: every so often show off something it learned in class.
      const learned = this.learnedSubjects();
      if (learned.length && Math.random() < (0.05 + this.personality.liveliness / 2200)) {
        const facts = knowledgePool(learned, s.lang);
        if (facts.length) this.speak(pick(facts), 3200);
      }
      return;
    }
    const chance = 0.08 + this.personality.liveliness / 1400;
    if (Math.random() > chance) return;
    this.speak(pick(pool));
  }

  // Subjects the pet has studied (and can now talk about): everything once it has
  // graduated a level, plus any subject it has started at the current level.
  learnedSubjects() {
    const done = this.state.classDone || {};
    if ((this.state.schoolLevel || 0) > 0) return SUBJECTS.map((s) => s.key);
    return SUBJECTS.filter((s) => (done[s.key] || 0) > 0).map((s) => s.key);
  }

  // ---- behaviors -----------------------------------------------------------
  // Local hour (0–23) and a night flag, for the pet's day/night rhythm.
  _hour() { return new Date().getHours(); }
  _night() { const h = this._hour(); return h < 6 || h >= 22; }
  // Per-behaviour minimum spacing (seconds) so nothing recurs too often.
  static COOLDOWN = { sneeze: 70, slide: 40, ball: 30, stretch: 24, flap: 24, yawn: 30, cough: 20, edge: 60 };
  // Weighted pick of the next idle behaviour. `opts` is [key, weight]; zero (or
  // negative) weights, the immediately-previous behaviour, and anything still on
  // cooldown are excluded, so the pet varies and never repeats back-to-back.
  _pickBehavior(opts) {
    const METHOD = { walk: 'startWalk', leisure: 'startLeisure', sit: 'sitAct', look: 'lookAct', preen: 'preenAct', peck: 'peckAct', stretch: 'stretchAct', flap: 'flapAct', slide: 'startSlide', ball: 'ballAct', yawn: 'yawnAct', doze: 'dozeAct', wait: 'waitAct', sneeze: 'sneezeAct', cough: 'coughAct', edge: 'edgePeek' };
    const now = Date.now();
    const cd = this._behavCd || (this._behavCd = {});
    const ok = ([k, w]) => w > 0 && k !== this._lastBehavior && (!App.COOLDOWN[k] || now - (cd[k] || 0) > App.COOLDOWN[k] * 1000);
    let pool = opts.filter(ok);
    if (!pool.length) pool = opts.filter(([, w]) => w > 0); // fallback: ignore cooldown/repeat
    if (!pool.length) return;
    const total = pool.reduce((a, [, w]) => a + w, 0);
    if (total <= 0) return;
    let r = Math.random() * total, key = pool[pool.length - 1][0];
    for (const [k, w] of pool) { r -= w; if (r <= 0) { key = k; break; } }
    this._lastBehavior = key;
    cd[key] = now;
    const m = METHOD[key];
    if (m && typeof this[m] === 'function') this[m]();
  }

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
  endWalk() { if (this.p.action === 'walk') { this.p.action = 'idle'; this.p.vel = 0; } }

  feed = (fx) => {
    // Feeding is allowed during a focus session — it just tops up the stat
    // without breaking concentration (no pose change).
    if (this.state.session) { this.touch(); this.applyDeltas(fx || { full: 42, happy: 4 }); this.spawn('feed'); this.save(); return; }
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'eat';
    this.sfx('eat'); this.spawn('feed');
    setTimeout(() => {
      this.applyDeltas(fx || { full: 42, happy: 4 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
      this.speak(pick(DIA.fed[this.state.lang]), 2200, true);
    }, 1500);
  };
  playAct = (fx) => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'play';
    this.p.aStart = performance.now(); this.p.aDur = 1500 / (this.state.speed || 1);
    this.p.playfulUntil = Date.now() + 10000;
    this.sfx('play'); this.spawn('play');
    setTimeout(() => {
      this.applyDeltas(fx || { energy: -20, clean: -8, happy: 26 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
      this.speak(pick(DIA.played[this.state.lang]), 2200, true);
    }, this.p.aDur);
  };
  dance = (fx) => {
    if (this.busyBlocked()) return;
    this.touch();
    this.p.busy = true; this.p.action = 'dance';
    this.p.aStart = performance.now(); this.p.aDur = 1300 / (this.state.speed || 1);
    this.p.playfulUntil = Date.now() + 3000;
    this.sfx('play'); this.spawn('play');
    setTimeout(() => {
      this.applyDeltas(fx || { energy: -5, happy: 12 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
    }, this.p.aDur);
  };
  sleepAct = () => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'sleep';
    this.sfx('sleep');
    setTimeout(() => {
      this.setState({ energy: 80 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
      this.speak(pick(DIA.slept[this.state.lang]), 2200, true);
    }, 6000);
  };
  // Sit down for a short rest (recovers a little energy). Interruptible.
  sitAct = () => {
    if (this.p.busy) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'sit';
    this.sfx('chirp'); this.speak(pick(DIA.sit[this.state.lang]), 2400, true);
    clearTimeout(this._sitT);
    this._sitT = setTimeout(() => {
      this.setState((s) => ({ energy: Math.min(100, s.energy + 12) }));
      if (this.p.action === 'sit') { this.p.action = 'idle'; this.p.busy = false; }
      this.recompute();
    }, 16000); // hold the sit for a good while before wandering off again
  };
  ballAct = (fx) => {
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'ball';
    this.p.aStart = performance.now(); this.p.aDur = 2400 / (this.state.speed || 1);
    this.p.playfulUntil = Date.now() + 8000;
    this.sfx('play'); this.prop('ball', this.p.aDur);
    this.speak(pick(DIA.ball[this.state.lang]), 2000, true);
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
    this.sfx('play'); this.prop('shuttle', this.p.aDur);
    this.speak(pick(DIA.badminton[this.state.lang]), 2000, true);
    setTimeout(() => {
      this.applyDeltas(fx || { energy: -16, clean: -12, happy: 28 });
      this.p.action = 'idle'; this.p.busy = false; this.recompute(); this.save();
    }, this.p.aDur);
  };
  // Bath: scrubs the pet clean with rising bubbles. fx.clean is a delta
  // (e.g. +45 for a quick shower, +100 for a bubble bath).
  bathAct = (fx) => {
    // Bathing is allowed during a focus session (a few bubbles, no pose change).
    if (this.state.session) { this.touch(); this.applyDeltas(fx || { clean: 100, happy: 5 }); this.bubbles(); this.save(); return; }
    if (this.busyBlocked()) return;
    this.touch(); this.closeMenu();
    this.p.busy = true; this.p.action = 'bath';
    this.p.aStart = performance.now(); this.p.aDur = 1900 / (this.state.speed || 1);
    this.sfx('bath'); this.bubbles();
    this.speak(pick(DIA.bath[this.state.lang]), 2000, true);
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
      // a drawn shuttlecock — a white flared skirt with an orange cork (no emoji)
      el.style.cssText = 'position:absolute;left:52px;top:60px;width:0;height:0;' +
        'border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:15px solid rgba(255,255,255,.96);' +
        'filter:drop-shadow(0 1px 0 rgba(90,150,220,.55));animation:shuttle 1.2s ease-in-out infinite;';
      const cork = document.createElement('div');
      cork.style.cssText = 'position:absolute;left:-4px;top:12px;width:8px;height:7px;border-radius:50%;background:#ff9d3d;border:1px solid #d97a1e;';
      el.appendChild(cork);
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
    if (this.p.action === 'walk' || this.p.action === 'slide') this.p.action = 'idle';
    // Too hungry to perk up — just plead for food (the care panel shows on hover).
    if (this.p.action === 'weak' || this.state.fullness < 20) { this.speak(pick(DIA.weak[this.state.lang]), 2200, true); return; }
    // A happy, grown pet adores being petted → heart-eyes instead of a line.
    if (this.isGrown() && this.state.happiness >= 60 && Math.random() < 0.5) { this.loveReact(); return; }
    const P = this.personality;
    const pool = (P.liveliness > 65 ? DIA.clickLively : (P.courage < 35 ? DIA.clickShy : DIA.click))[this.state.lang];
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
    if (p.action === 'walk' || p.action === 'slide') p.action = 'idle';
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
  onDouble = (e) => { e.preventDefault(); clearTimeout(this._clickT); if (this.state.session) { this.requestBreakFocus(); return; } if (this.isGrown()) this.dance(); else this.ballAct(); };
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
  // Action sounds were removed by request — the pet is silent. Kept as a no-op
  // so the existing call sites (sfx('play'), sfx('eat')…) don't need touching.
  sfx() { /* sound effects disabled */ }

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
    if (!d) { this.setState({ loaded: true }); return { gender: null, dead: false }; } // brand-new pet → onboarding (boot)
    const st = {};
    ['fullness', 'energy', 'cleanliness', 'happiness', 'health', 'sick', 'dead', 'education', 'study', 'gender', 'playTime', 'bonusXp', 'bond', 'money', 'mood', 'name', 'volume', 'speed', 'opacity', 'schoolLevel', 'lang'].forEach((k) => {
      if (d[k] != null) st[k] = d[k];
    });
    st.classDone = (d.classDone && typeof d.classDone === 'object') ? { ...FRESH_CLASSES, ...d.classDone } : { ...FRESH_CLASSES };
    if (st.schoolLevel == null) st.schoolLevel = 0;
    // No gender saved → this pet hasn't been onboarded (fresh install or a
    // pre-onboarding save), so boot() will show the egg-choice + name screen.
    this._wasGrown = (st.playTime != null ? st.playTime : 0) >= GROW_SECONDS;
    // A pet that died stays dead across restarts (revive / restart from the overlay).
    if (st.dead) { this.p.action = 'dead'; this.p.busy = true; }
    // Migrate saves from the old inverted "hunger" stat (0=full) → fullness.
    if (st.fullness == null && d.hunger != null) st.fullness = clamp(100 - Number(d.hunger), 0, 100);
    // Offline decay while the app was closed: only 20% of the live rate, and no
    // health loss / sickness, so the pet never comes back sick — just a little
    // hungrier/dirtier. Capped so a multi-day absence still leaves it cared-for.
    if (d.ts) {
      const sec = (Date.now() - d.ts) / 1000;
      const off = 0.2;
      const aR = 0.0040 * (0.75 + (this.personality.appetite || 50) / 200);
      if (st.fullness != null) st.fullness = Math.max(0, st.fullness - Math.min(65, off * aR * sec));
      if (st.cleanliness != null) st.cleanliness = Math.max(0, st.cleanliness - Math.min(65, off * 0.0026 * sec));
      if (st.happiness != null) st.happiness = Math.max(0, st.happiness - Math.min(50, off * 0.0045 * sec));
    }
    if (d.x != null && this.minX != null) { this.p.x = clamp(d.x, this.minX, this.maxX); this.p.tx = this.p.x; }
    if (d.y != null && this.minY != null) { this.p.y = clamp(d.y, this.minY, this.maxY); this.ground = this.p.y; }
    this.pushWindow(true);
    st.loaded = true;
    // A focus session that was running when the app closed: keep it so the pet
    // either RESUMES the class/shift or AUTO-COMPLETES it if its time already
    // passed while away (applied in maybeStartPet). Otherwise the study is lost.
    const sv = d.session;
    this._savedSession = (sv && (sv.kind === 'study' || sv.kind === 'work') && typeof sv.endTs === 'number') ? sv : null;
    this.setState(st, () => { this.recompute(); this.save(); });
    return { gender: st.gender, dead: !!st.dead };
  }
  // The full save payload (local + cloud share the exact same shape).
  snapshot() {
    const s = this.state;
    return {
      fullness: s.fullness, energy: s.energy, cleanliness: s.cleanliness, happiness: s.happiness,
      health: s.health, sick: s.sick, dead: s.dead, education: s.education, study: s.study,
      schoolLevel: s.schoolLevel, classDone: s.classDone,
      session: s.session, // an in-progress class/shift survives a restart (resumes / auto-completes)
      gender: s.gender, playTime: s.playTime, bonusXp: s.bonusXp, bond: s.bond, money: s.money, mood: s.mood, lang: s.lang,
      name: s.name, volume: s.volume, speed: s.speed, opacity: s.opacity,
      personality: this.personality,
      x: this.p.x, y: this.p.y, ts: Date.now(),
    };
  }
  save() {
    const data = this.snapshot();
    this._localTs = data.ts;
    saveState(data);
    if (this.state.user) this.queueCloudPush(data); // mirror to cloud when signed in
  }

  // ---- cloud save ----------------------------------------------------------
  // Debounced upsert so a burst of saves becomes one network write.
  queueCloudPush(data) {
    clearTimeout(this._cloudT);
    this._cloudT = setTimeout(() => {
      pushCloud(data || this.snapshot())
        .then(() => { if (this._mounted) this.setState({ syncedAt: Date.now() }); this._cloudDirty = false; })
        .catch(() => { this._cloudDirty = true; /* offline — local save holds it; flush on reconnect */ });
    }, 2500);
  }

  // Set up auth: restore any saved session (offline-safe), then keep `user` in
  // sync. A cloud account is required, so this also gates the pet via authChecked.
  async initCloud() {
    if (!cloudEnabled()) { if (this._mounted) this.setState({ authChecked: true }); return; } // degraded mode: no gate
    this._offAuth = onAuth((user) => {
      if (!this._mounted) return;
      this.setState({ user, authChecked: true });
      if (user) { this.cloudSyncOnLogin(); this.maybeStartPet(); }
    });
    try {
      const session = await currentSession();          // cached, no network → works offline
      const user = session ? session.user : null;
      this.setState({ user, authChecked: true });
      if (user) await this.cloudSyncOnLogin();          // pull newest (no-op / silent if offline)
    } catch (e) {
      if (this._mounted) this.setState({ authChecked: true });
    }
  }

  // Push the latest save to the cloud (used on reconnect / after a failed push).
  flushCloud() {
    if (!this.state.user) return;
    pushCloud(this.snapshot())
      .then(() => { if (this._mounted) this.setState({ syncedAt: Date.now() }); this._cloudDirty = false; })
      .catch(() => { this._cloudDirty = true; }); // still offline — keep it pending
  }

  // On login: newest wins. If the cloud save is newer than the local one, pull it
  // down and apply it; otherwise push the local save up.
  async cloudSyncOnLogin() {
    try {
      const cloud = await pullCloud();
      const localTs = this._localTs || 0;
      if (cloud && (cloud.ts || 0) > localTs) {
        this.applyCloudSave(cloud);
        if (this._mounted) this.speak(t(this.state.lang, 'say.cloudRestored'), 2200, true);
      } else {
        await pushCloud(this.snapshot());
      }
      if (this._mounted) this.setState({ syncedAt: Date.now() });
    } catch (e) { /* ignore */ }
  }

  // Apply a cloud save blob to the running pet (same fields as load()).
  applyCloudSave(d) {
    if (!d) return;
    this.personality = normPersonality(d.personality);
    const st = {};
    ['fullness', 'energy', 'cleanliness', 'happiness', 'health', 'sick', 'dead', 'education', 'study', 'gender', 'playTime', 'bonusXp', 'bond', 'money', 'mood', 'name', 'volume', 'speed', 'opacity', 'schoolLevel', 'lang'].forEach((k) => {
      if (d[k] != null) st[k] = d[k];
    });
    if (d.classDone && typeof d.classDone === 'object') st.classDone = { ...FRESH_CLASSES, ...d.classDone };
    if (d.x != null && this.minX != null) { this.p.x = clamp(d.x, this.minX, this.maxX); this.p.tx = this.p.x; }
    if (d.y != null && this.minY != null) { this.p.y = clamp(d.y, this.minY, this.maxY); this.ground = this.p.y; }
    // Before the pet starts, let a cloud save's in-progress session resume/finish too.
    if (!this._petStarted) {
      const sv = d.session;
      this._savedSession = (sv && (sv.kind === 'study' || sv.kind === 'work') && typeof sv.endTs === 'number') ? sv : null;
    }
    this.pushWindow(true);
    this.setState(st, () => { this.recompute(); this.save(); });
  }

  setLang = (lang) => { this.setState({ lang }); if (this.state.loaded) this.save(); };

  // ---- Code Buddy: react to the developer's Claude Code activity --------------
  // Fire a transient pose+motion (returning to normal pet life after `dur`), and
  // optionally speak a line. `say` (Claude's own remark) overrides the pool line.
  buddyReact(face, motion, line, dur = 2600) {
    this._buddyReact = { face, motion, t0: performance.now(), dur };
    if (line) this.speak(line, Math.min(dur + 400, 3600), true);
  }
  // Occasionally cheer the owner on after a win (a second beat of encouragement).
  buddyEncore(dur) {
    const lang = this.state.lang;
    if (this._buddyEncT) clearTimeout(this._buddyEncT);
    this._buddyEncT = setTimeout(() => {
      if (!this._mounted || this.state.session || this.state.playGame) return;
      this.buddyReact('cheer', 'hop', pick(BUDDY.encourage[lang] || BUDDY.encourage.zh), 2600);
    }, dur + 300);
  }
  onBuddyEvent(evt) {
    if (!evt || !this._mounted) return;
    if (!this.isGrown()) return;                 // egg stage stays out of it
    if (this.state.session || this.state.playGame || this.state.dead) return; // don't break focus/games
    const lang = this.state.lang;
    const L = (key) => evt.say || pick(BUDDY[key][lang] || BUDDY[key].zh);

    // ---- gentle wellness reminder after a long continuous work stretch -------
    // Track one "work stretch": a >12min gap counts as a break and resets it.
    // After ~50min non-stop, softly nudge the owner to walk / rest / grab a
    // coffee (cute, in-character), then re-nudge at most every ~25min.
    const now = Date.now();
    if (this._buddyLastEvt && now - this._buddyLastEvt > 12 * 60 * 1000) { this._buddyActiveSince = now; this._buddyLastRemind = 0; }
    if (!this._buddyActiveSince) this._buddyActiveSince = now;
    this._buddyLastEvt = now;
    const activeMs = now - this._buddyActiveSince;
    const REMIND_AFTER = 50 * 60 * 1000, REMIND_GAP = 25 * 60 * 1000;
    // The two reactions the owner always wants (below) take priority over the
    // reminder so they're never swallowed by it.
    if (activeMs > REMIND_AFTER && (!this._buddyLastRemind || now - this._buddyLastRemind > REMIND_GAP)
        && evt.kind !== 'needs_input' && evt.kind !== 'finish') {
      this._buddyLastRemind = now;
      this.buddyReact('notice', 'wave', pick(BUDDY.restReminder[lang] || BUDDY.restReminder.zh), 3400);
      return; // the caring nudge takes this beat; normal reactions resume next event
    }

    // Reaction policy (owner's call): the pet ALWAYS reacts to the two key
    // moments — "paused for your input" and "task complete". Errors are
    // intentionally NOT reported. Everything else is an optional, low-key
    // positive beat (kept sparse so the pet isn't chattering every turn).
    switch (evt.kind) {
      // —— always ——
      case 'needs_input': this.buddyReact('notice', 'tap', L('needInput'), 3000); break;   // paused for a question / permission
      case 'finish': this.buddyReact('cheer', 'celebrate', L('finish'), 2800); break;       // a task / turn is complete
      // —— optional positive beats (no errors, no per-prompt chatter) ——
      case 'tests_pass': this.buddyReact('cheer', 'celebrate', evt.say || pick(BUDDY.congrats[lang] || BUDDY.congrats.zh), 3000); this.buddyEncore(3000); break;
      case 'git_commit': this.buddyReact('cheer', 'hop', evt.say || pick(BUDDY.congrats[lang] || BUDDY.congrats.zh), 2400); break;
      case 'session_start': this.buddyReact('notice', 'tap', L('sessionStart'), 2000); break;
      case 'session_end': this.buddyReact('notice', 'wave', L('sessionEnd'), 2000); break;
      // tool_error / tests_fail / big_diff / prompt: no reaction (kept quiet).
      default: break;
    }
  }
  // Settings switch: connect/disconnect Deskpet to Claude Code (installs/removes
  // the local hooks in ~/.claude/settings.json).
  toggleBuddy = async () => {
    const lang = this.state.lang;
    try {
      if (this.state.buddyOn) { await buddyDisconnect(); this.setState({ buddyOn: false }); }
      else {
        const r = await buddyConnect();
        const ok = !!(r && r.connected);
        this.setState({ buddyOn: ok });
        if (ok && this.isGrown()) this.buddyReact('cheer', 'hop', pick(BUDDY.sessionStart[lang] || BUDDY.sessionStart.zh), 2400);
      }
    } catch (e) { /* ignore */ }
  };
  setAuthEmail = (e) => this.setState({ authEmail: e.target.value });
  setAuthPw = (e) => this.setState({ authPw: e.target.value });

  // mode: 'in' (sign in) | 'up' (register)
  doAuth = async (mode) => {
    const email = (this.state.authEmail || '').trim();
    const pw = this.state.authPw || '';
    if (!email || !pw) { this.setState({ authMsg: t(this.state.lang, 'login.needBoth') }); return; }
    if (pw.length < 6) { this.setState({ authMsg: t(this.state.lang, 'login.pwShort') }); return; }
    this.setState({ authBusy: true, authMsg: '' });
    try {
      if (mode === 'up') {
        const res = await signUp(email, pw);
        if (!res.session) { // email confirmation required
          this.setState({ authBusy: false, authMsg: t(this.state.lang, 'login.confirmEmail') });
          return;
        }
      } else {
        await signIn(email, pw);
      }
      const user = await currentUser();
      this.setState({ user, authPw: '', authMsg: '' });
      if (user) { await this.cloudSyncOnLogin(); this.maybeStartPet(); }
    } catch (e) {
      this.setState({ authMsg: (e && e.message) || t(this.state.lang, 'login.failed') });
    } finally {
      this.setState({ authBusy: false });
    }
  };

  doSignOut = async () => {
    await signOut();
    this.setState({ user: null, syncedAt: null, authPw: '' });
  };

  syncNow = async () => {
    if (!this.state.user) return;
    this.setState({ authBusy: true });
    try { await pushCloud(this.snapshot()); this.setState({ syncedAt: Date.now() }); } catch (e) { /* ignore */ }
    this.setState({ authBusy: false });
  };

  // ---- school / work / focus UI -------------------------------------------
  renderFocusBar() {
    const ses = this.state.session;
    if (!ses) return null;
    return (
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 40, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#222a55', color: '#fff', padding: '6px 13px', borderRadius: 999, fontSize: 12, fontWeight: 900, boxShadow: '0 4px 0 rgba(34,42,85,.3)', whiteSpace: 'nowrap' }}>
          <span>{ses.kind === 'study' ? '📚' : '💼'}</span>
          <span>{ses.kind === 'study'
            ? `${tn((SUBJECTS.find((x) => x.key === ses.subjectKey) || {}).name, this.state.lang)} · ${t(this.state.lang, 'school.title')}`
            : `${tn((JOBS[ses.jobIdx] || {}).name, this.state.lang)} · ${t(this.state.lang, 'work.title')}`}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#ffe27a' }}>{fmtClock(this.state.sessionLeft)}</span>
        </div>
        <div style={{ background: 'rgba(34,42,85,.82)', color: '#cdd3ee', padding: '2px 9px', borderRadius: 999, fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap' }}>{t(this.state.lang, 'focus.note')}</div>
      </div>
    );
  }

  renderSchoolMenu() {
    const s = this.state;
    const lvl = s.schoolLevel;
    const graduated = lvl >= SCHOOL.length;
    const sc = graduated ? null : SCHOOL[lvl];
    const rowBtn = { border: 'none', background: '#222a55', color: '#fff', fontFamily: "'Nunito'", fontWeight: 900, fontSize: 10.5, padding: '5px 8px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' };
    return (
      <div onClick={this.closeSchool} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 72 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 208, maxHeight: 'calc(100% - 16px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 13, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: '#222a55' }}>📚 {t(s.lang, 'school.title')}{sc ? ` · ${tn(sc.name, s.lang)}` : ''}</span>
            <div onClick={this.closeSchool} style={{ width: 22, height: 22, border: '2px solid #222a55', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, color: '#222a55', fontSize: 11 }}>✕</div>
          </div>
          {graduated ? (
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#36c98f', padding: '14px 4px' }}>{t(s.lang, 'school.gradA')}<br />{t(s.lang, 'school.gradB')}</div>
          ) : (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 9, lineHeight: 1.4 }}>{t(s.lang, 'school.rule', sc.min, sc.per)}</div>
              {SUBJECTS.map((subj) => {
                const done = s.classDone[subj.key] || 0;
                const grad = done >= sc.per;
                return (
                  <div key={subj.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderBottom: '1px solid #eef0f7' }}>
                    <span style={{ fontSize: 17, width: 22, textAlign: 'center' }}>{subj.icon}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: '#222a55' }}>{tn(subj.name, s.lang)}</span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: grad ? '#36c98f' : '#9aa3cc', width: 30, textAlign: 'right' }}>{done}/{sc.per}</span>
                    {grad
                      ? <span style={{ fontSize: 11, fontWeight: 900, color: '#36c98f', width: 50, textAlign: 'center' }}>{t(s.lang, 'school.graduated')}</span>
                      : <button onClick={() => this.startClass(subj.key)} style={{ ...rowBtn, width: 50 }}>{t(s.lang, 'school.classBtn')}</button>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  renderWorkMenu() {
    const s = this.state;
    const jobs = this.unlockedJobs();
    const wbtn = { border: 'none', background: '#36c98f', color: '#fff', fontFamily: "'Nunito'", fontWeight: 900, fontSize: 10, padding: '5px 6px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', flex: 1 };
    return (
      <div onClick={this.closeWork} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 72 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 212, maxHeight: 'calc(100% - 16px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 13, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: '#222a55' }}>💼 {t(s.lang, 'work.title')} · 💰{s.money}</span>
            <div onClick={this.closeWork} style={{ width: 22, height: 22, border: '2px solid #222a55', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, color: '#222a55', fontSize: 11 }}>✕</div>
          </div>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#9aa3cc', padding: '14px 4px' }}>{t(s.lang, 'work.locked')}</div>
          ) : (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 9, lineHeight: 1.4 }}>{t(s.lang, 'work.intro')}</div>
              {jobs.map((job) => {
                const idx = JOBS.indexOf(job);
                return (
                  <div key={job.key} style={{ padding: '7px 4px', borderBottom: '1px solid #eef0f7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 17, width: 22, textAlign: 'center' }}>{job.icon}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: '#222a55' }}>{tn(job.name, s.lang)}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: '#9aa3cc' }}>💰{job.rate}{t(s.lang, 'work.rateUnit')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {WORK_MINS.map((m) => (
                        <button key={m} onClick={() => this.startWork(idx, m)} style={wbtn}>{t(s.lang, 'work.shift', m, Math.round(job.rate * m))}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- render --------------------------------------------------------------
  render() {
    const s = this.state;
    // A cloud account is required: until one is signed in, the login gate covers
    // everything and the pet stays hidden. (Skipped if the cloud client is down.)
    const gateUp = cloudEnabled() && s.authChecked && !s.user;
    const fullness = clamp(s.fullness, 0, 100);
    const happiness = clamp(s.happiness, 0, 100);
    const cleanliness = clamp(s.cleanliness, 0, 100);
    const health = clamp(s.health, 0, 100);
    const appOpacity = s.opacity / 100;

    // One bubble slot: spoken text takes priority over the needs emoji.
    // Short lines stay on one line (no awkward 2-line wrap); only long ones wrap.
    const sayLen = s.say ? [...s.say].length : 0;
    const bubble = s.say
      // Short lines stay on one line; longer ones (esp. English) get a comfortable
      // fixed width so they wrap into a few lines, not one narrow word per line.
      ? { content: s.say, text: true, nowrap: sayLen <= 14, width: sayLen <= 14 ? null : 188 }
      : (s.emote ? { content: s.emote, text: false, nowrap: true, width: null } : null);

    const dirty = cleanliness <= 25;
    const panelOpen = !!(s.hover || s.shopCat);
    // The action panel lives BELOW the pet and the speech bubble ABOVE it, so the
    // two never overlap (the bubble used to cover the buttons). We only flip the
    // panel above — and the bubble below — when the pet is near the screen's
    // bottom edge and there's no room beneath it. Horizontal nudging keeps both
    // on-screen near the left/right edges (the arrow tracks the pet via shift).
    let panelBelow = true, shiftPanel = 0, shiftBubble = 0;
    if (this.work && this._placed) {
      const roomBelow = (this.work.y + this.work.height) - (this.p.y + this.offY + this.PEN_H);
      const roomAbove = (this.p.y + this.offY) - this.work.y;
      panelBelow = roomBelow >= 150 || roomBelow >= roomAbove;
      const cx = this.p.x + this.WIN_W / 2;
      const clampX = (half) => {
        const lo = this.work.x + half + 4;
        const hi = Math.max(lo, this.work.x + this.work.width - half - 4);
        return clamp(cx, lo, hi) - cx;
      };
      shiftPanel = clampX(88);
      shiftBubble = clampX(105);
    }
    const bubbleBelow = !panelBelow; // bubble sits opposite the panel
    const placement = panelBelow ? 'below' : 'above';
    // The shop list can be tall, so it opens as a window-centred, scrollable
    // sheet (the small anchored bubble would clip it at the window's edge).
    const shopOpen = !!s.shopCat;

    return (
      <div ref={this.rootRef} className="stage" style={{ opacity: appOpacity }}>
        {/* PENGUIN — centered in the window; the window itself walks. */}
        <div
          ref={this.penRef}
          onPointerDown={this.onDown}
          onContextMenu={this.onContext}
          onDoubleClick={this.onDouble}
          style={{ position: s.stage ? 'fixed' : 'absolute', left: '50%', width: 112, height: 130, cursor: 'grab', touchAction: 'none', zIndex: 30, display: (s.onboard || gateUp) ? 'none' : 'block',
            // NOTE: no CSS transform in stage mode — a transform here would make the
            // position:fixed full-screen game canvas relative to this box, not the
            // viewport. Centre with margin instead.
            ...(s.stage ? { bottom: 28, top: 'auto', marginLeft: -56 } : { top: '50%', transform: 'translate(-50%,-50%)' }) }}
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
          {/* pixel focus scene (desk/blackboard/passers-by/weeds) — drawn around the pet */}
          <canvas ref={this.sceneRef} width={this.SCENE_W} height={this.SCENE_H} style={{ position: 'absolute', left: -this.SCENE_OX, top: 0, width: this.SCENE_W, height: this.SCENE_H, imageRendering: 'pixelated', pointerEvents: 'none', zIndex: 2 }} />
          {/* 玩耍 mini-game overlay — interactive pixel pieces drawn around the pet */}
          <canvas ref={this.gameRef}
            width={s.stage ? s.stageW : this.GAME_W} height={s.stage ? s.stageH : this.GAME_H}
            onPointerDown={(e) => { e.stopPropagation(); this.onGameClick(e); }}
            style={s.stage
              ? { position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', imageRendering: 'pixelated', pointerEvents: s.playGame ? 'auto' : 'none', zIndex: 28 }
              : { position: 'absolute', left: -this.GAME_OX, top: 0, width: this.GAME_W, height: this.GAME_H, imageRendering: 'pixelated', pointerEvents: s.playGame ? 'auto' : 'none', zIndex: 28 }} />
          <div ref={this.shadowRef} style={{ position: 'absolute', left: '50%', top: 104, width: 80, height: 18, marginLeft: -40, background: 'radial-gradient(ellipse at center,rgba(20,24,60,.34),rgba(20,24,60,0) 70%)', borderRadius: '50%' }} />
          <div ref={this.partRef} style={{ position: 'absolute', left: 0, top: 0, width: 112, height: 112, pointerEvents: 'none', zIndex: 5 }} />
          <div ref={this.spriteRef} style={{ position: 'absolute', left: 0, top: 0, width: 112, height: 112, willChange: 'transform', transformOrigin: '50% 92%', zIndex: 3 }}>
            <canvas ref={this.canvasRef} width="112" height="112" style={{ width: 112, height: 112, imageRendering: 'pixelated', display: 'block' }} />
          </div>

          {/* flies buzzing around a dirty pet — small pixel flies (navy body + wings) */}
          {dirty && (() => {
            const fly = { width: 3, height: 3, background: '#222a55', borderRadius: 1, boxShadow: '-3px -1px 0 rgba(255,255,255,.85), 4px -1px 0 rgba(255,255,255,.85)' };
            return (
              <>
                <div className="fly" style={{ left: 74, top: 26, animation: 'buzz1 1.1s linear infinite', ...fly }} />
                <div className="fly" style={{ left: 20, top: 40, animation: 'buzz2 1.35s linear infinite', ...fly }} />
                <div className="fly" style={{ left: 48, top: 14, animation: 'buzz3 1.6s linear infinite', ...fly }} />
              </>
            );
          })()}

          {/* sick indicator — a small pixel sweat drop bobbing by the head */}
          {s.sick && !s.dead && (
            <div className="fly" style={{ left: 80, top: 6, width: 5, height: 6, background: '#4cc3ff', borderRadius: '50% 50% 50% 50% / 62% 62% 40% 40%', boxShadow: '0 -2px 0 -1px #4cc3ff', animation: 'buzz3 2.4s ease-in-out infinite' }} />
          )}

          {/* tip pill — above the head, briefly at startup */}
          {s.hint && (
            <div style={{ position: 'absolute', left: '50%', bottom: 134, transform: 'translateX(-50%)', background: '#222a55', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, boxShadow: '0 4px 0 rgba(34,42,85,.3)', zIndex: 25, whiteSpace: 'nowrap', animation: 'hintBob 1.8s ease-in-out infinite', pointerEvents: 'none' }}>{t(s.lang, 'hint.controls')}</div>
          )}

          {/* Auto-update (Option A): a dismissible "new version" pill with a Download button. */}
          {s.update && (
            <div style={{ position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 7, background: '#36c98f', color: '#fff', padding: '5px 6px 5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 900, boxShadow: '0 4px 0 rgba(34,42,85,.28)', zIndex: 45, whiteSpace: 'nowrap', pointerEvents: 'auto' }}>
              <span>🐧 {t(s.lang, 'update.available', s.update.tag)}</span>
              <span onClick={() => openUrl(s.update.url)} style={{ background: '#fff', color: '#1b8f63', borderRadius: 999, padding: '2px 9px', cursor: 'pointer' }}>{t(s.lang, 'update.download')}</span>
              <span onClick={() => this.setState({ update: null })} style={{ cursor: 'pointer', opacity: 0.85, padding: '0 3px' }}>✕</span>
            </div>
          )}

          {/* Auto-update (Option B, Windows): silently downloaded → offer restart-now. */}
          {s.updateReady && (
            <div style={{ position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 7, background: '#5a6acf', color: '#fff', padding: '5px 6px 5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 900, boxShadow: '0 4px 0 rgba(34,42,85,.28)', zIndex: 45, whiteSpace: 'nowrap', pointerEvents: 'auto' }}>
              <span>🐧 {t(s.lang, 'update.ready')}</span>
              <span onClick={() => restartToUpdate()} style={{ background: '#fff', color: '#3a49b8', borderRadius: 999, padding: '2px 9px', cursor: 'pointer' }}>{t(s.lang, 'update.restart')}</span>
              <span onClick={() => this.setState({ updateReady: false })} style={{ cursor: 'pointer', opacity: 0.85, padding: '0 3px' }}>✕</span>
            </div>
          )}

          {bubble && (
            <div style={{ position: 'absolute', left: '50%', ...(bubbleBelow ? { top: 134 } : { bottom: 118 }), transform: `translateX(-50%) translateX(${shiftBubble}px)`, maxWidth: 206, ...(bubble.width ? { width: bubble.width } : {}), boxSizing: 'border-box', background: '#fff', border: '2px solid #222a55', borderRadius: 12, padding: bubble.text ? '5px 10px' : '3px 8px', fontSize: bubble.text ? 12.5 : 17, fontWeight: 800, color: '#222a55', lineHeight: 1.3, textAlign: 'center', boxShadow: '0 3px 0 rgba(34,42,85,.18)', animation: 'bubbleIn .25s ease-out', pointerEvents: 'none', zIndex: 12, whiteSpace: bubble.nowrap ? 'nowrap' : 'normal' }}>{bubble.content}</div>
          )}

          {/* hover care panel + shop — flips above/below the pet, nudged on-screen */}
          <div
            ref={this.hoverRef}
            onPointerDown={this.stopDown}
            style={shopOpen
              ? { position: 'absolute', left: '50%', top: '50%', width: 188, transform: `translate(-50%,-50%) translateX(${shiftPanel}px)`, opacity: 1, pointerEvents: 'auto', transition: 'opacity .14s ease', zIndex: 16, cursor: 'default' }
              : { position: 'absolute', left: '50%', width: 176, marginLeft: -88, ...(panelBelow ? { top: 138 } : { bottom: 138 }), transform: `translateX(${shiftPanel}px) scale(${panelOpen ? 1 : 0.92})`, transformOrigin: panelBelow ? '50% 0%' : '50% 100%', opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? 'auto' : 'none', transition: 'opacity .14s ease, transform .14s ease', zIndex: 14, cursor: 'default' }}
          >
            <StatusBar
              stat={s.hoverStat}
              shopCat={s.shopCat}
              money={s.money}
              placement={placement}
              arrowShift={shiftPanel}
              centered={shopOpen}
              fullness={fullness} cleanliness={cleanliness} happiness={happiness} health={health}
              petName={s.name} lang={s.lang}
              onStat={this.setHoverStat} onLeave={this.clearHoverStat}
              onOpenCat={this.openCat} onBuy={this.buyItem} onBack={this.backShop} onPlay={this.playFree}
            />
          </div>
        </div>

        {/* context menu */}
        {s.menu && (
          <ContextMenu
            x={s.menu.x} y={s.menu.y}
            sick={s.sick} lang={s.lang}
            onClose={this.closeMenu}
            onFeed={() => { this.closeMenu(); this.openCat('food'); }}
            onBath={() => { this.closeMenu(); this.openCat('bath'); }}
            onPlay={() => { this.closeMenu(); this.playFree(); }}
            onSit={this.sitAct}
            onStudy={this.studyAct} onWork={this.workAct} onMedicine={this.openMedicine}
            focusing={!!s.session} onStopFocus={() => { this.closeMenu(); this.requestBreakFocus(); }}
            onCenter={() => { this.closeMenu(); this.recenter(); }}
            onSettings={this.openSettings} onQuit={this.quit}
          />
        )}

        {/* login gate — a cloud account is required before the pet appears */}
        {gateUp && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 95, background: 'rgba(207,224,255,.96)' }}>
            <div onPointerDown={this.stopDown} style={{ width: 212, background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 16, textAlign: 'center', boxShadow: '0 8px 0 rgba(34,42,85,.25)', animation: 'popIn .2s ease-out' }}>
              {/* language picker — make it a multi-nation pet */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 11 }}>
                {LANGS.map((L) => (
                  <div key={L.key} onClick={() => this.setLang(L.key)}
                    style={{ fontSize: 10.5, fontWeight: 900, padding: '3px 11px', borderRadius: 999, cursor: 'pointer',
                      background: s.lang === L.key ? '#222a55' : '#eef1f8', color: s.lang === L.key ? '#fff' : '#8a93c2',
                      border: '2px solid ' + (s.lang === L.key ? '#222a55' : 'transparent') }}>{L.label}</div>
                ))}
              </div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#222a55', marginBottom: 2 }}>{t(s.lang, s.authMode === 'up' ? 'login.signup' : 'login.login')}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#8a93c2', marginBottom: 12, lineHeight: 1.4 }}>
                {t(s.lang, 'login.blurb')}
              </div>
              <input type="email" autoFocus placeholder={t(s.lang, 'login.email')} value={s.authEmail} onChange={this.setAuthEmail}
                style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #222a55', borderRadius: 9, padding: '8px 10px', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 13, color: '#222a55', outline: 'none', marginBottom: 8 }} />
              <input type="password" placeholder={t(s.lang, 'login.password')} value={s.authPw} onChange={this.setAuthPw}
                onKeyDown={(e) => { if (e.key === 'Enter') this.doAuth(s.authMode === 'up' ? 'up' : 'in'); }}
                style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #222a55', borderRadius: 9, padding: '8px 10px', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 13, color: '#222a55', outline: 'none', marginBottom: 10 }} />
              {s.authMsg && <div style={{ fontSize: 10, fontWeight: 800, color: '#e85c93', marginBottom: 8 }}>{s.authMsg}</div>}
              {!s.online && <div style={{ fontSize: 10, fontWeight: 800, color: '#e09a3c', marginBottom: 8 }}>{t(s.lang, 'login.offline')}</div>}
              <div onClick={() => !s.authBusy && this.doAuth(s.authMode === 'up' ? 'up' : 'in')}
                style={{ background: s.authBusy ? '#cfd4e6' : '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: s.authBusy ? 'default' : 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>
                {s.authBusy ? t(s.lang, 'login.busy') : t(s.lang, s.authMode === 'up' ? 'login.doSignup' : 'login.doLogin')}
              </div>
              <div onClick={() => this.setState({ authMode: s.authMode === 'up' ? 'in' : 'up', authMsg: '' })}
                style={{ fontSize: 10.5, fontWeight: 800, color: '#5b6bd0', cursor: 'pointer', marginTop: 11 }}>
                {t(s.lang, s.authMode === 'up' ? 'login.toLogin' : 'login.toSignup')}
              </div>
            </div>
          </div>
        )}

        {/* confirm before breaking a focus session (so a mis-click doesn't reset it) */}
        {s.confirmBreak && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 96 }}>
            <div onPointerDown={this.stopDown} style={{ width: 200, background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 16, textAlign: 'center', boxShadow: '0 8px 0 rgba(34,42,85,.25)', animation: 'popIn .2s ease-out' }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#222a55', marginBottom: 4 }}>
                {t(s.lang, 'focus.breakTitle', t(s.lang, s.session && s.session.kind === 'work' ? 'focus.breakWork' : 'focus.breakClass'))}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8a93c2', marginBottom: 13, lineHeight: 1.4 }}>
                {t(s.lang, 'focus.breakBody')}
              </div>
              <div onClick={() => this.setState({ confirmBreak: false })}
                style={{ background: '#36c98f', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', marginBottom: 8, boxShadow: '0 4px 0 rgba(34,42,85,.2)' }}>
                {t(s.lang, 'focus.keep')}
              </div>
              <div onClick={() => { this.setState({ confirmBreak: false }); this.breakFocus(); }}
                style={{ background: '#fff', color: '#e85c93', border: '2px solid #e85c93', padding: 8, borderRadius: 11, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>
                {t(s.lang, 'focus.stop')}
              </div>
            </div>
          </div>
        )}

        {/* onboarding — choose an egg (gender), then name the pet */}
        {s.onboard && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 85 }}>
            <div onPointerDown={this.stopDown} style={{ width: 212, background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 16, textAlign: 'center', boxShadow: '0 8px 0 rgba(34,42,85,.25)', animation: 'popIn .2s ease-out' }}>
              {s.onboard === 'gender' ? (
                <>
                  <div style={{ fontWeight: 900, fontSize: 14, color: '#222a55', marginBottom: 3 }}>{t(s.lang, 'ob.pickTitle')}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8a93c2', marginBottom: 15 }}>{t(s.lang, 'ob.pickSub')} 🥚</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                    {[['boy', t(s.lang, 'ob.boy'), GENDER_COLOR.boy], ['girl', t(s.lang, 'ob.girl'), GENDER_COLOR.girl]].map(([g, label, color]) => (
                      <div key={g} className="egg-pick" onClick={() => this.chooseGender(g)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative', width: 56, height: 72 }}>
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(#fff7e6,#fde7c4)', border: '3px solid #e0b074', borderRadius: '50% 50% 50% 50% / 60% 60% 42% 42%', boxShadow: '0 4px 0 rgba(180,140,80,.25)' }} />
                          <div style={{ position: 'absolute', left: -3, right: -3, top: '48%', height: 11, background: color, borderRadius: 3, border: '2px solid rgba(0,0,0,.1)' }} />
                          <div style={{ position: 'absolute', left: '50%', top: '48%', width: 14, height: 14, marginLeft: -7, marginTop: -2, borderRadius: '52% 52% 50% 50% / 62% 62% 40% 40%', background: color, border: '2px solid rgba(255,255,255,.55)' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#222a55' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 30, lineHeight: 1 }}>🥚</div>
                  <div style={{ fontWeight: 900, fontSize: 14, color: '#222a55', margin: '8px 0 10px' }}>{t(s.lang, 'ob.nameTitle', t(s.lang, s.gender === 'girl' ? 'ob.her' : 'ob.him'))}</div>
                  <input autoFocus value={s.name} onChange={this.setName} maxLength={12}
                    onKeyDown={(e) => { if (e.key === 'Enter') this.finishOnboard(); }}
                    style={{ width: '100%', border: '2px solid #222a55', borderRadius: 9, padding: '8px 10px', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 14, color: '#222a55', textAlign: 'center', outline: 'none', marginBottom: 12 }} />
                  <div onClick={this.finishOnboard} style={{ background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>{t(s.lang, 'ob.nameGo')} 🐣</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* death / revive overlay */}
        {s.dead && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
            <div onPointerDown={this.stopDown} style={{ width: 204, background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 16, textAlign: 'center', boxShadow: '0 8px 0 rgba(34,42,85,.25)', animation: 'popIn .2s ease-out' }}>
              <div style={{ fontSize: 30, lineHeight: 1 }}>🥀</div>
              <div style={{ fontFamily: "'Nunito'", fontWeight: 900, fontSize: 14, color: '#222a55', margin: '8px 0 3px' }}>{t(s.lang, 'dead.left', s.name || 'Pengu')}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8a93c2', marginBottom: 13 }}>{t(s.lang, 'dead.reason')}</div>
              <div onClick={this.revive} style={{ background: s.money >= 400 ? '#ff6fa5' : '#cfd4e6', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', marginBottom: 8, boxShadow: '0 4px 0 rgba(34,42,85,.2)' }}>{t(s.lang, 'dead.revive')}</div>
              <div onClick={this.restart} style={{ background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>{t(s.lang, 'dead.restart')}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#b9bed3', marginTop: 9 }}>💰 {s.money}</div>
            </div>
          </div>
        )}

        {/* settings */}
        {s.settingsOpen && (
          <SettingsPanel
            name={s.name} speed={s.speed} opacity={s.opacity}
            onName={this.setName} onSpeed={this.setSpeed} onOpacity={this.setOpacity}
            onClose={this.closeSettings}
            cloudOn={cloudEnabled()} user={s.user}
            authEmail={s.authEmail} authPw={s.authPw} authBusy={s.authBusy} authMsg={s.authMsg} syncedAt={s.syncedAt}
            onAuthEmail={this.setAuthEmail} onAuthPw={this.setAuthPw}
            onSignIn={() => this.doAuth('in')} onSignUp={() => this.doAuth('up')}
            onSignOut={this.doSignOut} onSyncNow={this.syncNow}
            lang={s.lang} buddyOn={s.buddyOn} onToggleBuddy={this.toggleBuddy} level={this.levelInfo()}
          />
        )}

        {/* school / work pickers + focus countdown */}
        {s.schoolMenu && this.renderSchoolMenu()}
        {s.workMenu && this.renderWorkMenu()}
        {this.renderFocusBar()}

        {/* 玩耍 — compact picker; the chosen game then plays IN-WINDOW on the pet */}
        {s.playOpen && !s.playGame && <GamePicker games={GAME_LIST} lang={s.lang} onPick={this.startGame} onClose={this.closePlay} />}
        {/* in-window game HUD: live score + a small exit chip (no modal board) */}
        {s.playGame && (
          <div style={{ position: 'absolute', top: 6, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 8px', zIndex: 40, pointerEvents: 'none' }}>
            <span style={{ background: '#222a55', color: '#fff', fontWeight: 900, fontSize: 11, padding: '3px 9px', borderRadius: 999, boxShadow: '0 2px 0 rgba(34,42,85,.3)' }}>
              {tn((GAME_LIST.find((g) => g.key === s.playGame) || {}).name, s.lang)} · {s.gameScore}
            </span>
            <span onClick={this.stopGame} style={{ background: '#fff', color: '#222a55', border: '2px solid #222a55', fontWeight: 900, fontSize: 11, padding: '2px 9px', borderRadius: 999, cursor: 'pointer', pointerEvents: 'auto' }}>{t(s.lang, 'game.end')}</span>
          </div>
        )}
      </div>
    );
  }
}
