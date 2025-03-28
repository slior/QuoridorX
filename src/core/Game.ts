import { Board } from './Board';
import { Position, Wall, PlayerID, DEFAULT_GAME_SIZE, GameState, GameStatus } from '../types/game';

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

export class Game {
    private readonly board: Board;
    private readonly wallsPerPlayer: number;
    private readonly remainingWalls: Map<PlayerID, number>;
    private gameState: GameState;
    
    constructor(board: Board, wallsPerPlayer: number = 10) {
        this.board = board;
        this.wallsPerPlayer = wallsPerPlayer;
        this.remainingWalls = new Map();
        this.gameState = {
            currentTurn: 1, // Player 1 starts
            status: GameStatus.IN_PROGRESS
        };
    }

    /**
     * Get current game state
     */
    public getGameState(): GameState {
        return { ...this.gameState };
    }

    /**
     * Add a player to the game
     */
    public addPlayer(playerId: PlayerID) {
        if (this.remainingWalls.size >= 2) {
            throw new GameError('Game already has maximum number of players');
        }
        this.remainingWalls.set(playerId, this.wallsPerPlayer);
    }

    /**
     * Place a wall for a player
     * @throws NoWallsRemainingError if player has no walls
     * @throws PathBlockedError if wall blocks path to goal
     * @throws Error if wall placement is invalid
     */
    public placeWall(playerId: PlayerID, wall: Wall): void
    {
        this.validatePlayer(playerId);
        
        this.validateGameInProgress();
        this.validatePlayerTurn(playerId);

        // Check if player has walls remaining
        const remainingWalls = this.remainingWalls.get(playerId);
        
        if (remainingWalls !== undefined && remainingWalls <= 0) {
            throw new NoWallsRemainingError(playerId);
        } 
        if (remainingWalls === undefined) throw new GameError(`Missing remaining walls for ${playerId}`) //remainingWalls === undefined shouldn't happen at this point.
        
        this.board.placeWall(wall);
        
        // Check if both players can reach their goals
        if (!this.allPlayersHavePathToGoal()) {
            // Rollback wall placement
            this.board.removeLastWall();
            throw new PathBlockedError();
        }
        this.remainingWalls.set(playerId, remainingWalls - 1); // Update remaining walls
        
        this.switchTurns();
    }

    /**
     * Move a player's pawn
     */
    public movePawn(playerId: PlayerID, targetPosition: Position): void {
        this.validateGameInProgress();
        this.validatePlayerTurn(playerId);

        this.board.movePawn(playerId, targetPosition);
        
        // Check if player won
        if (this.isGoalPosition(playerId, targetPosition)) {
            this.gameState.status = playerId === 1 ? GameStatus.PLAYER_1_WON : GameStatus.PLAYER_2_WON;
            return;
        }

        // Switch turns
        this.switchTurns();
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
     * Get the game board
     */
    public getBoard(): Board {
        return this.board;
    }

    /**
     * Get the remaining walls for each player
     */
    public getRemainingWalls(): Map<PlayerID, number> {
        return new Map(this.remainingWalls);
    }
} 