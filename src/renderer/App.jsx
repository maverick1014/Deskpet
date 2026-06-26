import React from 'react';
import StatusBar from './components/StatusBar.jsx';
import ContextMenu from './components/ContextMenu.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import {
  loadState, saveState, getStage, moveWindow, onStageUpdate, setInteractive, quitApp, onRecenter,
} from './store.js';
import { genPersonality, normPersonality, traitLabel } from './personality.js';
import { DIA, pick, greetingPool } from './dialogue.js';
import { cloudEnabled, currentUser, onAuth, signIn, signUp, signOut, pullCloud, pushCloud } from './cloud.js';

const BODY = '#222a55';
const BEAK = '#ff9d3d';
const SCARF = '#ff4d6d';

// School → work loop. Education 0..4; STUDY_NEED[edu] = study sessions to reach
// the next level; WORK_PAY/WORK_JOB are indexed by current education tier.
const EDU = ['未入学', '幼儿园', '小学', '中学', '大学'];
const STUDY_NEED = [2, 4, 8, 16];        // 未→幼儿园, 幼儿园→小学, 小学→中学, 中学→大学
const WORK_PAY = [8, 12, 18, 28, 50];    // pay per shift by education tier
const WORK_JOB = ['打零工', '小帮手', '清洁工', '店员', '程序员'];
const SICK_TIER = { mild: 1, medium: 2, severe: 3 };

// Growth: a freshly hatched pet starts as an egg/baby and becomes a full penguin
// after this much total online time.
const GROW_SECONDS = 2 * 3600; // 2 hours
const GENDER_COLOR = { boy: '#ff4d57', girl: '#ff8fce' }; // ribbon / scarf colour
// Low-stakes idle behaviours that a deliberate action (feed/click/drag) interrupts.
const IDLE_ACTIONS = { sit: 1, tv: 1, read: 1, music: 1, stretch: 1, look: 1, wait: 1, flap: 1, sneeze: 1, peck: 1, yawn: 1, preen: 1, doze: 1, wave: 1 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default class App extends React.Component {
  state = {
    fullness: 70, energy: 80, cleanliness: 100, happiness: 80, mood: 'happy',
    health: 100, sick: null, dead: false, education: 0, study: 0,
    name: 'Pengu', volume: 60, speed: 1, opacity: 100,
    money: 200, gender: null, playTime: 0, onboard: null,
    shopCat: null,
    menu: null, settingsOpen: false, emote: null, say: null, hint: true, hover: false, hoverStat: null, loaded: false,
    entering: true, traits: '',
    // Cloud save (optional email+password account). `user` is null when signed out.
    user: null, authEmail: '', authPw: '', authBusy: false, authMsg: '', syncedAt: null,
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
    this._offRecenter = onRecenter(() => this.recenter());

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
    clearTimeout(this._restT);
    clearTimeout(this._heartT);
    clearTimeout(this._hideHoverT);
    clearInterval(this._bathBub);
    clearInterval(this._musicInt);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('mousemove', this._onHover);
    window.removeEventListener('beforeunload', this._onUnload);
    if (this._offStage) this._offStage();
    if (this._offRecenter) this._offRecenter();
    if (this._offAuth) this._offAuth();
    clearTimeout(this._cloudT);
  }

  componentDidUpdate() { this.refreshInteractive(); }

  async boot() {
    const st = await getStage();
    this.applyStage(st);
    const loaded = await this.load();
    this.initCloud(); // restore session + sync in the background (no-op if signed out)
    this.setState({ traits: traitLabel(this.personality) });
    if (!loaded.gender) { this.setState({ onboard: 'gender', entering: false }); return; } // new pet → choose egg + name
    if (loaded.dead) { this.setState({ entering: false }); return; } // dead pets show the revive overlay, no entrance

    // Entrance: the pet hops out of Doraemon's "Anywhere Door" on launch.
    this.p.action = 'enter'; this.p.busy = true;
    this.p.aStart = performance.now(); this.p.aDur = 1000;
    setTimeout(() => { if (this._mounted) { this.sfx('play'); this.spawn('play'); } }, 220);
    this._enterT = setTimeout(() => {
      if (this.p.action === 'enter') { this.p.action = 'idle'; this.p.busy = false; }
      if (this._mounted) this.setState({ entering: false });
    }, 1050);
    // Greet once the entrance lands, by time of day.
    this._greetT = setTimeout(() => {
      if (this._mounted) this.speak(pick(greetingPool(new Date().getHours())), 2800, true);
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
    if (!this.isGrown()) { this.ballAct(); return; } // a baby in the egg can only play ball
    const r = Math.random();
    if (r < 0.34) this.ballAct();
    else if (r < 0.6) this.badmintonAct();
    else if (r < 0.8) this.dance();
    else this.playAct();
  };

  // ---- death / revive ------------------------------------------------------
  die = () => {
    if (this.state.dead) return;
    clearTimeout(this._sitT);
    this.p.action = 'dead'; this.p.busy = true;
    this.setState({ dead: true, sick: this.state.sick || 'severe', hover: false, hoverStat: null, shopCat: null, menu: null });
    this.sfx('sleep');
    this.speak('呜…我撑不住了…💀', 4000, true);
    this.save();
  };
  revive = () => {
    if (this.state.money < 400) { this.speak('钱不够买复活丹…💸', 2200, true); return; }
    this._weakUntil = performance.now() + 90000; // ~1 "day" of weakness (-30% work pay)
    this.setState((s) => ({
      money: s.money - 400, dead: false, sick: null, health: 60,
      fullness: Math.max(s.fullness, 45), cleanliness: Math.max(s.cleanliness, 45),
      happiness: Math.max(s.happiness, 45), energy: Math.max(s.energy, 55),
    }), () => this.save());
    this.rebirth('我…我回来啦！✨');
  };
  restart = () => {
    this.personality = genPersonality();
    this._weakUntil = 0;
    this.setState({
      dead: false, sick: null, health: 100,
      fullness: 70, energy: 80, cleanliness: 100, happiness: 80,
      education: 0, study: 0, money: 200, mood: 'happy',
      traits: traitLabel(this.personality),
    }, () => this.save());
    this.rebirth('你好呀，我是新来的~ 🐧');
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
    this.rebirth(`你好呀，我是${name}~ 🥚`); // the egg pops out of the Anywhere Door
  };
  hatch = () => {
    this.spawn('play'); this.sfx('play');
    this.p.action = 'enter'; this.p.busy = true;
    this.p.aStart = performance.now(); this.p.aDur = 1000;
    clearTimeout(this._enterT);
    this._enterT = setTimeout(() => { if (this.p.action === 'enter') { this.p.action = 'idle'; this.p.busy = false; } }, 1050);
    this.speak('我长大啦！🎉🐧', 3500, true);
    this.save();
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
    this.speak(cured ? '好多了，去休息一下~ 😴' : '感觉好一点了…还得再吃药 💊', 2600, true);
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

  studyAct = () => {
    if (this.busyBlocked()) return;
    this.closeMenu();
    // No age gate on schooling — even a little one can attend 幼儿园.
    if (this.state.education >= 4) { this.speak('已经大学毕业啦！🎓', 2200, true); return; }
    if (this.state.sick) { this.speak('生病了，先看医生吧…🤒', 2200, true); return; }
    if (this.state.energy < 12) { this.speak('太困了，想睡觉…😴', 2200, true); return; }
    this.touch();
    this.p.busy = true; this.p.action = 'study';
    this.bookProp(3000); this.speak(pick(DIA.study), 2600, true);
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
    if (!this.isGrown()) { this.speak(pick(DIA.tooYoung), 2400, true); return; }
    if (this.state.sick) { this.speak('生病了不能上班…🤒', 2200, true); return; }
    if (this.state.energy < 18) { this.speak('太累了，先休息…😴', 2200, true); return; }
    this.touch();
    const edu = this.state.education;
    const weak = this._weakUntil && performance.now() < this._weakUntil; // post-revival weakness
    const pay = Math.round(WORK_PAY[edu] * (weak ? 0.7 : 1));
    this.p.busy = true; this.p.action = 'work';
    this.briefcaseProp(3200); this.speak(`${WORK_JOB[edu]}·${pick(DIA.work)}`, 2600, true);
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
    if (Math.random() < 0.6) this.speak(pick(DIA.miss), 3200, true);
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
    setTimeout(() => el.remove(), dur + 100);
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
    setTimeout(() => el.remove(), dur + 100);
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
    if (Math.random() < 0.4) this.speak('啊…啊嚏！🤧', 1700, true);
    setTimeout(() => { if (this.p.action === 'sneeze') { this.p.action = 'idle'; this.p.busy = false; } }, 950);
  };
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
    if (this._mounted) this.speak('我回来啦~', 1800, true);
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
    const v = !!(this._overPen || this.p.dragging || s.hover || s.shopCat || s.menu || s.settingsOpen || s.dead || s.onboard);
    if (v !== this._iv) { this._iv = v; setInteractive(v); }
  }
  // Show the care panel while the cursor is over the penguin OR the open panel
  // (so you can move from pet → buttons without it closing); hide after a beat.
  onHover(e) {
    const pen = this.penRef.current;
    if (!pen) return;
    // An idle pet turns to watch the cursor as it moves around the window.
    if (this.p.action === 'idle' && !this.p.dragging && this.isGrown()) {
      const r0 = pen.getBoundingClientRect();
      this.p.facing = e.clientX < (r0.left + r0.right) / 2 ? -1 : 1;
    }
    const pad = 8;
    const inRect = (r) => !!r && e.clientX >= r.left - pad && e.clientX <= r.right + pad &&
      e.clientY >= r.top - pad && e.clientY <= r.bottom + pad;
    let over = inRect(pen.getBoundingClientRect());
    if (!over && (this.state.hover || this.state.shopCat) && this.hoverRef.current) over = inRect(this.hoverRef.current.getBoundingClientRect());
    if (over) {
      if (this._hideHoverT) { clearTimeout(this._hideHoverT); this._hideHoverT = null; }
      if (!this._overPen) {
        this._overPen = true; this.refreshInteractive();
        // greet the owner with a wave when the cursor first comes near (debounced)
        if (this.p.action === 'idle' && this.isGrown() && performance.now() > (this._waveCD || 0)) {
          this._waveCD = performance.now() + 16000; this.waveAct();
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
    };
    // Egg / baby stage: a head poking out of a cracked egg — shell cap on top,
    // egg shell as the lower body, with a gender-coloured ribbon band (R).
    const egg = [
      '.....KK.KK......', '...KKKKKKKKKK...', '..KKKKKKKKKKKK..', '...DDDDDDDDDD...',
      '..DDDDDDDDDDDD..', '..DLLLLLLLLLLD..', '..DLLEELLEELLD..', '..DLCLLOOLLCLD..',
      '..DLLLLLLLLLLD..', '..DDLLLLLLLLDD..', '.KKKKKKKKKKKKKK.', 'KKKKRRRRRRRRKKKK',
      'KKKKKKKKKKKKKKKK', '.KKKKKKKKKKKKKK.', '..KKKKKKKKKKKK..', '...KKKKKKKKKK...',
    ];
    this.EGG = egg;
    this.EGG_BLINK = sw(egg, [[6, '..DLLLLLLLLLLD..']]); // eyes shut (squint)
  }
  pal() {
    const ribbon = GENDER_COLOR[this.state.gender] || SCARF;
    return { '.': null, D: BODY, L: '#ffffff', O: BEAK, S: ribbon, E: '#1a1f3d', C: '#ff9bbb', T: '#5bc8ff', G: '#9c8a63', K: '#fde7c4', R: ribbon };
  }
  swap(g, i, row) { const c = g.slice(); c[i] = row; return c; }
  withClosed(g) { return this.swap(g, 6, this.CLOSED); }
  withFeet(g, which) { return this.swap(g, 15, which ? this.FEET_A : this.FEET_B); }
  // Grown once enough online time has accrued; before that it's an egg/baby.
  isGrown() { return (this.state.playTime || 0) >= GROW_SECONDS; }
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
    if (p.action === 'walk' || p.action === 'slide') {
      const dir = Math.sign(p.tx - p.x) || 1;
      p.facing = dir < 0 ? -1 : 1;
      p.x += dir * p.speed * sp * dt / 1000;
      if (Math.abs(p.tx - p.x) < 2 || p.x <= this.minX || p.x >= this.maxX) {
        p.x = clamp(p.x, this.minX, this.maxX);
        if (p.action === 'walk') this.endWalk(); else { p.action = 'idle'; }
      }
      this.pushWindow();
    }

    // Idle FPS throttle: only redraw at ~18fps when nothing is animating, full
    // rate while walking/playing/blinking/dragging. Saves CPU on an always-on app.
    const lowKey = p.action === 'idle' || p.action === 'weak' || p.action === 'sit' || p.action === 'dead' || p.action === 'wait';
    const animating = !lowKey || p.blinkOn || p.dragging;
    if (animating || t - (this._lastDraw || 0) >= 55) {
      this._lastDraw = t;
      this.render2d(t, sp);
    }

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

    let face = this.G.idle;
    if (p.action === 'dead') face = this.G.sad;
    else if (p.action === 'sleep') face = this.G.sleepy;
    else if (p.action === 'play' || p.action === 'dance' || p.action === 'ball' || p.action === 'badminton' || p.action === 'bath') face = this.G.happy;
    else if (p.action === 'sit') face = this.G.happy;
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
    if (p.action === 'look') { faceX = Math.sin((t - p.aStart) / 170) >= 0 ? 1 : -1; rot = Math.sin((t - p.aStart) / 170) * 4; } // glancing around
    const bob = p.action === 'walk' ? -Math.abs(Math.sin(t / 110)) * 4 : (p.action === 'idle' ? Math.sin(t / 720) * 2 : 0);

    if (this.spriteRef.current) {
      this.spriteRef.current.style.transform =
        `translateY(${(bob - jy).toFixed(1)}px) rotate(${(tilt + rot).toFixed(1)}deg) scaleX(${faceX}) scaleY(${sy.toFixed(3)})`;
      this.spriteRef.current.style.filter = p.action === 'dead' ? 'grayscale(1) brightness(1.25)' : 'none';
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
      return { fullness, cleanliness, happiness, energy, health, mood, playTime: (s.playTime || 0) + 1, money: s.money + hourly };
    });
    if (hourly) { this.setEmote('💰', 1500); this.save(); } // celebrate the hourly reward



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
          } else if (!this.isGrown()) {
            // baby: toddle / sit / play ball
            if (roll < 0.42) this.startWalk(); else if (roll > 0.78) this.ballAct(); else this.sitAct();
          } else {
            // grown: a varied mix so it always looks busy doing its own thing —
            // wander, watch TV / read / listen to music, stretch, glance around, sit.
            // After a long stretch with no owner interaction, it quietly misses you.
            const awayLong = Date.now() - (this._lastInteract || 0) > 90000;
            if (awayLong && roll < 0.20) this.waitAct();          // miss the owner, wait patiently
            else if (roll < 0.16) this.startSlide();              // belly slide — whee!
            else if (roll < 0.40) this.startLeisure();            // TV / read / music
            else if (roll < 0.52) this.startWalk();
            else if (roll < 0.61) this.stretchAct();              // yawny stretch
            else if (roll < 0.67) this.lookAct();                 // glance around
            else if (roll < 0.73) this.flapAct();                 // happy wing-flap
            else if (roll < 0.78) this.peckAct();                 // peck at the ground
            else if (roll < 0.80) this.sneezeAct();               // achoo!
            else if (this.state.energy < 45 && roll < 0.84) this.dozeAct(); // nodding off
            else if (this.state.energy < 60 && roll < 0.86) this.yawnAct(); // sleepy yawn
            else if (roll < 0.90) this.preenAct();                // groom feathers
            else if (this.state.energy > 60 && roll < 0.95) this.ballAct();
            else this.sitAct();
          }
        }
      }
    }

    this.maybeChatter();
    if (this.p.action === 'weak' && Math.random() < 0.14) this.speak(pick(DIA.weak));

    // Death: total neglect drains health to 0 (you'll have seen the 🤒 warnings).
    if (this.state.health <= 0 && !this.state.dead) this.die();

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
    if (since < 30000) return;
    // It's an idle companion that mostly keeps to itself, so it only speaks up for
    // a real need (hungry / dirty / tired / sick) — no needy "where'd you go?".
    let pool = null;
    if (s.sick) pool = DIA.sick;
    else if (s.fullness < 30) pool = DIA.hungry;
    else if (s.cleanliness <= 25) pool = DIA.dirty;
    else if (s.energy < 30) pool = DIA.sleepy;
    else if (!this.isGrown()) pool = DIA.baby; // a baby still babbles
    if (!pool) return;                          // content & grown → stay quiet, do its own thing
    const chance = 0.08 + this.personality.liveliness / 1400;
    if (Math.random() > chance) return;
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
    if (this.p.action === 'walk' || this.p.action === 'slide') this.p.action = 'idle';
    // Too hungry to perk up — just plead for food (the care panel shows on hover).
    if (this.p.action === 'weak' || this.state.fullness < 20) { this.speak(pick(DIA.weak), 2200, true); return; }
    // A happy, grown pet adores being petted → heart-eyes instead of a line.
    if (this.isGrown() && this.state.happiness >= 60 && Math.random() < 0.5) { this.loveReact(); return; }
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
  onDouble = (e) => { e.preventDefault(); clearTimeout(this._clickT); if (this.isGrown()) this.dance(); else this.ballAct(); };
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
    ['fullness', 'energy', 'cleanliness', 'happiness', 'health', 'sick', 'dead', 'education', 'study', 'gender', 'playTime', 'money', 'mood', 'name', 'volume', 'speed', 'opacity'].forEach((k) => {
      if (d[k] != null) st[k] = d[k];
    });
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
    return { gender: st.gender, dead: !!st.dead };
  }
  // The full save payload (local + cloud share the exact same shape).
  snapshot() {
    const s = this.state;
    return {
      fullness: s.fullness, energy: s.energy, cleanliness: s.cleanliness, happiness: s.happiness,
      health: s.health, sick: s.sick, dead: s.dead, education: s.education, study: s.study,
      gender: s.gender, playTime: s.playTime, money: s.money, mood: s.mood,
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
        .then(() => { if (this._mounted) this.setState({ syncedAt: Date.now() }); })
        .catch(() => { /* offline / transient — local save still holds the data */ });
    }, 2500);
  }

  // Set up auth: restore any saved session, then keep `user` in sync.
  async initCloud() {
    if (!cloudEnabled()) return;
    this._offAuth = onAuth((user) => { if (this._mounted) this.setState({ user }); });
    try {
      const user = await currentUser();
      if (user) {
        this.setState({ user });
        await this.cloudSyncOnLogin();
      }
    } catch (e) { /* ignore */ }
  }

  // On login: newest wins. If the cloud save is newer than the local one, pull it
  // down and apply it; otherwise push the local save up.
  async cloudSyncOnLogin() {
    try {
      const cloud = await pullCloud();
      const localTs = this._localTs || 0;
      if (cloud && (cloud.ts || 0) > localTs) {
        this.applyCloudSave(cloud);
        if (this._mounted) this.speak('已从云端恢复~', 2200, true);
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
    ['fullness', 'energy', 'cleanliness', 'happiness', 'health', 'sick', 'dead', 'education', 'study', 'gender', 'playTime', 'money', 'mood', 'name', 'volume', 'speed', 'opacity'].forEach((k) => {
      if (d[k] != null) st[k] = d[k];
    });
    if (d.x != null && this.minX != null) { this.p.x = clamp(d.x, this.minX, this.maxX); this.p.tx = this.p.x; }
    if (d.y != null && this.minY != null) { this.p.y = clamp(d.y, this.minY, this.maxY); this.ground = this.p.y; }
    this.pushWindow(true);
    this.setState(st, () => { this.recompute(); this.save(); });
  }

  setAuthEmail = (e) => this.setState({ authEmail: e.target.value });
  setAuthPw = (e) => this.setState({ authPw: e.target.value });

  // mode: 'in' (sign in) | 'up' (register)
  doAuth = async (mode) => {
    const email = (this.state.authEmail || '').trim();
    const pw = this.state.authPw || '';
    if (!email || !pw) { this.setState({ authMsg: '请输入邮箱和密码' }); return; }
    if (pw.length < 6) { this.setState({ authMsg: '密码至少 6 位' }); return; }
    this.setState({ authBusy: true, authMsg: '' });
    try {
      if (mode === 'up') {
        const res = await signUp(email, pw);
        if (!res.session) { // email confirmation required
          this.setState({ authBusy: false, authMsg: '注册成功，请到邮箱点击确认后再登录。' });
          return;
        }
      } else {
        await signIn(email, pw);
      }
      const user = await currentUser();
      this.setState({ user, authPw: '', authMsg: '' });
      if (user) await this.cloudSyncOnLogin();
    } catch (e) {
      this.setState({ authMsg: (e && e.message) || '操作失败，请重试' });
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

    return (
      <div ref={this.rootRef} className="stage" style={{ opacity: appOpacity }}>
        {/* PENGUIN — centered in the window; the window itself walks. */}
        <div
          ref={this.penRef}
          onPointerDown={this.onDown}
          onContextMenu={this.onContext}
          onDoubleClick={this.onDouble}
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 112, height: 130, cursor: 'grab', touchAction: 'none', zIndex: 30, display: s.onboard ? 'none' : 'block' }}
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
          {s.sick && !s.dead && (
            <div className="fly" style={{ left: 76, top: 6, fontSize: 17, animation: 'buzz3 2.4s ease-in-out infinite' }}>🤒</div>
          )}
          {/* a little spirit drifting up from a departed pet */}
          {s.dead && (
            <div className="fly" style={{ left: 58, top: -2, fontSize: 18, animation: 'buzz2 3s ease-in-out infinite' }}>👻</div>
          )}

          {/* tip pill — above the head, briefly at startup */}
          {s.hint && (
            <div style={{ position: 'absolute', left: '50%', bottom: 134, transform: 'translateX(-50%)', background: '#222a55', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, boxShadow: '0 4px 0 rgba(34,42,85,.3)', zIndex: 25, whiteSpace: 'nowrap', animation: 'hintBob 1.8s ease-in-out infinite', pointerEvents: 'none' }}>单击 · 拖动 · 右键 🐧</div>
          )}

          {bubble && (
            <div style={{ position: 'absolute', left: '50%', ...(bubbleBelow ? { top: 134 } : { bottom: 118 }), transform: `translateX(-50%) translateX(${shiftBubble}px)`, maxWidth: 206, background: '#fff', border: '2px solid #222a55', borderRadius: 12, padding: bubble.text ? '5px 10px' : '3px 8px', fontSize: bubble.text ? 12.5 : 17, fontWeight: 800, color: '#222a55', lineHeight: 1.3, textAlign: 'center', boxShadow: '0 3px 0 rgba(34,42,85,.18)', animation: 'bubbleIn .25s ease-out', pointerEvents: 'none', zIndex: 12, whiteSpace: bubble.nowrap ? 'nowrap' : 'normal' }}>{bubble.content}</div>
          )}

          {/* hover care panel + shop — flips above/below the pet, nudged on-screen */}
          <div
            ref={this.hoverRef}
            onPointerDown={this.stopDown}
            style={{ position: 'absolute', left: '50%', width: 176, marginLeft: -88, ...(panelBelow ? { top: 138 } : { bottom: 138 }), transform: `translateX(${shiftPanel}px) scale(${panelOpen ? 1 : 0.92})`, transformOrigin: panelBelow ? '50% 0%' : '50% 100%', opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? 'auto' : 'none', transition: 'opacity .14s ease, transform .14s ease', zIndex: 14, cursor: 'default' }}
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
            onCenter={() => { this.closeMenu(); this.recenter(); }}
            onSettings={this.openSettings} onQuit={this.quit}
          />
        )}

        {/* onboarding — choose an egg (gender), then name the pet */}
        {s.onboard && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 85 }}>
            <div onPointerDown={this.stopDown} style={{ width: 212, background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 16, textAlign: 'center', boxShadow: '0 8px 0 rgba(34,42,85,.25)', animation: 'popIn .2s ease-out' }}>
              {s.onboard === 'gender' ? (
                <>
                  <div style={{ fontWeight: 900, fontSize: 14, color: '#222a55', marginBottom: 3 }}>选择你的小伙伴</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8a93c2', marginBottom: 15 }}>挑一颗蛋，开始养成 🥚</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                    {[['boy', '男孩', GENDER_COLOR.boy], ['girl', '女孩', GENDER_COLOR.girl]].map(([g, label, color]) => (
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
                  <div style={{ fontWeight: 900, fontSize: 14, color: '#222a55', margin: '8px 0 10px' }}>给{s.gender === 'girl' ? '她' : '他'}取个名字</div>
                  <input autoFocus value={s.name} onChange={this.setName} maxLength={12}
                    onKeyDown={(e) => { if (e.key === 'Enter') this.finishOnboard(); }}
                    style={{ width: '100%', border: '2px solid #222a55', borderRadius: 9, padding: '8px 10px', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 14, color: '#222a55', textAlign: 'center', outline: 'none', marginBottom: 12 }} />
                  <div onClick={this.finishOnboard} style={{ background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>就叫这个名字！🐣</div>
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
              <div style={{ fontFamily: "'Nunito'", fontWeight: 900, fontSize: 14, color: '#222a55', margin: '8px 0 3px' }}>{s.name || 'Pengu'} 离开了…</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8a93c2', marginBottom: 13 }}>太久没人照顾了 💔</div>
              <div onClick={this.revive} style={{ background: s.money >= 400 ? '#ff6fa5' : '#cfd4e6', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', marginBottom: 8, boxShadow: '0 4px 0 rgba(34,42,85,.2)' }}>💊 复活丹 · ¥400</div>
              <div onClick={this.restart} style={{ background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>🔄 重新养一只</div>
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
          />
        )}
      </div>
    );
  }
}
