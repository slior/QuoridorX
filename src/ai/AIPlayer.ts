import { PlayerID, Move } from '../types/game';
import { Game } from '../core/Game';
import { AIStrategy } from './strategy';

/**
 * Interface for AI players that can play Quoridor
 * This provides a clean abstraction for different AI implementations
 */
export interface AIPlayer {
    /**
     * The player ID this AI controls
     */
    readonly playerId: PlayerID;
    
    /**
     * The AI strategy used for move calculation
     */
    readonly strategy: AIStrategy;
    
    /**
     * Calculate and return the next move for this AI player
     * @param game - The current game instance
     * @returns The move this AI player wants to make
     * @throws Error if no valid moves are available or game state is invalid
     */
    makeMove(game: Game): Move;
    
    /**
     * Get the name/description of this AI player for display purposes
     * @returns Human-readable name of the AI player
     */
    getName(): string;
    
    /**
     * Get the difficulty level or description of this AI's strategy
     * @returns Description of the AI's skill level or strategy type
     */
    getDifficulty(): string;
}

/**
 * Utility functions for AI player management
 */
export class AIPlayerUtils {
    /**
     * Check if a player ID corresponds to an AI player in the given collection
     * @param playerId - The player ID to check
     * @param aiPlayers - Array of AI players to search in
     * @returns True if the player ID belongs to an AI player
     */
    static isAIPlayer(playerId: PlayerID, aiPlayers: AIPlayer[]): boolean {
        return aiPlayers.some(ai => ai.playerId === playerId);
    }
    
    /**
     * Get the AI player instance for a given player ID
     * @param playerId - The player ID to find
     * @param aiPlayers - Array of AI players to search in
     * @returns The AI player if found, undefined otherwise
     */
    static getAIPlayer(playerId: PlayerID, aiPlayers: AIPlayer[]): AIPlayer | undefined {
        return aiPlayers.find(ai => ai.playerId === playerId);
    }
    
    /**
     * Validate that an AI player configuration is valid
     * @param aiPlayer - The AI player to validate
     * @throws Error if the AI player configuration is invalid
     */
    static validateAIPlayer(aiPlayer: AIPlayer): void {
        if (!aiPlayer.playerId || (aiPlayer.playerId !== 1 && aiPlayer.playerId !== 2)) {
            throw new Error(`Invalid AI player ID: ${aiPlayer.playerId} (must be 1 or 2)`);
        }
        
        if (!aiPlayer.strategy) {
            throw new Error(`AI player ${aiPlayer.playerId} must have a strategy`);
        }
        
        if (!aiPlayer.getName() || aiPlayer.getName().trim() === '') {
            throw new Error(`AI player ${aiPlayer.playerId} must have a name`);
        }
    }
    
    /**
     * Execute a move for an AI player
     * This is a convenience function that handles the move execution logic
     * @param aiPlayer - The AI player making the move
     * @param game - The game instance
     * @throws Error if it's not the AI player's turn or the move is invalid
     */
    static executeAIMove(aiPlayer: AIPlayer, game: Game): void {
        const gameState = game.getGameState();
        
        // Validate it's this AI player's turn
        if (gameState.currentTurn !== aiPlayer.playerId) {
            throw new Error(`Not AI player ${aiPlayer.playerId}'s turn (current turn: ${gameState.currentTurn})`);
        }
        
        // Get the move from the AI player
        const move = aiPlayer.makeMove(game);
        
        // Apply the move to the game
        if (move.type === 'move') {
            game.movePawn(aiPlayer.playerId, move.to);
        } else if (move.type === 'wall') {
            game.placeWall(aiPlayer.playerId, move.wall);
        } else {
            throw new Error(`Unknown move type: ${(move as any).type}`);
        }
    }
}

