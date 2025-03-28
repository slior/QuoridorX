import { Command } from '../types/Command';
import { Game } from '../../core/Game';
import { Position } from '../../types/game';

const COMMAND_NAME = 'm';
const DIRECTION_UP = 'u';
const DIRECTION_DOWN = 'd';
const DIRECTION_LEFT = 'l';
const DIRECTION_RIGHT = 'r';
const VALID_DIRECTIONS = [DIRECTION_UP, DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT];

export class RelativeMoveCommand extends Command {
    name = COMMAND_NAME;
    description = `Move your pawn in a relative direction (${DIRECTION_UP}/${DIRECTION_DOWN}/${DIRECTION_LEFT}/${DIRECTION_RIGHT})`;
    syntax = `${COMMAND_NAME} <dir>`;

    execute(game: Game, args: string[]): void {
        if (args.length !== 1) {
            throw new Error(`${COMMAND_NAME} command requires exactly 1 argument: direction (${DIRECTION_UP}/${DIRECTION_DOWN}/${DIRECTION_LEFT}/${DIRECTION_RIGHT})`);
        }

        const direction = args[0].toLowerCase();
        if (!VALID_DIRECTIONS.includes(direction)) {
            throw new Error(`Direction must be one of: ${VALID_DIRECTIONS.join(', ')}`);
        }

        const currentPlayer = game.getGameState().currentTurn;
        const currentPosition = game.getBoard().getPawnPosition(currentPlayer);
        
        if (!currentPosition) {
            throw new Error(`No pawn found for player ${currentPlayer}`);
        }

        let targetPosition: Position;
        try {
            switch (direction) {
                case DIRECTION_UP:
                    targetPosition = currentPosition.up();
                    break;
                case DIRECTION_DOWN:
                    targetPosition = currentPosition.down();
                    break;
                case DIRECTION_LEFT:
                    targetPosition = currentPosition.left();
                    break;
                case DIRECTION_RIGHT:
                    targetPosition = currentPosition.right();
                    break;
                default:
                    throw new Error('Invalid direction');
            }
        } catch (e) {
            throw new Error('Cannot move in that direction - out of bounds');
        }

        game.movePawn(currentPlayer, targetPosition);
    }
} 