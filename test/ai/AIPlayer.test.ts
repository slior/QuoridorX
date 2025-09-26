import { expect } from 'chai';
import { AIPlayer, AIPlayerUtils } from '../../src/ai/AIPlayer';
import { AIStrategy } from '../../src/ai/strategy';
import { PlayerID, Move, GameState, P1, P2 } from '../../src/types/game';
import { Game } from '../../src/core/Game';

// Mock AI strategy for testing
class MockStrategy implements AIStrategy {
    calculateMove(state: GameState, playerId: string): Move {
        // This is just a placeholder - will be properly implemented when we create actual strategies
        throw new Error('Mock strategy - not implemented');
    }
}

// Mock AI player for testing
class MockAIPlayer implements AIPlayer {
    public readonly playerId: PlayerID;
    public readonly strategy: AIStrategy;
    
    constructor(playerId: PlayerID) {
        this.playerId = playerId;
        this.strategy = new MockStrategy();
    }
    
    makeMove(game: Game): Move {
        // This is just a placeholder - will be properly implemented when we create actual strategies
        throw new Error('Mock AI player - not implemented');
    }
    
    getName(): string {
        return `Mock AI Player ${this.playerId}`;
    }
    
    getDifficulty(): string {
        return 'Test';
    }
}

describe('AIPlayer Interface', () => {
    let mockAI1: AIPlayer;
    let mockAI2: AIPlayer;
    
    beforeEach(() => {
        mockAI1 = new MockAIPlayer(P1);
        mockAI2 = new MockAIPlayer(P2);
    });
    
    describe('AIPlayer properties', () => {
        it('should have correct playerId for player 1', () => {
            expect(mockAI1.playerId).to.equal(P1);
        });
        
        it('should have correct playerId for player 2', () => {
            expect(mockAI2.playerId).to.equal(P2);
        });
        
        it('should have a strategy', () => {
            expect(mockAI1.strategy).to.be.instanceof(MockStrategy);
            expect(mockAI2.strategy).to.be.instanceof(MockStrategy);
        });
        
        it('should have a name', () => {
            expect(mockAI1.getName()).to.equal('Mock AI Player 1');
            expect(mockAI2.getName()).to.equal('Mock AI Player 2');
        });
        
        it('should have a difficulty level', () => {
            expect(mockAI1.getDifficulty()).to.equal('Test');
            expect(mockAI2.getDifficulty()).to.equal('Test');
        });
    });
    
    describe('AIPlayerUtils', () => {
        describe('validateAIPlayer', () => {
            it('should not throw for valid AI players', () => {
                expect(() => AIPlayerUtils.validateAIPlayer(mockAI1)).to.not.throw();
                expect(() => AIPlayerUtils.validateAIPlayer(mockAI2)).to.not.throw();
            });
            
            it('should throw error for invalid player ID', () => {
                const invalidAI = { ...mockAI1, playerId: 3 as PlayerID };
                expect(() => AIPlayerUtils.validateAIPlayer(invalidAI)).to.throw('Invalid AI player ID: 3 (must be 1 or 2)');
            });
            
            it('should throw error for missing strategy', () => {
                const noStrategyAI = { ...mockAI1, strategy: null as any };
                expect(() => AIPlayerUtils.validateAIPlayer(noStrategyAI)).to.throw('AI player 1 must have a strategy');
            });
            
            it('should throw error for empty name', () => {
                const emptyNameAI = { ...mockAI1, getName: () => '' };
                expect(() => AIPlayerUtils.validateAIPlayer(emptyNameAI)).to.throw('AI player 1 must have a name');
            });
            
            it('should throw error for whitespace-only name', () => {
                const whitespaceNameAI = { ...mockAI1, getName: () => '   ' };
                expect(() => AIPlayerUtils.validateAIPlayer(whitespaceNameAI)).to.throw('AI player 1 must have a name');
            });
        });
        
        describe('isAIPlayer', () => {
            it('should return true for AI players in the collection', () => {
                const aiPlayers = [mockAI1, mockAI2];
                expect(AIPlayerUtils.isAIPlayer(P1, aiPlayers)).to.be.true;
                expect(AIPlayerUtils.isAIPlayer(P2, aiPlayers)).to.be.true;
            });
            
            it('should return false for players not in the collection', () => {
                const aiPlayers = [mockAI1];
                expect(AIPlayerUtils.isAIPlayer(P2, aiPlayers)).to.be.false;
            });
            
            it('should return false for empty collection', () => {
                expect(AIPlayerUtils.isAIPlayer(P1, [])).to.be.false;
                expect(AIPlayerUtils.isAIPlayer(P2, [])).to.be.false;
            });
        });
        
        describe('getAIPlayer', () => {
            it('should return the correct AI player when found', () => {
                const aiPlayers = [mockAI1, mockAI2];
                expect(AIPlayerUtils.getAIPlayer(P1, aiPlayers)).to.equal(mockAI1);
                expect(AIPlayerUtils.getAIPlayer(P2, aiPlayers)).to.equal(mockAI2);
            });
            
            it('should return undefined when AI player not found', () => {
                const aiPlayers = [mockAI1];
                expect(AIPlayerUtils.getAIPlayer(P2, aiPlayers)).to.be.undefined;
            });
            
            it('should return undefined for empty collection', () => {
                expect(AIPlayerUtils.getAIPlayer(P1, [])).to.be.undefined;
                expect(AIPlayerUtils.getAIPlayer(P2, [])).to.be.undefined;
            });
        });
        
        describe('executeAIMove', () => {
            it('should throw error when it is not the AI player\'s turn', () => {
                // Create a mock game that returns player 2's turn
                const mockGame = {
                    getGameState: () => ({ currentTurn: P2, status: 'IN_PROGRESS' }),
                    movePawn: () => {},
                    placeWall: () => {}
                } as any;
                
                // Trying to execute move for player 1 when it's player 2's turn should fail
                expect(() => AIPlayerUtils.executeAIMove(mockAI1, mockGame))
                    .to.throw('Not AI player 1\'s turn (current turn: 2)');
            });
            
            it('should call makeMove on the AI player when it is their turn', () => {
                // Create a mock game that returns player 1's turn
                const mockGame = {
                    getGameState: () => ({ currentTurn: P1, status: 'IN_PROGRESS' }),
                    movePawn: () => {},
                    placeWall: () => {}
                } as any;
                
                // The mock AI player throws an error in makeMove, so we expect that error
                expect(() => AIPlayerUtils.executeAIMove(mockAI1, mockGame))
                    .to.throw('Mock AI player - not implemented');
            });
        });
    });
});
