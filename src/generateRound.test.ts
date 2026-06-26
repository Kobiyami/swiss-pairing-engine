import { describe, it, expect } from 'vitest'
import { generateRound } from './generateRound'
import { initStanding } from './standings'
import type { Player } from './types'

describe('generateRound', () => {
  const makePlayers = (count: number): Player[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Joueur${i + 1}`,
      rating: 2000 - i * 10,
      pairingNumber: i + 1,
    }))

  it('génère un round 1 complet pour 8 joueurs (nombre pair)', () => {
    const players = makePlayers(8)
    const standings = players.map(initStanding)

    const round = generateRound(standings, 1)

    expect(round.round).toBe(1)
    expect(round.pairings).toHaveLength(4) // 8 joueurs = 4 paires
    expect(round.pairings.every(p => !p.isBye)).toBe(true)

    // Vérifie que tous les joueurs sont bien appariés une seule fois
    const allPlayerIds = round.pairings.flatMap(p => [p.whiteId, p.blackId])
    expect(allPlayerIds).toHaveLength(8)
    expect(new Set(allPlayerIds).size).toBe(8) // pas de doublon
  })

  it('génère un round 1 complet pour 7 joueurs (nombre impair, avec bye)', () => {
    const players = makePlayers(7)
    const standings = players.map(initStanding)

    const round = generateRound(standings, 1)

    const byePairings = round.pairings.filter(p => p.isBye)
    const normalPairings = round.pairings.filter(p => !p.isBye)

    expect(byePairings).toHaveLength(1)
    expect(normalPairings).toHaveLength(3) // 6 joueurs restants = 3 paires

    // Le bye doit aller au moins bien classé (p7, le dernier)
    expect(byePairings[0].whiteId).toBe('p7')
  })

  it('génère un round complet pour 64 joueurs sans erreur ni doublon', () => {
    const players = makePlayers(64)
    const standings = players.map(initStanding)

    const round = generateRound(standings, 1)

    expect(round.pairings).toHaveLength(32)
    const allPlayerIds = round.pairings.flatMap(p => [p.whiteId, p.blackId]).filter(Boolean)
    expect(new Set(allPlayerIds).size).toBe(64)
  })
})