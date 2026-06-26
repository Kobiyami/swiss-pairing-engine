import type { Player, PlayerStanding, GameResult, Color } from './types'

export function initStanding(player: Player): PlayerStanding {
  return {
    player,
    score: 0,
    games: [],
    colorHistory: [],
    colorDifference: 0,
    opponentsPlayed: new Set(),
    hasHadBye: false,
    floatHistory: [],
  }
}

function scoreForResult(result: GameResult['result']): number {
  switch (result) {
    case 'win':
    case 'bye':
      return 1
    case 'draw':
      return 0.5
    case 'loss':
      return 0
    case 'pending':
      return 0
  }
}

export function applyGameResult(standing: PlayerStanding, game: GameResult): PlayerStanding {
  const newScore = standing.score + scoreForResult(game.result)
  const newColorHistory = [...standing.colorHistory, game.color]

  let colorDiff = standing.colorDifference
  if (game.color === 'white') colorDiff += 1
  if (game.color === 'black') colorDiff -= 1

  const newOpponents = new Set(standing.opponentsPlayed)
  if (game.opponentId) newOpponents.add(game.opponentId)

  return {
    ...standing,
    score: newScore,
    games: [...standing.games, game],
    colorHistory: newColorHistory,
    colorDifference: colorDiff,
    opponentsPlayed: newOpponents,
    hasHadBye: standing.hasHadBye || game.result === 'bye',
  }
}

export function buildStandingsFromHistory(
  players: Player[],
  allGames: Map<string, GameResult[]>
): PlayerStanding[] {
  return players.map(player => {
    let standing = initStanding(player)
    const games = allGames.get(player.id) ?? []
    for (const game of games) {
      standing = applyGameResult(standing, game)
    }
    return standing
  })
}