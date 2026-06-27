import type { PlayerStanding, Pairing } from './types'

/**
 * Calcule le score de violations B5/B6 pour un ensemble de paires.
 * B5 (float down consécutif) = pénalité 2
 * B6 (float up consécutif)   = pénalité 1
 */
function floatViolationScore(
  pairs: [PlayerStanding, PlayerStanding][],
): number {
  let score = 0
  for (const [a, b] of pairs) {
    if (a.score === b.score) continue

    const floatedDown = a.score < b.score ? a : b
    const floatedUp   = a.score > b.score ? a : b

   const lastFloat = (p: PlayerStanding) =>
  [...p.floatHistory].reverse().find(f => f !== null)

    if (lastFloat(floatedDown) === 'down') score += 2 // B5
    if (lastFloat(floatedUp)   === 'up')   score += 1 // B6
  }
  return score
}

/**
 * Vérifie que les deux joueurs d'une paire ne se sont pas déjà rencontrés.
 */
function b1Ok(a: PlayerStanding, b: PlayerStanding): boolean {
  return !a.opponentsPlayed.has(b.player.id)
}

/**
 * Génère les deux reconfigurations possibles de deux paires (A,B)+(C,D) :
 *   → (A,C)+(B,D) et (A,D)+(B,C)
 * Exclut la configuration d'origine.
 */
function swapCandidates(
  p1: [PlayerStanding, PlayerStanding],
  p2: [PlayerStanding, PlayerStanding],
): [PlayerStanding, PlayerStanding][][] {
  const [a, b] = p1
  const [c, d] = p2
  return [
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ]
}
import { getColorPreference } from './colorPreference'

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
 * Post-optimise les violations B5/B6 par échanges locaux de paires,
 * sans jamais casser B1 (déjà joué) ni changer le nombre de paires.
 *
 * O(n² × iterations) — bornée, converge vite en pratique.
 */
export function optimizeFloats(
  pairs: [PlayerStanding, PlayerStanding][],
): [PlayerStanding, PlayerStanding][] {
  if (pairs.length < 2) return pairs

  let current = [...pairs]
  const MAX_ITER = 50
  let iter = 0

  while (iter < MAX_ITER) {
    const before = floatViolationScore(current)
    if (before === 0) break

    let improved = false

    outer:
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        for (const [newP1, newP2] of swapCandidates(current[i], current[j])) {
          // B1 : vérifier les deux nouvelles paires
          if (!b1Ok(newP1[0], newP1[1])) continue
          if (!b1Ok(newP2[0], newP2[1])) continue
          // B2 : pas de conflit absolu de couleur
          if (hasAbsoluteColorConflict(newP1[0], newP1[1])) continue
          if (hasAbsoluteColorConflict(newP2[0], newP2[1])) continue

          const candidate = [...current]
          candidate[i] = newP1
          candidate[j] = newP2

          if (floatViolationScore(candidate) < before) {
            current = candidate
            improved = true
            break outer
          }
        }
      }
    }

    if (!improved) break
    iter++
  }

  return current
}