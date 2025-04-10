import { expect } from 'chai';
import { Board } from '../src/core/Board';
import { Position, Wall, DEFAULT_GAME_SIZE } from '../src/types/game';

describe('Board', () => {
  describe('initialization', () => {
    it('should create a board with default size', () => {
      const board = new Board();
      expect(board.getBoardSize()).to.equal(DEFAULT_GAME_SIZE);
    });

    it('should create a board with custom size', () => {
      const board = new Board(7);
      expect(board.getBoardSize()).to.equal(7);
    });
  });

  describe('pawn positioning', () => {
    it('should return undefined for a player with no position', () => {
      const board = new Board();
      expect(board.getPawnPosition(1)).to.be.undefined;
    });

    // Note: There seems to be no method to set pawn positions in the provided code
    // This test would be added once that functionality is implemented
  });

  describe('wall placement', () => {
    it('should place a valid horizontal wall', () => {
      const board = new Board();
      const boardSize = board.getBoardSize();
      const wall = new Wall(Position.create(3, 3, boardSize), true);
      
      expect(() => board.placeWall(wall)).to.not.throw();
    });

    it('should place a valid vertical wall', () => {
      const board = new Board();
      const boardSize = board.getBoardSize();
      const wall = new Wall(Position.create(3, 3, boardSize), false);
      
      expect(() => board.placeWall(wall)).to.not.throw();
    });

    it('should throw error when placing a horizontal wall beyond board boundaries', () => {
      const board = new Board();
      const boardSize = board.getBoardSize();
      const wall = new Wall(Position.create(3, 8, boardSize), true); // col 8 is invalid for horizontal wall
      
      expect(() => board.placeWall(wall)).to.throw('Invalid wall placement');
    });

    it('should throw error when placing a vertical wall beyond board boundaries', () => {
      const board = new Board();
      const boardSize = board.getBoardSize();
      const wall = new Wall(Position.create(8, 3, boardSize), false); // row 8 is invalid for vertical wall
      
      expect(() => board.placeWall(wall)).to.throw('Invalid wall placement');
    });

    it('should throw error when placing intersecting walls', () => {
      const board = new Board();
      const boardSize = board.getBoardSize();
      const wall1 = new Wall(Position.create(3, 3, boardSize), true);
      const wall2 = new Wall(Position.create(3, 4, boardSize), false);
      
      board.placeWall(wall1);
      expect(() => board.placeWall(wall2)).to.throw('Invalid wall placement');
    });

    it('should allow placing non-intersecting walls', () => {
      const board = new Board();
      const boardSize = board.getBoardSize();
      const wall1 = new Wall(Position.create(3, 3, boardSize), true);
      const wall2 = new Wall(Position.create(5, 5, boardSize), true);
      
      board.placeWall(wall1);
      expect(() => board.placeWall(wall2)).to.not.throw();
    });
  });

  describe('pawn movement', () => {
    let boardSize: number;

    beforeEach(() => {
      boardSize = DEFAULT_GAME_SIZE;
    });

    describe('regular moves', () => {
      it('should throw error when moving non-existent pawn', () => {
        const board = new Board();
        const targetPos = Position.create(4, 4, boardSize);
        expect(() => board.movePawn(1, targetPos)).to.throw('No pawn found for player 1');
      });

      it('should allow valid orthogonal moves', () => {
        // Setup initial position
        const startPos = Position.create(4, 4, boardSize);
        const initialPawns = new Map([[1, startPos]]);
        
        // Test all four directions
        const moves = [
          Position.create(4, 5, boardSize), // right
          Position.create(4, 3, boardSize), // left
          Position.create(3, 4, boardSize), // up
          Position.create(5, 4, boardSize), // down
        ];

        moves.forEach(targetPos => {
          const board = Board.withPawns(initialPawns, boardSize);
          expect(() => board.movePawn(1, targetPos)).to.not.throw();
          expect(board.getPawnPosition(1)?.equals(targetPos)).to.be.true;
        });
      });

      it('should prevent moving to occupied positions', () => {
        const pos1 = Position.create(4, 4, boardSize);
        const pos2 = Position.create(4, 5, boardSize);
        const initialPawns = new Map([
          [1, pos1],
          [2, pos2]
        ]);
        const board = Board.withPawns(initialPawns, boardSize);

        expect(() => board.movePawn(1, pos2)).to.throw('Invalid move');
      });

      it('should prevent moving diagonally', () => {
        const startPos = Position.create(4, 4, boardSize);
        const diagPos = Position.create(5, 5, boardSize);
        const initialPawns = new Map([[1, startPos]]);
        const board = Board.withPawns(initialPawns, boardSize);

        expect(() => board.movePawn(1, diagPos)).to.throw('Invalid move');
      });
    });

    describe('jump moves', () => {
      it('should allow jumping over adjacent pawns', () => {
        const pos1 = Position.create(4, 4, boardSize);
        const pos2 = Position.create(4, 5, boardSize); // Adjacent to pos1
        const jumpPos = Position.create(4, 6, boardSize); // Jump destination
        const initialPawns = new Map([
          [1, pos1],
          [2, pos2]
        ]);
        const board = Board.withPawns(initialPawns, boardSize);

        expect(() => board.movePawn(1, jumpPos)).to.not.throw();
        expect(board.getPawnPosition(1)?.equals(jumpPos)).to.be.true;
      });

      it('should prevent jumping when no pawn is present', () => {
        const startPos = Position.create(4, 4, boardSize);
        const jumpPos = Position.create(4, 6, boardSize);
        const initialPawns = new Map([[1, startPos]]);
        const board = Board.withPawns(initialPawns, boardSize);

        expect(() => board.movePawn(1, jumpPos)).to.throw('Invalid move');
      });
    });

    describe('wall blocking', () => {
      it('should prevent moving through horizontal walls', () => {
        const pos1 = Position.create(4, 4, boardSize);
        const targetPos = Position.create(5, 4, boardSize);
        const wall = new Wall(Position.create(4, 4, boardSize), true);
        const initialPawns = new Map([[1, pos1]]);
        const board = Board.withPawns(initialPawns, boardSize);
        board.placeWall(wall);

        expect(() => board.movePawn(1, targetPos)).to.throw('Invalid move');
      });

      it('should prevent moving through vertical walls', () => {
        const pos1 = Position.create(4, 4, boardSize);
        const targetPos = Position.create(4, 5, boardSize);
        const wall = new Wall(Position.create(4, 5, boardSize), false);
        const initialPawns = new Map([[1, pos1]]);
        const board = Board.withPawns(initialPawns, boardSize);
        board.placeWall(wall);

        expect(() => board.movePawn(1, targetPos)).to.throw('Invalid move');
      });

      it('should prevent jumping over walls', () => {
        const pos1 = Position.create(4, 4, boardSize);
        const pos2 = Position.create(4, 5, boardSize);
        const jumpPos = Position.create(4, 6, boardSize);
        const wall = new Wall(Position.create(4, 5, boardSize), false);
        const initialPawns = new Map([
          [1, pos1],
          [2, pos2]
        ]);
        const board = Board.withPawns(initialPawns, boardSize);
        board.placeWall(wall);

        expect(() => board.movePawn(1, jumpPos)).to.throw('Invalid move');
      });

      it('should allow moving parallel to walls', () => {
        const pos1 = Position.create(4, 4, boardSize);
        const targetPos = Position.create(4, 5, boardSize);
        const wall = new Wall(Position.create(4, 4, boardSize), true); // Horizontal wall below
        const initialPawns = new Map([[1, pos1]]);
        const board = Board.withPawns(initialPawns, boardSize);
        board.placeWall(wall);

        expect(() => board.movePawn(1, targetPos)).to.not.throw();
      });
    });
  });

  describe('wall management', () => {
    it('should correctly detect walls between positions', () => {
      const board = new Board();
      const boardSize = board.getBoardSize();
      
      // Test horizontal wall
      const hWall = new Wall(Position.create(4, 3, boardSize), true);
      board.placeWall(hWall);
      
      // Should block vertical movement
      expect(board.isWallBetween(
        Position.create(4, 3, boardSize),
        Position.create(5, 3, boardSize)
      )).to.be.true;
      
      // Should not block horizontal movement
      expect(board.isWallBetween(
        Position.create(4, 3, boardSize),
        Position.create(4, 4, boardSize)
      )).to.be.false;

      board.removeLastWall()

      // Test vertical wall
      const vWall = new Wall(Position.create(3, 5, boardSize), false);
      board.placeWall(vWall);
      
      // Should block horizontal movement
      expect(board.isWallBetween(
        Position.create(3, 4, boardSize),
        Position.create(3, 5, boardSize)
      )).to.be.true;
      
      // Should not block vertical movement
      expect(board.isWallBetween(
        Position.create(3, 4, boardSize),
        Position.create(4, 4, boardSize)
      )).to.be.false;
    });

    it('should correctly remove last placed wall', () => {
      const board = new Board();
      const boardSize = board.getBoardSize();
      const wall1 = new Wall(Position.create(3, 3, boardSize), true);
      const wall2 = new Wall(Position.create(4, 5, boardSize), false);
      
      board.placeWall(wall1);
      board.placeWall(wall2);
      
      // Initially wall2 blocks movement
      expect(board.isWallBetween(
        Position.create(4, 4, boardSize),
        Position.create(4, 5, boardSize)
      )).to.be.true;
      
      // Remove wall2
      board.removeLastWall();
      
      // Now wall2 should not block movement
      expect(board.isWallBetween(
        Position.create(4, 4, boardSize),
        Position.create(4, 5, boardSize)
      )).to.be.false;
      
      // wall1 should still block movement
      expect(board.isWallBetween(
        Position.create(3, 3, boardSize),
        Position.create(4, 3, boardSize)
      )).to.be.true;
    });
  });
}); 