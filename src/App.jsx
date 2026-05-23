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
  { id: 'reload',       label: 'RELOAD',        desc: '+1 shot this turn · stacks with other powers and itself' },
  { id: 'parabolaShot', label: 'PARABOLA SHOT', desc: 'Scan a grid for intersecting functions' },
  { id: 'spiralShot',   label: 'SPIRAL SHOT',   desc: 'Scan a grid with an Archimedean spiral — shows all intersection points' },
  { id: 'trapCard',     label: 'TRAP CARD',     desc: "Set a hidden trap square — ends opponent's turn if they fire there (you get 2 bonus turns)" },
  { id: 'heatCheck',    label: 'HEAT CHECK',    desc: 'Keep firing as long as you hit — miss stops shooting · caps at 3 shots · must activate before your first shot' },
  { id: 'bindingVow',   label: 'BINDING VOW',   desc: 'Forfeit f(x) guesses for the rest of the round — gain 2 shots every turn (including bonus turns)' },
];

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

function rollPowers(count) {
  return Array.from({ length: count }, () => ({ ...POWERS[Math.floor(Math.random() * POWERS.length)], used: false }));
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
// Screens
// ─────────────────────────────────────────────────────────────

function DifficultyScreen({ onSelect }) {
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
      </div>
    </div>
  );
}

function ModeSelectScreen({ difficulty, onSelect, onBack }) {
  const modes = [
    { key: 'solo',      label: 'SOLO',       desc: 'Identify the hidden functions' },
    { key: '1v1',       label: '1v1',        desc: 'Pass-and-play against a friend' },
    { key: 'powertest', label: 'POWER TEST', desc: 'Pick any powers and test them' },
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
          <MenuButton key={t.key} label={t.label} desc={t.desc} onClick={() => onSelect(t.key)} />
        ))}
      </div>
      <BackButton label="← CHANGE MODE" onClick={onBack} />
    </div>
  );
}

function PassScreen({ toPlayer, bonusTurn, trapTriggered, onContinue }) {
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
      {bonusTurn && !trapTriggered && (
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
              {powers.map((power, i) => (
                <div key={i} style={{
                  background: '#111124', border: '1px solid #2a2a6a',
                  borderRadius: 4, padding: '8px 12px', marginBottom: 6,
                  color: '#66b3ff', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                }}>
                  {power.label}
                  <div style={{ fontSize: 10, color: '#445', marginTop: 2, fontWeight: 400 }}>{power.desc}</div>
                </div>
              ))}
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
                      <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: count > 0 ? '#66b3ff' : '#445', letterSpacing: '0.06em' }}>
                        {power.label}
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
      <BackButton label="← CHANGE MODE" onClick={onBack} />
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

function PowersPanel({ powers, onUse, shotsAllowed, shotsFired, trapCardPending, parabolaShotPending, spiralShotPending, heatCheckActive, heatCheckMissed, bindingVowActive }) {
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
            (power.id === 'spiralShot' && spiralShotPending);
          const heatCheckOngoing = heatCheckActive && !heatCheckMissed && shotsFired < 3;
          const cantActivate =
            (power.id === 'heatCheck' && (shotsFired > 0 || shotsAllowed >= 2)) ||
            (power.id === 'reload' && heatCheckOngoing) ||
            (power.id === 'bindingVow' && bindingVowActive);
          const disabled = power.used || isPending || cantActivate;
          let bg = '#0a0a2a', borderColor = '#2a2a6a', color = '#66b3ff';
          if (isHeatCheckOn)      { bg = '#1a0a00'; borderColor = '#ff880088'; color = '#ff8800'; }
          else if (isBindingVowOn){ bg = '#0d0814'; borderColor = '#a855f788'; color = '#a855f7'; }
          else if (power.used)    { bg = '#0a0a1a'; borderColor = '#1a1a3a'; color = '#334'; }
          else if (isPending)     { bg = '#1a0808'; borderColor = '#ff6b6b88'; color = '#ff6b6b'; }
          else if (cantActivate)  { bg = '#0a0a1a'; borderColor = '#1a1a3a'; color = '#445'; }
          return (
            <button
              key={i}
              onClick={() => !disabled && onUse(i)}
              disabled={disabled}
              style={{
                padding: '8px 16px', background: bg,
                border: `1px solid ${borderColor}`, borderRadius: 6, color,
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
                letterSpacing: '0.08em', textDecoration: (power.used && !isHeatCheckOn) ? 'line-through' : 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = '#66b3ff'; }}
              onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = borderColor; }}
            >
              {isHeatCheckOn
                ? `🔥 ${power.label} ACTIVE`
                : isBindingVowOn
                  ? `⛓ ${power.label} ACTIVE`
                  : power.used
                    ? `✓ ${power.label}`
                    : isPending
                      ? `↻ ${power.label} SELECTING...`
                      : `USE: ${power.label}`}
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

function FireGrid({ grid, shotMode, onFire, disabled }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 52px)', gap: 4 }}>
      {grid.map((rowArr, ri) =>
        rowArr.map((cell, ci) => {
          const shot = cell.shots[shotMode];
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

function ShotModeButtons({ shotMode, onChange, disabledModes = [] }) {
  const modes = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {modes.map(({ key, label }) => {
        const isDisabled = disabledModes.includes(key);
        const isActive = shotMode === key;
        return (
          <button
            key={key}
            onClick={() => !isDisabled && onChange(key)}
            disabled={isDisabled}
            title={isDisabled ? 'Restricted by Binding Vow' : undefined}
            style={{
              padding: '10px 20px',
              background: isActive ? '#00ff1122' : '#111124',
              border: `2px solid ${isActive ? '#00ff88' : isDisabled ? '#1a1a2a' : '#2a2a4a'}`,
              borderRadius: 6,
              color: isActive ? '#00ff88' : isDisabled ? '#2a2a3a' : '#668',
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

function ParabolaShotPicker({ selectedGrid, onSelectGrid, selectedPreset, onSelectPreset, onFire, usedScans = [], bindingVowActive = false }) {
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
          const isSelected = selectedGrid === key;
          return (
            <button
              key={key}
              onClick={() => !isVowLocked && onSelectGrid(key)}
              disabled={isVowLocked}
              title={isVowLocked ? 'Restricted by Binding Vow' : undefined}
              style={{
                padding: '8px 16px',
                background: isSelected ? '#1a1400' : '#0a0a1a',
                border: `1px solid ${isSelected ? '#ffd700' : isVowLocked ? '#1a1a2a' : '#2a2a4a'}`,
                borderRadius: 4,
                color: isSelected ? '#ffd700' : isVowLocked ? '#2a2a3a' : '#668',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                cursor: isVowLocked ? 'not-allowed' : 'pointer',
                letterSpacing: '0.05em',
                boxShadow: isSelected ? '0 0 8px #ffd70033' : 'none',
                transition: 'all 0.15s',
                textDecoration: isVowLocked ? 'line-through' : 'none',
                opacity: isVowLocked ? 0.4 : 1,
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

function SpiralShotPicker({ selectedGrid, onSelectGrid, selectedPreset, onSelectPreset, onFire, usedScans = [], bindingVowActive = false }) {
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
          const isSelected = selectedGrid === key;
          return (
            <button
              key={key}
              onClick={() => !isVowLocked && onSelectGrid(key)}
              disabled={isVowLocked}
              title={isVowLocked ? 'Restricted by Binding Vow' : undefined}
              style={{
                padding: '8px 16px',
                background: isSelected ? '#001a20' : '#000d12',
                border: `1px solid ${isSelected ? '#00e5ff' : isVowLocked ? '#1a1a2a' : '#1a3a3a'}`,
                borderRadius: 4,
                color: isSelected ? '#00e5ff' : isVowLocked ? '#2a2a3a' : '#668',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                cursor: isVowLocked ? 'not-allowed' : 'pointer',
                letterSpacing: '0.05em',
                boxShadow: isSelected ? '0 0 8px #00e5ff33' : 'none',
                transition: 'all 0.15s',
                textDecoration: isVowLocked ? 'line-through' : 'none',
                opacity: isVowLocked ? 0.4 : 1,
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

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────

export default function App() {
  // phase: 'difficulty' | 'mode' | 'roundtype' | 'solo' | 'mp' | 'pass' | 'round-end'
  const [phase, setPhase] = useState('difficulty');
  const [difficulty, setDifficulty] = useState(null);
  const [gameMode, setGameMode] = useState(null);

  // ── Solo state ──
  const [activeFunctions, setActiveFunctions] = useState([]);
  const [grid, setGrid] = useState(initGrid);
  const [shotMode, setShotMode] = useState('f');
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const [wrongGuessIds, setWrongGuessIds] = useState([]);

  // ── 1v1 state ──
  const [roundType, setRoundType] = useState(null); // 'lightning' | 'normal'
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
    } else {
      setPhase('roundtype');
    }
  }

  function handleRoundTypeSelect(type) {
    setRoundType(type);
    setMpCurrentRound(1);
    setMpP1RoundWins(0);
    setMpP2RoundWins(0);
    startMpRound(1);
  }

  function startMpRound(roundNum) {
    const newP1Powers = rollPowers(1);
    const newP2Powers = rollPowers(1);
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
    setPhase('mp');
  }

  function goHome() {
    setPhase('difficulty');
    setDifficulty(null);
    setGameMode(null);
    setRoundType(null);
    setMpMatchWinner(null);
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
      setPowers(prev => prev.map((p, i) => i === powerIndex ? { ...p, used: true } : p));
      if (isP1) setP1BindingVowActive(true);
      else setP2BindingVowActive(true);
      setMpShotsAllowedThisTurn(2);
      if (mpShotMode === 'f') setMpShotMode('df');
      return;
    }

    if (power.id === 'reload' && mpHeatCheckActive && !mpHeatCheckMissed && mpShotsFiredThisTurn < 3) return;

    setPowers(prev => prev.map((p, i) => i === powerIndex ? { ...p, used: true } : p));
    if (power.id === 'reload') {
      setMpShotsAllowedThisTurn(prev => prev + 1);
    }
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
    const targetSlot = isP1 ? p2Slot : p1Slot;
    const setTargetSlot = isP1 ? setP2Slot : setP1Slot;

    if (targetSlot.grid[row][col].shots[mpShotMode].fired) return;

    const hits = targetSlot.functions
      .filter(({ fn }) => doesFunctionPassThrough(fn[mpShotMode], col, row))
      .map(({ fn, color }) => ({ fnId: fn.id, color }));

    const newGrid = targetSlot.grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri !== row || ci !== col) return c;
        return { ...c, shots: { ...c.shots, [mpShotMode]: { fired: true, hits } } };
      })
    );

    setTargetSlot({ ...targetSlot, grid: newGrid });

    // Check if this shot hits the opponent's trap card
    const opponentTrap = isP1 ? p2TrapCard : p1TrapCard;
    const setOpponentTrap = isP1 ? setP2TrapCard : setP1TrapCard;
    if (
      opponentTrap &&
      !opponentTrap.triggered &&
      opponentTrap.grid === mpShotMode &&
      opponentTrap.col === col &&
      opponentTrap.row === row
    ) {
      setOpponentTrap(prev => ({ ...prev, triggered: true }));
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

  function endMpTurn(wrongGuess = false) {
    const nextPlayer = mpCurrentPlayer === 1 ? 2 : 1;
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

    if (wrongGuess && mpBonusTurnsRemaining > 0) {
      setMpBonusTurnsRemaining(0);
      setMpPassTo(nextPlayer);
      setMpNextPassIsBonusTurn(false);
    } else if (wrongGuess) {
      setMpBonusTurnsRemaining(1);
      setMpPassTo(nextPlayer);
      setMpNextPassIsBonusTurn(true);
    } else if (mpBonusTurnsRemaining > 0) {
      setMpBonusTurnsRemaining(prev => prev - 1);
      setMpPassTo(mpCurrentPlayer);
      setMpNextPassIsBonusTurn(true);
    } else {
      setMpPassTo(nextPlayer);
      setMpNextPassIsBonusTurn(false);
    }
    setPhase('pass');
  }

  function handlePassContinue() {
    const nextPlayer = mpPassTo;
    const nextBindingVow = nextPlayer === 1 ? p1BindingVowActive : p2BindingVowActive;
    if (nextBindingVow) {
      setMpShotsAllowedThisTurn(2);
      setMpShotMode('df');
    }
    setMpCurrentPlayer(nextPlayer);
    setMpPassTo(null);
    setMpNextPassIsBonusTurn(false);
    setMpTrapTriggered(false);
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
      endMpTurn(true);
    }
  }

  function startNextRound() {
    const newRound = mpCurrentRound + 1;
    setMpCurrentRound(newRound);

    // Round 2+: both players start fresh with 1 power; coin flip gives the winner 1 extra
    let newP1Powers = rollPowers(1);
    let newP2Powers = rollPowers(1);
    const coinWinner = Math.random() < 0.5 ? 1 : 2;
    if (coinWinner === 1) newP1Powers = [...newP1Powers, ...rollPowers(1)];
    else newP2Powers = [...newP2Powers, ...rollPowers(1)];
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
    setPhase('power-draw');
  }

  // ─────────────────────────────────────────────────────────────
  // Routing
  // ─────────────────────────────────────────────────────────────

  if (phase === 'difficulty') return <DifficultyScreen onSelect={handleDifficultySelect} />;

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
        difficulty={difficulty}
        onStart={startPowerTestGame}
        onBack={() => setPhase('mode')}
      />
    );
  }

  if (phase === 'pass') {
    return <PassScreen toPlayer={mpPassTo} bonusTurn={mpNextPassIsBonusTurn} trapTriggered={mpTrapTriggered} onContinue={handlePassContinue} />;
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
            <FireGrid grid={targetSlot.grid} shotMode={mpShotMode} onFire={mpFireShot} disabled={false} />
          </Panel>
          {shotModes.map(({ key, label }) => (
            <Panel key={key} title={label} accent={mpShotMode === key ? '#00ff88' : undefined}>
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

        <ShotModeButtons shotMode={mpShotMode} onChange={setMpShotMode} disabledModes={currentBindingVowActive ? ['f'] : []} />

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
          heatCheckActive={mpHeatCheckActive}
          heatCheckMissed={mpHeatCheckMissed}
          bindingVowActive={currentBindingVowActive}
        />

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
          />
        )}

        <SpiralScanResultCards results={isP1 ? p1SpiralScanResults : p2SpiralScanResults} />

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

  return null;
}
