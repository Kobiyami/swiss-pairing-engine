import { describe, it, expect } from 'vitest'
import { buchholz, sonnebornBerger, finalRanking, buchholzTruncated } from './tiebreaks'
import { initStanding, applyGameResult } from './standings'
import type { Player } from './types'

describe('tiebreaks', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice', rating: 2400, pairingNumber: 1 },
    { id: 'p2', name: 'Bob',   rating: 2350, pairingNumber: 2 },
    { id: 'p3', name: 'Carol', rating: 2300, pairingNumber: 3 },
    { id: 'p4', name: 'Dave',  rating: 2250, pairingNumber: 4 },
  ]

  function buildStandings() {
    // p1 bat p2 et p3
    // p2 bat p3, perd contre p1
    // p3 perd contre p1 et p2
    // p4 pas de parties
    let p1 = initStanding(players[0])
    let p2 = initStanding(players[1])
    let p3 = initStanding(players[2])
    let p4 = initStanding(players[3])

    // Round 1 : p1 bat p2, p3 bat p4
    p1 = applyGameResult(p1, { round: 1, opponentId: 'p2', color: 'white', result: 'win', float: null })
    p2 = applyGameResult(p2, { round: 1, opponentId: 'p1', color: 'black', result: 'loss', float: null })
    p3 = applyGameResult(p3, { round: 1, opponentId: 'p4', color: 'white', result: 'win', float: null })
    p4 = applyGameResult(p4, { round: 1, opponentId: 'p3', color: 'black', result: 'loss', float: null })

    // Round 2 : p1 bat p3, p2 bat p4
    p1 = applyGameResult(p1, { round: 2, opponentId: 'p3', color: 'white', result: 'win', float: null })
    p3 = applyGameResult(p3, { round: 2, opponentId: 'p1', color: 'black', result: 'loss', float: null })
    p2 = applyGameResult(p2, { round: 2, opponentId: 'p4', color: 'white', result: 'win', float: null })
    p4 = applyGameResult(p4, { round: 2, opponentId: 'p2', color: 'black', result: 'loss', float: null })

    return [p1, p2, p3, p4]
  }

  it('buchholz : somme des scores des adversaires', () => {
    const standings = buildStandings()
    // p1 a joué contre p2 (score=1) et p3 (score=1) → buchholz = 2
    const buch = buchholz(standings[0], standings)
    expect(buch).toBe(2)
  })

  it('buchholz tronqué : retire le score le plus bas', () => {
    const standings = buildStandings()
    // p1 adversaires : p2(1) et p3(1) → tronqué = 1 (retire un des deux)
    const buch = buchholzTruncated(standings[0], standings)
    expect(buch).toBe(1)
  })

  it('sonneborn-berger : valorise les victoires contre les forts', () => {
    const standings = buildStandings()
    // p1 a battu p2(score=1) et p3(score=1) → SB = 1 + 1 = 2
    const sb = sonnebornBerger(standings[0], standings)
    expect(sb).toBe(2)
  })

  it('sonneborn-berger : nulle vaut la moitié', () => {
    let p1 = initStanding(players[0])
    let p2 = initStanding(players[1])

    p1 = applyGameResult(p1, { round: 1, opponentId: 'p2', color: 'white', result: 'draw', float: null })
    p2 = applyGameResult(p2, { round: 1, opponentId: 'p1', color: 'black', result: 'draw', float: null })

    // p2 score = 0.5 → SB de p1 = 0.5 / 2 = 0.25
    const sb = sonnebornBerger(p1, [p1, p2])
    expect(sb).toBe(0.25)
  })

  it('finalRanking : trie par score puis buchholz puis SB', () => {
    const standings = buildStandings()
    const ranked = finalRanking(standings)

    // p1 : 2pts, p2 : 1pt, p3 : 1pt, p4 : 0pts
    expect(ranked[0].player.id).toBe('p1')
    expect(ranked[3].player.id).toBe('p4')

    // p2 et p3 ont tous les deux 1pt
    // p2 buchholz : p1(2) + p4(0) = 2
    // p3 buchholz : p1(2) + p4(0) = 2 — égalité
    // p2 SB : p4(0) = 0 (victoire contre p4 qui a 0)
    // p3 SB : 0 (défaites seulement)
    // donc p2 > p3 par SB
    expect(ranked[1].player.id).toBe('p2')
    expect(ranked[2].player.id).toBe('p3')
  })
})