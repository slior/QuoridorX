import { Position, Wall, PlayerID } from "../types/game";



/**
 * Represents the Quoridor game board
 * (0,0) is the top left.
 * - Pawns can move on the intersections (81 positions)
 * - Walls can be placed between the intersections
 */
export class Board {
    private static readonly DEFAULT_BOARD_SIZE = 9;
    private readonly boardSize: number;
    private pawns: Map<PlayerID, Position>; // Maps player ID to their position
    private walls: Wall[];
    // private horizontalWalls: Set<string>; // Stores wall positions as "row,col"
    // private verticalWalls: Set<string>; // Stores wall positions as "row,col"

    constructor(boardSize: number = Board.DEFAULT_BOARD_SIZE) {
        this.boardSize = boardSize;
        // Position.initializeBoardSize(this.boardSize) //note this is a global variable.
        this.pawns = new Map<PlayerID, Position>();
        this.walls = [];
        // this.horizontalWalls = new Set();
        // this.verticalWalls = new Set();
    }

    /**
     * Initialize a player's pawn on the board
     */
    public initializePawn(playerId: number, position: Position): void {
        // if (this.isValidPosition(position)) {
            this.pawns.set(playerId, position);
        // } else {
        //     throw new Error(`Invalid position: ${JSON.stringify(position)}`);
        // }
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

        // const key = `${wall.position.row},${wall.position.col}`;
        // if (wall.isHorizontal) {
        //     this.horizontalWalls.add(key);
        // } else {
        //     this.verticalWalls.add(key);
        // }
        // return true;
    }

    // /**
    //  * Check if a position is within the board boundaries
    //  */
    // public isValidPosition(position: Position): boolean {
    //     return position.row >= 0 && 
    //            position.row < this.boardSize && 
    //            position.col >= 0 && 
    //            position.col < this.boardSize;
    // }


    private horizontalWalls() : Wall[] { return this.walls.filter( w => w.isHorizontal) }

    private verticalWalls() : Wall[] { return this.walls.filter (w => !w.isHorizontal) }

    

    /**
     * Check if a wall placement is valid
     */
    private isValidWallPlacement(wall: Wall): boolean {
        // Check if wall position is within bounds
        // if (!this.isValidPosition(wall.position)) {
        //     return false;
        // }

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
       
        
        // const key = `${wall.position.row},${wall.position.col}`;
        // if (wall.isHorizontal) {
        //     if (this.horizontalWalls.has(key)) {
        //         return false;
        //     }
        // } else {
        //     if (this.verticalWalls.has(key)) {
        //         return false;
        //     }
        // }

        // return true;
    }

    // /**
    //  * Check if there's a wall at the specified position
    //  */
    // public hasWall(position: Position, isHorizontal: boolean): boolean {
    //     const key = `${position.row},${position.col}`;
    //     return isHorizontal ? 
    //         this.horizontalWalls.has(key) : 
    //         this.verticalWalls.has(key);
    // }

    /**
     * Get the board size
     */
    public getBoardSize(): number {
        return this.boardSize;
    }

    // /**
    //  * Create a deep copy of the board
    //  */
    // public clone(): Board {
    //     const newBoard = new Board(this.boardSize);
        
    //     // Copy pawns
    //     this.pawns.forEach((position, playerId) => {
    //         newBoard.pawns.set(playerId, {...position});
    //     });

    //     // Copy walls
    //     this.horizontalWalls.forEach(wall => newBoard.horizontalWalls.add(wall));
    //     this.verticalWalls.forEach(wall => newBoard.verticalWalls.add(wall));

    //     return newBoard;
    // }
} 


/**
     * Check if two arrays of positions are mutually exclusive
     */
function arePositionsMutuallyExclusive(posArray1: Position[], posArray2: Position[]): boolean {
    return !posArray1.some(pos1 => posArray2.some(pos2 => pos1.equals(pos2)));
}