import { useState, useEffect, useRef } from "react";

const FUNCTION_LIBRARY = [
  {
    id: 1, label: 'x²', aliases: ['x^2', 'x2', 'x²', 'xsquared'],
    f:  x => x ** 2,
    df: x => 2 * x,
    F:  x => x ** 3 / 3,
  },
  {
    id: 2, label: 'x³', aliases: ['x^3', 'x3', 'x³', 'xcubed'],
    f:  x => x ** 3,
    df: x => 3 * x ** 2,
    F:  x => x ** 4 / 4,
  },
  {
    id: 3, label: 'sin(x)', aliases: ['sinx', 'sin x'],
    f:  x => Math.sin(x),
    df: x => Math.cos(x),
    F:  x => -Math.cos(x),
  },
  {
    id: 4, label: 'cos(x)', aliases: ['cosx', 'cos x'],
    f:  x => Math.cos(x),
    df: x => -Math.sin(x),
    F:  x => Math.sin(x),
  },
  {
    id: 5, label: 'eˣ', aliases: ['e^x', 'ex', 'exp(x)', 'eˣ'],
    f:  x => Math.exp(x),
    df: x => Math.exp(x),
    F:  x => Math.exp(x),
  },
  {
    id: 6, label: 'ln(x)', aliases: ['lnx', 'ln x', 'log(x)'],
    f:  x => x > 0 ? Math.log(x) : NaN,
    df: x => x > 0 ? 1 / x : NaN,
    F:  x => x > 0 ? x * Math.log(x) - x : NaN,
  },
  {
    id: 7, label: '1/x', aliases: ['x^-1', 'x^(-1)'],
    f:  x => x !== 0 ? 1 / x : NaN,
    df: x => x !== 0 ? -1 / x ** 2 : NaN,
    F:  x => x !== 0 ? Math.log(Math.abs(x)) : NaN,
  },
  {
    id: 8, label: '1/x²', aliases: ['1/x^2', 'x^-2', 'x^(-2)'],
    f:  x => x !== 0 ? 1 / x ** 2 : NaN,
    df: x => x !== 0 ? -2 / x ** 3 : NaN,
    F:  x => x !== 0 ? -1 / x : NaN,
  },
  {
    id: 9, label: '√x', aliases: ['sqrt(x)', 'x^(1/2)', 'x^0.5', '√x'],
    f:  x => x >= 0 ? Math.sqrt(x) : NaN,
    df: x => x > 0 ? 1 / (2 * Math.sqrt(x)) : NaN,
    F:  x => x >= 0 ? (2 / 3) * x ** 1.5 : NaN,
  },
  {
    id: 10, label: '|x|', aliases: ['abs(x)', 'absolutevalue', '|x|'],
    f:  x => Math.abs(x),
    df: x => x > 0 ? 1 : x < 0 ? -1 : NaN,
    F:  x => x * Math.abs(x) / 2,
  },
  {
    id: 11, label: 'x·sin(x)', aliases: ['xsin(x)', 'x*sin(x)', 'xsinx'],
    f:  x => x * Math.sin(x),
    df: x => Math.sin(x) + x * Math.cos(x),
    F:  x => Math.sin(x) - x * Math.cos(x),
  },
  {
    id: 12, label: 'x·eˣ', aliases: ['xe^x', 'x*e^x', 'xex', 'x·eˣ'],
    f:  x => x * Math.exp(x),
    df: x => Math.exp(x) * (x + 1),
    F:  x => Math.exp(x) * (x - 1),
  },
  {
    id: 13, label: 'sin(x)/x', aliases: ['sinc(x)', 'sincx'],
    f:  x => x !== 0 ? Math.sin(x) / x : 1,
    df: x => x !== 0 ? (x * Math.cos(x) - Math.sin(x)) / x ** 2 : 0,
    F:  x => NaN,
  },
  {
    id: 14, label: 'x²·sin(x)', aliases: ['x^2*sin(x)', 'x^2sinx', 'x²sin(x)'],
    f:  x => x ** 2 * Math.sin(x),
    df: x => 2 * x * Math.sin(x) + x ** 2 * Math.cos(x),
    F:  x => 2 * x * Math.sin(x) - (x ** 2 - 2) * Math.cos(x),
  },
  {
    id: 15, label: 'tan(x)', aliases: ['tanx', 'tan x'],
    f:  x => { const v = Math.tan(x); return Math.abs(v) > 100 ? NaN : v },
    df: x => { const c = Math.cos(x); return Math.abs(c) < 0.01 ? NaN : 1 / c ** 2 },
    F:  x => { const c = Math.cos(x); return Math.abs(c) < 0.01 ? NaN : -Math.log(Math.abs(c)) },
  },
  {
    id: 16, label: 'arctan(x)', aliases: ['atan(x)', 'tan^-1(x)', 'tan^(-1)(x)'],
    f:  x => Math.atan(x),
    df: x => 1 / (1 + x ** 2),
    F:  x => x * Math.atan(x) - 0.5 * Math.log(1 + x ** 2),
  },
  {
    id: 17, label: 'x^(1/3)', aliases: ['cbrt(x)', 'cuberootofx'],
    f:  x => Math.cbrt(x),
    df: x => x !== 0 ? (1 / 3) * Math.abs(x) ** (-2 / 3) * Math.sign(x) : NaN,
    F:  x => (3 / 4) * Math.cbrt(x) ** 4,
  },
  {
    id: 18, label: '2ˣ', aliases: ['2^x', '2ˣ'],
    f:  x => Math.pow(2, x),
    df: x => Math.pow(2, x) * Math.log(2),
    F:  x => Math.pow(2, x) / Math.log(2),
  },
  {
    id: 19, label: 'x²-x', aliases: ['x^2-x', 'x^2-x'],
    f:  x => x ** 2 - x,
    df: x => 2 * x - 1,
    F:  x => x ** 3 / 3 - x ** 2 / 2,
  },
  {
    id: 20, label: 'arcsin(x)', aliases: ['asin(x)', 'sin^-1(x)', 'sin^(-1)(x)'],
    f:  x => Math.abs(x) <= 1 ? Math.asin(x) : NaN,
    df: x => Math.abs(x) < 1 ? 1 / Math.sqrt(1 - x ** 2) : NaN,
    F:  x => Math.abs(x) <= 1 ? x * Math.asin(x) + Math.sqrt(1 - x ** 2) : NaN,
  },
];

const DIFFICULTY = {
  easy: {
    label: 'Easy',
    numFunctions: 1,
    bank: [1, 2, 3, 5, 9],
    nastyGuarantee: null,
  },
  medium: {
    label: 'Medium',
    numFunctions: 2,
    bank: [1, 2, 3, 4, 5, 6, 7, 9, 10, 16],
    nastyGuarantee: { mustIncludeOneOf: [6, 7, 9, 10] },
  },
  hard: {
    label: 'Hard',
    numFunctions: 3,
    bank: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 19],
    nastyGuarantee: {
      mustIncludeOneOf: [3, 4, 15],
      mustIncludeAnotherOf: [11, 12],
    },
  },
  chaos: {
    label: 'Chaos',
    numFunctions: 4,
    bank: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    nastyGuarantee: { mustIncludeOneOf: [13, 14, 20] },
  },
};

const FUNCTION_COLORS = ['#00ff88', '#ff6b6b', '#66b3ff', '#ffd700'];

function selectFunctions(difficulty) {
  const { bank, numFunctions, nastyGuarantee } = DIFFICULTY[difficulty];
  const selected = [];

  if (nastyGuarantee) {
    const nastyPool = nastyGuarantee.mustIncludeOneOf.filter(id => bank.includes(id));
    const nastyPick = nastyPool[Math.floor(Math.random() * nastyPool.length)];
    selected.push(nastyPick);

    if (nastyGuarantee.mustIncludeAnotherOf) {
      const secondPool = nastyGuarantee.mustIncludeAnotherOf.filter(
        id => bank.includes(id) && !selected.includes(id)
      );
      const secondPick = secondPool[Math.floor(Math.random() * secondPool.length)];
      selected.push(secondPick);
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
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    try {
      const y = fn(x);
      if (isFinite(y) && !isNaN(y) && y >= yMin && y <= yMax) return true;
    } catch { continue; }
  }
  return false;
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
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
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

function DifficultyScreen({ onSelect }) {
  const tiers = [
    { key: 'easy',   label: 'Easy',   desc: '1 function · familiar curves' },
    { key: 'medium', label: 'Medium', desc: '2 functions · domain restrictions' },
    { key: 'hard',   label: 'Hard',   desc: '3 functions · asymptotes & products' },
    { key: 'chaos',  label: 'Chaos',  desc: '4 functions · no mercy' },
  ];
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e0e0e0',
      fontFamily: "'Courier New', Courier, monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
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
      <p style={{ color: '#557', letterSpacing: '0.15em', fontSize: 13, margin: 0 }}>
        SELECT DIFFICULTY
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
        {tiers.map(t => (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
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
            <span style={{ fontWeight: 700, letterSpacing: '0.1em' }}>{t.label}</span>
            <span style={{ fontSize: 12, color: '#557' }}>{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeSelectScreen({ difficulty, onSelect, onBack }) {
  const modes = [
    { key: 'solo', label: 'SOLO', desc: 'Identify the hidden functions' },
    { key: '1v1',  label: '1v1',  desc: 'Pass-and-play · one shot, then swap' },
  ];
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e0e0e0',
      fontFamily: "'Courier New', Courier, monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
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
      <p style={{ color: '#557', letterSpacing: '0.15em', fontSize: 13, margin: 0 }}>
        SELECT MODE ·{' '}
        <span style={{ color: '#00ff88' }}>{DIFFICULTY[difficulty].label.toUpperCase()}</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
        {modes.map(m => (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
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
            <span style={{ fontWeight: 700, letterSpacing: '0.1em' }}>{m.label}</span>
            <span style={{ fontSize: 12, color: '#557' }}>{m.desc}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onBack}
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
        ← CHANGE DIFFICULTY
      </button>
    </div>
  );
}

function PassScreen({ toPlayer, bonusTurn, onContinue }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050508',
      color: '#e0e0e0',
      fontFamily: "'Courier New', Courier, monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}>
      {bonusTurn && (
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

// ─────────────────────────────────────────────────────────────
// Shared sub-components for game views
// ─────────────────────────────────────────────────────────────

function FunctionBankPanel({ difficulty, show, onToggle }) {
  return (
    <div style={{ marginBottom: 16, width: '100%', maxWidth: 560 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '9px 16px',
          background: show ? '#001a0d' : '#111124',
          border: `2px solid ${show ? '#00ff88' : '#2a2a4a'}`,
          borderRadius: show ? '6px 6px 0 0' : 6,
          color: show ? '#00ff88' : '#668',
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.1em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: show ? '0 0 12px #00ff8833' : 'none',
          transition: 'all 0.15s',
        }}
      >
        <span>FUNCTION BANK</span>
        <span style={{ fontSize: 11 }}>{show ? '▲ HIDE' : '▼ SHOW'}</span>
      </button>
      {show && (
        <div style={{
          background: '#0d0d1a',
          border: '2px solid #00ff88',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {DIFFICULTY[difficulty].bank.map(id => {
            const fn = FUNCTION_LIBRARY.find(f => f.id === id);
            return (
              <span
                key={id}
                style={{
                  padding: '4px 10px',
                  background: '#0a0a1a',
                  border: '1px solid #2a2a4a',
                  borderRadius: 4,
                  fontSize: 12,
                  color: '#aac',
                  fontFamily: 'inherit',
                  letterSpacing: '0.05em',
                }}
              >
                {fn.label}
              </span>
            );
          })}
        </div>
      )}
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

function ShotModeButtons({ shotMode, onChange }) {
  const modes = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {modes.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: '10px 20px',
            background: shotMode === key ? '#00ff1122' : '#111124',
            border: `2px solid ${shotMode === key ? '#00ff88' : '#2a2a4a'}`,
            borderRadius: 6,
            color: shotMode === key ? '#00ff88' : '#668',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            boxShadow: shotMode === key ? '0 0 12px #00ff8844' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function GuessInput({ value, onChange, onSubmit, message, activeFunctions, identifiedIds }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          placeholder="e.g. sin(x), x^2, e^x"
          style={{
            padding: '10px 14px',
            background: '#0d0d1a',
            border: '2px solid #2a2a4a',
            borderRadius: 6,
            color: '#e0e0e0',
            fontFamily: 'inherit',
            fontSize: 14,
            width: 220,
            outline: 'none',
          }}
        />
        <button
          onClick={onSubmit}
          style={{
            padding: '10px 20px',
            background: '#001a0d',
            border: '2px solid #00ff88',
            borderRadius: 6,
            color: '#00ff88',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 10px #00ff8833',
            transition: 'all 0.15s',
          }}
        >
          SUBMIT
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#557', letterSpacing: '0.1em' }}>REMAINING:</span>
        {activeFunctions.map(({ fn, color }) => {
          const found = identifiedIds.includes(fn.id);
          return (
            <span
              key={fn.id}
              style={{
                color: found ? '#222' : color,
                fontSize: 20,
                textShadow: found ? 'none' : `0 0 8px ${color}`,
                transition: 'color 0.3s',
              }}
            >
              ●
            </span>
          );
        })}
      </div>
      {message && (
        <div style={{
          marginTop: 8,
          color: message === 'Already found!' ? '#ffd700' : '#ff4444',
          fontSize: 13,
          letterSpacing: '0.05em',
        }}>
          {message}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────

export default function App() {
  // phase: 'difficulty' | 'mode' | 'solo' | 'mp' | 'pass'
  const [phase, setPhase] = useState('difficulty');
  const [difficulty, setDifficulty] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [showFunctionBank, setShowFunctionBank] = useState(false);

  // ── Solo state ──
  const [activeFunctions, setActiveFunctions] = useState([]);
  const [grid, setGrid] = useState(initGrid);
  const [shotMode, setShotMode] = useState('f');
  const [guess, setGuess] = useState('');
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');

  // ── 1v1 / bot state ──
  // p1Slot: P1's hidden functions + grid where P2 fires
  // p2Slot: P2's hidden functions + grid where P1 fires
  const [p1Slot, setP1Slot] = useState(null);
  const [p2Slot, setP2Slot] = useState(null);
  const [mpP1Identified, setMpP1Identified] = useState([]); // fnIds P1 guessed from p2Slot
  const [mpP2Identified, setMpP2Identified] = useState([]); // fnIds P2 guessed from p1Slot
  const [mpCurrentPlayer, setMpCurrentPlayer] = useState(1);
  const [mpPassTo, setMpPassTo] = useState(null);
  const [mpShotMode, setMpShotMode] = useState('f');
  const [mpGuess, setMpGuess] = useState('');
  const [mpMessage, setMpMessage] = useState('');
  const [mpWinner, setMpWinner] = useState(null); // 1 | 2
  const [mpShotFiredThisTurn, setMpShotFiredThisTurn] = useState(false);
  const [mpBonusTurnsRemaining, setMpBonusTurnsRemaining] = useState(0);
  const [mpNextPassIsBonusTurn, setMpNextPassIsBonusTurn] = useState(false);

  // ── Navigation ──

  function handleDifficultySelect(diff) {
    setDifficulty(diff);
    setPhase('mode');
  }

  function handleModeSelect(mode) {
    setGameMode(mode);
    setShowFunctionBank(false);

    if (mode === 'solo') {
      setActiveFunctions(selectFunctions(difficulty));
      setGrid(initGrid());
      setShotMode('f');
      setGuess('');
      setWon(false);
      setMessage('');
      setPhase('solo');
    } else {
      // 1v1
      setP1Slot({ functions: selectFunctions(difficulty), grid: initGrid() });
      setP2Slot({ functions: selectFunctions(difficulty), grid: initGrid() });
      setMpP1Identified([]);
      setMpP2Identified([]);
      setMpCurrentPlayer(1);
      setMpPassTo(null);
      setMpShotMode('f');
      setMpGuess('');
      setMpMessage('');
      setMpWinner(null);
      setMpShotFiredThisTurn(false);
      setMpBonusTurnsRemaining(0);
      setMpNextPassIsBonusTurn(false);
      setPhase('mp');
    }
  }

  function goHome() {
    setPhase('difficulty');
    setDifficulty(null);
    setGameMode(null);
    setShowFunctionBank(false);
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

  function handleGuess() {
    const normalized = guess.trim().toLowerCase().replace(/\s/g, '');
    if (!normalized) return;

    const alreadyGuessed = activeFunctions.find(({ fn, guessed }) => {
      if (!guessed) return false;
      return [fn.label, ...fn.aliases].map(s => s.toLowerCase().replace(/\s/g, '')).includes(normalized);
    });
    if (alreadyGuessed) { setMessage('Already found!'); return; }

    const match = activeFunctions.find(({ fn, guessed }) => {
      if (guessed) return false;
      return [fn.label, ...fn.aliases].map(s => s.toLowerCase().replace(/\s/g, '')).includes(normalized);
    });

    if (match) {
      const updated = activeFunctions.map(af =>
        af.fn.id === match.fn.id ? { ...af, guessed: true } : af
      );
      setActiveFunctions(updated);
      setGuess('');
      setMessage('');
      if (updated.every(af => af.guessed)) setWon(true);
    } else {
      setMessage('Not quite.');
    }
  }

  // ── 1v1 game logic ──

  function mpFireShot(col, row) {
    if (mpWinner || mpShotFiredThisTurn) return;
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
    setMpShotFiredThisTurn(true);
  }

  function endMpTurn(wrongGuess = false) {
    const nextPlayer = mpCurrentPlayer === 1 ? 2 : 1;
    setMpShotFiredThisTurn(false);
    setMpShotMode('f');
    setMpGuess('');
    setMpMessage('');

    if (wrongGuess && mpBonusTurnsRemaining > 0) {
      // wrong guess during a bonus turn — cancel the bonus, pass back normally
      setMpBonusTurnsRemaining(0);
      setMpPassTo(nextPlayer);
      setMpNextPassIsBonusTurn(false);
    } else if (wrongGuess) {
      // wrong guess on a normal turn — next player gets 2 turns
      setMpBonusTurnsRemaining(1);
      setMpPassTo(nextPlayer);
      setMpNextPassIsBonusTurn(true);
    } else if (mpBonusTurnsRemaining > 0) {
      // normal end during bonus turn — use the bonus
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
    setMpCurrentPlayer(mpPassTo);
    setMpPassTo(null);
    setMpNextPassIsBonusTurn(false);
    setPhase('mp');
  }

  function mpHandleGuess() {
    const normalized = mpGuess.trim().toLowerCase().replace(/\s/g, '');
    if (!normalized) return;

    const isP1 = mpCurrentPlayer === 1;
    const targetSlot = isP1 ? p2Slot : p1Slot;
    const identified = isP1 ? mpP1Identified : mpP2Identified;
    const setIdentified = isP1 ? setMpP1Identified : setMpP2Identified;

    const alreadyFound = targetSlot.functions.find(({ fn }) => {
      if (!identified.includes(fn.id)) return false;
      return [fn.label, ...fn.aliases].map(s => s.toLowerCase().replace(/\s/g, '')).includes(normalized);
    });
    if (alreadyFound) { setMpMessage('Already found!'); return; }

    const match = targetSlot.functions.find(({ fn }) => {
      if (identified.includes(fn.id)) return false;
      return [fn.label, ...fn.aliases].map(s => s.toLowerCase().replace(/\s/g, '')).includes(normalized);
    });

    if (match) {
      const newIdentified = [...identified, match.fn.id];
      setIdentified(newIdentified);
      setMpGuess('');
      setMpMessage('');
      if (newIdentified.length === targetSlot.functions.length) {
        setMpWinner(isP1 ? 1 : 2);
      }
      // correct guess — stay in turn, can guess again
    } else {
      // wrong guess — end turn and skip next player
      endMpTurn(true);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Routing
  // ─────────────────────────────────────────────────────────────

  if (phase === 'difficulty') {
    return <DifficultyScreen onSelect={handleDifficultySelect} />;
  }

  if (phase === 'mode') {
    return (
      <ModeSelectScreen
        difficulty={difficulty}
        onSelect={handleModeSelect}
        onBack={() => setPhase('difficulty')}
      />
    );
  }

  if (phase === 'pass') {
    return <PassScreen toPlayer={mpPassTo} bonusTurn={mpNextPassIsBonusTurn} onContinue={handlePassContinue} />;
  }

  // ─────────────────────────────────────────────────────────────
  // Solo / Bot game view
  // ─────────────────────────────────────────────────────────────

  const shotModes = [
    { key: 'f',  label: 'f(x)' },
    { key: 'df', label: "f′(x)" },
    { key: 'F',  label: 'F(x)' },
  ];

  if (phase === 'solo') {
    const diffLabel = DIFFICULTY[difficulty].label;
    const modeLabel = 'SOLO';

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
            {modeLabel} · <span style={{ color: '#00ff88' }}>{diffLabel.toUpperCase()}</span>
            {' · '}IDENTIFY ALL HIDDEN FUNCTIONS
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Panel title="FIRE GRID">
            <FireGrid grid={grid} shotMode={shotMode} onFire={fireShot} disabled={won} />
          </Panel>

          {shotModes.map(({ key, label }) => (
            <Panel key={key} title={label} accent={shotMode === key ? '#00ff88' : undefined}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 50px)', gap: 2 }}>
                {grid.map((rowArr, ri) =>
                  rowArr.map((cell, ci) => (
                    <GraphCell
                      key={`${ri}-${ci}`}
                      shotType={key}
                      col={ci}
                      row={ri}
                      cellShots={cell.shots}
                      activeFunctions={activeFunctions}
                    />
                  ))
                )}
              </div>
            </Panel>
          ))}
        </div>

        <ShotModeButtons shotMode={shotMode} onChange={setShotMode} />

        <FunctionBankPanel
          difficulty={difficulty}
          show={showFunctionBank}
          onToggle={() => setShowFunctionBank(p => !p)}
        />

        {!won ? (
          <GuessInput
            value={guess}
            onChange={v => { setGuess(v); setMessage(''); }}
            onSubmit={handleGuess}
            message={message}
            activeFunctions={activeFunctions}
            identifiedIds={activeFunctions.filter(af => af.guessed).map(af => af.fn.id)}
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

        <div style={{
          marginTop: 28,
          fontSize: 11,
          color: '#445',
          display: 'flex',
          gap: 20,
          letterSpacing: '0.05em',
        }}>
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

    // Win screen
    if (mpWinner !== null) {
      const winnerFunctions = mpWinner === 1 ? p2Slot.functions : p1Slot.functions;
      const loserFunctions  = mpWinner === 1 ? p1Slot.functions : p2Slot.functions;
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0a0a0f',
          color: '#e0e0e0',
          fontFamily: "'Courier New', Courier, monospace",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '24px 16px',
        }}>
          <div style={{
            fontSize: 13,
            letterSpacing: '0.2em',
            color: '#557',
            textTransform: 'uppercase',
          }}>
            MISSION COMPLETE
          </div>
          <div style={{
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: '#00ff88',
            textShadow: '0 0 32px #00ff88aa',
          }}>
            PLAYER {mpWinner} WINS
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#445', letterSpacing: '0.15em', marginBottom: 6 }}>
              ENEMY FUNCTIONS WERE
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {winnerFunctions.map(({ fn, color }) => (
                <span key={fn.id} style={{ color, fontSize: 15, fontWeight: 700, textShadow: `0 0 8px ${color}` }}>
                  {fn.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#445', letterSpacing: '0.15em', marginBottom: 6 }}>
              YOUR FUNCTIONS WERE
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {loserFunctions.map(({ fn, color }) => (
                <span key={fn.id} style={{ color: '#557', fontSize: 15, fontWeight: 700 }}>
                  {fn.label}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={goHome}
            style={{
              marginTop: 16,
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
      );
    }

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
            {' · '}
            <span style={{ color: mpBonusTurnsRemaining > 0 ? '#ffd700' : '#66b3ff', fontWeight: 700 }}>
              PLAYER {mpCurrentPlayer}'S TURN{mpBonusTurnsRemaining > 0 ? ' ★ BONUS' : ''}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#334', marginTop: 4, letterSpacing: '0.08em' }}>
            FIRING AT {enemyLabel}'S GRID · GUESS THEIR FUNCTIONS TO WIN
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Panel title={`${enemyLabel}'S GRID`}>
            <FireGrid
              grid={targetSlot.grid}
              shotMode={mpShotMode}
              onFire={mpFireShot}
              disabled={false}
            />
          </Panel>

          {shotModes.map(({ key, label }) => (
            <Panel key={key} title={label} accent={mpShotMode === key ? '#00ff88' : undefined}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 50px)', gap: 2 }}>
                {targetSlot.grid.map((rowArr, ri) =>
                  rowArr.map((cell, ci) => (
                    <GraphCell
                      key={`${ri}-${ci}`}
                      shotType={key}
                      col={ci}
                      row={ri}
                      cellShots={cell.shots}
                      activeFunctions={targetSlot.functions}
                    />
                  ))
                )}
              </div>
            </Panel>
          ))}
        </div>

        <ShotModeButtons shotMode={mpShotMode} onChange={setMpShotMode} />

        <FunctionBankPanel
          difficulty={difficulty}
          show={showFunctionBank}
          onToggle={() => setShowFunctionBank(p => !p)}
        />

        <GuessInput
          value={mpGuess}
          onChange={v => { setMpGuess(v); setMpMessage(''); }}
          onSubmit={mpHandleGuess}
          message={mpMessage}
          activeFunctions={targetSlot.functions}
          identifiedIds={identified}
        />

        {mpShotFiredThisTurn && (
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
          {mpShotFiredThisTurn
            ? 'Guess a function or end your turn'
            : 'Fire a shot to reveal a square'}
        </div>

        <div style={{
          marginTop: 20,
          fontSize: 11,
          color: '#445',
          display: 'flex',
          gap: 20,
          letterSpacing: '0.05em',
        }}>
          <span><span style={{ color: '#00ff88' }}>●</span> HIT</span>
          <span><span style={{ color: '#ff4444' }}>×</span> MISS</span>
        </div>
      </div>
    );
  }

  return null;
}
