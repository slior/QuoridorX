import { Command } from '../types/Command';
import { Game } from '../../core/Game';
import { Position } from '../../types/game';

export class MoveCommand extends Command {

    name = 'move';
    description = 'Move your pawn to the specified position';
    syntax = 'move <row> <col>';

    execute(game: Game, args: string[]): void {
        if (args.length !== 2) {
            throw new Error('Move command requires exactly 2 arguments: row and column');
        }

        const [row, col] = args.map(arg => {
            return this.verifyRowColTypes(arg);
        });

        const targetPosition = Position.create(row, col);
        const currentPlayer = game.getGameState().currentTurn;
        game.movePawn(currentPlayer, targetPosition);
    }
} 