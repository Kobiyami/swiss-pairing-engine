import type { PlayerStanding, Pairing, RoundPairings } from './types'
import { sortByRanking } from './ranking'
import { assignColors } from './colorAssignment'
import { selectByePlayer } from './bye'
import { getColorPreference } from './colorPreference'
import blossom from 'edmonds-blossom'
import { optimizeFloats } from './floatOptimizer'

/**
 * Calcule le poids d'une paire selon les règles FIDE.
 * Plus le poids est élevé, plus la paire est désirable.
 * Retourne null si la paire est interdite (B1 ou B2 absolu).
 */
function pairWeight(a: PlayerStanding, b: PlayerStanding): number | null {
  // B1 : ne jamais rejouer le même adversaire — interdit absolu
  if (a.opponentsPlayed.has(b.player.id)) return null

  // B2 : conflit de couleur absolu des deux côtés — interdit absolu
  const prefA = getColorPreference(a)
  const prefB = getColorPreference(b)
  if (
    prefA.strength === 'absolute' &&
    prefB.strength === 'absolute' &&
    prefA.preferredColor === prefB.preferredColor
  ) return null

  // Base : on part d'un poids élevé et on pénalise
  let weight = 1000

  // Pénalité pour écart de score (priorité maximale FIDE)
  const scoreDiff = Math.abs(a.score - b.score)
  weight -= scoreDiff * 100

  // Pénalité pour conflit de couleur fort (non absolu)
  if (
    prefA.strength === 'strong' &&
    prefB.strength === 'strong' &&
    prefA.preferredColor === prefB.preferredColor
  ) weight -= 10

  if (
    prefA.strength === 'absolute' &&
    prefB.strength !== 'absolute'
  ) weight += 5 // bonus : on peut satisfaire la contrainte absolue

  if (
    prefB.strength === 'absolute' &&
    prefA.strength !== 'absolute'
  ) weight += 5

  return weight
}

export function generateRound(
  standings: PlayerStanding[],
  roundNumber: number
): RoundPairings {
  const sorted = sortByRanking(standings)

  let byePlayer: PlayerStanding | null = null
  let players = sorted

  if (sorted.length % 2 !== 0) {
    byePlayer = selectByePlayer(sorted)
    players = sorted.filter(s => s.player.id !== byePlayer?.player.id)
  }

  // Construction du graphe : chaque joueur est un nœud (son index dans players)
  const edges: [number, number, number][] = []

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const weight = pairWeight(players[i], players[j])
      if (weight !== null) {
        edges.push([i, j, weight])
      }
    }
  }

  // Algorithme de Blossom : trouve l'appariement de poids maximum
  const mate = blossom(edges, true) // true = maximise la cardinalité d'abord

  // Reconstruction des paires depuis le tableau mate
  const used = new Set<number>()
  const pairs: [PlayerStanding, PlayerStanding][] = []

  for (let i = 0; i < players.length; i++) {
    if (used.has(i)) continue
    const j = mate[i]
    if (j === -1 || used.has(j)) continue
    used.add(i)
    used.add(j)
    pairs.push([players[i], players[j]])
  }

  // Construire les pairings finaux avec assignation des couleurs
  const allPairings: Pairing[] = []
  let board = 1
const optimizedPairs = optimizeFloats(pairs)
 for (const [a, b] of optimizedPairs) {
  const { white, black } = assignColors(a, b)
  
  let whiteFloat: 'up' | 'down' | null = null
  let blackFloat: 'up' | 'down' | null = null
  
  if (white.score !== black.score) {
    whiteFloat = white.score > black.score ? 'down' : 'up'
    blackFloat = black.score > white.score ? 'down' : 'up'
  }

  allPairings.push({
    board: board++,
    whiteId: white.player.id,
    blackId: black.player.id,
    isBye: false,
    whiteFloat,
    blackFloat,
  })
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