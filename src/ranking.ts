import type { PlayerStanding } from './types'

const TITLE_RANK: Record<string, number> = {
  GM: 1,
  WGM: 2,
  IM: 3,
  WIM: 4,
  FM: 5,
  WFM: 6,
  CM: 7,
  WCM: 8,
}

function titleValue(title?: string): number {
  if (!title) return 99 // pas de titre = moins prioritaire
  return TITLE_RANK[title] ?? 99
}

/**
 * Trie les joueurs selon les règles FIDE pour l'ordre de pairing :
 * 1. Score décroissant
 * 2. Classement ELO décroissant (en cas d'égalité de score)
 * 3. Titre (en cas d'égalité de score ET de classement)
 * 4. Ordre alphabétique du nom (dernier recours, pour un résultat déterministe)
 */
export function sortByRanking(standings: PlayerStanding[]): PlayerStanding[] {
  return [...standings].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.player.rating !== a.player.rating) return b.player.rating - a.player.rating
    const titleDiff = titleValue(a.player.title) - titleValue(b.player.title)
    if (titleDiff !== 0) return titleDiff
    return a.player.name.localeCompare(b.player.name)
  })
}

/**
 * Regroupe les joueurs triés en score brackets (groupes de même score).
 */
export function groupByScore(sortedStandings: PlayerStanding[]): PlayerStanding[][] {
  const groups: PlayerStanding[][] = []
  let currentGroup: PlayerStanding[] = []
  let currentScore: number | null = null

  for (const standing of sortedStandings) {
    if (currentScore === null || standing.score === currentScore) {
      currentGroup.push(standing)
      currentScore = standing.score
    } else {
      groups.push(currentGroup)
      currentGroup = [standing]
      currentScore = standing.score
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup)

  return groups
}