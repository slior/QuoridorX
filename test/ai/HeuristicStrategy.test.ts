import { expect } from 'chai';
import { HeuristicStrategy } from '../../src/ai/strategy';
import { GameState, Move, MOVE_TYPE_MOVE, MOVE_TYPE_WALL, Position, Wall, P1, P2, DEFAULT_GAME_SIZE } from '../../src/types/game';

// Helper to create a pawn move
function createMove(row: number, col: number, playerId: string): Move {
    return {
        type: MOVE_TYPE_MOVE,
        playerId: playerId,
        to: Position.create(row, col, DEFAULT_GAME_SIZE)
    };
}

// Helper to create a wall move
function createWallMove(row: number, col: number, isHorizontal: boolean, playerId: string): Move {
    return {
        type: MOVE_TYPE_WALL,
        playerId: playerId,
        wall: new Wall(Position.create(row, col, DEFAULT_GAME_SIZE), isHorizontal)
    };
}

describe('HeuristicStrategy', () => {
    const baseState: GameState = { currentTurn: P1, status: 'IN_PROGRESS' as any };

    describe('default goal-oriented scoring', () => {
        it('should score Player 1 moves closer to bottom row (row 8) higher', () => {
            const moves = [
                createMove(5, 4, '1'), // Distance to goal: 3
                createMove(3, 4, '1'), // Distance to goal: 5
                createMove(7, 4, '1')  // Distance to goal: 1 (best)
            ];

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves
            });

            const chosen = strategy.calculateMove(baseState, '1');
            expect(chosen).to.deep.equal(moves[2]); // Should pick row 7 (closest to row 8)
        });

        it('should score Player 2 moves closer to top row (row 0) higher', () => {
            const moves = [
                createMove(5, 4, '2'), // Distance to goal: 5
                createMove(1, 4, '2'), // Distance to goal: 1 (best)
                createMove(3, 4, '2')  // Distance to goal: 3
            ];

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves
            });

            const chosen = strategy.calculateMove(baseState, '2');
            expect(chosen).to.deep.equal(moves[1]); // Should pick row 1 (closest to row 0)
        });

        it('should score wall moves lower than beneficial pawn moves', () => {
            const pawnMove = createMove(7, 4, '1'); // Very close to goal
            const wallMove = createWallMove(4, 4, true, '1');
            const moves = [wallMove, pawnMove];

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves
            });

            const chosen = strategy.calculateMove(baseState, '1');
            expect(chosen).to.deep.equal(pawnMove); // Should prefer the goal-advancing pawn move
        });

        it('should handle moves at goal row correctly', () => {
            const moves = [
                createMove(8, 3, '1'), // At goal row
                createMove(8, 4, '1'), // At goal row  
                createMove(7, 4, '1')  // One away from goal
            ];

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves
            });

            const chosen = strategy.calculateMove(baseState, '1');
            // Should pick one of the goal row moves (tie-breaker will choose first)
            expect([moves[0], moves[1]]).to.include(chosen);
        });
    });

    describe('move selection', () => {
        it('should throw error when no valid moves are available', () => {
            const strategy = new HeuristicStrategy({
                getValidMoves: () => []
            });

            expect(() => strategy.calculateMove(baseState, '1')).to.throw('No valid moves');
        });

        it('should select the highest scoring move deterministically', () => {
            const moves = [
                createMove(4, 4, '1'), // Distance to goal: 4, score: 96
                createMove(6, 4, '1'), // Distance to goal: 2, score: 98 (best)
                createMove(2, 4, '1')  // Distance to goal: 6, score: 94
            ];

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves
            });

            const chosen = strategy.calculateMove(baseState, '1');
            expect(chosen).to.deep.equal(moves[1]); // Should consistently pick the best scoring move
        });

        it('should use tie-breaker when multiple moves have same score', () => {
            const moves = [
                createMove(5, 3, '1'), // Distance to goal: 3
                createMove(5, 4, '1'), // Distance to goal: 3 (same score)
                createMove(5, 5, '1')  // Distance to goal: 3 (same score)
            ];

            // Default tie-breaker should pick first move
            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves
            });

            const chosen = strategy.calculateMove(baseState, '1');
            expect(chosen).to.deep.equal(moves[0]); // Should pick first move in tie
        });
    });

    describe('pluggable components', () => {
        it('should use custom scoring function when provided', () => {
            const moves = [
                createMove(2, 2, '1'),
                createMove(6, 6, '1')
            ];

            // Custom scorer that prefers moves with higher column numbers
            const customScorer = (move: Move, gameState: GameState, playerId: string) => {
                if (move.type === MOVE_TYPE_MOVE) {
                    return move.to.col; // Higher column = higher score
                }
                return 0;
            };

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves,
                scoringFunction: customScorer
            });

            const chosen = strategy.calculateMove(baseState, '1');
            expect(chosen).to.deep.equal(moves[1]); // Should pick move with col 6
        });

        it('should use custom tie-breaker when provided', () => {
            const moves = [
                createMove(5, 3, '1'), // Same distance to goal
                createMove(5, 4, '1'), // Same distance to goal
                createMove(5, 5, '1')  // Same distance to goal
            ];

            // Custom tie-breaker that picks the last move
            const customTieBreaker = (moves: Move[]) => moves[moves.length - 1];

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves,
                tieBreaker: customTieBreaker
            });

            const chosen = strategy.calculateMove(baseState, '1');
            expect(chosen).to.deep.equal(moves[2]); // Should pick last move due to custom tie-breaker
        });

        it('should pass correct parameters to scoring function', () => {
            const moves = [createMove(4, 4, '1')];
            let capturedMove: Move | null = null;
            let capturedGameState: GameState | null = null;
            let capturedPlayerId: string | null = null;

            const scoringFunction = (move: Move, gameState: GameState, playerId: string) => {
                capturedMove = move;
                capturedGameState = gameState;
                capturedPlayerId = playerId;
                return 50;
            };

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves,
                scoringFunction: scoringFunction
            });

            strategy.calculateMove(baseState, '1');

            expect(capturedMove).to.deep.equal(moves[0]);
            expect(capturedGameState).to.deep.equal(baseState);
            expect(capturedPlayerId).to.equal('1');
        });
    });

    describe('deterministic behavior', () => {
        it('should always return the same move for the same input', () => {
            const moves = [
                createMove(3, 4, '1'),
                createMove(5, 4, '1'),
                createMove(7, 4, '1') // Best move
            ];

            const strategy = new HeuristicStrategy({
                getValidMoves: () => moves
            });

            const firstChoice = strategy.calculateMove(baseState, '1');
            const secondChoice = strategy.calculateMove(baseState, '1');
            const thirdChoice = strategy.calculateMove(baseState, '1');

            expect(firstChoice).to.deep.equal(secondChoice);
            expect(secondChoice).to.deep.equal(thirdChoice);
            expect(firstChoice).to.deep.equal(moves[2]); // Should always pick the best move
        });
    });
});