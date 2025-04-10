import { expect } from 'chai';
import { Game, GameError, NoWallsRemainingError, PathBlockedError, WrongTurnError } from '../src/core/Game';
import { Board } from '../src/core/Board';
import { Position, Wall, DEFAULT_GAME_SIZE, GameStatus } from '../src/types/game';

const PLAYER1_ID = 1;
const PLAYER2_ID = 2;
const WALLS_PER_PLAYER = 10;

describe('Game', () => {
  let board: Board;
  let game: Game;

  beforeEach(() => {

    // Setup a new board with players in starting positions
    const pawnPositions = new Map([
      [PLAYER1_ID, Position.create(0, 4, DEFAULT_GAME_SIZE)],  // Player 1 starts at top center
      [PLAYER2_ID, Position.create(8, 4, DEFAULT_GAME_SIZE)]   // Player 2 starts at bottom center
    ]);
    board = Board.withPawns(pawnPositions);
    game = new Game(board, WALLS_PER_PLAYER);
  });

  describe('player management', () => {
    it('should add players with correct number of walls', () => {
      game.addPlayer(PLAYER1_ID);
      game.addPlayer(PLAYER2_ID);
      
      // Try to place WALLS_PER_PLAYER walls
      const pos = Position.create(4, 4, DEFAULT_GAME_SIZE);
      for (let i = 0; i < WALLS_PER_PLAYER; i++) {
        let p1WallRow = i % DEFAULT_GAME_SIZE
        let p1WallCol = i >= DEFAULT_GAME_SIZE ? 0 : 3
        const wall1 = new Wall(Position.create(p1WallRow, p1WallCol, DEFAULT_GAME_SIZE), true);
        expect(() => game.placeWall(PLAYER1_ID, wall1)).to.not.throw();
        let p2WallRow = i % DEFAULT_GAME_SIZE
        let p2WallCol = i >= DEFAULT_GAME_SIZE ? DEFAULT_GAME_SIZE - 2 : 5;
        const wall2 = new Wall(Position.create(p2WallRow, p2WallCol, DEFAULT_GAME_SIZE), true);
        expect(() => game.placeWall(PLAYER2_ID, wall2)).to.not.throw();
      }

      // WALLS_PER_PLAYER+1 wall should throw
      const extraWall = new Wall(pos, true);
      expect(() => game.placeWall(PLAYER1_ID, extraWall))
        .to.throw(NoWallsRemainingError);
    });

    it('should throw when placing wall for non-existent player', () => {
      game.addPlayer(PLAYER1_ID);
      game.addPlayer(PLAYER2_ID);
      
      const wall = new Wall(Position.create(4, 4, DEFAULT_GAME_SIZE), true);
      expect(() => game.placeWall(999, wall))
        .to.throw(GameError, 'Player 999 is not in the game');
    });

    it('should throw when adding more than two players', () => {
      // Add first two players - should succeed
      expect(() => game.addPlayer(PLAYER1_ID)).to.not.throw();
      expect(() => game.addPlayer(PLAYER2_ID)).to.not.throw();

      // Try to add a third player - should throw
      expect(() => game.addPlayer(3))
        .to.throw(GameError, 'Game already has maximum number of players');
      
      // Try to add a fourth player - should throw
      expect(() => game.addPlayer(4))
        .to.throw(GameError, 'Game already has maximum number of players');
    });

    it('should allow adding players in any order', () => {
      // Add player 2 first
      expect(() => game.addPlayer(PLAYER2_ID)).to.not.throw();
      
      // Add player 1 second
      expect(() => game.addPlayer(PLAYER1_ID)).to.not.throw();
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

      // Place first 4 walls, alternating between players
      for (let i = 0; i < walls.length; i++) {
        const playerId = i % 2 === 0 ? PLAYER1_ID : PLAYER2_ID;
        game.placeWall(playerId, walls[i]);
      }

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
      for (let i = 0; i < walls.length; i++) {
        const playerId = i % 2 === 0 ? PLAYER1_ID : PLAYER2_ID;
        expect(() => game.placeWall(playerId, walls[i])).to.not.throw();
      }
    });
  });

  describe('game state management', () => {
    beforeEach(() => {
      game.addPlayer(PLAYER1_ID);
      game.addPlayer(PLAYER2_ID);
    });

    it('should start with player 1\'s turn', () => {
      expect(game.getGameState().currentTurn).to.equal(PLAYER1_ID);
    });

    it('should switch turns after wall placement', () => {
      const wall = new Wall(Position.create(4, 4, DEFAULT_GAME_SIZE), true);
      game.placeWall(PLAYER1_ID, wall);
      expect(game.getGameState().currentTurn).to.equal(PLAYER2_ID);
    });

    it('should switch turns after pawn movement', () => {
      game.movePawn(PLAYER1_ID, Position.create(1, 4, DEFAULT_GAME_SIZE));
      expect(game.getGameState().currentTurn).to.equal(PLAYER2_ID);
    });

    it('should not switch turns when player wins', () => {
      // Move player 1's pawn to one step before goal
      game.movePawn(PLAYER1_ID, Position.create(1, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(8, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(2, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(7, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(3, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(6, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(4, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(5, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(5, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(4, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(6, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(3, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(7, 4, DEFAULT_GAME_SIZE));
      expect(game.getGameState().currentTurn).to.equal(PLAYER2_ID);
      
      // Player 2's turn - move somewhere
      game.movePawn(PLAYER2_ID, Position.create(2, 5, DEFAULT_GAME_SIZE));
      expect(game.getGameState().currentTurn).to.equal(PLAYER1_ID);
      
      // Player 1 moves to goal
      game.movePawn(PLAYER1_ID, Position.create(8, 4, DEFAULT_GAME_SIZE));
      expect(game.getGameState().status).to.equal(GameStatus.PLAYER_1_WON);
      // Turn shouldn't change after win
      expect(game.getGameState().currentTurn).to.equal(PLAYER1_ID);
    });

    it('should prevent moves after game is won', () => {
      // Move player 1 to win
      game.movePawn(PLAYER1_ID, Position.create(1, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(8, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(2, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(7, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(3, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(6, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(4, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(5, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(5, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(4, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(6, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(3, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(7, 4, DEFAULT_GAME_SIZE));
      
      game.movePawn(PLAYER2_ID, Position.create(2, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(8, 4, DEFAULT_GAME_SIZE));

      // Try to move after game is won
      expect(() => game.movePawn(PLAYER2_ID, Position.create(1, 5, DEFAULT_GAME_SIZE)))
        .to.throw('Game has already ended');
      expect(() => game.placeWall(PLAYER2_ID, new Wall(Position.create(4, 4, DEFAULT_GAME_SIZE), true)))
        .to.throw('Game has already ended');
    });

    it('should prevent moves on wrong turn', () => {
      // Try to move with player 2 on player 1's turn
      expect(() => game.movePawn(PLAYER2_ID, Position.create(7, 4, DEFAULT_GAME_SIZE)))
        .to.throw('Not player 2\'s turn');
      expect(() => game.placeWall(PLAYER2_ID, new Wall(Position.create(4, 4, DEFAULT_GAME_SIZE), true)))
        .to.throw('Not player 2\'s turn');
    });

    it('should detect player 1 win condition', () => {
      // Move player 1 to win (bottom row)
      game.movePawn(PLAYER1_ID, Position.create(1, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(8, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(2, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(7, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(3, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(6, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(4, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(5, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(5, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(4, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(6, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(3, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(7, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(2, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(8, 4, DEFAULT_GAME_SIZE));
      
      expect(game.getGameState().status).to.equal(GameStatus.PLAYER_1_WON);
    });

    it('should detect player 2 win condition', () => {
      // Move player 2 to win (top row)
      game.movePawn(PLAYER1_ID, Position.create(0, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(7, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(1, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(6, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(2, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(5, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(3, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(4, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(4, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(3, 4, DEFAULT_GAME_SIZE));

      game.movePawn(PLAYER1_ID, Position.create(5, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(2, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(6, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(1, 4, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER1_ID, Position.create(7, 5, DEFAULT_GAME_SIZE));
      game.movePawn(PLAYER2_ID, Position.create(0, 4, DEFAULT_GAME_SIZE));
      
      expect(game.getGameState().status).to.equal(GameStatus.PLAYER_2_WON);
    });
  });

  describe('Undo/Redo', () => {
    beforeEach(() => {
      game.addPlayer(PLAYER1_ID);
      game.addPlayer(PLAYER2_ID);
    });

    it('should throw error when trying to undo with no moves', () => {
      expect(() => game.undo()).to.throw('No moves to undo');
    });

    it('should throw error when trying to redo with no undone moves', () => {
      expect(() => game.redo()).to.throw('No moves to redo');
    });

    it('should correctly undo and redo a wall placement', () => {
      const wall = new Wall(Position.create(4, 4, DEFAULT_GAME_SIZE), true);
      const initialWalls = game.getRemainingWalls().get(PLAYER1_ID);
      
      // Place wall
      game.placeWall(PLAYER1_ID, wall);
      expect(game.getRemainingWalls().get(PLAYER1_ID)).to.equal(initialWalls! - 1);
      expect(game.getGameState().currentTurn).to.equal(PLAYER2_ID);
      
      // Undo wall placement
      game.undo();
      expect(game.getRemainingWalls().get(PLAYER1_ID)).to.equal(initialWalls);
      expect(game.getGameState().currentTurn).to.equal(PLAYER1_ID);
      
      // Redo wall placement
      game.redo();
      expect(game.getRemainingWalls().get(PLAYER1_ID)).to.equal(initialWalls! - 1);
      expect(game.getGameState().currentTurn).to.equal(PLAYER2_ID);
    });

    it('should correctly undo and redo a pawn move', () => {
      const startPos = Position.create(0, 4, DEFAULT_GAME_SIZE); // Assuming this is player 1's start position
      const targetPos = Position.create(1, 4, DEFAULT_GAME_SIZE);
      
      // Set initial position
      board = Board.withPawns(new Map([[PLAYER1_ID, startPos]]));
      game = new Game(board, WALLS_PER_PLAYER);
      game.addPlayer(PLAYER1_ID);
      game.addPlayer(PLAYER2_ID);
      
      // Move pawn
      game.movePawn(PLAYER1_ID, targetPos);
      expect(game.getBoard().getPawnPosition(PLAYER1_ID)?.equals(targetPos)).to.be.true;
      expect(game.getGameState().currentTurn).to.equal(PLAYER2_ID);
      
      // Undo move
      game.undo();
      expect(game.getBoard().getPawnPosition(PLAYER1_ID)?.equals(startPos)).to.be.true;
      expect(game.getGameState().currentTurn).to.equal(PLAYER1_ID);
      
      // Redo move
      game.redo();
      expect(game.getBoard().getPawnPosition(PLAYER1_ID)?.equals(targetPos)).to.be.true;
      expect(game.getGameState().currentTurn).to.equal(PLAYER2_ID);
    });

    it('should clear redo stack when making a new move', () => {
      const wall1 = new Wall(Position.create(4, 4, DEFAULT_GAME_SIZE), true);
      const wall2 = new Wall(Position.create(4, 6, DEFAULT_GAME_SIZE), true);
      
      // Place first wall and undo it
      game.placeWall(PLAYER1_ID, wall1);
      game.undo();
      
      // Place different wall - should clear redo stack
      game.placeWall(PLAYER1_ID, wall2);
      
      // Trying to redo should throw error as redo stack was cleared
      expect(() => game.redo()).to.throw('No moves to redo');
    });

    it('should maintain game end state in history', () => {
      // Setup board with player 1 one move away from goal
      const almostWinPos = Position.create(7, 4, DEFAULT_GAME_SIZE);
      const winPos = Position.create(8, 4, DEFAULT_GAME_SIZE);
      board = Board.withPawns(new Map([[PLAYER1_ID, almostWinPos]]));
      game = new Game(board, WALLS_PER_PLAYER);
      game.addPlayer(PLAYER1_ID);
      game.addPlayer(PLAYER2_ID);
      
      // Make winning move
      game.movePawn(PLAYER1_ID, winPos);
      expect(game.getGameState().status).to.equal(GameStatus.PLAYER_1_WON);
      
      // Undo winning move
      game.undo();
      expect(game.getGameState().status).to.equal(GameStatus.IN_PROGRESS);
      
      // Redo winning move
      game.redo();
      expect(game.getGameState().status).to.equal(GameStatus.PLAYER_1_WON);
    });
  });
}); 