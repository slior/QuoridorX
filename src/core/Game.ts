import { Board } from './Board';
import { Position, Wall, PlayerID, DEFAULT_GAME_SIZE } from '../types/game';

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

export class Game {
    private readonly board: Board;
    private readonly wallsPerPlayer: number;
    private readonly remainingWalls: Map<PlayerID, number>;
    
    constructor(board: Board, wallsPerPlayer: number = 10) {
        this.board = board;
        this.wallsPerPlayer = wallsPerPlayer;
        this.remainingWalls = new Map();
    }

    /**
     * Add a player to the game
     */
    public addPlayer(playerId: PlayerID) {
        this.remainingWalls.set(playerId, this.wallsPerPlayer);
    }

    /**
     * Place a wall for a player
     * @throws NoWallsRemainingError if player has no walls
     * @throws PathBlockedError if wall blocks path to goal
     * @throws Error if wall placement is invalid
     */
    public placeWall(playerId: PlayerID, wall: Wall): void {
        // Check if player has walls remaining
        const remainingWalls = this.remainingWalls.get(playerId);
        if (remainingWalls === undefined) {
            throw new GameError(`Player ${playerId} is not in the game`);
        }
        if (remainingWalls <= 0) {
            throw new NoWallsRemainingError(playerId);
        }

        // Try to place the wall
        try {
            this.board.placeWall(wall);
        } catch (error) {
            // Rethrow board placement errors
            throw error;
        }

        // Check if both players can reach their goals
        if (!this.allPlayersHavePathToGoal()) {
            // Rollback wall placement
            this.board.removeLastWall();
            throw new PathBlockedError();
        }

        // Update remaining walls
        this.remainingWalls.set(playerId, remainingWalls - 1);
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
} 