export const DEFAULT_GAME_SIZE = 9;

export class Position
{
  readonly row: number;
  readonly col: number;
  readonly boardSize : number;
  
  // Make constructor private to prevent extension and direct instantiation
  private constructor(row: number, col: number, boardSize :  number) {
    this.row = row;
    this.col = col;
    this.boardSize = boardSize
  }
  
  static create(row: number, col: number, boardSize : number = DEFAULT_GAME_SIZE): Position {

      if (boardSize === undefined || boardSize <= 0) throw new Error("Invalid board size")
      if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
          throw new Error(`Invalid position: row ${row}, col ${col} must be between 0 and ${boardSize-1}`);
      }
      return new Position(row, col,boardSize);
  }

  hasRight() : boolean { return this.col < this.boardSize - 1}

  right(): Position {
    if (!this.hasRight())
      throw new Error(`No right from position: row ${this.row}, col ${this.col} as it is in the rightmost column`);
    return new Position(this.row,this.col + 1,this.boardSize)
  }

  hasLeft() : boolean { return this.col > 0 }
  left(): Position {
    if (!this.hasLeft())
      throw new Error(`No left from position: row ${this.row}, col ${this.col} as it is in the leftmost column`);
    return new Position(this.row, this.col - 1, this.boardSize)
  }

  hasUp() : boolean { return this.row > 0}

  up(): Position {
    if (!this.hasUp())
      throw new Error(`No up from position: row ${this.row}, col ${this.col} as it is in the topmost row`);
    return new Position(this.row-1, this.col,this.boardSize)
  }

  hasDown() : boolean { return this.row < this.boardSize - 1 }
  
  down(): Position {
    
    if (!this.hasDown())
      throw new Error(`No down from position: row ${this.row}, col ${this.col} as it is in the bottommost row`);
    
    return new Position(this.row + 1, this.col, this.boardSize)
  }

  
  // Equality method to compare positions
  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col;
  }

  // For use in Maps and other collections
  hashCode(): string {
    return `${this.row},${this.col}`;
  }

  toString() : string
  {
    return `(${this.row},${this.col})`
  }
}

/**
 * A wall in the game.
 * The position refers to the position of the wall - the position right above (if horizontal) or to the right (if vertical).
 * The wall therefore extends to position:
 * - (position.row + 1, position.col) if vertical
 * - (position.row, position.col + 1) is horizontal
 */
export class Wall {
  readonly position: Position;
  readonly isHorizontal: boolean;

  constructor(position: Position, isHorizontal: boolean) {
    this.position = position;
    this.isHorizontal = isHorizontal;
  }

  // Equality method to compare walls
  equals(other: Wall): boolean {
    return this.position.equals(other.position) && 
           this.isHorizontal === other.isHorizontal;
  }

  // For use in Maps and other collections
  hashCode(): string {
    return `${this.position.row},${this.position.col},${this.isHorizontal}`;
  }

  occupies() : Position[]
  {
    const secondPos = this.isHorizontal ? 
                        this.position.right() :
                        this.position.down()
    return [this.position, secondPos]
  }

  toString() : string
  {
    return `(${this.occupies().map(p => p.toString())}) - ${this.isHorizontal}`
  }
  
}

// Define constants for player types
export const PLAYER_TYPE_HUMAN = 'human';
export const PLAYER_TYPE_AI = 'ai';
export type PlayerType = typeof PLAYER_TYPE_HUMAN | typeof PLAYER_TYPE_AI;

export type PlayerID = number

export interface Player {
  id: PlayerID;
  type: PlayerType;
  position: Position;
  wallsRemaining: number;
}

export enum GameStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    PLAYER_1_WON = 'PLAYER_1_WON',
    PLAYER_2_WON = 'PLAYER_2_WON'
}

export interface GameState {
    currentTurn: PlayerID;
    status: GameStatus;
}

// Define constants for move types
export const MOVE_TYPE_MOVE = 'move';
export const MOVE_TYPE_WALL = 'wall';

// Use the constants in the Move type
export type Move = {
  type: typeof MOVE_TYPE_MOVE;
  playerId: string;
  to: Position;
} | {
  type: typeof MOVE_TYPE_WALL;
  playerId: string;
  wall: Wall;
};

export interface GameEngine {
  getState(): GameState;
  isValidMove(move: Move): boolean;
  makeMove(move: Move): boolean;
  getValidMoves(playerId: string): Move[];
} 