import type { Tournament } from './tournament'

function pad(str: string, length: number): string {
  return str.padEnd(length, ' ').slice(0, length)
}

function formatResult(result: string): string {
  switch (result) {
    case 'win':  return '1'
    case 'loss': return '0'
    case 'draw': return '='
    case 'bye':  return 'U'
    default:     return ' '
  }
}

export function exportTRF(tournament: Tournament): string {
  const lines: string[] = []
  const { info, players, standings, roundPairings } = tournament

  // Métadonnées
  lines.push(`012 ${info.name}`)
  if (info.city)        lines.push(`022 ${info.city}`)
  if (info.federation)  lines.push(`032 ${info.federation}`)
  if (info.dateStart)   lines.push(`042 ${info.dateStart}`)
  if (info.dateEnd)     lines.push(`052 ${info.dateEnd}`)
  lines.push(`062 ${info.totalRounds}`)

  // Ligne par joueur
  for (const standing of standings) {
    const p = standing.player
    const rank = p.pairingNumber
    const name = pad(`${p.name}`, 33)
    const rating = String(p.rating).padStart(4, ' ')
    const score = standing.score.toFixed(1).padStart(4, ' ')

    // Résultats ronde par ronde
    const roundResults = roundPairings.map(round => {
      const pairing = round.pairings.find(
        pair => pair.whiteId === p.id || pair.blackId === p.id
      )

      if (!pairing) return '     '

      if (pairing.isBye) {
        return `  0000U`
      }

      const isWhite = pairing.whiteId === p.id
      const opponentId = isWhite ? pairing.blackId : pairing.whiteId
      const opponentStanding = standings.find(s => s.player.id === opponentId)
      const opponentRank = opponentStanding
        ? String(opponentStanding.player.pairingNumber).padStart(4, ' ')
        : '   0'

      const game = standing.games.find(g => g.round === round.round)
      const result = game ? formatResult(game.result) : ' '
      const color = isWhite ? 'W' : 'B'

      return `${opponentRank}${color}${result}`
    })

    const roundStr = roundResults.join(' ')
    lines.push(`001 ${String(rank).padStart(4, ' ')} ${name} ${rating}        ${score}    ${roundStr}`)
  }

  return lines.join('\n')
}