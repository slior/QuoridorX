import { expect } from 'chai';
import { RandomStrategy, AIStrategy } from '../../src/ai/strategy';
import { GameState, Move, MOVE_TYPE_MOVE, Position, P1, P2, DEFAULT_GAME_SIZE } from '../../src/types/game';

// Helper to build a simple move to a given position for a player
function moveTo(row: number, col: number, playerId: number): Move {
  return {
    type: MOVE_TYPE_MOVE,
    playerId: String(playerId),
    to: Position.create(row, col, DEFAULT_GAME_SIZE)
  }
}

describe('RandomStrategy', () => {
  const baseState: GameState = { currentTurn: P1, status: 'IN_PROGRESS' as any };

  it('should throw if no valid moves are available', () => {
    const strategy = new RandomStrategy({
      rng: () => 0.123,
      getValidMoves: () => []
    });

    expect(() => strategy.calculateMove(baseState, String(P1))).to.throw('No valid moves');
  });

  it('should deterministically pick index 0 when rng returns 0.0', () => {
    const moves: Move[] = [
      moveTo(0, 0, P1),
      moveTo(0, 1, P1),
      moveTo(0, 2, P1)
    ];

    const strategy = new RandomStrategy({
      rng: () => 0.0,
      getValidMoves: () => moves
    });

    const chosen = strategy.calculateMove(baseState, String(P1));
    expect(chosen).to.deep.equal(moves[0]);
  });

  it('should deterministically pick last index when rng is near 1.0', () => {
    const moves: Move[] = [
      moveTo(1, 0, P1),
      moveTo(1, 1, P1),
      moveTo(1, 2, P1)
    ];

    const strategy = new RandomStrategy({
      rng: () => 0.9999,
      getValidMoves: () => moves
    });

    const chosen = strategy.calculateMove(baseState, String(P1));
    expect(chosen).to.deep.equal(moves[2]);
  });

  it('should pick middle index when rng maps accordingly', () => {
    const moves: Move[] = [
      moveTo(2, 0, P2),
      moveTo(2, 1, P2),
      moveTo(2, 2, P2)
    ];

    const strategy = new RandomStrategy({
      rng: () => 0.5,
      getValidMoves: () => moves
    });

    const chosen = strategy.calculateMove(baseState, String(P2));
    expect(chosen).to.deep.equal(moves[1]);
  });

  it('should default to Math.random if rng not provided (non-deterministic)', () => {
    const moves: Move[] = [
      moveTo(3, 0, P1),
      moveTo(3, 1, P1)
    ];

    const strategy = new RandomStrategy({
      getValidMoves: () => moves
    });

    const chosen = strategy.calculateMove(baseState, String(P1));
    expect(moves).to.include(chosen);
  });
});
