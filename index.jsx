import { useState, useEffect, useRef, useCallback } from "react";

const FUNCTIONS = [
  { label: "x^2",     f: x => x ** 2,              df: x => 2 * x,                   F: x => x ** 3 / 3 },
  { label: "x^3",     f: x => x ** 3,              df: x => 3 * x ** 2,              F: x => x ** 4 / 4 },
  { label: "sin(x)",  f: x => Math.sin(x),         df: x => Math.cos(x),             F: x => -Math.cos(x) },
  { label: "e^x",     f: x => Math.exp(x),         df: x => Math.exp(x),             F: x => Math.exp(x) },
  { label: "1/x",     f: x => 1 / x,              df: x => -1 / x ** 2,             F: x => Math.log(Math.abs(x)) },
  { label: "sqrt(x)", f: x => Math.sqrt(x),       df: x => 1 / (2 * Math.sqrt(x)), F: x => (2 / 3) * x ** (3 / 2) },
];

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
      if (isFinite(y) && y >= yMin && y <= yMax) return true;
    } catch {
      continue;
    }
  }
  return false;
}

function drawFunctionInCell(canvas, fn, col, row) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const { xMin, xMax, yMin, yMax } = cellBounds(col, row);
  const toPixelX = x => ((x - xMin) / (xMax - xMin)) * W;
  const toPixelY = y => H - ((y - yMin) / (yMax - yMin)) * H;

  // subtle axis lines
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 0.5;
  if (yMin <= 0 && yMax >= 0) {
    const py = toPixelY(0);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
  }
  if (xMin <= 0 && xMax >= 0) {
    const px = toPixelX(0);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
  }

  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#00ff88";
  ctx.shadowBlur = 4;
  ctx.beginPath();
  let started = false;
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    let y;
    try { y = fn(x); } catch { started = false; continue; }
    if (!isFinite(y)) { started = false; continue; }
    const px = toPixelX(x);
    const py = toPixelY(y);
    if (!started) { ctx.moveTo(px, py); started = true; }
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function initGrid() {
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => ({
      row, col,
      hit_f: false, result_f: false,
      hit_df: false, result_df: false,
      hit_F: false, result_F: false,
    }))
  );
}

function pickHidden() {
  return FUNCTIONS[Math.floor(Math.random() * FUNCTIONS.length)];
}

// Canvas cell component
function GraphCell({ fn, col, row, fired }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (fired && canvasRef.current && fn) {
      drawFunctionInCell(canvasRef.current, fn, col, row);
    }
  }, [fired, fn, col, row]);

  if (!fired) {
    return (
      <div style={{
        width: 48, height: 48,
        background: "#0d0d1a",
        border: "1px solid #1e1e3a",
        borderRadius: 2,
      }} />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={48}
      style={{
        border: "1px solid #00ff8844",
        borderRadius: 2,
        display: "block",
      }}
    />
  );
}

export default function App() {
  const [hidden, setHidden] = useState(() => pickHidden());
  const [grid, setGrid] = useState(initGrid);
  const [shotMode, setShotMode] = useState("f");
  const [guess, setGuess] = useState("");
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState("");
  const [shotsLeft, setShotsLeft] = useState(15);

  const fnForMode = useCallback((mode) => {
    if (mode === "f")  return hidden.f;
    if (mode === "df") return hidden.df;
    return hidden.F;
  }, [hidden]);

  function fireShot(col, row) {
    if (won) return;
    const key = shotMode === "f" ? "f" : shotMode === "df" ? "df" : "F";
    const cell = grid[row][col];
    if (cell[`hit_${key}`]) return; // already fired this mode here

    const hit = doesFunctionPassThrough(fnForMode(shotMode), col, row);
    setGrid(prev => prev.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          return { ...c, [`hit_${key}`]: true, [`result_${key}`]: hit };
        }
        return c;
      })
    ));
    setShotsLeft(s => s - 1);
  }

  function handleGuess() {
    const normalized = guess.trim().toLowerCase().replace(/\s+/g, "").replace(/\*/g, "");
    const correct = hidden.label.toLowerCase().replace(/\s+/g, "").replace(/\*/g, "");
    // common aliases
    const aliases = {
      "x2": "x^2", "xsquared": "x^2", "x²": "x^2",
      "x3": "x^3", "xcubed": "x^3", "x³": "x^3",
      "sinx": "sin(x)", "cosx": "cos(x)",
      "ex": "e^x", "exp(x)": "e^x",
      "sqrtx": "sqrt(x)", "√x": "sqrt(x)",
    };
    const n = aliases[normalized] || normalized;
    if (n === correct) {
      setWon(true);
      setMessage("");
    } else {
      setMessage("Not quite. Try again.");
    }
  }

  function newGame() {
    setHidden(pickHidden());
    setGrid(initGrid());
    setShotMode("f");
    setGuess("");
    setWon(false);
    setMessage("");
    setShotsLeft(15);
  }

  const shotModes = [
    { key: "f",  label: "f(x)" },
    { key: "df", label: "f′(x)" },
    { key: "F",  label: "F(x)" },
  ];

  const panelFns = {
    f: hidden.f,
    df: hidden.df,
    F: hidden.F,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e0e0e0",
      fontFamily: "'Courier New', Courier, monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 16px",
    }}>
      {/* Title */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <h1 style={{
          fontSize: 28,
          letterSpacing: "0.2em",
          color: "#00ff88",
          textShadow: "0 0 16px #00ff88aa",
          margin: 0,
          fontWeight: 900,
          textTransform: "uppercase",
        }}>
          Function Battleship
        </h1>
        <div style={{ fontSize: 11, color: "#557", marginTop: 4, letterSpacing: "0.1em" }}>
          IDENTIFY THE HIDDEN FUNCTION
        </div>
      </div>

      {/* Main panels row */}
      <div style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 20,
      }}>
        {/* GRID PANEL */}
        <Panel title="FIRE GRID">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 52px)", gap: 4 }}>
            {grid.map((rowArr, ri) =>
              rowArr.map((cell, ci) => {
                const key = shotMode === "f" ? "f" : shotMode === "df" ? "df" : "F";
                const fired = cell[`hit_${key}`];
                const isHit = cell[`result_${key}`];
                let bg = "#111124";
                let border = "1px solid #1e1e3a";
                let glow = "none";
                if (fired && isHit)  { bg = "#003322"; border = "1px solid #00ff88"; glow = "0 0 8px #00ff8866"; }
                if (fired && !isHit) { bg = "#220011"; border = "1px solid #ff4444"; }
                return (
                  <button
                    key={`${ri}-${ci}`}
                    onClick={() => fireShot(ci, ri)}
                    disabled={won}
                    style={{
                      width: 52, height: 52,
                      background: bg,
                      border,
                      borderRadius: 4,
                      cursor: won ? "default" : "crosshair",
                      boxShadow: glow,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: fired ? (isHit ? "#00ff88" : "#ff4444") : "#333",
                      fontFamily: "inherit",
                      transition: "background 0.15s, box-shadow 0.15s",
                    }}
                  >
                    {fired ? (isHit ? "●" : "×") : `${ci},${ri}`}
                  </button>
                );
              })
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#557", textAlign: "center" }}>
            Shots remaining: <span style={{ color: shotsLeft < 5 ? "#ff4444" : "#00ff88" }}>{shotsLeft}</span>
          </div>
        </Panel>

        {/* Three graph panels */}
        {shotModes.map(({ key, label }) => (
          <Panel key={key} title={label} accent={shotMode === key ? "#00ff88" : undefined}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 50px)", gap: 2 }}>
              {grid.map((rowArr, ri) =>
                rowArr.map((cell, ci) => {
                  const hitKey = `hit_${key}`;
                  const fired = cell[hitKey];
                  return (
                    <GraphCell
                      key={`${ri}-${ci}`}
                      fn={panelFns[key]}
                      col={ci}
                      row={ri}
                      fired={fired}
                    />
                  );
                })
              )}
            </div>
          </Panel>
        ))}
      </div>

      {/* Shot mode selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {shotModes.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setShotMode(key)}
            style={{
              padding: "10px 20px",
              background: shotMode === key ? "#00ff1122" : "#111124",
              border: `2px solid ${shotMode === key ? "#00ff88" : "#2a2a4a"}`,
              borderRadius: 6,
              color: shotMode === key ? "#00ff88" : "#668",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.05em",
              boxShadow: shotMode === key ? "0 0 12px #00ff8844" : "none",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Guess row */}
      {!won ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={guess}
            onChange={e => { setGuess(e.target.value); setMessage(""); }}
            onKeyDown={e => e.key === "Enter" && handleGuess()}
            placeholder="e.g. sin(x), x^2, e^x"
            style={{
              padding: "10px 14px",
              background: "#0d0d1a",
              border: "2px solid #2a2a4a",
              borderRadius: 6,
              color: "#e0e0e0",
              fontFamily: "inherit",
              fontSize: 14,
              width: 220,
              outline: "none",
            }}
          />
          <button
            onClick={handleGuess}
            style={{
              padding: "10px 20px",
              background: "#001a0d",
              border: "2px solid #00ff88",
              borderRadius: 6,
              color: "#00ff88",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 0 10px #00ff8833",
              transition: "all 0.15s",
            }}
          >
            SUBMIT
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 24,
            color: "#00ff88",
            textShadow: "0 0 20px #00ff88",
            fontWeight: 900,
            letterSpacing: "0.15em",
            marginBottom: 12,
          }}>
            TARGET IDENTIFIED: {hidden.label}
          </div>
          <button
            onClick={newGame}
            style={{
              padding: "10px 28px",
              background: "#001a0d",
              border: "2px solid #00ff88",
              borderRadius: 6,
              color: "#00ff88",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 0 14px #00ff8855",
            }}
          >
            NEW MISSION
          </button>
        </div>
      )}

      {message && (
        <div style={{ marginTop: 10, color: "#ff4444", fontSize: 13, letterSpacing: "0.05em" }}>
          {message}
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: 28,
        fontSize: 11,
        color: "#445",
        display: "flex",
        gap: 20,
        letterSpacing: "0.05em",
      }}>
        <span><span style={{ color: "#00ff88" }}>●</span> HIT</span>
        <span><span style={{ color: "#ff4444" }}>×</span> MISS</span>
        <span style={{ color: "#336" }}>Click grid cell to fire with selected shot mode</span>
      </div>
    </div>
  );
}

function Panel({ title, children, accent }) {
  return (
    <div style={{
      background: "#0d0d1a",
      border: `1px solid ${accent ? "#00ff8844" : "#1e1e3a"}`,
      borderRadius: 8,
      padding: 14,
      boxShadow: accent ? "0 0 16px #00ff8811" : "none",
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: "0.2em",
        color: accent || "#445",
        marginBottom: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        textShadow: accent ? "0 0 8px #00ff8888" : "none",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}