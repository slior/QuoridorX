import { AIPlayer, AIPlayerUtils } from '../AIPlayer';
import { AIStrategy } from '../strategy';
import { PlayerID, Move, GameState, P1, P2 } from '../../types/game';
import { Game } from '../../core/Game';

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

// Test the interface compilation and basic functionality
describe('AI Player Interface', () => {
    let mockAI1: AIPlayer;
    let mockAI2: AIPlayer;
    
    beforeEach(() => {
        mockAI1 = new MockAIPlayer(P1);
        mockAI2 = new MockAIPlayer(P2);
    });
    
    it('should create AI players with correct properties', () => {
        expect(mockAI1.playerId).toBe(P1);
        expect(mockAI1.strategy).toBeInstanceOf(MockStrategy);
        expect(mockAI1.getName()).toBe('Mock AI Player 1');
        expect(mockAI1.getDifficulty()).toBe('Test');
        
        expect(mockAI2.playerId).toBe(P2);
        expect(mockAI2.getName()).toBe('Mock AI Player 2');
    });
    
    it('should validate AI players correctly', () => {
        expect(() => AIPlayerUtils.validateAIPlayer(mockAI1)).not.toThrow();
        expect(() => AIPlayerUtils.validateAIPlayer(mockAI2)).not.toThrow();
        
        // Test invalid player ID
        const invalidAI = { ...mockAI1, playerId: 3 as PlayerID };
        expect(() => AIPlayerUtils.validateAIPlayer(invalidAI)).toThrow('Invalid AI player ID: 3');
        
        // Test missing strategy
        const noStrategyAI = { ...mockAI1, strategy: null as any };
        expect(() => AIPlayerUtils.validateAIPlayer(noStrategyAI)).toThrow('must have a strategy');
        
        // Test empty name
        const emptyNameAI = { ...mockAI1, getName: () => '' };
        expect(() => AIPlayerUtils.validateAIPlayer(emptyNameAI)).toThrow('must have a name');
    });
    
    it('should find AI players in collections', () => {
        const aiPlayers = [mockAI1, mockAI2];
        
        expect(AIPlayerUtils.isAIPlayer(P1, aiPlayers)).toBe(true);
        expect(AIPlayerUtils.isAIPlayer(P2, aiPlayers)).toBe(true);
        
        expect(AIPlayerUtils.getAIPlayer(P1, aiPlayers)).toBe(mockAI1);
        expect(AIPlayerUtils.getAIPlayer(P2, aiPlayers)).toBe(mockAI2);
        
        // Test with empty array
        expect(AIPlayerUtils.isAIPlayer(P1, [])).toBe(false);
        expect(AIPlayerUtils.getAIPlayer(P1, [])).toBeUndefined();
    });
});