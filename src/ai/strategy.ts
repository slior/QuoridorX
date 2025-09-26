import { GameState, Move, MOVE_TYPE_MOVE } from '../types/game';

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
 * Options for HeuristicStrategy behavior
 */
export type HeuristicStrategyOptions = {
    /** Function to score a move based on heuristics. Higher score = better move */
    scoringFunction?: (move: Move, gameState: GameState, playerId: string) => number;
    /** Function that returns all valid moves for the player in the given state */
    getValidMoves: (state: GameState, playerId: string) => Move[];
    /** Tie-breaker when multiple moves have same score. Defaults to first move */
    tieBreaker?: (moves: Move[]) => Move;
};

/**
 * Default scoring function that prioritizes moves toward the goal
 * Player 1 wants to reach row 8 (bottom), Player 2 wants to reach row 0 (top)
 */
function defaultGoalOrientedScoring(move: Move, gameState: GameState, playerId: string): number {
    if (move.type === MOVE_TYPE_MOVE) {
        // Score pawn moves based on progress toward goal
        const goalRow = playerId === '1' ? 8 : 0; // P1 goes to bottom, P2 to top
        const distanceToGoal = Math.abs(move.to.row - goalRow);
        return 100 - distanceToGoal; // Closer to goal = higher score
    } else {
        // Wall moves get neutral score (lower priority than good pawn moves)
        return 50;
    }
}

/**
 * Intermediate strategy using simple heuristics to make smart moves
 */
export class HeuristicStrategy implements AIStrategy {
    private readonly scoringFn: (move: Move, gameState: GameState, playerId: string) => number;
    private readonly getValidMovesFn: (state: GameState, playerId: string) => Move[];
    private readonly tieBreaker: (moves: Move[]) => Move;

    constructor(options: HeuristicStrategyOptions) {
        this.scoringFn = options.scoringFunction ?? defaultGoalOrientedScoring;
        this.getValidMovesFn = options.getValidMoves;
        this.tieBreaker = options.tieBreaker ?? ((moves) => moves[0]);
    }

    /**
     * Calculates the best move using heuristic scoring
     * @param state - Current game state
     * @param playerId - ID of player to move
     * @returns Best move based on heuristic evaluation
     * @throws Error if no valid moves are available
     */
    calculateMove(state: GameState, playerId: string): Move {
        const moves = this.getValidMovesFn(state, playerId);
        if (!moves || moves.length === 0) {
            throw new Error('No valid moves');
        }

        // Score all moves
        const scoredMoves = moves.map(move => ({
            move,
            score: this.scoringFn(move, state, playerId)
        }));

        // Find the highest score
        const maxScore = Math.max(...scoredMoves.map(sm => sm.score));

        // Get all moves with the highest score
        const bestMoves = scoredMoves
            .filter(sm => sm.score === maxScore)
            .map(sm => sm.move);

        // Use tie-breaker to select from best moves
        return this.tieBreaker(bestMoves);
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
