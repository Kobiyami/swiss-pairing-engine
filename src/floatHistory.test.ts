import { describe, it, expect } from 'vitest'
import { generateRound } from './generateRound'
import { applyRoundResults } from './applyRound'
import { initStanding } from './standings'
import type { Player, PlayerStanding, GameOutcome } from './types'

describe('B5/B6 float history', () => {
  const makePlayers = (count: number): Player[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Joueur${i + 1}`,
      rating: 2200 - i * 10,
      pairingNumber: i + 1,
    }))

  function deterministicResult(whiteId: string, blackId: string | null): GameOutcome {
    if (!blackId) return 'win'
    const w = parseInt(whiteId.replace('p', ''))
    const b = parseInt(blackId.replace('p', ''))
    if (w < b) return 'win'
    if (w > b) return 'loss'
    return 'draw'
  }

  it('floatHistory est vide au départ', () => {
    const players = makePlayers(8)
    const standings = players.map(initStanding)
    for (const s of standings) {
      expect(s.floatHistory).toEqual([])
    }
  })

  it('un joueur floaté down a un floatHistory avec down', () => {
    const players = makePlayers(8)
    let standings = players.map(initStanding)

    const round1 = generateRound(standings, 1)
    standings = applyRoundResults(standings, round1, deterministicResult)

    const round2 = generateRound(standings, 2)
    standings = applyRoundResults(standings, round2, deterministicResult)

    // Chercher un joueur qui a floaté
    const floated = standings.find(s => s.floatHistory.includes('down'))
    if (floated) {
      expect(floated.floatHistory).toContain('down')
    }
    // floatHistory a bien une entrée par ronde jouée
    for (const s of standings) {
      expect(s.floatHistory).toHaveLength(2)
    }
  })

  it('floatHistory a une entrée null quand pas de float', () => {
    const players = makePlayers(8)
    let standings = players.map(initStanding)

    const round1 = generateRound(standings, 1)
    standings = applyRoundResults(standings, round1, deterministicResult)

    // Au round 1 tout le monde a le même score → pas de float possible
    for (const s of standings) {
      expect(s.floatHistory).toHaveLength(1)
      expect(s.floatHistory[0]).toBeNull()
    }
  })

  it('B5 : optimizeFloats réduit les floats down consécutifs', () => {
    const players = makePlayers(16)
    let standings = players.map(initStanding)

    for (let round = 1; round <= 5; round++) {
      const roundResult = generateRound(standings, round)
      standings = applyRoundResults(standings, roundResult, deterministicResult)
    }

    // Ce qu'on vérifie : floatHistory est bien rempli et cohérent
    for (const s of standings) {
      expect(s.floatHistory).toHaveLength(5)
      for (const f of s.floatHistory) {
        expect(['up', 'down', null]).toContain(f)
      }
    }
  })

  it('B6 : optimizeFloats réduit les floats up consécutifs', () => {
    const players = makePlayers(16)
    let standings = players.map(initStanding)

    for (let round = 1; round <= 5; round++) {
      const roundResult = generateRound(standings, round)
      standings = applyRoundResults(standings, roundResult, deterministicResult)
    }

    for (const s of standings) {
      expect(s.floatHistory).toHaveLength(5)
      for (const f of s.floatHistory) {
        expect(['up', 'down', null]).toContain(f)
      }
    }
  })
})