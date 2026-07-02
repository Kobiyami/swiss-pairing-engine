export interface Player {
  id: string
  name: string
  rating: number // ELO, 0 si non renseigné
  title?: string // GM, IM, FM... optionnel, sert au départage du classement initial
  pairingNumber: number // numéro attribué au départ (#1, #2...)
}

export type GameOutcome = 'win' | 'loss' | 'draw' | 'bye' | 'requestedBye' | 'pending'
export type Color = 'white' | 'black'

export interface GameResult {
  round: number
  opponentId: string | null
  color: Color | null
  result: GameOutcome
  float?: 'up' | 'down' | null  // optionnel — absent si pas de float
}

export interface PlayerStanding {
  player: Player
  score: number
  games: GameResult[]
  colorHistory: (Color | null)[]
  colorDifference: number
  opponentsPlayed: Set<string>
  hasHadBye: boolean
  floatHistory: ('up' | 'down' | null)[]
  withdrawn: boolean  // ← ajouter
}

export interface Pairing {
  board: number
  whiteId: string | null
  blackId: string | null
  isBye: boolean
  isRequestedBye?: boolean
  whiteFloat?: 'up' | 'down' | null
  blackFloat?: 'up' | 'down' | null
}

export interface RoundPairings {
  round: number
  pairings: Pairing[]
}
export interface TournamentInfo {
  name: string
  city?: string
  federation?: string
  dateStart?: string  // YYYY-MM-DD
  dateEnd?: string
  totalRounds: number
}

export type GameResultInput = {
  whiteId: string
  blackId: string | null
  result: 'white' | 'black' | 'draw' | 'bye' | 'requestedBye'
}