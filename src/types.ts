export interface Player {
  id: string
  name: string
  rating: number // ELO, 0 si non renseigné
  title?: string // GM, IM, FM... optionnel, sert au départage du classement initial
  pairingNumber: number // numéro attribué au départ (#1, #2...)
}

export type GameOutcome = 'win' | 'loss' | 'draw' | 'bye' | 'pending'
export type Color = 'white' | 'black'

export interface GameResult {
  round: number
  opponentId: string | null // null si bye
  color: Color | null // null si bye
  result: GameOutcome
}

export interface PlayerStanding {
  player: Player
  score: number // points cumulés (1 = victoire, 0.5 = nulle, 0 = défaite)
  games: GameResult[]
  colorHistory: (Color | null)[]
  colorDifference: number // nb blancs - nb noirs
  opponentsPlayed: Set<string>
  hasHadBye: boolean
  floatHistory: ('up' | 'down' | null)[]
}

export interface Pairing {
  board: number
  whiteId: string | null
  blackId: string | null
  isBye: boolean
}

export interface RoundPairings {
  round: number
  pairings: Pairing[]
}