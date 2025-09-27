import { PlayerID } from '../types/game';

export interface PlayerConfig {
    id: PlayerID;
    type: 'human' | 'ai';
    strategy?: 'random' | 'heuristic' | 'pathfinding';
}

export interface GameConfig {
    player1: PlayerConfig;
    player2: PlayerConfig;
}

export class ArgumentValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ArgumentValidationError';
    }
}

export class CLIArgumentParser {
    private static readonly AVAILABLE_STRATEGIES = ['random', 'heuristic', 'pathfinding'];
    private static readonly VALID_PLAYER_TYPES = ['human', 'ai:random', 'ai:heuristic', 'ai:pathfinding'];

    /**
     * Parse command-line arguments and return game configuration
     * Defaults unspecified players to human
     */
    static parse(args: string[]): GameConfig {
        const config: GameConfig = {
            player1: { id: 1, type: 'human' },
            player2: { id: 2, type: 'human' }
        };

        // Process each argument
        for (const arg of args) {
            const trimmedArg = arg.trim();
            
            if (trimmedArg.startsWith('--p1=')) {
                const value = trimmedArg.substring(5).trim();
                config.player1 = this.parsePlayerConfig(1, value);
            } else if (trimmedArg.startsWith('--p2=')) {
                const value = trimmedArg.substring(5).trim();
                config.player2 = this.parsePlayerConfig(2, value);
            }
            // Ignore unrecognized arguments
        }

        return config;
    }

    /**
     * Parse a single player configuration string
     */
    private static parsePlayerConfig(playerId: PlayerID, value: string): PlayerConfig {
        const cleanValue = value.toLowerCase().trim();

        if (cleanValue === 'human') {
            return { id: playerId, type: 'human' };
        }

        if (cleanValue.startsWith('ai:')) {
            const strategy = cleanValue.substring(3);
            
            if (strategy === '') {
                throw new ArgumentValidationError('AI player must specify strategy: ai:<strategy>');
            }

            if (!this.AVAILABLE_STRATEGIES.includes(strategy)) {
                throw new ArgumentValidationError(
                    `Unknown AI strategy '${strategy}'\nAvailable strategies: ${this.AVAILABLE_STRATEGIES.join(', ')}`
                );
            }

            return {
                id: playerId,
                type: 'ai',
                strategy: strategy as 'random' | 'heuristic' | 'pathfinding'
            };
        }

        if (cleanValue === 'ai') {
            throw new ArgumentValidationError('AI player must specify strategy: ai:<strategy>');
        }

        throw new ArgumentValidationError(
            `Unknown player type '${value}'\nValid types: ${this.VALID_PLAYER_TYPES.join(', ')}`
        );
    }

    /**
     * Get comprehensive usage help
     */
    static getUsageHelp(): string {
        return `Usage: quoridor [OPTIONS]

Options:
  --p1=<type>     Player 1 type: human, ai:random, ai:heuristic, ai:pathfinding (default: human)
  --p2=<type>     Player 2 type: human, ai:random, ai:heuristic, ai:pathfinding (default: human)
  --help          Show this help message

Examples:
  quoridor                                    # Human vs Human (default)
  quoridor --p1=human --p2=ai:random          # Human vs Random AI
  quoridor --p2=ai:heuristic                  # Human vs Heuristic AI  
  quoridor --p1=ai:random                     # Random AI vs Human
  quoridor --p1=ai:heuristic --p2=ai:random   # AI vs AI

Available AI Strategies:
  random      - Makes random valid moves
  heuristic   - Prioritizes moves toward the goal
  pathfinding - Advanced AI using pathfinding algorithms for optimal play`;
    }
}