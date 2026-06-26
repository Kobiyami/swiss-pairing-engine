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
function colorsCompatible(a: PlayerStanding, b: PlayerStanding): boolean {
  const prefA = getColorPreference(a)
  const prefB = getColorPreference(b)

  // Si les deux ont une préférence absolue pour la MÊME couleur,
  // on ne peut pas satisfaire les deux → incompatible
  if (
    prefA.strength === 'absolute' &&
    prefB.strength === 'absolute' &&
    prefA.preferredColor === prefB.preferredColor
  ) {
    return false
  }

  return true
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

  // Étape 1 : on essaie d'abord uniquement les candidats compatibles en couleur
  const compatible = available.filter(({ b }) => colorsCompatible(top, b))
  
  for (const { b: bottom, i } of compatible) {
    usedBottom.add(i)
    currentPairs.push(orderPair(top, bottom))
    const result = backtrackPairing(topHalf, bottomHalf, topIndex + 1, usedBottom, currentPairs)
    if (result !== null) return result
    usedBottom.delete(i)
    currentPairs.pop()
  }

  // Étape 2 : si aucun compatible ne donne une solution complète,
  // on accepte les incompatibles en dernier recours
  const incompatible = available.filter(({ b }) => !colorsCompatible(top, b))

  for (const { b: bottom, i } of incompatible) {
    usedBottom.add(i)
    // On ordonne la paire pour que le joueur le plus déséquilibré soit playerA

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
    // Succès total — tout le monde est apparié
    const unpaired: PlayerStanding[] = floatedOut ? [floatedOut] : []
    return { pairs, unpaired }
  }

  // Backtracking complet échoué — on revient à l'approche gloutonne
  // pour au moins minimiser les non-appariés
  const fallbackPairs: [PlayerStanding, PlayerStanding][] = []
  const usedBottom = new Set<string>()
  const unpaired: PlayerStanding[] = []

  for (const top of topHalf) {
    const opponent = bottomHalf.find(
      b => !usedBottom.has(b.player.id) && canPlay(top, b)
    )
    if (opponent) {
      const pair: [PlayerStanding, PlayerStanding] =
  Math.abs(top.colorDifference) >= Math.abs(opponent.colorDifference)
    ? [top, opponent]
    : [opponent, top]
    fallbackPairs.push(pair)
      usedBottom.add(opponent.player.id)
    } else {
      unpaired.push(top)
    }
  }

  for (const bottom of bottomHalf) {
    if (!usedBottom.has(bottom.player.id)) {
      unpaired.push(bottom)
    }
  }

  if (floatedOut) unpaired.push(floatedOut)
  return { pairs: fallbackPairs, unpaired }
}