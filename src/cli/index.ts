import { QuoridorCLI } from './QuoridorCLI';
import { Game } from '../core/Game';
import { Board } from '../core/Board';
import { Position } from '../types/game';
import { commands } from './commands';

// Initialize game with default board setup
const board = new Board();
const game = new Game(board);

// Set up initial pawn positions
const boardSize = board.getBoardSize();
const initialPositions = new Map([
    [1, Position.create(0, boardSize / 2 | 0)],      // Player 1 starts at top middle
    [2, Position.create(boardSize - 1, boardSize / 2 | 0)]  // Player 2 starts at bottom middle
]);

const gameBoard = Board.withPawns(initialPositions);
const gameInstance = new Game(gameBoard);

// Add players
gameInstance.addPlayer(1);
gameInstance.addPlayer(2);

// Create CLI instance
const cli = new QuoridorCLI(gameInstance);

// Register all commands
for (const command of commands) {
    cli.registerCommand(command);
}

cli.start(); 