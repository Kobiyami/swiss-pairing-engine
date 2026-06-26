import { describe, it, expect } from 'vitest'
import { initStanding, applyGameResult, buildStandingsFromHistory } from './standings'
import type { Player, GameResult } from './types'

describe('standings', () => {
  const alice: Player = { id: 'alice', name: 'Alice', rating: 1800, pairingNumber: 1 }

  it('initialise un joueur à zéro', () => {
    const standing = initStanding(alice)
    expect(standing.score).toBe(0)
    expect(standing.games).toHaveLength(0)
    expect(standing.colorDifference).toBe(0)
  })

  it('ajoute une victoire en blanc correctement', () => {
    const standing = initStanding(alice)
    const game: GameResult = {
      round: 1,
      opponentId: 'bob',
      color: 'white',
      result: 'win',
    }
    const updated = applyGameResult(standing, game)

    expect(updated.score).toBe(1)
    expect(updated.colorDifference).toBe(1)
    expect(updated.opponentsPlayed.has('bob')).toBe(true)
  })

  it('cumule plusieurs résultats', () => {
    let standing = initStanding(alice)
    standing = applyGameResult(standing, { round: 1, opponentId: 'bob', color: 'white', result: 'win' })
    standing = applyGameResult(standing, { round: 2, opponentId: 'carol', color: 'black', result: 'draw' })
    standing = applyGameResult(standing, { round: 3, opponentId: 'dave', color: 'white', result: 'loss' })

    expect(standing.score).toBe(1.5)
    expect(standing.colorDifference).toBe(1) // +1 (blanc) -1 (noir) +1 (blanc) = 1... attends on vérifie
  })

  it('gère un bye correctement', () => {
    const standing = initStanding(alice)
    const updated = applyGameResult(standing, {
      round: 1,
      opponentId: null,
      color: null,
      result: 'bye',
    })
    expect(updated.score).toBe(1)
    expect(updated.hasHadBye).toBe(true)
  })

  it('construit les classements depuis un historique complet', () => {
    const bob: Player = { id: 'bob', name: 'Bob', rating: 1700, pairingNumber: 2 }
    const games = new Map<string, GameResult[]>()
    games.set('alice', [{ round: 1, opponentId: 'bob', color: 'white', result: 'win' }])
    games.set('bob', [{ round: 1, opponentId: 'alice', color: 'black', result: 'loss' }])

    const standings = buildStandingsFromHistory([alice, bob], games)
    expect(standings[0].score).toBe(1)
    expect(standings[1].score).toBe(0)
  })
})