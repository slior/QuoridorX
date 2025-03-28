import { Command } from './types/Command';
import { Game } from '../core/Game';
import { BoardVisualizer } from './BoardVisualizer';
import { createInterface } from 'readline';
import chalk from 'chalk';

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
                return () => {
                    try {
                        command.execute(this.game, commandArgs);
                        // After each successful command, show the board
                        console.log(this.boardVisualizer.visualize());
                    } catch (error: any) {
                        console.error(chalk.red(`Error: ${error.message || error}`));
                        console.log(`Usage: ${command.syntax}`);
                    }
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