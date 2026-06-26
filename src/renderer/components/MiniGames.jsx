import React, { useState, useEffect, useRef } from 'react';

// 玩耍 mini-games. A small picker opens six self-contained games that play inside
// the pet window. Each round calls onReward(happy, coins) and onDone(message);
// the shell then shows a result screen with "再玩一次 / 返回".
//
// Games:
//  1 接小鱼  Catch    — drag to catch falling fish (timed)
//  2 戳泡泡  Pop      — tap rising bubbles before they escape (timed)
//  3 石头剪刀布 RPS    — rock/paper/scissors vs the penguin
//  4 猜小鱼  Cups     — find the fish after the cups shuffle
//  5 接球    Fetch    — stop the marker in the zone to catch the ball
//  6 跟我拍  Simon    — repeat the penguin's growing colour sequence

const W = 204, H = 286;
const area = { position: 'relative', width: W, height: H, margin: '0 auto', background: 'linear-gradient(#eaf2ff,#dfeaff)', border: '2px solid #cfd8ee', borderRadius: 12, overflow: 'hidden' };
const hud = { position: 'absolute', top: 4, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 8px', fontSize: 11, fontWeight: 900, color: '#222a55', pointerEvents: 'none' };

const GAMES = [
  { key: 'catch', icon: '🐟', name: '接小鱼' },
  { key: 'pop', icon: '🫧', name: '戳泡泡' },
  { key: 'rps', icon: '✌️', name: '猜拳' },
  { key: 'cups', icon: '🥤', name: '猜小鱼' },
  { key: 'fetch', icon: '🎾', name: '接球' },
  { key: 'simon', icon: '🧠', name: '跟我拍' },
];

// ---- 1. Catch falling fish ------------------------------------------------
function Catch({ onReward, onDone }) {
  const fish = useRef([]); const idc = useRef(0); const basket = useRef(W / 2); const score = useRef(0);
  const [left, setLeft] = useState(20); const [, frame] = useState(0);
  useEffect(() => {
    const spawn = setInterval(() => { fish.current.push({ id: idc.current++, x: 16 + Math.random() * (W - 32), y: -8 }); }, 720);
    const tick = setInterval(() => {
      const kept = [];
      for (const it of fish.current) { it.y += 9; if (it.y >= H - 30) { if (Math.abs(it.x - basket.current) < 30) score.current++; } else kept.push(it); }
      fish.current = kept; frame((f) => f + 1);
    }, 55);
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => { clearInterval(spawn); clearInterval(tick); clearInterval(t); };
  }, []);
  useEffect(() => { if (left <= 0) { onReward(Math.min(22, score.current * 2), Math.floor(score.current / 2)); onDone(`接到 ${score.current} 条小鱼 🐟`); } }, [left]);
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); basket.current = Math.max(18, Math.min(W - 18, e.clientX - r.left)); frame((f) => f + 1); };
  return (
    <div onMouseMove={move} style={{ ...area, cursor: 'none' }}>
      <div style={hud}><span>⏱ {left}s</span><span>🐟 {score.current}</span></div>
      {fish.current.map((it) => <div key={it.id} style={{ position: 'absolute', left: it.x - 9, top: it.y, fontSize: 18, pointerEvents: 'none' }}>🐟</div>)}
      <div style={{ position: 'absolute', left: basket.current - 15, top: H - 30, fontSize: 26, pointerEvents: 'none' }}>🧺</div>
    </div>
  );
}

// ---- 2. Pop rising bubbles ------------------------------------------------
function Pop({ onReward, onDone }) {
  const bub = useRef([]); const idc = useRef(0); const score = useRef(0);
  const [left, setLeft] = useState(18); const [, frame] = useState(0);
  const COLORS = ['rgba(120,180,255,.6)', 'rgba(255,160,200,.6)', 'rgba(140,230,180,.6)', 'rgba(255,220,120,.6)'];
  useEffect(() => {
    const spawn = setInterval(() => { bub.current.push({ id: idc.current++, x: 14 + Math.random() * (W - 56), y: H, r: 24 + Math.random() * 16, c: COLORS[idc.current % 4], v: 1.4 + Math.random() * 1.4 }); }, 520);
    const tick = setInterval(() => { bub.current = bub.current.filter((b) => { b.y -= b.v * 2.2; return b.y > -40; }); frame((f) => f + 1); }, 40);
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => { clearInterval(spawn); clearInterval(tick); clearInterval(t); };
  }, []);
  useEffect(() => { if (left <= 0) { onReward(Math.min(22, score.current), Math.floor(score.current / 4)); onDone(`戳破 ${score.current} 个泡泡 🫧`); } }, [left]);
  const pop = (id) => { bub.current = bub.current.filter((b) => b.id !== id); score.current++; frame((f) => f + 1); };
  return (
    <div style={area}>
      <div style={hud}><span>⏱ {left}s</span><span>🫧 {score.current}</span></div>
      {bub.current.map((b) => (
        <div key={b.id} onClick={() => pop(b.id)} style={{ position: 'absolute', left: b.x, top: b.y, width: b.r, height: b.r, borderRadius: '50%', background: b.c, border: '2px solid rgba(255,255,255,.7)', cursor: 'pointer' }} />
      ))}
    </div>
  );
}

// ---- 3. Rock / paper / scissors -------------------------------------------
function RPS({ onReward, onDone }) {
  const CH = [{ k: 'rock', e: '✊' }, { k: 'paper', e: '✋' }, { k: 'scissors', e: '✌️' }];
  const [res, setRes] = useState(null);
  const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  const play = (you) => {
    const pet = CH[Math.floor(Math.random() * 3)].k;
    const r = you === pet ? 'draw' : (beats[you] === pet ? 'win' : 'lose');
    setRes({ you, pet, r });
    onReward(r === 'win' ? 8 : (r === 'draw' ? 2 : 0), r === 'win' ? 3 : 0);
    setTimeout(() => onDone(r === 'win' ? '赢啦！🎉' : (r === 'draw' ? '平局~' : '输了，再来！')), 900);
  };
  const emo = (k) => CH.find((c) => c.k === k).e;
  return (
    <div style={{ ...area, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      {res ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>{emo(res.pet)}</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6b74a8', margin: '6px 0' }}>企鹅出了 {emo(res.pet)} · 你出了 {emo(res.you)}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: res.r === 'win' ? '#36c98f' : (res.r === 'lose' ? '#ff5a5f' : '#8a93c2') }}>{res.r === 'win' ? '你赢了！' : (res.r === 'lose' ? '你输了' : '平局')}</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 38 }}>🐧❓</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#6b74a8' }}>出什么呢？</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {CH.map((c) => <div key={c.k} onClick={() => play(c.k)} style={{ fontSize: 32, cursor: 'pointer', padding: 4 }}>{c.e}</div>)}
          </div>
        </>
      )}
    </div>
  );
}

// ---- 4. Cup shuffle -------------------------------------------------------
function Cups({ onReward, onDone }) {
  const F = useRef(Math.floor(Math.random() * 3)).current; // cup id with the fish
  const [order, setOrder] = useState([0, 1, 2]); // cup ids in slot order
  const [phase, setPhase] = useState('peek'); // peek -> shuffle -> pick -> done
  const [picked, setPicked] = useState(-1);
  const step = 64, x0 = (W - step * 3) / 2 + 6;
  useEffect(() => {
    const ts = [];
    ts.push(setTimeout(() => setPhase('shuffle'), 1200));
    for (let i = 0; i < 7; i++) ts.push(setTimeout(() => setOrder((o) => { const n = [...o]; const a = Math.floor(Math.random() * 3); let b = Math.floor(Math.random() * 3); while (b === a) b = Math.floor(Math.random() * 3); [n[a], n[b]] = [n[b], n[a]]; return n; }), 1300 + i * 360));
    ts.push(setTimeout(() => setPhase('pick'), 1300 + 7 * 360 + 200));
    return () => ts.forEach(clearTimeout);
  }, []);
  const pick = (cupId) => {
    if (phase !== 'pick') return;
    setPicked(cupId); setPhase('done');
    const win = cupId === F;
    onReward(win ? 10 : 1, win ? 6 : 0);
    setTimeout(() => onDone(win ? '猜对啦！🐟' : '可惜，猜错了~'), 900);
  };
  return (
    <div style={{ ...area, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#6b74a8' }}>
        {phase === 'peek' ? '记住小鱼在哪～' : phase === 'shuffle' ? '洗杯中…' : phase === 'pick' ? '小鱼在哪个杯子下？' : ''}
      </div>
      {[0, 1, 2].map((cupId) => {
        const slot = order.indexOf(cupId);
        const lifted = phase === 'peek' || (phase === 'done' && picked === cupId);
        return (
          <div key={cupId} onClick={() => pick(cupId)} style={{ position: 'absolute', top: 120, left: x0 + slot * step, width: 52, height: 60, cursor: phase === 'pick' ? 'pointer' : 'default', transition: 'left .32s ease' }}>
            {(lifted && cupId === F) && <div style={{ position: 'absolute', bottom: 2, left: 16, fontSize: 20 }}>🐟</div>}
            <div style={{ position: 'absolute', bottom: lifted ? 26 : 0, left: 0, fontSize: 40, transition: 'bottom .25s ease' }}>🥤</div>
          </div>
        );
      })}
    </div>
  );
}

// ---- 5. Fetch (timing) ----------------------------------------------------
function Fetch({ onReward, onDone }) {
  const pos = useRef(8); const dir = useRef(1); const done = useRef(false); const [, frame] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => { pos.current += dir.current * 3.2; if (pos.current >= 100) { pos.current = 100; dir.current = -1; } if (pos.current <= 0) { pos.current = 0; dir.current = 1; } frame((f) => f + 1); }, 28);
    return () => clearInterval(iv);
  }, []);
  const stop = () => {
    if (done.current) return; done.current = true;
    const inZone = pos.current >= 40 && pos.current <= 60;
    onReward(inZone ? 10 : 1, inZone ? 4 : 0);
    setTimeout(() => onDone(inZone ? '漂亮，接住啦！🎾' : '差一点～'), 700);
  };
  return (
    <div style={{ ...area, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 40 }}>🐧🎾</div>
      <div style={{ position: 'relative', width: 168, height: 16, background: '#e7edf7', border: '2px solid #222a55', borderRadius: 8 }}>
        <div style={{ position: 'absolute', left: '40%', width: '20%', top: 0, bottom: 0, background: 'rgba(54,201,143,.45)' }} />
        <div style={{ position: 'absolute', left: `calc(${pos.current}% - 4px)`, top: -3, width: 8, height: 18, background: '#ff5a5f', borderRadius: 3, border: '2px solid #222a55' }} />
      </div>
      <div onClick={stop} style={{ background: '#36c98f', color: '#fff', fontWeight: 900, fontSize: 13, padding: '7px 22px', borderRadius: 10, cursor: 'pointer', boxShadow: '0 3px 0 rgba(34,42,85,.25)' }}>接！</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc' }}>在绿色区域按下</div>
    </div>
  );
}

// ---- 6. Simon (repeat the sequence) ---------------------------------------
function Simon({ onReward, onDone }) {
  const PADS = ['#ff5a5f', '#36c98f', '#4cc3ff', '#ffd23d'];
  const seq = useRef([]); const ui = useRef(0); const timers = useRef([]);
  const [lit, setLit] = useState(-1); const [phase, setPhase] = useState('show'); const [round, setRound] = useState(0);
  const clearT = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const show = (s) => {
    setPhase('show'); clearT();
    s.forEach((p, i) => {
      timers.current.push(setTimeout(() => setLit(p), 560 * i + 250));
      timers.current.push(setTimeout(() => setLit(-1), 560 * i + 590));
    });
    timers.current.push(setTimeout(() => { ui.current = 0; setPhase('input'); }, 560 * s.length + 320));
  };
  const nextRound = () => { seq.current = [...seq.current, Math.floor(Math.random() * 4)]; setRound(seq.current.length); show(seq.current); };
  useEffect(() => { nextRound(); return clearT; }, []);
  const tap = (p) => {
    if (phase !== 'input') return;
    setLit(p); timers.current.push(setTimeout(() => setLit(-1), 150));
    if (seq.current[ui.current] === p) {
      ui.current++;
      if (ui.current === seq.current.length) {
        if (seq.current.length >= 6) { onReward(24, 8); setTimeout(() => onDone(`记住了 ${seq.current.length} 步！🧠`), 400); }
        else { setPhase('show'); timers.current.push(setTimeout(nextRound, 720)); }
      }
    } else {
      const got = seq.current.length - 1;
      onReward(Math.min(20, got * 4), Math.floor(got / 2));
      setTimeout(() => onDone(`坚持了 ${got} 步~`), 300);
    }
  };
  return (
    <div style={{ ...area, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#6b74a8' }}>{phase === 'input' ? '到你了！跟着拍' : '看企鹅拍～'} · 第 {round} 步</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {PADS.map((c, i) => (
          <div key={i} onClick={() => tap(i)} style={{ width: 64, height: 64, borderRadius: 12, background: c, opacity: lit === i ? 1 : 0.42, border: '3px solid rgba(255,255,255,.6)', cursor: phase === 'input' ? 'pointer' : 'default', transition: 'opacity .1s' }} />
        ))}
      </div>
    </div>
  );
}

const VIEWS = { catch: Catch, pop: Pop, rps: RPS, cups: Cups, fetch: Fetch, simon: Simon };

export default function MiniGames({ onClose, onReward }) {
  const [view, setView] = useState('menu');
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0); // bump to remount a game on replay
  const Game = VIEWS[view];
  const title = view === 'menu' ? '🎮 玩耍' : (GAMES.find((g) => g.key === view) || {}).name;
  const reward = (happy, coins) => onReward(happy || 0, coins || 0);
  const done = (msg) => setResult(msg);
  const backToMenu = () => { setResult(null); setView('menu'); };
  const replay = () => { setResult(null); setRound((r) => r + 1); };
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.4)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 74 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 232, maxHeight: 'calc(100% - 12px)', boxSizing: 'border-box', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 12, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span onClick={() => view !== 'menu' && backToMenu()} style={{ fontSize: 11, fontWeight: 900, color: '#6b74a8', cursor: view === 'menu' ? 'default' : 'pointer', width: 34 }}>{view === 'menu' ? '' : '‹ 返回'}</span>
          <span style={{ fontWeight: 900, fontSize: 14, color: '#222a55' }}>{title}</span>
          <div onClick={onClose} style={{ width: 22, height: 22, border: '2px solid #222a55', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, color: '#222a55', fontSize: 11 }}>✕</div>
        </div>

        {view === 'menu' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {GAMES.map((g) => (
              <div key={g.key} onClick={() => { setResult(null); setRound((r) => r + 1); setView(g.key); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', borderRadius: 12, border: '2px solid #222a55', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 10.5, color: '#222a55' }}>
                <span style={{ fontSize: 22 }}>{g.icon}</span>{g.name}
              </div>
            ))}
          </div>
        ) : result ? (
          <div style={{ ...area, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#222a55', textAlign: 'center', padding: '0 10px' }}>{result}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div onClick={replay} style={{ background: '#36c98f', color: '#fff', fontWeight: 900, fontSize: 12, padding: '7px 16px', borderRadius: 10, cursor: 'pointer' }}>再玩一次</div>
              <div onClick={backToMenu} style={{ background: '#8a93c2', color: '#fff', fontWeight: 900, fontSize: 12, padding: '7px 16px', borderRadius: 10, cursor: 'pointer' }}>返回</div>
            </div>
          </div>
        ) : (
          <Game key={round} onReward={reward} onDone={done} />
        )}
      </div>
    </div>
  );
}
