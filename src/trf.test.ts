import { describe, it, expect } from 'vitest'
import { Tournament } from './tournament'
import { exportTRF } from './trf'
import type { Player } from './types'

describe('TRF export', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice Dupont', rating: 2400, pairingNumber: 1 },
    { id: 'p2', name: 'Bob Martin', rating: 2350, pairingNumber: 2 },
    { id: 'p3', name: 'Carol Smith', rating: 2300, pairingNumber: 3 },
    { id: 'p4', name: 'Dave Jones', rating: 2250, pairingNumber: 4 },
  ]

  it('exporte les métadonnées correctement', () => {
    const tournament = new Tournament({
      name: 'Open de Lyon',
      city: 'Lyon',
      federation: 'FRA',
      dateStart: '2024-06-01',
      dateEnd: '2024-06-03',
      totalRounds: 3,
    }, players)

    const trf = exportTRF(tournament)
    expect(trf).toContain('012 Open de Lyon')
    expect(trf).toContain('022 Lyon')
    expect(trf).toContain('032 FRA')
    expect(trf).toContain('042 2024-06-01')
    expect(trf).toContain('052 2024-06-03')
    expect(trf).toContain('062 3')
  })

  it('exporte les joueurs avec leurs scores', () => {
    const tournament = new Tournament({
      name: 'Test',
      totalRounds: 2,
    }, players)

    const round1 = tournament.generateNextRound()
    tournament.submitResults(round1.round, round1.pairings
      .filter(p => !p.isBye)
      .map(p => ({
        whiteId: p.whiteId!,
        blackId: p.blackId,
        result: 'white' as const,
      }))
    )

    const trf = exportTRF(tournament)
    expect(trf).toContain('001')
    expect(trf).toContain('Alice Dupont')
    expect(trf).toContain('2400')
  })

  it('génère un TRF valide sur un tournoi complet', () => {
    const tournament = new Tournament({
      name: 'Mini Open',
      totalRounds: 3,
    }, players)

    for (let round = 1; round <= 3; round++) {
      const pairings = tournament.generateNextRound()
      tournament.submitResults(pairings.round, pairings.pairings
        .filter(p => !p.isBye)
        .map(p => ({
          whiteId: p.whiteId!,
          blackId: p.blackId,
          result: 'draw' as const,
        }))
      )
    }

    const trf = exportTRF(tournament)
    const lines = trf.split('\n')

    // 6 lignes métadonnées minimum + 4 joueurs
    expect(lines.length).toBeGreaterThanOrEqual(5)

    // Chaque joueur a une ligne 001
    const playerLines = lines.filter(l => l.startsWith('001'))
    expect(playerLines).toHaveLength(4)
  })
})