import { useState, useEffect, useRef } from "react";

const FUNCTION_LIBRARY = [
  { id: 1,  label: 'x²',        f: x => x ** 2,                   df: x => 2 * x,                                       F: x => x ** 3 / 3 },
  { id: 2,  label: 'x³',        f: x => x ** 3,                   df: x => 3 * x ** 2,                                  F: x => x ** 4 / 4 },
  { id: 3,  label: 'sin(x)',     f: x => Math.sin(x),              df: x => Math.cos(x),                                 F: x => -Math.cos(x) },
  { id: 4,  label: 'cos(x)',     f: x => Math.cos(x),              df: x => -Math.sin(x),                                F: x => Math.sin(x) },
  { id: 5,  label: 'eˣ',        f: x => Math.exp(x),              df: x => Math.exp(x),                                 F: x => Math.exp(x) },
  { id: 6,  label: 'ln(x)',      f: x => x > 0 ? Math.log(x) : NaN,  df: x => x > 0 ? 1 / x : NaN,                    F: x => x > 0 ? x * Math.log(x) - x : NaN },
  { id: 7,  label: '1/x',        f: x => x !== 0 ? 1 / x : NaN,  df: x => x !== 0 ? -1 / x ** 2 : NaN,                F: x => x !== 0 ? Math.log(Math.abs(x)) : NaN },
  { id: 8,  label: '1/x²',       f: x => x !== 0 ? 1 / x ** 2 : NaN, df: x => x !== 0 ? -2 / x ** 3 : NaN,           F: x => x !== 0 ? -1 / x : NaN },
  { id: 9,  label: '√x',         f: x => x >= 0 ? Math.sqrt(x) : NaN, df: x => x > 0 ? 1 / (2 * Math.sqrt(x)) : NaN, F: x => x >= 0 ? (2 / 3) * x ** 1.5 : NaN },
  { id: 10, label: '|x|',        f: x => Math.abs(x),             df: x => x > 0 ? 1 : x < 0 ? -1 : NaN,              F: x => x * Math.abs(x) / 2 },
  { id: 11, label: 'x·sin(x)',   f: x => x * Math.sin(x),         df: x => Math.sin(x) + x * Math.cos(x),              F: x => Math.sin(x) - x * Math.cos(x) },
  { id: 12, label: 'x·eˣ',      f: x => x * Math.exp(x),         df: x => Math.exp(x) * (x + 1),                      F: x => Math.exp(x) * (x - 1) },
  { id: 13, label: 'sin(x)/x',   f: x => x !== 0 ? Math.sin(x) / x : 1, df: x => x !== 0 ? (x * Math.cos(x) - Math.sin(x)) / x ** 2 : 0, F: _ => NaN },
  { id: 14, label: 'x²·sin(x)',  f: x => x ** 2 * Math.sin(x),   df: x => 2 * x * Math.sin(x) + x ** 2 * Math.cos(x), F: x => 2 * x * Math.sin(x) - (x ** 2 - 2) * Math.cos(x) },
  { id: 15, label: 'tan(x)',     f: x => { const v = Math.tan(x); return Math.abs(v) > 100 ? NaN : v; }, df: x => { const c = Math.cos(x); return Math.abs(c) < 0.01 ? NaN : 1 / c ** 2; }, F: x => { const c = Math.cos(x); return Math.abs(c) < 0.01 ? NaN : -Math.log(Math.abs(c)); } },
  { id: 16, label: 'arctan(x)',  f: x => Math.atan(x),            df: x => 1 / (1 + x ** 2),                            F: x => x * Math.atan(x) - 0.5 * Math.log(1 + x ** 2) },
  { id: 17, label: 'x^(1/3)',    f: x => Math.cbrt(x),            df: x => x !== 0 ? (1 / 3) * Math.abs(x) ** (-2 / 3) * Math.sign(x) : NaN, F: x => (3 / 4) * Math.cbrt(x) ** 4 },
  { id: 18, label: '2ˣ',        f: x => Math.pow(2, x),          df: x => Math.pow(2, x) * Math.log(2),               F: x => Math.pow(2, x) / Math.log(2) },
  { id: 19, label: 'x²-x',      f: x => x ** 2 - x,              df: x => 2 * x - 1,                                   F: x => x ** 3 / 3 - x ** 2 / 2 },
  { id: 20, label: 'arcsin(x)', f: x => Math.abs(x) <= 1 ? Math.asin(x) : NaN, df: x => Math.abs(x) < 1 ? 1 / Math.sqrt(1 - x ** 2) : NaN, F: x => Math.abs(x) <= 1 ? x * Math.asin(x) + Math.sqrt(1 - x ** 2) : NaN },
];

const DIFFICULTY = {
  easy:   { label: 'Easy',   numFunctions: 1, bank: [1, 2, 3, 5, 9], nastyGuarantee: null },
  medium: { label: 'Medium', numFunctions: 2, bank: [1, 2, 3, 4, 5, 6, 7, 9, 10, 16], nastyGuarantee: { mustIncludeOneOf: [6, 7, 9, 10] } },
  hard:   { label: 'Hard',   numFunctions: 3, bank: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 19], nastyGuarantee: { mustIncludeOneOf: [3, 4, 15], mustIncludeAnotherOf: [11, 12] } },
  chaos:  { label: 'Chaos',  numFunctions: 4, bank: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], nastyGuarantee: { mustIncludeOneOf: [13, 14, 20] } },
};

const FUNCTION_COLORS = ['#00ff88', '#ff6b6b', '#66b3ff', '#ffd700'];

const POWERS = [
  { id: 'reload',       rarity: 'common',    label: 'RELOAD',        desc: '+1 shot this turn · stacks with other powers and itself' },
  { id: 'trapCard',     rarity: 'common',    label: 'TRAP CARD',     desc: "Set a hidden trap square — ends opponent's turn if they fire there (you get 2 bonus turns)" },
  { id: 'bonus',        rarity: 'uncommon',  label: 'BONUS',         desc: 'Auto-triggers on a correct function guess this turn — gain 2 extra shots immediately' },
  { id: 'parabolaShot', rarity: 'uncommon',  label: 'PARABOLA SHOT', desc: 'Scan a grid for intersecting functions' },
  { id: 'heatCheck',    rarity: 'rare',      label: 'HEAT CHECK',    desc: 'Keep firing as long as you hit — miss stops shooting · caps at 3 shots · must activate before your first shot' },
  { id: 'bindingVow',   rarity: 'rare',      label: 'BINDING VOW',   desc: 'Forfeit f(x) guesses for the rest of the round — gain 2 shots every turn (including bonus turns)' },
  { id: 'partyPerry',   rarity: 'rare',      label: 'PARTY PERRY',   desc: "Guess how many hats Perry has — get it right for 2 new powers" },
  { id: 'spiralShot',   rarity: 'rare',      label: 'SPIRAL SHOT',   desc: 'Scan a grid with an Archimedean spiral — shows all intersection points' },
  { id: 'fogOfWar',     rarity: 'legendary', label: 'FOG OF WAR',    desc: "For 3 of your opponent's turns, their grid is randomly assigned and hidden — they can't see or choose it" },
  { id: 'omniscience',  rarity: 'legendary', label: 'OMNISCIENCE',   desc: 'Choose a grid — see all 25 squares for 3 seconds' },
  { id: 'omnipotence',  rarity: 'legendary', label: 'OMNIPOTENCE',   desc: "Destroy one of your opponent's grids — they can't fire in it this round" },
  { id: 'glitch',       rarity: 'legendary', label: 'GLITCH',        desc: 'Auto-triggers on a wrong guess — you steal the bonus turns instead of your opponent getting them' },
  { id: 'marauder',     rarity: 'legendary', label: 'MARAUDER',      desc: "Steal one of your opponent's powers — they lose it, you gain it to use this round" },
];

const RARITY_CONFIG = {
  common:    { label: 'COMMON',    color: '#999999' },
  uncommon:  { label: 'UNCOMMON',  color: '#00cc66' },
  rare:      { label: 'RARE',      color: '#4499ff' },
  legendary: { label: 'LEGENDARY', color: '#ffd700' },
};

const PARABOLA_PRESETS = [
  { label: 'y = x²',      fn: x => x ** 2 },
  { label: 'y = x² − 1',  fn: x => x ** 2 - 1 },
  { label: 'y = x² − 2',  fn: x => x ** 2 - 2 },
  { label: 'y = −x²',     fn: x => -(x ** 2) },
  { label: 'y = −x² + 2', fn: x => -(x ** 2) + 2 },
];

const SPIRAL_THETA_MAX = 4 * Math.PI;
const SPIRAL_PRESETS = [
  { label: 'Clockwise',         fn: t => { const r = t / (2 * Math.PI); return { x: r * Math.cos(t), y: r * Math.sin(t) }; } },
  { label: 'Counter-clockwise', fn: t => { const r = t / (2 * Math.PI); return { x: r * Math.cos(-t), y: r * Math.sin(-t) }; } },
];

function availableGrids(destroyedGrids, bindingVowActive) {
  return ['f', 'df', 'F'].filter(k =>
    !destroyedGrids.includes(k) && !(bindingVowActive && k === 'f')
  );
}

function rollPowers(count, doubled = false) {
  return Array.from({ length: count }, () => {
    const r = Math.random();
    const rarity = doubled
      ? (r < 0.10 ? 'common' : r < 0.40 ? 'uncommon' : r < 0.80 ? 'rare' : 'legendary')
      : (r < 0.40 ? 'common' : r < 0.70 ? 'uncommon' : r < 0.90 ? 'rare' : 'legendary');
    const pool = POWERS.filter(p => p.rarity === rarity);
    return { ...pool[Math.floor(Math.random() * pool.length)], used: false };
  });
}

function rollBrPowers(count, doubled = false) {
  const pool = POWERS.filter(p => p.id !== 'trapCard');
  return Array.from({ length: count }, () => {
    const r = Math.random();
    const rarity = doubled
      ? (r < 0.10 ? 'common' : r < 0.40 ? 'uncommon' : r < 0.80 ? 'rare' : 'legendary')
      : (r < 0.40 ? 'common' : r < 0.70 ? 'uncommon' : r < 0.90 ? 'rare' : 'legendary');
    const tier = pool.filter(p => p.rarity === rarity);
    const src = tier.length > 0 ? tier : pool;
    return { ...src[Math.floor(Math.random() * src.length)], used: false };
  });
}

function selectFunctions(difficulty) {
  const { bank, numFunctions, nastyGuarantee } = DIFFICULTY[difficulty];
  const selected = [];

  if (nastyGuarantee) {
    const nastyPool = nastyGuarantee.mustIncludeOneOf.filter(id => bank.includes(id));
    selected.push(nastyPool[Math.floor(Math.random() * nastyPool.length)]);

    if (nastyGuarantee.mustIncludeAnotherOf) {
      const secondPool = nastyGuarantee.mustIncludeAnotherOf.filter(id => bank.includes(id) && !selected.includes(id));
      selected.push(secondPool[Math.floor(Math.random() * secondPool.length)]);
    }
  }

  const remaining = bank.filter(id => !selected.includes(id));
  while (selected.length < numFunctions) {
    const idx = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(idx, 1)[0]);
  }

  return selected.map((id, i) => ({
    fn: FUNCTION_LIBRARY.find(f => f.id === id),
    color: FUNCTION_COLORS[i],
    guessed: false,
  }));
}

const X_MIN = -2.5, X_MAX = 2.5, Y_MIN = -2.5, Y_MAX = 2.5;
const CELL_W = (X_MAX - X_MIN) / 5;
const CELL_H = (Y_MAX - Y_MIN) / 5;

function cellBounds(col, row) {
  const xMin = X_MIN + col * CELL_W;
  const xMax = xMin + CELL_W;
  const yMin = Y_MAX - (row + 1) * CELL_H;
  const yMax = yMin + CELL_H;
  return { xMin, xMax, yMin, yMax };
}

function doesFunctionPassThrough(fn, col, row) {
  const { xMin, xMax, yMin, yMax } = cellBounds(col, row);
  for (let i = 0; i <= 100; i++) {
    const x = xMin + (i / 100) * (xMax - xMin);
    try {
      const y = fn(x);
      if (isFinite(y) && !isNaN(y) && y >= yMin && y <= yMax) return true;
    } catch { continue; }
  }
  return false;
}

function findIntersectionPoints(gFn, parabolaFn) {
  const steps = 500;
  const points = [];
  let prevDiff = null;
  let prevX = null;
  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + (i / steps) * (X_MAX - X_MIN);
    let gVal;
    try { gVal = gFn(x); } catch { prevDiff = null; prevX = x; continue; }
    if (!isFinite(gVal) || isNaN(gVal)) { prevDiff = null; prevX = x; continue; }
    const diff = gVal - parabolaFn(x);
    if (Math.abs(diff) < 0.05) {
      const py = parabolaFn(x);
      if (isFinite(py) && py >= Y_MIN && py <= Y_MAX) points.push({ x, y: py });
    } else if (prevDiff !== null && prevDiff * diff < 0 && prevX !== null &&
               Math.abs(prevDiff) < 5 && Math.abs(diff) < 5) {
      const midX = (prevX + x) / 2;
      const midY = parabolaFn(midX);
      if (isFinite(midY) && midY >= Y_MIN && midY <= Y_MAX) points.push({ x: midX, y: midY });
    }
    prevDiff = diff;
    prevX = x;
  }
  // deduplicate points within 0.15 of each other
  const deduped = [];
  for (const p of points) {
    if (!deduped.some(q => Math.abs(q.x - p.x) < 0.15 && Math.abs(q.y - p.y) < 0.15)) deduped.push(p);
  }
  return deduped;
}

function findSpiralIntersectionPoints(gFn, spiralPresetFn) {
  const steps = 2000;
  const points = [];
  let prevDiff = null;
  let prevX = null;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * SPIRAL_THETA_MAX;
    const { x, y } = spiralPresetFn(theta);
    if (!isFinite(x) || !isFinite(y) || x < X_MIN - 0.1 || x > X_MAX + 0.1 || y < Y_MIN - 0.1 || y > Y_MAX + 0.1) {
      prevDiff = null; prevX = null; continue;
    }
    let gVal;
    try { gVal = gFn(x); } catch { prevDiff = null; prevX = null; continue; }
    if (!isFinite(gVal) || isNaN(gVal)) { prevDiff = null; prevX = null; continue; }
    const diff = gVal - y;
    if (Math.abs(diff) < 0.05 && x >= X_MIN && x <= X_MAX && y >= Y_MIN && y <= Y_MAX) {
      points.push({ x, y });
    } else if (prevDiff !== null && prevDiff * diff < 0 && prevX !== null &&
               Math.abs(prevDiff) < 5 && Math.abs(diff) < 5) {
      const midTheta = ((i - 0.5) / steps) * SPIRAL_THETA_MAX;
      const { x: mx, y: my } = spiralPresetFn(midTheta);
      if (isFinite(mx) && isFinite(my) && mx >= X_MIN && mx <= X_MAX && my >= Y_MIN && my <= Y_MAX) {
        points.push({ x: mx, y: my });
      }
    }
    prevDiff = diff;
    prevX = x;
  }
  const deduped = [];
  for (const p of points) {
    if (!deduped.some(q => Math.abs(q.x - p.x) < 0.15 && Math.abs(q.y - p.y) < 0.15)) deduped.push(p);
  }
  return deduped;
}

function drawCell(canvas, shotType, col, row, cellShots, activeFunctions) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  if (!cellShots[shotType].fired) return;

  const { xMin, xMax, yMin, yMax } = cellBounds(col, row);
  const toPixelX = x => ((x - xMin) / (xMax - xMin)) * W;
  const toPixelY = y => H - ((y - yMin) / (yMax - yMin)) * H;

  if (cellShots[shotType].hits.length === 0) {
    ctx.fillStyle = 'rgba(255, 50, 50, 0.15)';
    ctx.fillRect(0, 0, W, H);
    return;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;
  if (yMin <= 0 && yMax >= 0) {
    const py = toPixelY(0);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
  }
  if (xMin <= 0 && xMax >= 0) {
    const px = toPixelX(0);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
  }

  cellShots[shotType].hits.forEach(({ fnId, color }) => {
    const af = activeFunctions.find(a => a.fn.id === fnId);
    if (!af) return;
    const func = shotType === 'f' ? af.fn.f : shotType === 'df' ? af.fn.df : af.fn.F;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 300; i++) {
      const x = xMin + (i / 300) * (xMax - xMin);
      let y;
      try { y = func(x); } catch { started = false; continue; }
      if (!isFinite(y) || isNaN(y)) { started = false; continue; }
      const px = toPixelX(x);
      const py = toPixelY(y);
      if (py < -H || py > 2 * H) { started = false; continue; }
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
}

function initGrid() {
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => ({
      row, col,
      shots: {
        f:  { fired: false, hits: [] },
        df: { fired: false, hits: [] },
        F:  { fired: false, hits: [] },
      },
    }))
  );
}

function GraphCell({ shotType, col, row, cellShots, activeFunctions }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (cellShots[shotType].fired && canvasRef.current) {
      drawCell(canvasRef.current, shotType, col, row, cellShots, activeFunctions);
    }
  }, [cellShots, shotType, col, row, activeFunctions]);

  if (!cellShots[shotType].fired) {
    return (
      <div style={{
        width: 48, height: 48,
        background: '#0d0d1a',
        border: '1px solid #1e1e3a',
        borderRadius: 2,
      }} />
    );
  }

  const isHit = cellShots[shotType].hits.length > 0;
  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={48}
      style={{
        border: `1px solid ${isHit ? '#00ff8844' : '#ff444422'}`,
        borderRadius: 2,
        display: 'block',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Help Modal
// ─────────────────────────────────────────────────────────────

function RulesContent() {
  const section = (title, items) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#00ff88', marginBottom: 10, fontWeight: 700 }}>
        {title}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: 12, color: '#aac', letterSpacing: '0.03em', lineHeight: 1.7, marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #1e1e3a' }}>
          {item}
        </div>
      ))}
    </div>
  );
  return (
    <div>
      {section('THE GRID', [
        'Each player has a 5×5 grid spanning x ∈ [−2.5, 2.5] and y ∈ [−2.5, 2.5].',
        'Hidden functions are plotted across three views: f(x), f′(x) (derivative), and F(x) (antiderivative).',
        'Fire shots at cells to reveal curve segments. A hit (●) means a function passes through that cell.',
      ])}
      {section('SHOOTING', [
        'Select a grid view — f(x), f′(x), or F(x) — then click a cell to fire.',
        'Green (●) = hit, a function curve passes through that region.',
        'Red (×) = miss, no function passes through that region.',
        'Each turn you get 1 shot by default. Powers can grant extra shots.',
      ])}
      {section('IDENTIFYING FUNCTIONS', [
        'Use the Function Bank to guess which function(s) are hidden.',
        'Correct guess: the function is revealed. Identify all to win the round.',
        'Wrong guess (1v1): your opponent gets a bonus turn.',
        'Wrong guess (Battle Royale): the current player\'s turn ends and the next player gets a bonus.',
      ])}
      {section('GAME MODES', [
        'SOLO — Find all hidden functions on your own, no opponent.',
        '1v1 LIGHTNING — One round, first to identify all enemy functions wins.',
        '1v1 NORMAL — Best of 3 rounds, first to 2 wins takes the match.',
        'BATTLE ROYALE — 3–5 players each racing their own grid. Last to finish each round is eliminated. Final survivor wins.',
      ])}
      {section('DIFFICULTY', [
        'EASY — 1 function from a basic set (x², x³, sin(x), eˣ, √x).',
        'MEDIUM — 2 functions, including domain-restricted curves like ln(x) and 1/x.',
        'HARD — 3 functions with asymptotes, product functions, and trig.',
        'CHAOS — 4 functions from the full library, including exotic forms like sin(x)/x and arcsin(x).',
      ])}
      {section('POWERS', [
        'Each player draws 1 power at the start of every round (or more via coin flip / Party Perry).',
        'Powers are one-time-use unless noted. BONUS and GLITCH are passive — they trigger automatically.',
        'Double Rarity Odds (optional toggle) shifts the rarity distribution toward Rare and Legendary.',
      ])}
    </div>
  );
}

function PowersContent() {
  const order = ['legendary', 'rare', 'uncommon', 'common'];
  return (
    <div>
      {order.map(rarity => {
        const rc = RARITY_CONFIG[rarity];
        const powers = POWERS.filter(p => p.rarity === rarity);
        return (
          <div key={rarity} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', color: rc.color, marginBottom: 10, fontWeight: 700, opacity: 0.9 }}>
              ── {rc.label} ──
            </div>
            {powers.map(power => (
              <div key={power.id} style={{
                marginBottom: 8, padding: '10px 14px',
                background: '#07070f', border: `1px solid ${rc.color}33`,
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: rc.color, letterSpacing: '0.08em', marginBottom: 5 }}>
                  {power.label}
                </div>
                <div style={{ fontSize: 11, color: '#889', lineHeight: 1.55, letterSpacing: '0.02em' }}>
                  {power.desc}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function HelpModal({ onClose }) {
  const [tab, setTab] = useState('rules');
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(5,5,12,0.93)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Courier New', Courier, monospace",
      overflowY: 'auto', padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 600,
        background: '#0d0d1a', border: '1px solid #2a2a4a',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e1e3a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', color: '#00ff88' }}>
            HELP
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#445',
            fontFamily: 'inherit', fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #1e1e3a' }}>
          {[['rules', 'RULES'], ['powers', 'POWERS']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '10px 0',
              background: tab === key ? '#111124' : 'none',
              border: 'none',
              borderBottom: tab === key ? '2px solid #00ff88' : '2px solid transparent',
              color: tab === key ? '#00ff88' : '#445',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.15em', cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '72vh' }}>
          {tab === 'rules' ? <RulesContent /> : <PowersContent />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screens
// ─────────────────────────────────────────────────────────────

function DifficultyScreen({ onSelect, onHelp, onPowerTest }) {
  const tiers = [
    { key: 'easy',   label: 'Easy',   desc: '1 function · familiar curves' },
    { key: 'medium', label: 'Medium', desc: '2 functions · domain restrictions' },
    { key: 'hard',   label: 'Hard',   desc: '3 functions · asymptotes & products' },
    { key: 'chaos',  label: 'Chaos',  desc: '4 functions · no mercy' },
  ];
  return (
    <div style={centeredPageStyle()}>
      <GameTitle />
      <p style={subtitleStyle()}>SELECT DIFFICULTY</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
        {tiers.map(t => (
          <MenuButton key={t.key} label={t.label} desc={t.desc} onClick={() => onSelect(t.key)} />
        ))}
        <div style={{ borderTop: '1px solid #1e1e3a', marginTop: 4, paddingTop: 10, display: 'flex', gap: 8 }}>
          <button
            onClick={onPowerTest}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#66b3ff'; e.currentTarget.style.boxShadow = '0 0 10px #66b3ff22'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a4a'; e.currentTarget.style.boxShadow = 'none'; }}
            style={{
              flex: 1, padding: '12px 16px', background: '#0d0d1a', border: '2px solid #2a2a4a',
              borderRadius: 8, color: '#66b3ff', fontFamily: 'inherit', fontSize: 13,
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'border-color 0.15s, box-shadow 0.15s', fontWeight: 700, letterSpacing: '0.08em',
            }}
          >
            <span>POWER TEST</span>
            <span style={{ fontSize: 11, color: '#445', fontWeight: 400 }}>Try any power, any function</span>
          </button>
        </div>
      </div>
      <button
        onClick={onHelp}
        style={{
          marginTop: 8, background: 'none', border: '1px solid #1e1e3a',
          borderRadius: 4, color: '#445', fontFamily: 'inherit', fontSize: 11,
          letterSpacing: '0.12em', cursor: 'pointer', padding: '6px 20px',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#00ff88'; e.currentTarget.style.borderColor = '#00ff8844'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#445'; e.currentTarget.style.borderColor = '#1e1e3a'; }}
      >
        ? HELP &amp; RULES
      </button>
    </div>
  );
}

function ModeSelectScreen({ difficulty, onSelect, onBack }) {
  const modes = [
    { key: 'solo',         label: 'SOLO',          desc: 'Identify the hidden functions' },
    { key: '1v1',          label: '1v1',           desc: 'Pass-and-play against a friend' },
    { key: 'battleRoyale', label: 'BATTLE ROYALE', desc: '3–5 players · last to finish is eliminated' },
  ];
  return (
    <div style={centeredPageStyle()}>
      <GameTitle />
      <p style={subtitleStyle()}>
        SELECT MODE ·{' '}
        <span style={{ color: '#00ff88' }}>{DIFFICULTY[difficulty].label.toUpperCase()}</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
        {modes.map(m => (
          <MenuButton key={m.key} label={m.label} desc={m.desc} onClick={() => onSelect(m.key)} />
        ))}
      </div>
      <BackButton label="← CHANGE DIFFICULTY" onClick={onBack} />
    </div>
  );
}

function RoundTypeScreen({ difficulty, onSelect, onBack }) {
  const [doubleRarity, setDoubleRarity] = useState(false);
  const types = [
    { key: 'lightning', label: 'LIGHTNING', desc: 'Single round · first to identify wins' },
    { key: 'normal',    label: 'NORMAL',    desc: 'Best of 3 · first to 2 round wins' },
  ];
  return (
    <div style={centeredPageStyle()}>
      <GameTitle />
      <p style={subtitleStyle()}>
        1v1 · <span style={{ color: '#00ff88' }}>{DIFFICULTY[difficulty].label.toUpperCase()}</span>
        {' · '}SELECT ROUND TYPE
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
        {types.map(t => (
          <MenuButton key={t.key} label={t.label} desc={t.desc} onClick={() => onSelect(t.key, doubleRarity)} />
        ))}
      </div>
      <div style={{ marginTop: 12, marginBottom: 4, width: 320 }}>
        <button onClick={() => setDoubleRarity(p => !p)} style={{
          width: '100%', padding: '10px 16px',
          background: doubleRarity ? '#0a1020' : '#0d0d1a',
          border: `2px solid ${doubleRarity ? '#ffd700' : '#2a2a4a'}`,
          borderRadius: 6, color: doubleRarity ? '#ffd700' : '#557',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>★ DOUBLE RARITY ODDS</span>
          <span>{doubleRarity ? 'ON' : 'OFF'}</span>
        </button>
        {doubleRarity && (
          <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', marginTop: 4, textAlign: 'center' }}>
            COMMON 10% · UNCOMMON 30% · RARE 40% · LEGENDARY 20%
          </div>
        )}
      </div>
      <BackButton label="← CHANGE MODE" onClick={onBack} />
    </div>
  );
}

function BattleRoyaleSetupScreen({ difficulty, onStart, onBack }) {
  const [count, setCount] = useState(3);
  const [names, setNames] = useState(['', '', '', '', '']);
  const [powersEnabled, setPowersEnabled] = useState(true);
  const [doubleRarity, setDoubleRarity] = useState(false);
  function handleStart() {
    const playerNames = names.slice(0, count).map((n, i) => n.trim() || `Player ${i + 1}`);
    onStart(playerNames, powersEnabled, doubleRarity);
  }
  return (
    <div style={centeredPageStyle()}>
      <GameTitle />
      <p style={subtitleStyle()}>
        BATTLE ROYALE · <span style={{ color: '#ff6b6b' }}>{DIFFICULTY[difficulty].label.toUpperCase()}</span>
      </p>
      <div style={{ marginBottom: 16, width: 320 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#557', marginBottom: 8 }}>NUMBER OF PLAYERS</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[3, 4, 5].map(n => (
            <button key={n} onClick={() => setCount(n)} style={{
              flex: 1, padding: '10px 0',
              background: count === n ? '#1a0505' : '#0d0d1a',
              border: `2px solid ${count === n ? '#ff6b6b' : '#2a2a4a'}`,
              borderRadius: 6, color: count === n ? '#ff6b6b' : '#557',
              fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: count === n ? '0 0 12px #ff6b6b33' : 'none',
            }}>{n}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16, width: 320 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#557', marginBottom: 8 }}>PLAYER NAMES (OPTIONAL)</div>
        {Array.from({ length: count }).map((_, i) => (
          <input key={i} value={names[i]}
            onChange={e => { const next = [...names]; next[i] = e.target.value; setNames(next); }}
            placeholder={`Player ${i + 1}`} maxLength={16}
            style={{
              display: 'block', width: '100%', marginBottom: 8, padding: '8px 12px',
              background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 4,
              color: '#e0e0e0', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box',
            }}
          />
        ))}
      </div>
      <div style={{ marginBottom: 20, width: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => setPowersEnabled(p => !p)} style={{
          width: '100%', padding: '10px 16px',
          background: powersEnabled ? '#0a1020' : '#0d0d1a',
          border: `2px solid ${powersEnabled ? '#66b3ff' : '#2a2a4a'}`,
          borderRadius: 6, color: powersEnabled ? '#66b3ff' : '#557',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚡ POWERS</span>
          <span>{powersEnabled ? 'ENABLED' : 'DISABLED'}</span>
        </button>
        <button onClick={() => setDoubleRarity(p => !p)} style={{
          width: '100%', padding: '10px 16px',
          background: doubleRarity ? '#0a1020' : '#0d0d1a',
          border: `2px solid ${doubleRarity ? '#ffd700' : '#2a2a4a'}`,
          borderRadius: 6, color: doubleRarity ? '#ffd700' : '#557',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>★ DOUBLE RARITY ODDS</span>
          <span>{doubleRarity ? 'ON' : 'OFF'}</span>
        </button>
        {doubleRarity && (
          <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', textAlign: 'center' }}>
            COMMON 10% · UNCOMMON 30% · RARE 40% · LEGENDARY 20%
          </div>
        )}
      </div>
      <button onClick={handleStart} style={{
        padding: '14px 48px', background: '#1a0505', border: '2px solid #ff6b6b',
        borderRadius: 8, color: '#ff6b6b', fontFamily: 'inherit', fontSize: 16,
        fontWeight: 700, cursor: 'pointer', letterSpacing: '0.12em',
        boxShadow: '0 0 24px #ff6b6b44', marginBottom: 8,
      }}>
        START BATTLE →
      </button>
      <BackButton label="← CHANGE MODE" onClick={onBack} />
    </div>
  );
}

function BrPassScreen({ toName, notifications, bonusTurn, glitchTriggered, announcement, onContinue }) {
  return (
    <div style={centeredPageStyle({ background: '#050508' })}>
      {announcement && (
        <div style={{ fontSize: 13, letterSpacing: '0.15em', color: '#00ff88', marginBottom: 12,
          textTransform: 'uppercase', textShadow: '0 0 8px #00ff8866',
          maxWidth: 380, textAlign: 'center', lineHeight: 1.5 }}>
          {announcement}
        </div>
      )}
      {notifications && notifications.length > 0 && notifications.map((n, i) => (
        <div key={i} style={{ fontSize: 12, letterSpacing: '0.15em', color: '#ff6b6b', marginBottom: 6,
          textTransform: 'uppercase', textShadow: '0 0 6px #ff6b6b66' }}>
          ⚠ {n.byName} used {n.power} on you
        </div>
      ))}
      {glitchTriggered && (
        <div style={{ fontSize: 13, letterSpacing: '0.2em', color: '#00e5ff',
          textTransform: 'uppercase', textShadow: '0 0 8px #00e5ff88' }}>
          ⚡ GLITCH PASSIVE ACTIVATED
        </div>
      )}
      {bonusTurn && !glitchTriggered && (
        <div style={{ fontSize: 13, letterSpacing: '0.2em', color: '#ffd700',
          textTransform: 'uppercase', textShadow: '0 0 8px #ffd70088' }}>
          ★ BONUS TURN
        </div>
      )}
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.25em', color: '#ff6b6b',
        textShadow: '0 0 24px #ff6b6baa', margin: '16px 0 8px' }}>
        {toName}
      </div>
      <div style={{ fontSize: 12, color: '#557', letterSpacing: '0.1em', marginBottom: 24 }}>
        PASS THE DEVICE
      </div>
      <button onClick={onContinue} style={{
        padding: '14px 48px', background: '#1a0505', border: '2px solid #ff6b6b',
        borderRadius: 8, color: '#ff6b6b', fontFamily: 'inherit', fontSize: 16,
        fontWeight: 700, cursor: 'pointer', letterSpacing: '0.12em', boxShadow: '0 0 24px #ff6b6b44',
      }}>
        READY →
      </button>
    </div>
  );
}

function BrTargetPicker({ players, currentIdx, powerLabel, onSelect, onCancel }) {
  const targets = players
    .map((p, i) => ({ ...p, idx: i }))
    .filter(p => p.active && !p.finishedThisRound && p.idx !== currentIdx);
  return (
    <div style={{ marginBottom: 12, padding: '12px 16px', background: '#0d0d1a',
      border: '1px solid #ff6b6b44', borderRadius: 8, width: '100%', maxWidth: 560 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#ff6b6b', marginBottom: 10, fontWeight: 700 }}>
        TARGET PLAYER FOR {powerLabel}
      </div>
      {targets.length === 0 ? (
        <div style={{ fontSize: 11, color: '#557', letterSpacing: '0.08em', marginBottom: 10 }}>
          No valid targets — all other players have already finished.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {targets.map(p => (
            <button key={p.idx} onClick={() => onSelect(p.idx)} style={{
              padding: '8px 16px', background: '#1a0505', border: '2px solid #ff6b6b',
              borderRadius: 6, color: '#ff6b6b', fontFamily: 'inherit', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em',
            }}>
              {p.name}
            </button>
          ))}
        </div>
      )}
      <button onClick={onCancel} style={{
        padding: '6px 16px', background: 'none', border: '1px solid #334',
        borderRadius: 4, color: '#445', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
      }}>
        CANCEL
      </button>
    </div>
  );
}

function PassScreen({ toPlayer, bonusTurn, trapTriggered, glitchTriggered, onContinue }) {
  return (
    <div style={centeredPageStyle({ background: '#050508' })}>
      {trapTriggered && (
        <div style={{
          fontSize: 13,
          letterSpacing: '0.2em',
          color: '#ff6b6b',
          textTransform: 'uppercase',
          textShadow: '0 0 8px #ff6b6b88',
        }}>
          TRAP CARD TRIGGERED — BONUS TURNS EARNED
        </div>
      )}
      {glitchTriggered && !trapTriggered && (
        <div style={{
          fontSize: 13,
          letterSpacing: '0.2em',
          color: '#00e5ff',
          textTransform: 'uppercase',
          textShadow: '0 0 8px #00e5ff88',
        }}>
          ⚡ GLITCH PASSIVE ACTIVATED
        </div>
      )}
      {bonusTurn && !trapTriggered && !glitchTriggered && (
        <div style={{
          fontSize: 13,
          letterSpacing: '0.2em',
          color: '#ffd700',
          textTransform: 'uppercase',
          textShadow: '0 0 8px #ffd70088',
        }}>
          BONUS TURN — OPPONENT GUESSED WRONG
        </div>
      )}
      <div style={{ fontSize: 12, letterSpacing: '0.3em', color: '#334', textTransform: 'uppercase' }}>
        HAND DEVICE TO
      </div>
      <div style={{
        fontSize: 56,
        fontWeight: 900,
        letterSpacing: '0.15em',
        color: '#00ff88',
        textShadow: '0 0 40px #00ff88bb',
        textTransform: 'uppercase',
      }}>
        PLAYER {toPlayer}
      </div>
      <button
        onClick={onContinue}
        style={{
          marginTop: 16,
          padding: '14px 48px',
          background: '#001a0d',
          border: '2px solid #00ff88',
          borderRadius: 8,
          color: '#00ff88',
          fontFamily: 'inherit',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.12em',
          boxShadow: '0 0 24px #00ff8844',
        }}
      >
        I'M READY →
      </button>
    </div>
  );
}

function PowerDrawScreen({ round, roundType, p1Powers, p2Powers, coinFlipWinner, onBegin }) {
  const titleText = roundType === 'lightning' ? 'POWER-UP DRAW' : `ROUND ${round} · POWER-UP DRAW`;
  return (
    <div style={centeredPageStyle()}>
      <div style={{ fontSize: 13, letterSpacing: '0.2em', color: '#557' }}>{titleText}</div>

      {coinFlipWinner && (
        <div style={{
          fontSize: 12, color: '#ffd700', letterSpacing: '0.15em', textAlign: 'center',
          textShadow: '0 0 8px #ffd70088', background: '#1a1500',
          border: '1px solid #ffd70044', borderRadius: 6, padding: '8px 20px',
        }}>
          COIN FLIP — PLAYER {coinFlipWinner} GAINS BONUS POWER
        </div>
      )}

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1, 2].map(player => {
          const powers = player === 1 ? p1Powers : p2Powers;
          return (
            <div key={player} style={{
              background: '#0d0d1a', border: '1px solid #1e1e3a',
              borderRadius: 8, padding: '16px 24px', minWidth: 160, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#557', letterSpacing: '0.2em', marginBottom: 12 }}>
                PLAYER {player}
              </div>
              {powers.map((power, i) => {
                const rc = RARITY_CONFIG[power.rarity] || RARITY_CONFIG.common;
                return (
                  <div key={i} style={{
                    background: '#111124', border: `1px solid ${rc.color}55`,
                    borderRadius: 4, padding: '8px 12px', marginBottom: 6,
                    color: rc.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                  }}>
                    <div style={{ fontSize: 8, color: rc.color, letterSpacing: '0.2em', marginBottom: 3, opacity: 0.8 }}>
                      {rc.label}
                    </div>
                    {power.label}
                    <div style={{ fontSize: 10, color: '#445', marginTop: 2, fontWeight: 400 }}>{power.desc}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <button
        onClick={onBegin}
        style={{
          marginTop: 8, padding: '14px 48px', background: '#001a0d',
          border: '2px solid #00ff88', borderRadius: 8, color: '#00ff88',
          fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '0.12em', boxShadow: '0 0 24px #00ff8844',
        }}
      >
        BEGIN ROUND →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Power Test Setup Screen
// ─────────────────────────────────────────────────────────────

function PowerTestSetupScreen({ difficulty, onStart, onBack }) {
  const MAX_POWER_COUNT = 3;
  const MAX_FN_COUNT = 4;

  const initCounts = () => Object.fromEntries(POWERS.map(p => [p.id, 0]));
  const [p1PowerCounts, setP1PowerCounts] = useState(initCounts);
  const [p2PowerCounts, setP2PowerCounts] = useState(initCounts);
  const [p1FnIds, setP1FnIds] = useState([]);
  const [p2FnIds, setP2FnIds] = useState([]);

  function changePowerCount(player, powerId, delta) {
    const counts = player === 1 ? p1PowerCounts : p2PowerCounts;
    const setCounts = player === 1 ? setP1PowerCounts : setP2PowerCounts;
    const next = Math.max(0, Math.min(MAX_POWER_COUNT, counts[powerId] + delta));
    setCounts({ ...counts, [powerId]: next });
  }

  function toggleFn(player, fnId) {
    const ids = player === 1 ? p1FnIds : p2FnIds;
    const setIds = player === 1 ? setP1FnIds : setP2FnIds;
    if (ids.includes(fnId)) {
      setIds(ids.filter(id => id !== fnId));
    } else if (ids.length < MAX_FN_COUNT) {
      setIds([...ids, fnId]);
    }
  }

  function buildPowers(counts) {
    const result = [];
    for (const power of POWERS) {
      for (let i = 0; i < counts[power.id]; i++) result.push({ ...power, used: false });
    }
    return result;
  }

  function buildFunctions(ids) {
    return ids.map((id, i) => ({
      fn: FUNCTION_LIBRARY.find(f => f.id === id),
      color: FUNCTION_COLORS[i],
      guessed: false,
    }));
  }

  const canStart = p1FnIds.length > 0 && p2FnIds.length > 0;

  const counterBtnStyle = (disabled) => ({
    width: 24, height: 24, background: '#0a0a2a',
    border: '1px solid #2a2a6a', borderRadius: 4,
    color: disabled ? '#222' : '#66b3ff',
    fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
  });

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e0',
      fontFamily: "'Courier New', Courier, monospace",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 16, padding: '32px 16px',
    }}>
      <GameTitle />
      <p style={subtitleStyle()}>
        POWER TEST ·{' '}
        <span style={{ color: '#00ff88' }}>{DIFFICULTY[difficulty].label.toUpperCase()}</span>
      </p>
      <div style={{ fontSize: 11, color: '#445', letterSpacing: '0.08em', textAlign: 'center' }}>
        Pick functions and powers for each player · then play a lightning round
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 720 }}>
        {[1, 2].map(player => {
          const fnIds = player === 1 ? p1FnIds : p2FnIds;
          const powerCounts = player === 1 ? p1PowerCounts : p2PowerCounts;
          return (
            <div key={player} style={{
              flex: '1 1 300px', background: '#0d0d1a', border: '1px solid #1e1e3a',
              borderRadius: 8, padding: '16px',
            }}>
              <div style={{ fontSize: 11, color: '#557', letterSpacing: '0.2em', marginBottom: 14, textAlign: 'center', fontWeight: 700 }}>
                PLAYER {player}
              </div>

              <div style={{ fontSize: 10, color: '#66b3ff', letterSpacing: '0.15em', marginBottom: 8, fontWeight: 700 }}>
                FUNCTIONS — {fnIds.length}/{MAX_FN_COUNT} selected
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 18 }}>
                {FUNCTION_LIBRARY.map(fn => {
                  const isOn = fnIds.includes(fn.id);
                  const isFull = fnIds.length >= MAX_FN_COUNT && !isOn;
                  return (
                    <button
                      key={fn.id}
                      onClick={() => !isFull && toggleFn(player, fn.id)}
                      style={{
                        padding: '4px 9px',
                        background: isOn ? '#001a2a' : '#07070f',
                        border: `1px solid ${isOn ? '#66b3ff' : '#1a1a3a'}`,
                        borderRadius: 4,
                        color: isOn ? '#66b3ff' : isFull ? '#1a1a2a' : '#334',
                        fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                        cursor: isFull ? 'default' : 'pointer',
                        letterSpacing: '0.03em', transition: 'all 0.1s',
                      }}
                    >
                      {fn.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: 10, color: '#66b3ff', letterSpacing: '0.15em', marginBottom: 8, fontWeight: 700 }}>
                POWERS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {POWERS.map(power => {
                  const count = powerCounts[power.id];
                  return (
                    <div key={power.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: count > 0 ? '#001a2a' : '#07070f',
                      border: `1px solid ${count > 0 ? '#66b3ff44' : '#1a1a3a'}`,
                      borderRadius: 6, padding: '7px 10px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 8, color: (RARITY_CONFIG[power.rarity] || RARITY_CONFIG.common).color, letterSpacing: '0.18em', marginBottom: 1, opacity: 0.75 }}>
                          {(RARITY_CONFIG[power.rarity] || RARITY_CONFIG.common).label}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: count > 0 ? '#66b3ff' : '#445', letterSpacing: '0.06em' }}>
                          {power.label}
                        </div>
                      </div>
                      <button onClick={() => changePowerCount(player, power.id, -1)} style={counterBtnStyle(count === 0)}>−</button>
                      <div style={{ width: 18, textAlign: 'center', fontSize: 13, fontWeight: 700, color: count > 0 ? '#66b3ff' : '#334' }}>
                        {count}
                      </div>
                      <button onClick={() => changePowerCount(player, power.id, 1)} style={counterBtnStyle(count >= MAX_POWER_COUNT)}>+</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!canStart && (
        <div style={{ fontSize: 11, color: '#445', letterSpacing: '0.08em' }}>
          Select at least 1 function per player to start
        </div>
      )}

      <button
        onClick={() => canStart && onStart(buildPowers(p1PowerCounts), buildPowers(p2PowerCounts), buildFunctions(p1FnIds), buildFunctions(p2FnIds))}
        style={{
          padding: '14px 48px',
          background: canStart ? '#001a0d' : '#07070f',
          border: `2px solid ${canStart ? '#00ff88' : '#1a3a1a'}`,
          borderRadius: 8, color: canStart ? '#00ff88' : '#224',
          fontFamily: 'inherit', fontSize: 16, fontWeight: 700,
          cursor: canStart ? 'pointer' : 'default',
          letterSpacing: '0.12em', boxShadow: canStart ? '0 0 24px #00ff8844' : 'none',
        }}
      >
        START TEST →
      </button>
      <BackButton label="← BACK TO MENU" onClick={onBack} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────

function centeredPageStyle(overrides = {}) {
  return {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#e0e0e0',
    fontFamily: "'Courier New', Courier, monospace",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    ...overrides,
  };
}

function subtitleStyle() {
  return { color: '#557', letterSpacing: '0.15em', fontSize: 13, margin: 0 };
}

function GameTitle() {
  return (
    <h1 style={{
      fontSize: 32,
      letterSpacing: '0.2em',
      color: '#00ff88',
      textShadow: '0 0 16px #00ff88aa',
      margin: 0,
      fontWeight: 900,
      textTransform: 'uppercase',
    }}>
      Function Battleship
    </h1>
  );
}

function MenuButton({ label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00ff88';
        e.currentTarget.style.boxShadow = '0 0 12px #00ff8833';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#2a2a4a';
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={{
        padding: '14px 20px',
        background: '#0d0d1a',
        border: '2px solid #2a2a4a',
        borderRadius: 8,
        color: '#e0e0e0',
        fontFamily: 'inherit',
        fontSize: 15,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <span style={{ fontWeight: 700, letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#557' }}>{desc}</span>
    </button>
  );
}

function BackButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: '#445',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 12,
        letterSpacing: '0.1em',
        marginTop: 4,
      }}
    >
      {label}
    </button>
  );
}

function PowersPanel({ powers, onUse, shotsAllowed, shotsFired, trapCardPending, parabolaShotPending, spiralShotPending, partyPerryPending, omnisciencePending, omnipotencePending, marauderPending, heatCheckActive, heatCheckMissed, bindingVowActive }) {
  if (!powers || powers.length === 0) return null;
  return (
    <div style={{ marginBottom: 12, width: '100%', maxWidth: 560 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#66b3ff', marginBottom: 8, fontWeight: 700 }}>
        YOUR POWERS
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {powers.map((power, i) => {
          const isHeatCheckOn = power.id === 'heatCheck' && heatCheckActive;
          const isBindingVowOn = power.id === 'bindingVow' && bindingVowActive;
          const isPending =
            (power.id === 'trapCard' && trapCardPending) ||
            (power.id === 'parabolaShot' && parabolaShotPending) ||
            (power.id === 'spiralShot' && spiralShotPending) ||
            (power.id === 'partyPerry' && partyPerryPending) ||
            (power.id === 'omniscience' && omnisciencePending) ||
            (power.id === 'omnipotence' && omnipotencePending) ||
            (power.id === 'marauder' && marauderPending);
          const heatCheckOngoing = heatCheckActive && !heatCheckMissed && shotsFired < 3;
          const cantActivate =
            power.id === 'bonus' ||
            power.id === 'glitch' ||
            (power.id === 'heatCheck' && (shotsFired > 0 || shotsAllowed >= 2)) ||
            (power.id === 'reload' && heatCheckOngoing) ||
            (power.id === 'bindingVow' && bindingVowActive);
          const disabled = power.used || isPending || cantActivate;
          const rc = RARITY_CONFIG[power.rarity] || RARITY_CONFIG.common;
          let bg = '#0a0a2a', borderColor = '#2a2a6a', color = '#66b3ff';
          if (isHeatCheckOn)      { bg = '#1a0a00'; borderColor = '#ff880088'; color = '#ff8800'; }
          else if (isBindingVowOn){ bg = '#0d0814'; borderColor = '#a855f788'; color = '#a855f7'; }
          else if (power.used)    { bg = '#0a0a1a'; borderColor = '#1a1a3a'; color = '#334'; }
          else if (isPending)     { bg = '#1a0808'; borderColor = '#ff6b6b88'; color = '#ff6b6b'; }
          else if (cantActivate)  { bg = '#0a0a1a'; borderColor = '#1a1a3a'; color = '#445'; }
          else                    { borderColor = `${rc.color}55`; color = rc.color; }
          const labelText = isHeatCheckOn
            ? `🔥 ${power.label} ACTIVE`
            : isBindingVowOn
              ? `⛓ ${power.label} ACTIVE`
              : power.used
                ? `✓ ${power.label}`
                : isPending
                  ? `↻ ${power.label} SELECTING...`
                  : (power.id === 'bonus' || power.id === 'glitch')
                    ? `AUTO: ${power.label}`
                    : `USE: ${power.label}`;
          return (
            <button
              key={i}
              onClick={() => !disabled && onUse(i)}
              disabled={disabled}
              style={{
                padding: '6px 14px 8px', background: bg,
                border: `1px solid ${borderColor}`, borderRadius: 6, color,
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
                letterSpacing: '0.08em', textDecoration: (power.used && !isHeatCheckOn) ? 'line-through' : 'none',
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = rc.color; }}
              onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = borderColor; }}
            >
              <div style={{ fontSize: 8, color: power.used ? '#334' : rc.color, letterSpacing: '0.18em', marginBottom: 2, opacity: power.used ? 1 : 0.75 }}>
                {rc.label}
              </div>
              {labelText}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Panel({ title, children, accent }) {
  return (
    <div style={{
      background: '#0d0d1a',
      border: `1px solid ${accent ? '#00ff8844' : '#1e1e3a'}`,
      borderRadius: 8,
      padding: 14,
      boxShadow: accent ? '0 0 16px #00ff8811' : 'none',
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.2em',
        color: accent || '#445',
        marginBottom: 10,
        fontWeight: 700,
        textShadow: accent ? '0 0 8px #00ff8888' : 'none',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FunctionBankPanel({ difficulty, bankOverride, onGuess, identifiedIds, wrongGuessIds, message, activeFunctions }) {
  return (
    <div style={{ marginBottom: 16, width: '100%', maxWidth: 560 }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.2em',
        color: '#445',
        marginBottom: 8,
        fontWeight: 700,
      }}>
        FUNCTION BANK — CLICK TO GUESS
      </div>
      <div style={{
        background: '#0d0d1a',
        border: '1px solid #1e1e3a',
        borderRadius: 6,
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        {(bankOverride ?? DIFFICULTY[difficulty].bank).map(id => {
          const fn = FUNCTION_LIBRARY.find(f => f.id === id);
          const identified = identifiedIds.includes(id);
          const wrong = wrongGuessIds.includes(id);
          const disabled = identified || wrong;
          return (
            <button
              key={id}
              onClick={() => !disabled && onGuess(id)}
              disabled={disabled}
              style={{
                padding: '6px 12px',
                background: '#0a0a1a',
                border: `1px solid ${identified ? '#1a3a1a' : wrong ? '#3a1a1a' : '#2a2a4a'}`,
                borderRadius: 4,
                fontSize: 13,
                color: identified ? '#2a6a2a' : wrong ? '#6a2a2a' : '#aac',
                fontFamily: 'inherit',
                letterSpacing: '0.05em',
                cursor: disabled ? 'default' : 'pointer',
                textDecoration: disabled ? 'line-through' : 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = '#00ff88'; }}
              onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = '#2a2a4a'; }}
            >
              {identified ? `✓ ${fn.label}` : wrong ? `✗ ${fn.label}` : fn.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#557', letterSpacing: '0.1em' }}>REMAINING:</span>
        {activeFunctions.map(({ fn, color }) => {
          const found = identifiedIds.includes(fn.id);
          return (
            <span key={fn.id} style={{
              color: found ? '#222' : color,
              fontSize: 20,
              textShadow: found ? 'none' : `0 0 8px ${color}`,
              transition: 'color 0.3s',
            }}>●</span>
          );
        })}
        {message && (
          <span style={{
            marginLeft: 8,
            color: message === 'Already found!' ? '#ffd700' : '#ff4444',
            fontSize: 13,
            letterSpacing: '0.05em',
          }}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

function FireGrid({ grid, shotMode, onFire, disabled, fogActive }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 52px)', gap: 4 }}>
      {grid.map((rowArr, ri) =>
        rowArr.map((cell, ci) => {
          const shot = fogActive ? { fired: false, hits: [] } : cell.shots[shotMode];
          const fired = shot.fired;
          const isHit = shot.hits.length > 0;
          let bg = '#111124';
          let border = '1px solid #1e1e3a';
          let glow = 'none';
          if (fired && isHit)  { bg = '#003322'; border = '1px solid #00ff88'; glow = '0 0 8px #00ff8866'; }
          if (fired && !isHit) { bg = '#220011'; border = '1px solid #ff4444'; }
          return (
            <button
              key={`${ri}-${ci}`}
              onClick={() => onFire(ci, ri)}
              disabled={disabled}
              style={{
                width: 52, height: 52,
                background: bg,
                border,
                borderRadius: 4,
                cursor: disabled ? 'default' : 'crosshair',
                boxShadow: glow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: fired ? (isHit ? '#00ff88' : '#ff4444') : '#333',
                fontFamily: 'inherit',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
            >
              {fired ? (isHit ? '●' : '×') : `${ci-2},${2-ri}`}
            </button>
          );
        })
      )}
    </div>
  );
}

function ShotModeButtons({ shotMode, onChange, disabledModes = [], destroyedModes = [] }) {
  const modes = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {modes.map(({ key, label }) => {
        const isVowLocked = disabledModes.includes(key);
        const isDestroyed = destroyedModes.includes(key);
        const isDisabled = isVowLocked || isDestroyed;
        const isActive = shotMode === key;
        return (
          <button
            key={key}
            onClick={() => !isDisabled && onChange(key)}
            disabled={isDisabled}
            title={isDestroyed ? 'Grid destroyed by Omnipotence' : isVowLocked ? 'Restricted by Binding Vow' : undefined}
            style={{
              padding: '10px 20px',
              background: isActive ? '#00ff1122' : '#111124',
              border: `2px solid ${isActive ? '#00ff88' : isDisabled ? '#1a1a2a' : '#2a2a4a'}`,
              borderRadius: 6,
              color: isActive ? '#00ff88' : isDestroyed ? '#3a1010' : isVowLocked ? '#2a2a3a' : '#668',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              letterSpacing: '0.05em',
              boxShadow: isActive ? '0 0 12px #00ff8844' : 'none',
              transition: 'all 0.15s',
              textDecoration: isDisabled ? 'line-through' : 'none',
              opacity: isDisabled ? 0.4 : 1,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ParabolaShotPicker({ selectedGrid, onSelectGrid, selectedPreset, onSelectPreset, onFire, usedScans = [], bindingVowActive = false, destroyedGrids = [] }) {
  const grids = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];
  const pairAlreadyUsed = selectedGrid !== null && selectedPreset !== null &&
    usedScans.some(s => s.gridKey === selectedGrid && s.presetIdx === selectedPreset);
  const canFire = selectedGrid !== null && selectedPreset !== null && !pairAlreadyUsed;
  return (
    <div style={{
      marginTop: 12, width: '100%', maxWidth: 560,
      background: '#0d0d1a', border: '1px solid #ffd70044',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ffd700', marginBottom: 10, fontWeight: 700 }}>
        PARABOLA SHOT — SELECT GRID
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {grids.map(({ key, label }) => {
          const isVowLocked = bindingVowActive && key === 'f';
          const isDestroyed = destroyedGrids.includes(key);
          const isLocked = isVowLocked || isDestroyed;
          const isSelected = selectedGrid === key;
          return (
            <button
              key={key}
              onClick={() => !isLocked && onSelectGrid(key)}
              disabled={isLocked}
              title={isVowLocked ? 'Restricted by Binding Vow' : isDestroyed ? 'Grid destroyed by Omnipotence' : undefined}
              style={{
                padding: '8px 16px',
                background: isSelected ? '#1a1400' : '#0a0a1a',
                border: `1px solid ${isSelected ? '#ffd700' : isLocked ? '#1a1a2a' : '#2a2a4a'}`,
                borderRadius: 4,
                color: isSelected ? '#ffd700' : isLocked ? '#2a2a3a' : '#668',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                letterSpacing: '0.05em',
                boxShadow: isSelected ? '0 0 8px #ffd70033' : 'none',
                transition: 'all 0.15s',
                textDecoration: isLocked ? 'line-through' : 'none',
                opacity: isLocked ? 0.4 : 1,
              }}
            >{label}</button>
          );
        })}
      </div>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ffd700', marginBottom: 10, fontWeight: 700 }}>
        SELECT PARABOLA
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {PARABOLA_PRESETS.map((p, i) => {
          const alreadyUsed = selectedGrid !== null && usedScans.some(s => s.gridKey === selectedGrid && s.presetIdx === i);
          const isSelected = selectedPreset === i;
          return (
            <button
              key={i}
              onClick={() => !alreadyUsed && onSelectPreset(i)}
              disabled={alreadyUsed}
              style={{
                padding: '6px 12px',
                background: isSelected ? '#1a1400' : alreadyUsed ? '#090909' : '#0a0a1a',
                border: `1px solid ${isSelected ? '#ffd700' : alreadyUsed ? '#1a1a1a' : '#2a2a4a'}`,
                borderRadius: 4,
                color: isSelected ? '#ffd700' : alreadyUsed ? '#222' : '#668',
                fontFamily: 'inherit', fontSize: 13, cursor: alreadyUsed ? 'default' : 'pointer',
                letterSpacing: '0.04em',
                boxShadow: isSelected ? '0 0 8px #ffd70033' : 'none',
                textDecoration: alreadyUsed ? 'line-through' : 'none',
                transition: 'all 0.15s',
              }}
            >{p.label}</button>
          );
        })}
      </div>
      <button
        disabled={!canFire}
        onClick={onFire}
        style={{
          padding: '10px 28px',
          background: canFire ? '#1a1400' : '#0a0a1a',
          border: `2px solid ${canFire ? '#ffd700' : '#2a2a3a'}`,
          borderRadius: 6,
          color: canFire ? '#ffd700' : '#334',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          cursor: canFire ? 'pointer' : 'default',
          letterSpacing: '0.1em',
          boxShadow: canFire ? '0 0 12px #ffd70033' : 'none',
          transition: 'all 0.15s',
        }}
      >
        FIRE PARABOLA SCAN →
      </button>
    </div>
  );
}

function ParabolaScanGraph({ presetFn, hits }) {
  const canvasRef = useRef(null);
  const W = 260, H = 260;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, W, H);
    const toPixelX = x => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
    const toPixelY = y => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let v = -2; v <= 2; v++) {
      ctx.beginPath(); ctx.moveTo(toPixelX(v), 0); ctx.lineTo(toPixelX(v), H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, toPixelY(v)); ctx.lineTo(W, toPixelY(v)); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, toPixelY(0)); ctx.lineTo(W, toPixelY(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toPixelX(0), 0); ctx.lineTo(toPixelX(0), H); ctx.stroke();

    // parabola curve
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 300; i++) {
      const x = X_MIN + (i / 300) * (X_MAX - X_MIN);
      const y = presetFn(x);
      if (!isFinite(y) || y < Y_MIN - 0.5 || y > Y_MAX + 0.5) { started = false; continue; }
      const px = toPixelX(x), py = toPixelY(y);
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // intersection dots
    hits.forEach(({ color, points }) => {
      points.forEach(({ x, y }) => {
        const px = toPixelX(x), py = toPixelY(y);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.shadowBlur = 0;
  }, [presetFn, hits]);

  return (
    <canvas ref={canvasRef} width={W} height={H}
      style={{ border: '1px solid #ffd70022', borderRadius: 4, display: 'block' }}
    />
  );
}

function ParabolaScanResultCard({ result, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!result) return null;
  return (
    <div style={{
      marginTop: 8, width: '100%', maxWidth: 560,
      background: '#0d0d1a', border: '1px solid #ffd70044',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: 10, letterSpacing: '0.2em', color: '#ffd700',
          marginBottom: open ? 10 : 0, fontWeight: 700,
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span>PARABOLA SCAN · {result.gridLabel} · {result.parabolaLabel}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <ParabolaScanGraph presetFn={result.presetFn} hits={result.hits} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            {result.hits.map(({ color, points }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  color: points.length > 0 ? color : '#556',
                  fontSize: 20,
                  textShadow: points.length > 0 ? `0 0 8px ${color}` : 'none',
                }}>●</span>
                <span style={{ fontSize: 11, color: points.length > 0 ? color : '#778', letterSpacing: '0.08em' }}>
                  {points.length > 0
                    ? `${points.length} INTERSECTION${points.length > 1 ? 'S' : ''}`
                    : 'NO INTERSECTION'}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 9, color: '#445', letterSpacing: '0.08em', marginTop: 4, maxWidth: 180 }}>
              Colored dots show where each function crosses the parabola
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ParabolaScanResultCards({ results }) {
  if (!results || results.length === 0) return null;
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      {results.map((result, i) => (
        <ParabolaScanResultCard key={i} result={result} defaultOpen={i === results.length - 1} />
      ))}
    </div>
  );
}

function SpiralShotPicker({ selectedGrid, onSelectGrid, selectedPreset, onSelectPreset, onFire, usedScans = [], bindingVowActive = false, destroyedGrids = [] }) {
  const grids = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];
  const pairAlreadyUsed = selectedGrid !== null && selectedPreset !== null &&
    usedScans.some(s => s.gridKey === selectedGrid && s.presetIdx === selectedPreset);
  const canFire = selectedGrid !== null && selectedPreset !== null && !pairAlreadyUsed;
  return (
    <div style={{
      marginTop: 12, width: '100%', maxWidth: 560,
      background: '#001a1a', border: '1px solid #00e5ff44',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#00e5ff', marginBottom: 10, fontWeight: 700 }}>
        SPIRAL SHOT — SELECT GRID
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {grids.map(({ key, label }) => {
          const isVowLocked = bindingVowActive && key === 'f';
          const isDestroyed = destroyedGrids.includes(key);
          const isLocked = isVowLocked || isDestroyed;
          const isSelected = selectedGrid === key;
          return (
            <button
              key={key}
              onClick={() => !isLocked && onSelectGrid(key)}
              disabled={isLocked}
              title={isVowLocked ? 'Restricted by Binding Vow' : isDestroyed ? 'Grid destroyed by Omnipotence' : undefined}
              style={{
                padding: '8px 16px',
                background: isSelected ? '#001a20' : '#000d12',
                border: `1px solid ${isSelected ? '#00e5ff' : isLocked ? '#1a1a2a' : '#1a3a3a'}`,
                borderRadius: 4,
                color: isSelected ? '#00e5ff' : isLocked ? '#2a2a3a' : '#668',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                letterSpacing: '0.05em',
                boxShadow: isSelected ? '0 0 8px #00e5ff33' : 'none',
                transition: 'all 0.15s',
                textDecoration: isLocked ? 'line-through' : 'none',
                opacity: isLocked ? 0.4 : 1,
              }}
            >{label}</button>
          );
        })}
      </div>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#00e5ff', marginBottom: 10, fontWeight: 700 }}>
        SELECT SPIRAL
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {SPIRAL_PRESETS.map((p, i) => {
          const alreadyUsed = selectedGrid !== null && usedScans.some(s => s.gridKey === selectedGrid && s.presetIdx === i);
          const isSelected = selectedPreset === i;
          return (
            <button
              key={i}
              onClick={() => !alreadyUsed && onSelectPreset(i)}
              disabled={alreadyUsed}
              style={{
                padding: '6px 12px',
                background: isSelected ? '#001a20' : alreadyUsed ? '#090909' : '#000d12',
                border: `1px solid ${isSelected ? '#00e5ff' : alreadyUsed ? '#1a1a1a' : '#1a3a3a'}`,
                borderRadius: 4,
                color: isSelected ? '#00e5ff' : alreadyUsed ? '#222' : '#668',
                fontFamily: 'inherit', fontSize: 13, cursor: alreadyUsed ? 'default' : 'pointer',
                letterSpacing: '0.04em',
                boxShadow: isSelected ? '0 0 8px #00e5ff33' : 'none',
                textDecoration: alreadyUsed ? 'line-through' : 'none',
                transition: 'all 0.15s',
              }}
            >{p.label}</button>
          );
        })}
      </div>
      <button
        disabled={!canFire}
        onClick={onFire}
        style={{
          padding: '10px 28px',
          background: canFire ? '#001a20' : '#000d12',
          border: `2px solid ${canFire ? '#00e5ff' : '#1a3a3a'}`,
          borderRadius: 6,
          color: canFire ? '#00e5ff' : '#334',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          cursor: canFire ? 'pointer' : 'default',
          letterSpacing: '0.1em',
          boxShadow: canFire ? '0 0 12px #00e5ff33' : 'none',
          transition: 'all 0.15s',
        }}
      >
        FIRE SPIRAL SCAN →
      </button>
    </div>
  );
}

function SpiralScanGraph({ presetFn, hits }) {
  const canvasRef = useRef(null);
  const W = 260, H = 260;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000d12';
    ctx.fillRect(0, 0, W, H);
    const toPixelX = x => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
    const toPixelY = y => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let v = -2; v <= 2; v++) {
      ctx.beginPath(); ctx.moveTo(toPixelX(v), 0); ctx.lineTo(toPixelX(v), H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, toPixelY(v)); ctx.lineTo(W, toPixelY(v)); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, toPixelY(0)); ctx.lineTo(W, toPixelY(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toPixelX(0), 0); ctx.lineTo(toPixelX(0), H); ctx.stroke();

    // spiral curve
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    let started = false;
    const steps = 1600;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * SPIRAL_THETA_MAX;
      const { x, y } = presetFn(theta);
      if (!isFinite(x) || !isFinite(y) || x < X_MIN - 0.5 || x > X_MAX + 0.5 || y < Y_MIN - 0.5 || y > Y_MAX + 0.5) {
        started = false; continue;
      }
      const px = toPixelX(x), py = toPixelY(y);
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // intersection dots
    hits.forEach(({ color, points }) => {
      points.forEach(({ x, y }) => {
        const px = toPixelX(x), py = toPixelY(y);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.shadowBlur = 0;
  }, [presetFn, hits]);

  return (
    <canvas ref={canvasRef} width={W} height={H}
      style={{ border: '1px solid #00e5ff22', borderRadius: 4, display: 'block' }}
    />
  );
}

function SpiralScanResultCard({ result, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!result) return null;
  return (
    <div style={{
      marginTop: 8, width: '100%', maxWidth: 560,
      background: '#001a1a', border: '1px solid #00e5ff44',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: 10, letterSpacing: '0.2em', color: '#00e5ff',
          marginBottom: open ? 10 : 0, fontWeight: 700,
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span>SPIRAL SCAN · {result.gridLabel} · {result.spiralLabel}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <SpiralScanGraph presetFn={result.presetFn} hits={result.hits} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            {result.hits.map(({ color, points }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  color: points.length > 0 ? color : '#556',
                  fontSize: 20,
                  textShadow: points.length > 0 ? `0 0 8px ${color}` : 'none',
                }}>●</span>
                <span style={{ fontSize: 11, color: points.length > 0 ? color : '#778', letterSpacing: '0.08em' }}>
                  {points.length > 0
                    ? `${points.length} INTERSECTION${points.length > 1 ? 'S' : ''}`
                    : 'NO INTERSECTION'}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: '#005566', letterSpacing: '0.06em', marginTop: 4 }}>
              Colored dots show where each function crosses the spiral
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpiralScanResultCards({ results }) {
  if (!results || results.length === 0) return null;
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      {results.map((result, i) => (
        <SpiralScanResultCard key={i} result={result} defaultOpen={i === results.length - 1} />
      ))}
    </div>
  );
}

function TrapCardPicker({ selectedGrid, onSelectGrid, onConfirm, onCancel, ownGrid, existingTrap }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const grids = [
    { key: 'f', label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F', label: 'F(x)' },
  ];
  const canConfirm = selectedGrid !== null && selectedCell !== null;

  function handleGridSelect(key) {
    onSelectGrid(key);
    setSelectedCell(null);
  }

  return (
    <div style={{
      marginTop: 12, width: '100%', maxWidth: 560,
      background: '#0d0808', border: '1px solid #ff6b6b44',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ff6b6b', marginBottom: 10, fontWeight: 700 }}>
        TRAP CARD — SELECT GRID
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {grids.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleGridSelect(key)}
            style={{
              padding: '8px 16px',
              background: selectedGrid === key ? '#2a0808' : '#0a0808',
              border: `1px solid ${selectedGrid === key ? '#ff6b6b' : '#2a1a1a'}`,
              borderRadius: 4,
              color: selectedGrid === key ? '#ff6b6b' : '#668',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.05em',
              boxShadow: selectedGrid === key ? '0 0 8px #ff6b6b33' : 'none',
              transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {selectedGrid && (
        <>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ff6b6b', marginBottom: 10, fontWeight: 700 }}>
            SELECT TRAP SQUARE (YOUR BOARD)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 52px)', gap: 4, marginBottom: 14 }}>
            {ownGrid.map((rowArr, ri) =>
              rowArr.map((cell, ci) => {
                const alreadyFired = cell.shots[selectedGrid].fired;
                const alreadyTrapped = existingTrap && !existingTrap.triggered &&
                  existingTrap.grid === selectedGrid &&
                  existingTrap.col === ci && existingTrap.row === ri;
                const blocked = alreadyFired || alreadyTrapped;
                const isSelected = selectedCell && selectedCell.col === ci && selectedCell.row === ri;
                return (
                  <button
                    key={`${ri}-${ci}`}
                    onClick={() => { if (!blocked) setSelectedCell({ col: ci, row: ri }); }}
                    style={{
                      width: 52, height: 52,
                      background: isSelected ? '#2a0808' : blocked ? '#080808' : '#111124',
                      border: `1px solid ${isSelected ? '#ff6b6b' : blocked ? '#111' : '#1e1e3a'}`,
                      borderRadius: 4,
                      cursor: blocked ? 'not-allowed' : 'crosshair',
                      color: isSelected ? '#ff6b6b' : blocked ? '#222' : '#334',
                      fontFamily: 'inherit', fontSize: 10,
                      boxShadow: isSelected ? '0 0 8px #ff6b6b44' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {alreadyTrapped ? '⚡' : alreadyFired ? '×' : isSelected ? '⚡' : `${ci - 2},${2 - ri}`}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          disabled={!canConfirm}
          onClick={() => canConfirm && onConfirm(selectedGrid, selectedCell.col, selectedCell.row)}
          style={{
            padding: '10px 28px',
            background: canConfirm ? '#2a0808' : '#0a0808',
            border: `2px solid ${canConfirm ? '#ff6b6b' : '#2a1a1a'}`,
            borderRadius: 6,
            color: canConfirm ? '#ff6b6b' : '#334',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
            cursor: canConfirm ? 'pointer' : 'default',
            letterSpacing: '0.1em',
            boxShadow: canConfirm ? '0 0 12px #ff6b6b33' : 'none',
            transition: 'all 0.15s',
          }}
        >
          SET TRAP →
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: '1px solid #2a1a1a',
            borderRadius: 6,
            color: '#556',
            fontFamily: 'inherit', fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.08em',
            transition: 'all 0.15s',
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

function PartyPerryPicker({ onGuess, newPowers, onClose }) {
  const [guessed, setGuessed] = useState(false);
  const [wrong, setWrong] = useState(false);

  function handleGuess(n) {
    if (guessed) return;
    setGuessed(true);
    if (n !== 7) setWrong(true);
    onGuess(n);
  }

  const btnStyle = {
    width: 38,
    height: 38,
    background: '#1a0d2e',
    border: '2px solid #cc88ff55',
    borderRadius: 6,
    color: '#cc88ff',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  };

  return (
    <div style={{
      background: '#0d0d1a',
      border: '2px solid #cc88ff',
      borderRadius: 8,
      padding: '16px 20px',
      marginTop: 12,
      textAlign: 'center',
      maxWidth: 360,
      width: '100%',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#cc88ff', letterSpacing: '0.1em', marginBottom: 8 }}>
        PARTY PERRY
      </div>
      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>
        How many hats does Perry have?
      </div>

      {!guessed && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => handleGuess(n)} style={btnStyle}>{n}</button>
          ))}
        </div>
      )}

      {guessed && wrong && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ff4444', letterSpacing: '0.1em', marginBottom: 10 }}>
            WRONG
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '7px 24px',
              background: '#1a0808',
              border: '2px solid #ff4444',
              borderRadius: 6,
              color: '#ff4444',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            OK →
          </button>
        </div>
      )}

      {guessed && !wrong && newPowers && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#44ff88', letterSpacing: '0.1em', marginBottom: 10 }}>
            CORRECT! +2 POWERS
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            {newPowers.map((p, i) => {
              const rc = RARITY_CONFIG[p.rarity] || RARITY_CONFIG.common;
              return (
                <div key={i} style={{
                  background: '#0a0a1a',
                  border: `2px solid ${rc.color}88`,
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: rc.color,
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 8, opacity: 0.75, letterSpacing: '0.18em', marginBottom: 2 }}>{rc.label}</div>
                  {p.label}
                </div>
              );
            })}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '7px 24px',
              background: '#0a1a0a',
              border: '2px solid #44ff88',
              borderRadius: 6,
              color: '#44ff88',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            NICE →
          </button>
        </div>
      )}
    </div>
  );
}

function OmnipotencePicker({ selectedGrid, onSelectGrid, onConfirm, onCancel, opponentDestroyedGrids = [] }) {
  const grids = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];
  const canConfirm = selectedGrid !== null && !opponentDestroyedGrids.includes(selectedGrid);
  return (
    <div style={{
      marginTop: 12, width: '100%', maxWidth: 560,
      background: '#1a0505', border: '1px solid #ff444444',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ff4444', marginBottom: 10, fontWeight: 700 }}>
        OMNIPOTENCE — SELECT GRID TO DESTROY
      </div>
      <div style={{ fontSize: 11, color: '#884444', letterSpacing: '0.06em', marginBottom: 12 }}>
        Opponent cannot fire new shots in this grid for the rest of the round.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {grids.map(({ key, label }) => {
          const alreadyDestroyed = opponentDestroyedGrids.includes(key);
          const isSelected = selectedGrid === key && !alreadyDestroyed;
          return (
            <button key={key} onClick={() => !alreadyDestroyed && onSelectGrid(key)}
              disabled={alreadyDestroyed}
              title={alreadyDestroyed ? 'Already destroyed' : undefined}
              style={{
                padding: '8px 16px',
                background: isSelected ? '#2a0808' : '#100505',
                border: `1px solid ${isSelected ? '#ff4444' : alreadyDestroyed ? '#1a1a2a' : '#3a1a1a'}`,
                borderRadius: 4, color: isSelected ? '#ff4444' : alreadyDestroyed ? '#2a2a3a' : '#668',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                cursor: alreadyDestroyed ? 'not-allowed' : 'pointer', letterSpacing: '0.05em',
                boxShadow: isSelected ? '0 0 8px #ff444433' : 'none',
                transition: 'all 0.15s',
                textDecoration: alreadyDestroyed ? 'line-through' : 'none',
                opacity: alreadyDestroyed ? 0.4 : 1,
              }}>{label}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={!canConfirm} onClick={() => canConfirm && onConfirm(selectedGrid)} style={{
          padding: '10px 28px',
          background: canConfirm ? '#2a0808' : '#100505',
          border: `2px solid ${canConfirm ? '#ff4444' : '#3a1a1a'}`,
          borderRadius: 6, color: canConfirm ? '#ff4444' : '#334',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          cursor: canConfirm ? 'pointer' : 'default',
          letterSpacing: '0.1em', boxShadow: canConfirm ? '0 0 12px #ff444433' : 'none',
          transition: 'all 0.15s',
        }}>DESTROY GRID →</button>
        <button onClick={onCancel} style={{
          padding: '10px 20px', background: 'none',
          border: '1px solid #3a1a1a', borderRadius: 6, color: '#556',
          fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', letterSpacing: '0.08em',
        }}>CANCEL</button>
      </div>
    </div>
  );
}

function MarauderPicker({ opponentPowers, onConfirm, onCancel }) {
  const stealable = opponentPowers.filter(p => p.id !== 'marauder');
  const unused = stealable.filter(p => !p.used);
  const pool = unused.length > 0 ? unused : stealable;
  const fallback = unused.length === 0;
  const nothingToSteal = pool.length === 0;
  return (
    <div style={{
      marginTop: 12, width: '100%', maxWidth: 560,
      background: '#0a0f1a', border: '1px solid #ff880044',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ff8800', marginBottom: 8, fontWeight: 700 }}>
        MARAUDER — STEAL A POWER
      </div>
      <div style={{ fontSize: 11, color: '#885533', letterSpacing: '0.06em', marginBottom: 12 }}>
        {nothingToSteal
          ? 'No stealable powers — opponent only has Marauder.'
          : fallback
            ? 'Opponent used all powers — steal one back as a fresh copy.'
            : "Choose one of your opponent's remaining powers to steal."}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {pool.map((power, idx) => {
          const originalIdx = opponentPowers.indexOf(power);
          return (
            <button key={idx} onClick={() => onConfirm(originalIdx)}
              title={power.desc}
              style={{
                padding: '8px 16px',
                background: '#0d1020',
                border: '1px solid #ff880055',
                borderRadius: 6, color: '#ff8800',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.08em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff8800'; e.currentTarget.style.background = '#1a1000'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#ff880055'; e.currentTarget.style.background = '#0d1020'; }}
            >{power.label}</button>
          );
        })}
      </div>
      <button onClick={onCancel} style={{
        padding: '8px 20px', background: 'none',
        border: '1px solid #3a2a1a', borderRadius: 6, color: '#556',
        fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', letterSpacing: '0.08em',
      }}>CANCEL</button>
    </div>
  );
}

function OmnisciencePicker({ selectedGrid, onSelectGrid, onConfirm, onCancel, bindingVowActive = false, destroyedGrids = [] }) {
  const grids = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];
  const canConfirm = selectedGrid !== null;
  return (
    <div style={{
      marginTop: 12, width: '100%', maxWidth: 560,
      background: '#0a001a', border: '1px solid #cc44ff44',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#cc44ff', marginBottom: 10, fontWeight: 700 }}>
        OMNISCIENCE — SELECT GRID TO REVEAL
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {grids.map(({ key, label }) => {
          const isVowLocked = bindingVowActive && key === 'f';
          const isDestroyed = destroyedGrids.includes(key);
          const isDisabled = isVowLocked || isDestroyed;
          const isSelected = selectedGrid === key;
          return (
            <button key={key} onClick={() => !isDisabled && onSelectGrid(key)} disabled={isDisabled}
              title={isDestroyed ? 'Grid destroyed by Omnipotence' : isVowLocked ? 'Restricted by Binding Vow' : undefined}
              style={{
                padding: '8px 16px',
                background: isSelected ? '#1a0030' : '#08000f',
                border: `1px solid ${isSelected ? '#cc44ff' : isDisabled ? '#1a1a2a' : '#2a1a3a'}`,
                borderRadius: 4, color: isSelected ? '#cc44ff' : isDisabled ? '#2a2a3a' : '#668',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                letterSpacing: '0.05em', boxShadow: isSelected ? '0 0 8px #cc44ff33' : 'none',
                transition: 'all 0.15s',
                textDecoration: isDisabled ? 'line-through' : 'none',
                opacity: isDisabled ? 0.4 : 1,
              }}>{label}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={!canConfirm} onClick={() => canConfirm && onConfirm(selectedGrid)} style={{
          padding: '10px 28px',
          background: canConfirm ? '#1a0030' : '#08000f',
          border: `2px solid ${canConfirm ? '#cc44ff' : '#2a1a3a'}`,
          borderRadius: 6, color: canConfirm ? '#cc44ff' : '#334',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          cursor: canConfirm ? 'pointer' : 'default',
          letterSpacing: '0.1em', boxShadow: canConfirm ? '0 0 12px #cc44ff33' : 'none',
          transition: 'all 0.15s',
        }}>REVEAL FOR 3s →</button>
        <button onClick={onCancel} style={{
          padding: '10px 20px', background: 'none',
          border: '1px solid #2a1a3a', borderRadius: 6, color: '#556',
          fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', letterSpacing: '0.08em',
        }}>CANCEL</button>
      </div>
    </div>
  );
}

function OmniscienceRevealCell({ col, row, gridKey, activeFunctions }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const hits = activeFunctions
      .filter(({ fn }) => doesFunctionPassThrough(fn[gridKey], col, row))
      .map(({ fn, color }) => ({ fnId: fn.id, color }));
    const fakeCellShots = { [gridKey]: { fired: true, hits } };
    drawCell(canvasRef.current, gridKey, col, row, fakeCellShots, activeFunctions);
  }, [col, row, gridKey, activeFunctions]);
  return (
    <canvas ref={canvasRef} width={48} height={48}
      style={{ border: '1px solid #cc44ff44', borderRadius: 2, display: 'block' }}
    />
  );
}

function OmniscienceReveal({ gridKey, targetSlot, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(3);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const gridLabels = { f: 'f(x)', df: "f′(x)", F: 'F(x)' };

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(interval);
          onCloseRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16,
      fontFamily: "'Courier New', Courier, monospace",
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#cc44ff', fontWeight: 700 }}>
        OMNISCIENCE · {gridLabels[gridKey]} · FULL REVEAL
      </div>
      <div style={{
        fontSize: 48, fontWeight: 900, color: '#cc44ff',
        textShadow: '0 0 32px #cc44ffcc', letterSpacing: '0.1em',
        lineHeight: 1,
      }}>
        {secondsLeft}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 52px)', gap: 4 }}>
        {targetSlot.grid.map((rowArr, ri) =>
          rowArr.map((_, ci) => (
            <OmniscienceRevealCell
              key={`${ri}-${ci}`}
              col={ci} row={ri}
              gridKey={gridKey}
              activeFunctions={targetSlot.functions}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────

export default function App() {
  // phase: 'difficulty' | 'mode' | 'roundtype' | 'solo' | 'mp' | 'pass' | 'round-end'
  const [phase, setPhase] = useState('difficulty');
  const [difficulty, setDifficulty] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // ── Solo state ──
  const [activeFunctions, setActiveFunctions] = useState([]);
  const [grid, setGrid] = useState(initGrid);
  const [shotMode, setShotMode] = useState('f');
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const [wrongGuessIds, setWrongGuessIds] = useState([]);

  // ── 1v1 state ──
  const [roundType, setRoundType] = useState(null); // 'lightning' | 'normal'
  const [mpDoubleRarityDefault, setMpDoubleRarityDefault] = useState(false);
  const [mpCurrentRound, setMpCurrentRound] = useState(1);
  const [mpP1RoundWins, setMpP1RoundWins] = useState(0);
  const [mpP2RoundWins, setMpP2RoundWins] = useState(0);
  const [p1Slot, setP1Slot] = useState(null);
  const [p2Slot, setP2Slot] = useState(null);
  const [mpP1Identified, setMpP1Identified] = useState([]);
  const [mpP2Identified, setMpP2Identified] = useState([]);
  const [mpCurrentPlayer, setMpCurrentPlayer] = useState(1);
  const [mpPassTo, setMpPassTo] = useState(null);
  const [mpShotMode, setMpShotMode] = useState('f');
  const [mpMessage, setMpMessage] = useState('');
  const [mpP1WrongGuesses, setMpP1WrongGuesses] = useState([]);
  const [mpP2WrongGuesses, setMpP2WrongGuesses] = useState([]);
  const [mpWinner, setMpWinner] = useState(null); // round winner: 1 | 2
  const [mpMatchWinner, setMpMatchWinner] = useState(null); // match winner: 1 | 2 (normal mode only)
  const [mpShotsFiredThisTurn, setMpShotsFiredThisTurn] = useState(0);
  const [mpShotsAllowedThisTurn, setMpShotsAllowedThisTurn] = useState(1);
  const [mpBonusTurnsRemaining, setMpBonusTurnsRemaining] = useState(0);
  const [mpNextPassIsBonusTurn, setMpNextPassIsBonusTurn] = useState(false);

  // ── Powers ──
  const [p1Powers, setP1Powers] = useState([]);
  const [p2Powers, setP2Powers] = useState([]);
  const [mpCoinFlipWinner, setMpCoinFlipWinner] = useState(null);
  const [mpParabolaShotPending, setMpParabolaShotPending] = useState(false);
  const [mpParabolaShotGridKey, setMpParabolaShotGridKey] = useState(null);
  const [mpParabolaShotPresetIdx, setMpParabolaShotPresetIdx] = useState(null);
  const [p1ParabolaScanResults, setP1ParabolaScanResults] = useState([]);
  const [p2ParabolaScanResults, setP2ParabolaScanResults] = useState([]);

  const [mpParabolaShotPendingIndex, setMpParabolaShotPendingIndex] = useState(null);

  const [mpSpiralShotPending, setMpSpiralShotPending] = useState(false);
  const [mpSpiralShotGridKey, setMpSpiralShotGridKey] = useState(null);
  const [mpSpiralShotPresetIdx, setMpSpiralShotPresetIdx] = useState(null);
  const [p1SpiralScanResults, setP1SpiralScanResults] = useState([]);
  const [p2SpiralScanResults, setP2SpiralScanResults] = useState([]);
  const [mpSpiralShotPendingIndex, setMpSpiralShotPendingIndex] = useState(null);

  // ── Heat Check ──
  const [mpHeatCheckActive, setMpHeatCheckActive] = useState(false);
  const [mpHeatCheckMissed, setMpHeatCheckMissed] = useState(false);

  // ── Trap Card ──
  const [mpTrapCardPending, setMpTrapCardPending] = useState(false);
  const [mpTrapCardPendingIndex, setMpTrapCardPendingIndex] = useState(null);
  const [mpTrapCardGrid, setMpTrapCardGrid] = useState(null);
  const [p1TrapCard, setP1TrapCard] = useState(null); // { grid, col, row, triggered }
  const [p2TrapCard, setP2TrapCard] = useState(null);
  const [mpTrapTriggered, setMpTrapTriggered] = useState(false);

  // ── Binding Vow ──
  const [p1BindingVowActive, setP1BindingVowActive] = useState(false);
  const [p2BindingVowActive, setP2BindingVowActive] = useState(false);

  // ── Glitch ──
  const [mpGlitchBonusActive, setMpGlitchBonusActive] = useState(false);
  const [mpGlitchTriggered, setMpGlitchTriggered] = useState(false);

  // ── Party Perry ──
  const [mpPartyPerryPending, setMpPartyPerryPending] = useState(false);
  const [mpPartyPerryPendingIndex, setMpPartyPerryPendingIndex] = useState(null);
  const [mpPartyPerryNewPowers, setMpPartyPerryNewPowers] = useState(null);

  // ── Omniscience ──
  const [mpOmnisciencePending, setMpOmnisciencePending] = useState(false);
  const [mpOmnisciencePendingIndex, setMpOmnisciencePendingIndex] = useState(null);
  const [mpOmniscienceActive, setMpOmniscienceActive] = useState(false);
  const [mpOmniscienceGrid, setMpOmniscienceGrid] = useState(null);

  // ── Power error ──
  const [mpPowerError, setMpPowerError] = useState('');

  // ── Omnipotence ──
  const [mpOmnipotencePending, setMpOmnipotencePending] = useState(false);
  const [mpOmnipotencePendingIndex, setMpOmnipotencePendingIndex] = useState(null);
  const [mpOmnipotenceGrid, setMpOmnipotenceGrid] = useState(null);
  const [p1DestroyedGrids, setP1DestroyedGrids] = useState([]); // grids P1 can't fire in
  const [p2DestroyedGrids, setP2DestroyedGrids] = useState([]); // grids P2 can't fire in

  // ── Marauder ──
  const [mpMarauderPending, setMpMarauderPending] = useState(false);
  const [mpMarauderPendingIndex, setMpMarauderPendingIndex] = useState(null);

  // ── Fog of War ──
  const [p1FogOfWarTurns, setP1FogOfWarTurns] = useState(0);
  const [p2FogOfWarTurns, setP2FogOfWarTurns] = useState(0);
  const [mpFogOfWarThisTurn, setMpFogOfWarThisTurn] = useState(false);

  // ── Battle Royale state ──
  // brPlayers[i]: { name, active, eliminationRound, finishedThisRound, finishOrder,
  //   grid, functions, identified, wrongGuesses, powers,
  //   parabolaScanResults, spiralScanResults,
  //   bindingVowActive, destroyedGrids, fogOfWarTurns, notifications }
  const [brPlayers, setBrPlayers] = useState([]);
  const [brCurrentIdx, setBrCurrentIdx] = useState(0);
  const [brPassToIdx, setBrPassToIdx] = useState(0);
  const [brRound, setBrRound] = useState(1);
  const [brPowersEnabled, setBrPowersEnabled] = useState(true);
  const [brDoubleRarityDefault, setBrDoubleRarityDefault] = useState(false);
  const [brRoundFinishOrder, setBrRoundFinishOrder] = useState([]); // player indices in finish order
  const [brEliminationOrder, setBrEliminationOrder] = useState([]); // player indices in elim order
  // per-turn ephemeral
  const [brShotMode, setBrShotMode] = useState('f');
  const [brShotsFiredThisTurn, setBrShotsFiredThisTurn] = useState(0);
  const [brShotsAllowedThisTurn, setBrShotsAllowedThisTurn] = useState(1);
  const [brBonusTurnsRemaining, setBrBonusTurnsRemaining] = useState(0);
  const [brNextPassIsBonusTurn, setBrNextPassIsBonusTurn] = useState(false);
  const [brMessage, setBrMessage] = useState('');
  const [brHeatCheckActive, setBrHeatCheckActive] = useState(false);
  const [brHeatCheckMissed, setBrHeatCheckMissed] = useState(false);
  const [brParabolaShotPending, setBrParabolaShotPending] = useState(false);
  const [brParabolaShotPendingIndex, setBrParabolaShotPendingIndex] = useState(null);
  const [brParabolaShotGridKey, setBrParabolaShotGridKey] = useState(null);
  const [brParabolaShotPresetIdx, setBrParabolaShotPresetIdx] = useState(null);
  const [brSpiralShotPending, setBrSpiralShotPending] = useState(false);
  const [brSpiralShotPendingIndex, setBrSpiralShotPendingIndex] = useState(null);
  const [brSpiralShotGridKey, setBrSpiralShotGridKey] = useState(null);
  const [brSpiralShotPresetIdx, setBrSpiralShotPresetIdx] = useState(null);
  const [brPartyPerryPending, setBrPartyPerryPending] = useState(false);
  const [brPartyPerryPendingIndex, setBrPartyPerryPendingIndex] = useState(null);
  const [brPartyPerryNewPowers, setBrPartyPerryNewPowers] = useState(null);
  const [brOmnisciencePending, setBrOmnisciencePending] = useState(false);
  const [brOmnisciencePendingIndex, setBrOmnisciencePendingIndex] = useState(null);
  const [brOmniscienceGrid, setBrOmniscienceGrid] = useState(null);
  const [brOmniscienceActive, setBrOmniscienceActive] = useState(false);
  const [brOmniscienceTargetIdx, setBrOmniscienceTargetIdx] = useState(null);
  const [brOmnipotencePending, setBrOmnipotencePending] = useState(false);
  const [brOmnipotencePendingIndex, setBrOmnipotencePendingIndex] = useState(null);
  const [brOmnipotenceGrid, setBrOmnipotenceGrid] = useState(null);
  const [brOmnipotenceTargetIdx, setBrOmnipotenceTargetIdx] = useState(null);
  const [brFogOfWarPending, setBrFogOfWarPending] = useState(false);
  const [brFogOfWarPendingIndex, setBrFogOfWarPendingIndex] = useState(null);
  const [brMarauderPending, setBrMarauderPending] = useState(false);
  const [brMarauderPendingIndex, setBrMarauderPendingIndex] = useState(null);
  const [brMarauderTargetIdx, setBrMarauderTargetIdx] = useState(null);
  const [brTargetPickerPending, setBrTargetPickerPending] = useState(false); // intermediate target pick step
  const [brGlitchBonusActive, setBrGlitchBonusActive] = useState(false);
  const [brGlitchTriggered, setBrGlitchTriggered] = useState(false);
  const [brFogOfWarThisTurn, setBrFogOfWarThisTurn] = useState(false);
  const [brPowerError, setBrPowerError] = useState('');
  const [brPassAnnouncement, setBrPassAnnouncement] = useState('');

  // ── Navigation ──

  function handleDifficultySelect(diff) {
    setDifficulty(diff);
    setPhase('mode');
  }

  function handleModeSelect(mode) {
    setGameMode(mode);
    if (mode === 'solo') {
      setActiveFunctions(selectFunctions(difficulty));
      setGrid(initGrid());
      setShotMode('f');
      setWon(false);
      setMessage('');
      setWrongGuessIds([]);
      setPhase('solo');
    } else if (mode === 'powertest') {
      setPhase('power-test-setup');
    } else if (mode === 'battleRoyale') {
      setPhase('br-setup');
    } else {
      setPhase('roundtype');
    }
  }

  function handleRoundTypeSelect(type, doubleRarity) {
    setRoundType(type);
    setMpCurrentRound(1);
    setMpP1RoundWins(0);
    setMpP2RoundWins(0);
    setMpDoubleRarityDefault(!!doubleRarity);
    startMpRound(1, !!doubleRarity);
  }

  function startMpRound(roundNum, useDoubled = false) {
    const newP1Powers = rollPowers(1, useDoubled);
    const newP2Powers = rollPowers(1, useDoubled);
    setP1Powers(newP1Powers);
    setP2Powers(newP2Powers);
    setMpCoinFlipWinner(null);

    setP1Slot({ functions: selectFunctions(difficulty), grid: initGrid() });
    setP2Slot({ functions: selectFunctions(difficulty), grid: initGrid() });
    setMpP1Identified([]);
    setMpP2Identified([]);
    setMpCurrentPlayer(1);
    setMpPassTo(null);
    setMpShotMode('f');
    setMpMessage('');
    setMpWinner(null);
    setMpShotsFiredThisTurn(0);
    setMpShotsAllowedThisTurn(1);
    setMpBonusTurnsRemaining(0);
    setMpNextPassIsBonusTurn(false);
    setMpP1WrongGuesses([]);
    setMpP2WrongGuesses([]);
    setP1ParabolaScanResults([]);
    setP2ParabolaScanResults([]);
    setMpParabolaShotPending(false);
    setMpParabolaShotPendingIndex(null);
    setMpParabolaShotGridKey(null);
    setMpParabolaShotPresetIdx(null);
    setP1SpiralScanResults([]);
    setP2SpiralScanResults([]);
    setMpSpiralShotPending(false);
    setMpSpiralShotPendingIndex(null);
    setMpSpiralShotGridKey(null);
    setMpSpiralShotPresetIdx(null);
    setMpTrapCardPending(false);
    setMpTrapCardPendingIndex(null);
    setMpTrapCardGrid(null);
    setP1TrapCard(null);
    setP2TrapCard(null);
    setMpTrapTriggered(false);
    setMpHeatCheckActive(false);
    setMpHeatCheckMissed(false);
    setP1BindingVowActive(false);
    setP2BindingVowActive(false);
    setMpGlitchBonusActive(false);
    setMpGlitchTriggered(false);
    setMpPartyPerryPending(false);
    setMpPartyPerryPendingIndex(null);
    setMpPartyPerryNewPowers(null);
    setMpOmnisciencePending(false);
    setMpOmnisciencePendingIndex(null);
    setMpOmniscienceActive(false);
    setMpOmniscienceGrid(null);
    setMpOmnipotencePending(false);
    setMpOmnipotencePendingIndex(null);
    setMpOmnipotenceGrid(null);
    setMpMarauderPending(false);
    setMpMarauderPendingIndex(null);
    setP1DestroyedGrids([]);
    setP2DestroyedGrids([]);
    setP1FogOfWarTurns(0);
    setP2FogOfWarTurns(0);
    setMpFogOfWarThisTurn(false);
    setPhase('power-draw');
  }

  function startPowerTestGame(p1TestPowers, p2TestPowers, p1Fns, p2Fns) {
    setRoundType('lightning');
    setMpCurrentRound(1);
    setMpP1RoundWins(0);
    setMpP2RoundWins(0);
    setP1Powers(p1TestPowers);
    setP2Powers(p2TestPowers);
    setMpCoinFlipWinner(null);

    setP1Slot({ functions: p1Fns, grid: initGrid() });
    setP2Slot({ functions: p2Fns, grid: initGrid() });
    setMpP1Identified([]);
    setMpP2Identified([]);
    setMpCurrentPlayer(1);
    setMpPassTo(null);
    setMpShotMode('f');
    setMpMessage('');
    setMpWinner(null);
    setMpMatchWinner(null);
    setMpShotsFiredThisTurn(0);
    setMpShotsAllowedThisTurn(1);
    setMpBonusTurnsRemaining(0);
    setMpNextPassIsBonusTurn(false);
    setMpP1WrongGuesses([]);
    setMpP2WrongGuesses([]);
    setP1ParabolaScanResults([]);
    setP2ParabolaScanResults([]);
    setMpParabolaShotPending(false);
    setMpParabolaShotPendingIndex(null);
    setMpParabolaShotGridKey(null);
    setMpParabolaShotPresetIdx(null);
    setP1SpiralScanResults([]);
    setP2SpiralScanResults([]);
    setMpSpiralShotPending(false);
    setMpSpiralShotPendingIndex(null);
    setMpSpiralShotGridKey(null);
    setMpSpiralShotPresetIdx(null);
    setMpTrapCardPending(false);
    setMpTrapCardPendingIndex(null);
    setMpTrapCardGrid(null);
    setP1TrapCard(null);
    setP2TrapCard(null);
    setMpTrapTriggered(false);
    setMpHeatCheckActive(false);
    setMpHeatCheckMissed(false);
    setP1BindingVowActive(false);
    setP2BindingVowActive(false);
    setMpGlitchBonusActive(false);
    setMpGlitchTriggered(false);
    setMpPartyPerryPending(false);
    setMpPartyPerryPendingIndex(null);
    setMpPartyPerryNewPowers(null);
    setMpOmnisciencePending(false);
    setMpOmnisciencePendingIndex(null);
    setMpOmniscienceActive(false);
    setMpOmniscienceGrid(null);
    setMpOmnipotencePending(false);
    setMpOmnipotencePendingIndex(null);
    setMpOmnipotenceGrid(null);
    setMpMarauderPending(false);
    setMpMarauderPendingIndex(null);
    setP1DestroyedGrids([]);
    setP2DestroyedGrids([]);
    setP1FogOfWarTurns(0);
    setP2FogOfWarTurns(0);
    setMpFogOfWarThisTurn(false);
    setPhase('mp');
  }

  function goHome() {
    setPhase('difficulty');
    setDifficulty(null);
    setGameMode(null);
    setRoundType(null);
    setMpMatchWinner(null);
  }

  // ── Battle Royale logic ──

  function makeBrPlayer(name) {
    return {
      name,
      active: true,
      eliminationRound: null,
      finishedThisRound: false,
      finishOrder: null,
      grid: initGrid(),
      functions: [],
      identified: [],
      wrongGuesses: [],
      powers: [],
      parabolaScanResults: [],
      spiralScanResults: [],
      bindingVowActive: false,
      destroyedGrids: [],
      fogOfWarTurns: 0,
      notifications: [],
    };
  }

  function startBattleRoyale(playerNames, powersEnabled, doubleRarityEnabled) {
    setBrPowersEnabled(powersEnabled);
    setBrDoubleRarityDefault(!!doubleRarityEnabled);
    setBrRound(1);
    setBrEliminationOrder([]);
    const players = playerNames.map(name => ({
      ...makeBrPlayer(name),
      functions: selectFunctions(difficulty),
      powers: powersEnabled ? rollBrPowers(1, !!doubleRarityEnabled) : [],
    }));
    setBrPlayers(players);
    setBrCurrentIdx(0);
    setBrRoundFinishOrder([]);
    resetBrTurnState();
    setPhase('br');
  }

  function startBrNextRound(playersAfterElim) {
    const nextRound = brRound + 1;
    setBrRound(nextRound);
    setBrRoundFinishOrder([]);
    setBrPassAnnouncement('');
    // Shuffle active players so turn order is randomized each round
    const active = playersAfterElim.filter(p => p.active);
    for (let i = active.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [active[i], active[j]] = [active[j], active[i]];
    }
    const shuffled = [...active];
    const updated = shuffled.map(p => ({
      ...p,
      finishedThisRound: false,
      finishOrder: null,
      grid: initGrid(),
      functions: selectFunctions(difficulty),
      identified: [],
      wrongGuesses: [],
      powers: brPowersEnabled ? rollBrPowers(1, brDoubleRarityDefault) : [],
      parabolaScanResults: [],
      spiralScanResults: [],
      bindingVowActive: false,
      destroyedGrids: [],
      fogOfWarTurns: 0,
      notifications: [],
    }));
    setBrPlayers(updated);
    // Start with first active player
    const firstIdx = updated.findIndex(p => p.active);
    setBrCurrentIdx(firstIdx);
    resetBrTurnState();
    setPhase('br');
  }

  function resetBrTurnState() {
    setBrShotMode('f');
    setBrShotsFiredThisTurn(0);
    setBrShotsAllowedThisTurn(1);
    setBrBonusTurnsRemaining(0);
    setBrNextPassIsBonusTurn(false);
    setBrMessage('');
    setBrHeatCheckActive(false);
    setBrHeatCheckMissed(false);
    setBrParabolaShotPending(false);
    setBrParabolaShotPendingIndex(null);
    setBrParabolaShotGridKey(null);
    setBrParabolaShotPresetIdx(null);
    setBrSpiralShotPending(false);
    setBrSpiralShotPendingIndex(null);
    setBrSpiralShotGridKey(null);
    setBrSpiralShotPresetIdx(null);
    setBrPartyPerryPending(false);
    setBrPartyPerryPendingIndex(null);
    setBrPartyPerryNewPowers(null);
    setBrOmnisciencePending(false);
    setBrOmnisciencePendingIndex(null);
    setBrOmniscienceGrid(null);
    setBrOmniscienceActive(false);
    setBrOmniscienceTargetIdx(null);
    setBrOmnipotencePending(false);
    setBrOmnipotencePendingIndex(null);
    setBrOmnipotenceGrid(null);
    setBrOmnipotenceTargetIdx(null);
    setBrFogOfWarPending(false);
    setBrFogOfWarPendingIndex(null);
    setBrMarauderPending(false);
    setBrMarauderPendingIndex(null);
    setBrMarauderTargetIdx(null);
    setBrTargetPickerPending(false);
    setBrGlitchBonusActive(false);
    setBrGlitchTriggered(false);
    setBrFogOfWarThisTurn(false);
    setBrPowerError('');
  }

  function findNextBrPlayerIdx(players, fromIdx) {
    const n = players.length;
    for (let step = 1; step <= n; step++) {
      const idx = (fromIdx + step) % n;
      if (players[idx].active && !players[idx].finishedThisRound) return idx;
    }
    return -1;
  }

  function brFireShot(col, row) {
    const player = brPlayers[brCurrentIdx];
    if (brShotsFiredThisTurn >= brShotsAllowedThisTurn) return;

    let actualShotMode;
    if (brFogOfWarThisTurn) {
      const grids = availableGrids(player.destroyedGrids, player.bindingVowActive);
      actualShotMode = grids[Math.floor(Math.random() * grids.length)];
    } else {
      if (player.destroyedGrids.includes(brShotMode)) return;
      actualShotMode = brShotMode;
    }

    if (player.grid[row][col].shots[actualShotMode].fired) {
      if (!brFogOfWarThisTurn) return;
      const newCount = brShotsFiredThisTurn + 1;
      setBrShotsFiredThisTurn(newCount);
      if (brHeatCheckActive) setBrHeatCheckMissed(true);
      return;
    }

    const hits = player.functions
      .filter(({ fn }) => doesFunctionPassThrough(fn[actualShotMode], col, row))
      .map(({ fn, color }) => ({ fnId: fn.id, color }));

    const newGrid = player.grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri !== row || ci !== col) return c;
        return { ...c, shots: { ...c.shots, [actualShotMode]: { fired: true, hits } } };
      })
    );
    setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx ? { ...p, grid: newGrid } : p));

    const newCount = brShotsFiredThisTurn + 1;
    setBrShotsFiredThisTurn(newCount);
    if (brHeatCheckActive) {
      if (hits.length === 0) setBrHeatCheckMissed(true);
      else if (newCount < 3) setBrShotsAllowedThisTurn(prev => prev + 1);
    }
  }

  function brHandleGuessById(id) {
    const player = brPlayers[brCurrentIdx];
    if (player.identified.includes(id)) { setBrMessage('Already found!'); return; }

    const match = player.functions.find(({ fn }) => fn.id === id);
    if (match) {
      const newIdentified = [...player.identified, id];
      setBrMessage('');

      // Bonus auto-trigger
      const bonusIdx = player.powers.findIndex(p => p.id === 'bonus' && !p.used);
      let newPowers = player.powers;
      if (bonusIdx !== -1) {
        newPowers = player.powers.map((p, i) => i === bonusIdx ? { ...p, used: true } : p);
        setBrShotsAllowedThisTurn(prev => prev + 2);
      }

      const allDone = newIdentified.length === player.functions.length;
      const newFinishOrder = allDone ? brRoundFinishOrder.length + 1 : player.finishOrder;

      setBrPlayers(prev => prev.map((p, i) =>
        i === brCurrentIdx
          ? { ...p, identified: newIdentified, powers: newPowers, finishedThisRound: allDone, finishOrder: newFinishOrder }
          : p
      ));

      if (allDone) {
        const pos = brRoundFinishOrder.length + 1;
        const ordinal = pos === 1 ? '1st' : pos === 2 ? '2nd' : pos === 3 ? '3rd' : `${pos}th`;
        const newFinishOrderArr = [...brRoundFinishOrder, brCurrentIdx];
        // Count unfinished active players excluding the one who just finished
        const unfinishedOthers = brPlayers.filter((p, i) =>
          p.active && !p.finishedThisRound && i !== brCurrentIdx
        );

        if (unfinishedOthers.length === 0) {
          // Everyone finished simultaneously or this was the last one
          setBrRoundFinishOrder(newFinishOrderArr);
          setBrPassAnnouncement(`${player.name} finished ${ordinal}!`);
          setTimeout(() => setPhase('br-round-end'), 0);
        } else if (unfinishedOthers.length === 1) {
          // Only 1 player left — auto-eliminated, no need to play
          const lastPlayerIdx = brPlayers.findIndex((p, i) =>
            p.active && !p.finishedThisRound && i !== brCurrentIdx
          );
          const finalFinishOrderArr = [...newFinishOrderArr, lastPlayerIdx];
          setBrRoundFinishOrder(finalFinishOrderArr);
          setBrPassAnnouncement(
            `${player.name} finished ${ordinal}! ☠ ${brPlayers[lastPlayerIdx].name} is last — eliminated!`
          );
          setTimeout(() => setPhase('br-round-end'), 0);
        } else {
          // 2+ others still unfinished — pass to next player with announcement
          setBrRoundFinishOrder(newFinishOrderArr);
          const nextIdx = findNextBrPlayerIdx(
            brPlayers.map((p, i) => i === brCurrentIdx ? { ...p, finishedThisRound: true } : p),
            brCurrentIdx
          );
          setBrPassToIdx(nextIdx);
          setBrPassAnnouncement(`${player.name} finished ${ordinal}!`);
          resetBrTurnState();
          setTimeout(() => setPhase('br-pass'), 0);
        }
      }
    } else {
      setBrPlayers(prev => prev.map((p, i) =>
        i === brCurrentIdx && !p.wrongGuesses.includes(id)
          ? { ...p, wrongGuesses: [...p.wrongGuesses, id] }
          : p
      ));
      const glitchIdx = player.powers.findIndex(p => p.id === 'glitch' && !p.used);
      if (glitchIdx !== -1) {
        setBrPlayers(prev => prev.map((p, i) =>
          i === brCurrentIdx ? { ...p, powers: p.powers.map((pw, pi) => pi === glitchIdx ? { ...pw, used: true } : pw) } : p
        ));
        endBrTurn(true, true);
      } else {
        endBrTurn(true);
      }
    }
  }

  function endBrTurn(wrongGuess = false, glitchTriggered = false) {
    // Decrement fog for current player if applicable
    if (brFogOfWarThisTurn) {
      setBrPlayers(prev => prev.map((p, i) =>
        i === brCurrentIdx ? { ...p, fogOfWarTurns: Math.max(0, p.fogOfWarTurns - 1) } : p
      ));
    }

    resetBrTurnState();

    if (wrongGuess && glitchTriggered) {
      setBrBonusTurnsRemaining(1);
      setBrPassToIdx(brCurrentIdx);
      setBrNextPassIsBonusTurn(true);
      setBrGlitchBonusActive(true);
      setBrGlitchTriggered(true);
    } else if (wrongGuess && brBonusTurnsRemaining > 0) {
      setBrBonusTurnsRemaining(0);
      setBrGlitchBonusActive(false);
      const nextIdx = findNextBrPlayerIdx(brPlayers, brCurrentIdx);
      setBrPassToIdx(nextIdx >= 0 ? nextIdx : brCurrentIdx);
    } else if (brBonusTurnsRemaining > 0) {
      setBrBonusTurnsRemaining(prev => prev - 1);
      setBrPassToIdx(brCurrentIdx);
      setBrNextPassIsBonusTurn(true);
    } else {
      setBrGlitchBonusActive(false);
      const nextIdx = findNextBrPlayerIdx(brPlayers, brCurrentIdx);
      setBrPassToIdx(nextIdx >= 0 ? nextIdx : brCurrentIdx);
    }
    setPhase('br-pass');
  }

  function handleBrPassContinue() {
    setBrPassAnnouncement('');
    const nextPlayer = brPlayers[brPassToIdx];
    let newShotMode = 'f';
    if (nextPlayer.bindingVowActive) {
      setBrShotsAllowedThisTurn(2);
      newShotMode = 'df';
    } else if (nextPlayer.destroyedGrids.includes('f')) {
      newShotMode = ['f', 'df', 'F'].find(m => !nextPlayer.destroyedGrids.includes(m)) || 'df';
    }
    setBrShotMode(newShotMode);
    setBrFogOfWarThisTurn(nextPlayer.fogOfWarTurns > 0);
    setBrGlitchTriggered(false);
    setBrCurrentIdx(brPassToIdx);
    // Clear notifications for this player
    setBrPlayers(prev => prev.map((p, i) => i === brPassToIdx ? { ...p, notifications: [] } : p));
    setPhase('br');
  }

  function useBrPower(powerIndex) {
    const player = brPlayers[brCurrentIdx];
    const power = player.powers[powerIndex];
    if (!power || power.used) return;
    setBrPowerError('');

    if (power.id === 'reload') {
      setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx
        ? { ...p, powers: p.powers.map((pw, pi) => pi === powerIndex ? { ...pw, used: true } : pw) } : p));
      setBrShotsAllowedThisTurn(prev => prev + 1);
      return;
    }
    if (power.id === 'heatCheck') {
      if (brShotsFiredThisTurn > 0 || brShotsAllowedThisTurn >= 2) return;
      setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx
        ? { ...p, powers: p.powers.map((pw, pi) => pi === powerIndex ? { ...pw, used: true } : pw) } : p));
      setBrHeatCheckActive(true);
      return;
    }
    if (power.id === 'bindingVow') {
      const avail = availableGrids(player.destroyedGrids, true);
      if (avail.length === 0) { setBrPowerError('Cannot activate — all grids would be restricted'); return; }
      setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx
        ? { ...p, powers: p.powers.map((pw, pi) => pi === powerIndex ? { ...pw, used: true } : pw), bindingVowActive: true } : p));
      setBrShotsAllowedThisTurn(2);
      if (brShotMode === 'f') setBrShotMode('df');
      return;
    }
    if (power.id === 'parabolaShot') {
      setBrParabolaShotPending(true);
      setBrParabolaShotPendingIndex(powerIndex);
      return;
    }
    if (power.id === 'spiralShot') {
      setBrSpiralShotPending(true);
      setBrSpiralShotPendingIndex(powerIndex);
      return;
    }
    if (power.id === 'partyPerry') {
      setBrPartyPerryPending(true);
      setBrPartyPerryPendingIndex(powerIndex);
      return;
    }
    // Opponent-targeting powers — first pick the target
    if (power.id === 'omniscience') {
      setBrOmnisciencePendingIndex(powerIndex);
      setBrTargetPickerPending(true);
      return;
    }
    if (power.id === 'omnipotence') {
      setBrOmnipotencePendingIndex(powerIndex);
      setBrTargetPickerPending(true);
      return;
    }
    if (power.id === 'fogOfWar') {
      setBrFogOfWarPendingIndex(powerIndex);
      setBrTargetPickerPending(true);
      return;
    }
    if (power.id === 'marauder') {
      setBrMarauderPendingIndex(powerIndex);
      setBrTargetPickerPending(true);
      return;
    }
  }

  function handleBrTargetSelect(targetIdx) {
    setBrTargetPickerPending(false);
    const player = brPlayers[brCurrentIdx];
    if (brOmnisciencePendingIndex !== null) {
      setBrOmniscienceTargetIdx(targetIdx);
      setBrOmnisciencePending(true);
      setBrOmniscienceGrid(null);
      return;
    }
    if (brOmnipotencePendingIndex !== null) {
      setBrOmnipotenceTargetIdx(targetIdx);
      setBrOmnipotencePending(true);
      setBrOmnipotenceGrid(null);
      return;
    }
    if (brFogOfWarPendingIndex !== null) {
      const target = brPlayers[targetIdx];
      if (target.fogOfWarTurns > 0) {
        setBrPowerError(`Cannot activate — Fog of War already active on ${target.name}`);
        setBrFogOfWarPendingIndex(null);
        return;
      }
      setBrPlayers(prev => prev.map((p, i) => {
        if (i === brCurrentIdx) {
          return { ...p, powers: p.powers.map((pw, pi) => pi === brFogOfWarPendingIndex ? { ...pw, used: true } : pw) };
        }
        if (i === targetIdx) {
          return { ...p, fogOfWarTurns: p.fogOfWarTurns + 3,
            notifications: [...p.notifications, { power: 'Fog of War', byName: player.name }] };
        }
        return p;
      }));
      setBrFogOfWarPendingIndex(null);
      return;
    }
    if (brMarauderPendingIndex !== null) {
      setBrMarauderTargetIdx(targetIdx);
      setBrMarauderPending(true);
      return;
    }
  }

  function cancelBrTargetPicker() {
    setBrTargetPickerPending(false);
    setBrOmnisciencePendingIndex(null);
    setBrOmnipotencePendingIndex(null);
    setBrFogOfWarPendingIndex(null);
    setBrMarauderPendingIndex(null);
  }

  function brActivateOmniscience(gridKey) {
    setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx
      ? { ...p, powers: p.powers.map((pw, pi) => pi === brOmnisciencePendingIndex ? { ...pw, used: true } : pw) } : p));
    setBrOmnisciencePending(false);
    setBrOmniscienceGrid(gridKey);
    setBrOmniscienceActive(true);
  }

  function brCancelOmniscience() {
    setBrOmnisciencePending(false);
    setBrOmniscienceGrid(null);
    setBrOmniscienceTargetIdx(null);
    setBrOmnisciencePendingIndex(null);
  }

  function brCloseOmniscience() {
    setBrOmniscienceActive(false);
    setBrOmniscienceGrid(null);
    setBrOmniscienceTargetIdx(null);
    setBrOmnisciencePendingIndex(null);
  }

  function brActivateOmnipotence(gridKey) {
    const target = brPlayers[brOmnipotenceTargetIdx];
    const currentPlayer = brPlayers[brCurrentIdx];
    const newDestroyed = [...target.destroyedGrids, gridKey];
    if (availableGrids(newDestroyed, target.bindingVowActive).length === 0) {
      setBrPowerError('Cannot activate — all grids would be restricted');
      return;
    }
    setBrPlayers(prev => prev.map((p, i) => {
      if (i === brCurrentIdx) {
        return { ...p, powers: p.powers.map((pw, pi) => pi === brOmnipotencePendingIndex ? { ...pw, used: true } : pw) };
      }
      if (i === brOmnipotenceTargetIdx) {
        return { ...p, destroyedGrids: newDestroyed,
          notifications: [...p.notifications, { power: 'Omnipotence', byName: currentPlayer.name }] };
      }
      return p;
    }));
    setBrOmnipotencePending(false);
    setBrOmnipotenceGrid(null);
    setBrOmnipotenceTargetIdx(null);
    setBrOmnipotencePendingIndex(null);
  }

  function brCancelOmnipotence() {
    setBrOmnipotencePending(false);
    setBrOmnipotenceGrid(null);
    setBrOmnipotenceTargetIdx(null);
    setBrOmnipotencePendingIndex(null);
  }

  function brConfirmMarauder(opponentPowerIndex) {
    const currentPlayer = brPlayers[brCurrentIdx];
    const targetPlayer = brPlayers[brMarauderTargetIdx];
    const stolenPower = targetPlayer.powers[opponentPowerIndex];
    setBrPlayers(prev => prev.map((p, i) => {
      if (i === brCurrentIdx) {
        const newPowers = p.powers.map((pw, pi) => pi === brMarauderPendingIndex ? { ...pw, used: true } : pw);
        return { ...p, powers: [...newPowers, { ...stolenPower, used: false }] };
      }
      if (i === brMarauderTargetIdx) {
        return { ...p,
          powers: p.powers.map((pw, pi) => pi === opponentPowerIndex ? { ...pw, used: true } : pw),
          notifications: [...p.notifications, { power: 'Marauder', byName: currentPlayer.name }],
        };
      }
      return p;
    }));
    setBrMarauderPending(false);
    setBrMarauderTargetIdx(null);
    setBrMarauderPendingIndex(null);
  }

  function brCancelMarauder() {
    setBrMarauderPending(false);
    setBrMarauderTargetIdx(null);
    setBrMarauderPendingIndex(null);
  }

  function brFireParabolaScan() {
    if (brParabolaShotGridKey === null || brParabolaShotPresetIdx === null) return;
    const player = brPlayers[brCurrentIdx];
    const preset = PARABOLA_PRESETS[brParabolaShotPresetIdx];
    const gridLabels = { f: 'f(x)', df: "f′(x)", F: 'F(x)' };
    const hits = player.functions.map(({ fn, color }) => {
      const gFn = brParabolaShotGridKey === 'f' ? fn.f : brParabolaShotGridKey === 'df' ? fn.df : fn.F;
      return { color, points: findIntersectionPoints(gFn, preset.fn) };
    });
    const result = { gridLabel: gridLabels[brParabolaShotGridKey], gridKey: brParabolaShotGridKey,
      parabolaLabel: preset.label, hits, presetFn: preset.fn, presetIdx: brParabolaShotPresetIdx };
    setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx
      ? { ...p,
          powers: p.powers.map((pw, pi) => pi === brParabolaShotPendingIndex ? { ...pw, used: true } : pw),
          parabolaScanResults: [...p.parabolaScanResults, result] }
      : p));
    setBrParabolaShotPending(false);
    setBrParabolaShotPendingIndex(null);
    setBrParabolaShotGridKey(null);
    setBrParabolaShotPresetIdx(null);
  }

  function brFireSpiralScan() {
    if (brSpiralShotGridKey === null || brSpiralShotPresetIdx === null) return;
    const player = brPlayers[brCurrentIdx];
    const preset = SPIRAL_PRESETS[brSpiralShotPresetIdx];
    const gridLabels = { f: 'f(x)', df: "f′(x)", F: 'F(x)' };
    const hits = player.functions.map(({ fn, color }) => {
      const gFn = brSpiralShotGridKey === 'f' ? fn.f : brSpiralShotGridKey === 'df' ? fn.df : fn.F;
      return { color, points: findSpiralIntersectionPoints(gFn, preset.fn) };
    });
    const result = { gridLabel: gridLabels[brSpiralShotGridKey], gridKey: brSpiralShotGridKey,
      spiralLabel: preset.label, hits, presetFn: preset.fn, presetIdx: brSpiralShotPresetIdx };
    setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx
      ? { ...p,
          powers: p.powers.map((pw, pi) => pi === brSpiralShotPendingIndex ? { ...pw, used: true } : pw),
          spiralScanResults: [...p.spiralScanResults, result] }
      : p));
    setBrSpiralShotPending(false);
    setBrSpiralShotPendingIndex(null);
    setBrSpiralShotGridKey(null);
    setBrSpiralShotPresetIdx(null);
  }

  function brConfirmPartyPerry(guess) {
    if (guess === 7) {
      const newPowers = rollBrPowers(2, brDoubleRarityDefault);
      setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx
        ? { ...p,
            powers: [...p.powers.map((pw, pi) => pi === brPartyPerryPendingIndex ? { ...pw, used: true } : pw), ...newPowers] }
        : p));
      setBrPartyPerryNewPowers(newPowers);
    } else {
      setBrPlayers(prev => prev.map((p, i) => i === brCurrentIdx
        ? { ...p, powers: p.powers.map((pw, pi) => pi === brPartyPerryPendingIndex ? { ...pw, used: true } : pw) }
        : p));
      setBrPartyPerryNewPowers(null);
    }
  }

  function brClosePartyPerry() {
    setBrPartyPerryPending(false);
    setBrPartyPerryPendingIndex(null);
    setBrPartyPerryNewPowers(null);
  }

  // ── Solo game logic ──

  function fireShot(col, row) {
    if (won) return;
    const cell = grid[row][col];
    if (cell.shots[shotMode].fired) return;

    const hits = activeFunctions
      .filter(({ fn }) => doesFunctionPassThrough(fn[shotMode], col, row))
      .map(({ fn, color }) => ({ fnId: fn.id, color }));

    setGrid(prev => prev.map((r, ri) =>
      r.map((c, ci) => {
        if (ri !== row || ci !== col) return c;
        return { ...c, shots: { ...c.shots, [shotMode]: { fired: true, hits } } };
      })
    ));
  }

  function handleGuessById(id) {
    const alreadyGuessed = activeFunctions.find(af => af.fn.id === id && af.guessed);
    if (alreadyGuessed) { setMessage('Already found!'); return; }

    const match = activeFunctions.find(af => af.fn.id === id && !af.guessed);
    if (match) {
      const updated = activeFunctions.map(af => af.fn.id === id ? { ...af, guessed: true } : af);
      setActiveFunctions(updated);
      setMessage('');
      if (updated.every(af => af.guessed)) setWon(true);
    } else {
      setWrongGuessIds(prev => prev.includes(id) ? prev : [...prev, id]);
      setMessage('Not quite.');
    }
  }

  // ── 1v1 game logic ──

  function useMpPower(powerIndex) {
    const isP1 = mpCurrentPlayer === 1;
    const powers = isP1 ? p1Powers : p2Powers;
    const setPowers = isP1 ? setP1Powers : setP2Powers;
    const power = powers[powerIndex];
    if (!power || power.used) return;
    setMpPowerError('');

    if (power.id === 'trapCard') {
      setMpTrapCardPending(true);
      setMpTrapCardPendingIndex(powerIndex);
      setMpTrapCardGrid(null);
      return;
    }

    if (power.id === 'parabolaShot') {
      setMpParabolaShotPending(true);
      setMpParabolaShotPendingIndex(powerIndex);
      return;
    }

    if (power.id === 'spiralShot') {
      setMpSpiralShotPending(true);
      setMpSpiralShotPendingIndex(powerIndex);
      return;
    }

    if (power.id === 'heatCheck') {
      if (mpShotsFiredThisTurn > 0 || mpShotsAllowedThisTurn >= 2) return;
      setPowers(prev => prev.map((p, i) => i === powerIndex ? { ...p, used: true } : p));
      setMpHeatCheckActive(true);
      return;
    }

    if (power.id === 'bindingVow') {
      const currentDestroyedGrids = isP1 ? p1DestroyedGrids : p2DestroyedGrids;
      if (availableGrids(currentDestroyedGrids, true).length === 0) {
        setMpPowerError('Cannot activate — all grids would be restricted');
        return;
      }
      setMpPowerError('');
      setPowers(prev => prev.map((p, i) => i === powerIndex ? { ...p, used: true } : p));
      if (isP1) setP1BindingVowActive(true);
      else setP2BindingVowActive(true);
      setMpShotsAllowedThisTurn(2);
      if (mpShotMode === 'f') setMpShotMode('df');
      return;
    }

    if (power.id === 'partyPerry') {
      setMpPartyPerryPending(true);
      setMpPartyPerryPendingIndex(powerIndex);
      return;
    }

    if (power.id === 'omniscience') {
      setMpOmnisciencePending(true);
      setMpOmnisciencePendingIndex(powerIndex);
      setMpOmniscienceGrid(null);
      return;
    }

    if (power.id === 'omnipotence') {
      setMpOmnipotencePending(true);
      setMpOmnipotencePendingIndex(powerIndex);
      setMpOmnipotenceGrid(null);
      return;
    }

    if (power.id === 'marauder') {
      setMpMarauderPending(true);
      setMpMarauderPendingIndex(powerIndex);
      return;
    }

    if (power.id === 'fogOfWar') {
      const opponentFogTurns = isP1 ? p2FogOfWarTurns : p1FogOfWarTurns;
      if (opponentFogTurns > 0) {
        setMpPowerError('Cannot activate — Fog of War already active on opponent');
        return;
      }
      setPowers(prev => prev.map((p, i) => i === powerIndex ? { ...p, used: true } : p));
      if (isP1) setP2FogOfWarTurns(prev => prev + 3);
      else setP1FogOfWarTurns(prev => prev + 3);
      return;
    }

    if (power.id === 'reload' && mpHeatCheckActive && !mpHeatCheckMissed && mpShotsFiredThisTurn < 3) return;

    setPowers(prev => prev.map((p, i) => i === powerIndex ? { ...p, used: true } : p));
    if (power.id === 'reload') {
      setMpShotsAllowedThisTurn(prev => prev + 1);
    }
  }

  function confirmPartyPerry(guess) {
    const isP1 = mpCurrentPlayer === 1;
    const setPowers = isP1 ? setP1Powers : setP2Powers;
    setPowers(prev => prev.map((p, i) => i === mpPartyPerryPendingIndex ? { ...p, used: true } : p));
    if (guess === 7) {
      const useDoubled = mpDoubleRarityDefault || mpCurrentRound === 3;
      const bonus = rollPowers(2, useDoubled);
      setPowers(prev => [...prev, ...bonus]);
      setMpPartyPerryNewPowers(bonus);
    }
  }

  function closePartyPerry() {
    setMpPartyPerryPending(false);
    setMpPartyPerryPendingIndex(null);
    setMpPartyPerryNewPowers(null);
  }

  function activateOmniscience(gridKey) {
    const isP1 = mpCurrentPlayer === 1;
    const setPowers = isP1 ? setP1Powers : setP2Powers;
    setPowers(prev => prev.map((p, i) => i === mpOmnisciencePendingIndex ? { ...p, used: true } : p));
    setMpOmnisciencePending(false);
    setMpOmnisciencePendingIndex(null);
    setMpOmniscienceActive(true);
    setMpOmniscienceGrid(gridKey);
  }

  function cancelOmniscience() {
    setMpOmnisciencePending(false);
    setMpOmnisciencePendingIndex(null);
    setMpOmniscienceGrid(null);
  }

  function closeOmniscience() {
    setMpOmniscienceActive(false);
    setMpOmniscienceGrid(null);
  }

  function activateOmnipotence(gridKey) {
    const isP1 = mpCurrentPlayer === 1;
    const oppDestroyedGrids = isP1 ? p2DestroyedGrids : p1DestroyedGrids;
    const oppBindingVow = isP1 ? p2BindingVowActive : p1BindingVowActive;
    if (availableGrids([...oppDestroyedGrids, gridKey], oppBindingVow).length === 0) {
      setMpPowerError('Cannot activate — all grids would be restricted');
      return;
    }
    setMpPowerError('');
    const setPowers = isP1 ? setP1Powers : setP2Powers;
    const setOpponentDestroyedGrids = isP1 ? setP2DestroyedGrids : setP1DestroyedGrids;
    setPowers(prev => prev.map((p, i) => i === mpOmnipotencePendingIndex ? { ...p, used: true } : p));
    setOpponentDestroyedGrids(prev => prev.includes(gridKey) ? prev : [...prev, gridKey]);
    setMpOmnipotencePending(false);
    setMpOmnipotencePendingIndex(null);
    setMpOmnipotenceGrid(null);
  }

  function cancelOmnipotence() {
    setMpOmnipotencePending(false);
    setMpOmnipotencePendingIndex(null);
    setMpOmnipotenceGrid(null);
  }

  function confirmMarauder(opponentPowerIndex) {
    const isP1 = mpCurrentPlayer === 1;
    const setPowers = isP1 ? setP1Powers : setP2Powers;
    const setOpponentPowers = isP1 ? setP2Powers : setP1Powers;
    const opponentPowers = isP1 ? p2Powers : p1Powers;
    const stolen = opponentPowers[opponentPowerIndex];
    if (!stolen) return;
    setMpPowerError('');
    // Mark marauder as used
    setPowers(prev => prev.map((p, i) => i === mpMarauderPendingIndex ? { ...p, used: true } : p));
    // Mark opponent's power as used (if not already)
    if (!stolen.used) {
      setOpponentPowers(prev => prev.map((p, i) => i === opponentPowerIndex ? { ...p, used: true } : p));
    }
    // Give current player a fresh copy of the stolen power
    setPowers(prev => [...prev, { ...stolen, used: false }]);
    setMpMarauderPending(false);
    setMpMarauderPendingIndex(null);
  }

  function cancelMarauder() {
    setMpMarauderPending(false);
    setMpMarauderPendingIndex(null);
  }

  function confirmTrapCard(grid, col, row) {
    const isP1 = mpCurrentPlayer === 1;
    const setPowers = isP1 ? setP1Powers : setP2Powers;
    const setTrapCard = isP1 ? setP1TrapCard : setP2TrapCard;
    setPowers(prev => prev.map((p, i) => i === mpTrapCardPendingIndex ? { ...p, used: true } : p));
    setTrapCard({ grid, col, row, triggered: false });
    setMpTrapCardPending(false);
    setMpTrapCardPendingIndex(null);
    setMpTrapCardGrid(null);
  }

  function cancelTrapCard() {
    setMpTrapCardPending(false);
    setMpTrapCardPendingIndex(null);
    setMpTrapCardGrid(null);
  }

  function fireParabolaScan() {
    if (mpParabolaShotGridKey === null || mpParabolaShotPresetIdx === null) return;
    const isP1 = mpCurrentPlayer === 1;
    const setPowers = isP1 ? setP1Powers : setP2Powers;
    const targetSlot = isP1 ? p2Slot : p1Slot;
    const preset = PARABOLA_PRESETS[mpParabolaShotPresetIdx];
    const hits = targetSlot.functions.map(({ fn, color }) => {
      const gFn = mpParabolaShotGridKey === 'f' ? fn.f : mpParabolaShotGridKey === 'df' ? fn.df : fn.F;
      return { color, points: findIntersectionPoints(gFn, preset.fn) };
    });
    const gridLabels = { f: 'f(x)', df: "f′(x)", F: 'F(x)' };
    const result = { gridLabel: gridLabels[mpParabolaShotGridKey], gridKey: mpParabolaShotGridKey, parabolaLabel: preset.label, hits, presetFn: preset.fn, presetIdx: mpParabolaShotPresetIdx };
    if (isP1) setP1ParabolaScanResults(prev => [...prev, result]);
    else setP2ParabolaScanResults(prev => [...prev, result]);
    // Mark the power consumed only now that the scan actually fired
    setPowers(prev => prev.map((p, i) => i === mpParabolaShotPendingIndex ? { ...p, used: true } : p));
    setMpParabolaShotPending(false);
    setMpParabolaShotPendingIndex(null);
    setMpParabolaShotGridKey(null);
    setMpParabolaShotPresetIdx(null);
  }

  function fireSpiralScan() {
    if (mpSpiralShotGridKey === null || mpSpiralShotPresetIdx === null) return;
    const isP1 = mpCurrentPlayer === 1;
    const setPowers = isP1 ? setP1Powers : setP2Powers;
    const targetSlot = isP1 ? p2Slot : p1Slot;
    const preset = SPIRAL_PRESETS[mpSpiralShotPresetIdx];
    const hits = targetSlot.functions.map(({ fn, color }) => {
      const gFn = mpSpiralShotGridKey === 'f' ? fn.f : mpSpiralShotGridKey === 'df' ? fn.df : fn.F;
      return { color, points: findSpiralIntersectionPoints(gFn, preset.fn) };
    });
    const gridLabels = { f: 'f(x)', df: "f′(x)", F: 'F(x)' };
    const result = { gridLabel: gridLabels[mpSpiralShotGridKey], gridKey: mpSpiralShotGridKey, spiralLabel: preset.label, hits, presetFn: preset.fn, presetIdx: mpSpiralShotPresetIdx };
    if (isP1) setP1SpiralScanResults(prev => [...prev, result]);
    else setP2SpiralScanResults(prev => [...prev, result]);
    setPowers(prev => prev.map((p, i) => i === mpSpiralShotPendingIndex ? { ...p, used: true } : p));
    setMpSpiralShotPending(false);
    setMpSpiralShotPendingIndex(null);
    setMpSpiralShotGridKey(null);
    setMpSpiralShotPresetIdx(null);
  }

  function mpFireShot(col, row) {
    if (mpWinner || mpShotsFiredThisTurn >= mpShotsAllowedThisTurn) return;
    const isP1 = mpCurrentPlayer === 1;
    const currentDestroyedGrids = isP1 ? p1DestroyedGrids : p2DestroyedGrids;
    const currentBindingVowActive = isP1 ? p1BindingVowActive : p2BindingVowActive;

    // Fog of War: pick a random available grid per shot; otherwise use selected mode
    let actualShotMode;
    if (mpFogOfWarThisTurn) {
      const grids = availableGrids(currentDestroyedGrids, currentBindingVowActive);
      actualShotMode = grids[Math.floor(Math.random() * grids.length)];
    } else {
      if (currentDestroyedGrids.includes(mpShotMode)) return;
      actualShotMode = mpShotMode;
    }

    const targetSlot = isP1 ? p2Slot : p1Slot;
    const setTargetSlot = isP1 ? setP2Slot : setP1Slot;

    // If cell already fired in the chosen grid: normal = skip; fog = wasted shot
    if (targetSlot.grid[row][col].shots[actualShotMode].fired) {
      if (!mpFogOfWarThisTurn) return;
      const newShotCount = mpShotsFiredThisTurn + 1;
      setMpShotsFiredThisTurn(newShotCount);
      if (mpHeatCheckActive) setMpHeatCheckMissed(true);
      return;
    }

    const hits = targetSlot.functions
      .filter(({ fn }) => doesFunctionPassThrough(fn[actualShotMode], col, row))
      .map(({ fn, color }) => ({ fnId: fn.id, color }));

    const newGrid = targetSlot.grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri !== row || ci !== col) return c;
        return { ...c, shots: { ...c.shots, [actualShotMode]: { fired: true, hits } } };
      })
    );

    setTargetSlot({ ...targetSlot, grid: newGrid });

    // Check if this shot hits the opponent's trap card
    const opponentTrap = isP1 ? p2TrapCard : p1TrapCard;
    const setOpponentTrap = isP1 ? setP2TrapCard : setP1TrapCard;
    if (
      opponentTrap &&
      !opponentTrap.triggered &&
      opponentTrap.grid === actualShotMode &&
      opponentTrap.col === col &&
      opponentTrap.row === row
    ) {
      setOpponentTrap(prev => ({ ...prev, triggered: true }));
      // Decrement fog turns for the current player since their turn is ending early
      if (mpFogOfWarThisTurn) {
        if (isP1) setP1FogOfWarTurns(prev => Math.max(0, prev - 1));
        else setP2FogOfWarTurns(prev => Math.max(0, prev - 1));
      }
      // End current player's turn immediately; trap owner gets 2 bonus turns
      const trapOwner = isP1 ? 2 : 1;
      setMpShotsFiredThisTurn(0);
      setMpShotsAllowedThisTurn(1);
      setMpShotMode('f');
      setMpMessage('');
      setMpParabolaShotPending(false);
      setMpParabolaShotPendingIndex(null);
      setMpParabolaShotGridKey(null);
      setMpParabolaShotPresetIdx(null);
      setMpSpiralShotPending(false);
      setMpSpiralShotPendingIndex(null);
      setMpSpiralShotGridKey(null);
      setMpSpiralShotPresetIdx(null);
      setMpTrapCardPending(false);
      setMpTrapCardPendingIndex(null);
      setMpTrapCardGrid(null);
      setMpHeatCheckActive(false);
      setMpHeatCheckMissed(false);
      setMpFogOfWarThisTurn(false);
      setMpTrapTriggered(true);
      setMpBonusTurnsRemaining(1);
      setMpPassTo(trapOwner);
      setMpNextPassIsBonusTurn(false);
      setPhase('pass');
      return;
    }

    const newShotCount = mpShotsFiredThisTurn + 1;
    setMpShotsFiredThisTurn(newShotCount);

    if (mpHeatCheckActive) {
      if (hits.length === 0) {
        setMpHeatCheckMissed(true);
      } else if (newShotCount < 3) {
        setMpShotsAllowedThisTurn(prev => prev + 1);
      }
    }
  }

  function endMpTurn(wrongGuess = false, glitchTriggered = false) {
    const nextPlayer = mpCurrentPlayer === 1 ? 2 : 1;
    // Decrement fog turns for current player if this was a fog turn
    if (mpFogOfWarThisTurn) {
      if (mpCurrentPlayer === 1) setP1FogOfWarTurns(prev => Math.max(0, prev - 1));
      else setP2FogOfWarTurns(prev => Math.max(0, prev - 1));
    }
    setMpShotsFiredThisTurn(0);
    setMpShotsAllowedThisTurn(1);
    setMpShotMode('f');
    setMpMessage('');
    setMpParabolaShotPending(false);
    setMpParabolaShotPendingIndex(null);
    setMpParabolaShotGridKey(null);
    setMpParabolaShotPresetIdx(null);
    setMpSpiralShotPending(false);
    setMpSpiralShotPendingIndex(null);
    setMpSpiralShotGridKey(null);
    setMpSpiralShotPresetIdx(null);
    setMpTrapCardPending(false);
    setMpTrapCardPendingIndex(null);
    setMpTrapCardGrid(null);
    setMpHeatCheckActive(false);
    setMpHeatCheckMissed(false);
    setMpPartyPerryPending(false);
    setMpPartyPerryPendingIndex(null);
    setMpPartyPerryNewPowers(null);
    setMpOmnisciencePending(false);
    setMpOmnisciencePendingIndex(null);
    setMpOmniscienceActive(false);
    setMpOmniscienceGrid(null);
    setMpOmnipotencePending(false);
    setMpOmnipotencePendingIndex(null);
    setMpOmnipotenceGrid(null);
    setMpMarauderPending(false);
    setMpMarauderPendingIndex(null);
    setMpPowerError('');
    setMpFogOfWarThisTurn(false);

    if (wrongGuess && glitchTriggered) {
      // glitch takes priority — steal 2 turns regardless of whether we were already in a bonus run
      setMpBonusTurnsRemaining(1);
      setMpPassTo(mpCurrentPlayer);
      setMpNextPassIsBonusTurn(true);
      setMpGlitchBonusActive(true);
      setMpGlitchTriggered(true);
    } else if (wrongGuess && mpBonusTurnsRemaining > 0) {
      // bonus cancels (wrong guess during a bonus run, no glitch)
      setMpBonusTurnsRemaining(0);
      setMpPassTo(nextPlayer);
      setMpNextPassIsBonusTurn(false);
      setMpGlitchBonusActive(false);
      setMpGlitchTriggered(false);
    } else if (wrongGuess) {
      setMpBonusTurnsRemaining(1);
      setMpPassTo(nextPlayer);
      setMpNextPassIsBonusTurn(true);
      setMpGlitchBonusActive(false);
      setMpGlitchTriggered(false);
    } else if (mpBonusTurnsRemaining > 0) {
      setMpBonusTurnsRemaining(prev => prev - 1);
      setMpPassTo(mpCurrentPlayer);
      setMpNextPassIsBonusTurn(true);
    } else {
      setMpPassTo(nextPlayer);
      setMpNextPassIsBonusTurn(false);
      setMpGlitchBonusActive(false);
      setMpGlitchTriggered(false);
    }
    setPhase('pass');
  }

  function handlePassContinue() {
    const nextPlayer = mpPassTo;
    const nextBindingVow = nextPlayer === 1 ? p1BindingVowActive : p2BindingVowActive;
    const nextDestroyedGrids = nextPlayer === 1 ? p1DestroyedGrids : p2DestroyedGrids;
    if (nextBindingVow) {
      setMpShotsAllowedThisTurn(2);
      setMpShotMode('df');
    } else if (nextDestroyedGrids.includes('f')) {
      const firstAvailable = ['f', 'df', 'F'].find(m => !nextDestroyedGrids.includes(m));
      if (firstAvailable) setMpShotMode(firstAvailable);
    }
    // Fog of War: grid randomized per shot inside mpFireShot; just flag the turn here
    const nextFogTurns = nextPlayer === 1 ? p1FogOfWarTurns : p2FogOfWarTurns;
    setMpFogOfWarThisTurn(nextFogTurns > 0);
    setMpCurrentPlayer(nextPlayer);
    setMpPassTo(null);
    setMpNextPassIsBonusTurn(false);
    setMpTrapTriggered(false);
    setMpGlitchTriggered(false);
    setPhase('mp');
  }

  function mpHandleGuessById(id) {
    const isP1 = mpCurrentPlayer === 1;
    const targetSlot = isP1 ? p2Slot : p1Slot;
    const identified = isP1 ? mpP1Identified : mpP2Identified;
    const setIdentified = isP1 ? setMpP1Identified : setMpP2Identified;
    const setWrongGuesses = isP1 ? setMpP1WrongGuesses : setMpP2WrongGuesses;

    if (identified.includes(id)) { setMpMessage('Already found!'); return; }

    const match = targetSlot.functions.find(({ fn }) => fn.id === id);
    if (match) {
      const newIdentified = [...identified, id];
      setIdentified(newIdentified);
      setMpMessage('');

      // Bonus power: auto-trigger on correct guess → +2 shots
      const currentPowers = isP1 ? p1Powers : p2Powers;
      const setPowers = isP1 ? setP1Powers : setP2Powers;
      const bonusIdx = currentPowers.findIndex(p => p.id === 'bonus' && !p.used);
      if (bonusIdx !== -1) {
        setPowers(prev => prev.map((p, i) => i === bonusIdx ? { ...p, used: true } : p));
        setMpShotsAllowedThisTurn(prev => prev + 2);
      }

      if (newIdentified.length === targetSlot.functions.length) {
        const roundWinner = isP1 ? 1 : 2;
        const newP1Wins = roundWinner === 1 ? mpP1RoundWins + 1 : mpP1RoundWins;
        const newP2Wins = roundWinner === 2 ? mpP2RoundWins + 1 : mpP2RoundWins;
        setMpP1RoundWins(newP1Wins);
        setMpP2RoundWins(newP2Wins);
        setMpWinner(roundWinner);

        if (roundType === 'normal') {
          if (newP1Wins >= 2 || newP2Wins >= 2) {
            setMpMatchWinner(roundWinner);
          }
          // else: show round-end screen (handled in render)
        }
      }
    } else {
      setWrongGuesses(prev => prev.includes(id) ? prev : [...prev, id]);
      // Glitch power: auto-triggers on wrong guess — steal the opponent's bonus turns
      const currentPowers = isP1 ? p1Powers : p2Powers;
      const setPowers = isP1 ? setP1Powers : setP2Powers;
      const glitchIdx = currentPowers.findIndex(p => p.id === 'glitch' && !p.used);
      if (glitchIdx !== -1) {
        setPowers(prev => prev.map((p, i) => i === glitchIdx ? { ...p, used: true } : p));
        endMpTurn(true, true);
      } else {
        endMpTurn(true);
      }
    }
  }

  function startNextRound() {
    const newRound = mpCurrentRound + 1;
    setMpCurrentRound(newRound);

    // Round 2+: both players start fresh with 1 power; coin flip gives the winner 1 extra
    // Round 3 (or if double rarity default is on): doubled rarity odds
    const useDoubled = mpDoubleRarityDefault || newRound === 3;
    let newP1Powers = rollPowers(1, useDoubled);
    let newP2Powers = rollPowers(1, useDoubled);
    const coinWinner = Math.random() < 0.5 ? 1 : 2;
    if (coinWinner === 1) newP1Powers = [...newP1Powers, ...rollPowers(1, useDoubled)];
    else newP2Powers = [...newP2Powers, ...rollPowers(1, useDoubled)];
    setP1Powers(newP1Powers);
    setP2Powers(newP2Powers);
    setMpCoinFlipWinner(coinWinner);

    setP1Slot({ functions: selectFunctions(difficulty), grid: initGrid() });
    setP2Slot({ functions: selectFunctions(difficulty), grid: initGrid() });
    setMpP1Identified([]);
    setMpP2Identified([]);
    setMpCurrentPlayer(1);
    setMpPassTo(null);
    setMpShotMode('f');
    setMpMessage('');
    setMpWinner(null);
    setMpShotsFiredThisTurn(0);
    setMpShotsAllowedThisTurn(1);
    setMpBonusTurnsRemaining(0);
    setMpNextPassIsBonusTurn(false);
    setMpP1WrongGuesses([]);
    setMpP2WrongGuesses([]);
    setP1ParabolaScanResults([]);
    setP2ParabolaScanResults([]);
    setMpParabolaShotPending(false);
    setMpParabolaShotPendingIndex(null);
    setMpParabolaShotGridKey(null);
    setMpParabolaShotPresetIdx(null);
    setP1SpiralScanResults([]);
    setP2SpiralScanResults([]);
    setMpSpiralShotPending(false);
    setMpSpiralShotPendingIndex(null);
    setMpSpiralShotGridKey(null);
    setMpSpiralShotPresetIdx(null);
    setMpTrapCardPending(false);
    setMpTrapCardPendingIndex(null);
    setMpTrapCardGrid(null);
    setP1TrapCard(null);
    setP2TrapCard(null);
    setMpTrapTriggered(false);
    setMpHeatCheckActive(false);
    setMpHeatCheckMissed(false);
    setP1BindingVowActive(false);
    setP2BindingVowActive(false);
    setMpGlitchBonusActive(false);
    setMpGlitchTriggered(false);
    setMpPartyPerryPending(false);
    setMpPartyPerryPendingIndex(null);
    setMpPartyPerryNewPowers(null);
    setMpOmnisciencePending(false);
    setMpOmnisciencePendingIndex(null);
    setMpOmniscienceActive(false);
    setMpOmniscienceGrid(null);
    setMpOmnipotencePending(false);
    setMpOmnipotencePendingIndex(null);
    setMpOmnipotenceGrid(null);
    setMpMarauderPending(false);
    setMpMarauderPendingIndex(null);
    setP1DestroyedGrids([]);
    setP2DestroyedGrids([]);
    setP1FogOfWarTurns(0);
    setP2FogOfWarTurns(0);
    setMpFogOfWarThisTurn(false);
    setPhase('power-draw');
  }

  // ─────────────────────────────────────────────────────────────
  // Routing
  // ─────────────────────────────────────────────────────────────

  if (phase === 'difficulty') return (
    <>
      <DifficultyScreen
        onSelect={handleDifficultySelect}
        onHelp={() => setShowHelp(true)}
        onPowerTest={() => { setDifficulty('easy'); setGameMode('powertest'); setPhase('power-test-setup'); }}
      />
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  );

  if (phase === 'mode') {
    return (
      <ModeSelectScreen
        difficulty={difficulty}
        onSelect={handleModeSelect}
        onBack={() => setPhase('difficulty')}
      />
    );
  }

  if (phase === 'roundtype') {
    return (
      <RoundTypeScreen
        difficulty={difficulty}
        onSelect={handleRoundTypeSelect}
        onBack={() => setPhase('mode')}
      />
    );
  }

  if (phase === 'power-test-setup') {
    return (
      <PowerTestSetupScreen
        difficulty={difficulty || 'easy'}
        onStart={startPowerTestGame}
        onBack={() => setPhase('difficulty')}
      />
    );
  }

  if (phase === 'pass') {
    return <PassScreen toPlayer={mpPassTo} bonusTurn={mpNextPassIsBonusTurn} trapTriggered={mpTrapTriggered} glitchTriggered={mpGlitchTriggered} onContinue={handlePassContinue} />;
  }

  if (phase === 'power-draw') {
    return (
      <PowerDrawScreen
        round={mpCurrentRound}
        roundType={roundType}
        p1Powers={p1Powers}
        p2Powers={p2Powers}
        coinFlipWinner={mpCoinFlipWinner}
        onBegin={() => setPhase('mp')}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Solo game view
  // ─────────────────────────────────────────────────────────────

  const shotModes = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];

  if (phase === 'solo') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#e0e0e0',
        fontFamily: "'Courier New', Courier, monospace",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
      }}>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        <button
          onClick={() => setShowHelp(true)}
          style={{
            position: 'fixed', top: 14, right: 14, zIndex: 50,
            background: '#0d0d1a', border: '1px solid #2a2a4a',
            borderRadius: 20, color: '#445', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            padding: '5px 13px', letterSpacing: '0.1em',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00ff88'; e.currentTarget.style.borderColor = '#00ff8844'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#445'; e.currentTarget.style.borderColor = '#2a2a4a'; }}
        >? HELP</button>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{
            fontSize: 28,
            letterSpacing: '0.2em',
            color: '#00ff88',
            textShadow: '0 0 16px #00ff88aa',
            margin: 0,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}>
            Function Battleship
          </h1>
          <div style={{ fontSize: 11, color: '#557', marginTop: 4, letterSpacing: '0.1em' }}>
            SOLO · <span style={{ color: '#00ff88' }}>{DIFFICULTY[difficulty].label.toUpperCase()}</span>
            {' · '}IDENTIFY ALL HIDDEN FUNCTIONS
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          <Panel title="FIRE GRID">
            <FireGrid grid={grid} shotMode={shotMode} onFire={fireShot} disabled={won} />
          </Panel>
          {shotModes.map(({ key, label }) => (
            <Panel key={key} title={label} accent={shotMode === key ? '#00ff88' : undefined}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 50px)', gap: 2 }}>
                {grid.map((rowArr, ri) =>
                  rowArr.map((cell, ci) => (
                    <GraphCell key={`${ri}-${ci}`} shotType={key} col={ci} row={ri} cellShots={cell.shots} activeFunctions={activeFunctions} />
                  ))
                )}
              </div>
            </Panel>
          ))}
        </div>

        <ShotModeButtons shotMode={shotMode} onChange={setShotMode} />

        {!won ? (
          <FunctionBankPanel
            difficulty={difficulty}
            onGuess={handleGuessById}
            identifiedIds={activeFunctions.filter(af => af.guessed).map(af => af.fn.id)}
            wrongGuessIds={wrongGuessIds}
            message={message}
            activeFunctions={activeFunctions}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 20,
              color: '#00ff88',
              textShadow: '0 0 20px #00ff88',
              fontWeight: 900,
              letterSpacing: '0.15em',
              marginBottom: 8,
            }}>
              TARGET{activeFunctions.length > 1 ? 'S' : ''} IDENTIFIED
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              {activeFunctions.map(({ fn, color }) => (
                <span key={fn.id} style={{ color, fontSize: 16, fontWeight: 700, textShadow: `0 0 8px ${color}` }}>
                  {fn.label}
                </span>
              ))}
            </div>
            <button
              onClick={goHome}
              style={{
                padding: '10px 28px',
                background: '#001a0d',
                border: '2px solid #00ff88',
                borderRadius: 6,
                color: '#00ff88',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 14px #00ff8855',
              }}
            >
              NEW MISSION
            </button>
          </div>
        )}

        <div style={{ marginTop: 28, fontSize: 11, color: '#445', display: 'flex', gap: 20, letterSpacing: '0.05em' }}>
          <span><span style={{ color: '#00ff88' }}>●</span> HIT</span>
          <span><span style={{ color: '#ff4444' }}>×</span> MISS</span>
          <span style={{ color: '#336' }}>Click grid cell to fire · identify all functions to win</span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 1v1 game view
  // ─────────────────────────────────────────────────────────────

  if (phase === 'mp') {
    const isP1 = mpCurrentPlayer === 1;
    const targetSlot = isP1 ? p2Slot : p1Slot;
    const identified = isP1 ? mpP1Identified : mpP2Identified;
    const enemyLabel = isP1 ? 'PLAYER 2' : 'PLAYER 1';
    const diffLabel = DIFFICULTY[difficulty].label;
    const currentBindingVowActive = isP1 ? p1BindingVowActive : p2BindingVowActive;
    const currentDestroyedGrids = isP1 ? p1DestroyedGrids : p2DestroyedGrids;
    const opponentDestroyedGrids = isP1 ? p2DestroyedGrids : p1DestroyedGrids;
    const gridLabelsMap = { f: 'f(x)', df: "f′(x)", F: 'F(x)' };

    // ── Round/Match win screen ──
    if (mpWinner !== null) {
      const isMatchOver = roundType === 'lightning' || mpMatchWinner !== null;
      const winnerFunctions = mpWinner === 1 ? p2Slot.functions : p1Slot.functions;
      const loserFunctions  = mpWinner === 1 ? p1Slot.functions : p2Slot.functions;

      if (isMatchOver) {
        // Lightning or best-of-3 champion
        const matchLabel = roundType === 'normal' ? 'MATCH WINNER' : 'WINNER';
        const seriesLabel = roundType === 'normal'
          ? `Series: P1 ${mpP1RoundWins} – ${mpP2RoundWins} P2`
          : null;
        return (
          <div style={{ ...centeredPageStyle(), padding: '24px 16px' }}>
            <div style={{ fontSize: 13, letterSpacing: '0.2em', color: '#557', textTransform: 'uppercase' }}>
              {matchLabel}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '0.15em', color: '#00ff88', textShadow: '0 0 32px #00ff88aa' }}>
              PLAYER {mpWinner} WINS
            </div>
            {seriesLabel && (
              <div style={{ fontSize: 12, color: '#557', letterSpacing: '0.12em' }}>{seriesLabel}</div>
            )}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#445', letterSpacing: '0.15em', marginBottom: 6 }}>ENEMY FUNCTIONS WERE</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {winnerFunctions.map(({ fn, color }) => (
                  <span key={fn.id} style={{ color, fontSize: 15, fontWeight: 700, textShadow: `0 0 8px ${color}` }}>{fn.label}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <div style={{ fontSize: 11, color: '#445', letterSpacing: '0.15em', marginBottom: 6 }}>YOUR FUNCTIONS WERE</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {loserFunctions.map(({ fn }) => (
                  <span key={fn.id} style={{ color: '#557', fontSize: 15, fontWeight: 700 }}>{fn.label}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {gameMode === 'powertest' && (
                <button
                  onClick={() => setPhase('power-test-setup')}
                  style={{
                    padding: '12px 28px',
                    background: '#0a0a2a',
                    border: '2px solid #66b3ff',
                    borderRadius: 6,
                    color: '#66b3ff',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 14px #66b3ff33',
                  }}
                >
                  TEST AGAIN →
                </button>
              )}
              <button
                onClick={goHome}
                style={{
                  padding: '12px 32px',
                  background: '#001a0d',
                  border: '2px solid #00ff88',
                  borderRadius: 6,
                  color: '#00ff88',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 14px #00ff8855',
                }}
              >
                NEW MISSION
              </button>
            </div>
          </div>
        );
      }

      // Normal mode, round over but match continues
      return (
        <div style={{ ...centeredPageStyle(), padding: '24px 16px' }}>
          <div style={{ fontSize: 13, letterSpacing: '0.2em', color: '#557', textTransform: 'uppercase' }}>
            ROUND {mpCurrentRound} COMPLETE
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '0.15em', color: '#00ff88', textShadow: '0 0 32px #00ff88aa' }}>
            PLAYER {mpWinner} WINS
          </div>
          <div style={{
            display: 'flex',
            gap: 32,
            alignItems: 'center',
            background: '#0d0d1a',
            border: '1px solid #1e1e3a',
            borderRadius: 8,
            padding: '16px 32px',
            marginTop: 8,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#557', letterSpacing: '0.1em', marginBottom: 4 }}>PLAYER 1</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: mpP1RoundWins > mpP2RoundWins ? '#00ff88' : '#e0e0e0', textShadow: mpP1RoundWins > mpP2RoundWins ? '0 0 20px #00ff88' : 'none' }}>
                {mpP1RoundWins}
              </div>
            </div>
            <div style={{ fontSize: 20, color: '#334' }}>–</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#557', letterSpacing: '0.1em', marginBottom: 4 }}>PLAYER 2</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: mpP2RoundWins > mpP1RoundWins ? '#00ff88' : '#e0e0e0', textShadow: mpP2RoundWins > mpP1RoundWins ? '0 0 20px #00ff88' : 'none' }}>
                {mpP2RoundWins}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#445', letterSpacing: '0.1em' }}>
            First to 2 wins takes the match
          </div>
          <button
            onClick={startNextRound}
            style={{
              marginTop: 8,
              padding: '14px 48px',
              background: '#001a0d',
              border: '2px solid #00ff88',
              borderRadius: 8,
              color: '#00ff88',
              fontFamily: 'inherit',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.12em',
              boxShadow: '0 0 24px #00ff8844',
            }}
          >
            START ROUND {mpCurrentRound + 1} →
          </button>
        </div>
      );
    }

    // ── Active turn ──
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#e0e0e0',
        fontFamily: "'Courier New', Courier, monospace",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
      }}>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        <button
          onClick={() => setShowHelp(true)}
          style={{
            position: 'fixed', top: 14, right: 14, zIndex: 50,
            background: '#0d0d1a', border: '1px solid #2a2a4a',
            borderRadius: 20, color: '#445', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            padding: '5px 13px', letterSpacing: '0.1em',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00ff88'; e.currentTarget.style.borderColor = '#00ff8844'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#445'; e.currentTarget.style.borderColor = '#2a2a4a'; }}
        >? HELP</button>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{
            fontSize: 28,
            letterSpacing: '0.2em',
            color: '#00ff88',
            textShadow: '0 0 16px #00ff88aa',
            margin: 0,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}>
            Function Battleship
          </h1>
          <div style={{ fontSize: 11, color: '#557', marginTop: 4, letterSpacing: '0.1em' }}>
            1v1 · <span style={{ color: '#00ff88' }}>{diffLabel.toUpperCase()}</span>
            {roundType === 'normal' && (
              <span style={{ color: '#557' }}> · Round {mpCurrentRound} · P1 {mpP1RoundWins}–{mpP2RoundWins} P2</span>
            )}
            {' · '}
            <span style={{ color: mpBonusTurnsRemaining > 0 ? '#ffd700' : '#66b3ff', fontWeight: 700 }}>
              PLAYER {mpCurrentPlayer}'S TURN{mpBonusTurnsRemaining > 0 ? ' ★ BONUS' : ''}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#334', marginTop: 4, letterSpacing: '0.08em' }}>
            FIRING AT {enemyLabel}'S GRID · GUESS THEIR FUNCTIONS TO WIN
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          <Panel title={`${enemyLabel}'S GRID`}>
            <FireGrid grid={targetSlot.grid} shotMode={mpShotMode} onFire={mpFireShot} disabled={false} fogActive={mpFogOfWarThisTurn} />
          </Panel>
          {shotModes.map(({ key, label }) => (
            <Panel key={key} title={label} accent={!mpFogOfWarThisTurn && mpShotMode === key ? '#00ff88' : undefined}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 50px)', gap: 2 }}>
                {targetSlot.grid.map((rowArr, ri) =>
                  rowArr.map((cell, ci) => (
                    <GraphCell key={`${ri}-${ci}`} shotType={key} col={ci} row={ri} cellShots={cell.shots} activeFunctions={targetSlot.functions} />
                  ))
                )}
              </div>
            </Panel>
          ))}
        </div>

        {!mpFogOfWarThisTurn && (
          <ShotModeButtons shotMode={mpShotMode} onChange={setMpShotMode} disabledModes={currentBindingVowActive ? ['f'] : []} destroyedModes={currentDestroyedGrids} />
        )}

        {(p1FogOfWarTurns > 0 || p2FogOfWarTurns > 0) && (
          <div style={{
            marginBottom: 8,
            fontSize: 11,
            color: '#8899cc',
            letterSpacing: '0.1em',
            padding: '6px 12px',
            background: '#08080f',
            border: '1px solid #8899cc44',
            borderRadius: 4,
            width: '100%',
            maxWidth: 560,
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <span>🌫 FOG OF WAR</span>
            {p1FogOfWarTurns > 0 && <span>P1: {p1FogOfWarTurns} turn{p1FogOfWarTurns !== 1 ? 's' : ''} remaining</span>}
            {p2FogOfWarTurns > 0 && <span>P2: {p2FogOfWarTurns} turn{p2FogOfWarTurns !== 1 ? 's' : ''} remaining</span>}
          </div>
        )}
        {mpFogOfWarThisTurn && (
          <div style={{
            marginBottom: 8,
            fontSize: 11,
            color: '#8899cc',
            letterSpacing: '0.1em',
            padding: '6px 12px',
            background: '#08080f',
            border: '1px solid #8899cc44',
            borderRadius: 4,
            width: '100%',
            maxWidth: 560,
          }}>
            🌫 FOG OF WAR ACTIVE · grid hidden — firing in a random grid this turn
          </div>
        )}

        {currentBindingVowActive && (
          <div style={{
            marginBottom: 8,
            fontSize: 11,
            color: '#a855f7',
            letterSpacing: '0.1em',
            padding: '6px 12px',
            background: '#0d0814',
            border: '1px solid #a855f733',
            borderRadius: 4,
            width: '100%',
            maxWidth: 560,
          }}>
            ⛓ BINDING VOW ACTIVE · f(x) locked · 2 shots per turn
          </div>
        )}

        {mpGlitchBonusActive && (
          <div style={{
            marginBottom: 8,
            fontSize: 11,
            color: '#00e5ff',
            letterSpacing: '0.1em',
            padding: '6px 12px',
            background: '#00101a',
            border: '1px solid #00e5ff33',
            borderRadius: 4,
            width: '100%',
            maxWidth: 560,
          }}>
            ⚡ GLITCH PASSIVE ACTIVATED · bonus turns redirected to you
          </div>
        )}

        {currentDestroyedGrids.length > 0 && (
          <div style={{
            marginBottom: 8,
            fontSize: 11,
            color: '#ff4444',
            letterSpacing: '0.1em',
            padding: '6px 12px',
            background: '#1a0505',
            border: '1px solid #ff444433',
            borderRadius: 4,
            width: '100%',
            maxWidth: 560,
          }}>
            ☠ GRID DESTROYED · {currentDestroyedGrids.map(k => gridLabelsMap[k]).join(', ')} · cannot fire new shots there
          </div>
        )}

        <FunctionBankPanel
          difficulty={difficulty}
          bankOverride={gameMode === 'powertest' ? FUNCTION_LIBRARY.map(f => f.id) : undefined}
          onGuess={mpHandleGuessById}
          identifiedIds={identified}
          wrongGuessIds={isP1 ? mpP1WrongGuesses : mpP2WrongGuesses}
          message={mpMessage}
          activeFunctions={targetSlot.functions}
        />

        <PowersPanel
          powers={isP1 ? p1Powers : p2Powers}
          onUse={useMpPower}
          shotsAllowed={mpShotsAllowedThisTurn}
          shotsFired={mpShotsFiredThisTurn}
          trapCardPending={mpTrapCardPending}
          parabolaShotPending={mpParabolaShotPending}
          spiralShotPending={mpSpiralShotPending}
          partyPerryPending={mpPartyPerryPending}
          omnisciencePending={mpOmnisciencePending}
          omnipotencePending={mpOmnipotencePending}
          marauderPending={mpMarauderPending}
          heatCheckActive={mpHeatCheckActive}
          heatCheckMissed={mpHeatCheckMissed}
          bindingVowActive={currentBindingVowActive}
        />

        {mpPowerError && (
          <div style={{
            marginBottom: 8, fontSize: 11, color: '#ff4444',
            letterSpacing: '0.08em', padding: '6px 12px',
            background: '#1a0505', border: '1px solid #ff444433',
            borderRadius: 4, width: '100%', maxWidth: 560,
          }}>
            ⚠ {mpPowerError}
          </div>
        )}

        {(() => {
          const myTrap = isP1 ? p1TrapCard : p2TrapCard;
          if (myTrap && !myTrap.triggered) {
            const gridLabel = myTrap.grid === 'f' ? 'f(x)' : myTrap.grid === 'df' ? "f′(x)" : 'F(x)';
            return (
              <div style={{
                marginBottom: 8,
                fontSize: 11,
                color: '#ff6b6b',
                letterSpacing: '0.1em',
                padding: '6px 12px',
                background: '#0d0808',
                border: '1px solid #ff6b6b33',
                borderRadius: 4,
                width: '100%',
                maxWidth: 560,
              }}>
                ⚡ TRAP SET · {gridLabel} · ({myTrap.col - 2}, {2 - myTrap.row}) — waiting for opponent
              </div>
            );
          }
          return null;
        })()}

        {mpTrapCardPending && (
          <TrapCardPicker
            selectedGrid={mpTrapCardGrid}
            onSelectGrid={setMpTrapCardGrid}
            onConfirm={confirmTrapCard}
            onCancel={cancelTrapCard}
            ownGrid={isP1 ? p1Slot.grid : p2Slot.grid}
            existingTrap={isP1 ? p1TrapCard : p2TrapCard}
          />
        )}

        {mpParabolaShotPending && (
          <ParabolaShotPicker
            selectedGrid={mpParabolaShotGridKey}
            onSelectGrid={setMpParabolaShotGridKey}
            selectedPreset={mpParabolaShotPresetIdx}
            onSelectPreset={setMpParabolaShotPresetIdx}
            onFire={fireParabolaScan}
            usedScans={(isP1 ? p1ParabolaScanResults : p2ParabolaScanResults).map(r => ({ gridKey: r.gridKey, presetIdx: r.presetIdx }))}
            bindingVowActive={currentBindingVowActive}
            destroyedGrids={currentDestroyedGrids}
          />
        )}

        <ParabolaScanResultCards results={isP1 ? p1ParabolaScanResults : p2ParabolaScanResults} />

        {mpSpiralShotPending && (
          <SpiralShotPicker
            selectedGrid={mpSpiralShotGridKey}
            onSelectGrid={setMpSpiralShotGridKey}
            selectedPreset={mpSpiralShotPresetIdx}
            onSelectPreset={setMpSpiralShotPresetIdx}
            onFire={fireSpiralScan}
            usedScans={(isP1 ? p1SpiralScanResults : p2SpiralScanResults).map(r => ({ gridKey: r.gridKey, presetIdx: r.presetIdx }))}
            bindingVowActive={currentBindingVowActive}
            destroyedGrids={currentDestroyedGrids}
          />
        )}

        <SpiralScanResultCards results={isP1 ? p1SpiralScanResults : p2SpiralScanResults} />

        {mpPartyPerryPending && (
          <PartyPerryPicker onGuess={confirmPartyPerry} newPowers={mpPartyPerryNewPowers} onClose={closePartyPerry} />
        )}

        {mpOmnisciencePending && (
          <OmnisciencePicker
            selectedGrid={mpOmniscienceGrid}
            onSelectGrid={setMpOmniscienceGrid}
            onConfirm={activateOmniscience}
            onCancel={cancelOmniscience}
            bindingVowActive={currentBindingVowActive}
            destroyedGrids={currentDestroyedGrids}
          />
        )}

        {mpOmniscienceActive && (
          <OmniscienceReveal
            gridKey={mpOmniscienceGrid}
            targetSlot={targetSlot}
            onClose={closeOmniscience}
          />
        )}

        {mpOmnipotencePending && (
          <OmnipotencePicker
            selectedGrid={mpOmnipotenceGrid}
            onSelectGrid={setMpOmnipotenceGrid}
            onConfirm={activateOmnipotence}
            onCancel={cancelOmnipotence}
            opponentDestroyedGrids={opponentDestroyedGrids}
          />
        )}

        {mpMarauderPending && (
          <MarauderPicker
            opponentPowers={isP1 ? p2Powers : p1Powers}
            onConfirm={confirmMarauder}
            onCancel={cancelMarauder}
          />
        )}

        {(mpParabolaShotPending || mpSpiralShotPending || (mpShotsFiredThisTurn > 0 && (mpShotsFiredThisTurn >= mpShotsAllowedThisTurn || mpHeatCheckMissed))) && (
          <button
            onClick={() => endMpTurn(false)}
            style={{
              marginTop: 12,
              padding: '10px 32px',
              background: '#0d0d1a',
              border: '2px solid #66b3ff',
              borderRadius: 6,
              color: '#66b3ff',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.1em',
              boxShadow: '0 0 10px #66b3ff22',
            }}
          >
            END TURN →
          </button>
        )}

        <div style={{ marginTop: 12, fontSize: 10, color: '#334', letterSpacing: '0.08em' }}>
          {mpShotsFiredThisTurn === 0
            ? 'Fire a shot to reveal a square'
            : mpHeatCheckActive && mpHeatCheckMissed
              ? 'Missed — no more shots · guess or end your turn'
              : mpHeatCheckActive
                ? `HIT · keep firing or guess · ${mpShotsFiredThisTurn}/3 shots`
                : mpShotsFiredThisTurn < mpShotsAllowedThisTurn
                  ? `Fire second shot · or guess / end turn`
                  : 'Guess a function or end your turn'}
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: '#445', display: 'flex', gap: 20, letterSpacing: '0.05em' }}>
          <span><span style={{ color: '#00ff88' }}>●</span> HIT</span>
          <span><span style={{ color: '#ff4444' }}>×</span> MISS</span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Battle Royale views
  // ─────────────────────────────────────────────────────────────

  if (phase === 'br-setup') {
    return (
      <BattleRoyaleSetupScreen
        difficulty={difficulty}
        onStart={startBattleRoyale}
        onBack={() => setPhase('mode')}
      />
    );
  }

  if (phase === 'br-pass') {
    const toPlayer = brPlayers[brPassToIdx];
    return (
      <BrPassScreen
        toName={toPlayer ? toPlayer.name : ''}
        notifications={toPlayer ? toPlayer.notifications : []}
        bonusTurn={brNextPassIsBonusTurn}
        glitchTriggered={brGlitchTriggered}
        announcement={brPassAnnouncement}
        onContinue={handleBrPassContinue}
      />
    );
  }

  if (phase === 'br-round-end') {
    const lastFinisherIdx = brRoundFinishOrder[brRoundFinishOrder.length - 1];
    const lastFinisher = brPlayers[lastFinisherIdx];
    const remainingAfterElim = brPlayers.map((p, i) =>
      i === lastFinisherIdx ? { ...p, active: false, eliminationRound: brRound } : p
    );
    const remainingActive = remainingAfterElim.filter(p => p.active);
    const isGameOver = remainingActive.length <= 1;
    const winner = isGameOver ? remainingActive[0] : null;
    const newElimOrder = [...brEliminationOrder, lastFinisherIdx];

    return (
      <div style={{ ...centeredPageStyle(), padding: '24px 16px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#557', textTransform: 'uppercase' }}>
          ROUND {brRound} COMPLETE
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.15em', color: '#ff6b6b',
          textShadow: '0 0 24px #ff6b6baa', margin: '8px 0 4px' }}>
          ☠ {lastFinisher ? lastFinisher.name : ''} ELIMINATED
        </div>
        <div style={{ fontSize: 11, color: '#557', letterSpacing: '0.1em', marginBottom: 16 }}>
          finished last in round {brRound}
        </div>

        <div style={{ marginBottom: 16, background: '#0d0d1a', border: '1px solid #1e1e3a',
          borderRadius: 8, padding: '12px 24px', width: '100%', maxWidth: 400 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#557', marginBottom: 8 }}>
            ROUND {brRound} FINISH ORDER
          </div>
          {brRoundFinishOrder.map((idx, pos) => {
            const p = brPlayers[idx];
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 0', borderBottom: pos < brRoundFinishOrder.length - 1 ? '1px solid #1e1e3a' : 'none' }}>
                <span style={{ fontSize: 13, color: idx === lastFinisherIdx ? '#ff6b6b' : '#e0e0e0',
                  fontWeight: 700, letterSpacing: '0.05em' }}>
                  {pos + 1}. {p.name}
                </span>
                {idx === lastFinisherIdx && (
                  <span style={{ fontSize: 10, color: '#ff6b6b', letterSpacing: '0.1em' }}>ELIMINATED</span>
                )}
              </div>
            );
          })}
        </div>

        {isGameOver ? (
          <>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '0.15em', color: '#00ff88',
              textShadow: '0 0 32px #00ff88aa', margin: '8px 0' }}>
              {winner ? winner.name : ''} WINS!
            </div>
            <div style={{ fontSize: 11, color: '#557', letterSpacing: '0.1em', marginBottom: 16 }}>
              BATTLE ROYALE CHAMPION
            </div>
            <div style={{ marginBottom: 16, background: '#0d0d1a', border: '1px solid #1e1e3a',
              borderRadius: 8, padding: '12px 24px', width: '100%', maxWidth: 400 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#557', marginBottom: 8 }}>
                FINAL LEADERBOARD
              </div>
              {[winner, ...newElimOrder.slice().reverse().map(i => brPlayers[i])].filter(Boolean).map((p, pos) => (
                <div key={p.name + pos} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '4px 0',
                  borderBottom: pos < brPlayers.length - 1 ? '1px solid #1e1e3a' : 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                    color: pos === 0 ? '#ffd700' : pos === 1 ? '#c0c0c0' : pos === 2 ? '#cd7f32' : '#557' }}>
                    {pos === 0 ? '🏆' : `${pos + 1}.`} {p.name}
                  </span>
                  <span style={{ fontSize: 10, color: pos === 0 ? '#ffd700' : '#557', letterSpacing: '0.08em' }}>
                    {pos === 0 ? 'WINNER' : `elim. round ${p.eliminationRound || brRound}`}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={goHome} style={{
              padding: '12px 32px', background: '#001a0d', border: '2px solid #00ff88',
              borderRadius: 6, color: '#00ff88', fontFamily: 'inherit', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 14px #00ff8855',
            }}>
              NEW MISSION
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#557', letterSpacing: '0.1em', marginBottom: 8 }}>
              {remainingActive.length} players remain
            </div>
            <button
              onClick={() => {
                setBrEliminationOrder(newElimOrder);
                startBrNextRound(remainingAfterElim);
              }}
              style={{
                padding: '14px 48px', background: '#1a0505', border: '2px solid #ff6b6b',
                borderRadius: 8, color: '#ff6b6b', fontFamily: 'inherit', fontSize: 16,
                fontWeight: 700, cursor: 'pointer', letterSpacing: '0.12em',
                boxShadow: '0 0 24px #ff6b6b44',
              }}
            >
              START ROUND {brRound + 1} →
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === 'br' && brPlayers.length > 0) {
    const player = brPlayers[brCurrentIdx];
    if (!player) return null;
    const gridLabelsMap = { f: 'f(x)', df: "f′(x)", F: 'F(x)' };
    const ordinal = n => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e0',
        fontFamily: "'Courier New', Courier, monospace",
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        <button
          onClick={() => setShowHelp(true)}
          style={{
            position: 'fixed', top: 14, right: 14, zIndex: 50,
            background: '#0d0d1a', border: '1px solid #2a2a4a',
            borderRadius: 20, color: '#445', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            padding: '5px 13px', letterSpacing: '0.1em',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = '#ff6b6b44'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#445'; e.currentTarget.style.borderColor = '#2a2a4a'; }}
        >? HELP</button>

        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, letterSpacing: '0.2em', color: '#ff6b6b',
            textShadow: '0 0 16px #ff6b6baa', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
            Battle Royale
          </h1>
          <div style={{ fontSize: 11, color: '#557', marginTop: 4, letterSpacing: '0.1em' }}>
            Round {brRound} · <span style={{ color: '#ff6b6b' }}>{DIFFICULTY[difficulty].label.toUpperCase()}</span>
            {' · '}<span style={{ color: '#ff6b6b', fontWeight: 700 }}>{player.name}</span>
            {brBonusTurnsRemaining > 0 && <span style={{ color: '#ffd700' }}> · ★ BONUS</span>}
          </div>
          <div style={{ fontSize: 10, color: '#334', marginTop: 2, letterSpacing: '0.08em' }}>
            FIRE ON YOUR OWN GRID · IDENTIFY ALL YOUR HIDDEN FUNCTIONS
          </div>
        </div>

        {/* Round standings strip */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: 16, padding: '8px 12px',
          background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 8,
          width: '100%', maxWidth: 560 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#334', alignSelf: 'center',
            marginRight: 4, fontWeight: 700 }}>ROUND {brRound}</span>
          {brPlayers.map((p, i) => {
            if (!p.active) return null; // eliminated players from previous rounds, skip
            const isCurrent = i === brCurrentIdx;
            const isFinished = p.finishedThisRound;
            const pos = brRoundFinishOrder.indexOf(i); // -1 if not finished yet
            const finishPos = pos >= 0 ? pos + 1 : null;
            return (
              <div key={i} style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5,
                background: isFinished ? '#0d1a0a' : isCurrent ? '#1a0505' : '#0d0d1a',
                border: `1px solid ${isFinished ? '#00ff8855' : isCurrent ? '#ff6b6b' : '#2a2a4a'}`,
                color: isFinished ? '#00ff88' : isCurrent ? '#ff6b6b' : '#557',
                boxShadow: isCurrent ? '0 0 8px #ff6b6b22' : 'none',
              }}>
                {isFinished && finishPos !== null && (
                  <span style={{ fontSize: 9, opacity: 0.8 }}>{ordinal(finishPos)}</span>
                )}
                {p.name}
                {isCurrent && !isFinished && (
                  <span style={{ fontSize: 8, opacity: 0.7, letterSpacing: '0.1em' }}>▶</span>
                )}
                {isFinished && <span style={{ fontSize: 10 }}>✓</span>}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          <Panel title="YOUR GRID">
            <FireGrid grid={player.grid} shotMode={brShotMode} onFire={brFireShot} disabled={false} fogActive={brFogOfWarThisTurn} />
          </Panel>
          {shotModes.map(({ key, label }) => (
            <Panel key={key} title={label} accent={!brFogOfWarThisTurn && brShotMode === key ? '#ff6b6b' : undefined}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 50px)', gap: 2 }}>
                {player.grid.map((rowArr, ri) =>
                  rowArr.map((cell, ci) => (
                    <GraphCell key={`${ri}-${ci}`} shotType={key} col={ci} row={ri} cellShots={cell.shots} activeFunctions={player.functions} />
                  ))
                )}
              </div>
            </Panel>
          ))}
        </div>

        {!brFogOfWarThisTurn && (
          <ShotModeButtons shotMode={brShotMode} onChange={setBrShotMode}
            disabledModes={player.bindingVowActive ? ['f'] : []}
            destroyedModes={player.destroyedGrids} />
        )}

        {player.fogOfWarTurns > 0 && (
          <div style={{ marginBottom: 8, fontSize: 11, color: '#66b3ff', letterSpacing: '0.1em',
            padding: '6px 12px', background: '#00090f', border: '1px solid #66b3ff33',
            borderRadius: 4, width: '100%', maxWidth: 560 }}>
            🌫 FOG OF WAR · {player.fogOfWarTurns} turn{player.fogOfWarTurns !== 1 ? 's' : ''} remaining
          </div>
        )}
        {brFogOfWarThisTurn && (
          <div style={{ marginBottom: 8, fontSize: 11, color: '#66b3ff', letterSpacing: '0.1em',
            padding: '6px 12px', background: '#00090f', border: '1px solid #66b3ff33',
            borderRadius: 4, width: '100%', maxWidth: 560 }}>
            🌫 FOG OF WAR ACTIVE · grid hidden — firing in a random grid this turn
          </div>
        )}
        {player.bindingVowActive && (
          <div style={{ marginBottom: 8, fontSize: 11, color: '#a855f7', letterSpacing: '0.1em',
            padding: '6px 12px', background: '#080412', border: '1px solid #a855f733',
            borderRadius: 4, width: '100%', maxWidth: 560 }}>
            ⛓ BINDING VOW ACTIVE · f(x) locked · 2 shots per turn
          </div>
        )}
        {player.destroyedGrids.length > 0 && (
          <div style={{ marginBottom: 8, fontSize: 11, color: '#ff4444', letterSpacing: '0.1em',
            padding: '6px 12px', background: '#1a0505', border: '1px solid #ff444433',
            borderRadius: 4, width: '100%', maxWidth: 560 }}>
            ☠ GRID DESTROYED · {player.destroyedGrids.map(k => gridLabelsMap[k]).join(', ')} · cannot fire new shots there
          </div>
        )}
        {brGlitchBonusActive && (
          <div style={{ marginBottom: 8, fontSize: 11, color: '#00e5ff', letterSpacing: '0.1em',
            padding: '6px 12px', background: '#00101a', border: '1px solid #00e5ff33',
            borderRadius: 4, width: '100%', maxWidth: 560 }}>
            ⚡ GLITCH PASSIVE ACTIVATED · bonus turns redirected to you
          </div>
        )}

        <FunctionBankPanel
          difficulty={difficulty}
          onGuess={brHandleGuessById}
          identifiedIds={player.identified}
          wrongGuessIds={player.wrongGuesses}
          message={brMessage}
          activeFunctions={player.functions}
        />

        {brPowersEnabled && (
          <PowersPanel
            powers={player.powers}
            onUse={useBrPower}
            shotsAllowed={brShotsAllowedThisTurn}
            shotsFired={brShotsFiredThisTurn}
            trapCardPending={false}
            parabolaShotPending={brParabolaShotPending}
            spiralShotPending={brSpiralShotPending}
            partyPerryPending={brPartyPerryPending}
            omnisciencePending={brOmnisciencePending || brTargetPickerPending && brOmnisciencePendingIndex !== null}
            omnipotencePending={brOmnipotencePending || brTargetPickerPending && brOmnipotencePendingIndex !== null}
            marauderPending={brMarauderPending || brTargetPickerPending && brMarauderPendingIndex !== null}
            heatCheckActive={brHeatCheckActive}
            heatCheckMissed={brHeatCheckMissed}
            bindingVowActive={player.bindingVowActive}
          />
        )}

        {brPowerError && (
          <div style={{ marginBottom: 8, fontSize: 11, color: '#ff4444', letterSpacing: '0.08em',
            padding: '6px 12px', background: '#1a0505', border: '1px solid #ff444433',
            borderRadius: 4, width: '100%', maxWidth: 560 }}>
            ⚠ {brPowerError}
          </div>
        )}

        {brTargetPickerPending && (
          <BrTargetPicker
            players={brPlayers}
            currentIdx={brCurrentIdx}
            powerLabel={
              brOmnisciencePendingIndex !== null ? 'OMNISCIENCE' :
              brOmnipotencePendingIndex !== null ? 'OMNIPOTENCE' :
              brFogOfWarPendingIndex !== null ? 'FOG OF WAR' :
              brMarauderPendingIndex !== null ? 'MARAUDER' : 'POWER'
            }
            onSelect={handleBrTargetSelect}
            onCancel={cancelBrTargetPicker}
          />
        )}

        {brOmnisciencePending && (
          <OmnisciencePicker
            selectedGrid={brOmniscienceGrid}
            onSelectGrid={setBrOmniscienceGrid}
            onConfirm={brActivateOmniscience}
            onCancel={brCancelOmniscience}
            bindingVowActive={false}
            destroyedGrids={[]}
          />
        )}
        {brOmniscienceActive && brOmniscienceTargetIdx !== null && (
          <OmniscienceReveal
            gridKey={brOmniscienceGrid}
            targetSlot={brPlayers[brOmniscienceTargetIdx]}
            onClose={brCloseOmniscience}
          />
        )}

        {brOmnipotencePending && brOmnipotenceTargetIdx !== null && (
          <OmnipotencePicker
            selectedGrid={brOmnipotenceGrid}
            onSelectGrid={setBrOmnipotenceGrid}
            onConfirm={brActivateOmnipotence}
            onCancel={brCancelOmnipotence}
            opponentDestroyedGrids={brPlayers[brOmnipotenceTargetIdx].destroyedGrids}
          />
        )}

        {brParabolaShotPending && (
          <ParabolaShotPicker
            selectedGrid={brParabolaShotGridKey}
            onSelectGrid={setBrParabolaShotGridKey}
            selectedPreset={brParabolaShotPresetIdx}
            onSelectPreset={setBrParabolaShotPresetIdx}
            onFire={brFireParabolaScan}
            usedScans={player.parabolaScanResults.map(r => ({ gridKey: r.gridKey, presetIdx: r.presetIdx }))}
            bindingVowActive={player.bindingVowActive}
            destroyedGrids={player.destroyedGrids}
          />
        )}
        <ParabolaScanResultCards results={player.parabolaScanResults} />

        {brSpiralShotPending && (
          <SpiralShotPicker
            selectedGrid={brSpiralShotGridKey}
            onSelectGrid={setBrSpiralShotGridKey}
            selectedPreset={brSpiralShotPresetIdx}
            onSelectPreset={setBrSpiralShotPresetIdx}
            onFire={brFireSpiralScan}
            usedScans={player.spiralScanResults.map(r => ({ gridKey: r.gridKey, presetIdx: r.presetIdx }))}
            bindingVowActive={player.bindingVowActive}
            destroyedGrids={player.destroyedGrids}
          />
        )}
        <SpiralScanResultCards results={player.spiralScanResults} />

        {brPartyPerryPending && (
          <PartyPerryPicker onGuess={brConfirmPartyPerry} newPowers={brPartyPerryNewPowers} onClose={brClosePartyPerry} />
        )}

        {brMarauderPending && brMarauderTargetIdx !== null && (
          <MarauderPicker
            opponentPowers={brPlayers[brMarauderTargetIdx].powers}
            onConfirm={brConfirmMarauder}
            onCancel={brCancelMarauder}
          />
        )}

        {(brParabolaShotPending || brSpiralShotPending || (brShotsFiredThisTurn > 0 && (brShotsFiredThisTurn >= brShotsAllowedThisTurn || brHeatCheckMissed))) && (
          <button onClick={() => endBrTurn(false)} style={{
            marginTop: 12, padding: '10px 32px', background: '#0d0d1a',
            border: '2px solid #ff6b6b', borderRadius: 6, color: '#ff6b6b',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.1em', boxShadow: '0 0 10px #ff6b6b22',
          }}>
            END TURN →
          </button>
        )}

        <div style={{ marginTop: 12, fontSize: 10, color: '#334', letterSpacing: '0.08em' }}>
          {brShotsFiredThisTurn === 0
            ? 'Fire a shot to reveal a square'
            : brHeatCheckActive && brHeatCheckMissed
              ? 'Missed — no more shots · guess or end your turn'
              : brHeatCheckActive
                ? `HIT · keep firing or guess · ${brShotsFiredThisTurn}/3 shots`
                : brShotsFiredThisTurn < brShotsAllowedThisTurn
                  ? 'Fire next shot · or guess / end turn'
                  : 'Guess a function or end your turn'}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: '#445', display: 'flex', gap: 20, letterSpacing: '0.05em' }}>
          <span><span style={{ color: '#00ff88' }}>●</span> HIT</span>
          <span><span style={{ color: '#ff4444' }}>×</span> MISS</span>
        </div>
      </div>
    );
  }

  return null;
}
