import { Game } from '../../core/Game';

/**
 * Base class for CLI commands
 */
export abstract class Command {
    /** Command name used to invoke it */
    abstract name: string;
    
    /** Description of what the command does */
    abstract description: string;
    
    /** Command syntax/usage pattern */
    abstract syntax: string;

    /**
     * Executes the command
     * @param game - Game instance to execute on
     * @param args - Command arguments
     * @throws Error if args invalid
     */
    abstract execute(game: Game, args: string[]): void;

    /**
     * Verifies and converts string to number
     * @param arg - String to convert
     * @returns Parsed number
     * @throws Error if not a number
     */
    protected verifyRowColTypes(arg: string): number {
        const num = parseInt(arg, 10);
        if (isNaN(num)) {
            throw new Error('Row and column must be numbers');
        }
        return num;
    }
}