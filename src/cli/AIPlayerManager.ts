import { Game } from '../core/Game';
import { PlayerID, Move, MOVE_TYPE_MOVE, MOVE_TYPE_WALL } from '../types/game';
import { AIPlayer } from '../ai/AIPlayer';
import { RandomStrategy, HeuristicStrategy } from '../ai/strategy';
import { GameMoveProvider } from '../ai/GameMoveProvider';
import { PlayerConfig } from './CLIArgumentParser';

/**
 * Simple AI Player implementation for CLI use
 */
class CLIAIPlayer implements AIPlayer {
    public readonly playerId: PlayerID;
    public readonly strategy: any; // RandomStrategy or HeuristicStrategy
    private readonly strategyName: string;

    constructor(playerId: PlayerID, strategy: any, strategyName: string) {
        this.playerId = playerId;
        this.strategy = strategy;
        this.strategyName = strategyName;
    }

    makeMove(game: Game): Move {
        const gameState = game.getGameState();
        const moveProvider = GameMoveProvider.createMoveProvider(game);
        return this.strategy.calculateMove(gameState, this.playerId.toString());
    }

    getName(): string {
        return `AI Player ${this.playerId} (${this.strategyName})`;
    }

    getDifficulty(): string {
        return this.strategyName;
    }
}

/**
 * Manages AI players in the CLI game
 */
export class AIPlayerManager {
    private readonly game: Game;
    private readonly aiPlayers: Map<PlayerID, AIPlayer>;

    constructor(game: Game) {
        this.game = game;
        this.aiPlayers = new Map();
    }

    /**
     * Create an AI player based on configuration
     * Returns null for human players
     */
    createPlayer(config: PlayerConfig): AIPlayer | null {
        if (config.type === 'human') {
            return null;
        }

        if (config.type === 'ai') {
            if (!config.strategy) {
                throw new Error(`AI player ${config.id} must have a strategy`);
            }

            const moveProvider = GameMoveProvider.createMoveProvider(this.game);
            let strategy: any;
            let strategyName: string;

            switch (config.strategy) {
                case 'random':
                    strategy = new RandomStrategy({ getValidMoves: moveProvider });
                    strategyName = 'Random';
                    break;
                
                case 'heuristic':
                    strategy = new HeuristicStrategy({ getValidMoves: moveProvider });
                    strategyName = 'Heuristic';
                    break;
                
                default:
                    throw new Error(`Unsupported AI strategy: ${config.strategy}`);
            }

            const aiPlayer = new CLIAIPlayer(config.id, strategy, strategyName);
            this.aiPlayers.set(config.id, aiPlayer);
            return aiPlayer;
        }

        throw new Error(`Unknown player type: ${config.type}`);
    }

    /**
     * Check if a player is an AI player
     */
    isAIPlayer(playerId: PlayerID): boolean {
        return this.aiPlayers.has(playerId);
    }

    /**
     * Execute an AI player's turn
     */
    executeAITurn(playerId: PlayerID): void {
        const aiPlayer = this.aiPlayers.get(playerId);
        if (!aiPlayer) {
            throw new Error(`Player ${playerId} is not an AI player`);
        }

        const gameState = this.game.getGameState();
        if (gameState.currentTurn !== playerId) {
            throw new Error(`Not AI player ${playerId}'s turn (current turn: ${gameState.currentTurn})`);
        }

        // Get the move from AI player
        const move = aiPlayer.makeMove(this.game);

        // Execute the move
        this.executeSpecificMove(playerId, move);
    }

    /**
     * Execute a specific move for an AI player
     * This avoids double move calculation by using a pre-calculated move
     */
    executeSpecificMove(playerId: PlayerID, move: Move): void {
        const gameState = this.game.getGameState();
        if (gameState.currentTurn !== playerId) {
            throw new Error(`Not AI player ${playerId}'s turn (current turn: ${gameState.currentTurn})`);
        }

        // Execute the move
        if (move.type === MOVE_TYPE_MOVE) {
            this.game.movePawn(playerId, move.to);
        } else if (move.type === MOVE_TYPE_WALL) {
            this.game.placeWall(playerId, move.wall);
        } else {
            throw new Error(`Unknown move type: ${(move as any).type}`);
        }
    }

    /**
     * Get the strategy name for display purposes
     */
    getStrategyName(playerId: PlayerID): string {
        const aiPlayer = this.aiPlayers.get(playerId);
        return aiPlayer ? aiPlayer.getDifficulty() : 'Human';
    }

    /**
     * Format a move for display
     */
    formatMove(move: Move): string {
        if (move.type === MOVE_TYPE_MOVE) {
            return `move to (${move.to.row}, ${move.to.col})`;
        } else if (move.type === MOVE_TYPE_WALL) {
            const orientation = move.wall.isHorizontal ? 'horizontal' : 'vertical';
            return `place ${orientation} wall at (${move.wall.position.row}, ${move.wall.position.col})`;
        }
        return 'unknown move';
    }

    /**
     * Get the AI player for a given player ID
     */
    getAIPlayer(playerId: PlayerID): AIPlayer | undefined {
        return this.aiPlayers.get(playerId);
    }
}