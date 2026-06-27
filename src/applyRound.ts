import type { PlayerStanding, RoundPairings, GameOutcome } from './types'
import { applyGameResult } from './standings'

/**
 * Applique les résultats d'une ronde aux standings et retourne les
 * nouveaux standings mis à jour. Pour les tests/simulations, on peut
 * fournir une fonction qui détermine le résultat de chaque partie
 * (par défaut : victoire aléatoire ou nulle).
 */
export function applyRoundResults(
  standings: PlayerStanding[],
  round: RoundPairings,
  decideResult: (whiteId: string, blackId: string | null) => GameOutcome = defaultRandomResult
): PlayerStanding[] {
  const standingsMap = new Map(standings.map(s => [s.player.id, s]))

  for (const pairing of round.pairings) {
    if (pairing.isBye) {
      const player = standingsMap.get(pairing.whiteId!)
      if (player) {
        standingsMap.set(
          player.player.id,
          applyGameResult(player, {
            round: round.round,
            opponentId: null,
            color: null,
            result: 'bye',
          })
        )
      }
      continue
    }

    const whiteOutcome = decideResult(pairing.whiteId!, pairing.blackId)
    const blackOutcome = invertOutcome(whiteOutcome)

    const whitePlayer = standingsMap.get(pairing.whiteId!)
    const blackPlayer = standingsMap.get(pairing.blackId!)

    if (whitePlayer) {
      standingsMap.set(
        whitePlayer.player.id,
        applyGameResult(whitePlayer, {
          round: round.round,
          opponentId: pairing.blackId,
          color: 'white',
          result: whiteOutcome,
          float: pairing.whiteFloat ?? null,
        })
      )
    }
    if (blackPlayer) {
      standingsMap.set(
        blackPlayer.player.id,
        applyGameResult(blackPlayer, {
          round: round.round,
          opponentId: pairing.whiteId,
          color: 'black',
          result: blackOutcome,
          float: pairing.blackFloat ?? null,
        })
      )
    }
  }

  return standings.map(s => standingsMap.get(s.player.id)!)
}

function invertOutcome(outcome: GameOutcome): GameOutcome {
  if (outcome === 'win') return 'loss'
  if (outcome === 'loss') return 'win'
  return outcome // draw reste draw
}

function defaultRandomResult(): GameOutcome {
  const r = Math.random()
  if (r < 0.45) return 'win'
  if (r < 0.9) return 'loss'
  return 'draw'
}