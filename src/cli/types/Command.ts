import { Game } from '../../core/Game';

export abstract class Command {
    abstract name: string;
    abstract description: string;
    abstract syntax: string;
    abstract execute(game: Game, args: string[]): void;


    protected verifyRowColTypes(arg : string): number {
        const num = parseInt(arg, 10);
        if (isNaN(num)) {
            throw new Error('Row and column must be numbers');
        }
        return num;
    }

}