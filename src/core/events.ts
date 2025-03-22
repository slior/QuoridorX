import { GameState, Move } from '../types/game';

export const GameEventType = {
  MOVE_EXECUTED: 'moveExecuted',
  GAME_OVER: 'gameOver',
  TURN_CHANGED: 'turnChanged'
} as const;

export type GameEventTypes = typeof GameEventType[keyof typeof GameEventType];

export type GameEvent = {
  type: GameEventTypes;
  payload: {
    state: GameState;
    move?: Move;
  };
};

export type GameEventListener = (event: GameEvent) => void;

/**
 * GameEventEmitter is a class that manages the emission and subscription of game events.
 * It allows listeners to subscribe to events and emits events to all subscribed listeners.
 */
export class GameEventEmitter {
  /**
   * An array to hold all subscribed listeners.
   */
  private listeners: GameEventListener[] = [];

  /**
   * Subscribes a listener to game events.
   * @param listener The listener function to be subscribed.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(listener: GameEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emits a game event to all subscribed listeners.
   * @param event The game event to be emitted.
   */
  emit(event: GameEvent): void {
    this.listeners.forEach(listener => listener(event));
  }
} 