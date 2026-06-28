# swiss-pairing-engine

A TypeScript implementation of the FIDE Dutch System pairing engine for Swiss chess tournaments, using the Edmonds-Blossom weighted matching algorithm to guarantee optimal pairings.

## Features

- **B1** — No player faces the same opponent twice
- **B2** — Color difference never exceeds ±2, no three consecutive games with the same color
- **B5/B6** — Float history tracked and penalized to avoid consecutive up/down floats
- **Bye** — Assigned to the lowest-ranked eligible player, never twice to the same player
- **Optimal matching** — Edmonds-Blossom algorithm finds the globally optimal pairing across all players, avoiding the limitations of bracket-by-bracket approaches
- **Tiebreaks** — Buchholz, Buchholz truncated, Sonneborn-Berger
- **TRF export** — Export tournament results in FIDE TRF format

## Architecture

The engine is built as a pure TypeScript module, completely independent of any UI framework or database. This makes it usable both:
- **Online** — integrated into a web application (React, Vue, etc.)
- **Offline** — as a standalone tool running in any JavaScript environment
```
src/
├── types.ts              # Core types: Player, PlayerStanding, GameResult, Pairing
├── tournament.ts         # Tournament class — full lifecycle management
├── generateRound.ts      # Main entry point — builds the weighted graph and runs Blossom
├── floatOptimizer.ts     # Post-optimization pass for B5/B6 violations
├── colorAssignment.ts    # Assigns White/Black based on FIDE E4/E5 rules
├── colorPreference.ts    # Computes each player's color preference and strength
├── standings.ts          # Builds and updates player standings from game history
├── applyRound.ts         # Applies round results to standings
├── tiebreaks.ts          # Buchholz, Sonneborn-Berger, final ranking
├── trf.ts                # TRF file export
├── ranking.ts            # Sorts players and groups them by score
└── bye.ts                # Selects the bye player
```

## How it works

Instead of pairing players bracket-by-bracket (which leads to unsolvable color conflicts), this engine models the entire field as a weighted graph:

- Each possible pairing is an edge
- The weight encodes FIDE priorities: score proximity, color compatibility, float history
- Forbidden pairings (B1, absolute B2 conflicts) are excluded as edges
- The Edmonds-Blossom algorithm finds the maximum weight perfect matching

This guarantees globally optimal pairings in O(n³) time.

## Installation

Clone and build from source:

```bash
git clone https://github.com/Kobiyami/swiss-pairing-engine.git
cd swiss-pairing-engine
npm install
```

To use in another local project:

```bash
npm install ../swiss-pairing-engine
```

## Usage

### Simple API

```typescript
import { generateRound, applyRoundResults, initStanding } from 'swiss-pairing-engine'
import type { Player } from 'swiss-pairing-engine'

const players: Player[] = [
  { id: '1', name: 'Alice', rating: 2400, pairingNumber: 1 },
  { id: '2', name: 'Bob',   rating: 2350, pairingNumber: 2 },
  { id: '3', name: 'Carol', rating: 2300, pairingNumber: 3 },
  { id: '4', name: 'Dave',  rating: 2250, pairingNumber: 4 },
]

let standings = players.map(initStanding)

for (let round = 1; round <= 3; round++) {
  const pairings = generateRound(standings, round)
  console.log(`Round ${round}:`, pairings)
  standings = applyRoundResults(standings, pairings, () => 'win')
}
```

### Tournament class

```typescript
import { Tournament, exportTRF, finalRanking } from 'swiss-pairing-engine'

const tournament = new Tournament({
  name: 'Open de Lyon',
  city: 'Lyon',
  totalRounds: 7,
}, players)

// Generate round
const round1 = tournament.generateNextRound()

// Submit results
tournament.submitResults(round1.round, [
  { whiteId: '1', blackId: '2', result: 'white' },
  { whiteId: '3', blackId: '4', result: 'draw' },
])

// Export TRF
const trf = exportTRF(tournament)

// Final ranking with tiebreaks
const ranked = finalRanking(tournament.standings)
```

## Running tests

```bash
npm test
```

The test suite covers:
- Color balance over 9 rounds (32 players)
- No repeated pairings over 11 rounds (16 players)
- Bye assignment correctness
- Float history (B5/B6) propagation
- Realistic tournament simulation with random results (20 players, 7 rounds)

## FIDE rules implemented

| Rule | Description | Status |
|------|-------------|--------|
| B1 | No repeated pairings | ✅ Hard constraint |
| B2 | Color difference ≤ ±2, no 3 consecutive same color | ✅ Hard constraint |
| B5 | Avoid consecutive down-floats | ✅ Soft penalty |
| B6 | Avoid consecutive up-floats | ✅ Soft penalty |
| E4 | Higher-ranked player gets color priority | ✅ |
| E5 | Alternation preference | ✅ |

## Known limitations

- B5/B6 are soft constraints — consecutive floats may occur when mathematically unavoidable
- The engine does not implement acceleration (used in very large tournaments)
- No TRF file import (export only)

## Roadmap

- [x] Weighted matching via Blossom algorithm (replaces greedy bracket approach)
- [x] Color balance enforcement (B2 — ±2 hard constraint)
- [x] Float history tracking (B5/B6)
- [x] Tiebreak calculations (Buchholz, Sonneborn-Berger)
- [x] TRF export
- [ ] TRF import
- [ ] FIDE-certified test suite validation
- [ ] Acceleration support for large tournaments

## Author

Guillaume Fournier — [GitHub](https://github.com/Kobiyami)

## License

MIT