import { Command } from '../types/Command';
import { Game } from '../../core/Game';
import { Position, Wall } from '../../types/game';


const HORIZ = 'h'
const VERT = 'v'

export class WallCommand extends Command {
    name = 'wall';
    description = 'Place a wall at the specified position';
    syntax = `wall <row> <col> <${HORIZ}/${VERT}>`;

    execute(game: Game, args: string[]): void {
        if (args.length !== 3) {
            throw new Error('Wall command requires exactly 3 arguments: row, column, and orientation (h/v)');
        }

        const [row, col, orientation] = args;
        
        // Parse coordinates
        const [rowNum, colNum] = [row, col].map(arg => this.verifyRowColTypes(arg));

        // Validate orientation
        if (orientation !== HORIZ && orientation !== VERT)
            throw new Error(`Orientation must be either "${HORIZ}" (horizontal) or "${VERT}" (vertical)`);

        const position = Position.create(rowNum, colNum);
        const wall = new Wall(position, orientation === HORIZ);
        const currentPlayer = game.getGameState().currentTurn;
        
        game.placeWall(currentPlayer, wall);
    }
} 