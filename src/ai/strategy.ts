import { GameState, Move } from '../types/game';

export interface AIStrategy {
  calculateMove(state: GameState, playerId: string): Move;
}

// Basic random move strategy - will be implemented later
export class RandomStrategy implements AIStrategy {
  calculateMove(state: GameState, playerId: string): Move {
    throw new Error('Not implemented');
  }
}

// Advanced strategy using pathfinding - will be implemented later
export class PathfindingStrategy implements AIStrategy {
  calculateMove(state: GameState, playerId: string): Move {
    throw new Error('Not implemented');
  }
} 