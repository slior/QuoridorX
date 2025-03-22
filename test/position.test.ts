import { Position } from '../src/types/game';
import { expect } from 'chai';

const TEST_BOARD_SIZE = 8;

describe('Position', () => {
  beforeEach(() => {

  });

  describe('initializeBoardSize', () => {
    it('should initialize board size', () => {
        const pos = Position.create(0,0,TEST_BOARD_SIZE);
        expect(pos.row).to.equal(0);
        expect(pos.col).to.equal(0);
    });

  });

  describe('create', () => {

    it('should create valid positions', () => {
      const pos = Position.create(3, 4, TEST_BOARD_SIZE);
      expect(pos.row).to.equal(3);
      expect(pos.col).to.equal(4);
    });

    it('should throw error for negative row', () => {
      expect(() => Position.create(-1, 0, TEST_BOARD_SIZE)).to.throw('Invalid position');
    });


    it('should throw error for negative column', () => {
      expect(() => Position.create(0, -1, TEST_BOARD_SIZE)).to.throw('Invalid position');
    });

    it('should throw error for row >= boardSize', () => {
      expect(() => Position.create(8, 0, TEST_BOARD_SIZE)).to.throw('Invalid position');
    });

    it('should throw error for column >= boardSize', () => {
      expect(() => Position.create(0, 8, TEST_BOARD_SIZE)).to.throw('Invalid position');
    });
  });

  describe('movement methods', () => {

    describe('right', () => {
      it('should move right correctly', () => {
        const pos = Position.create(3, 4, TEST_BOARD_SIZE);
        const rightPos = pos.right();
        expect(rightPos.row).to.equal(3);
        expect(rightPos.col).to.equal(5);
      });

      it('should throw error when moving right from rightmost column', () => {
        const pos = Position.create(3, 7, TEST_BOARD_SIZE);
        expect(() => pos.right()).to.throw('No right from position');
      });
    });

    describe('left', () => {
      it('should move left correctly', () => {
        const pos = Position.create(3, 4, TEST_BOARD_SIZE);
        const leftPos = pos.left();
        expect(leftPos.row).to.equal(3);
        expect(leftPos.col).to.equal(3);
      });

      it('should throw error when moving left from leftmost column', () => {
        const pos = Position.create(3, 0, TEST_BOARD_SIZE);
        expect(() => pos.left()).to.throw('No left from position');
      });
    });

    describe('up', () => {
      it('should move up correctly', () => {
        const pos = Position.create(3, 4, TEST_BOARD_SIZE);
        const upPos = pos.up();
        expect(upPos.row).to.equal(2);
        expect(upPos.col).to.equal(4);
      });

      it('should throw error when moving up from topmost row', () => {
        const pos = Position.create(0, 4, TEST_BOARD_SIZE);
        expect(() => pos.up()).to.throw('No up from position');
      });
    });

    describe('down', () => {
      it('should move down correctly', () => {
        const pos = Position.create(3, 4, TEST_BOARD_SIZE);
        const downPos = pos.down();
        expect(downPos.row).to.equal(4);
        expect(downPos.col).to.equal(4);
      });

      it('should throw error when moving down from bottommost row', () => {
        const pos = Position.create(7, 4, TEST_BOARD_SIZE);
        expect(() => pos.down()).to.throw('No down from position');
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal positions', () => {
      const pos1 = Position.create(3, 4, TEST_BOARD_SIZE);
      const pos2 = Position.create(3, 4, TEST_BOARD_SIZE);
      expect(pos1.equals(pos2)).to.be.true;
    });

    it('should return false for different positions', () => {
      const pos1 = Position.create(3, 4, TEST_BOARD_SIZE);
      const pos2 = Position.create(3, 5, TEST_BOARD_SIZE);
      const pos3 = Position.create(4, 4, TEST_BOARD_SIZE);
      expect(pos1.equals(pos2)).to.be.false;
      expect(pos1.equals(pos3)).to.be.false;
    });
  });

  describe('hashCode', () => {
    it('should return correct hash code', () => {
      const pos = Position.create(3, 4, TEST_BOARD_SIZE);
      expect(pos.hashCode()).to.equal('3,4');
    });

    it('should return different hash codes for different positions', () => {
      const pos1 = Position.create(3, 4, TEST_BOARD_SIZE);
      const pos2 = Position.create(4, 3, TEST_BOARD_SIZE);
      expect(pos1.hashCode()).to.not.equal(pos2.hashCode());
    });
  });
}); 