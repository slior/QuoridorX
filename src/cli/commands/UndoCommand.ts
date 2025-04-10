import { Command } from '../types/Command';
import { Game } from '../../core/Game';

export class UndoCommand extends Command {
    name = 'undo';
    description = 'Undo the last move';
    syntax = 'undo';

    execute(game: Game, args: string[]): void {
        if (args.length > 0) {
            throw new Error('Undo command takes no arguments');
        }
        game.undo();
    }
} 