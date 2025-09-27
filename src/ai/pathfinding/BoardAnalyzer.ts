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
    private static readonly WIN_PROBABILITY_BLOCKED = 0;
    private static readonly WIN_PROBABILITY_WITHIN_ONE_MOVE = 0.95;
    private static readonly WIN_PROBABILITY_BASE = 0.5;
    private static readonly WIN_PROBABILITY_PATH_DIFFERENCE_WEIGHT = -0.1;
    private static readonly WIN_PROBABILITY_ENDGAME_BONUS = 0.2;
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

    /**
     * Compare optimal paths for both players
     */
    /**
     * Compares the shortest path distances to the goal for both players and computes
     * several normalized metrics describing their relative positions.
     *
     * - Calculates the shortest path length (in moves) for both Player 1 and Player 2
     *   from their current positions to their respective goal rows, using the current board state.
     * - Computes the "advantage" as a normalized value in [-1, 1], where negative values
     *   indicate Player 1 is closer to their goal, positive values indicate Player 2 is closer,
     *   and 0 means both are equidistant.
     * - Computes "competitiveness" as a value in [0, 1], where 1 means the players are equally close
     *   to their goals (highly competitive), and 0 means one player is much closer than the other.
     * - Computes "efficiency" for each player as a value in [0, 1], where 1 means the player is
     *   at their goal (distance 0), and 0 means the player is as far as possible (relative to the other).
     *
     * @param game The current Game instance (board state, pawn positions, etc.)
     * @returns {PathComparison} An object containing:
     *   - player1Distance: shortest path length for Player 1 (number of moves, or Infinity if blocked)
     *   - player2Distance: shortest path length for Player 2 (number of moves, or Infinity if blocked)
     *   - advantage: normalized difference in path lengths, in [-1, 1]
     *   - competitiveness: how close the game is, in [0, 1]
     *   - player1Efficiency: Player 1's efficiency, in [0, 1]
     *   - player2Efficiency: Player 2's efficiency, in [0, 1]
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
    /**
     * Analyze whether the current board state constitutes a "race condition" between the two players,
     * and determine which player is currently favored to win the race to their goal.
     *
     * A "race" is defined as a situation where both players have a shortest path to their goal
     * that is less than or equal to the RACE_DISTANCE_THRESHOLD (i.e., both are close to winning).
     *
     * This function computes:
     *   - isRace: true if both players are within RACE_DISTANCE_THRESHOLD moves of their goal.
     *   - turnsToWin: the number of turns each player needs to reach their goal, as determined by pathfinding.
     *     - If it is currently Player 2's turn, their turnsToWin is reduced by 0.5 to reflect that they move first in the race.
     *   - raceWinner: the PlayerID of the player who is currently favored to win the race (i.e., has fewer turnsToWin),
     *     or null if the race is tied or not in a race condition.
     *
     * @param game - The current Game instance.
     * @returns {RaceAnalysis} An object containing:
     *   - isRace: boolean indicating if a race condition exists.
     *   - turnsToWin: { player1: number, player2: number } with estimated turns to win for each player.
     *   - raceWinner: PlayerID of the player favored to win the race, or null if tied or not a race.
     */
    static analyzeRaceCondition(game: Game): RaceAnalysis {
        const comparison = this.comparePlayerPaths(game);
        const gameState = game.getGameState();
        
        // A race exists if both players are within the race distance threshold
        const isRace = comparison.player1Distance <= BoardAnalyzer.RACE_DISTANCE_THRESHOLD && comparison.player2Distance <= BoardAnalyzer.RACE_DISTANCE_THRESHOLD;
        
        // Compute the number of turns to win for each player
        const turnsToWin = {
            player1: comparison.player1Distance,
            player2: comparison.player2Distance
        };
        
        // If it's Player 2's turn, they move first in the race, so subtract 0.5 from their turnsToWin
        if (gameState.currentTurn === P2) {
            turnsToWin.player2 -= 0.5;
        }
        
        // Determine the race winner (the player with fewer turns to win), or null if tied or not a race
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
    /**
     * Analyzes the current positioning stance of a player, quantifying their aggression,
     * wall usage efficiency, and overall stance (offensive, defensive, or balanced).
     *
     * This function combines the player's positional advantage (relative path to goal)
     * and their wall usage to produce a normalized aggression score and a qualitative stance.
     * It also estimates how efficiently the player is using their walls to gain advantage.
     *
     * Aggression is computed as a weighted sum:
     *   - 60% weight: normalized positional advantage (from -1..1 mapped to 0..1)
     *   - 40% weight: wall usage rate (fraction of walls used, 0..1)
     *   - The result is capped at 1.
     *
     * Stance is determined by aggression and positional advantage:
     *   - Offensive: high aggression and positive advantage
     *   - Defensive: low aggression and negative advantage
     *   - Balanced: otherwise
     *
     * Wall efficiency is the absolute value of positional advantage if any walls have been used,
     * otherwise 0.
     *
     * @param game - The current Game instance.
     * @param playerId - The PlayerID of the player to analyze.
     * @returns {PositioningAnalysis} An object containing:
     *   - stance: 'Offensive' | 'Defensive' | 'Balanced'
     *   - aggression: number (0..1), higher means more aggressive
     *   - wallEfficiency: number (0..1), higher means walls are being used to gain advantage
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
    /**
     * Calculates the positional advantage for a player based on the difference in shortest path lengths
     * to the goal between the player and their opponent.
     *
     * The result is a normalized value in the range [-1, 1]:
     *   -  1   : The player has a guaranteed win (opponent cannot reach the goal, i.e., opponentPath === Infinity).
     *   -  0   : No advantage (both players are equally far from their goals, or both are blocked).
     *   - -1   : The opponent has a guaranteed win (player cannot reach the goal, i.e., playerPath === Infinity).
     *   - (−1, 1): Intermediate values indicate the degree of advantage, with positive values favoring the player
     *              and negative values favoring the opponent. The value is proportional to the negative of the
     *              path difference divided by the total path length.
     *
     * @param pathDifference The difference in path lengths: (playerPath - opponentPath).
     * @param playerPath The shortest path length from the player's current position to their goal (number of moves, or Infinity if blocked).
     * @param opponentPath The shortest path length from the opponent's current position to their goal (number of moves, or Infinity if blocked).
     * @returns A number in [-1, 1] representing the player's positional advantage.
     *          Positive values mean the player is closer to their goal; negative values mean the opponent is closer.
     *          Returns 0 if both players are equally far or both are blocked.
     */
    private static calculatePositionalAdvantage(
        pathDifference: number, 
        playerPath: number, 
        opponentPath: number
    ): number {
        if (playerPath === Infinity && opponentPath === Infinity) {
            // Both players are blocked; no advantage.
            return 0;
        }
        if (playerPath === Infinity) {
            // Player is blocked, opponent is not; maximum disadvantage.
            return -1;
        }
        if (opponentPath === Infinity) {
            // Opponent is blocked, player is not; maximum advantage.
            return 1;
        }
        
        const totalPath = playerPath + opponentPath;
        // If both path lengths are zero, treat as no advantage.
        // Otherwise, normalize the negative path difference by the total path length.
        // This ensures the value is in [-1, 1] and positive means player is closer.
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
    /**
     * Estimates the probability that the player will win from the current board state.
     *
     * The probability is computed heuristically based on:
     *   - The difference in shortest path lengths to the goal between the player and the opponent.
     *   - The player's own shortest path length to the goal.
     *   - Whether the game is in an endgame state.
     *
     * Calculation details:
     *   - If the player's path to the goal is blocked (Infinity), returns 0 (no chance to win).
     *   - If the player is within 1 move of winning, returns 0.95 (almost certain win).
     *   - Otherwise, starts from a base probability of 0.5 (even odds), then:
     *       - Adjusts by -0.1 times the pathDifference (so being closer increases probability).
     *       - If isEndgame is true, adds 0.2 to the probability (endgame advantage).
     *   - The result is clamped to the [0, 1] range.
     *
     * @param pathDifference - The difference in shortest path lengths (playerPath - opponentPath).
     *   Negative values mean the player is closer to their goal.
     * @param playerPath - The player's shortest path length to their goal (number of moves, or Infinity if blocked).
     * @param isEndgame - True if the game is in an endgame state.
     * @returns A number between 0 and 1 representing the estimated probability of the player winning.
     */
    private static calculateWinningProbability(
        pathDifference: number, 
        playerPath: number, 
        isEndgame: boolean
    ): number {
        if (playerPath === Infinity) {
            return BoardAnalyzer.WIN_PROBABILITY_BLOCKED;
        }
        if (playerPath <= 1) {
            return BoardAnalyzer.WIN_PROBABILITY_WITHIN_ONE_MOVE;
        }
        
        let baseProbability = BoardAnalyzer.WIN_PROBABILITY_BASE + (pathDifference * BoardAnalyzer.WIN_PROBABILITY_PATH_DIFFERENCE_WEIGHT);
        
        if (isEndgame) {
            baseProbability += BoardAnalyzer.WIN_PROBABILITY_ENDGAME_BONUS;
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

}