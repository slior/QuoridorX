import { Command } from '../types/Command';
import { Game } from '../../core/Game';

export class RedoCommand extends Command {
    name = 'redo';
    description = 'Redo the last undone move';
    syntax = 'redo';

    execute(game: Game, args: string[]): void {
        if (args.length > 0) {
            throw new Error('Redo command takes no arguments');
        }
        game.redo();
    }
} 