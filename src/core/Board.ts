import { Position, Wall, PlayerID, DEFAULT_GAME_SIZE } from "../types/game";



/**
 * Represents the Quoridor game board
 * (0,0) is the top left.
 * - Pawns can move on the intersections (81 positions)
 * - Walls can be placed between the intersections
 */
export class Board {

    private readonly boardSize: number;
    private pawns: Map<PlayerID, Position>; // Maps player ID to their position
    private walls: Wall[];

    constructor(boardSize: number = DEFAULT_GAME_SIZE) {
        this.boardSize = boardSize;
        this.pawns = new Map<PlayerID, Position>();
        this.walls = [];
    }

    /**
     * Creates a new board with pawns in specified initial positions
     * @param pawnPositions Map of player IDs to their initial positions
     * @param boardSize Optional board size (defaults to DEFAULT_GAME_SIZE)
     */
    static withPawns(pawnPositions: Map<PlayerID, Position>, boardSize: number = DEFAULT_GAME_SIZE): Board {
        const board = new Board(boardSize);
        for (const [playerId, position] of pawnPositions) {
            if (position.boardSize !== boardSize) {
                throw new Error(`Position for player ${playerId} was created with different board size`);
            }
            board.pawns.set(playerId, position);
        }
        return board;
    }

    /**
     * Get a player's current position
     */
    public getPawnPosition(playerId: number): Position | undefined {
        return this.pawns.get(playerId);
    }

    /**
     * Place a wall on the board
     */
    public placeWall(wall: Wall)
    {
        if (!this.isValidWallPlacement(wall)) {
            throw new Error(`Invalid wall placement: ${wall}`)
        }

        this.walls.push(wall)

    }

    private horizontalWalls() : Wall[] { return this.walls.filter( w => w.isHorizontal) }

    private verticalWalls() : Wall[] { return this.walls.filter (w => !w.isHorizontal) }

    

    /**
     * Check if a wall placement is valid
     */
    private isValidWallPlacement(wall: Wall): boolean {
  
        // Check if wall would extend beyond board
        if (wall.isHorizontal && wall.position.col >= this.boardSize - 1) {
            return false;
        }
        if (!wall.isHorizontal && wall.position.row >= this.boardSize - 1) {
            return false;
        }

        //Check if wall intersects with existing walls
        const thisWallPositions = wall.occupies()
        return this.walls.every(w => arePositionsMutuallyExclusive(w.occupies(),thisWallPositions))
       
    }

    /**
     * Get the board size
     */
    public getBoardSize(): number {
        return this.boardSize;
    }

    /**
     * Move a pawn to a new position
     * @throws Error if the move is invalid
     */
    public movePawn(playerId: PlayerID, targetPosition: Position): void {
        const currentPosition = this.getPawnPosition(playerId);
        if (!currentPosition) {
            throw new Error(`No pawn found for player ${playerId}`);
        }

        if (this.isValidMove(playerId, targetPosition) || this.isValidJump(playerId, targetPosition)) {
            this.pawns.set(playerId, targetPosition);
        } else {
            throw new Error(`Invalid move from ${currentPosition} to ${targetPosition}`);
        }
    }

    /**
     * Check if a move is a valid orthogonal move
     */
    private isValidMove(playerId: PlayerID, targetPosition: Position): boolean {
        const currentPosition = this.getPawnPosition(playerId);
        if (!currentPosition) return false;

        // Check if target position is already occupied
        for (const [pid, pos] of this.pawns.entries()) {
            if (pid !== playerId && pos.equals(targetPosition)) {
                return false;
            }
        }

        // Check if move is orthogonal and one step
        try {
            if (currentPosition.right().equals(targetPosition) && !this.isWallBetween(currentPosition, targetPosition)) {
                return true;
            }
            if (currentPosition.left().equals(targetPosition) && !this.isWallBetween(currentPosition, targetPosition)) {
                return true;
            }
            if (currentPosition.up().equals(targetPosition) && !this.isWallBetween(currentPosition, targetPosition)) {
                return true;
            }
            if (currentPosition.down().equals(targetPosition) && !this.isWallBetween(currentPosition, targetPosition)) {
                return true;
            }
        } catch (e) {
            // Position methods throw errors when moving outside board bounds
            return false;
        }

        return false;
    }

    /**
     * Check if a move is a valid jump move over another pawn
     */
    private isValidJump(playerId: PlayerID, targetPosition: Position): boolean {
        const currentPosition = this.getPawnPosition(playerId);
        if (!currentPosition) return false;

        // Check if target position is already occupied
        for (const [pid, pos] of this.pawns.entries()) {
            if (pid !== playerId && pos.equals(targetPosition)) {
                return false;
            }
        }

        // Check each direction for a pawn to jump over
        try {
            // Right jump
            if (this.isOccupied(currentPosition.right()) && 
                currentPosition.right().right().equals(targetPosition) &&
                !this.isWallBetween(currentPosition, currentPosition.right()) &&
                !this.isWallBetween(currentPosition.right(), targetPosition)) {
                return true;
            }
            // Left jump
            if (this.isOccupied(currentPosition.left()) &&
                currentPosition.left().left().equals(targetPosition) &&
                !this.isWallBetween(currentPosition, currentPosition.left()) &&
                !this.isWallBetween(currentPosition.left(), targetPosition)) {
                return true;
            }
            // Up jump
            if (this.isOccupied(currentPosition.up()) &&
                currentPosition.up().up().equals(targetPosition) &&
                !this.isWallBetween(currentPosition, currentPosition.up()) &&
                !this.isWallBetween(currentPosition.up(), targetPosition)) {
                return true;
            }
            // Down jump
            if (this.isOccupied(currentPosition.down()) &&
                currentPosition.down().down().equals(targetPosition) &&
                !this.isWallBetween(currentPosition, currentPosition.down()) &&
                !this.isWallBetween(currentPosition.down(), targetPosition)) {
                return true;
            }
        } catch (e) {
            // Position methods throw errors when moving outside board bounds
            return false;
        }

        return false;
    }

    /**
     * Check if there's a wall between two adjacent positions
     */
    private isWallBetween(pos1: Position, pos2: Position): boolean {
        // For vertical movement (different rows, same column)
        if (pos1.col === pos2.col) {
            const minRow = Math.min(pos1.row, pos2.row);
            // Check for horizontal walls (which block vertical movement)
            return this.walls.some(wall => {
                if (!wall.isHorizontal) return false; // Only horizontal walls block vertical movement
                const wallPositions = wall.occupies();
                // Wall must be at the row between the positions and span the column they're in
                return wall.position.row === minRow && 
                       wallPositions.some(pos => pos.col === pos1.col);
            });
        }
        
        // For horizontal movement (same row, different columns)
        if (pos1.row === pos2.row) {
            const minCol = Math.min(pos1.col, pos2.col);
            // Check for vertical walls (which block horizontal movement)
            return this.walls.some(wall => {
                if (wall.isHorizontal) return false; // Only vertical walls block horizontal movement
                const wallPositions = wall.occupies();
                // Wall must be at the column between the positions and span the row they're in
                return wall.position.col === minCol && 
                       wallPositions.some(pos => pos.row === pos1.row);
            });
        }

        return false;
    }

    /**
     * Check if a position is occupied by any pawn
     */
    private isOccupied(position: Position): boolean {
        return Array.from(this.pawns.values()).some(pos => pos.equals(position));
    }

} 


/**
     * Check if two arrays of positions are mutually exclusive
     */
function arePositionsMutuallyExclusive(posArray1: Position[], posArray2: Position[]): boolean {
    return !posArray1.some(pos1 => posArray2.some(pos2 => pos1.equals(pos2)));
}