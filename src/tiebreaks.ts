import type { PlayerStanding } from './types'

/**
 * Buchholz : somme des scores de tous les adversaires.
 * Les byes sont ignorés (pas d'adversaire réel).
 */
export function buchholz(
  standing: PlayerStanding,
  allStandings: PlayerStanding[]
): number {
  const standingsMap = new Map(allStandings.map(s => [s.player.id, s]))
  let total = 0

  for (const game of standing.games) {
    if (!game.opponentId) continue // bye
    const opponent = standingsMap.get(game.opponentId)
    if (opponent) total += opponent.score
  }

  return total
}

/**
 * Buchholz tronqué : Buchholz sans le score le plus bas.
 * Utilisé pour atténuer l'effet d'un adversaire très faible.
 */
export function buchholzTruncated(
  standing: PlayerStanding,
  allStandings: PlayerStanding[]
): number {
  const standingsMap = new Map(allStandings.map(s => [s.player.id, s]))
  const scores: number[] = []

  for (const game of standing.games) {
    if (!game.opponentId) continue
    const opponent = standingsMap.get(game.opponentId)
    if (opponent) scores.push(opponent.score)
  }

  if (scores.length === 0) return 0
  scores.sort((a, b) => a - b)
  scores.shift() // retirer le plus bas

  return scores.reduce((sum, s) => sum + s, 0)
}

/**
 * Sonneborn-Berger : somme des scores des adversaires battus,
 * plus la moitié des scores des adversaires contre qui on a fait nulle.
 */
export function sonnebornBerger(
  standing: PlayerStanding,
  allStandings: PlayerStanding[]
): number {
  const standingsMap = new Map(allStandings.map(s => [s.player.id, s]))
  let total = 0

  for (const game of standing.games) {
    if (!game.opponentId) continue
    const opponent = standingsMap.get(game.opponentId)
    if (!opponent) continue

    if (game.result === 'win')  total += opponent.score
    if (game.result === 'draw') total += opponent.score / 2
  }

  return total
}

/**
 * Classement final avec tiebreaks.
 * Ordre : score → Buchholz → Sonneborn-Berger → pairingNumber
 */
export function finalRanking(
  standings: PlayerStanding[]
): PlayerStanding[] {
  return [...standings].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score

    const bBuchholz = buchholz(b, standings)
    const aBuchholz = buchholz(a, standings)
    if (bBuchholz !== aBuchholz) return bBuchholz - aBuchholz

    const bSB = sonnebornBerger(b, standings)
    const aSB = sonnebornBerger(a, standings)
    if (bSB !== aSB) return bSB - aSB

    return a.player.pairingNumber - b.player.pairingNumber
  })
}