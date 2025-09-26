import { expect } from 'chai';
import { CLIArgumentParser } from '../../src/cli/CLIArgumentParser';
import { AIPlayerManager } from '../../src/cli/AIPlayerManager';
import { Game } from '../../src/core/Game';
import { Board } from '../../src/core/Board';
import { Position, P1, P2 } from '../../src/types/game';

describe('CLI End-to-End Integration', () => {
    describe('complete workflow', () => {
        it('should handle human vs AI game setup', () => {
            // Parse arguments
            const config = CLIArgumentParser.parse(['--p2=ai:random']);
            
            // Set up game
            const board = new Board();
            const boardSize = board.getBoardSize();
            const initialPositions = new Map([
                [P1, Position.create(0, Math.floor(boardSize / 2), boardSize)],
                [P2, Position.create(boardSize - 1, Math.floor(boardSize / 2), boardSize)]
            ]);
            
            const gameBoard = Board.withPawns(initialPositions);
            const game = new Game(gameBoard);
            game.addPlayer(P1);
            game.addPlayer(P2);
            
            // Set up AI manager
            const aiManager = new AIPlayerManager(game);
            const p1Player = aiManager.createPlayer(config.player1);
            const p2Player = aiManager.createPlayer(config.player2);
            
            // Validate setup
            expect(p1Player).to.be.null; // Human player
            expect(p2Player).to.not.be.null; // AI player
            expect(aiManager.isAIPlayer(P1)).to.be.false;
            expect(aiManager.isAIPlayer(P2)).to.be.true;
            
            // Game should start with P1 (human) turn
            expect(game.getGameState().currentTurn).to.equal(P1);
            
            // Make a human move
            game.movePawn(P1, Position.create(1, 4, boardSize));
            expect(game.getGameState().currentTurn).to.equal(P2);
            
            // AI should be able to make a move
            expect(() => aiManager.executeAITurn(P2)).to.not.throw();
            expect(game.getGameState().currentTurn).to.equal(P1);
        });
        
        it('should handle AI vs AI game setup', () => {
            // Parse arguments
            const config = CLIArgumentParser.parse(['--p1=ai:heuristic', '--p2=ai:random']);
            
            // Set up game
            const board = new Board();
            const boardSize = board.getBoardSize();
            const initialPositions = new Map([
                [P1, Position.create(0, Math.floor(boardSize / 2), boardSize)],
                [P2, Position.create(boardSize - 1, Math.floor(boardSize / 2), boardSize)]
            ]);
            
            const gameBoard = Board.withPawns(initialPositions);
            const game = new Game(gameBoard);
            game.addPlayer(P1);
            game.addPlayer(P2);
            
            // Set up AI manager
            const aiManager = new AIPlayerManager(game);
            const p1Player = aiManager.createPlayer(config.player1);
            const p2Player = aiManager.createPlayer(config.player2);
            
            // Validate setup
            expect(p1Player).to.not.be.null; // AI player
            expect(p2Player).to.not.be.null; // AI player
            expect(aiManager.isAIPlayer(P1)).to.be.true;
            expect(aiManager.isAIPlayer(P2)).to.be.true;
            
            // Both players should be able to make moves
            expect(() => aiManager.executeAITurn(P1)).to.not.throw();
            expect(() => aiManager.executeAITurn(P2)).to.not.throw();
        });
        
        it('should provide proper error messages for invalid configurations', () => {
            try {
                CLIArgumentParser.parse(['--p1=ai:invalid']);
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).to.include('Unknown AI strategy \'invalid\'');
                expect(error.message).to.include('Available strategies: random, heuristic');
            }
                
            try {
                CLIArgumentParser.parse(['--p2=robot']);
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).to.include('Unknown player type \'robot\'');
                expect(error.message).to.include('Valid types: human, ai:random, ai:heuristic');
            }
        });
    });
    
    describe('game mode descriptions', () => {
        it('should correctly identify game modes', () => {
            const humanVsHuman = CLIArgumentParser.parse([]);
            expect(humanVsHuman.player1.type).to.equal('human');
            expect(humanVsHuman.player2.type).to.equal('human');
            
            const humanVsAI = CLIArgumentParser.parse(['--p2=ai:random']);
            expect(humanVsAI.player1.type).to.equal('human');
            expect(humanVsAI.player2.type).to.equal('ai');
            expect(humanVsAI.player2.strategy).to.equal('random');
            
            const aiVsAI = CLIArgumentParser.parse(['--p1=ai:heuristic', '--p2=ai:random']);
            expect(aiVsAI.player1.type).to.equal('ai');
            expect(aiVsAI.player1.strategy).to.equal('heuristic');
            expect(aiVsAI.player2.type).to.equal('ai');
            expect(aiVsAI.player2.strategy).to.equal('random');
        });
    });
});