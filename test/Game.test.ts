import { expect } from 'chai';
import { Game, GameError, NoWallsRemainingError, PathBlockedError } from '../src/core/Game';
import { Board } from '../src/core/Board';
import { Position, Wall, DEFAULT_GAME_SIZE } from '../src/types/game';

describe('Game', () => {
  let board: Board;
  let game: Game;
  const PLAYER1_ID = 1;
  const PLAYER2_ID = 2;
  const WALL_PER_PLAYER = 6;

  beforeEach(() => {
    // Setup a new board with players in starting positions
    const pawnPositions = new Map([
      [PLAYER1_ID, Position.create(0, 4, DEFAULT_GAME_SIZE)],  // Player 1 starts at top center
      [PLAYER2_ID, Position.create(8, 4, DEFAULT_GAME_SIZE)]   // Player 2 starts at bottom center
    ]);
    board = Board.withPawns(pawnPositions);
    game = new Game(board,WALL_PER_PLAYER);
  });

  describe('player management', () => {
    it('should add players with correct number of walls', () => {
      game.addPlayer(PLAYER1_ID);
      
      // Try to place WALL_PER_PLAYER walls
      const pos = Position.create(4, 4, DEFAULT_GAME_SIZE);
      for (let i = 0; i < WALL_PER_PLAYER; i++) {
        const wall = new Wall(Position.create(i, 0, DEFAULT_GAME_SIZE), true);
        expect(() => game.placeWall(PLAYER1_ID, wall)).to.not.throw();
      }

      // WALL_PER_PLAYER+1 wall should throw
      const extraWall = new Wall(pos, true);
      expect(() => game.placeWall(PLAYER1_ID, extraWall))
        .to.throw(NoWallsRemainingError);
    });

    it('should throw when placing wall for non-existent player', () => {
      const wall = new Wall(Position.create(4, 4, DEFAULT_GAME_SIZE), true);
      expect(() => game.placeWall(999, wall))
        .to.throw(GameError, 'Player 999 is not in the game');
    });
  });

  describe('wall placement', () => {
    beforeEach(() => {
      game.addPlayer(PLAYER1_ID);
      game.addPlayer(PLAYER2_ID);
    });

    it('should allow valid wall placement', () => {
      const wall = new Wall(Position.create(4, 4, DEFAULT_GAME_SIZE), true);
      expect(() => game.placeWall(PLAYER1_ID, wall)).to.not.throw();
    });

    it('should throw on invalid wall placement', () => {
      const wall = new Wall(Position.create(8, 8, DEFAULT_GAME_SIZE), true);
      expect(() => game.placeWall(PLAYER1_ID, wall))
        .to.throw('Invalid wall placement');
    });

    it('should prevent walls that block all paths to goal', () => {
      // Place walls to block player 1's path to bottom
      const walls = [
        new Wall(Position.create(1, 3, DEFAULT_GAME_SIZE), true),
        new Wall(Position.create(1, 5, DEFAULT_GAME_SIZE), true),
        new Wall(Position.create(1, 1, DEFAULT_GAME_SIZE), true),
        new Wall(Position.create(1, 7, DEFAULT_GAME_SIZE), true),
        new Wall(Position.create(2, 1, DEFAULT_GAME_SIZE), false),
      ];

      // Place first 4 walls
      walls.forEach(wall => {
        game.placeWall(PLAYER2_ID, wall);
      });

      // The final wall that would completely block the path
      const blockingWall = new Wall(Position.create(3, 0, DEFAULT_GAME_SIZE), true);
      expect(() => game.placeWall(PLAYER2_ID, blockingWall))
        .to.throw(PathBlockedError);
    });

    it('should allow walls that leave at least one path to goal', () => {
      // Place walls leaving one path
      const walls = [
        new Wall(Position.create(1, 0, DEFAULT_GAME_SIZE), true),
        new Wall(Position.create(1, 2, DEFAULT_GAME_SIZE), true),
        new Wall(Position.create(1, 4, DEFAULT_GAME_SIZE), true),
        new Wall(Position.create(1, 6, DEFAULT_GAME_SIZE), true),
      ];

      // All these walls should be allowed as they leave a path
      walls.forEach(wall => {
        expect(() => game.placeWall(PLAYER2_ID, wall)).to.not.throw();
      });
    });
  });
}); 