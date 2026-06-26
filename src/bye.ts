import type { PlayerStanding } from './types'

/**
 * Détermine qui doit recevoir le bye en cas de nombre impair de joueurs.
 * Règle FIDE : le joueur le moins bien classé qui n'a pas encore reçu
 * de bye et n'a pas déjà gagné sans jouer.
 */
export function selectByePlayer(standings: PlayerStanding[]): PlayerStanding | null {
  // On part du moins bien classé (fin de la liste triée) et on remonte
  for (let i = standings.length - 1; i >= 0; i--) {
    if (!standings[i].hasHadBye) {
      return standings[i]
    }
  }
  // Cas extrême : tout le monde a déjà eu un bye (ne devrait pas arriver
  // dans un tournoi bien dimensionné), on prend le dernier quand même
  return standings.length > 0 ? standings[standings.length - 1] : null
}