import { Command } from '../types/Command';
import { Game } from '../../core/Game';
import chalk from 'chalk';
import { GameStatus } from '../../types/game';

export class StatusCommand extends Command {
    name = 'status';
    description = 'Show the current game status';
    syntax = 'status';

    execute(game: Game, args: string[]): void {
        if (args.length !== 0) {
            throw new Error('Status command takes no arguments');
        }

        const state = game.getGameState();
        const remainingWalls = game.getRemainingWalls();

        console.log('\nGame Status:');
        console.log('-----------');
        
        // Show current turn
        if (state.status === GameStatus.IN_PROGRESS) {
            console.log(`Current turn: ${chalk.bold(`Player ${state.currentTurn}`)}`);
        } else {
            console.log(`Game Status: ${this.formatGameStatus(state.status)}`);
        }

        // Show remaining walls
        console.log('\nRemaining Walls:');
        console.log(`Player 1: ${chalk.red(remainingWalls.get(1)?.toString() || '0')}`);
        console.log(`Player 2: ${chalk.blue(remainingWalls.get(2)?.toString() || '0')}`);
    }

    private formatGameStatus(status: GameStatus): string {
        switch (status) {
            case GameStatus.PLAYER_1_WON:
                return chalk.green('Player 1 Won!');
            case GameStatus.PLAYER_2_WON:
                return chalk.green('Player 2 Won!');
            case GameStatus.IN_PROGRESS:
                return chalk.yellow('In Progress');
            default:
                return 'Unknown';
        }
    }
} 