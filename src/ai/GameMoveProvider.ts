import { Game } from '../core/Game';
import { GameState, Move, PlayerID, Position, Wall, MOVE_TYPE_MOVE, MOVE_TYPE_WALL } from '../types/game';
import { Board } from '../core/Board';

/**
 * Provides valid moves for AI strategies by interfacing with the game engine
 */
export class GameMoveProvider {
    /**
     * Get all valid moves for a player given the current game state
     * This includes both pawn moves and wall placements
     * 
     * @param game - The current game instance
     * @param playerId - The player to get moves for
     * @returns Array of all valid moves
     */
    static getValidMoves(game: Game, playerId: PlayerID): Move[] {
        const moves: Move[] = [];
        const board = game.getBoard();
        const gameState = game.getGameState();
        const remainingWalls = game.getRemainingWalls();
        
        // Only generate moves if it's the player's turn and game is in progress
        if (gameState.currentTurn !== playerId || gameState.status !== 'IN_PROGRESS') {
            return [];
        }
        
        const playerIdStr = playerId.toString();
        
        // Get pawn position
        const pawnPosition = board.getPawnPosition(playerId);
        if (!pawnPosition) {
            return []; // Player has no pawn on the board
        }
        
        // Add valid pawn moves
        moves.push(...this.getValidPawnMoves(board, playerId, pawnPosition, playerIdStr));
        
        // Add valid wall placements if player has walls remaining
        const wallsLeft = remainingWalls.get(playerId) ?? 0;
        if (wallsLeft > 0) {
            moves.push(...this.getValidWallPlacements(game, board, playerIdStr));
        }
        
        return moves;
    }
    
    /**
     * Get all valid pawn moves for a player
     */
    private static getValidPawnMoves(board: Board, playerId: PlayerID, currentPosition: Position, playerIdStr: string): Move[] {
        const moves: Move[] = [];
        const boardSize = board.getBoardSize();
        
        // Check all possible positions on the board
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const targetPosition = Position.create(row, col, boardSize);
                
                // Skip current position
                if (targetPosition.equals(currentPosition)) {
                    continue;
                }
                
                // Try the move to see if it's valid
                try {
                    // Create a temporary board to test the move
                    const testBoard = Board.withPawns(board.getPawns(), boardSize);
                    // Copy walls to test board
                    for (const wall of board.getWalls()) {
                        testBoard.placeWall(wall);
                    }
                    
                    testBoard.movePawn(playerId, targetPosition);
                    
                    // If we got here without an exception, the move is valid
                    moves.push({
                        type: MOVE_TYPE_MOVE,
                        playerId: playerIdStr,
                        to: targetPosition
                    });
                } catch (error) {
                    // Move is invalid, skip it
                    continue;
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Get all valid wall placements for a player
     */
    private static getValidWallPlacements(game: Game, board: Board, playerIdStr: string): Move[] {
        const moves: Move[] = [];
        const boardSize = board.getBoardSize();
        
        // Try all possible wall positions and orientations
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                // Try horizontal wall
                if (col < boardSize - 1) { // Horizontal walls need space to the right
                    try {
                        const position = Position.create(row, col, boardSize);
                        const wall = new Wall(position, true);
                        
                        // Test if wall placement is valid by trying it on a copy
                        const testGame = this.createGameCopy(game);
                        testGame.placeWall(parseInt(playerIdStr), wall);
                        
                        moves.push({
                            type: MOVE_TYPE_WALL,
                            playerId: playerIdStr,
                            wall: wall
                        });
                    } catch (error) {
                        // Invalid wall placement, skip
                        continue;
                    }
                }
                
                // Try vertical wall
                if (row < boardSize - 1) { // Vertical walls need space below
                    try {
                        const position = Position.create(row, col, boardSize);
                        const wall = new Wall(position, false);
                        
                        // Test if wall placement is valid by trying it on a copy
                        const testGame = this.createGameCopy(game);
                        testGame.placeWall(parseInt(playerIdStr), wall);
                        
                        moves.push({
                            type: MOVE_TYPE_WALL,
                            playerId: playerIdStr,
                            wall: wall
                        });
                    } catch (error) {
                        // Invalid wall placement, skip
                        continue;
                    }
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Create a copy of the game for testing moves without affecting the original
     */
    private static createGameCopy(originalGame: Game): Game {
        const originalBoard = originalGame.getBoard();
        const boardSize = originalBoard.getBoardSize();
        
        // Create new board with same pawn positions
        const newBoard = Board.withPawns(originalBoard.getPawns(), boardSize);
        
        // Copy all walls
        for (const wall of originalBoard.getWalls()) {
            newBoard.placeWall(wall);
        }
        
        // Create new game with the copied board
        const newGame = new Game(newBoard);
        
        // Add players with their current wall counts
        const remainingWalls = originalGame.getRemainingWalls();
        for (const [playerId, wallCount] of remainingWalls) {
            newGame.addPlayer(playerId);
            // We need to set the wall count to match - this is a limitation of the current Game API
            // For now, we'll work with what we have
        }
        
        return newGame;
    }
    
    /**
     * Convenience method to create a getValidMoves function for use with RandomStrategy
     */
    static createMoveProvider(game: Game): (state: GameState, playerId: string) => Move[] {
        return (state: GameState, playerId: string) => {
            return GameMoveProvider.getValidMoves(game, parseInt(playerId));
        };
    }
}