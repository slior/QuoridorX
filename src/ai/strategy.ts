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
 * Options for RandomStrategy behavior
 */
export type RandomStrategyOptions = {
    /** Deterministic RNG function returning a number in [0,1). Defaults to Math.random */
    rng?: () => number;
    /** Function that returns all valid moves for the player in the given state */
    getValidMoves: (state: GameState, playerId: string) => Move[];
};

/**
 * Basic strategy that makes random valid moves
 */
export class RandomStrategy implements AIStrategy {
    private readonly rng: () => number;
    private readonly getValidMovesFn: (state: GameState, playerId: string) => Move[];

    constructor(options: RandomStrategyOptions) {
        this.rng = options.rng ?? Math.random;
        this.getValidMovesFn = options.getValidMoves;
    }

    /**
     * Calculates a random valid move
     * @param state - Current game state
     * @param playerId - ID of player to move
     * @returns Random valid move
     * @throws Error if no valid moves are available
     */
    calculateMove(state: GameState, playerId: string): Move {
        const moves = this.getValidMovesFn(state, playerId);
        if (!moves || moves.length === 0) {
            throw new Error('No valid moves');
        }
        const r = this.rng();
        // Ensure index is within bounds even if rng returns 1.0 due to custom implementations
        const idx = Math.min(moves.length - 1, Math.floor(r * moves.length));
        return moves[idx];
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
