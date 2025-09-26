import { QuoridorCLI } from './QuoridorCLI';
import { Game } from '../core/Game';
import { Board } from '../core/Board';
import { Position } from '../types/game';
import { commands } from './commands';
import { CLIArgumentParser, ArgumentValidationError } from './CLIArgumentParser';
import { AIPlayerManager } from './AIPlayerManager';
import chalk from 'chalk';

function main() {
    try {
        // Parse command-line arguments (skip 'node' and script name)
        let args = process.argv.slice(2);
        // Filter out '--' separator that ts-node adds
        args = args.filter(arg => arg !== '--');
        
        // Handle help argument
        if (args.includes('--help') || args.includes('-h')) {
            console.log(CLIArgumentParser.getUsageHelp());
            process.exit(0);
        }
        
        // Parse game configuration
        const gameConfig = CLIArgumentParser.parse(args);
        
        // Initialize game with default board setup
        const board = new Board();
        const boardSize = board.getBoardSize();
        const initialPositions = new Map([
            [1, Position.create(0, Math.floor(boardSize / 2), boardSize)],      // Player 1 starts at top middle
            [2, Position.create(boardSize - 1, Math.floor(boardSize / 2), boardSize)]  // Player 2 starts at bottom middle
        ]);
        
        const gameBoard = Board.withPawns(initialPositions);
        const gameInstance = new Game(gameBoard);
        
        // Add players to game
        gameInstance.addPlayer(1);
        gameInstance.addPlayer(2);
        
        // Set up AI players
        const aiManager = new AIPlayerManager(gameInstance);
        aiManager.createPlayer(gameConfig.player1);
        aiManager.createPlayer(gameConfig.player2);
        
        // Display game mode
        console.log(chalk.bold('\nWelcome to Quoridor!'));
        console.log(`Game Mode: ${getGameModeDescription(gameConfig)}`);
        console.log(`Player 1: ${getPlayerDescription(gameConfig.player1)}`);
        console.log(`Player 2: ${getPlayerDescription(gameConfig.player2)}`);
        
        // Create CLI instance with AI manager
        const cli = new QuoridorCLI(gameInstance, aiManager);
        
        // Register all commands
        for (const command of commands) {
            cli.registerCommand(command);
        }
        
        cli.start();
        
    } catch (error: any) {
        if (error instanceof ArgumentValidationError) {
            console.error(chalk.red(`Error: ${error.message}`));
            console.log('\nUse --help for usage information.');
            process.exit(1);
        } else {
            console.error(chalk.red(`Unexpected error: ${error.message || error}`));
            process.exit(1);
        }
    }
}

function getGameModeDescription(gameConfig: any): string {
    const p1Type = gameConfig.player1.type;
    const p2Type = gameConfig.player2.type;
    
    if (p1Type === 'human' && p2Type === 'human') {
        return 'Human vs Human';
    } else if (p1Type === 'ai' && p2Type === 'ai') {
        return 'AI vs AI';
    } else {
        return 'Human vs AI';
    }
}

function getPlayerDescription(playerConfig: any): string {
    if (playerConfig.type === 'human') {
        return 'Human';
    } else {
        const strategyName = playerConfig.strategy === 'random' ? 'Random' : 'Heuristic';
        return `AI (${strategyName} Strategy)`;
    }
}

// Run the main function
main();
