import { expect } from 'chai';
import { AIPlayerManager } from '../../src/cli/AIPlayerManager';
import { Game } from '../../src/core/Game';
import { Board } from '../../src/core/Board';
import { Position, P1, P2 } from '../../src/types/game';
import { PlayerConfig } from '../../src/cli/CLIArgumentParser';

describe('AIPlayerManager', () => {
    let game: Game;
    let board: Board;
    let aiManager: AIPlayerManager;

    beforeEach(() => {
        // Set up a game with players in starting positions
        board = new Board();
        const boardSize = board.getBoardSize();
        const initialPositions = new Map([
            [P1, Position.create(0, Math.floor(boardSize / 2), boardSize)],
            [P2, Position.create(boardSize - 1, Math.floor(boardSize / 2), boardSize)]
        ]);
        
        const gameBoard = Board.withPawns(initialPositions);
        game = new Game(gameBoard);
        game.addPlayer(P1);
        game.addPlayer(P2);
        
        aiManager = new AIPlayerManager(game);
    });

    describe('player creation', () => {
        it('should create random AI player correctly', () => {
            const config: PlayerConfig = {
                id: P1,
                type: 'ai',
                strategy: 'random'
            };
            
            const aiPlayer = aiManager.createPlayer(config);
            
            expect(aiPlayer).to.not.be.null;
            expect(aiPlayer!.playerId).to.equal(P1);
            expect(aiPlayer!.getName()).to.include('Random');
        });

        it('should create heuristic AI player correctly', () => {
            const config: PlayerConfig = {
                id: P2,
                type: 'ai',
                strategy: 'heuristic'
            };
            
            const aiPlayer = aiManager.createPlayer(config);
            
            expect(aiPlayer).to.not.be.null;
            expect(aiPlayer!.playerId).to.equal(P2);
            expect(aiPlayer!.getName()).to.include('Heuristic');
        });

        it('should return null for human players', () => {
            const config: PlayerConfig = {
                id: P1,
                type: 'human'
            };
            
            const aiPlayer = aiManager.createPlayer(config);
            
            expect(aiPlayer).to.be.null;
        });

        it('should track AI players correctly', () => {
            const aiConfig: PlayerConfig = {
                id: P1,
                type: 'ai',
                strategy: 'random'
            };
            const humanConfig: PlayerConfig = {
                id: P2,
                type: 'human'
            };
            
            aiManager.createPlayer(aiConfig);
            aiManager.createPlayer(humanConfig);
            
            expect(aiManager.isAIPlayer(P1)).to.be.true;
            expect(aiManager.isAIPlayer(P2)).to.be.false;
        });
    });

    describe('AI turn execution', () => {
        beforeEach(() => {
            // Set up AI player 1
            const config: PlayerConfig = {
                id: P1,
                type: 'ai',
                strategy: 'random'
            };
            aiManager.createPlayer(config);
        });

        it('should execute AI turn when it is AI player\'s turn', () => {
            // Game starts with P1's turn
            expect(game.getGameState().currentTurn).to.equal(P1);
            
            // Execute AI turn
            expect(() => aiManager.executeAITurn(P1)).to.not.throw();
            
            // Turn should have switched to P2
            expect(game.getGameState().currentTurn).to.equal(P2);
        });

        it('should throw error when executing AI turn for non-AI player', () => {
            expect(() => aiManager.executeAITurn(P2)).to.throw();
        });

        it('should throw error when executing AI turn out of turn', () => {
            // Game starts with P1's turn, trying to execute P1's turn again should fail
            aiManager.executeAITurn(P1); // Now it's P2's turn
            
            expect(() => aiManager.executeAITurn(P1)).to.throw();
        });
    });

    describe('mixed player configurations', () => {
        it('should handle AI player 1 vs human player 2', () => {
            const p1Config: PlayerConfig = { id: P1, type: 'ai', strategy: 'random' };
            const p2Config: PlayerConfig = { id: P2, type: 'human' };
            
            aiManager.createPlayer(p1Config);
            aiManager.createPlayer(p2Config);
            
            expect(aiManager.isAIPlayer(P1)).to.be.true;
            expect(aiManager.isAIPlayer(P2)).to.be.false;
        });

        it('should handle human player 1 vs AI player 2', () => {
            const p1Config: PlayerConfig = { id: P1, type: 'human' };
            const p2Config: PlayerConfig = { id: P2, type: 'ai', strategy: 'heuristic' };
            
            aiManager.createPlayer(p1Config);
            aiManager.createPlayer(p2Config);
            
            expect(aiManager.isAIPlayer(P1)).to.be.false;
            expect(aiManager.isAIPlayer(P2)).to.be.true;
        });

        it('should handle AI vs AI configuration', () => {
            const p1Config: PlayerConfig = { id: P1, type: 'ai', strategy: 'random' };
            const p2Config: PlayerConfig = { id: P2, type: 'ai', strategy: 'heuristic' };
            
            aiManager.createPlayer(p1Config);
            aiManager.createPlayer(p2Config);
            
            expect(aiManager.isAIPlayer(P1)).to.be.true;
            expect(aiManager.isAIPlayer(P2)).to.be.true;
        });
    });

    describe('error handling', () => {
        it('should throw error for unsupported strategy', () => {
            const config: PlayerConfig = {
                id: P1,
                type: 'ai',
                strategy: 'nonexistent' as any // This should not be supported
            };
            
            expect(() => aiManager.createPlayer(config)).to.throw('Unsupported AI strategy: nonexistent');
        });

        it('should handle AI move execution errors gracefully', () => {
            const config: PlayerConfig = {
                id: P1,
                type: 'ai',
                strategy: 'random'
            };
            aiManager.createPlayer(config);
            
            // Manually set game state to ended to trigger error
            // This simulates a scenario where game has ended
            const originalGetGameState = game.getGameState.bind(game);
            game.getGameState = () => ({ currentTurn: P1, status: 'PLAYER_1_WON' as any });
            
            // AI should not be able to move when game is over
            expect(() => aiManager.executeAITurn(P1)).to.throw();
            
            // Restore original method
            game.getGameState = originalGetGameState;
        });
    });
});