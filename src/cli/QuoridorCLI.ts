import { Command } from './types/Command';
import { Game } from '../core/Game';
import { BoardVisualizer } from './BoardVisualizer';
import { createInterface } from 'readline';
import chalk from 'chalk';
import { GameStatus } from '../types/game';
import { PlayerID } from '../types/game';
import { AIPlayerManager } from './AIPlayerManager';

const QUIT_COMMAND = 'quit'
const HELP_COMMNAD = 'help'


export class QuoridorCLI {
    private readonly game: Game;
    private readonly commands: Map<string, Command>;
    private readonly boardVisualizer: BoardVisualizer;
    private readonly aiManager: AIPlayerManager | undefined;
    private readonly readline = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '' // Initial empty prompt, will be set in updatePromptColor
    });

    constructor(game: Game, aiManager?: AIPlayerManager) {
        this.game = game;
        this.commands = new Map();
        this.boardVisualizer = new BoardVisualizer(game.getBoard());
        this.aiManager = aiManager;
        this.updatePromptColor(); // Set initial prompt color
    }

    
    private updatePromptColor(): void {
        const currentPlayer = this.game.getGameState().currentTurn;
        const color = this.boardVisualizer.getColorFor(currentPlayer)
        this.readline.setPrompt(color('quoridor> '));
    }

    public registerCommand(command: Command): void {
        this.commands.set(command.name, command);
    }

    private showHelp(): void {
        console.log('\nAvailable commands:');
        for (const command of this.commands.values()) {
            console.log(`  ${command.syntax.padEnd(20)} - ${command.description}`);
        }
        console.log('  quit                 - Exit the game\n');
    }

    private executeGameCommand(command : Command, commandArgs : string[])
    {
        try {
            command.execute(this.game, commandArgs);
            
            console.log(this.boardVisualizer.visualize());
            
            // Check if game has ended and show status if it has
            const gameState = this.game.getGameState();
            if (gameState.status !== GameStatus.IN_PROGRESS) {
                const statusCommand = this.commands.get('status');
                if (statusCommand) {
                    statusCommand.execute(this.game, []);
                }
                return; // Don't process AI turns if game is over
            }
            
            this.updatePromptColor(); // Update prompt color after each move
            
            // Handle AI turns if applicable
            this.handleAITurns();
            
        } catch (error: any) {
            console.error(chalk.red(`Error: ${error.message || error}`));
            if (this.game.getGameState().status === GameStatus.IN_PROGRESS)
                console.log(`Usage: ${command.syntax}`);
        }
    }

    private resolveCommand(cmdName : string, commandArgs : string[]) : () => void
    {
        if (cmdName === QUIT_COMMAND)
        {
            return () => {
                console.log('Thanks for playing!');
                this.readline.close();
                process.exit(0);    
            }
        }
        else if (cmdName === HELP_COMMNAD) 
            return () => {
                this.showHelp();
                return;
            }
        else 
        {
            const command = this.commands.get(cmdName)
            if (command)
            {
                return () => { this.executeGameCommand(command,commandArgs)}
            }
            else return () => {
                console.log(`Unknown command: ${cmdName}`);
                console.log('Type "help" to see available commands');
                return;
            }
        }
    }

    private executeCommand(input: string): void {
        const args = input.trim().split(/\s+/);
        const commandName = args[0];
        const commandArgs = args.slice(1);

        const cmd = this.resolveCommand(commandName, commandArgs)
        cmd();

    }

    /**
     * Handle AI turns automatically
     */
    private handleAITurns(): void {
        if (!this.aiManager) return;
        
        let gameState = this.game.getGameState();
        
        // Continue executing AI turns while it's an AI player's turn and game is in progress
        while (gameState.status === GameStatus.IN_PROGRESS && this.aiManager.isAIPlayer(gameState.currentTurn)) {
            try {
                const currentPlayer = gameState.currentTurn;
                const aiPlayer = this.aiManager.getAIPlayer(currentPlayer);
                
                if (aiPlayer) {
                    // Get the move from AI
                    const move = aiPlayer.makeMove(this.game);
                    
                    // Display AI move
                    const strategyName = this.aiManager.getStrategyName(currentPlayer);
                    const moveDescription = this.aiManager.formatMove(move);
                    console.log(chalk.cyan(`\nAI Player ${currentPlayer} (${strategyName}) plays: ${moveDescription}`));
                    
                    // Execute the SAME move that was calculated and displayed
                    this.aiManager.executeSpecificMove(currentPlayer, move);
                    
                    // Show updated board
                    console.log(this.boardVisualizer.visualize());
                    
                    // Update game state for next iteration
                    gameState = this.game.getGameState();
                    
                    // Check if game ended
                    if (gameState.status !== GameStatus.IN_PROGRESS) {
                        const statusCommand = this.commands.get('status');
                        if (statusCommand) {
                            statusCommand.execute(this.game, []);
                        }
                        break;
                    }
                    
                    this.updatePromptColor();
                    
                    // Add small delay for better UX in AI vs AI games
                    if (this.aiManager.isAIPlayer(gameState.currentTurn)) {
                        // Brief pause between AI moves
                        const delay = process.env.NODE_ENV === 'test' ? 0 : 1000;
                        if (delay > 0) {
                            // Use synchronous delay for better CLI experience
                            const start = Date.now();
                            while (Date.now() - start < delay) {
                                // Busy wait for short delay
                            }
                        }
                    }
                }
            } catch (error: any) {
                console.error(chalk.red(`AI Error: ${error.message || error}`));
                break;
            }
        }
    }

    public start(): void {
        console.log('Type "help" to see available commands\n');
        console.log(this.boardVisualizer.visualize());
        
        // Handle initial AI turn if game starts with AI player
        this.handleAITurns();

        this.readline.prompt();

        this.readline.on('line', (line) => {
            if (line.trim()) {
                this.executeCommand(line.trim());
            }
            if (this.game.getGameState().status === GameStatus.IN_PROGRESS) {
                this.readline.prompt();
            }
        });

        this.readline.on('close', () => {
            process.exit(0);
        });
    }
} 