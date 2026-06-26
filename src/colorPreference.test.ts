import { describe, it, expect } from 'vitest'
import { getColorPreference } from './colorPreference'
import { initStanding, applyGameResult } from './standings'
import type { Player } from './types'

describe('getColorPreference', () => {
  const alice: Player = { id: 'alice', name: 'Alice', rating: 1800, pairingNumber: 1 }

  it('aucune préférence au premier round', () => {
    const standing = initStanding(alice)
    const pref = getColorPreference(standing)
    expect(pref.preferredColor).toBeNull()
    expect(pref.strength).toBe('none')
  })

  it('préférence légère pour alterner après un nombre pair de parties', () => {
    let standing = initStanding(alice)
    standing = applyGameResult(standing, { round: 1, opponentId: 'bob', color: 'white', result: 'win' })
    standing = applyGameResult(standing, { round: 2, opponentId: 'carol', color: 'black', result: 'win' })
    // colorDifference = 0 après white, black

    const pref = getColorPreference(standing)
    expect(pref.preferredColor).toBe('white')
    expect(pref.strength).toBe('mild')
  })

  it('préférence forte avec différence de couleur de 1', () => {
    let standing = initStanding(alice)
    standing = applyGameResult(standing, { round: 1, opponentId: 'bob', color: 'white', result: 'win' })
    standing = applyGameResult(standing, { round: 2, opponentId: 'carol', color: 'black', result: 'win' })
    standing = applyGameResult(standing, { round: 3, opponentId: 'dave', color: 'white', result: 'win' })
    // colorDifference = +1 après white, black, white

    const pref = getColorPreference(standing)
    expect(pref.preferredColor).toBe('black')
    expect(pref.strength).toBe('strong')
  })

  it('préférence absolue quand la différence atteint +2', () => {
    let standing = initStanding(alice)
    standing = applyGameResult(standing, { round: 1, opponentId: 'bob', color: 'white', result: 'win' })
    standing = applyGameResult(standing, { round: 2, opponentId: 'carol', color: 'black', result: 'win' })
    standing = applyGameResult(standing, { round: 3, opponentId: 'dave', color: 'white', result: 'win' })
    standing = applyGameResult(standing, { round: 4, opponentId: 'eve', color: 'white', result: 'win' })
    // colorDifference = +2 (white, black, white, white)

    const pref = getColorPreference(standing)
    expect(pref.preferredColor).toBe('black')
    expect(pref.strength).toBe('absolute')
  })

  it('préférence absolue après 2 fois la même couleur d\'affilée', () => {
    let standing = initStanding(alice)
    standing = applyGameResult(standing, { round: 1, opponentId: 'bob', color: 'black', result: 'win' })
    standing = applyGameResult(standing, { round: 2, opponentId: 'carol', color: 'white', result: 'win' })
    standing = applyGameResult(standing, { round: 3, opponentId: 'dave', color: 'white', result: 'win' })
    // colorDifference = +1, mais 2 fois white d'affilée → absolu

    const pref = getColorPreference(standing)
    expect(pref.preferredColor).toBe('black')
    expect(pref.strength).toBe('absolute')
  })
})