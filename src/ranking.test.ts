import { describe, it, expect } from 'vitest'
import { sortByRanking, groupByScore } from './ranking'
import { initStanding } from './standings'
import type { Player } from './types'

describe('ranking', () => {
  const alice: Player = { id: 'alice', name: 'Alice', rating: 1800, pairingNumber: 1 }
  const bob: Player = { id: 'bob', name: 'Bob', rating: 2000, pairingNumber: 2 }
  const carol: Player = { id: 'carol', name: 'Carol', rating: 1900, pairingNumber: 3 }
  const dave: Player = { id: 'dave', name: 'Dave', rating: 1900, pairingNumber: 4, title: 'IM' }

  it('trie par score décroissant', () => {
    const standings = [initStanding(alice), initStanding(bob), initStanding(carol)]
    standings[0].score = 1
    standings[1].score = 2
    standings[2].score = 0.5

    const sorted = sortByRanking(standings)
    expect(sorted[0].player.id).toBe('bob')
    expect(sorted[1].player.id).toBe('alice')
    expect(sorted[2].player.id).toBe('carol')
  })

  it('départage par classement ELO en cas d\'égalité de score', () => {
    const standings = [initStanding(alice), initStanding(bob)]
    standings[0].score = 1
    standings[1].score = 1

    const sorted = sortByRanking(standings)
    expect(sorted[0].player.id).toBe('bob') // 2000 > 1800
  })

  it('départage par titre en cas d\'égalité de score et de classement', () => {
    const standings = [initStanding(carol), initStanding(dave)]
    standings[0].score = 1
    standings[1].score = 1
    // carol et dave ont le même rating (1900), dave a un titre IM

    const sorted = sortByRanking(standings)
    expect(sorted[0].player.id).toBe('dave') // IM prioritaire
  })

  it('regroupe les joueurs par score', () => {
    const standings = [initStanding(alice), initStanding(bob), initStanding(carol)]
    standings[0].score = 1
    standings[1].score = 2
    standings[2].score = 1

    const sorted = sortByRanking(standings)
    const groups = groupByScore(sorted)

    expect(groups).toHaveLength(2)
    expect(groups[0]).toHaveLength(1) // bob seul à 2
    expect(groups[1]).toHaveLength(2) // alice et carol à 1
  })
})