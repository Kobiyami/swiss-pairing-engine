import type { Player, PlayerStanding, TournamentInfo, GameResultInput, RoundPairings } from './types'
import { initStanding, applyGameResult } from './standings'
import { generateRound } from './generateRound'

export class Tournament {
  info: TournamentInfo
  players: Player[]
  standings: PlayerStanding[]
  roundPairings: RoundPairings[]
  currentRound: number

  constructor(info: TournamentInfo, players: Player[]) {
    this.info = info
    this.players = players
    this.standings = players.map(initStanding)
    this.roundPairings = []
    this.currentRound = 0
  }

  generateNextRound(): RoundPairings {
    if (this.currentRound >= this.info.totalRounds) {
      throw new Error('Tournament is already complete')
    }
    this.currentRound++
    const pairings = generateRound(this.standings, this.currentRound)
    this.roundPairings.push(pairings)
    return pairings
  }

  submitResults(roundNumber: number, results: GameResultInput[]): void {
    const standingsMap = new Map(this.standings.map(s => [s.player.id, s]))

    for (const result of results) {
      if (result.result === 'bye') {
        const player = standingsMap.get(result.whiteId)
        if (player) {
          standingsMap.set(player.player.id, applyGameResult(player, {
            round: roundNumber,
            opponentId: null,
            color: null,
            result: 'bye',
            float: null,
          }))
        }
        continue
      }

      const whitePlayer = standingsMap.get(result.whiteId)
      const blackPlayer = result.blackId ? standingsMap.get(result.blackId) : null

      // Récupérer les floats depuis les pairings de cette ronde
      const roundPairing = this.roundPairings.find(r => r.round === roundNumber)
      const pairing = roundPairing?.pairings.find(
        p => p.whiteId === result.whiteId && p.blackId === result.blackId
      )

      if (whitePlayer) {
        standingsMap.set(whitePlayer.player.id, applyGameResult(whitePlayer, {
          round: roundNumber,
          opponentId: result.blackId,
          color: 'white',
          result: result.result === 'white' ? 'win' : result.result === 'black' ? 'loss' : 'draw',
          float: pairing?.whiteFloat ?? null,
        }))
      }

      if (blackPlayer && result.blackId) {
        standingsMap.set(blackPlayer.player.id, applyGameResult(blackPlayer, {
          round: roundNumber,
          opponentId: result.whiteId,
          color: 'black',
          result: result.result === 'black' ? 'win' : result.result === 'white' ? 'loss' : 'draw',
          float: pairing?.blackFloat ?? null,
        }))
      }
    }

    this.standings = this.players.map(p => standingsMap.get(p.id)!)
  }

  isComplete(): boolean {
    return this.currentRound >= this.info.totalRounds
  }
}