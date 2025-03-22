import { expect } from 'chai';
import { Position, Wall } from '../src/types/game';

const TEST_BOARD_SIZE = 9;

describe('Wall', () => {
  before(() => {
  });

  describe('constructor', () => {
    it('should create a horizontal wall correctly', () => {
      const pos = Position.create(4, 4, TEST_BOARD_SIZE);
      const wall = new Wall(pos, true);
      
      expect(wall.position).to.equal(pos);
      expect(wall.isHorizontal).to.be.true;
    });

    it('should create a vertical wall correctly', () => {
      const pos = Position.create(4, 4, TEST_BOARD_SIZE);
      const wall = new Wall(pos, false);
      
      expect(wall.position).to.equal(pos);
      expect(wall.isHorizontal).to.be.false;
    });
  });

  describe('equals', () => {
    it('should return true for walls with same position and orientation', () => {
      const pos = Position.create(4, 4, TEST_BOARD_SIZE);
      const wall1 = new Wall(pos, true);
      const wall2 = new Wall(pos, true);
      
      expect(wall1.equals(wall2)).to.be.true;
    });

    it('should return false for walls with different positions', () => {
      const pos1 = Position.create(4, 4, TEST_BOARD_SIZE);
      const pos2 = Position.create(4, 5, TEST_BOARD_SIZE);
      const wall1 = new Wall(pos1, true);
      const wall2 = new Wall(pos2, true);
      
      expect(wall1.equals(wall2)).to.be.false;
    });

    it('should return false for walls with different orientations', () => {
      const pos = Position.create(4, 4, TEST_BOARD_SIZE);
      const wall1 = new Wall(pos, true);
      const wall2 = new Wall(pos, false);
      
      expect(wall1.equals(wall2)).to.be.false;
    });
  });

  describe('hashCode', () => {
    it('should generate consistent hash codes for the same wall', () => {
      const pos = Position.create(4, 4, TEST_BOARD_SIZE);
      const wall = new Wall(pos, true);
      
      expect(wall.hashCode()).to.equal('4,4,true');
    });

    it('should generate different hash codes for different walls', () => {
      const pos1 = Position.create(4, 4, TEST_BOARD_SIZE);
      const pos2 = Position.create(4, 5, TEST_BOARD_SIZE);
      const wall1 = new Wall(pos1, true);
      const wall2 = new Wall(pos2, true);
      const wall3 = new Wall(pos1, false);
      
      expect(wall1.hashCode()).to.not.equal(wall2.hashCode());
      expect(wall1.hashCode()).to.not.equal(wall3.hashCode());
      expect(wall2.hashCode()).to.not.equal(wall3.hashCode());
    });
  });

  describe('occupies', () => {
    it('should return correct positions for horizontal wall', () => {
      const pos = Position.create(4, 4, TEST_BOARD_SIZE);
      const wall = new Wall(pos, true);
      const occupied = wall.occupies();
      
      expect(occupied).to.have.lengthOf(2);
      expect(occupied[0].equals(pos)).to.be.true;
      expect(occupied[1].equals(Position.create(4, 5, TEST_BOARD_SIZE))).to.be.true;
    });

    it('should return correct positions for vertical wall', () => {
      const pos = Position.create(4, 4, TEST_BOARD_SIZE);
      const wall = new Wall(pos, false);
      const occupied = wall.occupies();
      
      expect(occupied).to.have.lengthOf(2);
      expect(occupied[0].equals(pos)).to.be.true;
      expect(occupied[1].equals(Position.create(5, 4, TEST_BOARD_SIZE))).to.be.true;
    });

    it('should throw error for horizontal wall at right edge', () => {
      const pos = Position.create(4, 8, TEST_BOARD_SIZE);
      const wall = new Wall(pos, true);
      
      expect(() => wall.occupies()).to.throw();
    });

    it('should throw error for vertical wall at bottom edge', () => {
      const pos = Position.create(8, 4, TEST_BOARD_SIZE);
      const wall = new Wall(pos, false);
      
      expect(() => wall.occupies()).to.throw();
    });
  });
}); 