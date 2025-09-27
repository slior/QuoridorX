import { Position, Wall, PlayerID, P1, P2 } from '../../types/game';
import { Game } from '../../core/Game';
import { PathfindingUtils, PathfindingResult } from './PathfindingUtils';

/**
 * Strategic evaluation of a board position
 */
export interface StrategicEvaluation {
    playerPathLength: number;
    opponentPathLength: number;
    pathLengthDifference: number;
    positionalAdvantage: number;
    boardControl: number;
    territoryControl: number;
    isEndgame: boolean;
    winningProbability: number;
    urgencyScore: number;
}

/**
 * Information about a chokepoint on the board
 */
export interface ChokepointInfo {
    position: Position;
    narrowness: number; // 0-1, how narrow the passage is
    strategicValue: number; // 0-1, strategic importance
}

/**
 * Wall placement impact analysis
 */
export interface WallImpactAnalysis {
    playerPathImpact: number;
    opponentPathImpact: number;
    strategicValue: number;
    riskAssessment: number;
    winningPotential: number;
}

/**
 * Path comparison between players
 */
export interface PathComparison {
    player1Distance: number;
    player2Distance: number;
    advantage: number; // -1 to 1, negative means player1 advantage
    competitiveness: number; // 0-1, how close the game is
    player1Efficiency: number;
    player2Efficiency: number;
}

/**
 * Race condition analysis
 */
export interface RaceAnalysis {
    isRace: boolean;
    turnsToWin: { player1: number; player2: number };
    raceWinner: PlayerID | null;
}

/**
 * Positioning analysis
 */
export enum Stance {
    Offensive = 'offensive',
    Defensive = 'defensive',
    Balanced = 'balanced'
}

export interface PositioningAnalysis {
    stance: Stance;
    aggression: number; // 0-1
    wallEfficiency: number; // 0-1
}

/**
 * Long-term strategic position evaluation
 */
export interface LongTermEvaluation {
    sustainability: number; // 0-1
    flexibility: number; // 0-1
    controlPotential: number; // 0-1
}

/**
 * Strategic board analyzer for advanced AI decision making
 */
export class BoardAnalyzer {
    private static readonly RACE_DISTANCE_THRESHOLD = 4;
    private static readonly AGGRESSION_MAX = 1;
    private static readonly AGGRESSION_POSITIONAL_ADVANTAGE_WEIGHT = 0.6;
    private static readonly AGGRESSION_WALL_USAGE_WEIGHT = 0.4;
    private static readonly OFFENSIVE_AGGRESSION_THRESHOLD = 0.6;
    private static readonly DEFENSIVE_AGGRESSION_THRESHOLD = 0.4;
    private static readonly SUSTAINABILITY_MAX = 1;
    private static readonly SUSTAINABILITY_WALLS_WEIGHT = 0.5;
    private static readonly SUSTAINABILITY_URGENCY_WEIGHT = 0.5;
    private static readonly CONTROL_POTENTIAL_MAX = 1;
    private static readonly CONTROL_POTENTIAL_BOARD_CONTROL_WEIGHT = 0.4;
    private static readonly CONTROL_POTENTIAL_TERRITORY_CONTROL_WEIGHT = 0.3;
    private static readonly CONTROL_POTENTIAL_SUSTAINABILITY_WEIGHT = 0.3;
    private static readonly URGENCY_NEAR_WIN_HIGH_THRESHOLD_MOVES = 2;
    private static readonly URGENCY_NEAR_WIN_HIGH_VALUE = 0.9;
    private static readonly URGENCY_NEAR_WIN_MEDIUM_THRESHOLD_MOVES = 4;
    private static readonly URGENCY_NEAR_WIN_MEDIUM_VALUE = 0.7;
    private static readonly URGENCY_ENDGAME_VALUE = 0.5;
    private static readonly URGENCY_LINEAR_BASE = 0.3;
    private static readonly URGENCY_LINEAR_DECAY_PER_MOVE = 0.02;
    private static readonly URGENCY_MIN = 0;
    private static readonly URGENCY_MAX = 1;
    /**
     * Evaluate strategic position for a player
     */
    static evaluatePosition(game: Game, playerId: PlayerID): StrategicEvaluation {
        const gameState = game.getGameState();
        const board = game.getBoard();
        
        // Get player positions
        const playerPos = board.getPawnPosition(playerId);
        const opponentId : PlayerID = playerId === P1 ? P2 : P1;
        const opponentPos = board.getPawnPosition(opponentId);
        
        if (!playerPos || !opponentPos) {
            throw new Error(`Invalid game state: missing player positions`);
        }

        // Calculate paths to goals
        const playerGoals = this.getPlayerGoals(playerId, board.getBoardSize());
        const opponentGoals = this.getPlayerGoals(opponentId, board.getBoardSize());
        
        const playerPath = PathfindingUtils.findShortestPath(board, playerPos, playerGoals);
        const opponentPath = PathfindingUtils.findShortestPath(board, opponentPos, opponentGoals);
        
        const playerPathLength = playerPath.found ? playerPath.distance : Infinity;
        const opponentPathLength = opponentPath.found ? opponentPath.distance : Infinity;
        const pathLengthDifference = playerPathLength - opponentPathLength;
        
        // Calculate positional advantage
        const positionalAdvantage = this.calculatePositionalAdvantage(
            pathLengthDifference, playerPathLength, opponentPathLength
        );
        
        // Calculate board control metrics
        const boardControl = this.calculateBoardControl(game, playerId);
        const territoryControl = this.calculateTerritoryControl(game, playerId);
        
        // Endgame detection
        const isEndgame = playerPathLength <= 3 || opponentPathLength <= 3;
        const winningProbability = this.calculateWinningProbability(
            pathLengthDifference, playerPathLength, isEndgame
        );
        const urgencyScore = this.calculateUrgencyScore(
            playerPathLength, opponentPathLength, isEndgame
        );

        return {
            playerPathLength,
            opponentPathLength,
            pathLengthDifference,
            positionalAdvantage,
            boardControl,
            territoryControl,
            isEndgame,
            winningProbability,
            urgencyScore
        };
    }

    // /**
    //  * Find strategic chokepoints on the board
    //  */
    // static findChokePoints(game: Game): ChokepointInfo[] {
    //     const board = game.getBoard();
    //     const boardSize = board.getBoardSize();
    //     const chokepoints: ChokepointInfo[] = [];
        
    //     // Analyze each position for chokepoint potential
    //     for (let row = 1; row < boardSize - 1; row++) {
    //         for (let col = 1; col < boardSize - 1; col++) {
    //             const position = Position.create(row, col, boardSize);
    //             const narrowness = this.calculateNarrowness(board, position);
                
    //             if (narrowness > 0.3) { // Potential chokepoint
    //                 const strategicValue = this.calculateChokepointStrategicValue(
    //                     game, position, narrowness
    //                 );
                    
    //                 chokepoints.push({
    //                     position,
    //                     narrowness,
    //                     strategicValue
    //                 });
    //             }
    //         }
    //     }
        
    //     // Sort by strategic value (descending)
    //     return chokepoints.sort((a, b) => b.strategicValue - a.strategicValue);
    // }

    /**
     * Evaluate the impact of placing a specific wall
     */
    // static evaluateWallPlacement(game: Game, playerId: PlayerID, wall: Wall): WallImpactAnalysis {
    //     // Temporarily place the wall to analyze impact
    //     const board = game.getBoard();
    //     const originalState = game.getGameState();
        
    //     try {
    //         // Simulate wall placement
    //         game.placeWall(playerId, wall);
            
    //         const playerPos = board.getPawnPosition(playerId)!;
    //         const opponentId = playerId === P1 ? P2 : P1;
    //         const opponentPos = board.getPawnPosition(opponentId)!;
            
    //         // Calculate path impacts
    //         const playerGoals = this.getPlayerGoals(playerId, board.getBoardSize());
    //         const opponentGoals = this.getPlayerGoals(opponentId, board.getBoardSize());
            
    //         const playerPathAfter = PathfindingUtils.findShortestPath(board, playerPos, playerGoals);
    //         const opponentPathAfter = PathfindingUtils.findShortestPath(board, opponentPos, opponentGoals);
            
    //         // Remove wall to calculate before state
    //         game.undo();
            
    //         const playerPathBefore = PathfindingUtils.findShortestPath(board, playerPos, playerGoals);
    //         const opponentPathBefore = PathfindingUtils.findShortestPath(board, opponentPos, opponentGoals);
            
    //         const playerPathImpact = (playerPathAfter.distance - playerPathBefore.distance);
    //         const opponentPathImpact = (opponentPathAfter.distance - opponentPathBefore.distance);
            
    //         // Calculate strategic value (positive means good for player)
    //         const strategicValue = opponentPathImpact - playerPathImpact;
            
    //         // Risk assessment
    //         const riskAssessment = this.calculateWallRisk(playerPathImpact, playerPathAfter.distance);
            
    //         // Winning potential
    //         const winningPotential = this.calculateWinningPotential(
    //             strategicValue, opponentPathAfter.distance, playerPathAfter.distance
    //         );
            
    //         return {
    //             playerPathImpact,
    //             opponentPathImpact,
    //             strategicValue,
    //             riskAssessment,
    //             winningPotential
    //         };
            
    //     } catch (error) {
    //         // If wall placement fails, return negative evaluation
    //         return {
    //             playerPathImpact: Infinity,
    //             opponentPathImpact: 0,
    //             strategicValue: -1,
    //             riskAssessment: 1,
    //             winningPotential: 0
    //         };
    //     }
    // }

    /**
     * Compare optimal paths for both players
     */
    static comparePlayerPaths(game: Game): PathComparison {
        const board = game.getBoard();
        const boardSize = board.getBoardSize();
        
        const player1Pos = board.getPawnPosition(P1)!;
        const player2Pos = board.getPawnPosition(P2)!;
        
        const player1Goals = this.getPlayerGoals(P1, boardSize);
        const player2Goals = this.getPlayerGoals(P2, boardSize);
        
        const player1Path = PathfindingUtils.findShortestPath(board, player1Pos, player1Goals);
        const player2Path = PathfindingUtils.findShortestPath(board, player2Pos, player2Goals);
        
        const player1Distance = player1Path.found ? player1Path.distance : Infinity;
        const player2Distance = player2Path.found ? player2Path.distance : Infinity;
        
        // Calculate advantage (-1 to 1, negative means player 1 advantage)
        const totalDistance = player1Distance + player2Distance;
        const advantage = totalDistance > 0 ? 
            (player1Distance - player2Distance) / totalDistance : 0;
        
        // Calculate competitiveness (how close the game is)
        const competitiveness = totalDistance > 0 ? 
            1 - Math.abs(advantage) : 1;
        
        // Calculate efficiency (inverse of path length, normalized)
        const maxDistance = Math.max(player1Distance, player2Distance, 1);
        const player1Efficiency = maxDistance > 0 ? 1 - (player1Distance / maxDistance) : 0;
        const player2Efficiency = maxDistance > 0 ? 1 - (player2Distance / maxDistance) : 0;
        
        return {
            player1Distance,
            player2Distance,
            advantage,
            competitiveness,
            player1Efficiency,
            player2Efficiency
        };
    }

    /**
     * Analyze race conditions between players
     */
    static analyzeRaceCondition(game: Game): RaceAnalysis {
        const comparison = this.comparePlayerPaths(game);
        const gameState = game.getGameState();
        
        const isRace = comparison.player1Distance <= BoardAnalyzer.RACE_DISTANCE_THRESHOLD && comparison.player2Distance <= BoardAnalyzer.RACE_DISTANCE_THRESHOLD;
        
        const turnsToWin = {
            player1: comparison.player1Distance,
            player2: comparison.player2Distance
        };
        
        // Adjust for current turn
        if (gameState.currentTurn === P2) {
            turnsToWin.player2 -= 0.5; // Player 2 moves first
        }
        
        let raceWinner: PlayerID | null = null;
        if (isRace) {
            if (turnsToWin.player1 < turnsToWin.player2) {
                raceWinner = P1;
            } else if (turnsToWin.player2 < turnsToWin.player1) {
                raceWinner = P2;
            }
        }
        
        return {
            isRace,
            turnsToWin,
            raceWinner
        };
    }

    /**
     * Analyze positioning stance (offensive/defensive/balanced)
     */
    static analyzePositioning(game: Game, playerId: PlayerID): PositioningAnalysis {
        const gameState = game.getGameState();
        const evaluation = this.evaluatePosition(game, playerId);
        
        // Calculate aggression based on path difference and wall usage
        const remainingWalls = game.getRemainingWalls();
        const wallsUsed = 10 - (remainingWalls.get(playerId) || 0);
        const wallUsageRate = wallsUsed / 10;
        
        // Aggression is a weighted combination of positional advantage and wall usage:
        // - (evaluation.positionalAdvantage + 1) / 2 normalizes positionalAdvantage from [-1,1] to [0,1].
        // - 60% weight is given to positional advantage, 40% to wall usage rate.
        // - The result is capped at 1.
        const normalizedPositionalAdvantage = (evaluation.positionalAdvantage + 1) / 2;
        const aggression = Math.min(
            BoardAnalyzer.AGGRESSION_MAX,
            normalizedPositionalAdvantage * BoardAnalyzer.AGGRESSION_POSITIONAL_ADVANTAGE_WEIGHT +
            wallUsageRate * BoardAnalyzer.AGGRESSION_WALL_USAGE_WEIGHT
        );
        
        // Determine stance
        const stance = BoardAnalyzer.determineStance(aggression, evaluation.positionalAdvantage);
        
        // Wall efficiency (how well walls are being used)
        const wallEfficiency = wallUsageRate > 0 ? 
            Math.abs(evaluation.positionalAdvantage) : 0;
        
        return {
            stance,
            aggression,
            wallEfficiency
        };
    }

    private static determineStance(aggression: number, positionalAdvantage: number): Stance {
        if (aggression > BoardAnalyzer.OFFENSIVE_AGGRESSION_THRESHOLD && positionalAdvantage > 0) {
            return Stance.Offensive;
        }
        if (aggression < BoardAnalyzer.DEFENSIVE_AGGRESSION_THRESHOLD && positionalAdvantage < 0) {
            return Stance.Defensive;
        }
        return Stance.Balanced;
    }

    /**
     * Evaluate long-term strategic position
     */
    static evaluateLongTermPosition(game: Game, playerId: PlayerID): LongTermEvaluation {
        const evaluation = this.evaluatePosition(game, playerId);
        const gameState = game.getGameState();
        
        // Sustainability (can the player maintain their position)
        const remainingWalls = game.getRemainingWalls();
        const wallsRemaining = remainingWalls.get(playerId) || 0;
        const sustainability = Math.min(
            BoardAnalyzer.SUSTAINABILITY_MAX,
            (wallsRemaining / 10) * BoardAnalyzer.SUSTAINABILITY_WALLS_WEIGHT +
            Math.max(0, 1 - evaluation.urgencyScore) * BoardAnalyzer.SUSTAINABILITY_URGENCY_WEIGHT
        );
        
        // Flexibility (how many options the player has)
        // Flexibility is inversely related to the player's shortest path length to their goal.
        // The formula 1 / (1 + pathLength * 0.1) ensures that as the path length increases,
        // flexibility decreases, but never reaches zero. Multiplying by 0.1 scales the effect,
        // and Math.min(1, ...) caps the maximum flexibility at 1. If the path is blocked (Infinity),
        // flexibility is set to 0.
        const pathLength = evaluation.playerPathLength;
        const flexibility = pathLength < Infinity ? 
            Math.min(1, 1 / (1 + pathLength * 0.1)) : 0;
        
        // Control potential (ability to influence the game)
        const controlPotential = Math.min(
            BoardAnalyzer.CONTROL_POTENTIAL_MAX,
            evaluation.boardControl * BoardAnalyzer.CONTROL_POTENTIAL_BOARD_CONTROL_WEIGHT +
            evaluation.territoryControl * BoardAnalyzer.CONTROL_POTENTIAL_TERRITORY_CONTROL_WEIGHT +
            sustainability * BoardAnalyzer.CONTROL_POTENTIAL_SUSTAINABILITY_WEIGHT
        );
        
        return {
            sustainability,
            flexibility,
            controlPotential
        };
    }

    /**
     * Get goal positions for a player
     */
    private static getPlayerGoals(playerId: PlayerID, boardSize: number): Position[] {
        const goals: Position[] = [];
        const goalRow = playerId === P1 ? boardSize - 1 : 0;
        
        for (let col = 0; col < boardSize; col++) {
            goals.push(Position.create(goalRow, col, boardSize));
        }
        
        return goals;
    }

    /**
     * Calculate positional advantage based on path lengths
     */
    private static calculatePositionalAdvantage(
        pathDifference: number, 
        playerPath: number, 
        opponentPath: number
    ): number {
        if (playerPath === Infinity && opponentPath === Infinity) {
            return 0;
        }
        if (playerPath === Infinity) {
            return -1;
        }
        if (opponentPath === Infinity) {
            return 1;
        }
        
        const totalPath = playerPath + opponentPath;
        // If the total path length is greater than zero, return the normalized negative path difference.
        // This gives a value between -1 and 1 indicating positional advantage:
        //   - A positive value means the player is closer to their goal than the opponent.
        //   - A negative value means the opponent is closer.
        // If both paths are zero, return 0 (no advantage).
        return totalPath > 0 ? -pathDifference / totalPath : 0;
    }

    /**
     * Calculate board control metric
     */
    private static calculateBoardControl(game: Game, playerId: PlayerID): number {
        const remainingWalls = game.getRemainingWalls();
        const wallsUsed = 10 - (remainingWalls.get(playerId) || 0);
        const opponentId = playerId === P1 ? P2 : P1;
        const opponentWallsUsed = 10 - (remainingWalls.get(opponentId) || 0);
        
        // Simple board control based on wall usage and positioning
        const wallControl = wallsUsed - opponentWallsUsed;
        return Math.max(-1, Math.min(1, wallControl / 10));
    }

    /**
     * Calculate territory control
     */
    private static calculateTerritoryControl(game: Game, playerId: PlayerID): number {
        const board = game.getBoard();
        const playerPos = board.getPawnPosition(playerId)!;
        const boardSize = board.getBoardSize();
        
        // Simple territory control based on position
        const progressToGoal = Math.abs(playerPos.row - (playerId === P1 ? 0 : boardSize - 1));
        
        return Math.min(1, progressToGoal / boardSize);
    }

    /**
     * Calculate winning probability
     */
    private static calculateWinningProbability(
        pathDifference: number, 
        playerPath: number, 
        isEndgame: boolean
    ): number {
        if (playerPath === Infinity) {
            return 0;
        }
        if (playerPath <= 1) {
            return 0.95;
        }
        
        let baseProbability = 0.5 + (pathDifference * -0.1);
        
        if (isEndgame) {
            baseProbability += 0.2;
        }
        
        return Math.max(0, Math.min(1, baseProbability));
    }

    /**
     * Calculate urgency score
     */
    /**
     * Calculates the urgency score for the current board state, representing how critical it is
     * for the player to act quickly. The urgency score is a normalized value between 0 and 1,
     * where higher values indicate a more urgent situation (e.g., both players are close to winning).
     *
     * The calculation is based on the minimum path length to the goal for either player, and whether
     * the game is in an endgame state:
     *   - If either player is within 2 moves of winning, urgency is set to 0.9 (very high).
     *   - If either player is within 4 moves, urgency is set to 0.7 (high).
     *   - If the game is flagged as endgame (but not within 4 moves), urgency is set to 0.5 (moderate).
     *   - Otherwise, urgency decreases linearly as the minimum path increases, with a base of 0.3
     *     reduced by 0.02 for each additional move required, but never below 0.
     *
     * @param playerPath - The number of moves required for the player to reach their goal.
     * @param opponentPath - The number of moves required for the opponent to reach their goal.
     * @param isEndgame - Boolean indicating if the game is in an endgame state.
     * @returns A number between 0 and 1 representing the urgency score.
     */
    private static calculateUrgencyScore(
        playerPath: number, 
        opponentPath: number, 
        isEndgame: boolean
    ): number {
        const minPath = Math.min(playerPath, opponentPath);
        let urgency = 0;
        
        if (minPath <= BoardAnalyzer.URGENCY_NEAR_WIN_HIGH_THRESHOLD_MOVES) {
            urgency = BoardAnalyzer.URGENCY_NEAR_WIN_HIGH_VALUE;
        } else if (minPath <= BoardAnalyzer.URGENCY_NEAR_WIN_MEDIUM_THRESHOLD_MOVES) {
            urgency = BoardAnalyzer.URGENCY_NEAR_WIN_MEDIUM_VALUE;
        } else if (isEndgame) {
            urgency = BoardAnalyzer.URGENCY_ENDGAME_VALUE;
        } else {
            urgency = Math.max(BoardAnalyzer.URGENCY_MIN, BoardAnalyzer.URGENCY_LINEAR_BASE - minPath * BoardAnalyzer.URGENCY_LINEAR_DECAY_PER_MOVE);
        }
        
        return Math.min(BoardAnalyzer.URGENCY_MAX, urgency);
    }

    // /**
    //  * Calculate narrowness of a position (chokepoint detection)
    //  */
    // private static calculateNarrowness(board: any, position: Position): number {
    //     // Simplified narrowness calculation
    //     // In a full implementation, this would analyze surrounding walls and passages
    //     return 0.2; // Placeholder
    // }

    // /**
    //  * Calculate strategic value of a chokepoint
    //  */
    // private static calculateChokepointStrategicValue(
    //     game: Game, 
    //     position: Position, 
    //     narrowness: number
    // ): number {
    //     // Simple strategic value based on position centrality and narrowness
    //     const board = game.getBoard();
    //     const boardSize = board.getBoardSize();
    //     const centerDistance = Math.abs(position.row - boardSize/2) + 
    //                           Math.abs(position.col - boardSize/2);
    //     const centrality = Math.max(0, 1 - centerDistance / boardSize);
        
    //     return narrowness * 0.6 + centrality * 0.4;
    // }

    // /**
    //  * Calculate wall placement risk
    //  */
    // private static calculateWallRisk(playerPathImpact: number, newPlayerPath: number): number {
    //     if (playerPathImpact <= 0) {
    //         return 0; // No risk if wall doesn't hurt player
    //     }
        
    //     if (newPlayerPath === Infinity) {
    //         return 1; // Maximum risk if player is blocked
    //     }
        
    //     return Math.min(1, playerPathImpact / 10);
    // }

    // /**
    //  * Calculate winning potential of a wall placement
    //  */
    // private static calculateWinningPotential(
    //     strategicValue: number,
    //     opponentPathAfter: number,
    //     playerPathAfter: number
    // ): number {
    //     if (opponentPathAfter === Infinity) {
    //         return 1; // Maximum potential if opponent is blocked
    //     }
        
    //     const pathAdvantage = opponentPathAfter - playerPathAfter;
    //     return Math.max(0, Math.min(1, 
    //         strategicValue * 0.1 + 
    //         Math.max(0, pathAdvantage) * 0.05
    //     ));
    // }
}