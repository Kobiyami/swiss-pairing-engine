import type { PlayerStanding } from './types'
import { getColorPreference } from './colorPreference'

function canPlay(a: PlayerStanding, b: PlayerStanding): boolean {
  if (a.opponentsPlayed.has(b.player.id)) return false
  return true
}

/**
 * Vérifie si deux joueurs ont des préférences de couleur compatibles —
 * c'est-à-dire qu'on peut leur attribuer des couleurs différentes sans
 * violer une contrainte absolue des deux côtés.
 */

function hasAbsoluteColorConflict(a: PlayerStanding, b: PlayerStanding): boolean {
  const prefA = getColorPreference(a)
  const prefB = getColorPreference(b)
  return (
    prefA.strength === 'absolute' &&
    prefB.strength === 'absolute' &&
    prefA.preferredColor === prefB.preferredColor
  )
}
/**
 * Tente d'apparier la moitié haute avec une permutation de la moitié basse,
 * par backtracking récursif avec élagage.
 * Retourne les paires trouvées et les indices de la moitié basse utilisés.
 */
function backtrackPairing(
  topHalf: PlayerStanding[],
  bottomHalf: PlayerStanding[],
  topIndex: number,
  usedBottom: Set<number>,
  currentPairs: [PlayerStanding, PlayerStanding][]
): [PlayerStanding, PlayerStanding][] | null {
  if (topIndex === topHalf.length) {
    return [...currentPairs]
  }

  const top = topHalf[topIndex]

  const available = bottomHalf
    .map((b, i) => ({ b, i }))
    .filter(({ i }) => !usedBottom.has(i))
    .filter(({ b }) => canPlay(top, b))

  // Étape 1 : candidats sans conflit absolu de couleur
  const noConflict = available.filter(({ b }) => !hasAbsoluteColorConflict(top, b))

  for (const { b: bottom, i } of noConflict) {
    usedBottom.add(i)
    currentPairs.push(orderPair(top, bottom))
    const result = backtrackPairing(topHalf, bottomHalf, topIndex + 1, usedBottom, currentPairs)
    if (result !== null) return result
    usedBottom.delete(i)
    currentPairs.pop()
  }

  // Étape 2 : conflit absolu accepté en dernier recours plutôt que laisser sans partenaire
  const withConflict = available.filter(({ b }) => hasAbsoluteColorConflict(top, b))

  for (const { b: bottom, i } of withConflict) {
    usedBottom.add(i)
    currentPairs.push(orderPair(top, bottom))
    const result = backtrackPairing(topHalf, bottomHalf, topIndex + 1, usedBottom, currentPairs)
    if (result !== null) return result
    usedBottom.delete(i)
    currentPairs.pop()
  }

  return null
}

/**
 * Ordonne une paire pour qu'assignColors donne la couleur au joueur
 * qui en a le plus besoin. En cas d'égalité de déséquilibre, le joueur
 * avec le plus grand numéro de pairing (moins bien classé initialement)
 * passe en premier pour compenser son désavantage structurel.
 */
function orderPair(
  a: PlayerStanding,
  b: PlayerStanding
): [PlayerStanding, PlayerStanding] {
  if (Math.abs(a.colorDifference) !== Math.abs(b.colorDifference)) {
    return Math.abs(a.colorDifference) >= Math.abs(b.colorDifference)
      ? [a, b]
      : [b, a]
  }
  return a.player.pairingNumber > b.player.pairingNumber ? [a, b] : [b, a]
}
/**
 * Apparie un bracket en suivant le principe "moitié haute contre moitié basse",
 * avec backtracking si l'appariement naturel crée des répétitions.
 */
export function pairHomogeneousBracket(
  bracket: PlayerStanding[]
): { pairs: [PlayerStanding, PlayerStanding][]; unpaired: PlayerStanding[] } {
  const players = [...bracket]
  let floatedOut: PlayerStanding | null = null

  if (players.length % 2 !== 0) {
    floatedOut = players.pop()!
  }

  const half = players.length / 2
  const topHalf = players.slice(0, half)
  const bottomHalf = players.slice(half)

  const pairs = backtrackPairing(topHalf, bottomHalf, 0, new Set(), [])

 if (pairs !== null) {
    const unpaired: PlayerStanding[] = floatedOut ? [floatedOut] : []
    return { pairs, unpaired }
  }

  // Backtracking échoué — réessayer avec la liste mélangée (top+bottom ensemble)
  // pour casser les blocs de même couleur
  const allPlayers = [...topHalf, ...bottomHalf]
  const mixedPairs: [PlayerStanding, PlayerStanding][] = []
  const usedMixed = new Set<string>()

  for (let i = 0; i < allPlayers.length; i++) {
    if (usedMixed.has(allPlayers[i].player.id)) continue
    for (let j = i + 1; j < allPlayers.length; j++) {
      if (usedMixed.has(allPlayers[j].player.id)) continue
      if (!canPlay(allPlayers[i], allPlayers[j])) continue
      if (hasAbsoluteColorConflict(allPlayers[i], allPlayers[j])) continue
      mixedPairs.push(orderPair(allPlayers[i], allPlayers[j]))
      usedMixed.add(allPlayers[i].player.id)
      usedMixed.add(allPlayers[j].player.id)
      break
    }
  }

  const unpaired: PlayerStanding[] = []
  for (const p of allPlayers) {
    if (!usedMixed.has(p.player.id)) unpaired.push(p)
  }
  if (floatedOut) unpaired.push(floatedOut)
  return { pairs: mixedPairs, unpaired }
}