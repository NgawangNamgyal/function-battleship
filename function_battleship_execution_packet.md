# Function Battleship — Claude Code Execution Packet

## Project Overview
A single-player browser game where a hidden function is placed on a 5×5 grid. The player fires shots at grid cells using three shot types — f(x), f′(x), or F(x) — each revealing a graph fragment in its corresponding panel. The player wins by correctly naming the hidden function.

---

## Tech Stack
- **Framework**: React (single `.jsx` file, no build step needed in Claude artifacts)
- **Math**: `mathjs` for expression parsing, symbolic differentiation, and integration
- **Graphing**: HTML Canvas (drawn manually per cell, no chart library — gives precise control over the small cell viewport)
- **Styling**: Tailwind utility classes + inline CSS variables for theming

---

## File Structure
```
index.jsx   ← entire app, single file
```

---

## Game State (React useState)

```js
const [grid, setGrid] = useState(initGrid())         // 5x5, each cell: { hit: false, shotType: null }
const [shotMode, setShotMode] = useState('f')        // 'f' | 'df' | 'F'
const [guess, setGuess] = useState('')               // player's current text guess
const [won, setWon] = useState(false)
const [message, setMessage] = useState('')
```

### Hidden Function (hardcoded for MVP, randomized later)
```js
const HIDDEN = {
  label: 'x^2',
  f:  (x) => x * x,
  df: (x) => 2 * x,
  F:  (x) => (x * x * x) / 3,
}
```

---

## Core Mechanics

### Grid Initialization
```js
function initGrid() {
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => ({
      row, col,
      hitF: false,
      hitDf: false,
      hitF_int: false,
    }))
  )
}
```

### Hit Detection
Each cell maps to an x-range and y-range of the coordinate plane.

```js
// Grid spans x: [-2.5, 2.5], y: [-2.5, 2.5]
// Cell (col, row) maps to:
const X_MIN = -2.5, X_MAX = 2.5
const Y_MIN = -2.5, Y_MAX = 2.5
const CELL_X_RANGE = (X_MAX - X_MIN) / 5  // 1.0 per cell
const CELL_Y_RANGE = (Y_MAX - Y_MIN) / 5  // 1.0 per cell

function cellBounds(col, row) {
  const xMin = X_MIN + col * CELL_X_RANGE
  const xMax = xMin + CELL_X_RANGE
  const yMin = Y_MAX - (row + 1) * CELL_Y_RANGE   // y flipped (row 0 = top)
  const yMax = yMin + CELL_Y_RANGE
  return { xMin, xMax, yMin, yMax }
}

function doesFunctionPassThrough(fn, col, row) {
  const { xMin, xMax, yMin, yMax } = cellBounds(col, row)
  const steps = 100
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin)
    const y = fn(x)
    if (y >= yMin && y <= yMax) return true
  }
  return false
}
```

### Fire Shot
```js
function fireShot(col, row) {
  const fn = shotMode === 'f' ? HIDDEN.f : shotMode === 'df' ? HIDDEN.df : HIDDEN.F
  const hit = doesFunctionPassThrough(fn, col, row)
  // Update grid cell to mark this shotMode as fired (hit or miss)
  setGrid(prev => prev.map((r, ri) =>
    r.map((c, ci) => {
      if (ri === row && ci === col) {
        return { ...c, [`hit_${shotMode}`]: true, [`result_${shotMode}`]: hit }
      }
      return c
    })
  ))
}
```

---

## Graph Rendering (Canvas)

Each revealed cell gets a `<canvas>` in its panel. Draw the function clipped to that cell's coordinate bounds.

```js
function drawFunctionInCell(canvas, fn, col, row) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)

  const { xMin, xMax, yMin, yMax } = cellBounds(col, row)

  // Map math coords → canvas pixels
  const toPixelX = (x) => ((x - xMin) / (xMax - xMin)) * W
  const toPixelY = (y) => H - ((y - yMin) / (yMax - yMin)) * H

  ctx.strokeStyle = '#00ff88'
  ctx.lineWidth = 2
  ctx.beginPath()

  let started = false
  const steps = 200
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin)
    const y = fn(x)
    if (!isFinite(y)) { started = false; continue }
    const px = toPixelX(x)
    const py = toPixelY(y)
    if (!started) { ctx.moveTo(px, py); started = true }
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
}
```

Use `useEffect` to call `drawFunctionInCell` whenever a cell's hit state changes.

---

## Layout — Three Panels

```
┌─────────────────────────────────────────────────────────┐
│  FUNCTION BATTLESHIP                                     │
├──────────────┬──────────────┬──────────────┬────────────┤
│   GRID       │   f(x)       │   f′(x)      │   F(x)     │
│  (5×5 click) │  panel       │  panel       │  panel     │
│              │  (5×5 mini   │  (5×5 mini   │  (5×5 mini │
│              │   canvases)  │   canvases)  │   canvases)│
└──────────────┴──────────────┴──────────────┴────────────┘
│  Shot mode: [f(x)] [f′(x)] [F(x)]                       │
│  Guess: [____________] [Submit]                          │
└─────────────────────────────────────────────────────────┘
```

- **Grid panel**: clickable 5×5 buttons. Hit cells show a color indicator (green = intersects, dark = miss)
- **Three graph panels**: each is a 5×5 grid of small canvases (or blank gray squares). Only cells that have been fired with that shot type show a graph.
- **Shot mode selector**: three buttons, active mode highlighted
- **Guess input**: text field + submit. On correct guess → win screen. On wrong → show message.

---

## Function Library (for MVP → expand later)

Start with 6 functions. Each must have visually distinct f, f′, and F curves:

```js
const FUNCTIONS = [
  { label: 'x^2',    f: x => x**2,          df: x => 2*x,        F: x => x**3/3 },
  { label: 'x^3',    f: x => x**3,          df: x => 3*x**2,     F: x => x**4/4 },
  { label: 'sin(x)', f: x => Math.sin(x),   df: x => Math.cos(x),F: x => -Math.cos(x) },
  { label: 'e^x',    f: x => Math.exp(x),   df: x => Math.exp(x),F: x => Math.exp(x) },
  { label: '1/x',    f: x => 1/x,           df: x => -1/x**2,    F: x => Math.log(Math.abs(x)) },
  { label: 'sqrt(x)',f: x => Math.sqrt(x),  df: x => 1/(2*Math.sqrt(x)), F: x => (2/3)*x**(3/2) },
]
```

On game start, pick one at random. The label is the correct answer.

---

## Win Condition

```js
function handleGuess() {
  const normalized = guess.trim().toLowerCase().replace(/\s/g, '')
  const correct = HIDDEN.label.toLowerCase().replace(/\s/g, '')
  // Accept common aliases: 'x2' → 'x^2', 'sinx' → 'sin(x)', etc.
  if (normalized === correct) {
    setWon(true)
  } else {
    setMessage(`Not quite. Try again.`)
  }
}
```

For MVP, keep string matching simple. Add alias normalization as a stretch goal.

---

## Aesthetic Direction

**Theme**: Dark military/radar. Think sonar screen meets graphing calculator.
- Background: `#0a0a0f` near-black
- Grid: `#1a1a2e` with `#00ff88` neon green for hits, `#ff4444` for misses
- Panels: dark with subtle grid lines, neon curve traces
- Font: monospace for coordinates/labels (`JetBrains Mono` or `Courier New`), bold display font for title
- Shot mode buttons: chunky, toggle-style, glow on active

---

## Build Order for Claude Code

1. **Scaffold**: React app, static 5×5 grid renders, three blank panels
2. **Function + hit detection**: hardcode `x^2`, implement `doesFunctionPassThrough`
3. **Canvas rendering**: `drawFunctionInCell` draws curve in fired cells
4. **Shot mode toggle**: three buttons switch `shotMode` state
5. **Guess + win condition**: text input, string match, win screen
6. **Function randomization**: pick from `FUNCTIONS` array on load
7. **Polish**: colors, animations, miss indicators

---

## Stretch Goals (post-MVP)
- Two-player mode (Player 2 places the function, Player 1 guesses)
- Gun roulette animation when switching shot modes
- Alias normalization for guess input (`x2`, `x squared`, etc.)
- Difficulty levels (expand function library, tighter grid viewport)
- Timer / shot count scoring

---

## Notes for Claude Code
- Keep everything in one `.jsx` file for portability
- Use `useRef` for canvas elements, `useEffect` to redraw on state change
- No external graph libraries — canvas gives exact control over the small cell viewport
- `mathjs` is available in the React artifact environment via CDN if needed for future symbolic work, but hardcoded functions are fine for MVP
