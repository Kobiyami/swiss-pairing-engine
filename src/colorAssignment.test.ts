import { describe, it, expect } from 'vitest'
import { assignColors } from './colorAssignment'
import { initStanding, applyGameResult } from './standings'
import type { Player } from './types'

describe('assignColors', () => {
  const alice: Player = { id: 'alice', name: 'Alice', rating: 1800, pairingNumber: 1 }
  const bob: Player = { id: 'bob', name: 'Bob', rating: 1700, pairingNumber: 2 }

  it('au premier round, sans préférence, le premier joueur reçoit Blanc', () => {
    const standingA = initStanding(alice)
    const standingB = initStanding(bob)

    const result = assignColors(standingA, standingB)
    expect(result.white.player.id).toBe('alice')
    expect(result.black.player.id).toBe('bob')
  })

  it('respecte une préférence absolue face à une absence de préférence', () => {
    let standingA = initStanding(alice)
    // Alice a joué blanc 2 fois de suite → préférence absolue pour noir
    standingA = applyGameResult(standingA, { round: 1, opponentId: 'x', color: 'white', result: 'win' })
    standingA = applyGameResult(standingA, { round: 2, opponentId: 'y', color: 'white', result: 'win' })

    const standingB = initStanding(bob) // pas d'historique

    const result = assignColors(standingA, standingB)
    expect(result.black.player.id).toBe('alice')
    expect(result.white.player.id).toBe('bob')
  })

  it('gère deux préférences compatibles opposées', () => {
    let standingA = initStanding(alice)
    standingA = applyGameResult(standingA, { round: 1, opponentId: 'x', color: 'white', result: 'win' })
    // Alice a colorDifference +1 → préfère noir (strong)

    let standingB = initStanding(bob)
    standingB = applyGameResult(standingB, { round: 1, opponentId: 'y', color: 'black', result: 'win' })
    // Bob a colorDifference -1 → préfère blanc (strong)

    const result = assignColors(standingA, standingB)
    expect(result.black.player.id).toBe('alice')
    expect(result.white.player.id).toBe('bob')
  })

  it('résout un conflit entre deux préférences absolues identiques par le classement', () => {
    let standingA = initStanding(alice)
    standingA = applyGameResult(standingA, { round: 1, opponentId: 'x', color: 'white', result: 'win' })
    standingA = applyGameResult(standingA, { round: 2, opponentId: 'y', color: 'white', result: 'win' })
    // Alice : préférence absolue pour noir

    let standingB = initStanding(bob)
    standingB = applyGameResult(standingB, { round: 1, opponentId: 'x', color: 'white', result: 'win' })
    standingB = applyGameResult(standingB, { round: 2, opponentId: 'y', color: 'white', result: 'win' })
    // Bob : préférence absolue pour noir aussi (conflit !)

    const result = assignColors(standingA, standingB)
    // Le premier joueur passé en argument (alice, mieux classée par convention) obtient sa préférence
    expect(result.black.player.id).toBe('alice')
    expect(result.white.player.id).toBe('bob')
  })
})