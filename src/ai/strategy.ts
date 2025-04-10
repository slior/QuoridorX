import { GameState, Move } from '../types/game';

/**
 * Interface for AI move calculation strategies
 */
export interface AIStrategy {
    /**
     * Calculates next move for a player
     * @param state - Current game state
     * @param playerId - ID of player to move
     * @returns Move to execute
     */
    calculateMove(state: GameState, playerId: string): Move;
}

/**
 * Basic strategy that makes random valid moves
 */
export class RandomStrategy implements AIStrategy {
    /**
     * Calculates a random valid move
     * @param state - Current game state
     * @param playerId - ID of player to move
     * @returns Random valid move
     * @throws Error Not implemented
     */
    calculateMove(state: GameState, playerId: string): Move {
        throw new Error('Not implemented');
    }
}

/**
 * Advanced strategy using pathfinding to make optimal moves
 */
export class PathfindingStrategy implements AIStrategy {
    /**
     * Calculates optimal move using pathfinding
     * @param state - Current game state
     * @param playerId - ID of player to move
     * @returns Optimal move based on pathfinding
     * @throws Error Not implemented
     */
    calculateMove(state: GameState, playerId: string): Move {
        throw new Error('Not implemented');
    }
} 