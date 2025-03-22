import { GameEngine, GameState } from './types/game';
import { GameEventEmitter } from './core/events';

// This will be our main game engine implementation - to be implemented later
class QuoridorGame implements GameEngine {
  private state: GameState;
  private events: GameEventEmitter;

  constructor() {
    this.events = new GameEventEmitter();
    // Initialize with default state - to be implemented
    this.state = {
      board: {
        size: 9,
        walls: []
      },
      players: [],
      currentPlayerIndex: 0,
      isGameOver: false,
      winner: null
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  isValidMove(): boolean {
    throw new Error('Not implemented');
  }

  makeMove(): boolean {
    throw new Error('Not implemented');
  }

  getValidMoves(): [] {
    throw new Error('Not implemented');
  }
}

// Export the main game class and types
export { QuoridorGame };
export * from './types/game';
export * from './ai/strategy';
export * from './core/events';
