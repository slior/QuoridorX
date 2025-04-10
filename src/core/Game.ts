import { Board } from './Board';
import { Position, Wall, PlayerID, GameState, GameStatus, GameHistoryState } from '../types/game';

export class GameError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GameError';
    }
}

export class NoWallsRemainingError extends GameError {
    constructor(playerId: PlayerID) {
        super(`Player ${playerId} has no walls remaining`);
    }
}

export class PathBlockedError extends GameError {
    constructor() {
        super('Wall placement would block path to goal for at least one player');
    }
}

export class WrongTurnError extends GameError {
    constructor(playerId: PlayerID) {
        super(`Not player ${playerId}'s turn`);
    }
}

export class GameEndedError extends GameError {
    constructor() {
        super('Game has already ended');
    }
}

/**
 * Manages the game state and rules for a Quoridor game.
 * Handles player turns, wall placement, pawn movement, and game history.
 */
export class Game {
    private board: Board;
    private readonly wallsPerPlayer: number;
    private remainingWalls: Map<PlayerID, number>;
    private gameState: GameState;
    private history: GameHistoryState[];
    private redoStack: GameHistoryState[];
    
    /**
     * Creates a new game instance
     * @param board - The game board
     * @param wallsPerPlayer - Number of walls per player (default: 10)
     */
    constructor(board: Board, wallsPerPlayer: number = 10) {
        this.board = board;
        this.wallsPerPlayer = wallsPerPlayer;
        this.remainingWalls = new Map();
        this.gameState = {
            currentTurn: 1, // Player 1 starts
            status: GameStatus.IN_PROGRESS
        };
        this.history = [];
        this.redoStack = [];
    }

    /**
     * Gets the current game state
     * @returns Current game state including turn and status
     */
    public getGameState(): GameState {
        return { ...this.gameState };
    }

    /**
     * Adds a player to the game
     * @param playerId - ID of the player to add
     * @throws GameError if game already has maximum players
     */
    public addPlayer(playerId: PlayerID) {
        if (this.remainingWalls.size >= 2) {
            throw new GameError('Game already has maximum number of players');
        }
        this.remainingWalls.set(playerId, this.wallsPerPlayer);
    }

    /**
     * Places a wall for a player
     * @param playerId - ID of the player placing the wall
     * @param wall - Wall to place
     * @throws NoWallsRemainingError if player has no walls
     * @throws PathBlockedError if wall blocks path to goal
     * @throws WrongTurnError if not player's turn
     * @throws GameEndedError if game is over
     * @throws GameError if player not in game or wall placement invalid
     */
    public placeWall(playerId: PlayerID, wall: Wall): void
    {
        this.validatePlayer(playerId);
        this.validateGameInProgress();
        this.validatePlayerTurn(playerId);

        // Save current state before making changes
        this.history.push(this.saveCurrentState());
        // Clear redo stack as we're making a new move
        this.redoStack = [];

        // Check if player has walls remaining
        const remainingWalls = this.remainingWalls.get(playerId);
        
        if (remainingWalls !== undefined && remainingWalls <= 0) {
            this.history.pop(); // Rollback state save on error
            throw new NoWallsRemainingError(playerId);
        } 
        if (remainingWalls === undefined) {
            this.history.pop(); // Rollback state save on error
            throw new GameError(`Missing remaining walls for ${playerId}`);
        }
        
        try {
            this.board.placeWall(wall);
            
            // Check if both players can reach their goals
            if (!this.allPlayersHavePathToGoal()) {
                // Rollback wall placement
                this.board.removeLastWall();
                this.history.pop(); // Rollback state save on error
                throw new PathBlockedError();
            }
            this.remainingWalls.set(playerId, remainingWalls - 1); // Update remaining walls
            
            this.switchTurns();
        } catch (error) {
            this.history.pop(); // Rollback state save on error
            throw error;
        }
    }

    /**
     * Moves a player's pawn
     * @param playerId - ID of the player moving
     * @param targetPosition - Position to move to
     * @throws WrongTurnError if not player's turn
     * @throws GameEndedError if game is over
     * @throws GameError if move invalid
     */
    public movePawn(playerId: PlayerID, targetPosition: Position): void {
        this.validateGameInProgress();
        this.validatePlayerTurn(playerId);

        // Save current state before making changes
        this.history.push(this.saveCurrentState());
        

        try {
            this.board.movePawn(playerId, targetPosition);
            this.redoStack = []; // Clear redo stack as we're making a new move
            
            if (this.isGoalPosition(playerId, targetPosition)) { // Check if player won
                this.gameState.status = playerId === 1 ? GameStatus.PLAYER_1_WON : GameStatus.PLAYER_2_WON;
                return;
            }

            this.switchTurns();
        } catch (error) {
            this.history.pop(); // Rollback state save on error
            throw error;
        }
    }

    /**
     * Undoes the last move
     * @throws GameError if no moves to undo
     */
    public undo(): void {
        if (this.history.length === 0) {
            throw new GameError('No moves to undo');
        }

        // Save current state to redo stack before undoing
        this.redoStack.push(this.saveCurrentState());
        
        // Restore previous state
        const previousState = this.history.pop()!;
        this.restoreState(previousState);
    }

    /**
     * Redoes the last undone move
     * @throws GameError if no moves to redo
     */
    public redo(): void {
        if (this.redoStack.length === 0) {
            throw new GameError('No moves to redo');
        }

        // Save current state to history before redoing
        this.history.push(this.saveCurrentState());
        
        // Restore redo state
        const redoState = this.redoStack.pop()!;
        this.restoreState(redoState);
    }

    /**
     * Restore a previous game state
     */
    private restoreState(state: GameHistoryState): void {
        // Restore board state
        this.board = Board.withPawns(state.board.pawns, this.board.getBoardSize());
        for (const wall of state.board.walls) {
            this.board.placeWall(wall);
        }
        
        // Restore game state
        this.gameState = { ...state.gameState };
        
        // Restore remaining walls
        this.remainingWalls = new Map(state.remainingWalls);
    }

    private validatePlayer(id : PlayerID)
    {
        if (this.remainingWalls.get(id) === undefined)
            throw new GameError(`Player ${id} is not in the game`)
    }

    private validateGameInProgress(): void {
        if (this.gameState.status !== GameStatus.IN_PROGRESS) {
            throw new GameEndedError();
        }
    }

    private validatePlayerTurn(playerId: PlayerID): void {
        if (playerId !== this.gameState.currentTurn) {
            throw new WrongTurnError(playerId);
        }
    }

    private switchTurns(): void {
        this.gameState.currentTurn = this.gameState.currentTurn === 1 ? 2 : 1;
    }

    /**
     * Check if all players have a path to their goal
     */
    private allPlayersHavePathToGoal(): boolean {
        for (const [playerId] of this.remainingWalls) {
            if (!this.hasPathToGoal(playerId)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if a player has a path to their goal using BFS
     */
    private hasPathToGoal(playerId: PlayerID): boolean {
        const position = this.board.getPawnPosition(playerId);
        if (!position) return false;
        
        const visited = new Set<string>();
        const queue: Position[] = [position];
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            const posHash = current.hashCode();
            
            if (visited.has(posHash)) continue;
            visited.add(posHash);

            // Check if we reached the goal
            if (this.isGoalPosition(playerId, current)) {
                return true;
            }

            // Add valid moves to queue
            this.getValidMoves(current).forEach(move => {
                if (!visited.has(move.hashCode())) {
                    queue.push(move);
                }
            });
        }

        return false;
    }

    /**
     * Get all valid moves from a position
     */
    private getValidMoves(position: Position): Position[] {
        const moves: Position[] = [];
        
        // Try all four directions
        try { if (!this.board.isWallBetween(position, position.right())) moves.push(position.right()); } catch {}
        try { if (!this.board.isWallBetween(position, position.left())) moves.push(position.left()); } catch {}
        try { if (!this.board.isWallBetween(position, position.up())) moves.push(position.up()); } catch {}
        try { if (!this.board.isWallBetween(position, position.down())) moves.push(position.down()); } catch {}
        
        return moves;
    }

    /**
     * Check if a position is a goal position for a player
     */
    private isGoalPosition(playerId: PlayerID, position: Position): boolean {
        // Player 1 needs to reach bottom row, Player 2 needs to reach top row
        return playerId === 1 ? 
            position.row === this.board.getBoardSize() - 1 : 
            position.row === 0;
    }

    /**
     * Gets the game board
     * @returns Current game board
     */
    public getBoard(): Board {
        return this.board;
    }

    /**
     * Gets remaining walls for each player
     * @returns Map of player IDs to their remaining wall count
     */
    public getRemainingWalls(): Map<PlayerID, number> {
        return new Map(this.remainingWalls);
    }

    /**
     * Creates a snapshot of the current game state
     */
    private saveCurrentState(): GameHistoryState {
        return {
            board: {
                pawns: new Map(this.board.getPawns()),
                walls: [...this.board.getWalls()]
            },
            gameState: { ...this.gameState },
            remainingWalls: new Map(this.remainingWalls)
        };
    }
} 