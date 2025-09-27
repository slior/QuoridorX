import { Position } from '../../types/game';
import { Board } from '../../core/Board';

/**
 * Node used in pathfinding algorithms
 */
export interface PathNode {
    position: Position;
    gCost: number; // Distance from start
    hCost: number; // Heuristic distance to goal
    fCost: number; // gCost + hCost
    parent?: PathNode;
}

/**
 * Result of a pathfinding operation
 */
export interface PathfindingResult {
    found: boolean;
    distance: number;
    path: Position[];
}

/**
 * Utility class for pathfinding algorithms in Quoridor
 */
export class PathfindingUtils {
    /**
     * Find shortest path using BFS (Breadth-First Search)
     */
    static findShortestPath(board: Board, start: Position, goals: Position[]): PathfindingResult {
        if (goals.length === 0) {
            return { found: false, distance: Infinity, path: [] };
        }

        // Validate positions
        if (!this.isValidPosition(board, start)) {
            throw new Error(`Invalid start position: (${start.row}, ${start.col})`);
        }
        
        for (const goal of goals) {
            if (!this.isValidPosition(board, goal)) {
                throw new Error(`Invalid goal position: (${goal.row}, ${goal.col})`);
            }
        }

        // Check if start is already at goal
        if (goals.some(goal => start.equals(goal))) {
            return { found: true, distance: 0, path: [start] };
        }

        const boardSize = board.getBoardSize();
        const visited = new Set<string>();
        const queue: { position: Position; distance: number; path: Position[] }[] = [];
        
        queue.push({ position: start, distance: 0, path: [start] });
        visited.add(this.positionKey(start));

        while (queue.length > 0) {
            const current = queue.shift()!;
            
            // Check if we reached any goal
            if (goals.some(goal => current.position.equals(goal))) {
                return {
                    found: true,
                    distance: current.distance,
                    path: current.path
                };
            }

            // Explore neighbors
            const neighbors = this.getValidNeighbors(board, current.position);
            for (const neighbor of neighbors) {
                const neighborKey = this.positionKey(neighbor);
                
                if (!visited.has(neighborKey)) {
                    visited.add(neighborKey);
                    queue.push({
                        position: neighbor,
                        distance: current.distance + 1,
                        path: [...current.path, neighbor]
                    });
                }
            }
        }

        return { found: false, distance: Infinity, path: [] };
    }

    /**
     * Find optimal path using A* algorithm
     */
    static findOptimalPath(board: Board, start: Position, goals: Position[]): PathfindingResult {
        if (goals.length === 0) {
            return { found: false, distance: Infinity, path: [] };
        }

        // Validate positions
        if (!this.isValidPosition(board, start)) {
            throw new Error(`Invalid start position: (${start.row}, ${start.col})`);
        }
        
        for (const goal of goals) {
            if (!this.isValidPosition(board, goal)) {
                throw new Error(`Invalid goal position: (${goal.row}, ${goal.col})`);
            }
        }

        // Check if start is already at goal
        if (goals.some(goal => start.equals(goal))) {
            return { found: true, distance: 0, path: [start] };
        }

        const openSet: PathNode[] = [];
        const closedSet = new Set<string>();
        
        const startNode: PathNode = {
            position: start,
            gCost: 0,
            hCost: this.minDistanceToGoals(start, goals),
            fCost: 0
        };
        startNode.fCost = startNode.gCost + startNode.hCost;
        
        openSet.push(startNode);

        while (openSet.length > 0) {
            // Find node with lowest fCost
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].fCost < openSet[currentIndex].fCost) {
                    currentIndex = i;
                }
            }
            
            const current = openSet.splice(currentIndex, 1)[0];
            closedSet.add(this.positionKey(current.position));

            // Check if we reached any goal
            if (goals.some(goal => current.position.equals(goal))) {
                return {
                    found: true,
                    distance: current.gCost,
                    path: this.reconstructPath(current)
                };
            }

            // Explore neighbors
            const neighbors = this.getValidNeighbors(board, current.position);
            for (const neighbor of neighbors) {
                const neighborKey = this.positionKey(neighbor);
                
                if (closedSet.has(neighborKey)) {
                    continue;
                }

                const tentativeGCost = current.gCost + 1;
                
                let neighborNode = openSet.find(node => 
                    node.position.equals(neighbor)
                );

                if (!neighborNode) {
                    neighborNode = {
                        position: neighbor,
                        gCost: tentativeGCost,
                        hCost: this.minDistanceToGoals(neighbor, goals),
                        fCost: 0,
                        parent: current
                    };
                    neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;
                    openSet.push(neighborNode);
                } else if (tentativeGCost < neighborNode.gCost) {
                    neighborNode.gCost = tentativeGCost;
                    neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;
                    neighborNode.parent = current;
                }
            }
        }

        return { found: false, distance: Infinity, path: [] };
    }

    /**
     * Check if movement between two adjacent positions is blocked by walls
     */
    static isMovementBlocked(board: Board, from: Position, to: Position): boolean {
        return board.isWallBetween(from, to);
    }

    /**
     * Validate if an entire path is clear of wall obstacles
     */
    static isPathValid(board: Board, path: Position[]): boolean {
        if (path.length < 2) {
            return true;
        }

        for (let i = 0; i < path.length - 1; i++) {
            if (this.isMovementBlocked(board, path[i], path[i + 1])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate Manhattan distance between two positions
     */
    static manhattanDistance(pos1: Position, pos2: Position): number {
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }

    /**
     * Calculate Euclidean distance between two positions
     */
    static euclideanDistance(pos1: Position, pos2: Position): number {
        const deltaRow = pos1.row - pos2.row;
        const deltaCol = pos1.col - pos2.col;
        return Math.sqrt(deltaRow * deltaRow + deltaCol * deltaCol);
    }

    /**
     * Find minimum Manhattan distance to any of the goal positions
     */
    static minDistanceToGoals(start: Position, goals: Position[]): number {
        if (goals.length === 0) {
            return Infinity;
        }

        return Math.min(...goals.map(goal => this.manhattanDistance(start, goal)));
    }

    /**
     * Get all valid neighboring positions (not blocked by walls)
     */
    private static getValidNeighbors(board: Board, position: Position): Position[] {
        const neighbors: Position[] = [];
        const boardSize = board.getBoardSize();
        
        // Check all four directions
        const directions = [
            { row: -1, col: 0 },  // Up
            { row: 1, col: 0 },   // Down
            { row: 0, col: -1 },  // Left
            { row: 0, col: 1 }    // Right
        ];

        for (const direction of directions) {
            const newRow = position.row + direction.row;
            const newCol = position.col + direction.col;
            
            // Check bounds
            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                const neighbor = Position.create(newRow, newCol, boardSize);
                
                // Check if movement is not blocked by walls
                if (!this.isMovementBlocked(board, position, neighbor)) {
                    neighbors.push(neighbor);
                }
            }
        }

        return neighbors;
    }

    /**
     * Reconstruct path from goal node back to start
     */
    private static reconstructPath(goalNode: PathNode): Position[] {
        const path: Position[] = [];
        let current: PathNode | undefined = goalNode;
        
        while (current) {
            path.unshift(current.position);
            current = current.parent;
        }
        
        return path;
    }

    /**
     * Generate unique key for position (for use in sets/maps)
     */
    private static positionKey(position: Position): string {
        return `${position.row},${position.col}`;
    }

    /**
     * Check if position is within board bounds
     */
    private static isValidPosition(board: Board, position: Position): boolean {
        const boardSize = board.getBoardSize();
        return position.row >= 0 && position.row < boardSize &&
               position.col >= 0 && position.col < boardSize;
    }
}