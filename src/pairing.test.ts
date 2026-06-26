import { describe, it, expect } from 'vitest'
import { pairHomogeneousBracket } from './pairing'
import { initStanding, applyGameResult } from './standings'
import type { Player } from './types'

describe('pairHomogeneousBracket', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Joueur1', rating: 2000, pairingNumber: 1 },
    { id: 'p2', name: 'Joueur2', rating: 1950, pairingNumber: 2 },
    { id: 'p3', name: 'Joueur3', rating: 1900, pairingNumber: 3 },
    { id: 'p4', name: 'Joueur4', rating: 1850, pairingNumber: 4 },
    { id: 'p5', name: 'Joueur5', rating: 1800, pairingNumber: 5 },
    { id: 'p6', name: 'Joueur6', rating: 1750, pairingNumber: 6 },
    { id: 'p7', name: 'Joueur7', rating: 1700, pairingNumber: 7 },
    { id: 'p8', name: 'Joueur8', rating: 1650, pairingNumber: 8 },
  ]

  
  it('apparie un groupe de 8 selon la règle moitié haute / moitié basse', () => {
  const standings = players.map(initStanding)
  const { pairs, unpaired } = pairHomogeneousBracket(standings)

  expect(pairs).toHaveLength(4)
  expect(unpaired).toHaveLength(0)

  // Vérifie que les bonnes paires sont formées (1vs5, 2vs6, 3vs7, 4vs8)
  // sans imposer l'ordre blanc/noir (géré par assignColors)
  const pairIds = pairs.map(([a, b]) => [a.player.id, b.player.id].sort())
  expect(pairIds).toContainEqual(['p1', 'p5'])
  expect(pairIds).toContainEqual(['p2', 'p6'])
  expect(pairIds).toContainEqual(['p3', 'p7'])
  expect(pairIds).toContainEqual(['p4', 'p8'])
})

  it('gère un nombre impair de joueurs avec downfloat du dernier', () => {
    const standings = players.slice(0, 7).map(initStanding) // 7 joueurs

    const { pairs, unpaired } = pairHomogeneousBracket(standings)

    expect(pairs).toHaveLength(3)
    expect(unpaired).toHaveLength(1)
    expect(unpaired[0].player.id).toBe('p7') // le dernier classé part en downfloat
  })

  it('évite de réapparier deux joueurs qui se sont déjà affrontés', () => {
    let standings = players.slice(0, 4).map(initStanding) // p1, p2, p3, p4

    // p1 et p3 se sont déjà affrontés (simulation d'une ronde précédente)
    standings[0] = applyGameResult(standings[0], {
      round: 1, opponentId: 'p3', color: 'white', result: 'win',
    })
    standings[2] = applyGameResult(standings[2], {
      round: 1, opponentId: 'p1', color: 'black', result: 'loss',
    })

    const { pairs, unpaired } = pairHomogeneousBracket(standings)

    // L'appariement naturel serait 1v3, 2v4 mais p1/p3 se sont déjà affrontés
    // donc on doit avoir une autre combinaison ou des non-appariés
    const pairIds = pairs.map(([a, b]) => [a.player.id, b.player.id].sort())
    const hasP1vsP3 = pairIds.some(p => p[0] === 'p1' && p[1] === 'p3')
    expect(hasP1vsP3).toBe(false)
  })
  
})