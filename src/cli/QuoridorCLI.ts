import { Command } from './types/Command';
import { Game } from '../core/Game';
import { BoardVisualizer } from './BoardVisualizer';
import { createInterface } from 'readline';
import chalk from 'chalk';
import { GameStatus } from '../types/game';

const QUIT_COMMAND = 'quit'
const HELP_COMMNAD = 'help'


export class QuoridorCLI {
    private readonly game: Game;
    private readonly commands: Map<string, Command>;
    private readonly boardVisualizer: BoardVisualizer;
    private readonly readline = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.cyan('quoridor> ')
    });

    constructor(game: Game) {
        this.game = game;
        this.commands = new Map();
        this.boardVisualizer = new BoardVisualizer(game.getBoard());
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
            }
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
                return () => { this.executeGameCommand(command,commandArgs)
                    
                }
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

    public start(): void {
        console.log(chalk.bold('\nWelcome to Quoridor!'));
        console.log('Type "help" to see available commands\n');
        console.log(this.boardVisualizer.visualize());

        this.readline.prompt();

        this.readline.on('line', (line) => {
            if (line.trim()) {
                this.executeCommand(line.trim());
            }
            this.readline.prompt();
        });

        this.readline.on('close', () => {
            process.exit(0);
        });
    }
} 