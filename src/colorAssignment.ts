import type { PlayerStanding, Color } from './types'
import { getColorPreference } from './colorPreference'

export interface ColorAssignment {
  white: PlayerStanding
  black: PlayerStanding
}

const STRENGTH_PRIORITY: Record<string, number> = {
  absolute: 3,
  strong: 2,
  mild: 1,
  none: 0,
}

/**
 * Détermine qui joue Blanc et qui joue Noir au sein d'une paire,
 * selon les préférences de couleur de chacun.
 */
export function assignColors(playerA: PlayerStanding, playerB: PlayerStanding): ColorAssignment {
  const prefA = getColorPreference(playerA)
  const prefB = getColorPreference(playerB)

  const priorityA = STRENGTH_PRIORITY[prefA.strength]
  const priorityB = STRENGTH_PRIORITY[prefB.strength]

  // Cas 1 : préférence strictement plus forte → on la respecte
  if (priorityA > priorityB && prefA.preferredColor) {
    return buildAssignment(playerA, playerB, prefA.preferredColor)
  }
  if (priorityB > priorityA && prefB.preferredColor) {
    return buildAssignment(playerB, playerA, prefB.preferredColor)
  }

  // Cas 2 : même niveau de priorité → on regarde qui a la différence
  // de couleur la plus extrême (le plus urgent à corriger)
  if (prefA.preferredColor && prefB.preferredColor) {
    if (prefA.preferredColor !== prefB.preferredColor) {
      // Préférences compatibles — on satisfait les deux
      return buildAssignment(playerA, playerB, prefA.preferredColor)
    }
    // Même préférence — on donne la couleur au joueur le plus déséquilibré
    if (Math.abs(playerA.colorDifference) >= Math.abs(playerB.colorDifference)) {
      return buildAssignment(playerA, playerB, prefA.preferredColor)
    } else {
      return buildAssignment(playerB, playerA, prefB.preferredColor)
    }
  }

  // Cas 3 : un des deux sans préférence → on satisfait celui qui en a une
  if (prefA.preferredColor) {
    return buildAssignment(playerA, playerB, prefA.preferredColor)
  }
  if (prefB.preferredColor) {
    return buildAssignment(playerB, playerA, prefB.preferredColor)
  }

  // Cas 4 : aucune préférence ou égalité parfaite
// On regarde qui a reçu Blanc en dernier — celui qui l'a eu le plus récemment
// cède sa place à l'autre
const lastWhiteA = playerA.colorHistory.lastIndexOf('white')
const lastWhiteB = playerB.colorHistory.lastIndexOf('white')

// Celui qui a reçu Blanc le plus récemment joue Noir
if (lastWhiteA > lastWhiteB) {
  return buildAssignment(playerA, playerB, 'black')
}
if (lastWhiteB > lastWhiteA) {
  return buildAssignment(playerB, playerA, 'black')
}

// Vraiment aucune différence → Blanc au premier par défaut
return buildAssignment(playerA, playerB, 'white')
}

function buildAssignment(
  preferredPlayer: PlayerStanding,
  otherPlayer: PlayerStanding,
  color: Color
): ColorAssignment {
  if (color === 'white') {
    return { white: preferredPlayer, black: otherPlayer }
  }
  return { white: otherPlayer, black: preferredPlayer }
}