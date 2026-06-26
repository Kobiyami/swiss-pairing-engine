import type { PlayerStanding, Pairing, RoundPairings } from './types'
import { sortByRanking, groupByScore } from './ranking'
import { pairHomogeneousBracket } from './pairing'
import { assignColors } from './colorAssignment'
import { selectByePlayer } from './bye'

/**
 * Génère les appariements d'une ronde à partir des classements actuels.
 *
 * Approche simplifiée (à ce stade) :
 * 1. Si nombre impair, on retire le joueur le moins bien classé éligible au bye
 * 2. On trie et regroupe les joueurs restants par score (brackets homogènes)
 * 3. On apparie chaque bracket ; les non-appariés "downfloatent" dans le bracket suivant
 * 4. On assigne les couleurs pour chaque paire formée
 */
export function generateRound(standings: PlayerStanding[], roundNumber: number): RoundPairings {
  const sorted = sortByRanking(standings)

  let byePlayer: PlayerStanding | null = null
  let playersToFace = sorted

  if (sorted.length % 2 !== 0) {
    byePlayer = selectByePlayer(sorted)
    playersToFace = sorted.filter(s => s.player.id !== byePlayer?.player.id)
  }

  const groups = groupByScore(playersToFace)

  const allPairings: Pairing[] = []
  let board = 1
  let carryOver: PlayerStanding[] = []

  for (const group of groups) {
    const bracket = [...carryOver, ...group]
    const { pairs, unpaired } = pairHomogeneousBracket(bracket)

    for (const [a, b] of pairs) {
      const { white, black } = assignColors(a, b)
      allPairings.push({
        board: board++,
        whiteId: white.player.id,
        blackId: black.player.id,
        isBye: false,
      })
    }

    carryOver = unpaired
  }

  // S'il reste des joueurs non appariés après le dernier bracket (cas limite),
  // on les réapparie entre eux directement, même si leurs scores diffèrent.
  // On boucle tant qu'on arrive à réduire le nombre de joueurs non appariés,
  // pour éviter une boucle infinie si un cas est vraiment impossible.
  let remaining = carryOver
  let previousRemainingCount = -1

  while (remaining.length > 1 && remaining.length !== previousRemainingCount) {
    previousRemainingCount = remaining.length
    const { pairs, unpaired } = pairHomogeneousBracket(remaining)

    for (const [a, b] of pairs) {
      const { white, black } = assignColors(a, b)
      allPairings.push({
        board: board++,
        whiteId: white.player.id,
        blackId: black.player.id,
        isBye: false,
      })
    }

    remaining = unpaired
  }
  if (byePlayer) {
    allPairings.push({
      board: board++,
      whiteId: byePlayer.player.id,
      blackId: null,
      isBye: true,
    })
  }

  return { round: roundNumber, pairings: allPairings }

}