# swiss-pairing-engine

A TypeScript implementation of the FIDE Dutch Swiss pairing system for chess tournaments.

## Features

- ♟️ FIDE Dutch System pairing algorithm
- 🎨 Color preference management (absolute, strong, mild)
- 🏆 Score bracket grouping and downfloat handling
- 🎯 Bye allocation (FIDE compliant)
- ✅ Fully tested with Vitest (28 tests)
- 📦 Pure TypeScript, no external dependencies at runtime

## Architecture

The engine is built as a pure TypeScript module, completely independent of any UI framework or database. This makes it usable both:
- **Online** — integrated into a web application (React, Vue, etc.)
- **Offline** — as a standalone tool running in any JavaScript environment
```
src/
├── types.ts           # Core data structures (Player, Pairing, GameResult...)
├── standings.ts       # Score and history computation
├── ranking.ts         # Player sorting and score bracket grouping
├── pairing.ts         # Homogeneous bracket pairing (top half vs bottom half)
├── colorPreference.ts # FIDE color preference calculation
├── colorAssignment.ts # Color assignment within a pair
├── bye.ts             # Bye player selection
├── generateRound.ts   # Round orchestration
└── applyRound.ts      # Apply round results to standings
```
## Installation
```bash
npm install
```

## Running tests
```bash
npx vitest run
```

## Usage
```typescript
import { generateRound } from './src/generateRound'
import { applyRoundResults } from './src/applyRound'
import { initStanding } from './src/standings'
import type { Player } from './src/types'

const players: Player[] = [
  { id: '1', name: 'Alice', rating: 1800, pairingNumber: 1 },
  { id: '2', name: 'Bob', rating: 1750, pairingNumber: 2 },
  // ...
]

let standings = players.map(initStanding)

// Generate round 1
const round1 = generateRound(standings, 1)
console.log(round1.pairings)

// Apply results and generate round 2
standings = applyRoundResults(standings, round1)
const round2 = generateRound(standings, 2)
```

## Known limitations & roadmap
- [ ] Full backtracking for inter-bracket downfloat resolution (currently uses greedy approach)
- [ ] Color balance enforcement across all rounds (known edge case with bottom-ranked players)
- [ ] Tiebreak calculations (Buchholz, Sonneborn-Berger, performance rating)
- [ ] FIDE-certified test suite validation

## Author
Guillaume Fournier — [GitHub](https://github.com/Kobiyami)

## License
MIT