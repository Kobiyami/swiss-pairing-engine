import type { PlayerStanding, Color } from './types'

export type ColorPreferenceStrength = 'absolute' | 'strong' | 'mild' | 'none'

export interface ColorPreference {
  preferredColor: Color | null
  strength: ColorPreferenceStrength
}

/**
 * Détermine la préférence de couleur d'un joueur selon les règles FIDE :
 * - Absolue : la différence de couleur est déjà à ±2 (il FAUT corriger),
 *   ou il a eu la même couleur 2 fois de suite (il ne peut PAS la rejouer).
 * - Forte/légère : préférence simple basée sur la différence actuelle.
 * - Aucune : différence à 0 et pas de partie jouée (premier round) ou
 *   alternance déjà respectée sans urgence particulière.
 */
export function getColorPreference(standing: PlayerStanding): ColorPreference {
  const { colorDifference, colorHistory } = standing

  // Cas du tout premier round, aucune préférence
  if (colorHistory.length === 0) {
    return { preferredColor: null, strength: 'none' }
  }

  // Vérifie les 2 dernières couleurs jouées (hors bye, donc on filtre les null)
  const playedColors = colorHistory.filter((c): c is Color => c !== null)
  const lastTwo = playedColors.slice(-2)
  const samColorTwiceInRow = lastTwo.length === 2 && lastTwo[0] === lastTwo[1]

  // Règle absolue : différence à +2 ou -2 → DOIT recevoir la couleur opposée
  if (colorDifference >= 2) {
    return { preferredColor: 'black', strength: 'absolute' }
  }
  if (colorDifference <= -2) {
    return { preferredColor: 'white', strength: 'absolute' }
  }

  // Règle absolue : a eu 2 fois la même couleur d'affilée → ne peut pas la rejouer
  if (samColorTwiceInRow) {
    const lastColor = lastTwo[0]
    return {
      preferredColor: lastColor === 'white' ? 'black' : 'white',
      strength: 'absolute',
    }
  }

  // Préférence forte : différence de ±1
  if (colorDifference === 1) {
    return { preferredColor: 'black', strength: 'strong' }
  }
  if (colorDifference === -1) {
    return { preferredColor: 'white', strength: 'strong' }
  }

  // Différence à 0 : préférence légère basée sur la dernière couleur jouée
  // (pour favoriser l'alternance)
  const lastColor = playedColors[playedColors.length - 1]
  if (lastColor) {
    return {
      preferredColor: lastColor === 'white' ? 'black' : 'white',
      strength: 'mild',
    }
  }

  return { preferredColor: null, strength: 'none' }
}