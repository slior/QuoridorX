import { expect } from 'chai';
import { Board } from '../../src/core/Board';
import { Position } from '../../src/types/game';
import { Wall } from '../../src/types/game';
import { BoardVisualizer } from '../../src/cli/BoardVisualizer';
import chalk from 'chalk';

describe('BoardVisualizer', () => {
    describe('visualize()', () => {
        it('should correctly visualize an empty board', () => {
            // Create an empty board
            const board = new Board();
            const visualizer = new BoardVisualizer(board);
            
            const output = visualizer.visualize();
            
            // Basic checks for empty board
            expect(output).to.be.a('string');
            expect(output).to.include('0'); // Should have row number
            expect(output).to.include('8'); // Should have row number
            expect(output.split('\n').length).to.be.greaterThan(9); // Should have at least 9 rows
            console.log(output)
        });

        it('should correctly visualize a board with pawns', () => {
            // Create a board with pawns in starting positions
            const initialPositions = new Map();
            initialPositions.set(1, Position.create(8, 4)); // Player 1 at bottom middle
            initialPositions.set(2, Position.create(0, 4)); // Player 2 at top middle
            const board = Board.withPawns(initialPositions);
            
            const visualizer = new BoardVisualizer(board);
            const output = visualizer.visualize();

            // Check for player markers
            expect(output).to.include('1'); // Should show Player 1
            expect(output).to.include('2'); // Should show Player 2
            console.log(output)
        });

        it('should correctly visualize a board with walls', () => {
            // Create a board with pawns and walls
            const initialPositions = new Map();
            initialPositions.set(1, Position.create(8, 4));
            initialPositions.set(2, Position.create(0, 4));
            const board = Board.withPawns(initialPositions);

            // Add some walls
            board.placeWall(new Wall(Position.create(0, 2), true)); // Horizontal wall
            board.placeWall(new Wall(Position.create(1, 4), false)); // Vertical wall

            const visualizer = new BoardVisualizer(board);
            const output = visualizer.visualize();

            // Check for wall characters
            const lines = output.split('\n');
            expect(lines.some(line => line.includes('───'))).to.be.true; // Should have horizontal wall
            expect(lines.some(line => line.includes('│'))).to.be.true; // Should have vertical wall
            console.log(output)
        });

        it('should use correct colors for different elements', () => {
            // Create a board with pawns and walls
            const initialPositions = new Map();
            initialPositions.set(1, Position.create(8, 4));
            initialPositions.set(2, Position.create(0, 4));
            const board = Board.withPawns(initialPositions);

            // Create custom color scheme
            const colorScheme = {
                player1: chalk.red,
                player2: chalk.blue,
                walls: chalk.yellow,
                grid: chalk.gray,
                coordinates: chalk.dim
            };

            const visualizer = new BoardVisualizer(board, colorScheme);
            const output = visualizer.visualize();

            // Check that the output contains ANSI color codes
            expect(output).to.include('\x1b['); // Should contain ANSI escape sequences
            expect(output).to.match(/\x1b\[31m.*1/); // Red color for P1
            expect(output).to.match(/\x1b\[34m.*2/); // Blue color for P2
            console.log(output)
        });
    });
}); 