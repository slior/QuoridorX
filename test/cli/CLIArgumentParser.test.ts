import { expect } from 'chai';
import { CLIArgumentParser, GameConfig, PlayerConfig } from '../../src/cli/CLIArgumentParser';

describe('CLIArgumentParser', () => {
    describe('valid argument combinations', () => {
        it('should default to human vs human when no arguments provided', () => {
            const config = CLIArgumentParser.parse([]);
            
            expect(config.player1).to.deep.equal({
                id: 1,
                type: 'human'
            });
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'human'
            });
        });

        it('should default p2 to human when only p1 specified', () => {
            const config = CLIArgumentParser.parse(['--p1=ai:random']);
            
            expect(config.player1).to.deep.equal({
                id: 1,
                type: 'ai',
                strategy: 'random'
            });
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'human'
            });
        });

        it('should default p1 to human when only p2 specified', () => {
            const config = CLIArgumentParser.parse(['--p2=ai:heuristic']);
            
            expect(config.player1).to.deep.equal({
                id: 1,
                type: 'human'
            });
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'ai',
                strategy: 'heuristic'
            });
        });

        it('should parse both players when both specified', () => {
            const config = CLIArgumentParser.parse(['--p1=human', '--p2=ai:random']);
            
            expect(config.player1).to.deep.equal({
                id: 1,
                type: 'human'
            });
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'ai',
                strategy: 'random'
            });
        });

        it('should parse AI vs AI configuration', () => {
            const config = CLIArgumentParser.parse(['--p1=ai:heuristic', '--p2=ai:random']);
            
            expect(config.player1).to.deep.equal({
                id: 1,
                type: 'ai',
                strategy: 'heuristic'
            });
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'ai',
                strategy: 'random'
            });
        });

        it('should handle different argument order', () => {
            const config = CLIArgumentParser.parse(['--p2=ai:random', '--p1=human']);
            
            expect(config.player1).to.deep.equal({
                id: 1,
                type: 'human'
            });
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'ai',
                strategy: 'random'
            });
        });
    });

    describe('case sensitivity', () => {
        it('should handle uppercase strategies', () => {
            const config = CLIArgumentParser.parse(['--p1=ai:RANDOM']);
            
            expect(config.player1).to.deep.equal({
                id: 1,
                type: 'ai',
                strategy: 'random'
            });
        });

        it('should handle mixed case player types', () => {
            const config = CLIArgumentParser.parse(['--p1=HUMAN', '--p2=AI:heuristic']);
            
            expect(config.player1).to.deep.equal({
                id: 1,
                type: 'human'
            });
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'ai',
                strategy: 'heuristic'
            });
        });
    });

    describe('error handling', () => {
        it('should throw error for unknown player type', () => {
            expect(() => CLIArgumentParser.parse(['--p1=invalid'])).to.throw('Unknown player type \'invalid\'');
        });

        it('should throw error for unknown AI strategy', () => {
            expect(() => CLIArgumentParser.parse(['--p2=ai:unknown'])).to.throw('Unknown AI strategy \'unknown\'');
        });

        it('should accept pathfinding strategy (implemented)', () => {
            const config = CLIArgumentParser.parse(['--p1=ai:pathfinding']);
            expect(config.player1.strategy).to.equal('pathfinding');
        });

        it('should throw error for malformed AI specification', () => {
            expect(() => CLIArgumentParser.parse(['--p1=ai'])).to.throw('AI player must specify strategy: ai:<strategy>');
        });

        it('should throw error for empty strategy', () => {
            expect(() => CLIArgumentParser.parse(['--p2=ai:'])).to.throw('AI player must specify strategy: ai:<strategy>');
        });

        it('should provide helpful error message with available strategies', () => {
            try {
                CLIArgumentParser.parse(['--p1=ai:invalid']);
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).to.include('Available strategies: random, heuristic, pathfinding');
            }
        });

        it('should provide helpful error message with available player types', () => {
            try {
                CLIArgumentParser.parse(['--p1=robot']);
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).to.include('Valid types: human, ai:random, ai:heuristic, ai:pathfinding');
            }
        });
    });

    describe('usage help', () => {
        it('should provide comprehensive usage help', () => {
            const help = CLIArgumentParser.getUsageHelp();
            
            expect(help).to.include('Usage: quoridor [OPTIONS]');
            expect(help).to.include('--p1=<type>');
            expect(help).to.include('--p2=<type>');
            expect(help).to.include('human, ai:random, ai:heuristic, ai:pathfinding');
            expect(help).to.include('Examples:');
            expect(help).to.include('pathfinding');
        });
    });

    describe('edge cases', () => {
        it('should handle empty arguments array', () => {
            const config = CLIArgumentParser.parse([]);
            expect(config.player1.type).to.equal('human');
            expect(config.player2.type).to.equal('human');
        });

        it('should handle extra whitespace in arguments', () => {
            const config = CLIArgumentParser.parse(['--p1=  human  ', '--p2= ai:random ']);
            
            expect(config.player1.type).to.equal('human');
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'ai',
                strategy: 'random'
            });
        });

        it('should ignore unrecognized arguments', () => {
            const config = CLIArgumentParser.parse(['--p1=human', '--unknown=value', '--p2=ai:random']);
            
            expect(config.player1.type).to.equal('human');
            expect(config.player2).to.deep.equal({
                id: 2,
                type: 'ai',
                strategy: 'random'
            });
        });
    });
});