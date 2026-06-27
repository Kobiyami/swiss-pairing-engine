import { describe, it, expect } from 'vitest'
import { generateRound } from './generateRound'
import { applyRoundResults } from './applyRound'
import { initStanding } from './standings'
import type { Player, GameOutcome } from './types'
import { getColorPreference } from './colorPreference'

describe('simulation de tournoi complet', () => {
  const makePlayers = (count: number): Player[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Joueur${i + 1}`,
      rating: 2200 - i * 5,
      pairingNumber: i + 1,
    }))

  // Résultat déterministe (pas aléatoire) pour un test reproductible :
  // le joueur avec le meilleur rating gagne, sauf égalité parfaite = nulle
  function deterministicResult(whiteId: string, blackId: string | null): GameOutcome {
    if (!blackId) return 'win' // ne devrait pas arriver ici (bye géré ailleurs)
    const whiteRating = parseInt(whiteId.replace('p', ''))
    const blackRating = parseInt(blackId.replace('p', ''))
    if (whiteRating < blackRating) return 'win' // numéro plus petit = mieux classé = gagne
    if (whiteRating > blackRating) return 'loss'
    return 'draw'
  }

it('DEBUG - trouve le nouveau joueur qui dérape', () => {
  const players = makePlayers(32)
  let standings = players.map(initStanding)

  for (let round = 1; round <= 9; round++) {
    const roundResult = generateRound(standings, round)
    standings = applyRoundResults(standings, roundResult, deterministicResult)
  }

  const worst = standings.reduce((max, s) =>
    Math.abs(s.colorDifference) > Math.abs(max.colorDifference) ? s : max
  )
  console.log('Pire joueur:', worst.player.id, 'diff:', worst.colorDifference)
  console.log('Historique couleurs:', worst.colorHistory)
})
  it('simule 7 rondes pour 64 joueurs sans aucune répétition de paire', () => {
    const players = makePlayers(64)
    let standings = players.map(initStanding)

    const allPairsEverPlayed = new Set<string>()
    let totalRepeats = 0

    for (let round = 1; round <= 7; round++) {
      const roundResult = generateRound(standings, round)

      // Vérifie qu'aucune paire jouée cette ronde n'a déjà été jouée avant
      for (const pairing of roundResult.pairings) {
        if (pairing.isBye) continue
        const key = [pairing.whiteId, pairing.blackId].sort().join('-')
        if (allPairsEverPlayed.has(key)) {
          totalRepeats++
        }
        allPairsEverPlayed.add(key)
      }

      standings = applyRoundResults(standings, roundResult, deterministicResult)
    }

    expect(totalRepeats).toBe(0)
  })

  it('vérifie qu\'aucun joueur ne dépasse jamais une différence de couleur de ±2', () => {
  const players = makePlayers(32)
  let standings = players.map(initStanding)

  let maxViolation = 0

  for (let round = 1; round <= 9; round++) {
    const roundResult = generateRound(standings, round)

    // On vérifie les violations APRÈS application des couleurs de ce round
    // en simulant ce que sera la différence après ce round
    for (const pairing of roundResult.pairings) {
  if (pairing.isBye) continue
  const white = standings.find(s => s.player.id === pairing.whiteId)!
  const black = standings.find(s => s.player.id === pairing.blackId)!
  const newWhiteDiff = white.colorDifference + 1
  const newBlackDiff = black.colorDifference - 1
  if (Math.abs(newWhiteDiff) > 2) {
    console.log(`Round ${round} VIOLATION: ${pairing.whiteId} blanc, diff sera ${newWhiteDiff}`)
    maxViolation = Math.max(maxViolation, Math.abs(newWhiteDiff))
  }
  if (Math.abs(newBlackDiff) > 2) {
    console.log(`Round ${round} VIOLATION: ${pairing.blackId} noir, diff sera ${newBlackDiff}`)
    maxViolation = Math.max(maxViolation, Math.abs(newBlackDiff))
  }
}

    standings = applyRoundResults(standings, roundResult, deterministicResult)
  }

  expect(maxViolation).toBe(0)
})

  it('vérifie qu\'aucun joueur ne reçoit deux fois le bye', () => {
    const players = makePlayers(15) // nombre impair pour forcer des byes à chaque ronde
    let standings = players.map(initStanding)

    const byeCount = new Map<string, number>()

    for (let round = 1; round <= 9; round++) {
      const roundResult = generateRound(standings, round)

      for (const pairing of roundResult.pairings) {
        if (pairing.isBye) {
          const count = byeCount.get(pairing.whiteId!) ?? 0
          byeCount.set(pairing.whiteId!, count + 1)
        }
      }

      standings = applyRoundResults(standings, roundResult, deterministicResult)
    }

    const maxByes = Math.max(...byeCount.values())
    expect(maxByes).toBe(1) // personne ne devrait avoir reçu 2 byes
  })

  it('DEBUG Round 3 - standings de p1 à p4', () => {
  const players = makePlayers(32)
  let standings = players.map(initStanding)

  for (let round = 1; round <= 2; round++) {
    const roundResult = generateRound(standings, round)
    standings = applyRoundResults(standings, roundResult, deterministicResult)
  }

  // État avant le Round 3
for (const id of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']) {
    const s = standings.find(s => s.player.id === id)!
    console.log(`${id}: score=${s.score}, colorDiff=${s.colorDifference}, colors=${JSON.stringify(s.colorHistory)}`)
  }

  const round3 = generateRound(standings, 3)
  const top4 = round3.pairings.filter(p =>
    ['p1','p2','p3','p4'].includes(p.whiteId ?? '') ||
    ['p1','p2','p3','p4'].includes(p.blackId ?? '')
  )
  console.log('Pairings Round 3 pour p1-p4:', top4)
})
it('vérifie que dans chaque paire les deux joueurs ont des couleurs différentes', () => {
  const players = makePlayers(32)
  let standings = players.map(initStanding)

  for (let round = 1; round <= 9; round++) {
    const roundResult = generateRound(standings, round)

    for (const pairing of roundResult.pairings) {
      if (pairing.isBye) continue
      // Par construction whiteId ≠ blackId
      expect(pairing.whiteId).not.toBe(pairing.blackId)
      // Et les deux sont non-null
      expect(pairing.whiteId).not.toBeNull()
      expect(pairing.blackId).not.toBeNull()
    }

    standings = applyRoundResults(standings, roundResult, deterministicResult)
  }
})
it('B1 : aucune répétition de paire sur 11 rondes avec 16 joueurs', () => {
    const players = makePlayers(16)
    let standings = players.map(initStanding)

    const allPairsEverPlayed = new Set<string>()
    let totalRepeats = 0

    for (let round = 1; round <= 11; round++) {
      const roundResult = generateRound(standings, round)

      for (const pairing of roundResult.pairings) {
        if (pairing.isBye) continue
        const key = [pairing.whiteId, pairing.blackId].sort().join('-')
        if (allPairsEverPlayed.has(key)) {
          totalRepeats++
          console.log(`Round ${round} REPEAT: ${key}`)
        }
        allPairsEverPlayed.add(key)
      }

      standings = applyRoundResults(standings, roundResult, deterministicResult)
    }

    expect(totalRepeats).toBe(0)
  })
  it('simulation réaliste : tournoi complet avec résultats aléatoires', () => {
    // Seed fixe pour reproductibilité
    let seed = 42
    function seededRandom(): number {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff
      return (seed >>> 0) / 0xffffffff
    }

    function randomResult(whiteId: string, blackId: string | null): GameOutcome {
      if (!blackId) return 'win'
      const r = seededRandom()
      if (r < 0.4) return 'win'
      if (r < 0.75) return 'loss'
      return 'draw'
    }

    const players = makePlayers(20) // nombre impair pour forcer des byes
    let standings = players.map(initStanding)

    const allPairsEverPlayed = new Set<string>()
    let b1Violations = 0
    let colorStreakViolations = 0
    let colorDiffViolations = 0
    let scoreGapViolations = 0
    let doubleByeViolations = 0
    const byeCount = new Map<string, number>()

    for (let round = 1; round <= 7; round++) {
      const roundResult = generateRound(standings, round)

      for (const pairing of roundResult.pairings) {
        if (pairing.isBye) {
          const count = byeCount.get(pairing.whiteId!) ?? 0
          byeCount.set(pairing.whiteId!, count + 1)
          if (count + 1 > 1) doubleByeViolations++
          continue
        }

        // B1 : pas de répétition
        const key = [pairing.whiteId, pairing.blackId].sort().join('-')
        if (allPairsEverPlayed.has(key)) b1Violations++
        allPairsEverPlayed.add(key)

        // Écart de score (sauf ronde 1)
        if (round > 1) {
          const white = standings.find(s => s.player.id === pairing.whiteId)!
          const black = standings.find(s => s.player.id === pairing.blackId)!
          const gap = Math.abs(white.score - black.score)
          if (gap > 1) scoreGapViolations++
        }
      }

      standings = applyRoundResults(standings, roundResult, randomResult)

      // Vérifier couleurs après application
      for (const s of standings) {
        // Jamais ±2 dépassé
        if (Math.abs(s.colorDifference) > 2) colorDiffViolations++

        // Jamais 3 fois la même couleur d'affilée
        const played = s.colorHistory.filter((c): c is 'white' | 'black' => c !== null)
        for (let i = 2; i < played.length; i++) {
          if (played[i] === played[i-1] && played[i] === played[i-2]) {
            colorStreakViolations++
          }
        }
      }
    }

    console.log(`B1 violations: ${b1Violations}`)
    console.log(`Color diff violations (>±2): ${colorDiffViolations}`)
    console.log(`Color streak violations (3x): ${colorStreakViolations}`)
    console.log(`Score gap violations (>1pt): ${scoreGapViolations}`)
    console.log(`Double bye violations: ${doubleByeViolations}`)

    expect(b1Violations).toBe(0)
    expect(colorDiffViolations).toBe(0)
    expect(colorStreakViolations).toBe(0)
    expect(doubleByeViolations).toBe(0)
    // Score gap : on vérifie juste qu'il y en a peu (pas zéro, c'est parfois inévitable)
    expect(scoreGapViolations).toBeLessThan(10)
  })
})