# Function Battleship v2 — Claude Code Execution Packet

## What's New in v2
- Full 20-function library with hardcoded f, f′, F implementations
- Difficulty selector (Easy / Medium / Hard / Chaos) controlling both bank composition and number of functions on grid
- Multi-function support with color coding across all three panels
- Minimum nastiness guarantees per tier
- arcsin replaces cosh (students haven't covered hyperbolic functions)

---

## Tech Stack (unchanged)
- **Framework**: React, single `.jsx` file
- **Math**: hardcoded JS functions (no mathjs needed for MVP)
- **Graphing**: HTML Canvas per cell
- **Styling**: Tailwind + CSS variables

---

## Function Library

All 20 functions. Each entry includes the JS implementation for f, df (f′), and F.
Handle undefined/infinite values by skipping those points in the draw loop (no crash, no draw).

```js
const FUNCTION_LIBRARY = [
  {
    id: 1,
    label: 'x²',
    aliases: ['x^2', 'x2'],
    f:  x => x ** 2,
    df: x => 2 * x,
    F:  x => x ** 3 / 3,
  },
  {
    id: 2,
    label: 'x³',
    aliases: ['x^3', 'x3'],
    f:  x => x ** 3,
    df: x => 3 * x ** 2,
    F:  x => x ** 4 / 4,
  },
  {
    id: 3,
    label: 'sin(x)',
    aliases: ['sinx', 'sin x'],
    f:  x => Math.sin(x),
    df: x => Math.cos(x),
    F:  x => -Math.cos(x),
  },
  {
    id: 4,
    label: 'cos(x)',
    aliases: ['cosx', 'cos x'],
    f:  x => Math.cos(x),
    df: x => -Math.sin(x),
    F:  x => Math.sin(x),
  },
  {
    id: 5,
    label: 'eˣ',
    aliases: ['e^x', 'ex', 'exp(x)'],
    f:  x => Math.exp(x),
    df: x => Math.exp(x),
    F:  x => Math.exp(x),
  },
  {
    id: 6,
    label: 'ln(x)',
    aliases: ['lnx', 'ln x', 'log(x)'],
    f:  x => x > 0 ? Math.log(x) : NaN,
    df: x => x > 0 ? 1 / x : NaN,
    F:  x => x > 0 ? x * Math.log(x) - x : NaN,
  },
  {
    id: 7,
    label: '1/x',
    aliases: ['1/x', 'x^-1', 'x^(-1)'],
    f:  x => x !== 0 ? 1 / x : NaN,
    df: x => x !== 0 ? -1 / x ** 2 : NaN,
    F:  x => x !== 0 ? Math.log(Math.abs(x)) : NaN,
  },
  {
    id: 8,
    label: '1/x²',
    aliases: ['1/x^2', 'x^-2', 'x^(-2)'],
    f:  x => x !== 0 ? 1 / x ** 2 : NaN,
    df: x => x !== 0 ? -2 / x ** 3 : NaN,
    F:  x => x !== 0 ? -1 / x : NaN,
  },
  {
    id: 9,
    label: '√x',
    aliases: ['sqrt(x)', 'x^(1/2)', 'x^0.5'],
    f:  x => x >= 0 ? Math.sqrt(x) : NaN,
    df: x => x > 0 ? 1 / (2 * Math.sqrt(x)) : NaN,
    F:  x => x >= 0 ? (2 / 3) * x ** 1.5 : NaN,
  },
  {
    id: 10,
    label: '|x|',
    aliases: ['abs(x)', 'absolute value'],
    f:  x => Math.abs(x),
    df: x => x > 0 ? 1 : x < 0 ? -1 : NaN,  // undefined at 0
    F:  x => x * Math.abs(x) / 2,
  },
  {
    id: 11,
    label: 'x·sin(x)',
    aliases: ['xsin(x)', 'x*sin(x)', 'x sin x'],
    f:  x => x * Math.sin(x),
    df: x => Math.sin(x) + x * Math.cos(x),
    F:  x => Math.sin(x) - x * Math.cos(x),
  },
  {
    id: 12,
    label: 'x·eˣ',
    aliases: ['xe^x', 'x*e^x', 'xex'],
    f:  x => x * Math.exp(x),
    df: x => Math.exp(x) * (x + 1),
    F:  x => Math.exp(x) * (x - 1),
  },
  {
    id: 13,
    label: 'sin(x)/x',
    aliases: ['sinc(x)', 'sin(x)/x'],
    f:  x => x !== 0 ? Math.sin(x) / x : 1,  // limit at 0 is 1
    df: x => x !== 0 ? (x * Math.cos(x) - Math.sin(x)) / x ** 2 : 0,
    F:  x => NaN,  // Si(x) — not elementary; skip F panel for this one or approximate numerically
  },
  {
    id: 14,
    label: 'x²·sin(x)',
    aliases: ['x^2*sin(x)', 'x^2 sin x'],
    f:  x => x ** 2 * Math.sin(x),
    df: x => 2 * x * Math.sin(x) + x ** 2 * Math.cos(x),
    F:  x => 2 * x * Math.sin(x) - (x ** 2 - 2) * Math.cos(x),
  },
  {
    id: 15,
    label: 'tan(x)',
    aliases: ['tanx', 'tan x'],
    f:  x => {
      const v = Math.tan(x)
      return Math.abs(v) > 100 ? NaN : v   // clip near asymptotes
    },
    df: x => {
      const c = Math.cos(x)
      return Math.abs(c) < 0.01 ? NaN : 1 / c ** 2
    },
    F:  x => {
      const c = Math.cos(x)
      return Math.abs(c) < 0.01 ? NaN : -Math.log(Math.abs(c))
    },
  },
  {
    id: 16,
    label: 'arctan(x)',
    aliases: ['atan(x)', 'tan^-1(x)', 'tan^(-1)(x)'],
    f:  x => Math.atan(x),
    df: x => 1 / (1 + x ** 2),
    F:  x => x * Math.atan(x) - 0.5 * Math.log(1 + x ** 2),
  },
  {
    id: 17,
    label: 'x^(1/3)',
    aliases: ['cbrt(x)', 'x^(1/3)', 'cube root of x'],
    f:  x => Math.cbrt(x),
    df: x => x !== 0 ? (1 / 3) * Math.abs(x) ** (-2/3) * Math.sign(x) : NaN,
    F:  x => (3 / 4) * Math.cbrt(x) ** 4,
  },
  {
    id: 18,
    label: '2ˣ',
    aliases: ['2^x'],
    f:  x => Math.pow(2, x),
    df: x => Math.pow(2, x) * Math.log(2),
    F:  x => Math.pow(2, x) / Math.log(2),
  },
  {
    id: 19,
    label: 'x²-x',
    aliases: ['x^2-x', 'x^2 - x'],
    f:  x => x ** 2 - x,
    df: x => 2 * x - 1,
    F:  x => x ** 3 / 3 - x ** 2 / 2,
  },
  {
    id: 20,
    label: 'arcsin(x)',
    aliases: ['asin(x)', 'sin^-1(x)', 'sin^(-1)(x)'],
    f:  x => Math.abs(x) <= 1 ? Math.asin(x) : NaN,
    df: x => Math.abs(x) < 1 ? 1 / Math.sqrt(1 - x ** 2) : NaN,
    F:  x => Math.abs(x) <= 1 ? x * Math.asin(x) + Math.sqrt(1 - x ** 2) : NaN,
  },
]
```

### Special case: sin(x)/x (id 13)
F(x) = Si(x), the sine integral — not expressible in elementary functions. Two options:
- **Simple**: leave the F panel blank for this function with a tooltip "F(x) not elementary"
- **Better**: numerically approximate Si(x) via Simpson's rule at render time

Recommended: leave blank for MVP, add numerical approximation later. Make sure the guess input still accepts 'sin(x)/x' as correct.

---

## Difficulty System

### Tier Definitions

```js
const DIFFICULTY = {
  easy: {
    label: 'Easy',
    numFunctions: 1,
    bank: [1, 2, 3, 5, 9],  // x², x³, sin, eˣ, √x
    nastyGuarantee: null,
  },
  medium: {
    label: 'Medium',
    numFunctions: 2,
    bank: [1, 2, 3, 4, 5, 6, 7, 9, 10, 16],  // adds cos, ln, 1/x, |x|, arctan
    nastyGuarantee: {
      // always include at least one domain-restricted function
      mustIncludeOneOf: [6, 7, 9, 10],
    },
  },
  hard: {
    label: 'Hard',
    numFunctions: 3,
    bank: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 19],
    nastyGuarantee: {
      // always include one trig AND one product function
      mustIncludeOneOf: [3, 4, 15],   // trig
      mustIncludeAnotherOf: [11, 12], // product
    },
  },
  chaos: {
    label: 'Chaos',
    numFunctions: 4,
    bank: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    nastyGuarantee: {
      // always include at least one truly cruel function
      mustIncludeOneOf: [13, 14, 20],  // sin(x)/x, x²sin(x), arcsin
    },
  },
}
```

### Selection Algorithm

```js
function selectFunctions(difficulty) {
  const { bank, numFunctions, nastyGuarantee } = DIFFICULTY[difficulty]
  const selected = []

  if (nastyGuarantee) {
    // Pick one guaranteed "nasty" function first
    const nastyPool = nastyGuarantee.mustIncludeOneOf.filter(id => bank.includes(id))
    const nastyPick = nastyPool[Math.floor(Math.random() * nastyPool.length)]
    selected.push(nastyPick)

    // If hard tier, also guarantee a second category
    if (nastyGuarantee.mustIncludeAnotherOf) {
      const secondPool = nastyGuarantee.mustIncludeAnotherOf.filter(
        id => bank.includes(id) && !selected.includes(id)
      )
      const secondPick = secondPool[Math.floor(Math.random() * secondPool.length)]
      selected.push(secondPick)
    }
  }

  // Fill remaining slots randomly from bank
  const remaining = bank.filter(id => !selected.includes(id))
  while (selected.length < numFunctions) {
    const idx = Math.floor(Math.random() * remaining.length)
    selected.push(remaining.splice(idx, 1)[0])
  }

  return selected.map(id => FUNCTION_LIBRARY.find(f => f.id === id))
}
```

---

## Multi-Function State

### Color Palette (one per function slot)
```js
const FUNCTION_COLORS = ['#00ff88', '#ff6b6b', '#66b3ff', '#ffd700']
// green, red, blue, gold — all legible on dark background
```

### Game State
```js
const [activeFunctions, setActiveFunctions] = useState([])  // array of {fn, color, guessed}
const [grid, setGrid] = useState(initGrid())
const [shotMode, setShotMode] = useState('f')
const [won, setWon] = useState(false)
```

### Grid Cell Structure
```js
// Each cell tracks hits per shot type per function
{
  row: 0,
  col: 0,
  shots: {
    f:  { fired: false, hits: [] },   // hits: array of { fnId, color }
    df: { fired: false, hits: [] },
    F:  { fired: false, hits: [] },
  }
}
```

### Fire Shot (multi-function)
```js
function fireShot(col, row) {
  const fnKey = shotMode  // 'f' | 'df' | 'F'
  const hits = activeFunctions
    .filter(({ fn }) => doesFunctionPassThrough(fn[fnKey], col, row))
    .map(({ fn, color }) => ({ fnId: fn.id, color }))

  setGrid(prev => prev.map((r, ri) =>
    r.map((c, ci) => {
      if (ri !== row || ci !== col) return c
      return {
        ...c,
        shots: {
          ...c.shots,
          [fnKey]: { fired: true, hits }
        }
      }
    })
  ))
}
```

---

## Canvas Rendering (multi-function)

Each panel cell draws all hit curves in their respective colors.

```js
function drawCell(canvas, shotType, col, row, cellShots) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)

  // Draw grid cell background
  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, W, H)

  if (!cellShots[shotType].fired) return

  const { xMin, xMax, yMin, yMax } = cellBounds(col, row)
  const toPixelX = x => ((x - xMin) / (xMax - xMin)) * W
  const toPixelY = y => H - ((y - yMin) / (yMax - yMin)) * H

  // If miss (no hits), show red tint
  if (cellShots[shotType].hits.length === 0) {
    ctx.fillStyle = 'rgba(255, 50, 50, 0.15)'
    ctx.fillRect(0, 0, W, H)
    return
  }

  // Draw each hit curve in its color
  cellShots[shotType].hits.forEach(({ fnId, color }) => {
    const fn = activeFunctions.find(af => af.fn.id === fnId)
    if (!fn) return
    const func = shotType === 'f' ? fn.fn.f : shotType === 'df' ? fn.fn.df : fn.fn.F

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    let started = false
    const steps = 300
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin)
      const y = func(x)
      if (!isFinite(y) || isNaN(y)) { started = false; continue }
      const px = toPixelX(x)
      const py = toPixelY(y)
      if (py < -H || py > 2 * H) { started = false; continue }  // clip wild values
      if (!started) { ctx.moveTo(px, py); started = true }
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  })
}
```

---

## Difficulty Selector UI

Render before game starts. Single screen, four buttons.

```jsx
function DifficultyScreen({ onSelect }) {
  const tiers = [
    { key: 'easy',   label: 'Easy',   desc: '1 function · familiar curves' },
    { key: 'medium', label: 'Medium', desc: '2 functions · domain restrictions' },
    { key: 'hard',   label: 'Hard',   desc: '3 functions · asymptotes & products' },
    { key: 'chaos',  label: 'Chaos',  desc: '4 functions · no mercy' },
  ]
  return (
    <div className="difficulty-screen">
      <h1>FUNCTION BATTLESHIP</h1>
      <p>Select difficulty</p>
      {tiers.map(t => (
        <button key={t.key} onClick={() => onSelect(t.key)}>
          <span>{t.label}</span>
          <span>{t.desc}</span>
        </button>
      ))}
    </div>
  )
}
```

---

## Guess Input (multi-function)

Players must identify all functions to win. Show one input per unguessed function, or a single input that checks against all remaining.

Recommended: single input, checks against all unguessed functions, eliminates on correct match.

```js
function handleGuess(input) {
  const normalized = input.trim().toLowerCase().replace(/\s/g, '')
  const match = activeFunctions.find(({ fn, guessed }) => {
    if (guessed) return false
    const targets = [fn.label, ...fn.aliases].map(s => s.toLowerCase().replace(/\s/g, ''))
    return targets.includes(normalized)
  })

  if (match) {
    // Mark that function as guessed
    setActiveFunctions(prev =>
      prev.map(af => af.fn.id === match.fn.id ? { ...af, guessed: true } : af)
    )
    // Check if all guessed
    if (activeFunctions.every(af => af.guessed || af.fn.id === match.fn.id)) {
      setWon(true)
    }
  } else {
    setMessage('Not quite.')
  }
}
```

---

## Layout (updated)

```
┌──────────────────────────────────────────────────────────────┐
│  FUNCTION BATTLESHIP                    [Difficulty: Hard]    │
├────────────┬─────────────┬─────────────┬─────────────────────┤
│   GRID     │   f(x)      │   f′(x)     │   F(x)              │
│  5×5 click │   5×5 cells │   5×5 cells │   5×5 cells         │
│            │  (colored   │  (colored   │  (colored           │
│            │   curves)   │   curves)   │   curves)           │
├────────────┴─────────────┴─────────────┴─────────────────────┤
│  Shot mode: [ f(x) ]  [ f′(x) ]  [ F(x) ]                   │
│  Guess: [___________________] [Submit]                        │
│  Remaining: ● ● ●  (colored dots = unguessed functions)      │
└──────────────────────────────────────────────────────────────┘
```

Colored dots in the footer show how many functions remain unguessed, using the same color as their curves.

---

## Build Order for Claude Code

1. **Difficulty screen** — four buttons, sets difficulty, calls `selectFunctions`
2. **Game state init** — `activeFunctions` with colors assigned, grid initialized
3. **Single-function render** — get v1 working with one function before enabling multi
4. **Canvas multi-curve** — extend `drawCell` to loop over `hits` array
5. **Color coding** — assign colors from `FUNCTION_COLORS`, thread through state and canvas
6. **Multi-function guess** — input checks all unguessed, marks off on correct
7. **Win condition** — triggers when all functions guessed
8. **Polish** — miss indicators, remaining dots, difficulty label in header

---

## Known Edge Cases to Handle

| Case | Handling |
|------|----------|
| NaN/Infinity from function | Skip point in draw loop, don't crash |
| arcsin outside [-1,1] | Returns NaN — renderer skips, shows short curve |
| tan near asymptote | Clip at abs(y) > 100 before rendering |
| sin(x)/x F panel | Leave blank, no crash |
| Two functions same color cell | Both curves drawn in their colors, overlapping is fine |
| Guess matches already-guessed function | Show "already found!" not "wrong" |

---

## Stretch Goals (post-MVP)
- Gun roulette animation when switching shot modes
- Shot counter / efficiency score
- Timer
- Numerical Si(x) approximation for sin(x)/x
- Hint system (costs shots)
- Two-player mode: Player 2 picks the functions manually
